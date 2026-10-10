# git revert and Reset vs Revert — Interview Questions

## Beginner

### Q1. What does `git revert` do?

**Style:** What

<details>
<summary>Answer</summary>

It creates a new commit that applies the inverse of a given commit's changes. The original commit stays in history; the branch moves forward with the undoing commit.

</details>

### Q2. What is the difference between `git reset` and `git revert`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`git reset` moves the branch pointer back, removing commits from the branch — it rewrites history and suits local, unpushed work. `git revert` adds a new commit that undoes an earlier one — history is preserved, so it's safe on shared branches and can undo a commit in the middle of history.

</details>

## Intermediate

### Q3. How do you undo a commit that is already on `main` and pulled by others?

**Style:** Scenario

<details>
<summary>Answer</summary>

`git revert <hash>` on an up-to-date `main`, write a message with the reason, run the tests, and push (or open a PR if `main` is protected). Never reset and force-push a shared branch.

</details>

### Q4. Why does reverting a merge commit need `-m`?

**Style:** Why

<details>
<summary>Answer</summary>

A merge has two parents, so "the change this commit introduced" depends on which parent you compare with. `-m 1` declares the first parent (the branch merged into) as the mainline, so the revert undoes everything the second parent's branch brought in.

</details>

## Advanced

### Q5. You reverted a feature's merge last week. Now the feature is fixed and you merge the branch again, but most of the feature is missing. Why, and how do you fix it?

**Style:** Debugging

<details>
<summary>Answer</summary>

Git still treats the original feature commits as merged — they're ancestors of `main` — so the new merge only brings commits made after the first merge, while the revert commit keeps the old ones undone. Revert the revert commit (`git revert <revert-hash>`) to restore the original changes, then merge the newer fixes.

</details>
