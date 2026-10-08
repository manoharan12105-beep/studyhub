# Logging, Monitoring and Health — Interview Questions

## Beginner

### Q1. How do you view the logs of a containerised Spring Boot application?

**Style:** How

<details>
<summary>Answer</summary>

`docker compose logs app` (or `docker logs <container>`), with `--tail 100` for the latest lines, `-f` to follow and `--since 10m` for a time window. It shows what the application wrote to stdout/stderr.

</details>

### Q2. What is a health check?

**Style:** What

<details>
<summary>Answer</summary>

A periodic probe that tests whether a service actually works — for example `pg_isready` for PostgreSQL or an HTTP request to `/actuator/health/readiness`. Docker marks the container `healthy` or `unhealthy`; deploy scripts and monitors use the result.

</details>

### Q3. Why do you need external uptime monitoring when Docker has health checks?

**Style:** Why

<details>
<summary>Answer</summary>

Docker's checks run inside the server and only see the container. An external monitor tests the whole user path — DNS, firewall, Nginx, TLS certificate, app and database — and can alert you even when the server itself is down.

</details>

### Q4. Where are Nginx's logs and what does each contain?

**Style:** What

<details>
<summary>Answer</summary>

`/var/log/nginx/access.log`: one line per request (client, request, status, size, user agent). `/var/log/nginx/error.log`: configuration and runtime errors, including upstream connection failures and timeouts.

</details>

## Intermediate

### Q5. The disk filled up on a Docker host. What usually causes it and how do you prevent it?

**Style:** Production failure

<details>
<summary>Answer</summary>

Unrotated container logs (json-file has no default limit), accumulated old images and build cache, and database growth. Prevent with log rotation (`max-size`/`max-file` per service or in `daemon.json`), periodic `docker image prune`, monitoring disk use with an alert at about 80 %, and planning database storage.

</details>

### Q6. A container shows `Restarting (1)`. Walk through your diagnosis.

**Style:** Troubleshooting

<details>
<summary>Answer</summary>

`docker compose logs --tail 100 app` for the start-up error; `docker inspect -f '{{.State.ExitCode}} {{.State.OOMKilled}} {{.RestartCount}}' <container>`; if OOMKilled, check memory limits and the JVM settings; otherwise fix the configuration it reports (datasource URL, missing variable, password, migration) and recreate with `docker compose up -d`.

</details>

### Q7. Does Docker restart an `unhealthy` container?

**Style:** Trap

<details>
<summary>Answer</summary>

Not in plain Docker or Compose: the health status is only reported. Restart policies react to the main process exiting. Orchestrators (Swarm, Kubernetes with liveness probes) act on failed checks. Use the status for alerts, deployments and `depends_on: service_healthy`.

</details>

### Q8. How do you find all 5xx responses in the last part of the Nginx access log?

**Style:** How

<details>
<summary>Answer</summary>

With the default combined format the status is the ninth field: `sudo awk '$9 >= 500' /var/log/nginx/access.log | tail -n 20`, or `grep -E '" 5[0-9]{2} '` for a quick search. Then match the times with the application logs.

</details>

## Advanced

### Q9. Users report intermittent 502 errors several times a day. How do you investigate?

**Style:** Debugging

<details>
<summary>Answer</summary>

Correlate times: find the 502 lines in `access.log` and the matching `error.log` entries (connection refused vs timeouts vs resets). Check `RestartCount` and OOM kills (`journalctl -k`) — a container being killed and restarted causes short 502 bursts; check whether 502s coincide with deployments (single-instance restart gap). Look at app logs at those times for crashes or connection-pool exhaustion. Fix the cause (memory, crashes) or add a second instance.

</details>

### Q10. What would you add as the service grows beyond one server?

**Style:** Architecture

<details>
<summary>Answer</summary>

Centralised logs (ship container and Nginx logs to a log platform, structured JSON logs with request IDs), metrics (Micrometer → Prometheus/Grafana or a hosted equivalent) with alerts on error rate, latency and saturation, distributed tracing across services, and on-call alerting with runbooks. The diagnostic questions stay the same; the tools aggregate across machines.

</details>
