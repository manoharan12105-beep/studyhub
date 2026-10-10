# Setting Up a Maven Project Repository — Practice

### P1. Track or ignore?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** Maven layout

Which of these should be **tracked** in Git?

- A) `target/gradebook-1.0.0.jar`
- B) `.idea/workspace.xml`
- C) `mvnw`
- D) `gradebook.iml`

<details>
<summary>Answer</summary>

**Answer:** C) `mvnw`

The wrapper script belongs in the repository; the others are generated or personal.

</details>

### P2. Write the ignore file

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** .gitignore

Write a minimal `.gitignore` for a Maven project opened in IntelliJ IDEA that also keeps `.env` and logs out.

<details>
<summary>Answer</summary>

```text
target/
.idea/
*.iml
*.log
.env
```

</details>

### P3. Executable wrapper

**Difficulty:** Medium · **Type:** Command · **Concepts:** file mode

On Windows, record `mvnw` as executable in the repository and commit it.

<details>
<summary>Answer</summary>

```bash
git update-index --chmod=+x mvnw
git commit -m "Make the Maven wrapper executable"
```

</details>

### P4. Prove the repository is complete

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** verification

How do you check that a newly created repository contains everything needed to build, and nothing it shouldn't?

<details>
<summary>Answer</summary>

`git ls-files` to review exactly what's tracked; then clone it into a fresh folder and run `./mvnw -B verify` there. If the build fails, something needed isn't committed; if `ls-files` lists `target/` or IDE files, the `.gitignore` is missing rules.

</details>
