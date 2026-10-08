# Docker Compose

## Commands

| Command | Does |
|---------|------|
| `docker compose config` | Validate + show interpolated config |
| `docker compose up -d` | Create/recreate what changed, start in background |
| `docker compose up -d --build` | Rebuild services with `build:` first |
| `docker compose ps` | State and health |
| `docker compose logs -f --tail 100 app` | Follow one service |
| `docker compose exec db psql -U u -d db` | Command in a running service |
| `docker compose exec -T db pg_dump …` | Same, without TTY (scripts, cron) |
| `docker compose pull` | Newer images for `image:` services |
| `docker compose restart app` | Restart one service |
| `docker compose stop` / `start` | Stop / start, keep containers |
| `docker compose down` | Remove containers + network, **keep volumes** |
| `docker compose down -v` | Also remove named volumes — **data loss** |

## Keys

```yaml
services:
  db:
    image: postgres:18
    restart: unless-stopped
    environment:
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
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/taskdb
    ports:
      - "127.0.0.1:8080:8080"
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
volumes:
  pgdata:
```

## Restart Policies

| Policy | Crash | Daemon restart / reboot | After manual stop |
|--------|-------|------------------------|-------------------|
| `no` | — | — | — |
| `on-failure` | Restarts (non-zero exit) | No | Stays stopped |
| `always` | Restarts | Restarts | Starts on daemon restart |
| `unless-stopped` | Restarts | Restarts | Stays stopped |

## Variables

- `.env` next to `compose.yaml` → fills `${VAR}`; `${VAR:-default}`; `${VAR:?error message}`.
- `env_file: app.env` → every line becomes a container variable.
- Service name = host name: `db:5432`. Never `localhost` between services.
- No `version:` key (obsolete).
