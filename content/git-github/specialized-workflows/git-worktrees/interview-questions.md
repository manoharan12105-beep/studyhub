# Git Worktrees — Interview Questions

## Beginner

### Q1. What is a Git worktree?

**Style:** What

<details>
<summary>Answer</summary>

An additional working directory attached to the same repository, with its own checked-out branch, index and files, sharing the object database, refs and configuration with the main working directory.

</details>

## Intermediate

### Q2. How would you fix an urgent bug without disturbing your half-finished feature work?

**Style:** Scenario

<details>
<summary>Answer</summary>

`git worktree add -b hotfix/x ../app-hotfix <release-tag>`, fix and commit there, push, then `git worktree remove ../app-hotfix`. The feature directory and its uncommitted changes stay untouched — no stash, no rebuild. (Stashing works too, but is more disruptive.)

</details>

### Q3. Why can't the same branch be checked out in two worktrees?

**Style:** Why

<details>
<summary>Answer</summary>

Both working directories would move the same branch ref when committing, and each would have a stale view of the other's changes, leading to confusing, lost or conflicting updates. Git prevents it; use `--detach` if you only need to look at the same commit.

</details>

## Advanced

### Q4. Worktree vs second clone — trade-offs?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Worktrees share objects and refs, so they're cheap on disk and branches/commits are instantly visible across them, but a branch can live in only one worktree. A second clone duplicates the whole repository and needs push/fetch to exchange work, but is fully independent (different config, can check out the same branch). Worktrees are the better default for parallel work on one machine.

</details>
