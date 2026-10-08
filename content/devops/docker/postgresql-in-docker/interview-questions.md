# PostgreSQL in Docker — Interview Questions

## Beginner

### Q1. If you delete the PostgreSQL container, is the data gone?

**Style:** What happens if

<details>
<summary>Answer</summary>

It depends on where the data lives. If the data directory is on a named volume or a bind mount, the data survives `docker rm`, and a new container mounting the same volume sees it. If there was no volume, the data was in the container's writable layer and is deleted with the container.

</details>

### Q2. What is the difference between a named volume and a bind mount?

**Style:** Comparison

<details>
<summary>Answer</summary>

A named volume is created and managed by Docker (stored under Docker's data directory) and referenced by name: `-v pgdata:/var/lib/postgresql`. A bind mount maps a specific host path into the container: `-v /srv/pgdata:/var/lib/postgresql`; you manage the folder and its permissions. Named volumes are preferred for database data; bind mounts suit configuration files and source code during development.

</details>

### Q3. Which environment variables configure the official postgres image?

**Style:** What

<details>
<summary>Answer</summary>

`POSTGRES_PASSWORD` (required), `POSTGRES_USER` (default `postgres`), `POSTGRES_DB` (default: the user name), and optionally `PGDATA` and `POSTGRES_INITDB_ARGS`. They take effect only when the data directory is empty, on the first start.

</details>

### Q4. Should you publish PostgreSQL's port in production?

**Style:** Why

<details>
<summary>Answer</summary>

No. The application reaches the database over the internal Docker network by name, so no published port is needed. Publishing 5432 exposes the database to anyone who can reach the server — and Docker's port publishing bypasses ufw rules. For local development, publish only on `127.0.0.1`.

</details>

## Intermediate

### Q5. You changed `POSTGRES_PASSWORD` in `compose.yaml` and recreated the container, and now the application cannot log in. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

The variable is used only when the database is initialised. The existing volume still holds the old password; the app now sends the new one and gets `password authentication failed`. Either revert the variable, or change the password inside PostgreSQL (`ALTER ROLE taskapp PASSWORD '…'`) to match.

</details>

### Q6. What is the difference between `docker compose down` and `docker compose down -v`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`down` stops and removes the project's containers and networks but keeps named volumes, so the database survives. `down -v` also removes the named volumes declared in the Compose file and anonymous volumes — deleting the database data permanently.

</details>

### Q7. How do you back up and restore a PostgreSQL database running in a container?

**Style:** How

<details>
<summary>Answer</summary>

Backup: `docker exec db pg_dump -U taskapp -d taskdb -Fc > taskdb.dump` (no `-t`, so binary output is not altered by a TTY). Restore: `docker exec -i db pg_restore -U taskapp -d taskdb --clean --if-exists < taskdb.dump`. Copy backups off the server and test restores regularly.

</details>

### Q8. When do scripts in `/docker-entrypoint-initdb.d` run, and why not use them for schema changes?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Only when the container starts with an empty data directory — the first start. Later schema changes would never run on an existing database. Application schemas belong in versioned migrations (Flyway or Liquibase) that run on every deployment and record which versions were applied.

</details>

## Advanced

### Q9. After switching from `postgres:17` to `postgres:18` in Compose, the database container exits on start. What happened?

**Style:** Production failure

<details>
<summary>Answer</summary>

Two possible causes. A data directory written by PostgreSQL 17 cannot be opened by 18; a major upgrade needs `pg_upgrade` or a dump and restore. And from version 18 the image expects its volume at `/var/lib/postgresql` (data in a version-specific subdirectory) instead of `/var/lib/postgresql/data`; a mount at the old path is detected and the entrypoint refuses to start. Back up, then upgrade deliberately; never change a major version tag casually.

</details>

### Q10. Is a nightly `pg_dump` on the same VPS a sufficient backup strategy?

**Style:** Trade-off

<details>
<summary>Answer</summary>

No. If the server or its disk is lost, the backups go with it. Copy dumps to another location (object storage, another machine), keep several generations, encrypt them, and regularly test a restore. Also decide the acceptable data loss (RPO): a nightly dump can lose up to a day; tighter targets need WAL archiving / point-in-time recovery or a managed database.

</details>
