# git blame: Who Changed This Line and Why — Practice

### P1. Read the caret

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** boundary commits

What does the `^` mean in this line?

```text
^8ddf4ed (Priya Sharma 2026-10-01 10:02:00 +0530 22)         if (average >= 60) return 'C';
```

<details>
<summary>Answer</summary>

The line is attributed to a boundary commit — here the root commit `8ddf4ed` — meaning it hasn't changed since the file was created there.

</details>

### P2. Only one method

**Difficulty:** Easy · **Type:** Command · **Concepts:** -L

Blame only lines 10 to 20 of `GradeCalculator.java`.

<details>
<summary>Answer</summary>

`git blame -L 10,20 src/main/java/com/example/gradebook/GradeCalculator.java`

</details>

### P3. Reformat hides everything

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** ignore whitespace

A commit changed indentation from tabs to spaces in every line. Which option makes blame skip whitespace-only changes?

- A) `-C`
- B) `-w`
- C) `-e`
- D) `--reverse`

<details>
<summary>Answer</summary>

**Answer:** B) `-w`

`-C` detects copied lines, `-e` shows emails.

</details>

### P4. Stale comment

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** investigation

Blame shows line 21 (`>= 78`) changed on 7 October while the Javadoc above it ("B for 75+") dates from 2 October. What does this tell you and what should happen next?

<details>
<summary>Answer</summary>

The threshold changed without the comment being updated, so the comment is now wrong. Read `git show 3a070e0` (and its pull request) to confirm the change was intended, then fix the Javadoc in a new commit.

</details>
