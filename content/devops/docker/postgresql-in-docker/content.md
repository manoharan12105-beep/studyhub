# PostgreSQL in Docker: Volumes, Backup and Restore

**Module:** Docker · **Interview priority:** Core

## What Is It?

The official `postgres` image runs a complete PostgreSQL server in a container, configured by environment variables. The one thing a database container must never do is keep its data **inside** the container — so this lesson is mostly about **volumes**: where PostgreSQL's files live, why they survive container deletion, and how to back them up and restore them.

```text
container "db" (replaceable)                     volume "pgdata" (persistent)
┌──────────────────────────────┐   mounted at    ┌──────────────────────────┐
│ postgres:18 image (read-only)│ ──────────────► │ PostgreSQL data files    │
│ + writable layer (temporary) │ /var/lib/       │ survives docker rm,      │
└──────────────────────────────┘  postgresql     │ upgrades, re-creation    │
                                                 └──────────────────────────┘
```

## Why It Matters

- Running PostgreSQL in Docker is the standard way to give every developer and every small deployment the same database version in seconds.
- Losing data because a container was removed is the most expensive beginner mistake in this subject.
- Interviewers ask: "If you delete the PostgreSQL container, is the data gone?" — the answer is "it depends on the volume", and you should be able to explain exactly how.

## The PostgreSQL Container

```bash
# Illustrative: run on a machine with Docker
docker run -d --name db \
  -e POSTGRES_DB=taskdb \
  -e POSTGRES_USER=taskapp \
  -e POSTGRES_PASSWORD=devpass \
  -v pgdata:/var/lib/postgresql \
  postgres:18
```

| Variable | Meaning |
|----------|---------|
| `POSTGRES_PASSWORD` | **Required**: password of the superuser created on first start |
| `POSTGRES_USER` | Name of that superuser (default `postgres`) |
| `POSTGRES_DB` | Database created on first start (default: same as the user) |
| `PGDATA` | Data directory inside the container (the image sets a sensible default) |

> [!WARNING]
> **Common trap:** these variables are used **only when the data directory is empty** — on the very first start. Changing `POSTGRES_PASSWORD` later and recreating the container does **not** change the password stored in the existing volume. Change it with SQL (`ALTER ROLE taskapp PASSWORD '…'`) instead.

## Database Initialization

On the first start (empty data directory) the image runs every `*.sql`, `*.sql.gz` and `*.sh` file in `/docker-entrypoint-initdb.d/`, in name order:

```bash
# Illustrative
docker run -d --name db -e POSTGRES_PASSWORD=devpass \
  -v pgdata:/var/lib/postgresql \
  -v "$(pwd)/init":/docker-entrypoint-initdb.d:ro \
  postgres:18
```

Good for seeding a development database. For an application's schema, prefer migrations run by the application (the Task API uses **Flyway**: `src/main/resources/db/migration/V1__create_tasks.sql`), because migrations also handle every later change — init scripts run only once.

## Port Mapping

| Setting | Who can connect | When |
|---------|-----------------|------|
| no `-p` | Only containers on the same network | **Production** |
| `-p 127.0.0.1:5432:5432` | Tools on this machine (psql, DBeaver, IntelliJ) | Local development |
| `-p 5432:5432` | Anyone who can reach the host on 5432 | Avoid — and remember Docker bypasses ufw |

If PostgreSQL is already installed on your machine and uses 5432, map another host port: `-p 127.0.0.1:15432:5432`.

## Persistent Storage: Named Volumes and Bind Mounts

| | Named volume | Bind mount | No mount |
|---|---|---|---|
| Syntax | `-v pgdata:/var/lib/postgresql` | `-v /srv/pgdata:/var/lib/postgresql` | — |
| Stored in | Docker's area (`/var/lib/docker/volumes/`) | A host folder you choose | The container's writable layer |
| Created by | Docker, on first use | You (the folder) | — |
| Survives `docker rm` | **Yes** | **Yes** | **No** |
| Permissions handled | By Docker and the image | By you (UID/GID must match) | — |
| Best for | Database data | Config files, source code in development, init scripts | Nothing that matters |

For PostgreSQL, use a **named volume**. Bind mounts work too, but file ownership on the host must match the `postgres` user inside the container, which is a common source of "permission denied" errors.

```bash
# Illustrative
docker volume ls
docker volume inspect pgdata        # Mountpoint shows where Docker keeps it
```

