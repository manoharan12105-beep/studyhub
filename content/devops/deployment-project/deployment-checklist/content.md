# End-to-End Deployment Checklist

**Module:** Deployment Project · **Interview priority:** Frequently asked

## How to Use This Checklist

Twenty-six checks take an application from a Git repository to a monitored, backed-up HTTPS service. Each item says **why** it matters and **how to verify** it on your own machine or server. The interactive checklist below remembers your ticks in this browser (they also travel with *Progress Import / Export*); ticking a box is your own record — StudyHub cannot see your server.

Work top to bottom: later items depend on earlier ones (HTTPS needs a domain, CD needs a registry).

## Code and Configuration

| # | Item | Why | Verify |
|---|------|-----|--------|
| 1 | Git repository ready | Everything deployable is versioned | `git status` clean; pushed to GitHub |
| 2 | Tests passing | Never ship a red build | `./mvnw -B verify` → `BUILD SUCCESS` |
| 3 | Production profile configured | Production settings without secrets | Log `profile is active: "prod"` |
| 4 | Secrets removed from source | Git history is permanent | `git grep -iE "password\|secret" -- ':!*.example'`; `.env` ignored |

## Containers

| # | Item | Why | Verify |
|---|------|-----|--------|
| 5 | Dockerfile created | Repeatable image | Multi-stage, JRE, non-root, exec-form `ENTRYPOINT` |
| 6 | Image builds | The artifact exists | `docker build -t taskapi:local .` |
| 7 | Container runs | The app starts in its image | `docker run …` + `curl …/actuator/health` |
| 8 | PostgreSQL container works | Same database version everywhere | `docker exec db pg_isready` |
| 9 | Volume configured | Data survives container replacement | Recreate `db`, data still there |
| 10 | Docker network works | App reaches the database by name | URL uses `db:5432`; no `localhost` |
| 11 | Compose works | One command for the stack | `docker compose up -d`; both `healthy` |

## Server

| # | Item | Why | Verify |
|---|------|-----|--------|
| 12 | VPS created | A place to run | Public IP, Ubuntu LTS |
| 13 | SSH configured | Secure access | Key login as `deploy`; passwords and root login disabled |
| 14 | Firewall configured | Minimal attack surface | `sudo ufw status`: 22, 80, 443; provider firewall matches |
| 15 | Docker installed | Runtime | `docker compose version`; `systemctl is-enabled docker` |
| 16 | Application deployed | It runs on the server | `curl 127.0.0.1:8080/api/info` on the server |
| 17 | PostgreSQL persistent | No data loss on redeploys | Named volume in `compose.yaml`; survives `down`/`up` |

## Edge

| # | Item | Why | Verify |
|---|------|-----|--------|
| 18 | Nginx configured | Single public entry point | `nginx -t`; app bound to `127.0.0.1` |
| 19 | Domain configured | Stable name | `dig +short api.example.com` = server IP |
| 20 | HTTPS enabled | Encryption and identity | Padlock; HTTP → 301; `certbot renew --dry-run` |

## Automation

| # | Item | Why | Verify |
|---|------|-----|--------|
| 21 | GitHub Actions configured | Every change tested | Green `test` job; `main` protected |
| 22 | Container registry configured | Servers pull tested images | Package with SHA tags; server can pull |
| 23 | CD deployment works | Releases without manual steps | A merge updates `/api/info` version |

## Operations

| # | Item | Why | Verify |
|---|------|-----|--------|
| 24 | Health check works | Deployments and monitors know the truth | Readiness `UP`; `DOWN` when the database is stopped |
| 25 | Logs verified | Incidents can be diagnosed | `docker compose logs app`, Nginx logs, rotation configured |
| 26 | Backup strategy confirmed | Recovery is possible | Daily off-server `pg_dump`; a restore was tested |

## Key Takeaways

- A deployment is finished when it is secure, observable and recoverable — not when it first answers a request.
- Every item has a concrete verification command; "I think so" is not a tick.
- Revisit items 14, 20, 24–26 regularly: firewalls drift, certificates expire, backups silently fail.
