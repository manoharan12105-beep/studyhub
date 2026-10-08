# Lab 18 — Production Troubleshooting

**Lab:** 18 · **Module:** Logging, Monitoring and Health · **Verification:** Partly tested

> [!NOTE]
> Run on your own machine with the Compose stack from [Lab 09](../lab-docker-compose-application/content.md) (safer than production) or on your VPS. **Partly tested:** the application error messages and the Nginx 502 behaviour quoted here come from real runs of the Task API and Nginx 1.30.5; the Docker-based fault injections were not executed when this lab was written. The *Troubleshooting simulator* in the [monitoring lesson](../../operations/logging-monitoring-and-health/content.md) is a StudyHub simulation you can practise with first.

## Objective

Break the running stack in five realistic ways, then diagnose each from evidence — status, logs, sockets — before fixing it.

## Prerequisites

- A running Task API stack (Compose) and, for Fault 5, Nginx in front of it.
- Lessons: [Logging, Monitoring and Health](../../operations/logging-monitoring-and-health/content.md), [Linux for Deployment](../../devops-foundations/linux-for-deployment/content.md).

## Scenario

You are on call. For each fault, write down the symptom, the first three commands you ran, the cause and the fix — that write-up is exactly what interviewers want to hear.

The method, every time:

```text
symptom → docker compose ps → logs (app, db, nginx) → sockets/resources → hypothesis → one change → verify
```

## Steps

### Fault 1: Wrong database hostname

```bash
sed -i 's|postgresql://db:5432|postgresql://localhost:5432|' compose.yaml
docker compose up -d
```

**Diagnose:** `docker compose ps` (app `Restarting` or `unhealthy`) → `docker compose logs --tail 50 app`.
**Evidence:** `Connection to localhost:5432 refused. Check that the hostname and port are correct and that the postmaster is accepting TCP/IP connections.`
**Fix:** restore `db` in the URL; `docker compose up -d`.

### Fault 2: Wrong environment variable

Rename `SPRING_DATASOURCE_URL` to `SPRING_DATASOURCE_URI` in `compose.yaml`; `docker compose up -d`.

**Diagnose:** logs → `Caused by: java.lang.IllegalArgumentException: 'url' must start with "jdbc"`; `docker compose exec app env | grep SPRING_` (if it stays up long enough) or `docker compose config`.
**Cause:** with the `prod` profile and no `SPRING_DATASOURCE_URL`, the placeholder stays unresolved.
**Fix:** correct the name; `docker compose up -d`.

### Fault 3: Database unavailable

```bash
docker compose stop db
curl -s localhost:8080/actuator/health
```

**Diagnose:** `/actuator/health` answers `{"groups":["liveness","readiness"],"status":"DOWN"}` with HTTP 503; `/actuator/health/readiness` is `DOWN` too (the Task API includes `db` in readiness) while `/liveness` stays `UP` — exactly what the running Task API returned when its PostgreSQL was stopped. The app's health check turns `unhealthy`; app logs show connection errors when requests touch the database.
**Fix:** `docker compose start db`; readiness returns to `UP` without restarting the app (the connection pool reconnects) — also observed in the verification run.

### Fault 4: Port unavailable

```bash
docker compose down
docker run -d --name squatter -p 127.0.0.1:8080:80 nginx:1.30
docker compose up -d
```

**Diagnose:** Compose fails to start `app`; the error says the port is already allocated. `docker ps` (who publishes 8080?) and `sudo ss -ltnp | grep 8080`.
**Fix:** `docker rm -f squatter`; `docker compose up -d`. (Outside Docker the Spring Boot message is `Web server failed to start. Port 8080 was already in use.`)

### Fault 5: Nginx 502

With Nginx in front (Lab 12): `docker compose stop app`, then request the site.

**Diagnose:** `502 Bad Gateway`; `sudo tail -n 1 /var/log/nginx/error.log` → `connect() failed (111: Connection refused) while connecting to upstream`; `docker compose ps` shows `app` exited.
**Fix:** `docker compose start app`; wait for `healthy`; the site recovers.

### Fault 6 (read-only): Out of disk space

Do not fill a real disk. Instead, practise the investigation:

```bash
df -h /
docker system df
sudo du -xh --max-depth=1 /var 2>/dev/null | sort -h | tail -n 5
sudo sh -c 'du -h /var/lib/docker/containers/*/*-json.log' | sort -h | tail -n 3
```

Decide what you would remove first (dangling images, build cache, oversized container logs) and what you must never remove (volumes).

## Verification Checklist

- ☐ For each fault you found the cause from evidence before changing anything.
- ☐ You can quote the key log line of each fault.
- ☐ You restored the stack fully afterwards (`docker compose ps` all healthy).

## Common Mistakes

- Restarting first and reading logs never.
- Changing two things at once.
- "Fixing" a full disk with `docker system prune -a --volumes` or `docker volume prune -a`.

## Troubleshooting

If the stack does not return to normal: `git diff compose.yaml` (what did you change?), `docker compose down` (keeps data), `docker compose up -d`, and read `docker compose logs`.
