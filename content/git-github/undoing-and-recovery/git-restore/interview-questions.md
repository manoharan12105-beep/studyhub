# git restore: Discard Edits, Unstage, Restore from Any Commit — Interview Questions

## Beginner

### Q1. How do you discard local changes to a file?

**Style:** How

<details>
<summary>Answer</summary>

`git restore <file>` copies the index version over the working copy (older: `git checkout -- <file>`). It's irreversible for unstaged edits, so check `git diff <file>` or stash first if unsure.

</details>

### Q2. How do you unstage a file?

**Style:** How

<details>
<summary>Answer</summary>

`git restore --staged <file>` — it copies the `HEAD` version into the index, leaving the working copy (your edit) untouched. The older equivalent is `git reset HEAD <file>` (or `git reset <file>`).

</details>

## Intermediate

### Q3. What's the difference between `git restore` and `git reset`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`git restore` works on files: it rewrites paths in the working directory and/or index from a source, never moving `HEAD` or a branch. `git reset <commit>` moves the current branch (and optionally the index and working tree) to another commit. Only `git reset <file>` overlaps with `restore --staged`.

</details>

### Q4. How do you get back the version of a file from two commits ago without changing history?

**Style:** How

<details>
<summary>Answer</summary>

`git restore --source=HEAD~2 <file>` (add `--staged` to stage it too), review, and commit it as a new change. Or `git show HEAD~2:<path>` to just look.

</details>

## Advanced

### Q5. Why does Git split `checkout` into `switch` and `restore`?

**Style:** Why

<details>
<summary>Answer</summary>

`git checkout x` meant "switch to branch x" or "overwrite file x" depending on what existed, so a typo or a file named like a branch could silently discard work. `switch` only changes branches and refuses ambiguous cases; `restore` only writes files and states where from and where to.

</details>
