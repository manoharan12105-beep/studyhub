# Java Feature Branches, Meaningful Commits and Conflicts in Java Code — Practice

### P1. One commit or two?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** atomic commits

You added `highest()` and its unit test. How should you commit them?

- A) Test first in one commit, method later in another
- B) Method and test together in one commit
- C) Method only; tests are optional
- D) Together with an unrelated README fix

<details>
<summary>Answer</summary>

**Answer:** B) Method and test together in one commit

Each commit then compiles and passes its tests.

</details>

### P2. Naive resolution

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** Java conflicts

After deleting only the marker lines from the conflict in this lesson, what does `mvn -B compile` report, and why?

<details>
<summary>Answer</summary>

A syntax error (`illegal start of expression` at line 36): the first method lost its closing brace because the brace was shared below the markers, so the second method appears inside the first.

</details>

### P3. Resolve the imports

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** imports

```java
<<<<<<< HEAD
import java.util.List;
import java.util.Optional;
=======
import java.util.List;
import java.util.Map;
>>>>>>> main
```

Write the resolved block.

<details>
<summary>Answer</summary>

```java
import java.util.List;
import java.util.Map;
import java.util.Optional;
```

Then compile — the IDE's optimise-imports removes any that end up unused.

</details>

### P4. Order of work

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** feature workflow

You need to rename `App` to `GradebookApp` and add a CSV export. In what order and how many commits?

<details>
<summary>Answer</summary>

First a pure rename commit (IDE refactoring, no behaviour change), then the CSV export with its tests in one or more buildable commits. Separating them keeps the rename detectable by Git and the feature diff small.

</details>
