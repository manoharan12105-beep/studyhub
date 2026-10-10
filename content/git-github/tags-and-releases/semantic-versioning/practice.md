# Semantic Versioning and Pre-Releases — Practice

### P1. Next version

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** SemVer rules

Current version `1.4.2`. The only change is a bug fix. Next version?

- A) `1.4.3`
- B) `1.5.0`
- C) `2.0.0`
- D) `1.4.2-fix`

<details>
<summary>Answer</summary>

**Answer:** A) `1.4.3`

</details>

### P2. Order these

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** precedence

Order from lowest to highest: `1.0.0`, `1.0.0-rc.1`, `1.10.0`, `1.2.0`, `1.0.0-beta`.

<details>
<summary>Answer</summary>

`1.0.0-beta` < `1.0.0-rc.1` < `1.0.0` < `1.2.0` < `1.10.0`.

</details>

### P3. Sort tags correctly

**Difficulty:** Medium · **Type:** Command · **Concepts:** versionsort

List tags matching `v2.*` in version order with release candidates placed before their releases, without changing your configuration permanently.

<details>
<summary>Answer</summary>

`git -c versionsort.suffix=-rc tag -l --sort=v:refname "v2.*"`

</details>

### P4. Classify changes

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** MAJOR/MINOR/PATCH

From `3.1.0`, what does each change alone require? (a) remove the deprecated `average(List<Integer>)` overload; (b) add `ClassReport.toCsv()`; (c) fix a NullPointerException for a student with no name.

<details>
<summary>Answer</summary>

(a) MAJOR → `4.0.0` (b) MINOR → `3.2.0` (c) PATCH → `3.1.1`.

</details>
