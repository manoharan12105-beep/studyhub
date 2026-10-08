# End-to-End Deployment Checklist

## Before the Server

- ☐ Git repository clean and pushed — `git status`
- ☐ Tests passing — `./mvnw -B verify`
- ☐ Production profile without secrets — `application-prod.yml` uses `${…}` only
- ☐ Secrets out of source — `.env` ignored, `.env.example` committed
- ☐ Dockerfile: multi-stage, JRE, non-root, exec-form `ENTRYPOINT`
- ☐ Image builds — `docker build -t taskapi:local .`
- ☐ Container runs — `curl localhost:8080/actuator/health`
- ☐ PostgreSQL container works — `pg_isready`
- ☐ Named volume — data survives recreating `db`
- ☐ Network — URL uses `db:5432`
- ☐ Compose — `docker compose up -d`, both `healthy`

## Server

- ☐ VPS created (Ubuntu LTS, enough RAM or swap)
- ☐ SSH: `deploy` user, keys only, no root login
- ☐ Firewall: ufw + provider allow only 22, 80, 443
- ☐ Docker + Compose plugin installed; `docker` enabled at boot
- ☐ `/opt/taskapi` with `compose.yaml` and `.env` (600)
- ☐ App deployed — `curl 127.0.0.1:8080/api/info`
- ☐ PostgreSQL persistent — `down`/`up` keeps data

## Edge

- ☐ Nginx proxy — `nginx -t`; app on `127.0.0.1:8080` only
- ☐ Domain — `dig +short` returns the server IP; no stray AAAA
- ☐ HTTPS — padlock, HTTP → 301, `certbot renew --dry-run` passes

## Automation

- ☐ CI — green `test` job, `main` protected
- ☐ Registry — SHA-tagged images on GHCR; server pulls with read-only token
- ☐ CD — merge → deploy → readiness → public check; rollback proven

## Operations

- ☐ Health — readiness `DOWN` when the database stops; external uptime monitor
- ☐ Logs — rotation configured; you know where every log is
- ☐ Backups — daily off-server `pg_dump`, restore tested
