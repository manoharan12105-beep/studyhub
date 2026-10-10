# Spring Boot Repository Collaboration — Practice

### P1. Safe property

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** placeholders

Which line is safe to commit?

- A) `spring.datasource.password=S3cret!`
- B) `spring.datasource.password=${DB_PASSWORD}`
- C) `spring.datasource.password=${DB_PASSWORD:S3cret!}`
- D) `spring.datasource.password=admin`

<details>
<summary>Answer</summary>

**Answer:** B) `spring.datasource.password=${DB_PASSWORD}`

C still commits a real value as the default.

</details>

### P2. Ignore rules

**Difficulty:** Easy · **Type:** Configuration · **Concepts:** .gitignore

Add rules so that `.env` and any `application-local.properties` are never committed, then show the command that proves `.env` is ignored.

<details>
<summary>Answer</summary>

```text
.env
application-local.properties
```

`git check-ignore -v .env`

</details>

### P3. New required property

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** team configuration

Your PR adds a mail-server password the app needs. Which files does the PR change, and what does it say for reviewers and teammates?

<details>
<summary>Answer</summary>

`application.properties` gets `app.mail.password=${MAIL_PASSWORD}`; `.env.example` gets `MAIL_PASSWORD=change-me`; README lists the new variable. The PR description tells teammates to set `MAIL_PASSWORD` locally and asks maintainers to add it to CI/deployment secrets.

</details>

### P4. Portfolio check

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** interview-ready repository

List four checks you'd do on your Spring Boot project before linking it in your CV.

<details>
<summary>Answer</summary>

Any four of: fresh clone builds and tests pass (`./mvnw -B verify`); README with purpose, stack, run and test instructions; no secrets in files or history (scan, rotate if found); no `target/`/IDE files tracked; meaningful recent commit history; a release tag; repository description, topics and licence.

</details>
