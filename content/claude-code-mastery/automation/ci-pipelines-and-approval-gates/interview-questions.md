# Test Pipelines, Failure Reporting and Approval Gates — Interview Questions

## Beginner

### Q1. Where does AI fit in a CI pipeline?

**Style:** What

<details>
<summary>Answer</summary>

As an advisory step: explaining failures, reviewing PRs, drafting changes for humans. The deterministic build and tests stay the merge gate, and humans approve merges and deployments.

</details>

## Intermediate

### Q2. How would you add AI failure explanations to CI safely?

**Style:** How

<details>
<summary>Answer</summary>

A step with `if: failure()` after the build, read-only tools (Read, Glob, Grep), a turn cap and job timeout, secrets only for same-repo runs, output in the log or a summary, and no ability to edit, push or change the job result.

</details>

### Q3. What is a GitHub environment approval gate?

**Style:** What

<details>
<summary>Answer</summary>

A job with `environment: <name>` waits for the environment's protection rules — required reviewers, wait timers, branch restrictions — before running, and only then receives the environment's secrets. Rules are configured in repository settings.

</details>

## Advanced

### Q4. Why shouldn't an AI agent deploy to production autonomously?

**Style:** Security

<details>
<summary>Answer</summary>

It would combine model judgment, production credentials and possibly attacker-influenced input with no human checkpoint; failures reach users immediately. Accountability and rollback decisions belong to people. Use agents to explain and propose; gate deploys with environments, required reviewers and deterministic checks.

</details>

### Q5. Design a pipeline for a Spring Boot service that uses AI responsibly.

**Style:** Design

<details>
<summary>Answer</summary>

PR: required `./mvnw -B verify` (and static analysis); advisory AI review with comment-only tools; AI failure explanation on red builds. Merge: branch protection with human approval. Deploy: staging via an environment with reviewers, smoke tests, then production with a separate approval and rollback plan. All AI steps bounded by tools, turns, time and secrets scope; accuracy reviewed periodically.

</details>
