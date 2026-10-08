# Lab 07 — Interview Questions

## Beginner

### Q1. Which commands delete a database's data when PostgreSQL uses a named volume?

**Style:** What

<details>
<summary>Answer</summary>

`docker volume rm <volume>`, `docker compose down -v` (for volumes declared in the Compose file), and `docker volume prune --all` if the volume is unused at that moment. `docker stop`, `docker rm` and `docker compose down` keep it.

</details>

## Intermediate

### Q2. How do you prove a backup is good?

**Style:** How

<details>
<summary>Answer</summary>

Restore it: into a scratch container or database (`pg_restore --clean --if-exists`), then check row counts or run the application against it. A backup that has never been restored is only a hope.

</details>

### Q3. Why must `docker exec` for `pg_dump -Fc` not use `-t`?

**Style:** Why

<details>
<summary>Answer</summary>

`-t` allocates a pseudo-terminal, which can translate line endings and control characters in the output stream; the custom-format dump is binary, so it may be corrupted. Without `-t`, stdout is a clean byte stream redirected to the file.

</details>
