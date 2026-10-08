# Lab 06 — Interview Questions

## Beginner

### Q1. How does the Task API container find the database container?

**Style:** How

<details>
<summary>Answer</summary>

Both are attached to the user-defined network `appnet`; Docker's embedded DNS resolves the container name `db` to the database container's IP, so the URL is `jdbc:postgresql://db:5432/taskdb`.

</details>

## Intermediate

### Q2. Distinguish `UnknownHostException: db` from `Connection to localhost:5432 refused`.

**Style:** Comparison

<details>
<summary>Answer</summary>

`UnknownHostException` is a DNS failure: the name `db` does not exist on the app's network (wrong network, wrong name). "Connection refused" means the name resolved (here `localhost`, the app container itself) but nothing listens on that port. The first is fixed by network membership or the name; the second by pointing at the right host.

</details>

### Q3. Why should the schema be created by Flyway rather than an init script in the database container?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Init scripts run only when the database is first created; Flyway runs on every application start, applies only the migrations not yet recorded in `flyway_schema_history`, and versions every later change together with the code that needs it.

</details>
