# git bisect: Finding the Commit That Broke Something — Practice

### P1. Start a bisect

**Difficulty:** Easy · **Type:** Command · **Concepts:** start

The bug exists at `HEAD`; tag `v1.0.0` was fine. Start a bisect session in one command.

<details>
<summary>Answer</summary>

`git bisect start HEAD v1.0.0` (bad first, then good).

</details>

### P2. Exit codes

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** bisect run

Your `git bisect run` script hits a commit that doesn't compile for an unrelated reason. Which exit code should it return?

- A) 0
- B) 1
- C) 125
- D) 255

<details>
<summary>Answer</summary>

**Answer:** C) 125

125 means "skip this commit". 0 is good, 1–127 (except 125) bad, and above 127 aborts the bisect.

</details>

### P3. Steps

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** binary search

Roughly how many tests does bisect need for 64 commits? For 4,000?

<details>
<summary>Answer</summary>

About 6 (log₂ 64 = 6) and about 12 (log₂ 4096 = 12).

</details>

### P4. Finish

**Difficulty:** Easy · **Type:** Troubleshooting · **Concepts:** reset

After bisect reported the first bad commit, `git status` says "HEAD detached at 3e5e6f0". What did you forget?

<details>
<summary>Answer</summary>

`git bisect reset`, which ends the session and returns to the branch you started from.

</details>

### P5. Write the script

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** automated bisect

The bug: `average(50, 51)` returns `50.0` instead of `50.5` on some commit. Outline a `bisect run` script for gradebook that compiles `GradeCalculator` and decides good or bad.

<details>
<summary>Answer</summary>

Compile `GradeCalculator.java` into a temp directory (exit 125 if that fails), compile a small checker kept outside the repository that calls `new GradeCalculator().average(50, 51)`, and exit 0 if the result equals 50.5 (within a tiny tolerance), 1 otherwise. Then `git bisect start HEAD <good>` and `git bisect run sh ../check-average.sh`.

</details>
