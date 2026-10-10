# git status and git add — Practice

### P1. New file left behind

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** git add -u

You created `Report.java` and modified `App.java`. Which command stages `App.java` but **not** `Report.java`?

- A) `git add -A`
- B) `git add .`
- C) `git add -u`
- D) `git add *`

<details>
<summary>Answer</summary>

**Answer:** C) `git add -u`

`-u` updates only tracked files; `Report.java` is untracked.

</details>

### P2. Preview

**Difficulty:** Easy · **Type:** Command · **Concepts:** dry run

Write a command that shows what `git add .` would stage without staging anything.

<details>
<summary>Answer</summary>

`git add -n .` (or `git add --dry-run .`).

</details>

### P3. Subfolder surprise

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** pathspec scope

You are in `src/` and run `git add .`. You had modified `README.md` (at the root) and `src/main/java/.../App.java`. What does `git status -s` show for each?

<details>
<summary>Answer</summary>

`M  src/main/java/.../App.java` (staged) and ` M README.md` (not staged): `.` means the current directory and below.

</details>

### P4. Read the branch line

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** status -sb

What does `## main...origin/main [ahead 2, behind 1]` mean?

<details>
<summary>Answer</summary>

You are on `main`, which tracks `origin/main`. Your branch has 2 commits that the remote-tracking branch doesn't, and the remote-tracking branch has 1 commit you don't have — the histories have diverged and must be integrated (merge or rebase) before a normal push succeeds.

</details>

### P5. Keep the debug line out

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** add -p

`GradeCalculator.java` contains a real fix and a temporary `System.out.println("DEBUG " + total);`. Describe how to commit only the fix.

<details>
<summary>Answer</summary>

Run `git add -p src/main/java/com/example/gradebook/GradeCalculator.java`, answer `y` for the fix hunk and `n` for the debug hunk (use `s` to split them if they are in one hunk), check with `git diff --staged`, then commit. Remove the debug line afterwards.

</details>
