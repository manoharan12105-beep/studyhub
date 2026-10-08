# Lab 09 — Docker Compose Application

**Lab:** 09 · **Module:** Docker Compose · **Verification:** Partly tested

> [!NOTE]
> Run on your own machine. **Partly tested:** the `compose.yaml` was validated against the official Compose Specification schema; the application it starts was tested outside Docker. The `docker compose` commands were not executed when this lab was written.

## Objective

Replace the long `docker run` commands of Labs 05–08 with one `compose.yaml`, start the whole stack with one command, and practise the Compose lifecycle — including the difference between `down` and `down -v`.

## Prerequisites

- Image `taskapi:local` ([Lab 04](../lab-spring-boot-in-docker/content.md)); containers from earlier labs removed (`docker rm -f db taskapi`).
- Lesson: [Docker Compose](../../docker/docker-compose/content.md).

## Scenario

A new teammate should be able to run the full Task API stack with one command after cloning the repository.

## Steps

### Step 1: Create compose.yaml and .env

Copy the complete `compose.yaml` from [Docker Compose](../../docker/docker-compose/content.md) into the project root. Then:

```bash
cp .env.example .env
# edit .env: set DB_PASSWORD to any long value; keep APP_IMAGE=taskapi:local
docker compose config
```

**Expected result:** `config` prints the resolved file with your password filled in (do not share this output). Without `DB_PASSWORD` it stops with `Set DB_PASSWORD in .env`.

### Step 2: Start the stack

```bash
docker compose up -d
docker compose ps
```

**Expected result:** Compose creates the network `taskapi_default`, the volume `taskapi_pgdata` and the containers `taskapi-db-1` and `taskapi-app-1` (the prefix is your folder name). `db` becomes `healthy`; only then does `app` start; after about a minute it is `healthy` too, with `127.0.0.1:8080->8080/tcp`.

### Step 3: Use it and read logs

```bash
curl -s -X POST localhost:8080/api/tasks -H 'Content-Type: application/json' -d '{"title":"Compose works"}'
curl -s localhost:8080/api/info
docker compose logs --tail 20 app
docker compose exec db psql -U taskapp -d taskdb -c "SELECT * FROM tasks;"
```

**Expected result:** the task is created; `/api/info` reports `"version":"taskapi:local"` (Compose passes `APP_IMAGE` as `APP_VERSION`) and `"profiles":"prod"`.

### Step 4: Stop, start, change

```bash
docker compose stop
docker compose ps -a          # both Exited
docker compose start
```

Add `LOGGING_LEVEL_COM_EXAMPLE: DEBUG` under `app.environment`, then:

```bash
docker compose up -d
```

**Expected result:** Compose reports `db` as running (untouched) and recreates only `app`.

### Step 5: down vs down -v

```bash
docker compose down
docker volume ls | grep pgdata         # still there
docker compose up -d && sleep 60
curl -s localhost:8080/api/tasks        # "Compose works" is still there

docker compose down -v
docker volume ls | grep pgdata         # gone
docker compose up -d && sleep 60
curl -s localhost:8080/api/tasks        # []
```

## Verification Checklist

- ☐ One command starts both services; `app` waits for a healthy `db`.
- ☐ No database port is published; the app is published only on `127.0.0.1`.
- ☐ A config change recreated only the changed service.
- ☐ Data survived `down` and was deleted by `down -v`.

## Common Mistakes

- Running Compose in a folder without `.env`.
- `localhost` instead of `db` in `SPRING_DATASOURCE_URL`.
- Using `down -v` to "restart cleanly" and losing data.
- Forgetting to rebuild `taskapi:local` after code changes (Compose runs whatever image has that tag).

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `app` stays `starting`/`unhealthy` | `docker compose logs app`; check the datasource variables |
| `password authentication failed` after changing `DB_PASSWORD` | The volume was initialised with the old one: change it with `ALTER ROLE` or reset dev data with `down -v` |
| `pull access denied for taskapi` | The local image does not exist: `docker build -t taskapi:local .` |
