# Branches: Movable Pointers to Commits — Practice

### P1. What is stored?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** branch refs

What does the file `.git/refs/heads/feature/d-grade` contain?

- A) A copy of every file on the branch
- B) A list of the branch's commits
- C) The id of the commit the branch points to
- D) The branch's remote URL

<details>
<summary>Answer</summary>

**Answer:** C) The id of the commit the branch points to

</details>

### P2. Read git branch -v

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** branch listing

```text
  feature/d-grade c378147 Create gradebook project
* main            c378147 Create gradebook project
```

Which branch are you on, and has either branch got commits the other lacks?

<details>
<summary>Answer</summary>

You're on `main` (marked `*`). Both point to the same commit, so neither has unique commits yet.

</details>

### P3. Rename

**Difficulty:** Easy · **Type:** Command · **Concepts:** branch -m

You're on `feature/rouding` (typo). Rename it to `feature/rounding`.

<details>
<summary>Answer</summary>

`git branch -m feature/rounding` (renames the current branch). If it was already pushed, push the new name and delete the old one on the remote too.

</details>

### P4. Refused deletion

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** -d safety

`git branch -d spike/cache` says "not fully merged". Before deciding whether to use `-D`, which command shows the commits you would strand?

<details>
<summary>Answer</summary>

`git log --oneline main..spike/cache` (replace `main` with the branch you're comparing against). If the list is empty or you're sure the work is unwanted, `-D` is fine.

</details>

### P5. Recover a deleted branch

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** reflog, recovery

You ran `git branch -D feature/class-report` and Git printed `Deleted branch feature/class-report (was 8b503ca).` Restore the branch.

<details>
<summary>Answer</summary>

`git branch feature/class-report 8b503ca` — the commits are still in the object database. Without the printed hash, look in `git reflog` for the last commit on that branch.

</details>
