# Test Pipelines, Failure Reporting and Approval Gates

**Module:** Automation and CI/CD · **Interview priority:** Core

> [!NOTE]
> **Status:** Partially tested. The workflows validate against the GitHub Actions workflow schema but were **not run on GitHub**. The test report shown was produced by a real local Maven run of orderdesk; no AI failure report was generated. Checked against *Claude Code GitHub Actions* (October 2026).

## Definition

A **test pipeline** builds the code and runs the tests on every change; its pass/fail result is the **gate** for merging. **AI-assisted failure reporting** adds an explanation when that gate fails, without changing the result. An **approval gate** stops a job — typically a deployment — until a named person approves it. Together they let automation help without letting it decide.

## Why It Matters

- Deterministic checks give the same answer every time; model output doesn't. Only deterministic checks should decide whether code merges.
- When a build fails, reading 400 lines of logs is slow. A short, cited explanation saves time — if it's treated as a hint.
- Deployments affect users. A human approval in front of production is cheap insurance against both human and AI mistakes.

## How It Works

```text
push / PR
   │
   ▼
build + tests (./mvnw -B verify) ── pass ──► required check ✔ ──► human review ──► merge
   │
   fail ──► required check ✘ (merge blocked)
   │
   └──► AI explains the failure in the log (advisory; can't change the result)

merge to main ──► deploy job ──► environment "staging" with required reviewers ──► waits for a person
```

## Keeping the Deterministic Build as the Gate

| Rule | Why |
|------|-----|
| The required status check is the build/test job | Same input → same result |
| AI steps never set the job's success | A model can't "decide" a failing build passes |
| AI steps run **after** the gate, with `if: failure()` or in a separate non-required job | They explain; they don't block or unblock |
| No AI step edits files or pushes in CI | Fixes go through a normal PR and review |

## AI-Assisted Failure Reports

A failure-report step added to orderdesk's CI (`ci-with-failure-report.yml`):

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-java@v6
        with:
          distribution: temurin
          java-version: "21"
          cache: maven
      - name: Build and test
        run: ./mvnw -B verify

      # Runs only when the build failed, and only for same-repository changes (secrets).
      # The build result above stays the gate; this step only explains the failure in the log.
      - name: Explain the failure
        if: >-
          failure() &&
          (github.event_name == 'push' || github.event.pull_request.head.repo.full_name == github.repository)
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            The Maven build failed. Read the test reports in target/surefire-reports/.
            For each failing test give: test name, assertion or exception, the most likely
            cause with file:line, and how confident you are. Do not edit any file.
          claude_args: >-
            --max-turns 6
            --allowedTools "Read" "Glob" "Grep"
```

The step has read-only tools, a turn cap, and the job keeps its **failed** status whatever the step prints. What Claude reads is Surefire's report — here, from a real local run of the rounding regression (`target/surefire-reports/com.example.orderdesk.order.PriceCalculatorTest.txt`, first lines):

**Output:**

```text
-------------------------------------------------------------------------------
Test set: com.example.orderdesk.order.PriceCalculatorTest
-------------------------------------------------------------------------------
Tests run: 6, Failures: 1, Errors: 0, Skipped: 0, Time elapsed: 0.129 s <<< FAILURE! -- in com.example.orderdesk.order.PriceCalculatorTest
com.example.orderdesk.order.PriceCalculatorTest.discountIsRoundedDownToWholeCents -- Time elapsed: 0.070 s <<< FAILURE!
org.opentest4j.AssertionFailedError: expected: <900> but was: <899>
```

**Expected behaviour:** a short explanation naming `discountIsRoundedDownToWholeCents`, the 900/899 assertion and the discount calculation in `PriceCalculator`, marked as a likely cause. A developer still reproduces it locally before changing code.

## Approval Gates and Environments

```yaml
name: Deploy to staging

on:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    # The "staging" environment is configured in the repository settings with
    # required reviewers: the job waits until a person approves it.
    environment: staging
    steps:
      - uses: actions/checkout@v7
      - name: Deploy
        run: ./scripts/deploy-staging.sh
```

`environment: staging` connects the job to a GitHub **environment**. Required reviewers, wait timers and branch restrictions are configured on the environment in the repository settings, not in the YAML — the job pauses until an approver accepts it. Environment secrets (deploy credentials) are released only after approval. orderdesk has no deploy script: the file shows the gate, not a real deployment.

## Why Beginners Never Automate Production Deploys

| Risk | What happens |
|------|--------------|
| An agent misreads a failure as flaky and retries a deploy | Bad build reaches users |
| Prompt injection via PR or issue text | Attacker-influenced actions with deploy credentials |
| Over-broad tools in a deploy job | Commands nobody reviewed run with production access |
| No rollback plan | A wrong change can't be undone quickly |

The safe pattern for learners: AI may **explain** failures and **propose** changes as PRs; humans approve merges; a human approves each deployment through an environment gate; production credentials never reach an AI step.

## Syntax and Configuration

| Building block | Purpose |
|----------------|---------|
| `if: failure()` | Run a step only when an earlier step failed |
| Required status checks (branch protection) | Block merging until named jobs pass |
| `environment: <name>` | Attach approval rules and environment secrets to a job |
| `timeout-minutes`, `concurrency` | Bound time and parallel runs |
| `--max-turns`, read-only `--allowedTools` | Bound and restrict the AI step |

## Real-World Example

In the rounding regression, the build job fails and blocks the PR. The AI step's explanation points at `PriceCalculator`, which saves the developer from reading the stack trace cold — but if the explanation had blamed the test ("expectation outdated"), the gate still holds: nothing merges until the code is fixed and the build is green. The AI step improves speed; the deterministic gate guarantees the outcome.

## Step-by-Step Walkthrough

1. Make `./mvnw -B verify` the required check on `main`.
2. Add an AI failure-explanation step with `if: failure()`, read-only tools and a turn cap.
3. Keep it out of the required checks.
4. Configure an environment with required reviewers for any deployment.
5. Keep production credentials in environment secrets, never in AI steps.
6. Review the AI explanations' accuracy and adjust or remove the step.

## Common Mistakes

- Letting an AI step mark a failing build as passed or "retry until green".
- Making the AI explanation a required check.
- Deploy jobs without an environment gate.
- Giving the explanation step write tools "so it can fix it".
- Treating the explanation as a diagnosis without reproducing.

## Security Considerations

- Fork PRs: no secrets; the condition in the example skips the AI step for them.
- Test output can contain data from fixtures; keep real customer data out of tests.
- Environment secrets for deploys are released only after approval — don't copy them into repository-level secrets.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| AI step never runs | Build succeeded, or fork PR condition | Expected |
| AI step can't find reports | Build failed before tests (compile error) | Also let it read the Maven log, or explain from the job output |
| Deploy job runs without approval | Environment has no required reviewers | Configure the environment in settings |
| Merge allowed despite failure | Build job not a required check | Add it to branch protection |

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| AI failure explanations | Faster diagnosis | Tokens per failure; can be wrong |
| Required reviewers on environments | Human control over releases | Slower releases |
| Separate non-required AI job | Clear separation from the gate | More workflow configuration |

## Interview Takeaways

- Deterministic build/test is the gate; AI is advisory.
- `if: failure()` + read-only tools for AI failure reports.
- Environments with required reviewers gate deployments; no autonomous production deploys.

## Key Takeaways

- Gates must be deterministic.
- AI explains and proposes; people approve and deploy.
- Bound every AI step: tools, turns, time, secrets.
