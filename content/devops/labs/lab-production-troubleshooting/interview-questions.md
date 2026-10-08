# Lab 18 — Interview Questions

## Intermediate

### Q1. The site returns 502. Walk me through your diagnosis.

**Style:** Troubleshooting

<details>
<summary>Answer</summary>

502 means Nginx is up but the upstream failed. Read Nginx's `error.log` (connection refused vs timeout), check `docker compose ps` (is `app` running, restarting, healthy?), `curl 127.0.0.1:8080/actuator/health` on the server, compare the published port with `proxy_pass`, then read `docker compose logs app` for the start-up or runtime error. Fix the cause, verify health, then confirm through Nginx.

</details>

### Q2. Health shows DOWN while the app container is running. What does that tell you?

**Style:** Debugging

<details>
<summary>Answer</summary>

The process is alive but a dependency checked by the health endpoint — typically the database — is failing. Check `docker compose ps db`, the database logs, connectivity from the app container, and disk space on the database volume. Restarting the app would not help.

</details>

## Advanced

### Q3. How do you make each of these faults less likely or faster to detect next time?

**Style:** Production failure

<details>
<summary>Answer</summary>

Configuration faults: `docker compose config` and a staging run in CI, fail-fast configuration, health-checked deployments with rollback. Database availability: health checks, restart policies, alerts on readiness. Port conflicts: never start ad-hoc containers on production ports; deploy only via Compose. 502s: external uptime monitoring and alerting on 5xx rates in Nginx logs. Disk: log rotation, image pruning in the deployment routine, disk alerts at 80 %.

</details>
