# Lab 14: Add an AI-Assisted Step to a CI Workflow

**Lab:** 14 · **Module:** Automation and CI/CD · **Difficulty:** Advanced · **Verification:** Partially tested — both workflows validate against the GitHub Actions workflow schema, and the local alternative `scripts/ai-review.sh` was run against a stub `claude` (four cases) and the real, signed-out CLI; no workflow ran on GitHub and no API key was used.

## Objective

Keep the Maven build as the **required gate**, add an **advisory** Claude review job with least-privilege permissions, turn and time limits and a secret — and build a **local** alternative for when you don't have GitHub Actions or an API key.

## Prerequisites

- Lab 08; the lessons *GitHub Actions Integration and Secrets in Automation* and *Test Pipelines, Failure Reporting and Approval Gates*.
- For the GitHub part: a **private practice repository**, permission to add secrets, and an Anthropic API key or Claude OAuth token. Running the review costs API usage or subscription usage.

## Scenario

The team wants AI review comments on every pull request — without letting AI decide merges, push code, or spend without limits.

## Starting State

```bash
git switch main
git switch -c lab14-ci
mkdir -p .github/workflows scripts
```

## Instructions

### Step 1: The deterministic gate

`.github/workflows/ci.yml`:

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
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-java@v6
        with:
          distribution: temurin
          java-version: "21"
          cache: maven
      - name: Build and test
        run: ./mvnw -B verify
```

### Step 2: The advisory review job

`.github/workflows/claude-review.yml`:

```yaml
name: Claude review

on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]

permissions:
  contents: read

concurrency:
  group: claude-review-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  review:
    # Same-repository, non-draft pull requests only: GitHub withholds secrets from fork PRs.
    if: >-
      github.event.pull_request.draft == false &&
      github.event.pull_request.head.repo.full_name == github.repository
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions:
      contents: read
      pull-requests: read
      issues: read
      id-token: write
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 1
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          plugin_marketplaces: "https://github.com/anthropics/claude-code.git"
          plugins: "code-review@claude-code-plugins"
          prompt: "/code-review:code-review --comment ${{ github.repository }}/pull/${{ github.event.pull_request.number }}"
          claude_args: '--max-turns 15 --allowedTools "mcp__github_inline_comment__create_inline_comment"'
```

| Control | Where |
|---------|-------|
| Gate stays deterministic | `ci.yml` is the required check; the review job isn't |
| Least privilege | `contents: read`; the only allowed tool posts inline comments |
| Limits | `--max-turns 15`, `timeout-minutes: 15`, one run per PR (`concurrency`) |
| Secrets | `${{ secrets.ANTHROPIC_API_KEY }}` — never the value |
| Untrusted forks | Skipped (no secrets for fork PRs) |

### Step 3: Validate the YAML

Use `actionlint`, your editor's GitHub Actions extension, or a JSON Schema validator with the schemastore workflow schema. With the schema and Ajv:

**Output:**

```text
valid   .github/workflows/ci.yml
valid   .github/workflows/claude-review.yml
```

Validation proves structure only — not that the secret exists or the review is useful.

### Step 4: Run it on GitHub (practice repository)

1. Push the branch to the private practice repository.
2. Install the Claude GitHub App (or run `/install-github-app` in Claude Code) and add the `ANTHROPIC_API_KEY` repository secret.
3. In repository settings, make **CI / build** a required status check for `main`, and require one approving review.
4. Open a pull request with a small change (for example the FEAT-7 branch).

**Expected result:** `CI` runs and must pass to merge; `Claude review` runs separately and posts inline comments (or one summary comment if it finds nothing). Neither job can merge, push or approve.

### Step 5: The local alternative (no GitHub, no API key needed to test it)

`scripts/ai-review.sh` — quoted in full in *Local vs CI Automation and Non-Interactive Usage* — pipes `git diff base...HEAD` into `claude -p` with `--permission-mode dontAsk`, `--max-turns 3` and `--max-budget-usd 0.50`, and checks both the exit code and `is_error`.

Run it on a branch with changes:

```bash
chmod +x scripts/ai-review.sh
scripts/ai-review.sh main
```

With the CLI **signed out**, the real run printed:

**Output:**

```text
AI review did not complete (exit 1): Not logged in · Please run /login
```

With a stub `claude` that returned `"is_error": true` but exit code 0, the script also exited 1; with a successful stub result it printed the findings and exited 0; with no changes it printed `No changes against <base>.` and exited 0. Signed in, it prints Claude's findings.

## Verification

- ☐ Both workflow files validate.
- ☐ (GitHub) CI is the required check; the review job comments but can't block, push or merge.
- ☐ The local script fails visibly when the run fails and succeeds only with a real result.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Review job doesn't run | Draft PR, fork PR, or workflow disabled | Expected for drafts/forks; enable workflows |
| No comments posted | `--allowedTools` doesn't name the inline-comment tool | Keep the `claude_args` line as shown |
| Authentication errors | Secret missing or invalid | Test the key locally first; re-add the secret |
| Script says "did not complete" | Not signed in, budget or turn limit reached | Sign in; check limits |

## Security Notes

- Never commit or paste API keys; store them as secrets. Delete the practice secret when done.
- Don't switch to `pull_request_target` to review forks with secrets.
- The review job's comments are visible to everyone with repository access.

## Cleanup

Remove the `ANTHROPIC_API_KEY` secret and the GitHub App installation from the practice repository if you no longer need them. Locally: `git switch main && git branch -D lab14-ci`.

## Completion Checklist

- ☐ Deterministic gate + advisory AI step, clearly separated.
- ☐ Least privilege, limits and secret handling in place.
- ☐ Local alternative tested on failure paths.

## Follow-up Challenges

- Add the "Explain the failure" step from *Test Pipelines, Failure Reporting and Approval Gates* to `ci.yml` and break a test on purpose in the practice repository.
- Add `--bare` to the local script and set `ANTHROPIC_API_KEY`; compare startup time.
