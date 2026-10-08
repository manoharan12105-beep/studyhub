# Lab 06 — Connect Spring Boot to PostgreSQL

**Lab:** 06 · **Module:** Docker Networking · **Verification:** Partly tested

> [!NOTE]
> Run on your own machine. **Partly tested:** the Task API's connection to PostgreSQL 18, its Flyway migration and the error messages for a wrong host, an unreachable port and a wrong password were captured from real runs of the JAR (outside Docker). The container networking steps were not executed.

## Objective

Run the Task API container and the PostgreSQL container on one user-defined network, connect them by name, and see Flyway create the schema.

## Prerequisites

- [Lab 04](../lab-spring-boot-in-docker/content.md) (image `taskapi:local`) and [Lab 05](../lab-postgresql-in-docker/content.md).
- Lesson: [Docker Networking](../../docker/docker-networking/content.md).

## Scenario

The application and the database run as separate containers. They must find each other without any port of the database being public.

## Steps

### Step 1: Create a network and start the database on it

```bash
docker rm -f db taskapi 2>/dev/null
docker network create appnet
docker run -d --name db --network appnet \
  -e POSTGRES_DB=taskdb -e POSTGRES_USER=taskapp -e POSTGRES_PASSWORD=dev-only-password \
  -v pgdata6:/var/lib/postgresql postgres:18
```

**Explanation:** no `-p` — only containers on `appnet` can reach the database. A fresh volume `pgdata6` keeps this lab independent of Lab 05.

### Step 2: Start the application on the same network

```bash
docker run -d --name taskapi --network appnet -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/taskdb \
  -e SPRING_DATASOURCE_USERNAME=taskapp \
  -e SPRING_DATASOURCE_PASSWORD=dev-only-password \
  taskapi:local
docker logs -f taskapi
```

**Expected result:** Flyway connects to `jdbc:postgresql://db:5432/taskdb` and applies the first migration. The same lines from the verification run (outside Docker, timestamps removed):

**Output (varies):**

```text
o.f.core.internal.command.DbMigrate      : Current version of schema "public": << Empty Schema >>
o.f.core.internal.command.DbMigrate      : Migrating schema "public" to version "1 - create tasks"
o.f.core.internal.command.DbMigrate      : Successfully applied 1 migration to schema "public", now at version v1 (execution time 00:00.008s)
```

If the database is still initialising when the app starts, the first attempt can fail; `docker restart taskapi` fixes it here, and Compose's health-check dependency solves it properly in Lab 09.

### Step 3: Use the API and look at the data

```bash
curl -s -X POST localhost:8080/api/tasks -H 'Content-Type: application/json' -d '{"title":"Connect to PostgreSQL"}'
docker exec db psql -U taskapp -d taskdb -c "SELECT id, title, done FROM tasks;"
docker exec db psql -U taskapp -d taskdb -c "SELECT version, description FROM flyway_schema_history;"
```

**Expected result:** the API returns the new task; `psql` shows the same row in the `tasks` table and version `1` / `create tasks` in Flyway's history table.

### Step 4: Break it on purpose (three ways)

Recreate the app each time with one change, then read `docker logs taskapi`:

| Change | Real cause line (captured from the Task API) |
|--------|-----------------------------------------------|
| URL host `localhost` instead of `db` | `Connection to localhost:5432 refused. Check that the hostname and port are correct and that the postmaster is accepting TCP/IP connections.` |
| Remove `--network appnet` from the app | `Caused by: java.net.UnknownHostException: db` |
| Wrong `SPRING_DATASOURCE_PASSWORD` | `FATAL: password authentication failed for user "taskapp"` |

(The refused-connection run used port 5999, so its message named `localhost:5999`; with your settings it names `localhost:5432`.) Restore the working command afterwards.

## Verification Checklist

- ☐ The database has no published port, yet the app connects.
- ☐ Flyway created the `tasks` table; the row created through the API is visible in `psql`.
- ☐ You reproduced and recognised all three failure messages.

## Common Mistakes

- `localhost` in the URL; containers on different networks; a typo in the database name.
- Starting the app before the database is ready and concluding the configuration is wrong.

## Troubleshooting

Use the table in Step 4. Also: `docker network inspect appnet` lists the attached containers; `docker run --rm --network appnet postgres:18 pg_isready -h db` tests the database from a throwaway container.
