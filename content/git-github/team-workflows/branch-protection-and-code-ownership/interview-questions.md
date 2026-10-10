# Branch Protection and Code Ownership — Interview Questions

## Beginner

### Q1. What is branch protection?

**Style:** What

<details>
<summary>Answer</summary>

Server-side rules on a branch (or pattern) that control how it can change — for example requiring pull requests, approvals and passing status checks, and blocking force pushes and deletion. They apply to everyone, unlike local habits or hooks.

</details>

## Intermediate

### Q2. What is a CODEOWNERS file?

**Style:** What

<details>
<summary>Answer</summary>

A file (usually `.github/CODEOWNERS`) mapping path patterns to users or teams. Owners are automatically requested as reviewers on PRs touching their paths, and with "require review from code owners" their approval is needed to merge. The last matching pattern wins.

</details>

### Q3. Which protections would you set on `main` for a team project?

**Style:** Scenario

<details>
<summary>Answer</summary>

Require PRs; at least one approval with stale approvals dismissed; code-owner review for sensitive paths; required CI status checks; conversation resolution; block force pushes and deletion; no bypass for admins. Optionally linear history or a merge queue.

</details>

## Advanced

### Q4. Why aren't client-side Git hooks enough to protect `main`?

**Style:** Why

<details>
<summary>Answer</summary>

Hooks live in each clone, aren't installed automatically, and can be skipped with `--no-verify` or by pushing from another machine. Only the server sees every push and merge, so enforcement belongs in branch protection, rulesets, required checks and push protection; hooks are for fast local feedback.

</details>
