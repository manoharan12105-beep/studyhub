# PostgreSQL in Docker — Practice

### P1. Survives what?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** container deletion vs data deletion

PostgreSQL runs with `-v pgdata:/var/lib/postgresql`. Which command deletes the data?

- A) `docker stop db`
- B) `docker rm -f db`
- C) `docker volume rm pgdata`
- D) `docker restart db`

<details>
<summary>Answer</summary>

**Answer:** C) `docker volume rm pgdata`

</details>

### P2. Required variable

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** postgres image configuration

Which variable must be set for the official image to initialise a new database (with default authentication)?

- A) `POSTGRES_DB`
- B) `POSTGRES_USER`
- C) `POSTGRES_PASSWORD`
- D) `PGDATA`

<details>
<summary>Answer</summary>

**Answer:** C) `POSTGRES_PASSWORD`

</details>

### P3. Correct mount path

**Difficulty:** Easy · **Type:** Configuration · **Concepts:** volume path by version

Write the `-v` option that keeps the data of a `postgres:18` container in the named volume `pgdata`.

<details>
<summary>Answer</summary>

`-v pgdata:/var/lib/postgresql` (for `postgres:17` and earlier: `-v pgdata:/var/lib/postgresql/data`).

</details>

### P4. Local tools only

**Difficulty:** Medium · **Type:** Command · **Concepts:** port mapping

PostgreSQL 16 is already installed on your laptop on port 5432. Run `postgres:18` as `db` with a named volume, reachable by tools on your laptop only, on port 15432.

<details>
<summary>Answer</summary>

```bash
# Illustrative
docker run -d --name db -e POSTGRES_PASSWORD=devpass \
  -v pgdata:/var/lib/postgresql -p 127.0.0.1:15432:5432 postgres:18
```

Connect with `psql -h localhost -p 15432 -U postgres`.

</details>

### P5. Password changed, login fails

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** init-only variables

You changed `POSTGRES_PASSWORD` from `old` to `new` and recreated `db` with the same volume. The app (now using `new`) logs `FATAL: password authentication failed for user "taskapp"`. Give the fix that keeps the data.

<details>
<summary>Answer</summary>

Set the password inside the database to match:

```bash
# Illustrative
docker exec -it db psql -U taskapp -d taskdb -c "ALTER ROLE taskapp PASSWORD 'new';"
```

(Local connections inside the container are trusted by the image's default `pg_hba.conf`, so no password is asked.) The variable is read only on first initialisation.

</details>

### P6. Back it up

**Difficulty:** Medium · **Type:** Command · **Concepts:** pg_dump

Write a compressed custom-format backup of database `taskdb` (user `taskapp`) from container `db` to `taskdb.dump` on the host.

<details>
<summary>Answer</summary>

```bash
# Illustrative
docker exec db pg_dump -U taskapp -d taskdb -Fc > taskdb.dump
```

</details>

### P7. Restore it

**Difficulty:** Medium · **Type:** Command · **Concepts:** pg_restore

Restore `taskdb.dump` into the running container `db`, replacing existing objects.

<details>
<summary>Answer</summary>

```bash
# Illustrative
docker exec -i db pg_restore -U taskapp -d taskdb --clean --if-exists < taskdb.dump
```

`-i` keeps stdin open so the file reaches `pg_restore` inside the container.

</details>

### P8. down or down -v?

**Difficulty:** Medium · **Type:** Output · **Concepts:** Compose and volumes

A Compose project defines volume `pgdata` for `db`. Predict whether the tasks are still there after: (a) `docker compose down` then `up -d`; (b) `docker compose down -v` then `up -d`.

<details>
<summary>Answer</summary>

(a) Yes — `down` keeps named volumes. (b) No — `-v` removes them; PostgreSQL initialises an empty database and Flyway recreates the empty `tasks` table.

</details>

### P9. Where is the data really?

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** wrong mount path

With `postgres:16`, a teammate mounted `-v pgdata:/var/lib/pgsql`. Everything works until the container is recreated, then the data is gone. Explain.

<details>
<summary>Answer</summary>

`/var/lib/pgsql` is not where this image stores data (`/var/lib/postgresql/data` for version 16), so the volume was mounted somewhere unused and PostgreSQL wrote to the container's writable layer. Recreating the container discarded it. Check with `docker inspect -f '{{json .Mounts}}' db` and the `PGDATA` value.

</details>

### P10. Backup strategy

**Difficulty:** Hard · **Type:** Decision · **Concepts:** backup strategy

Your VPS runs a nightly `pg_dump` into `/opt/taskapi/backups`. List three improvements.

<details>
<summary>Answer</summary>

Copy each dump off the server (object storage or another machine); keep several generations with a retention policy (for example 7 daily, 4 weekly); encrypt backups that leave the server; test a restore regularly (into a scratch container); monitor that the job ran and the file is not empty; and decide whether a day of possible data loss is acceptable.

</details>
