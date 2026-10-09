# Regression Analysis and the Issue-to-PR Workflow — Interview Questions

## Beginner

### Q1. What is git bisect and when do you use it?

**Style:** What

<details>
<summary>Answer</summary>

A binary search through history between a known-good and a known-bad commit to find the first bad one. Use it for regressions when the failure is reproducible with a command; `git bisect run <cmd>` automates it, needing about log₂(n) checks.

</details>

## Intermediate

### Q2. How do you keep an AI agent honest when fixing a failing test?

**Style:** How

<details>
<summary>Answer</summary>

Give it the exact failure, forbid changing the test's expected value unless the specification changed, require it to find the cause (introducing commit or traced code) with evidence, and check the diff for test edits. Verify with the full build output yourself.

</details>

### Q3. How can Claude Code interact with GitHub?

**Style:** What

<details>
<summary>Answer</summary>

Through the `gh` CLI (issues, PRs, comments; most context-efficient), a GitHub MCP server (tools and resources, token-scoped), the Claude Code GitHub Action (runs in Actions on `@claude` mentions or prompts), and the managed Code Review service for PR comments. All of them should treat issue and PR text as untrusted.

</details>

## Advanced

### Q4. Walk through issue to PR for a production regression.

**Style:** Scenario

<details>
<summary>Answer</summary>

Capture the exact symptom; reproduce with a failing test; find the last good version; bisect or trace to the introducing change; fix the cause on a branch with the regression test; run the full build; review the diff; write a PR linking issue and introducing commit with evidence and gaps; push and request review deliberately; consider a hotfix process and follow-up for the missing test that let it through.

</details>

### Q5. What are the risks of letting an agent read issues and open PRs automatically?

**Style:** Security

<details>
<summary>Answer</summary>

Issue text can carry prompt injection; a token with write access can push or leak data; automated PRs can flood reviewers or hide malicious changes in large diffs. Mitigate with least-privilege tokens, read-only investigation, human approval before pushing, draft PRs, branch protection, required reviews and CI.

</details>
