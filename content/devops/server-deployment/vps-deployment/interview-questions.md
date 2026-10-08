# Deploying to a Linux VPS — Interview Questions

## Beginner

### Q1. What is a VPS?

**Style:** What

<details>
<summary>Answer</summary>

A virtual private server: a virtual machine rented from a provider, with its own public IP, CPU, RAM, disk and root access to an operating system (usually Linux). You manage everything from the OS up — updates, firewall, runtime and application.

</details>

### Q2. What are the first security steps on a new VPS?

**Style:** How

<details>
<summary>Answer</summary>

Update packages; create a non-root user with sudo; log in with SSH keys; disable password authentication and root login (after testing the new login); enable a firewall allowing only SSH, HTTP and HTTPS (both ufw and the provider's firewall); enable automatic security updates.

</details>

### Q3. How do you get your application's image onto the server?

**Style:** How

<details>
<summary>Answer</summary>

Normally by pulling it from a container registry (`docker login`, then `docker compose pull`), where CI pushed it. Without a registry, stream it over SSH: `docker save image | gzip | ssh server 'gunzip | docker load'`, or build on the server from the repository.

</details>

### Q4. How do you update a Compose deployment to a new version?

**Style:** How

<details>
<summary>Answer</summary>

Change the image tag (for example `APP_IMAGE` in `.env`), run `docker compose pull app` and `docker compose up -d app`, then verify with the readiness endpoint and the logs.

</details>

## Intermediate

### Q5. ufw allows only 22, 80 and 443, yet the app on 8080 is reachable from the internet. Why?

**Style:** Trap

<details>
<summary>Answer</summary>

Docker inserts iptables rules for published ports that are evaluated before ufw's rules, so ufw does not filter them. Publish the port on `127.0.0.1` only and put Nginx in front, or do not publish it at all.

</details>

### Q6. How do you roll back a bad deployment, and what can make rollback fail?

**Style:** Scenario

<details>
<summary>Answer</summary>

Set the previous image tag and run `docker compose up -d app` — images are immutable, so the old version is exactly what ran before. Rollback fails when the new version changed the database in a way the old version cannot handle (dropped or renamed columns). Use backward-compatible migrations (expand, then contract in a later release) and back up before risky changes.

</details>

### Q7. The container fails on the server with "exec format error". What happened?

**Style:** Debugging

<details>
<summary>Answer</summary>

The image was built for a different CPU architecture — for example `arm64` on an Apple Silicon laptop, deployed to an `amd64` VPS. Rebuild with `--platform linux/amd64` (or a multi-platform build), or let CI build the image.

</details>

### Q8. Why should you test a new SSH login before closing your session after changing `sshd` settings?

**Style:** Why

<details>
<summary>Answer</summary>

A mistake (wrong key, disabled password login before the key works, a syntax error) can make new logins impossible. The existing session stays connected, so you can fix the configuration. Run `sshd -t` to check syntax and keep a provider console as a last resort.

</details>

## Advanced

### Q9. Your 1 GB VPS keeps killing PostgreSQL during the app's start-up. What do you do?

**Style:** Production failure

<details>
<summary>Answer</summary>

Confirm with `journalctl -k` / `dmesg` ("Out of memory: Killed process"). Short term: add swap and lower the JVM's memory (`-XX:MaxRAMPercentage`, container memory limits) so both fit. Long term: a 2 GB server, a smaller connection pool, or a managed database. Set memory limits so one container cannot starve the other.

</details>

### Q10. What would you change if this single VPS had to survive the server dying?

**Style:** Architecture

<details>
<summary>Answer</summary>

Remove the single points of failure: off-server backups first (and tested restores); then a managed or replicated database, two or more application servers behind a load balancer, infrastructure described as code so a server can be rebuilt quickly, and DNS/health-based failover. That is where Kubernetes or managed platforms start to make sense — beyond this subject's scope.

</details>
