# Working with Feature Branches — Practice

### P1. Read the counts

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** ahead/behind

`git rev-list --left-right --count main...feature/report` prints `3	5`. Interpret it.

<details>
<summary>Answer</summary>

`main` has 3 commits the feature branch doesn't (the branch is 3 behind); the feature branch has 5 commits `main` doesn't (5 ahead).

</details>

### P2. Name it

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** naming conventions

Which branch name best follows common conventions for fixing issue 42 (NPE on empty marks)?

- A) `priya`
- B) `Fix NPE`
- C) `fix/42-empty-marks-npe`
- D) `new-branch-2`

<details>
<summary>Answer</summary>

**Answer:** C) `fix/42-empty-marks-npe`

Purpose prefix, issue number, short description, no spaces.

</details>

### P3. Update the branch

**Difficulty:** Medium · **Type:** Command · **Concepts:** merge main in

You're on `feature/class-report`, which is behind `main`. Bring `main`'s commits into your branch without rewriting any commits.

<details>
<summary>Answer</summary>

`git merge main` (with a remote: `git fetch` then `git merge origin/main`).

</details>

### P4. Merge or rebase?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** shared branches

Arjun has created his own branch from your pushed `feature/class-report` and added commits on top. You want to update your branch with `main`. Should you merge or rebase? Why?

<details>
<summary>Answer</summary>

Merge. Rebasing would rewrite the commits Arjun's branch is built on, leaving him with copies of old commits and a messy reconciliation. Merging adds a commit without changing existing ones.

</details>

### P5. Order the routine

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** workflow

Put in order: (a) delete the branch, (b) `git switch -c feature/x`, (c) open a pull request, (d) update `main`, (e) commit and test, (f) merge after approval.

<details>
<summary>Answer</summary>

(d) → (b) → (e) → (c) → (f) → (a).

</details>
