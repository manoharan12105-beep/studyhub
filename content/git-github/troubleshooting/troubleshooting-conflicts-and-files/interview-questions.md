# Troubleshooting Conflicts, Ignored Files and Line Endings — Interview Questions

## Beginner

### Q1. How do you find out why Git ignores a file?

**Style:** How

<details>
<summary>Answer</summary>

`git check-ignore -v <path>` prints the ignore file, line number and pattern that matched (including global excludes and `.git/info/exclude`). Then narrow the pattern or add a negation — keeping in mind that files inside an ignored directory can't be re-included.

</details>

## Intermediate

### Q2. A colleague's one-line change shows the whole file as changed. What's your diagnosis?

**Style:** Debugging

<details>
<summary>Answer</summary>

Most likely line endings (or whitespace reformatting). `git diff -w` shows nothing if it's whitespace-only, and `git ls-files --eol` shows the index vs working-tree endings. The lasting fix is a committed `.gitattributes` (e.g. `* text=auto eol=lf`) and `git add --renormalize .`.

</details>

### Q3. How does resolving a rebase conflict differ from a merge conflict?

**Style:** Comparison

<details>
<summary>Answer</summary>

A rebase replays commits one at a time, so you may resolve conflicts several times, once per affected commit, and continue with `git rebase --continue`. The meaning of ours/theirs is swapped: "ours" is the branch you're rebasing onto, "theirs" is your commit. A merge resolves the combined change once and finishes with a commit.

</details>

## Advanced

### Q4. What does `rerere` do, and when is it useful?

**Style:** What

<details>
<summary>Answer</summary>

"Reuse recorded resolution": with `rerere.enabled=true`, Git records how you resolved a conflict and automatically applies the same resolution when the identical conflict reappears — useful for repeated rebases of a long-lived branch or re-doing a merge. You still review and test the result.

</details>
