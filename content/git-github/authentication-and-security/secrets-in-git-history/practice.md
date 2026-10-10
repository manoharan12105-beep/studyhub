# Secrets in Git History — Practice

### P1. First action

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** incident order

A database password was pushed to GitHub. What is the **first** thing to do?

- A) Run `git filter-repo` to remove it
- B) Delete the file and push
- C) Change (rotate) the database password
- D) Make the repository private

<details>
<summary>Answer</summary>

**Answer:** C) Change (rotate) the database password

Everything else is clean-up; rotation is what stops misuse.

</details>

### P2. Prove it's still there

**Difficulty:** Medium · **Type:** Command · **Concepts:** searching history

The value `change-me-not-a-real-password` was "removed" last week. Show every commit that added or removed it, across all branches.

<details>
<summary>Answer</summary>

`git log --oneline --all -S "change-me-not-a-real-password"`

</details>

### P3. Safe configuration

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** prevention

Rewrite this tracked line so no secret is committed, and name the file you'd commit for other developers.

```properties
spring.datasource.password=S3cret!
```

<details>
<summary>Answer</summary>

```properties
spring.datasource.password=${DB_PASSWORD}
```

Supply `DB_PASSWORD` through the environment (or a secret manager). Commit an `application-example.properties` (or `.env.example`) with placeholder values such as `change-me`, and ignore real local files.

</details>

### P4. Private repository

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** private ≠ safe

The leak was in a private repository with five members. Does the response change? What can you reasonably skip?

<details>
<summary>Answer</summary>

You still rotate the credential and check for misuse — five people, their machines and any future members can read it. A history rewrite is more often skipped for private repositories once the credential is rotated, because the old value is useless; policy may still require it.

</details>

### P5. Re-introduced

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** coordinated rewrite

After a history rewrite removed `.env`, it reappears on GitHub a day later. What probably happened, and how is it prevented?

<details>
<summary>Answer</summary>

Someone with an old clone merged or force-pushed their old history, bringing the original commits back. Prevent it by announcing the rewrite, requiring everyone to re-clone (not pull), blocking force pushes on protected branches, and enabling push protection so a known secret is rejected.

</details>
