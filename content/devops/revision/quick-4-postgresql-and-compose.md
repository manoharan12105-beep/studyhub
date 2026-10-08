# Block 4: PostgreSQL and Compose

## PostgreSQL in Docker

- `POSTGRES_PASSWORD` required; `POSTGRES_USER`, `POSTGRES_DB` optional — **only applied to an empty data directory**.
- Named volume: `postgres:18` → `-v pgdata:/var/lib/postgresql`; ≤17 → `/var/lib/postgresql/data`.
- Init scripts in `/docker-entrypoint-initdb.d` run once; app schema via Flyway.
- No published port in production; `127.0.0.1:5432` for local tools.
- Backup: `docker exec db pg_dump -U u -d d -Fc > f.dump` (no `-t`). Restore: `docker exec -i db pg_restore -U u -d d --clean --if-exists < f.dump`.

## What Deletes Data

| Keeps data | Deletes data |
|-----------|--------------|
| `stop`, `rm`, `compose down` | `volume rm`, `compose down -v`, `volume prune -a` |

## Compose Essentials

- `services` · `environment` · `ports` · `volumes` · `networks` · `healthcheck` · `depends_on: {db: {condition: service_healthy}}` · `restart: unless-stopped`.
- Service name = DNS name. `.env` fills `${VAR}`; `${VAR:?msg}` fails fast; `docker compose config` validates.
- `up -d` recreates only changed services — that is how you deploy changes.

## Restart Policies

`on-failure` (non-zero exit only, not after daemon restart) · `always` · `unless-stopped` (stays down if you stopped it).

## Self-Check

- Changed `POSTGRES_PASSWORD`, app now fails to log in — why, and the fix?
- `down` vs `down -v`?
- What does short-form `depends_on` *not* do?
