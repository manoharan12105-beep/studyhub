# Linux for Deployment

**Module:** DevOps Foundations · **Interview priority:** Core

## What Is It?

Almost every server you deploy to runs Linux. This lesson is the **minimum Linux a deployment needs**: log in securely, put files in the right place with the right permissions, see what is running and listening, read logs, check disk, memory and CPU, and work through a broken server calmly.

The Linux subject teaches each command in depth; links to it are given where you want more. Here every command is shown in its deployment context.

> [!NOTE]
> Commands in this lesson are run **on your machine or your server**, not in StudyHub. Blocks marked `# Illustrative` need a real server, root access or a network, so their output is not shown — the text says what to look for.

## Why It Matters

- Deploying, debugging and securing a service all happen in a terminal over SSH.
- Most "the deployment is broken" incidents are Linux-level: disk full, port already in use, wrong file owner, a process killed for using too much memory.
- Interviewers ask practical questions: "the app is down — what do you run first?"

## SSH and SSH Keys

**SSH** gives you an encrypted shell on a remote machine (port 22). Log in with a **key pair** instead of a password: the private key stays on your laptop, the public key goes into `~/.ssh/authorized_keys` on the server.

```bash
# Illustrative: on your laptop
ssh-keygen -t ed25519 -C "you@laptop"          # creates ~/.ssh/id_ed25519 (private) and .pub (public)
ssh-copy-id deploy@203.0.113.10                 # appends the public key to the server's authorized_keys
ssh deploy@203.0.113.10                         # log in (no password prompt when the key works)
scp compose.yaml deploy@203.0.113.10:/opt/taskapi/   # copy a file to the server
```

| File | Where | Rule |
|------|-------|------|
| `~/.ssh/id_ed25519` | Laptop | Private: never share, never commit, mode `600` |
| `~/.ssh/id_ed25519.pub` | Laptop → server | Public: safe to copy |
| `~/.ssh/authorized_keys` | Server | Public keys allowed to log in, mode `600`, directory `~/.ssh` mode `700` |
| `~/.ssh/known_hosts` | Laptop | Fingerprints of servers you trust |

The address `203.0.113.10` is from a documentation range; use your server's public IP. Deeper: [SSH, Keys, scp and rsync](../../../linux/remote-access/ssh-and-remote-access/content.md).

## Users and Groups

Never run your application or your daily work as `root`. Create a normal user, give it `sudo` for administration, and let it use Docker through the `docker` group:

```bash
# Illustrative: needs root
adduser deploy                      # create the user (asks for a password)
usermod -aG sudo deploy             # may run commands with sudo
usermod -aG docker deploy           # may talk to the Docker daemon (after Docker is installed)
id deploy                           # shows uid, gid and groups
```

> [!WARNING]
> **Common trap:** membership of the `docker` group is effectively root — anyone in it can start a container that mounts `/`. Add only trusted deployment users. A new group membership applies after the user logs in again.

## File Permissions

Every file has an owner, a group and `rwx` permissions for owner, group and others.

```bash
# Illustrative
ls -l /opt/taskapi
chmod 600 /opt/taskapi/.env          # secrets: owner may read/write, nobody else
chmod 755 /opt/taskapi/deploy.sh     # script: everyone may run it, only the owner may change it
chown deploy:deploy /opt/taskapi/.env
```

| Mode | Meaning | Typical file |
|------|---------|--------------|
| `600` | rw for owner only | `.env`, private keys |
| `644` | owner rw, others read | config files, `compose.yaml` |
| `755` | owner rwx, others rx | scripts, directories |

Deeper: [File Permissions and chmod](../../../linux/permissions/file-permissions/content.md) and [Ownership: chown, chgrp and umask](../../../linux/permissions/ownership-and-umask/content.md).

## Processes and Process Management

```bash
# Illustrative
ps aux | grep java                  # every java process with its PID, user, CPU and memory
top                                 # live view; press P (CPU) or M (memory) to sort, q to quit
kill 4182                           # ask PID 4182 to stop (SIGTERM): it can shut down cleanly
kill -9 4182                        # force (SIGKILL): last resort, no cleanup
```

A Java service should stop on `SIGTERM` (Spring Boot then shuts down gracefully). Use `kill -9` only when a process ignores `SIGTERM`. Deeper: [Processes and the Process Lifecycle](../../../linux/processes/linux-processes/content.md).

## Ports

A service listens on a port; only one process can listen on a given address and port.

```bash
# Illustrative
sudo ss -ltnp                       # listening TCP sockets with the owning process
curl -i http://localhost:8080/actuator/health    # does the app answer locally?
```

| Column in `ss -ltnp` | Read it as |
|----------------------|------------|
| `Local Address:Port` `127.0.0.1:8080` | Reachable only from this server |
| `Local Address:Port` `0.0.0.0:8080` or `*:8080` | Reachable on every interface (from outside too, unless a firewall blocks it) |
| `users:(("java",pid=…))` | Which process holds the port |

Deeper: [Ports, Sockets and HTTP Tools](../../../linux/networking/ports-and-http-tools/content.md).

## Services

**systemd** starts services at boot and restarts them when they fail. Docker, Nginx and SSH are systemd services on the server:

```bash
# Illustrative
systemctl status docker             # running? since when? last log lines
sudo systemctl enable --now nginx   # start now and at every boot
sudo systemctl restart nginx
sudo systemctl reload nginx         # re-read config without dropping connections
journalctl -u nginx --since "10 min ago"   # that service's logs
```

In this subject your application runs as a **container** managed by Docker (with a restart policy), not as its own systemd unit — but the Docker daemon itself is a systemd service. Deeper: [systemd and Services](../../../linux/system-management/systemd-and-services/content.md).

