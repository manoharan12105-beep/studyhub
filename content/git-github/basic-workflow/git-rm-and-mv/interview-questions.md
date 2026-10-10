# git rm and git mv: Deleting and Renaming Files — Interview Questions

## Beginner

### Q1. What is the difference between `git rm` and `git rm --cached`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`git rm` deletes the file from the working directory and stages the deletion. `git rm --cached` stages the deletion but leaves the file on disk, so it becomes untracked — the usual way to stop tracking a file that should be ignored.

</details>

## Intermediate

### Q2. Does Git record renames?

**Style:** What happens internally

<details>
<summary>Answer</summary>

No. Commits store snapshots. When comparing two snapshots, Git pairs a deleted path with an added path whose content is similar enough (50 % by default) and reports it as a rename. `git mv` is just a shortcut for moving the file and staging both sides.

</details>

### Q3. Why might a renamed file's history disappear in `git log`?

**Style:** Debugging

<details>
<summary>Answer</summary>

`git log -- <newpath>` only follows that path. Use `git log --follow -- <newpath>` to continue across renames. If the file was heavily rewritten in the same commit as the rename, similarity may fall below the threshold and Git sees a delete plus an unrelated add — committing the rename separately prevents that.

</details>

## Advanced

### Q4. Why does `git rm` refuse to remove a modified file?

**Style:** Why

<details>
<summary>Answer</summary>

Its uncommitted changes exist only in the working directory; deleting the file would destroy them irrecoverably. Git asks you to choose explicitly: `--cached` (keep the file) or `-f` (discard the changes).

</details>
