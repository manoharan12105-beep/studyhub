# Merging Pull Requests: Merge Commit, Squash and Rebase — Practice

### P1. Which method?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** squash

A PR has 7 commits named "wip", "fix", "fix again"… The team wants one clean commit on `main`. Which method?

- A) Create a merge commit
- B) Squash and merge
- C) Rebase and merge
- D) Close the PR

<details>
<summary>Answer</summary>

**Answer:** B) Squash and merge

</details>

### P2. Predict the history

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** rebase and merge

`main` has `A ← B`; the PR branch has `A ← F1 ← F2`. Draw `main` after **Rebase and merge**.

<details>
<summary>Answer</summary>

`A ← B ← F1' ← F2'` — the two commits re-created on top of `B`, with new ids and no merge commit.

</details>

### P3. Local squash

**Difficulty:** Medium · **Type:** Command · **Concepts:** merge --squash

Reproduce "Squash and merge" of `feature/class-report` into `main` locally with the message "Add ClassReport (#14)".

<details>
<summary>Answer</summary>

```bash
git switch main
git merge --squash feature/class-report
git commit -m "Add ClassReport (#14)"
```

</details>

### P4. Keep going after a squash

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** squash side effects

After your PR from `feature/report` was squash-merged, you kept committing on `feature/report` and opened a second PR. It shows your old commits again and conflicts. Why, and what should you do?

<details>
<summary>Answer</summary>

The squash created a new commit on `main`; your old commits are still unique to `feature/report`, so Git presents them again and their changes conflict with the squashed copy. Create a new branch from the updated `main` and cherry-pick only the new commits (or `git rebase --onto main <last-old-commit> feature/report`).

</details>
