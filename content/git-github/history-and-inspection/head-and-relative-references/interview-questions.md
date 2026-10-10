# HEAD and Relative Commit References — Interview Questions

## Beginner

### Q1. What is HEAD in Git?

**Style:** What

<details>
<summary>Answer</summary>

A reference to the currently checked-out commit. Normally it is a symbolic reference to the current branch (`.git/HEAD` contains `ref: refs/heads/main`), so it moves when the branch moves. If it contains a commit hash directly, you're in detached HEAD state.

</details>

### Q2. What does `HEAD~1` mean?

**Style:** What

<details>
<summary>Answer</summary>

The parent of the current commit (following the first parent). `HEAD~3` is three first-parent generations back.

</details>

## Intermediate

### Q3. What is the difference between `HEAD~2` and `HEAD^2`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`HEAD~2` goes back two generations along first parents (the grandparent). `HEAD^2` is the second parent of `HEAD`, which only exists when `HEAD` is a merge commit — it's the tip of the branch that was merged in.

</details>

### Q4. How do you list the commits a merge commit `M` brought into the branch?

**Style:** How

<details>
<summary>Answer</summary>

`git log --oneline M^1..M^2` — commits reachable from the second parent (the merged branch) but not from the first parent (the branch before the merge).

</details>

## Advanced

### Q5. What does `main@{1}` refer to, and why might it differ between two clones?

**Style:** What happens internally

<details>
<summary>Answer</summary>

The value `main` had one change ago, read from this clone's reflog. Reflogs are local and never pushed or cloned, so each clone has its own history of where its branches pointed; a fresh clone has only one entry.

</details>
