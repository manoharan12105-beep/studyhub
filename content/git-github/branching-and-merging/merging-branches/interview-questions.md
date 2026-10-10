# Merging Branches: Fast-Forward and Three-Way Merges — Interview Questions

## Beginner

### Q1. What does `git merge feature` do?

**Style:** What

<details>
<summary>Answer</summary>

It integrates the commits of `feature` into the current branch — by fast-forwarding the current branch if it hasn't diverged, or by creating a merge commit that combines both lines of history.

</details>

### Q2. What is the difference between a fast-forward merge and a three-way merge?

**Style:** Comparison

<details>
<summary>Answer</summary>

A fast-forward happens when the current branch is an ancestor of the merged branch: Git just moves the pointer forward, creating no commit. A three-way merge happens when both branches have new commits: Git combines changes from the merge base and both tips and records a merge commit with two parents.

</details>

## Intermediate

### Q3. What is a merge base and why does Git need it?

**Style:** Why

<details>
<summary>Answer</summary>

The merge base is the best common ancestor of the two branches (`git merge-base a b`). With it Git can tell who changed what: if a line differs between the tips but only one side differs from the base, that side's version wins automatically. Without the base, Git couldn't distinguish an addition on one side from a deletion on the other.

</details>

### Q4. Why would a team use `--no-ff`?

**Style:** Trade-off

<details>
<summary>Answer</summary>

To always record a merge commit, so each feature's commits stay grouped under one merge in history and the whole feature can be reverted with one `git revert -m 1`. The cost is extra merge commits and a less linear history; teams preferring linear history use `--ff-only` with rebasing or squash merges instead.

</details>

## Advanced

### Q5. A merge finished with no conflicts, but the build fails. How is that possible?

**Style:** Scenario

<details>
<summary>Answer</summary>

Git merges text line by line; it doesn't understand code. Example: one branch renames `average()` to `mean()` while the other adds a new caller of `average()` in a different file. No lines overlap, so there's no conflict, but the result doesn't compile. Always build and test after merging; CI on the merged result (or on pull requests updated with `main`) catches this.

</details>