> [!IMPORTANT]
> **Mount path depends on the PostgreSQL major version.** From `postgres:18` the image keeps data in a version-specific subdirectory and declares the volume at `/var/lib/postgresql`; mount there. Up to `postgres:17` the path was `/var/lib/postgresql/data`. Most older tutorials use the old path — with an 18+ image, a mount at `/var/lib/postgresql/data` is detected by the image's start-up script, which refuses to continue and explains the move.

## Container Deletion vs Data Deletion

```text
docker stop db          → container stopped; data intact
docker rm db            → container deleted;  data intact IN THE VOLUME
docker run … -v pgdata  → new container, same data
docker volume rm pgdata → data deleted (no undo)
docker compose down     → containers and network removed; named volumes kept
docker compose down -v  → also removes the named volumes declared in compose.yaml: DATA DELETED
```

> [!CAUTION]
> `docker compose down -v` and `docker volume rm` destroy the database. Take a backup first, and never put them in a deployment script.

## Backup Basics

`pg_dump` makes a consistent logical backup while the database is running. Run it **inside** the container with `docker exec` and write the output **on the host**:

```bash
# Illustrative: custom format (compressed, restorable with pg_restore)
docker exec db pg_dump -U taskapp -d taskdb -Fc > taskdb-$(date +%F).dump

# Illustrative: plain SQL (readable, restorable with psql)
docker exec db pg_dump -U taskapp -d taskdb > taskdb-$(date +%F).sql
```

Do **not** add `-t` to `docker exec` here: a terminal (TTY) can alter binary output and corrupt the dump.

A backup that only exists on the same server dies with the server — copy it elsewhere (another machine, object storage) and test restoring it regularly.

## Restore Basics

```bash
# Illustrative: custom format — -i passes the file on stdin into the container
docker exec -i db pg_restore -U taskapp -d taskdb --clean --if-exists < taskdb-2026-01-15.dump

# Illustrative: plain SQL
docker exec -i db psql -U taskapp -d taskdb < taskdb-2026-01-15.sql
```

`--clean --if-exists` drops existing objects before recreating them, so restoring over a database that already has the tables works. These `pg_dump` and `pg_restore` options were tested against PostgreSQL 18 (outside Docker): a custom-format dump, a `DELETE` of every row, and a restore from stdin brought back every row.

## Example: Proving Persistence

```bash
# Illustrative: run on a machine with Docker
docker run -d --name db -e POSTGRES_PASSWORD=devpass -v pgdata:/var/lib/postgresql postgres:18
sleep 5
docker exec db psql -U postgres -c "CREATE TABLE notes(id int, body text);"
docker exec db psql -U postgres -c "INSERT INTO notes VALUES (1, 'still here');"

docker rm -f db                                   # delete the container
docker run -d --name db -e POSTGRES_PASSWORD=devpass -v pgdata:/var/lib/postgresql postgres:18
sleep 5
docker exec db psql -U postgres -c "SELECT * FROM notes;"
```

**Expected result:** the final `SELECT` returns the row `1 | still here` — the new container mounted the same volume. Repeat the experiment **without** `-v pgdata:…`, and the final `SELECT` fails with `relation "notes" does not exist`. [Lab 07](../../labs/lab-persistent-postgresql-volume/content.md) is this experiment with the Task API.

## Production Relevance

- The volume, not the container, is the precious part of a database deployment. Back it up and protect it from `down -v`.
- Pin the major version (`postgres:18`): a new major version cannot read an older data directory without an upgrade (`pg_upgrade` or dump and restore).
- Keep the database unpublished and on an internal network.

## Common Mistakes

- Running PostgreSQL with no volume (or with the wrong mount path, which leaves the real data in the container layer).
- Changing `POSTGRES_PASSWORD` and expecting the existing database to follow.
- Using `postgres:latest`, which jumps major versions.
- `docker exec -t` for a binary dump; backups kept only on the same server; never testing a restore.
- Publishing 5432 to the internet.

## Interview Angle

- Explain named volume vs bind mount, and which one you choose for a database and why.
- Explain what `docker rm`, `docker compose down` and `docker compose down -v` each do to the data.
- Describe a backup and restore with `pg_dump`/`pg_restore` through `docker exec`.

## Key Takeaways

- Data written inside a container dies with it; PostgreSQL's data directory must be on a volume.
- `postgres:18` → mount at `/var/lib/postgresql`; `postgres:17` and earlier → `/var/lib/postgresql/data`.
- `POSTGRES_*` variables and init scripts apply only to an empty data directory.
- `down` keeps volumes, `down -v` deletes them. Back up with `pg_dump -Fc`, restore with `pg_restore --clean --if-exists`, and keep copies off the server.