## Environment Variables

Processes read configuration from environment variables; Spring Boot maps `SPRING_DATASOURCE_URL` to `spring.datasource.url`.

```bash
# Illustrative
export SPRING_PROFILES_ACTIVE=prod          # visible to programs started from this shell
echo "$SPRING_PROFILES_ACTIVE"
env | grep SPRING                           # all variables starting with SPRING
SPRING_PROFILES_ACTIVE=prod java -jar app.jar   # set only for this one command
```

A variable set with `export` disappears when the shell exits. For a deployed container, variables come from `compose.yaml` and the `.env` file next to it (see [Configuration and Secrets](../../production-readiness/configuration-and-secrets/content.md)).

## Logs

```bash
# Illustrative
tail -f /var/log/nginx/access.log           # follow new lines (Ctrl+C to stop)
tail -n 50 /var/log/nginx/error.log         # the last 50 lines
grep " 502 " /var/log/nginx/access.log | head    # requests that got 502
less /var/log/syslog                        # page through a big file (/ to search, q to quit)
journalctl -u docker -n 100 --no-pager      # last 100 lines of a systemd service
docker compose logs --tail 100 app          # the application container (Docker lessons)
```

Deeper: [Logs: /var/log, journalctl and Log Rotation](../../../linux/system-management/logs-and-journalctl/content.md).

## Disk, Memory and CPU

```bash
# Illustrative
df -h                                # free space per filesystem; watch Use% on /
du -sh /var/lib/docker /var/log      # how big these directories are
free -h                              # memory: look at "available", not "free"
top                                  # load average (top-right) and the busiest processes
```

| Symptom | Check | Typical cause on a Docker host |
|---------|-------|--------------------------------|
| "No space left on device" | `df -h`, then `du -sh` | Old images, container logs, database growth |
| App killed, restarts | `free -h`, `dmesg` / `journalctl -k` for "Out of memory" | JVM heap too large for the server |
| Slow responses | `top` | One process using all CPU |

Deeper: [Disk Usage: df and du](../../../linux/storage/disk-usage-df-du/content.md).

## Finding and Moving Files

```bash
# Illustrative
pwd                                  # where am I?
mkdir -p /opt/taskapi/backups        # create the folder and any missing parents
cp compose.yaml compose.yaml.bak     # copy (keep a backup before editing)
mv taskapi.conf /etc/nginx/sites-available/   # move or rename
find /var/log -name "*.log" -size +100M        # big log files
cat /etc/os-release                  # which distribution and version
head -n 20 application.log           # the first lines of a file
wget -q https://example.com/file.txt # download a file (curl -O works too)
rm compose.yaml.bak                  # delete one file — there is no recycle bin
```

> [!CAUTION]
> `rm` is permanent. Never run `rm -rf` with a variable or wildcard you have not checked (`rm -rf "$DIR"/*` with an empty `$DIR` deletes from `/`). List first (`ls`), delete second.

## Basic Firewall Concepts

A firewall decides which incoming connections reach the server. On Ubuntu, `ufw` is the simple front end:

```bash
# Illustrative: needs root — allow SSH BEFORE enabling, or you lock yourself out
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

Open only what the public needs: 22 (SSH), 80 and 443 (Nginx). The database port 5432 and the application port 8080 stay closed.

> [!WARNING]
> **Common trap:** ports published by Docker (`-p 8080:8080`) are added to iptables by Docker itself and are **reachable even when ufw denies them**. Publish internal ports on `127.0.0.1` only (`127.0.0.1:8080:8080`) — the [VPS Deployment](../../server-deployment/vps-deployment/content.md) lesson shows this.

## Troubleshooting a Server

A calm, repeatable order of checks when "the site is down":

```text
1. Can I reach the server?      ssh deploy@IP            (no → network, firewall, server down)
2. Is the disk full?            df -h                    (100 % → find big files, clean safely)
3. Is memory exhausted?         free -h, journalctl -k   (OOM kills)
4. Is the service running?      docker compose ps / systemctl status nginx
5. Is it listening?             sudo ss -ltnp            (right port? 127.0.0.1 or 0.0.0.0?)
6. Does it answer locally?      curl -i localhost:8080/actuator/health
7. What do the logs say?        docker compose logs --tail 100 app, Nginx error.log
```

Work from the bottom of the stack up, and change one thing at a time. The [Production Troubleshooting lab](../../labs/lab-production-troubleshooting/content.md) practises this order.

## Production Relevance

- A deployment user with a key, `600` on secrets and a firewall that exposes only 22/80/443 is the baseline security of every small production server.
- `df -h`, `free -h`, `ss -ltnp` and the logs answer most production questions in a minute.

## Common Mistakes

- Logging in as `root` with a password over SSH.
- `chmod 777` to "fix" a permission error — it hides the real cause and opens the file to everyone.
- Enabling the firewall before allowing SSH.
- Killing processes with `-9` by habit, skipping graceful shutdown.
- Reading `free`'s "free" column and concluding memory is exhausted (Linux uses spare memory for cache; look at "available").

## Interview Angle

- Explain key-based SSH: which key goes where and why the private key never leaves your machine.
- Describe how you would find what is using port 8080 (`ss -ltnp`) and what is filling the disk (`df -h` then `du`).
- Give a step-by-step order of checks for a down service.

## Key Takeaways

- Use SSH keys and a non-root deployment user; protect secrets with `600`.
- `ps`, `top`, `free`, `df`, `du`, `ss` and `curl` show the state of a server; `tail`, `less`, `grep` and `journalctl` read what happened.
- Open only ports 22, 80 and 443 to the internet, and remember Docker can bypass ufw for published ports.
- Troubleshoot bottom-up: reachability, disk, memory, process, port, local response, logs.
