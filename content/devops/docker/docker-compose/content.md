# Docker Compose

**Module:** Docker · **Interview priority:** Core

## What Is It?

**Docker Compose** describes a multi-container application in one YAML file — `compose.yaml` — and manages it with one command. Instead of typing long `docker network create` and `docker run` lines for PostgreSQL and Spring Boot, you declare the **services**, their **networks**, **volumes**, **environment** and **ports**, and run:

```bash
# Illustrative
docker compose up -d
```

Compose is a plugin of the Docker CLI (`docker compose`, with a space). The older standalone `docker-compose` (with a hyphen) is deprecated.

## Why It Matters

- The whole stack is reproducible from Git: a new developer runs one command; the server runs the same file.
- Compose wires the details you would otherwise get wrong by hand: a private network, DNS by service name, start order, health checks, restart policies.
- On a single VPS, Compose is a complete and professional way to run production — no orchestrator needed.

## How It Works

```text
compose.yaml + .env ──docker compose up -d──►  project "taskapi"
                                                 ├─ network  taskapi_default   (service names resolve)
                                                 ├─ volume   taskapi_pgdata
                                                 ├─ container taskapi-db-1     (service db)
                                                 └─ container taskapi-app-1    (service app)
```

- The **project name** defaults to the folder name; it prefixes networks, volumes and containers.
- Every service joins the project's default network, and **the service name is its DNS name**: the app reaches PostgreSQL at `db:5432`.
- `up` is **declarative**: it creates what is missing, recreates containers whose configuration or image changed, and leaves unchanged ones running.

## The Building Blocks

| Key | Purpose | Example |
|-----|---------|---------|
| `services` | The containers to run, by name | `db`, `app` |
| `image` / `build` | Which image to run, or how to build it | `image: postgres:18`, `build: .` |
| `environment` | Environment variables | `SPRING_PROFILES_ACTIVE: prod` |
| `ports` | Published ports, `"HOST:CONTAINER"` | `"127.0.0.1:8080:8080"` |
| `volumes` | Mounts, and (top level) named volumes | `pgdata:/var/lib/postgresql` |
| `networks` | Custom networks (optional; a default network always exists) | `backend` |
| `depends_on` | Start order, optionally waiting for health | `condition: service_healthy` |
| `healthcheck` | A command Docker runs to decide healthy/unhealthy | `pg_isready …` |
| `restart` | What to do when the container stops | `unless-stopped` |

### Restart policies

| Policy | Restarts after a crash | Restarts after reboot / daemon restart | After you `stop` it |
|--------|------------------------|----------------------------------------|---------------------|
| `no` (default) | No | No | — |
| `on-failure` | Yes, if the exit code is not 0 | No | Stays stopped |
| `always` | Yes | Yes | Starts again when the daemon restarts |
| `unless-stopped` | Yes | Yes, unless you stopped it | Stays stopped |

Production services use `unless-stopped` (or `always`), so the stack comes back after a server reboot without anyone logging in.

### depends_on and health checks

`depends_on: [db]` only orders **start-up**; it does not wait until PostgreSQL accepts connections. The long form waits for the dependency's health check:

```yaml
depends_on:
  db:
    condition: service_healthy
```

A health check is a command Docker runs inside the container at an interval; three outcomes: `starting`, `healthy`, `unhealthy` (shown in `docker compose ps`).

## The Complete compose.yaml

The Task API stack — Spring Boot and PostgreSQL. This file was validated against the official Compose Specification schema:

```yaml
services:
  db:
    image: postgres:18
    restart: unless-stopped
    environment:
      POSTGRES_DB: taskdb
      POSTGRES_USER: taskapp
      POSTGRES_PASSWORD: ${DB_PASSWORD:?Set DB_PASSWORD in .env}
    volumes:
      - pgdata:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taskapp -d taskdb"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    image: ${APP_IMAGE:-taskapi:local}
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      SPRING_PROFILES_ACTIVE: prod
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/taskdb
      SPRING_DATASOURCE_USERNAME: taskapp
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD:?Set DB_PASSWORD in .env}
      APP_VERSION: ${APP_IMAGE:-taskapi:local}
    ports:
      - "127.0.0.1:8080:8080"
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:8080/actuator/health/readiness"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 60s

volumes:
  pgdata:
```

