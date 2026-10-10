# git show and Comparing Commits and Branches — Interview Questions

## Beginner

### Q1. How do you see the changes introduced by a specific commit?

**Style:** How

<details>
<summary>Answer</summary>

`git show <hash>` prints the commit's metadata and the diff against its parent. `git show --stat <hash>` lists only the files and line counts.

</details>

### Q2. How do you view a file as it was in an old commit without changing your working copy?

**Style:** How

<details>
<summary>Answer</summary>

`git show <commit>:<path-from-repo-root>`, for example `git show 8ddf4ed:README.md`. It prints the content; redirect it to a file if you want a copy.

</details>

## Intermediate

### Q3. How do you list the commits on `feature` that aren't on `main`?

**Style:** How

<details>
<summary>Answer</summary>

`git log --oneline main..feature` — commits reachable from `feature` but not from `main`. Swap the names to see what `main` has that `feature` lacks.

</details>

### Q4. Why does `git show` of a merge commit often print no diff?

**Style:** What happens internally

<details>
<summary>Answer</summary>

For merges `git show` prints a combined diff, which only includes lines that differ from **all** parents — typically conflict resolutions. A clean merge has none. To see what the merge brought in, diff against the first parent: `git diff <merge>^1 <merge>`.

</details>

## Advanced

### Q5. A reviewer used `git diff main feature` and complained your branch deletes the new rounding code. What happened?

**Style:** Debugging

<details>
<summary>Answer</summary>

Two-dot diff compares the two tips. `main` gained the rounding change after your branch diverged, so going from `main` to `feature` "removes" it. The review should use `git diff main...feature`, which diffs from the merge base — or the pull request view, which does the same. Rebasing or merging `main` into the branch also makes the tips closer.

</details>
