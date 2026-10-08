# Lab 05 — Interview Questions

## Beginner

### Q1. How do you check that a PostgreSQL container is ready for connections?

**Style:** How

<details>
<summary>Answer</summary>

`docker exec db pg_isready -U taskapp -d taskdb` (the same command Compose health checks use), or the log line `database system is ready to accept connections`.

</details>

## Intermediate

### Q2. You recreated the database container with a new `POSTGRES_PASSWORD`, and the old password still works. Why?

**Style:** Trap

<details>
<summary>Answer</summary>

The variable is only used to initialise an empty data directory. The volume already contained an initialised database whose role kept its password. Change passwords with `ALTER ROLE` inside PostgreSQL.

</details>

### Q3. Why publish PostgreSQL on `127.0.0.1:5432` during development rather than `5432`?

**Style:** Why

<details>
<summary>Answer</summary>

`127.0.0.1` limits access to your own machine, which is all your tools need. Plain `5432:5432` listens on every interface, so anyone on the same network (or the internet, on a server — Docker bypasses ufw) could try to connect.

</details>
