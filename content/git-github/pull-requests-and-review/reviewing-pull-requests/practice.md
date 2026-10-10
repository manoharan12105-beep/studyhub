# Reviewing Pull Requests and Addressing Reviews — Practice

### P1. Blocking verdict

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** review states

Which review verdict signals that the author must make changes before merging?

- A) Comment
- B) Approve
- C) Request changes
- D) Resolve conversation

<details>
<summary>Answer</summary>

**Answer:** C) Request changes

</details>

### P2. Check it out locally

**Difficulty:** Medium · **Type:** Command · **Concepts:** fetching a PR

Fetch pull request #21 into a local branch `pr-21`, switch to it and run the Maven build.

<details>
<summary>Answer</summary>

```bash
git fetch origin pull/21/head:pr-21
git switch pr-21
mvn -B verify
```

(`gh pr checkout 21` does the first two steps.)

</details>

### P3. Improve the comment

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** review comments

Rewrite this review comment so it's actionable and respectful: "This is bad, use a loop."

<details>
<summary>Answer</summary>

For example: "This repeats the same `append` five times; a loop over `students` would make adding a sixth field less error-prone. What do you think?" — specific, explains why, and invites discussion.

</details>

### P4. Find the bug in review

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** Java review

A PR changes `average` to:

```java
public double average(int... marks) {
    int total = 0;
    for (int mark : marks) {
        total += mark;
    }
    return total / marks.length;
}
```

What review comments would you leave?

<details>
<summary>Answer</summary>

1. `total / marks.length` is integer division — `average(82, 91, 77)` returns 83.0 instead of 83.33; cast first: `(double) total / marks.length`. 2. The empty-marks check was removed: `average()` with no marks now throws `ArithmeticException` (division by zero) instead of the documented `IllegalArgumentException`. 3. Ask for tests covering both cases.

</details>
