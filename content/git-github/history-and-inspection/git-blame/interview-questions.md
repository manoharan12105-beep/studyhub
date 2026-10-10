# git blame: Who Changed This Line and Why — Interview Questions

## Beginner

### Q1. What does `git blame` show?

**Style:** What

<details>
<summary>Answer</summary>

For each line of a file, the commit that last changed it, with the author, date and line number. You then use `git show <commit>` to read the full change and message.

</details>

## Intermediate

### Q2. Blame shows a teammate's "Reformat code" commit for every line. How do you see the real history?

**Style:** Debugging

<details>
<summary>Answer</summary>

Use `git blame -w` to ignore whitespace changes, `-M`/`-C` for moved or copied lines, or `--ignore-rev <hash>` (or a `.git-blame-ignore-revs` file configured with `blame.ignoreRevsFile`) to skip the reformat commit. You can also blame the reformat commit's parent: `git blame <hash>^ -- <file>`.

</details>

### Q3. What's the difference between `git blame` and `git log -- <file>`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`git log -- <file>` lists every commit that touched the file. `git blame` answers per line which single commit last changed it. Blame is faster for "where did this line come from"; log is better for the file's overall evolution.

</details>

## Advanced

### Q4. Is it fair to say the person shown by `git blame` wrote the bug?

**Style:** Trap

<details>
<summary>Answer</summary>

No. Blame shows the last commit that changed the line — which may be a move, rename, reformat or merge resolution, and the original logic may be older. It also says nothing about review or requirements. It's a navigation tool to find the right commit and context, not an accountability tool.

</details>