| Line | Why |
|------|-----|
| `${DB_PASSWORD:?…}` | Read from `.env`; if missing, Compose stops with that message instead of starting with an empty password |
| `${APP_IMAGE:-taskapi:local}` | Locally the image you built; on the server, the registry image set in `.env` |
| `db` has no `ports` | Reachable only by the app over the project network |
| `jdbc:postgresql://db:5432/…` | The **service name**, never `localhost` |
| `"127.0.0.1:8080:8080"` | Reachable from this machine (and Nginx on it) only |
| `condition: service_healthy` | The app starts only after `pg_isready` succeeds |
| `start_period: 60s` | Failures during JVM start-up do not count against the app |
| `APP_VERSION` | `/api/info` reports which image is running |

The application health check uses `curl`, which the `eclipse-temurin` base images include; with a base image that lacks it, install it or use another check.

The `.env` file next to it (never committed — see [Configuration and Secrets](../../production-readiness/configuration-and-secrets/content.md)):

```properties
DB_PASSWORD=change-me-to-a-long-random-value
```

## Commands

```bash
# Illustrative: in the folder with compose.yaml
docker build -t taskapi:local .          # build the app image first (or add build: . to the service)
docker compose config                    # validate and print the final config with variables filled in
docker compose up -d                     # create network, volume, containers; start in the background
docker compose ps                        # services, state and health
docker compose logs -f --tail 100 app    # follow one service's logs
docker compose exec db psql -U taskapp -d taskdb   # a SQL prompt in the db service
docker compose stop                      # stop containers, keep them
docker compose start                     # start them again
docker compose restart app               # restart one service
docker compose pull                      # download newer images for services that use image:
docker compose up -d                     # after a pull or a config change: recreate what changed
docker compose down                      # remove containers and network — volumes stay
docker compose down -v                   # ALSO remove named volumes: deletes the database
```

**Expected result of `up -d`:** Compose prints the network, volume and both containers as `Created`/`Started`; `app` waits until `db` is `Healthy`. `docker compose ps` then lists `taskapi-db-1` as `Up … (healthy)` and, about a minute later, `taskapi-app-1` as `Up … (healthy)` with `127.0.0.1:8080->8080/tcp`.

## down vs down -v

| Command | Containers | Network | Named volumes (database) |
|---------|------------|---------|--------------------------|
| `docker compose stop` | Stopped, kept | Kept | Kept |
| `docker compose down` | Removed | Removed | **Kept** |
| `docker compose down -v` | Removed | Removed | **Deleted** |

> [!CAUTION]
> `down -v` is for resetting a *development* database. On a server, it deletes production data. Never put it in a script.

## Example: Changing One Thing

You raise the app's log level by adding `LOGGING_LEVEL_COM_EXAMPLE: DEBUG` under `app.environment` and run `docker compose up -d` again.

**Expected result:** Compose reports `db` as `Running` (unchanged) and **recreates** only `app` with the new environment. This is how configuration changes and new image versions are deployed: edit, then `up -d`.

## Production Relevance

- On a VPS, `compose.yaml` plus a protected `.env` is the deployment's single source of truth.
- Health checks + `depends_on: service_healthy` + `restart: unless-stopped` give ordered start-up and self-healing after crashes and reboots.
- The deploy script in [CD and Automated Deployment](../../ci-cd/cd-automated-deployment/content.md) is just `docker compose pull app` and `docker compose up -d app` plus a health check.

## Common Mistakes

- `localhost` in `SPRING_DATASOURCE_URL` instead of the service name.
- Short-form `depends_on` and then "connection refused" because PostgreSQL was still initialising.
- Publishing the database port; publishing the app on `0.0.0.0` on a server.
- Passwords written directly in `compose.yaml` and committed.
- The obsolete top-level `version:` key (modern Compose ignores it and warns).
- `down -v` to "clean up".

## Interview Angle

- Explain what `docker compose up -d` creates and how service names become DNS names.
- Explain `depends_on` vs health checks, and the restart policies.
- Explain `down` vs `down -v`.

## Key Takeaways

- One `compose.yaml` declares services, networks, volumes, environment, ports, health checks and restart policies.
- Service names are host names on the project network: `db:5432`.
- `depends_on` with `condition: service_healthy` waits for real readiness; `restart: unless-stopped` survives crashes and reboots.
- `up -d` recreates only what changed; `down` keeps volumes; `down -v` deletes them.
