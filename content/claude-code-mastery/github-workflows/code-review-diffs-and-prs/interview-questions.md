# Code Review, Reviewing Diffs and Pull Request Preparation — Interview Questions

## Beginner

### Q1. How do you review a diff produced by an AI agent?

**Style:** How

<details>
<summary>Answer</summary>

Check the diff's shape against the plan (`git diff --stat`), read tests first, then every production hunk for intent, scope, edge cases, transactions and status codes, security issues and leftovers. Verify claims by running the build myself or checking the real output.

</details>

## Intermediate

### Q2. What's the difference between /code-review, /security-review and /simplify?

**Style:** Comparison

<details>
<summary>Answer</summary>

`/code-review` looks for correctness bugs in your branch's changes (or a given target) and can fix or post findings. `/security-review` checks the diff against origin's default branch for security vulnerabilities. `/simplify` runs four cleanup agents and applies fixes but doesn't look for bugs.

</details>

### Q3. What makes a good pull request description?

**Style:** What

<details>
<summary>Answer</summary>

Intent (what and why), approach in a sentence or two, verification with real output and test names, what wasn't verified or is assumed, and where the reviewer should focus. One purpose per PR.

</details>

## Advanced

### Q4. Should an AI review be a required check?

**Style:** Trade-off

<details>
<summary>Answer</summary>

As a blocking gate, usually not: findings are probabilistic, can be wrong or missing, and can be influenced by PR content. Use it as an advisory signal that humans read, keep deterministic checks (build, tests, static analysis) as the required gates, and require human approval. Track how often its findings are validated to judge its value.

</details>

### Q5. A reviewer bot approved a PR that later caused an incident. What process changes do you make?

**Style:** Scenario

<details>
<summary>Answer</summary>

Make sure no AI tool can approve or merge; require human approval and passing CI; add a regression test for the incident; review why tests didn't catch it (missing case, weak assertion); tune the review prompt or REVIEW.md for that class of issue; and keep measuring AI findings rather than trusting "no findings".

</details>
