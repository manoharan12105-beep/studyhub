# Complete DevOps Revision

## DevOps Foundations

- **DevOps** = the team that builds a service also delivers and runs it, with automation, small changes and fast feedback.
- **CI**: every change built and tested. **Continuous delivery**: every change releasable, manual approval. **Continuous deployment**: released automatically.
- **Immutable artifacts**: build one image per commit, deploy the same image everywhere, change only configuration.
- Environments: development → testing (CI) → staging → production.
- Linux essentials: key-only SSH as a non-root user; `chmod 600` secrets; `ss -ltnp` for ports; `df -h`, `du`, `free -h`, `top` for resources; `journalctl`, `tail -f`, `grep` for logs; ufw allows only 22/80/443.

## Docker

- **Image** = read-only layers + metadata. **Container** = image + writable layer + namespaces (isolation) + cgroups (limits). Shares the host kernel.
- CLI → Docker Engine (`dockerd`) → containerd/runc. "Cannot connect to the Docker daemon" = engine not running or no socket permission.
- Lifecycle: created → running → (paused) → exited → removed. `run` = create + start; `stop` = SIGTERM then SIGKILL after 10 s; `kill` = SIGKILL.
- Exit codes: 0 ok, 1 app error, 137 SIGKILL/OOM, 143 SIGTERM.
- Configuration is fixed at creation: new env or image ⇒ new container.

## Dockerfile

- Order least- to most-changing: `FROM` → `COPY pom.xml` → dependencies → `COPY src` → build. A changed layer rebuilds all later ones.
- Multi-stage: Maven + JDK build stage, JRE runtime stage, non-root `USER`, exec-form `ENTRYPOINT ["java","-XX:MaxRAMPercentage=75","-jar","app.jar"]`.
- `COPY` over `ADD`; `ARG` build-time, `ENV` run-time — neither for secrets; `EXPOSE` documents, `-p` publishes; `.dockerignore` keeps `target/`, `.git`, `.env` out.

## Spring Boot in Containers

- Fat JAR with embedded Tomcat; configure with env vars (`SPRING_DATASOURCE_URL`, `SPRING_PROFILES_ACTIVE=prod`) — env vars override YAML.
- `application-prod.yml` with `${…}` placeholders and no defaults: missing variable ⇒ start-up fails (`'url' must start with "jdbc"`).
- Log to stdout; expose only `health,info`; readiness for deployments (the Task API includes `db`), liveness without external dependencies.

## Networking

- Each container has its own `localhost`. Containers reach each other by **name** on a user-defined network: `db:5432`.
- Default bridge has no name DNS; user-defined/Compose networks use Docker DNS `127.0.0.11`.
- Between containers use the **container port**; published host ports are for traffic from outside.

## PostgreSQL and Volumes

- Named volume for data: `postgres:18` → `/var/lib/postgresql`; ≤17 → `/var/lib/postgresql/data`.
- `POSTGRES_*` variables and init scripts apply only to an empty data directory.
- `rm` / `down` keep volumes; `volume rm` / `down -v` delete them.
- Backup `docker exec db pg_dump -U u -d db -Fc > f.dump`; restore `docker exec -i db pg_restore -U u -d db --clean --if-exists < f.dump`; keep copies off the server and test restores.

## Docker Compose

- `services`, `networks`, `volumes`, `environment`, `ports`, `depends_on` (+ `condition: service_healthy`), `healthcheck`, `restart: unless-stopped`.
- `.env` fills `${VAR}`; `${VAR:?msg}` fails when missing; `docker compose config` validates.
- `up -d` recreates only changed services.

## Configuration and Production Readiness

- Secrets only in a git-ignored `chmod 600` `.env` on the server and GitHub Secrets; leaked ⇒ rotate first.
- Flyway + `ddl-auto: validate`; no stack traces in responses; CORS for exact origins; non-root containers; graceful shutdown needs exec form + long enough stop timeout.

## Server, Nginx, DNS and HTTPS

- VPS: key-only SSH, `deploy` user, ufw + provider firewall, Docker from Docker's repository, `/opt/taskapi` with `compose.yaml` + `.env`.
- Docker-published ports bypass ufw ⇒ publish the app on `127.0.0.1:8080` only.
- Nginx: `server_name`, `proxy_pass http://127.0.0.1:8080`, `Host`/`X-Forwarded-*` headers; `nginx -t && systemctl reload nginx`. 502 = upstream unreachable, 504 = too slow, 413 = body too large.
- DNS A record → server IP; TTL controls propagation. Certbot `--nginx` with HTTP-01 (port 80 + DNS ready); auto-renewal timer; `renew --dry-run`; HTTP → 301 → HTTPS; HSTS once stable.

## CI/CD and Registry

- Workflow → jobs (fresh runners) → steps (`uses`/`run`); `services: postgres` for integration tests; `setup-java` with `cache: maven`; `./mvnw -B verify`.
- Publish on `main` only: GHCR with `GITHUB_TOKEN` + `packages: write`; tags = commit SHA (+ `latest` for convenience).
- Deploy job: `environment: production` (reviewers = delivery), `concurrency`, SSH with deploy key + verified `known_hosts`, `deploy.sh <sha>`: set tag → pull → up -d → readiness → rollback on failure; then public HTTPS check.

## Operations and Security

- Logs: `docker compose logs`, Nginx access/error logs, `journalctl -k` for OOM. Rotate container logs (`max-size`, `max-file`).
- Health in three layers: Docker health check, deploy script, external uptime monitor (+ certificate expiry).
- Security: only 22/80/443 public, database unpublished, least privilege, secrets out of Git and images, automatic OS updates, regular image rebuilds, tested off-site backups.
