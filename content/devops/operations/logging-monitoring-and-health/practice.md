# Logging, Monitoring and Health — Practice

### P1. Follow the app

**Difficulty:** Easy · **Type:** Command · **Concepts:** compose logs

Show the last 100 lines of the `app` service's logs and keep following.

<details>
<summary>Answer</summary>

```bash
# Illustrative
docker compose logs -f --tail 100 app
```

</details>

### P2. Which log?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** log locations

Where do you look first to see why Nginx returned 502?

- A) `/var/log/nginx/access.log`
- B) `/var/log/nginx/error.log`
- C) `journalctl -u ssh`
- D) `docker compose logs db`

<details>
<summary>Answer</summary>

**Answer:** B) `/var/log/nginx/error.log`

</details>

### P3. Limit the logs

**Difficulty:** Easy · **Type:** Compose · **Concepts:** log rotation

Write the `logging` section that keeps at most three 10 MB log files for a service.

<details>
<summary>Answer</summary>

```yaml
logging:
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"
```

</details>

### P4. Killed?

**Difficulty:** Medium · **Type:** Command · **Concepts:** inspect

Print the exit code, whether the container was OOM-killed, and how often it restarted, for container `taskapi-app-1`.

<details>
<summary>Answer</summary>

```bash
# Illustrative
docker inspect -f '{{.State.ExitCode}} {{.State.OOMKilled}} {{.RestartCount}}' taskapi-app-1
```

</details>

### P5. Diagnose from the log

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** wrong hostname

`app` restarts in a loop; its log ends with `Caused by: java.net.UnknownHostException: postgres`. The Compose service is named `db`. Fix?

<details>
<summary>Answer</summary>

Set `SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/taskdb` (the service name), then `docker compose up -d`.

</details>

### P6. Disk at 97 %

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** disk usage

List, in order, the commands you run to find what fills the disk on a Docker host.

<details>
<summary>Answer</summary>

`df -h /` → `docker system df` → `sudo du -xh --max-depth=1 /var | sort -h | tail` → `sudo du -sh /var/lib/docker/containers/*/*-json.log | sort -h | tail` (container logs) → decide: rotate logs, prune dangling images/build cache, never delete volumes blindly.

</details>

### P7. Read the error log

**Difficulty:** Medium · **Type:** Output · **Concepts:** Nginx upstream errors

`error.log`: `connect() failed (111: Connection refused) while connecting to upstream, … upstream: "http://127.0.0.1:8080/api/tasks"`. What is the state of the app, and what is the next command?

<details>
<summary>Answer</summary>

Nothing accepts connections on `127.0.0.1:8080` — the app is down, restarting, or published on another port. Next: `docker compose ps` (state and ports), then `docker compose logs --tail 100 app`.

</details>

### P8. Set up the monitor

**Difficulty:** Medium · **Type:** Decision · **Concepts:** uptime monitoring

Which URL, expected response and alert rule would you configure in an external uptime monitor for the Task API?

<details>
<summary>Answer</summary>

`https://api.example.com/actuator/health`, expect HTTP 200 containing `"UP"`, every 1–5 minutes, alert after 2 consecutive failures, plus a certificate-expiry warning 14 days ahead.

</details>

### P9. Certificate expired

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** HTTPS failure

Browsers show "certificate expired" for `api.example.com`. List the diagnosis and fix commands.

<details>
<summary>Answer</summary>

`sudo certbot certificates` (expiry), `systemctl list-timers | grep certbot` (is the timer active?), `sudo certbot renew --dry-run` (why renewal fails — often port 80 blocked or DNS changed), fix the cause, then `sudo certbot renew` and `sudo systemctl reload nginx`. Add an expiry alert so it is caught earlier next time.

</details>

### P10. Unhealthy but running

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** health status semantics

`docker compose ps` shows `app` as `Up 3 hours (unhealthy)`. Requests time out. Will Docker fix it, and what do you do?

<details>
<summary>Answer</summary>

No — plain Docker/Compose only report health; the process is still running, so the restart policy does nothing. Collect evidence first (logs, `docker stats`, a thread dump with `jcmd` if available, database connections), then restart the service (`docker compose restart app`) to restore service, and fix the root cause (deadlock, pool exhaustion, memory pressure).

</details>
