# git cherry-pick: Copying Individual Commits — Practice

### P1. Same commit?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** new commit id

After `git cherry-pick a9f609c` onto `release/1.0`, the new commit on `release/1.0`:

- A) Has id `a9f609c`
- B) Has a new id but the same change and message
- C) Moves `a9f609c` off its original branch
- D) Is a merge commit with two parents

<details>
<summary>Answer</summary>

**Answer:** B) Has a new id but the same change and message

</details>

### P2. Back-port with traceability

**Difficulty:** Easy · **Type:** Command · **Concepts:** -x

Apply commit `a9f609c` to the current branch and record its origin in the message.

<details>
<summary>Answer</summary>

`git cherry-pick -x a9f609c`

</details>

### P3. Wrong branch

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** moving a commit

You made commit `5be1c02` on `main` (not pushed) but it belongs on `fix/rounding`. Move it.

<details>
<summary>Answer</summary>

```bash
git switch fix/rounding
git cherry-pick 5be1c02
git switch main
git status                 # make sure nothing uncommitted would be lost
git reset --hard HEAD~1    # safe only because it wasn't pushed
```

</details>

### P4. Range

**Difficulty:** Medium · **Type:** Command · **Concepts:** ranges

Cherry-pick commits `c1`, `c2` and `c3` (consecutive on another branch, `c1` oldest) in one command.

<details>
<summary>Answer</summary>

`git cherry-pick c1^..c3` (`c1..c3` would exclude `c1`).

</details>

### P5. Conflict choices

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** continue/abort

A cherry-pick stops with a conflict in `GradeCalculator.java`. List the commands to (a) finish after resolving, (b) give up and return to the previous state.

<details>
<summary>Answer</summary>

(a) `git add src/main/java/com/example/gradebook/GradeCalculator.java` then `git cherry-pick --continue`. (b) `git cherry-pick --abort`.

</details>
