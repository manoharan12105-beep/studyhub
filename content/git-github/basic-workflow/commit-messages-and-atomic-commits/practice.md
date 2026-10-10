# Commit Messages and Atomic Commits — Practice

### P1. Best subject

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** subject line

Which subject follows the common conventions best?

- A) `fixed bug.`
- B) `Updated GradeCalculator.java and GradeCalculatorTest.java to fix the issue Arjun reported`
- C) `Reject an empty marks list in average()`
- D) `WIP`

<details>
<summary>Answer</summary>

**Answer:** C) `Reject an empty marks list in average()`

Imperative, specific and short. B is too long and describes files instead of the change.

</details>

### P2. Split it

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** atomic commits

Your staged changes: the D grade in `GradeCalculator.java`, its test in `GradeCalculatorTest.java`, a JUnit version change in `pom.xml` and a README typo fix. Propose the commits and their order.

<details>
<summary>Answer</summary>

Three commits, for example: (1) "Bump JUnit to 5.11.4" — `pom.xml`; (2) "Fix typo in README build section" — `README.md`; (3) "Add D grade for averages from 50 to 59" — `GradeCalculator.java` and its test together. The order of independent commits is flexible; each must build.

</details>

### P3. Close the issue

**Difficulty:** Easy · **Type:** Command · **Concepts:** trailers

Write a single `git commit` command with the subject "Round averages to two decimals" and a separate trailer paragraph that closes issue 27 on GitHub when merged.

<details>
<summary>Answer</summary>

`git commit -m "Round averages to two decimals" -m "Fixes #27"`

</details>

### P4. What vs why

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** message body

Rewrite this body so it explains why: "Changed the threshold in letterGrade from 70 to 75."

<details>
<summary>Answer</summary>

For example: "The department's 2026 grading policy moves the B boundary to 75. Students averaging 70–74 now receive a C, matching the printed report cards." The diff already shows the numbers; the body records the reason a future reader needs.

</details>

### P5. Bisect-friendly

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** buildable commits

Commit 1 adds `letterGrade('D')` tests; commit 2, an hour later, adds the D grade code. Why might this hurt a future `git bisect`, and how should it have been committed?

<details>
<summary>Answer</summary>

At commit 1 the tests fail, so a bisect run that uses the test suite would mark it "bad" even though it isn't the bug being hunted, sending the search the wrong way (or forcing manual `git bisect skip`). The test and the code should be one commit — or the tests committed after the code — so every commit passes.

</details>
