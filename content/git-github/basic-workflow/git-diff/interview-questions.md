# git diff: Unstaged, Staged and Committed Changes — Interview Questions

## Beginner

### Q1. What is the difference between `git diff` and `git diff --staged`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`git diff` compares the working directory with the index — unstaged changes. `git diff --staged` (alias `--cached`) compares the index with the last commit — what the next commit will contain.

</details>

### Q2. You modified files but `git diff` shows nothing. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

The changes are already staged (so the working directory matches the index), or the changed files are untracked. Check with `git status`; staged changes are shown by `git diff --staged`.

</details>

## Intermediate

### Q3. Explain the hunk header `@@ -14,11 +14,12 @@`.

**Style:** What

<details>
<summary>Answer</summary>

The hunk covers 11 lines starting at line 14 in the old version and 12 lines starting at line 14 in the new version — one net line was added. Text after the second `@@` is the nearest enclosing function or class, shown for context.

</details>

### Q4. How do you see what the last commit changed?

**Style:** How

<details>
<summary>Answer</summary>

`git show` (commit details plus its diff), or `git diff HEAD~1 HEAD`. For just the file list, `git show --stat` or `git diff --name-status HEAD~1 HEAD`.

</details>

## Advanced

### Q5. What's the difference between `git diff main feature` and `git diff main...feature`?

**Style:** Trap

<details>
<summary>Answer</summary>

Two dots (or a space) compares the two branch tips directly, so changes made on `main` since the branches diverged appear reversed in the output. Three dots compares the merge base of the two branches with `feature` — exactly what `feature` introduced, which is what a pull request shows.

</details>
