# Security and Production Basics — Practice

### P1. Which ports?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** exposed ports

Which set of ports should be reachable from the internet on the Task API server?

- A) 22, 80, 443, 5432, 8080
- B) 22, 80, 443
- C) 80, 8080
- D) Only 443

<details>
<summary>Answer</summary>

**Answer:** B) 22, 80, 443

</details>

### P2. Non-root container

**Difficulty:** Easy · **Type:** Dockerfile · **Concepts:** least privilege

Add the lines to a runtime stage so the application runs as a system user `spring`.

<details>
<summary>Answer</summary>

```dockerfile
RUN useradd --system --uid 10001 spring
USER spring
```

</details>

### P3. What is listening?

**Difficulty:** Easy · **Type:** Command · **Concepts:** attack surface

List listening TCP sockets with their processes, hiding those bound to `127.0.0.1`.

<details>
<summary>Answer</summary>

```bash
# Illustrative
sudo ss -ltnp | grep -v '127.0.0.1'
```

</details>

### P4. Automatic updates

**Difficulty:** Easy · **Type:** Command · **Concepts:** patching

Install and enable automatic security updates on Ubuntu.

<details>
<summary>Answer</summary>

```bash
# Illustrative
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

</details>

### P5. GUI access to the database

**Difficulty:** Medium · **Type:** Command · **Concepts:** SSH tunnel

PostgreSQL is published on the server's `127.0.0.1:5432` only. Open a tunnel so DBeaver on your laptop can connect to `localhost:15432`.

<details>
<summary>Answer</summary>

```bash
# Illustrative
ssh -L 15432:127.0.0.1:5432 deploy@203.0.113.10
```

</details>

### P6. Nightly backup in cron

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** backup automation

Write a crontab line that dumps `taskdb` daily at 03:00 into `/opt/taskapi/backups` with the date in the file name.

<details>
<summary>Answer</summary>

```text
0 3 * * * cd /opt/taskapi && docker compose exec -T db pg_dump -U taskapp -d taskdb -Fc > backups/taskdb-$(date +\%F).dump
```

`-T` because cron has no terminal; `\%` because `%` is special in crontab.

</details>

### P7. Minimal CI permissions

**Difficulty:** Medium · **Type:** CI/CD · **Concepts:** least privilege in CI

Which `permissions` should a job that only checks out code and pushes an image to GHCR have?

<details>
<summary>Answer</summary>

```yaml
permissions:
  contents: read
  packages: write
```

</details>

### P8. Security review

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** baseline review

Review: SSH allows passwords, the app runs as root in the container, Compose publishes `5432:5432`, backups are written to `/opt/taskapi/backups` only, the image was last rebuilt eight months ago. Give one fix each.

<details>
<summary>Answer</summary>

`PasswordAuthentication no` (keys only); `USER spring` in the Dockerfile; remove the `ports` of `db`; copy backups off the server (encrypted) and test restores; rebuild and redeploy regularly (scheduled workflow) to pick up base-image and JRE fixes.

</details>

### P9. Socket mount

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** container escape

A teammate adds `- /var/run/docker.sock:/var/run/docker.sock` to the app service "so it can restart itself". Why reject it?

<details>
<summary>Answer</summary>

Access to the Docker socket is root on the host: any code-execution bug in the app would let an attacker start a privileged container mounting `/`. Restarts belong to restart policies, health checks and the deployment script, not the application.

</details>
