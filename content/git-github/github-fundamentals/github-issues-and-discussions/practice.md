# GitHub Issues and Discussions — Practice

### P1. Closing keyword

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** linking issues

Which PR description line closes issue 27 when the PR is merged into the default branch?

- A) `See #27`
- B) `Related to #27`
- C) `Resolves #27`
- D) `Issue: 27`

<details>
<summary>Answer</summary>

**Answer:** C) `Resolves #27`

`See` and `Related to` only cross-reference.

</details>

### P2. Fix the report

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** bug reports

An issue says: "Title: Error. Body: grades broken pls fix". List the information you'd ask the reporter for.

<details>
<summary>Answer</summary>

Steps to reproduce (input marks), expected grade, actual grade or exact error message, version/commit of gradebook, JDK and OS — and a specific title.

</details>

### P3. Wrong branch, still open

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** default branch rule

A PR with `Fixes #31` was merged into `develop`, but issue #31 is still open. Why?

<details>
<summary>Answer</summary>

Closing keywords act only when the change is merged into the repository's default branch (here probably `main`). The issue closes when `develop` is merged into `main`, or you close it manually.

</details>

### P4. Issue or discussion?

**Difficulty:** Easy · **Type:** Scenario · **Concepts:** discussions

Classify: (a) "Should we support weighted averages?" (b) "letterGrade(90) returns B instead of A" (c) "Release 1.1 is out!"

<details>
<summary>Answer</summary>

(a) Discussion (an idea under debate) (b) Issue (a defect) (c) Discussion (announcement) — or a Release note.

</details>
