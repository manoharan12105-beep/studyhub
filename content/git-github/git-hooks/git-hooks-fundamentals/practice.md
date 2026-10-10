# Git Hooks: Client-Side, Server-Side and Their Limits — Practice

### P1. Which hook?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** hook events

You want to reject commits whose message subject is longer than 72 characters. Which hook?

- A) `pre-commit`
- B) `commit-msg`
- C) `post-commit`
- D) `pre-push`

<details>
<summary>Answer</summary>

**Answer:** B) `commit-msg`

It receives the message file after it's written.

</details>

### P2. Hook not running

**Difficulty:** Easy · **Type:** Troubleshooting · **Concepts:** activation

You saved a script as `.git/hooks/pre-commit.sh`, but it never runs. Give two likely causes.

<details>
<summary>Answer</summary>

The name must be exactly `pre-commit` (no extension), and the file must be executable (`chmod +x .git/hooks/pre-commit`). Also check whether `core.hooksPath` points Git at another folder.

</details>

### P3. Share them

**Difficulty:** Medium · **Type:** Command · **Concepts:** core.hooksPath

Your repository has hooks in `.githooks/`. What must each developer run after cloning to activate them?

<details>
<summary>Answer</summary>

`git config core.hooksPath .githooks` (and the hooks must be committed as executable).

</details>

### P4. Enforce for real

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** limits of hooks

Your team's `pre-push` hook runs the tests, yet broken code still reaches `main`. Explain how, and what would actually enforce passing tests.

<details>
<summary>Answer</summary>

Someone pushed with `--no-verify`, from a clone without `core.hooksPath`, or merged through the GitHub UI (which never runs local hooks). Enforce with a CI workflow that runs the tests on every pull request and a branch protection rule requiring that status check before merging.

</details>
