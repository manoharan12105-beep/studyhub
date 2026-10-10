# Coordinating a Team: Shared Files, Accidental Pushes and Safe Reviews — Interview Questions

## Beginner

### Q1. How do you avoid merge conflicts when working in a team?

**Style:** How

<details>
<summary>Answer</summary>

Keep branches short-lived and small, update them from `main` often, separate formatting and refactoring from feature changes, use an agreed automatic formatter, coordinate before touching hot-spot files or doing large refactors, and split classes that everyone has to edit.

</details>

## Intermediate

### Q2. You pushed a commit to `main` that breaks the build. Teammates have already pulled. What do you do?

**Style:** Scenario

<details>
<summary>Answer</summary>

Tell the team, then `git revert <commit>` on an up-to-date `main` with an explanatory message, run the build and push (or open a PR as the rules require). Fix the change properly on a branch. Never reset and force-push `main`. Afterwards, add or tighten branch protection and required checks.

</details>

### Q3. How do you test a teammate's branch without disturbing your uncommitted work?

**Style:** How

<details>
<summary>Answer</summary>

`git fetch`, then either read it (`git diff main...origin/<branch>`) or create a separate working directory with `git worktree add ../review origin/<branch>`, build and test there, and remove the worktree afterwards. Your own branch and uncommitted changes stay untouched.

</details>

## Advanced

### Q4. Your team must rename the base package of a large Spring Boot project. How do you coordinate it?

**Style:** Scenario

<details>
<summary>Answer</summary>

Announce it in advance; ask people to merge or pause open PRs; do the rename as a single mechanical commit (IDE refactoring, no behaviour changes) in its own PR; get it reviewed and merged quickly at an agreed time; then everyone updates their branches immediately (Git's rename detection helps when content is unchanged). Add the commit to a blame-ignore file if it also reformats.

</details>
