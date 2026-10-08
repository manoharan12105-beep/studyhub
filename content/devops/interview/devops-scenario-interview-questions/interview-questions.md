# DevOps Scenario and Troubleshooting Questions — Interview Questions

## Intermediate

### Q1. After deployment, users get `502 Bad Gateway`. Walk through your investigation.

**Style:** Production failure

<details>
<summary>Answer</summary>

Hypotheses: app container down or restarting; app on a different port than `proxy_pass`; app not ready yet. Evidence: Nginx `error.log` (`connect() failed (111: Connection refused) while connecting to upstream` → nothing listening), `docker compose ps` (state, health, ports), `curl 127.0.0.1:8080/actuator/health` on the server, `docker compose logs --tail 100 app`. Fix the cause (configuration, port, memory), verify through Nginx. Prevention: health-checked deployments with rollback, uptime monitoring, avoiding single-instance gaps.

</details>

### Q2. The Spring Boot container restarts every few seconds. What do you do?

**Style:** Troubleshooting

<details>
<summary>Answer</summary>

`docker compose ps` shows `Restarting`; `docker compose logs app` gives the start-up error (wrong datasource host, missing variable — with the Task API `'url' must start with "jdbc"` — wrong password, failing migration); `docker inspect` shows exit code and `OOMKilled`. Fix configuration or memory and recreate with `up -d`. The restart policy only hides the problem.

</details>

### Q3. The app logs `UnknownHostException: db`. The database container is running. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

The app cannot resolve `db`: it is on a different network (or the default bridge, which has no name resolution), or the service is named differently. Check `docker network inspect`, compare service names with the URL, and put both on the same user-defined/Compose network.

</details>

### Q4. All tasks disappeared after a redeploy. What happened?

**Style:** What happens if

<details>
<summary>Answer</summary>

Likely causes: the database had no volume or a wrong mount path (data lived in the container layer); someone ran `docker compose down -v`; the volume name or Compose project name changed (a new empty volume was created); or `.env` pointed to another database. Check `docker volume ls`, `docker inspect` mounts and shell history; restore from backup; then fix the mount and remove `-v` from any script.

</details>

### Q5. CI is green, but the production deployment fails with `exec format error`. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

The image was built for a different CPU architecture than the server (for example arm64 on an Apple Silicon laptop pushed manually, while the VPS is amd64). Build in CI (amd64) or use `--platform linux/amd64` / multi-platform builds.

</details>

### Q6. The server's disk is full and PostgreSQL has stopped accepting writes. What do you do first?

**Style:** Production failure

<details>
<summary>Answer</summary>

Free space safely before anything else: `df -h`, `docker system df`, find the culprit (`du -xh --max-depth=1 /var`). Typical quick wins: huge container JSON logs, dangling images and build cache, old backups on the same disk. Never delete volumes or database files by hand. Then fix the cause: log rotation, image pruning, disk alerts, more disk, off-server backups.

</details>

### Q7. HTTPS suddenly fails with "certificate expired". Why didn't it renew?

**Style:** Debugging

<details>
<summary>Answer</summary>

Renewal broke silently: the certbot timer is not running, port 80 is now blocked or redirected in a way the challenge cannot pass, DNS changed, or the Nginx configuration Certbot expects was edited. `sudo certbot renew --dry-run` shows the reason; fix it, renew, reload Nginx, and add an external expiry alert.

</details>

### Q8. A deployment pipeline is green, but users see the old version. What do you check?

**Style:** Troubleshooting

<details>
<summary>Answer</summary>

Whether the server actually runs the new tag: `/api/info` version, `docker compose ps` image, the `.env` `APP_IMAGE`. Causes: the deploy step pulled `latest` but the tag did not move, the container was not recreated, a different server or Compose project was updated, or a CDN/browser cache serves old content.

</details>

## Advanced

### Q9. Intermittent 502s happen every few hours with no deployment. How do you approach it?

**Style:** Production failure

<details>
<summary>Answer</summary>

Correlate timestamps across Nginx logs, container restarts (`RestartCount`, `docker events`), the kernel log (OOM kills) and app logs. Common causes: the JVM is OOM-killed and restarts (memory limits vs heap), long GC pauses or thread-pool/connection-pool exhaustion causing timeouts, or the database restarting. Fix the resource issue, then consider a second instance behind Nginx for resilience.

</details>

### Q10. A secret was found in a public repository. What exactly do you do?

**Style:** Scenario

<details>
<summary>Answer</summary>

Rotate it immediately (change the password, revoke the key) and update the server's `.env` and GitHub Secrets; check access logs for misuse; then remove it from the code (`${…}` placeholders, `.gitignore`) and optionally rewrite history. Add secret scanning with push protection so it cannot happen silently again.

</details>

### Q11. The new release passed readiness but writes fail for one endpoint. Why did the pipeline not catch it, and how would you improve it?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Readiness only proves start-up and database connectivity, not every feature. Improve with tests that cover that endpoint (CI), a smoke test after deployment that exercises critical write and read paths, and monitoring of error rates with a quick rollback when they rise.

</details>

### Q12. The team wants zero-downtime deployments on the single VPS. Propose a design.

**Style:** Architecture

<details>
<summary>Answer</summary>

Blue/green: run the new version as a second service (or Compose project) on another loopback port; wait for its readiness; switch Nginx's upstream to it and `nginx -s reload` (no dropped connections); stop the old one after in-flight requests finish. Requirements: stateless app, backward-compatible migrations, enough memory for two JVMs. Alternatively two permanent instances in an Nginx upstream, replaced one at a time.

</details>
