# Deploying to a Linux VPS — Practice

### P1. First step

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** server hardening

Which should happen before disabling SSH password authentication?

- A) Installing Docker
- B) Confirming key-based login works for the new user in a second session
- C) Enabling HTTPS
- D) Rebooting the server

<details>
<summary>Answer</summary>

**Answer:** B) Confirming key-based login works for the new user in a second session

</details>

### P2. Harden SSH

**Difficulty:** Easy · **Type:** Configuration · **Concepts:** sshd_config

Write the two `sshd` settings that disable password logins and root logins.

<details>
<summary>Answer</summary>

```text
PasswordAuthentication no
PermitRootLogin no
```

Then `sudo sshd -t && sudo systemctl reload ssh`.

</details>

### P3. Prepare the folder

**Difficulty:** Easy · **Type:** Command · **Concepts:** ownership

Create `/opt/taskapi` owned by `deploy`.

<details>
<summary>Answer</summary>

```bash
# Illustrative
sudo mkdir -p /opt/taskapi
sudo chown deploy:deploy /opt/taskapi
```

</details>

### P4. No registry yet

**Difficulty:** Medium · **Type:** Command · **Concepts:** docker save/load

Copy the local image `taskapi:local` to the server `203.0.113.10` (user `deploy`) without a registry.

<details>
<summary>Answer</summary>

```bash
# Illustrative
docker save taskapi:local | gzip | ssh deploy@203.0.113.10 'gunzip | docker load'
```

</details>

### P5. Deploy a new tag

**Difficulty:** Medium · **Type:** Command · **Concepts:** update

`.env` now says `APP_IMAGE=ghcr.io/you/taskapi:9b7e3d0`. Write the commands that deploy it and check readiness.

<details>
<summary>Answer</summary>

```bash
# Illustrative
docker compose pull app
docker compose up -d app
curl -fsS http://127.0.0.1:8080/actuator/health/readiness
```

</details>

### P6. Can't reach it

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** firewalls

On the server, `curl 127.0.0.1:8080/api/info` works. From your laptop, `curl http://203.0.113.10:8080/api/info` times out. The port line is `"8080:8080"`. What do you check?

<details>
<summary>Answer</summary>

The provider's firewall/security group (8080 not allowed — a timeout suggests packets are dropped), then that the port is published on `0.0.0.0` (`docker compose ps` shows `0.0.0.0:8080->8080/tcp`), and your laptop's network. ufw is not the cause here because Docker bypasses it for published ports.

</details>

### P7. Wrong architecture

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** platforms

The image built on an M-series MacBook fails on the VPS with `exec format error`. Write the fixed build command.

<details>
<summary>Answer</summary>

```bash
# Illustrative
docker build --platform linux/amd64 -t taskapi:local .
```

</details>

### P8. Safe rollback

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** rollback, migrations

Version 2 renamed the column `title` to `name` with a Flyway migration. It has a bug, and you roll back to version 1's image. What happens and how should the change have been made?

<details>
<summary>Answer</summary>

Version 1's entity expects `title`; with `ddl-auto: validate` it fails start-up (or queries fail), so the rollback breaks too. Use expand/contract: release A adds `name` and writes both columns; release B reads `name`; a later release drops `title`. Each step stays compatible with the previous version.

</details>

### P9. Memory on a small server

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** OOM

`docker compose ps` shows `db` restarting on a 1 GB VPS, and `journalctl -k` shows "Out of memory: Killed process … postgres". List three fixes.

<details>
<summary>Answer</summary>

Add a swap file; limit the JVM (`-XX:MaxRAMPercentage` with a container memory limit, smaller Hikari pool); give each container a memory limit; or move to a 2 GB server or a managed database.

</details>
