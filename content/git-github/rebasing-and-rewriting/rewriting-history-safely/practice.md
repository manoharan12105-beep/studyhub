# Rewriting History Safely — Practice

### P1. Safe or not?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** safety ladder

Which rewrite is safe without asking anyone?

- A) Rebasing `main` to remove a merge commit
- B) Amending the last commit before you've pushed it
- C) Force-pushing a squashed `release/1.0`
- D) Deleting and recreating tag `v1.0.0` on another commit

<details>
<summary>Answer</summary>

**Answer:** B) Amending the last commit before you've pushed it

Nobody else can have the commit yet. The others rewrite shared references.

</details>

### P2. Read the status

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** divergence after amend

After amending a pushed commit, `git status -sb` shows `[ahead 1, behind 1]`. Explain both numbers.

<details>
<summary>Answer</summary>

Ahead 1: the new amended commit exists only locally. Behind 1: the original commit exists only on the remote (it's no longer on your branch).

</details>

### P3. Publish the rewrite

**Difficulty:** Medium · **Type:** Command · **Concepts:** force-with-lease

Your PR branch `fix/rounding` is yours alone, and you just rebased it onto `main`. Push it safely.

<details>
<summary>Answer</summary>

`git push --force-with-lease` (with the upstream set; otherwise `git push --force-with-lease origin fix/rounding`).

</details>

### P4. Undo on main

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** revert vs rewrite

A bad commit reached `main` an hour ago and several teammates have pulled. A colleague suggests `git reset --hard HEAD~1 && git push --force`. What should you do instead, and why?

<details>
<summary>Answer</summary>

`git revert <bad-commit>` and push normally. It adds a new commit that undoes the change without rewriting `main`, so nobody's clone diverges and no force push is needed.

</details>

### P5. After a teammate's force-push

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** recovering from rewritten upstream

Arjun force-pushed a rebased `feature/report`. You have no local commits on it. Bring your local branch in line with the remote.

<details>
<summary>Answer</summary>

```bash
git fetch
git switch feature/report
git status            # confirm no uncommitted work you need
git reset --hard origin/feature/report
```

</details>
