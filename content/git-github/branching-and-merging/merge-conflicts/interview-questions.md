# Merge Conflicts: Markers, Resolution and Aborting — Interview Questions

## Beginner

### Q1. What is a merge conflict?

**Style:** What

<details>
<summary>Answer</summary>

A situation where Git can't combine two branches automatically because both changed the same lines differently since their common ancestor (or one modified a file the other deleted). Git stops the merge and marks the conflicting sections for you to resolve.

</details>

### Q2. How do you resolve a merge conflict?

**Style:** How

<details>
<summary>Answer</summary>

Run `git status` to see unmerged files; open each, understand both versions, edit to the correct result and delete the markers; build and test; `git add` each resolved file; then `git commit` to finish the merge. `git merge --abort` cancels instead.

</details>

## Intermediate

### Q3. Explain the conflict markers.

**Style:** What

<details>
<summary>Answer</summary>

`<<<<<<< HEAD` starts the current branch's version, `=======` separates it from the incoming branch's version, which ends at `>>>>>>> <branch>`. With `merge.conflictStyle=diff3` or `zdiff3`, a `||||||| <base>` section shows the common ancestor's version between them.

</details>

### Q4. What does `git add` mean during a conflict?

**Style:** What happens internally

<details>
<summary>Answer</summary>

During a conflict the index holds the base, ours and theirs versions as stages 1, 2 and 3. `git add` replaces them with the file's current content as a normal stage-0 entry, marking the path resolved. Git doesn't check that the markers are gone — that's your job.

</details>

## Advanced

### Q5. When is `git checkout --theirs` appropriate, and what's the risk?

**Style:** Trade-off

<details>
<summary>Answer</summary>

When one side's entire file should win — a generated file you'll regenerate, or a file the other side owns. The risk is discarding the other side's changes to that file wholesale, including non-conflicting ones. Also remember that during a rebase "ours" and "theirs" are swapped.

</details>

### Q6. How do you reduce merge conflicts in a team?

**Style:** Scenario

<details>
<summary>Answer</summary>

Short-lived branches merged often, keeping feature branches updated with `main`, small focused commits, separating reformatting from logic changes, agreeing on formatting tools, communicating before large refactors of shared files, and clear code ownership. Conflicts can't be eliminated, but they stay small.

</details>
