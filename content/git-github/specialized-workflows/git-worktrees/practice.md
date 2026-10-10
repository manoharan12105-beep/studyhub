# Git Worktrees — Practice

### P1. Create a worktree

**Difficulty:** Easy · **Type:** Command · **Concepts:** worktree add

Create a worktree at `../gradebook-fix` on a new branch `fix/rounding` starting from `main`.

<details>
<summary>Answer</summary>

`git worktree add -b fix/rounding ../gradebook-fix main`

</details>

### P2. The refusal

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** one branch per worktree

You're on `main` in `~/git-lab/gradebook` and run `git worktree add ../other main`. What happens?

<details>
<summary>Answer</summary>

Git refuses: `fatal: 'main' is already used by worktree at '/home/student/git-lab/gradebook'`. Use `--detach` or another branch.

</details>

### P3. Clean up

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** prune

You deleted `../gradebook-fix` with your file manager. `git worktree list` shows it as `prunable`. What do you run, and does the branch `fix/rounding` disappear?

<details>
<summary>Answer</summary>

`git worktree prune` removes the stale record. The branch `fix/rounding` remains; delete it with `git branch -d fix/rounding` if it's no longer needed.

</details>

### P4. Choose the approach

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** worktree vs stash

You have a large uncommitted refactor and must test a teammate's branch for 30 minutes, including a full Maven build. Which is least disruptive?

- A) `git stash`, switch, test, switch back, `git stash pop`
- B) `git worktree add --detach ../review origin/<branch>`
- C) Commit the half-finished refactor to `main`
- D) Delete your changes and re-do them later

<details>
<summary>Answer</summary>

**Answer:** B) `git worktree add --detach ../review origin/<branch>`

Your refactor and its build output stay untouched.

</details>
