# Git Hooks: Client-Side, Server-Side and Their Limits — Interview Questions

## Beginner

### Q1. What are Git hooks?

**Style:** What

<details>
<summary>Answer</summary>

Executable scripts Git runs automatically at specific events — before a commit, after writing the message, before a push, or on the server when receiving a push. Some (pre-commit, commit-msg, pre-push, pre-receive) can abort the operation by exiting non-zero.

</details>

### Q2. What is the difference between client-side and server-side hooks?

**Style:** Comparison

<details>
<summary>Answer</summary>

Client-side hooks (pre-commit, commit-msg, pre-push…) run in a developer's clone and affect only that developer. Server-side hooks (pre-receive, update, post-receive) run on the server that receives pushes and can reject them for everyone. GitHub provides server-side enforcement through protection rules and checks rather than custom server hooks.

</details>

## Intermediate

### Q3. How do you share hooks with your team?

**Style:** How

<details>
<summary>Answer</summary>

Commit them in a directory like `.githooks/`, make them executable, and have each developer run `git config core.hooksPath .githooks` (documented in the README or automated by a setup script or hook manager). `.git/hooks` itself isn't versioned or cloned.

</details>

## Advanced

### Q4. Why can't local hooks enforce code quality or security?

**Style:** Trap

<details>
<summary>Answer</summary>

They're opt-in per clone, not cloned automatically, can be skipped with `--no-verify`, and can be edited or deleted by the developer. They're useful for fast feedback, but rules that must always hold need server-side enforcement: branch protection, required CI checks, push protection for secrets.

</details>
