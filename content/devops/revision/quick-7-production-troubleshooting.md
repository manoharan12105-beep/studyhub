# Block 7: Production Troubleshooting

## Method

```text
outside-in: DNS → firewall → Nginx → container state → app logs → database → disk/memory
evidence first · one change at a time · verify · prevent
```

## Ten Failures, Ten Clues

| Failure | Clue |
|---------|------|
| App down | `docker compose ps`: Exited / Restarting |
| Wrong DB host | `Connection to localhost:5432 refused` / `UnknownHostException: db` |
| Wrong password | `FATAL: password authentication failed for user "taskapp"` |
| Missing env var (prod) | `'url' must start with "jdbc"` |
| Port conflict | `Port 8080 was already in use` / `port is already allocated` |
| OOM | Exit 137, `OOMKilled: true`, `journalctl -k` |
| DB unavailable | `/actuator/health` → `DOWN` (503); readiness DOWN (with `db` in the group) |
| Nginx 502 | `connect() failed (111: Connection refused) while connecting to upstream` |
| Disk full | `df -h` 100 %; `docker system df`; huge `*-json.log` |
| HTTPS failure | Expired: `certbot certificates`; renewal: `certbot renew --dry-run` |

## Monitoring Minimum

- Docker health checks + `restart: unless-stopped`.
- Log rotation: `max-size: "10m"`, `max-file: "3"`.
- External uptime check on `https://…/actuator/health` + certificate expiry.
- Disk alert at ~80 %; daily off-server backups with tested restores.

## Self-Check

- Readiness says UP, overall health says DOWN — what does that mean by default?
- What must you never run while fixing a full disk?
- Write the one-line answer: "502 means …".
