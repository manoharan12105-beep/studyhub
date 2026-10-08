# Logging, Monitoring and Health

**Module:** Operations and Security · **Interview priority:** Core

## What Is It?

Once the application is live, you need to know **whether it works** (health checks, uptime monitoring), **how the server is doing** (CPU, memory, disk), and **what happened** when it did not (logs). This lesson keeps it practical: the tools that come with Linux, Docker, Nginx, PostgreSQL and Spring Boot, plus one external uptime check — and a step-by-step guide to the failures you will actually meet.

## Why It Matters

- Without monitoring, users tell you about outages. With a simple uptime check, you know first.
- Without logs, every incident is guesswork.
- "The service is down — what do you do?" is one of the most common practical interview questions.

## Where the Logs Are

| Component | Command or file | What you find |
|-----------|-----------------|---------------|
| Spring Boot app | `docker compose logs --tail 200 app` | Start-up, profile, errors with stack traces, your log lines |
| PostgreSQL | `docker compose logs --tail 200 db` | Start-up, `FATAL` authentication errors, slow or failed statements |
| All containers | `docker compose logs -f --since 10m` | Interleaved, follow live |
| Docker Engine | `journalctl -u docker --since "1 hour ago"` | Daemon problems, image pulls |
| Nginx | `/var/log/nginx/access.log`, `/var/log/nginx/error.log` | Every request with status; upstream failures |
| Kernel | `journalctl -k` or `dmesg` | Out-of-memory kills, disk errors |
| SSH / auth | `journalctl -u ssh` | Logins and failed attempts |

Useful filters:

```bash
# Illustrative
docker compose logs --since 30m app | grep -E "ERROR|Exception" | tail -n 20
sudo awk '$9 >= 500' /var/log/nginx/access.log | tail -n 20      # 5xx responses (status is field 9)
sudo grep -c " 502 " /var/log/nginx/access.log
```

## Docker Log Rotation

Docker's default `json-file` log driver keeps container logs under `/var/lib/docker/containers/` **without a size limit**. A chatty application can fill the disk. Limit it per service in `compose.yaml`:

```yaml
services:
  app:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

Or for every new container on the host in `/etc/docker/daemon.json` (then `sudo systemctl restart docker`; existing containers keep their old settings until recreated):

```json
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
```

Nginx's logs are rotated by `logrotate`, which Ubuntu's package configures.

## Health Checks

Three layers, each answering a different question:

| Layer | Check | Answers |
|-------|-------|---------|
| Docker | `healthcheck:` in Compose (`pg_isready`, `curl …/readiness`) | Is the container's service working? (`docker compose ps` shows `healthy`) |
| Deployment | `deploy.sh` polling readiness | Did the new version start correctly? |
| External | An uptime monitor requesting `https://api.example.com/actuator/health` every minute | Can **users** reach it — DNS, firewall, Nginx, TLS, app, database? |

A Docker `unhealthy` status does **not** restart the container by itself (plain Docker and Compose only report it); the restart policy reacts to the process exiting. Use the status for alerts and deployments.

## Basic Uptime Monitoring

Any hosted uptime service (many have free tiers) or a second server can request your health URL periodically and alert you by email or chat when it fails or the certificate is about to expire. Configure:

- URL: `https://api.example.com/actuator/health`, expect status 200 and the text `"UP"`;
- interval 1–5 minutes; alert after 2 consecutive failures;
- certificate expiry warning 14+ days ahead.

## CPU, Memory and Disk

```bash
# Illustrative
docker stats --no-stream                 # per container: CPU %, MEM USAGE / LIMIT
free -h                                  # host memory: watch "available"
df -h /                                  # disk: alert above ~80 %
docker system df                         # space used by images, containers, volumes, build cache
uptime                                   # load averages for 1, 5, 15 minutes
```

