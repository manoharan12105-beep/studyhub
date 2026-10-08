# Lab 07 — Persistent PostgreSQL Volume

**Lab:** 07 · **Module:** PostgreSQL in Docker · **Verification:** Instruction only

> [!NOTE]
> Run on your own machine. **Instruction only** for the Docker steps (not executed when written). The `pg_dump`/`pg_restore` options in Step 5 were tested against PostgreSQL 18 outside Docker.

## Objective

Prove that the Task API's data survives deleting and recreating the PostgreSQL container, see what destroys it, and take and restore a backup.

## Prerequisites

- [Lab 06](../lab-connect-spring-boot-to-postgresql/content.md) running (`db` with volume `pgdata6`, `taskapi` on `appnet`).
- Lesson: [PostgreSQL in Docker](../../docker/postgresql-in-docker/content.md).

## Scenario

A colleague asks: "If we redeploy the database container, do we lose the tasks?" You answer with an experiment, not an opinion.

## Steps

### Step 1: Create data

```bash
for t in "Persist me" "Me too"; do
  curl -s -X POST localhost:8080/api/tasks -H 'Content-Type: application/json' -d "{\"title\":\"$t\"}"; echo
done
curl -s localhost:8080/api/tasks
```

### Step 2: Delete and recreate the database container

```bash
docker rm -f db
docker run -d --name db --network appnet \
  -e POSTGRES_DB=taskdb -e POSTGRES_USER=taskapp -e POSTGRES_PASSWORD=dev-only-password \
  -v pgdata6:/var/lib/postgresql postgres:18
sleep 5
docker restart taskapi
curl -s localhost:8080/api/tasks
```

**Expected result:** all tasks are still listed. The container was new; the **volume** was the same. The new container's log says the database directory already contains a database and skips initialisation.

### Step 3: Repeat without a volume (the anti-pattern)

```bash
docker rm -f db
docker run -d --name db --network appnet \
  -e POSTGRES_DB=taskdb -e POSTGRES_USER=taskapp -e POSTGRES_PASSWORD=dev-only-password \
  postgres:18
sleep 5 && docker restart taskapi && sleep 20
curl -s localhost:8080/api/tasks
```

**Expected result:** `[]` — an empty list. Flyway recreated an empty `tasks` table in a database that lived only in this container's writable layer (strictly, in an anonymous volume that a new container does not reuse). Deleting this container would lose whatever you add now.

### Step 4: Go back to the named volume

```bash
docker rm -f db
docker run -d --name db --network appnet \
  -e POSTGRES_DB=taskdb -e POSTGRES_USER=taskapp -e POSTGRES_PASSWORD=dev-only-password \
  -v pgdata6:/var/lib/postgresql postgres:18
sleep 5 && docker restart taskapi
curl -s localhost:8080/api/tasks
```

**Expected result:** your original tasks are back — they never left `pgdata6`.

### Step 5: Back up and restore

```bash
docker exec db pg_dump -U taskapp -d taskdb -Fc > taskdb.dump
ls -l taskdb.dump
docker exec db psql -U taskapp -d taskdb -c "DELETE FROM tasks;"
curl -s localhost:8080/api/tasks                          # []
docker exec -i db pg_restore -U taskapp -d taskdb --clean --if-exists < taskdb.dump
curl -s localhost:8080/api/tasks                          # tasks are back
```

**Explanation:** no `-t` on the `pg_dump` exec (a TTY can corrupt binary output); `-i` on the restore so the file reaches `pg_restore` through stdin. These exact `pg_dump -Fc` and `pg_restore --clean --if-exists` options were verified: after deleting every row, the restore from stdin brought them back.

### Step 6: See what really deletes data

```bash
docker volume ls | grep pgdata6
docker rm -f db taskapi
docker volume rm pgdata6        # THIS deletes the data
```

## Verification Checklist

- ☐ Data survived `docker rm -f db` with the named volume.
- ☐ Data was absent with no volume.
- ☐ You restored a deleted table's rows from a dump.
- ☐ You can name the commands that delete data (`docker volume rm`, `docker compose down -v`, `docker volume prune -a`).

## Common Mistakes

- A wrong mount path, which looks like Step 3 (data gone after recreation).
- Backups stored only next to the database.
- `docker exec -it … pg_dump > file` (TTY) producing a broken dump.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `pg_restore: error: input file does not appear to be a valid archive` | The dump was written with `-t`, or is a plain SQL dump (restore that with `psql`) |
| Data gone after recreation | Check `docker inspect -f '{{json .Mounts}}' db`: is `pgdata6` mounted at `/var/lib/postgresql`? |
| App errors after the database restart | It lost its connections; Hikari reconnects, or `docker restart taskapi` |
