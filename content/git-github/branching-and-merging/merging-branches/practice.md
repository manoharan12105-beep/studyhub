# Merging Branches: Fast-Forward and Three-Way Merges — Practice

### P1. Predict the merge

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** fast-forward

```text
* 9f1 (feature/report) Add report footer
* 7c2 (HEAD -> main) Add D grade
* 4a0 Create gradebook project
```

You run `git merge feature/report` on `main`. Fast-forward or merge commit?

<details>
<summary>Answer</summary>

Fast-forward: `main` (7c2) is an ancestor of `feature/report` (9f1), so `main` moves to 9f1 and no commit is created.

</details>

### P2. Merge commit parents

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** three-way merge

After a three-way merge of `feature` into `main`, the merge commit's first parent is:

- A) The merge base
- B) The previous tip of `main`
- C) The tip of `feature`
- D) The root commit

<details>
<summary>Answer</summary>

**Answer:** B) The previous tip of `main`

The branch you were on is the first parent; the merged branch is the second.

</details>

### P3. Three-way table

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** base/ours/theirs

The base has `>= 75`. `main` still has `>= 75`; `feature` has `>= 78`. What does a three-way merge produce, and would a two-way comparison of the tips know that?

<details>
<summary>Answer</summary>

`>= 78`, automatically: only `feature` changed the line relative to the base. A two-way comparison would see two different versions and couldn't tell which side changed it.

</details>

### P4. Linear only

**Difficulty:** Medium · **Type:** Command · **Concepts:** ff-only

Write a merge command that integrates `fix/rounding` into the current branch only if no merge commit is needed, and fails otherwise.

<details>
<summary>Answer</summary>

`git merge --ff-only fix/rounding`

</details>

### P5. Find the split point

**Difficulty:** Medium · **Type:** Command · **Concepts:** merge-base

Print the commit where `main` and `feature/class-report` diverged, then list the commits each branch added since then.

<details>
<summary>Answer</summary>

```bash
git merge-base main feature/class-report
git log --oneline feature/class-report..main
git log --oneline main..feature/class-report
```

</details>
