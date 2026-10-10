# git reset: Soft, Mixed and Hard — Interview Questions

## Beginner

### Q1. What is the difference between `git reset --soft`, `--mixed` and `--hard`?

**Style:** Comparison

<details>
<summary>Answer</summary>

All three move the current branch to the given commit. `--soft` leaves the index and working directory alone (the undone changes stay staged). `--mixed`, the default, also resets the index (changes become unstaged). `--hard` also resets the working directory, discarding the changes and any uncommitted edits to tracked files.

</details>

### Q2. How do you undo your last commit but keep the changes?

**Style:** How

<details>
<summary>Answer</summary>

`git reset --soft HEAD~1` (changes stay staged) or `git reset HEAD~1` (changes unstaged). Only for unpushed commits; for a pushed commit use `git revert`.

</details>

## Intermediate

### Q3. Can you recover from `git reset --hard`?

**Style:** Scenario

<details>
<summary>Answer</summary>

Commits, yes: the previous tip is in `git reflog` (and `ORIG_HEAD`), so `git reset --hard <hash>` restores it. Uncommitted changes to tracked files, no — they were never stored. Staged-but-uncommitted content may survive as dangling blobs (`git fsck --lost-found`), but without file names.

</details>

### Q4. Why shouldn't you reset a pushed branch?

**Style:** Why

<details>
<summary>Answer</summary>

It removes commits others may already have. Your next push needs force and would rewrite the shared branch; teammates' clones diverge, and their next pull may bring the removed commits back. `git revert` undoes the change with a new commit and keeps history consistent.

</details>

## Advanced

### Q5. What does `git reset --keep` do differently from `--hard`?

**Style:** Comparison

<details>
<summary>Answer</summary>

Both move the branch and update the working tree, but `--keep` aborts if a file that would change has local modifications, so it never silently destroys uncommitted work; uncommitted changes to files that don't differ between the commits are kept. It's a safer default when you want "hard" semantics.

</details>
