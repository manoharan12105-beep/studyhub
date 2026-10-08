# Linux for Deployment — Practice

These items describe commands to run on a Linux server or VM, not in StudyHub.

### P1. Which key goes to the server?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** SSH keys

After `ssh-keygen -t ed25519`, which file do you copy to the server?

- A) `~/.ssh/id_ed25519`
- B) `~/.ssh/id_ed25519.pub`
- C) `~/.ssh/known_hosts`
- D) Both key files

<details>
<summary>Answer</summary>

**Answer:** B) `~/.ssh/id_ed25519.pub`

**Explanation:** The public key goes into the server's `~/.ssh/authorized_keys`. The private key never leaves your machine.

</details>

### P2. Read the permission

**Difficulty:** Easy · **Type:** Output · **Concepts:** chmod

`ls -l .env` prints `-rw-r--r-- 1 deploy deploy 96 Jan 15 09:30 .env`. Who can read the file, and what command fixes it?

<details>
<summary>Answer</summary>

Owner, group and everyone else can read it (`644`). For a secrets file run `chmod 600 .env` so only the owner can read and write it.

</details>

### P3. Free the port

**Difficulty:** Easy · **Type:** Command · **Concepts:** ss, kill

Spring Boot fails with "Port 8080 was already in use". Write the command to find the process holding the port.

<details>
<summary>Answer</summary>

```bash
# Illustrative
sudo ss -ltnp 'sport = :8080'
```

Then decide whether it is safe to stop it (`kill <PID>`, SIGTERM first).

</details>

### P4. Firewall order

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** ufw

Which command must come before `sudo ufw enable` on a remote server?

- A) `sudo ufw allow 443/tcp`
- B) `sudo ufw allow OpenSSH`
- C) `sudo ufw default allow`
- D) `sudo ufw reload`

<details>
<summary>Answer</summary>

**Answer:** B) `sudo ufw allow OpenSSH`

**Explanation:** Without it, enabling the firewall blocks your own SSH connection.

</details>

### P5. Memory or cache?

**Difficulty:** Medium · **Type:** Output · **Concepts:** free -h

```text
               total        used        free      shared  buff/cache   available
Mem:           1.9Gi       1.1Gi       120Mi       4.0Mi       780Mi       820Mi
```

Is the server close to running out of memory?

<details>
<summary>Answer</summary>

No. About 820 MiB is **available** — most of the cache can be reclaimed on demand. "free" is low only because Linux uses spare memory as page cache.

</details>

### P6. Disk is full

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** df, du

`df -h /` shows 100 % used on a Docker host. Write the commands that find which directory under `/var` is large, without crossing into other filesystems.

<details>
<summary>Answer</summary>

```bash
# Illustrative
sudo du -xh --max-depth=1 /var 2>/dev/null | sort -h | tail -5
```

On Docker hosts the usual suspects are `/var/lib/docker` (images, container logs, volumes) and `/var/log`. Then `docker system df` shows what Docker itself uses.

</details>

### P7. Follow the error log

**Difficulty:** Medium · **Type:** Command · **Concepts:** tail, grep

Show the last 20 lines of `/var/log/nginx/error.log`, then follow new lines that contain `upstream`.

<details>
<summary>Answer</summary>

```bash
# Illustrative
sudo tail -n 20 /var/log/nginx/error.log
sudo tail -f /var/log/nginx/error.log | grep upstream
```

</details>

### P8. Why can't the user run docker?

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** groups

`sudo usermod -aG docker deploy` was run while `deploy` was logged in. `docker ps` still says permission denied on `/var/run/docker.sock`. What should `deploy` do?

<details>
<summary>Answer</summary>

Log out and SSH in again (or start a new login session) — groups are read at login. `id` should then list `docker`.

</details>

### P9. Reachable despite the firewall

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** Docker and ufw

`sudo ufw status` shows only 22, 80 and 443 allowed, but `curl http://SERVER_IP:8080` from your laptop reaches the Spring Boot container started with `-p 8080:8080`. Explain and fix.

<details>
<summary>Answer</summary>

Docker adds its own iptables rules for published ports, which take effect before ufw's rules, so ufw does not filter that traffic. Publish the port on loopback only (`-p 127.0.0.1:8080:8080` or `"127.0.0.1:8080:8080"` in Compose) and reach the app through Nginx on 80/443.

</details>

### P10. Order the checks

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** troubleshooting workflow

The API returns errors. Order these checks from the bottom of the stack up: read app logs, `df -h`, `curl localhost:8080/actuator/health`, `ssh` into the server, `sudo ss -ltnp`, `docker compose ps`.

<details>
<summary>Answer</summary>

`ssh` → `df -h` → `docker compose ps` → `sudo ss -ltnp` → `curl localhost:8080/actuator/health` → read app logs. Each step rules out one layer before you look higher.

</details>
