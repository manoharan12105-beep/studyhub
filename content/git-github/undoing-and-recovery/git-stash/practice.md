# git stash: Shelving Work in Progress — Practice

### P1. Untracked left behind

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** stash scope

Before: `M  GradeCalculator.java` and `?? NOTES.md`. After `git stash push -m "wip"`, what does `git status -s` show?

<details>
<summary>Answer</summary>

`?? NOTES.md` — the untracked file isn't stashed without `-u`.

</details>

### P2. Keep the stash

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** apply vs pop

You want to apply the same stash to two different branches. Which command do you use on the first branch?

- A) `git stash pop`
- B) `git stash apply`
- C) `git stash drop`
- D) `git stash clear`

<details>
<summary>Answer</summary>

**Answer:** B) `git stash apply`

`pop` would remove the stash after the first successful application.

</details>

### P3. Labelled stash with untracked files

**Difficulty:** Medium · **Type:** Command · **Concepts:** push -u -m

Stash all changes, including new untracked files, with the message "class report WIP".

<details>
<summary>Answer</summary>

`git stash push -u -m "class report WIP"`

</details>

### P4. Pop conflict

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** conflicts

`git stash pop` reported a conflict and "The stash entry is kept in case you need it again." After resolving `GradeCalculator.java`, what two steps complete the job if you want the change uncommitted?

<details>
<summary>Answer</summary>

`git restore --staged src/main/java/com/example/gradebook/GradeCalculator.java` (marks it resolved and leaves it as an unstaged change), then `git stash drop` to remove the kept stash.

</details>

### P5. Staged state

**Difficulty:** Hard · **Type:** Conceptual · **Concepts:** --index

You stashed a staged change. After `git stash pop`, the change is unstaged. Why, and how could you have kept it staged?

<details>
<summary>Answer</summary>

By default stash re-applies working-tree changes only and doesn't restore the index state. `git stash pop --index` (or `apply --index`) restores the staged state as well.

</details>