| Signal | Healthy | Investigate |
|--------|---------|-------------|
| Disk use on `/` | Under 80 % | Rising steadily → logs, images, database growth |
| Memory available | Comfortable margin | Near zero, swap growing, OOM kills in `journalctl -k` |
| Container restarts | 0 | `RestartCount` growing (`docker inspect -f '{{.RestartCount}}' …`) |
| Load average | Below the number of CPU cores | Persistently above it |

Larger setups export these as metrics (Spring Boot Actuator + Micrometer → Prometheus → Grafana); that is beyond this subject's scope, but the questions you ask are the same.

## Troubleshooting Common Failures

Work from the outside in, and change one thing at a time.

| Symptom | First checks | Typical cause → fix |
|---------|--------------|---------------------|
| **Application down** (site unreachable) | `ssh` works? `docker compose ps`, `systemctl status nginx` | Server down, container exited, Nginx stopped → read logs, restart the right component |
| **Database unavailable** | `docker compose ps db`, `docker compose logs db`, app logs show `Connection … refused` | `db` stopped, still starting, out of disk → start it, check volume and disk |
| **Port unavailable** | App log `Port 8080 was already in use`; Compose `port is already allocated`; `sudo ss -ltnp` | An old container or process holds it → stop it |
| **Container restarting** | `docker compose ps` shows `Restarting`; `docker compose logs app`; `docker inspect` exit code, `OOMKilled` | Configuration error at start-up, or memory limit → fix config / memory |
| **Out of disk space** | `df -h`, `docker system df`, `du -xh --max-depth=1 /var` | Container logs, old images, database growth → rotate logs, prune dangling images, grow disk |
| **Wrong environment variable** | `docker compose exec app env \| grep SPRING_`, `docker compose config` | Typo, missing `.env` entry, container not recreated → fix `.env`, `docker compose up -d` |
| **Wrong database hostname** | App log `UnknownHostException` or `Connection to localhost:5432 refused` | `localhost` or a wrong name → use the service name `db` |
| **Nginx 502** | Nginx `error.log`: `connect() failed (111: Connection refused) while connecting to upstream`; `curl 127.0.0.1:8080/actuator/health` | App down/restarting, wrong `proxy_pass` port → fix the app or the port |
| **HTTPS failure** | Browser certificate error; `openssl s_client`; `sudo certbot certificates`; ufw/provider allow 443? | Expired certificate (renewal broken), name mismatch, 443 closed → renew, fix `server_name`, open the port |

The real start-up cause lines of the Task API for several of these are listed in [Spring Boot in Docker](../../docker/spring-boot-in-docker/content.md). The interactive simulator below lets you practise choosing the next command.

## Example: A Five-Minute Health Review

```bash
# Illustrative: on the server
docker compose ps
docker stats --no-stream
df -h / && free -h
docker compose logs --since 24h app | grep -c ERROR
sudo tail -n 5 /var/log/nginx/error.log
sudo certbot certificates | grep -E "Domains|Expiry"
```

Run it after deployments and once a week until you trust your monitoring.

## Production Relevance

- An external uptime check plus log rotation plus `restart: unless-stopped` covers most of what a single-server service needs.
- Fast diagnosis comes from knowing where each log is and what each status means.

## Common Mistakes

- No log rotation until the disk fills.
- Only checking `docker compose ps` ("Up") while the app answers every request with errors.
- Monitoring from the same server (it cannot alert when the server is down).
- Restarting things before reading the logs — the evidence disappears.
- Ignoring certificate expiry warnings.

## Interview Angle

- Explain your three health-check layers and what each detects.
- Walk through diagnosing a 502 and a restarting container with concrete commands.
- Explain why container logs need rotation.

## Key Takeaways

- App and database logs: `docker compose logs`; proxy: Nginx `access.log`/`error.log`; kernel: `journalctl -k`.
- Rotate container logs (`max-size`, `max-file`).
- Health checks in Docker, in the deploy script, and from outside with an uptime monitor.
- Troubleshoot outside-in: reachability → Nginx → container state → app logs → database → resources.
