# Test Pipelines, Failure Reporting and Approval Gates — Practice

### P1. The gate

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** deterministic gates

Why should the merge gate be the build/test job and not an AI review?

- A) AI reviews are slower
- B) The build gives the same result for the same input; model output can vary and be influenced
- C) GitHub doesn't allow AI checks
- D) Tests never fail

<details>
<summary>Answer</summary>

**Answer:** B) The build gives the same result for the same input; model output can vary and be influenced

</details>

### P2. When does it run?

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** if: failure()

The "Explain the failure" step has `if: failure() && …`. The build passes. What happens to the step?

<details>
<summary>Answer</summary>

It's skipped. `failure()` is true only when an earlier step in the job failed.

</details>

### P3. Keep it red

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** gate integrity

The AI step concludes "the failing test is flaky; the build is fine". What is the job's status, and what should happen next?

<details>
<summary>Answer</summary>

Still failed — the `./mvnw -B verify` step failed and the AI step can't change that. Next, a developer reproduces the failure locally. If it's genuinely flaky, fix the flakiness through a reviewed PR; never mark the failure as passing.

</details>

### P4. Add an approval gate

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** environments

What YAML line attaches a deploy job to an approval gate, and where are the approvers configured?

<details>
<summary>Answer</summary>

`environment: staging` (or `production`) on the job. Required reviewers, wait timers and branch restrictions are configured on that environment in the repository settings; the job waits for approval and only then receives the environment's secrets.

</details>

### P5. Over-powered helper

**Difficulty:** Medium · **Type:** Security · **Concepts:** least privilege

A teammate changes the failure step to `--allowedTools "Read" "Edit" "Bash"` and the prompt to "fix the failing tests and push". List the problems.

<details>
<summary>Answer</summary>

CI would modify code and push without review; Bash on a runner with secrets widens the blast radius; "fix the failing tests" invites weakening tests; it mixes the explanation step with an unreviewed change path. Keep the step read-only; fixes go through a PR and review.

</details>

### P6. Compile error

**Difficulty:** Hard · **Type:** Failure diagnosis · **Concepts:** report inputs

The build fails with a compilation error, and the AI step says it found no failing tests. Why?

<details>
<summary>Answer</summary>

Compilation failed before tests ran, so `target/surefire-reports/` has no reports. The prompt only pointed at test reports. Capture the Maven output to a file (for example `./mvnw -B verify 2>&1 | tee build.log`, with `set -o pipefail` so the step still fails) and let the AI step read that too.

</details>

### P7. Beginner deploy

**Difficulty:** Hard · **Type:** Trade-off · **Concepts:** autonomous deploys

A learner wants "Claude fixes failing builds and deploys to production overnight". Explain why not, and describe an acceptable version.

<details>
<summary>Answer</summary>

Unattended fixes plus deploys combine unreviewed code changes, production credentials and possibly untrusted input — one wrong step reaches users with no one to stop it. Acceptable: overnight AI failure explanations and proposed fixes as draft PRs; humans review and merge; deployment through an environment with required reviewers, during working hours, with a rollback plan.

</details>
