# Lab 05 — Run PostgreSQL Inside Docker

**Lab:** 05 · **Module:** PostgreSQL in Docker · **Verification:** Instruction only

> [!NOTE]
> Run on your own machine. **Instruction only:** not executed when written (no Docker available); results are described.

## Objective

Run PostgreSQL 18 in a container with a named volume, connect with `psql`, create data, and check the container's health.

## Prerequisites

- Docker; [Lab 01](../lab-first-docker-container/content.md).
- Lesson: [PostgreSQL in Docker](../../docker/postgresql-in-docker/content.md).

## Scenario

Every developer on the team needs the same PostgreSQL version as production without installing it. You give them one command.

## Steps

### Step 1: Start PostgreSQL

```bash
docker run -d --name db \
  -e POSTGRES_DB=taskdb \
  -e POSTGRES_USER=taskapp \
  -e POSTGRES_PASSWORD=dev-only-password \
  -v pgdata:/var/lib/postgresql \
  -p 127.0.0.1:5432:5432 \
  postgres:18
docker logs -f db
```

**Expected result:** on the first start the logs show the database being initialised, then `database system is ready to accept connections`. Ctrl+C stops following.

If PostgreSQL is already installed on your machine on 5432, use `-p 127.0.0.1:15432:5432` and port 15432 below.

### Step 2: Check readiness

```bash
docker exec db pg_isready -U taskapp -d taskdb
docker volume ls
```

**Expected result:** `pg_isready` reports that the server is accepting connections; `docker volume ls` lists `pgdata`.

### Step 3: Connect with psql inside the container

```bash
docker exec -it db psql -U taskapp -d taskdb
```

```sql
-- Illustrative
SELECT version();
CREATE TABLE notes (id serial PRIMARY KEY, body text NOT NULL);
INSERT INTO notes (body) VALUES ('created in Lab 05');
SELECT * FROM notes;
\q
```

**Expected result:** the version string says PostgreSQL 18; the `SELECT` returns your row.

### Step 4: Connect from the host (optional)

With a PostgreSQL client installed on your machine (or a GUI such as DBeaver):

```bash
psql -h 127.0.0.1 -p 5432 -U taskapp -d taskdb -c "SELECT count(*) FROM notes;"
```

**Expected result:** after the password prompt (`dev-only-password`), `count` is `1`. The `127.0.0.1:` prefix in `-p` means only your machine can connect.

### Step 5: Observe the first-start-only rule

```bash
docker rm -f db
docker run -d --name db -e POSTGRES_PASSWORD=another-password \
  -v pgdata:/var/lib/postgresql -p 127.0.0.1:5432:5432 postgres:18
docker exec db psql -U taskapp -d taskdb -c "SELECT body FROM notes;"
```

**Expected result:** the logs say the database directory already contains a database and initialisation is skipped. The row is still there, and the password of `taskapp` is still `dev-only-password` — `POSTGRES_*` variables apply only to an empty data directory.

Keep this container for Lab 06 (or recreate it with Step 1's command).

## Verification Checklist

- ☐ `pg_isready` reports accepting connections.
- ☐ You created and read a table with `psql` inside the container.
- ☐ After recreating the container the data was still there.
- ☐ You can explain why the new `POSTGRES_PASSWORD` had no effect.

## Common Mistakes

- Mounting `/var/lib/postgresql/data` with `postgres:18` (the image refuses to start; that path is for 17 and earlier).
- Publishing `5432:5432` on all interfaces.
- Forgetting `POSTGRES_PASSWORD` on the very first start (the container exits with an error explaining it is required).

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Container exits at once; logs say the superuser password is not specified | Set `POSTGRES_PASSWORD` |
| `port is already allocated` | A local PostgreSQL uses 5432: publish `127.0.0.1:15432:5432` |
| `psql: … connection refused` from the host | The port is not published, or the server is still starting (`docker logs db`) |
| Logs mention old databases or an unused mount at `/var/lib/postgresql/data` | Mount the volume at `/var/lib/postgresql` for `postgres:18` |
