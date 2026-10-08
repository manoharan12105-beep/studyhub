# Production Troubleshooting

## The Method

```text
symptom → hypotheses → evidence (status, logs, sockets, resources) → one change → verify → prevent
outside-in: DNS → firewall → Nginx → container state → app logs → database → disk/memory
```

## First Five Commands

```bash
docker compose ps                          # running? restarting? healthy?
docker compose logs --tail 100 app         # the application's own error
sudo tail -n 20 /var/log/nginx/error.log   # upstream failures
sudo ss -ltnp                              # who listens where (127.0.0.1 vs 0.0.0.0)
df -h / && free -h                         # disk and memory
```

## Symptom → Cause → Fix

| Symptom | Evidence | Fix |
|---------|----------|-----|
| Site unreachable | `ssh` fails or Nginx stopped | Server/provider status; `systemctl status nginx` |
| `502 Bad Gateway` | `connect() failed (111: Connection refused) while connecting to upstream` | Start/fix the app; match `proxy_pass` to the published port |
| `504 Gateway Timeout` | `upstream timed out` | Slow query or stuck app; fix it, then tune `proxy_read_timeout` |
| `413` | Body > `client_max_body_size` | Raise the limit |
| Container `Restarting` | `docker compose logs app`; exit code; `OOMKilled` | Fix config or memory; recreate |
| `Connection to localhost:5432 refused` | App uses `localhost` for the DB | Use the service name `db` |
| `UnknownHostException: db` | Different network / wrong name | Same Compose network; correct name |
| `password authentication failed` | Password ≠ the one stored in the volume | Fix the variable or `ALTER ROLE` |
| `'url' must start with "jdbc"` (prod profile) | Missing `SPRING_DATASOURCE_URL` | Add it to `.env`/Compose; `up -d` |
| `Port 8080 was already in use` / `port is already allocated` | `ss -ltnp`, `docker ps` | Stop the duplicate |
| Exit 137, `OOMKilled: true` | `docker inspect`, `journalctl -k` | Raise limit, lower `MaxRAMPercentage`, add swap |
| Disk 100 % | `df -h`, `docker system df`, `du` | Rotate logs, prune dangling images/cache — never volumes blindly |
| Data gone after redeploy | No volume / wrong mount path / `down -v` | Restore backup; fix the mount |
| Certificate expired | `certbot certificates`; `renew --dry-run` | Fix renewal cause; renew; reload Nginx |
| `exec format error` | arm64 image on amd64 server | Build `--platform linux/amd64` or in CI |
| Pull `unauthorized` | Private GHCR image | `docker login ghcr.io` with read-only token |
| CI `./mvnw: Permission denied` | Executable bit lost | `git update-index --chmod=+x mvnw` |
| Health `DOWN` (503), container running | Readiness includes `db`; database down | Start/fix the database |

## Never During an Incident

- `docker compose down -v`, `docker volume prune -a`, `rm -rf` on data directories.
- `kill -9` before identifying the process.
- Restarting before saving the logs you need.
- Several changes at once.
