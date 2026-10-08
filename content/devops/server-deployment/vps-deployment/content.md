# Deploying to a Linux VPS

**Module:** Server Deployment · **Interview priority:** Core

## What Is It?

A **VPS** (virtual private server) is a virtual machine you rent from a cloud or hosting provider: a public IP address, a few CPU cores, some RAM and disk, and root access to a Linux system. This lesson takes the Task API from your laptop to a VPS: secure the server, install Docker, upload the configuration, start the stack with Docker Compose and verify it — ending with the application reachable at `http://PUBLIC_IP:8080`.

The steps are provider-independent; every provider offers the same basics (choose an image, a size, a region and an SSH key).

```text
your laptop ──ssh (22)──► VPS 203.0.113.10 (Ubuntu LTS)
                           ├─ ufw: 22, 80, 443 open
                           ├─ Docker Engine + Compose plugin
                           └─ /opt/taskapi
                                ├─ compose.yaml
                                ├─ .env            (chmod 600)
                                └─ containers: app (8080) ── db (volume pgdata)
```

`203.0.113.10` is a documentation address used throughout this subject; use your server's IP.

> [!NOTE]
> Everything here runs on **your** VPS. StudyHub cannot create servers or deploy anything; the commands are instructions for your own environment.

## Why It Matters

- A VPS with Docker Compose is the simplest real production setup — and exactly what many small companies and side projects run.
- Doing it once by hand teaches what the CD pipeline later automates.
- "Have you deployed anything yourself?" is a strong interview differentiator.

## Choosing and Creating the Server

| Choice | Recommendation for the Task API |
|--------|---------------------------------|
| Image | Ubuntu Server LTS (the current long-term-support release) |
| Size | 2 GB RAM is comfortable for JVM + PostgreSQL; 1 GB works with swap and small heaps |
| Disk | 25 GB or more (images, logs, database, backups) |
| Authentication | Add your SSH **public key** at creation |
| Provider firewall | Allow 22 now; 80 and 443 for Nginx later; 8080 only for this lesson's test |

The provider shows the **public IPv4 address** when the server is ready.

## SSH Access and a Deployment User

```bash
# Illustrative: first login (the initial user is root or "ubuntu", depending on the provider)
ssh root@203.0.113.10
apt update && apt upgrade -y

adduser deploy                                      # set a password (used only for sudo)
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy   # give deploy the same authorized key
```

Open a **second** terminal and check `ssh deploy@203.0.113.10` works before changing SSH settings. Then disable password and root logins:

```bash
# Illustrative: as deploy, with sudo
sudo tee /etc/ssh/sshd_config.d/99-hardening.conf > /dev/null <<'EOF'
PasswordAuthentication no
PermitRootLogin no
EOF
sudo sshd -t && sudo systemctl reload ssh
```

`sshd -t` checks the configuration first; a broken file could lock you out. Keep the first session open until a new login works.

## Firewall

```bash
# Illustrative
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

Also check the **provider's** firewall (often called security groups or cloud firewall) — traffic must pass both.

> [!WARNING]
> **Common trap:** Docker writes its own iptables rules for published ports, so a container published as `8080:8080` is reachable from the internet **even though ufw does not allow 8080**. In this lesson that is how the test URL works; in [Nginx as a Reverse Proxy](../nginx-reverse-proxy/content.md) the app moves to `127.0.0.1:8080` and stops being public.

## Installing Docker and Docker Compose

From Docker's official repository (the Ubuntu-packaged `docker.io` is older and lacks the Compose plugin):

```bash
# Illustrative: needs root
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources > /dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker deploy          # then log out and in again
```

Verify (as `deploy`, in a new session):

```bash
# Illustrative
docker run --rm hello-world
docker compose version
systemctl is-enabled docker             # enabled: starts at boot
```

**Expected result:** `hello-world` prints "Hello from Docker!" and an explanation; `docker compose version` prints `Docker Compose version v2.…`; `is-enabled` prints `enabled`.

## Small Servers: Add Swap

A JVM and PostgreSQL on 1 GB of RAM can trigger the out-of-memory killer during start-up. A swap file is a cheap safety margin (not a substitute for RAM):

```bash
# Illustrative: needs root
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h                                  # Swap: 2.0Gi
```

## Uploading the Configuration

```bash
# Illustrative: on the server
sudo mkdir -p /opt/taskapi
sudo chown deploy:deploy /opt/taskapi
```

```bash
# Illustrative: on your laptop, in the project folder
scp compose.yaml deploy@203.0.113.10:/opt/taskapi/
```

Create the secrets file **on the server** (it never travels through Git):

```bash
# Illustrative: on the server
cd /opt/taskapi
nano .env                                # DB_PASSWORD=<long random value>, APP_IMAGE=…
chmod 600 .env
```

## Getting the Image to the Server

| Route | When | Commands |
|-------|------|----------|
| Copy the image directly | First manual deployment, no registry yet | `docker save taskapi:local \| gzip \| ssh deploy@203.0.113.10 'gunzip \| docker load'` |
| Pull from a registry | The normal way once CI builds images | `docker login ghcr.io` (private images), then `docker compose pull` |

The registry route is the subject of [Container Registry](../../ci-cd/container-registry/content.md). `docker save` streams the image (all layers) through SSH; it is slow for big images but needs nothing else.

> [!NOTE]
> Build the image for the server's CPU architecture. An image built on an Apple Silicon Mac is `arm64`; most VPSs are `amd64` (build with `docker build --platform linux/amd64 …`). CI runners on GitHub build `amd64` by default.

## Starting the Containers

For this lesson's test, the app must be reachable from outside, so change the port line in the server's `compose.yaml` **temporarily** from `"127.0.0.1:8080:8080"` to `"8080:8080"` and allow 8080 in the provider firewall.

```bash
# Illustrative: on the server, in /opt/taskapi
docker compose up -d
docker compose ps
```

**Expected result:** `db` becomes `healthy`, then `app` starts and becomes `healthy` within about a minute.

## Checking Logs and Health

```bash
# Illustrative: on the server
docker compose logs --tail 50 app
curl -s http://127.0.0.1:8080/actuator/health
curl -s http://127.0.0.1:8080/api/info
```

```bash
# Illustrative: from your laptop
curl -s http://203.0.113.10:8080/api/info
curl -s -X POST http://203.0.113.10:8080/api/tasks -H 'Content-Type: application/json' -d '{"title":"Deployed!"}'
```

**Expected result:** the health endpoint returns `{"groups":["liveness","readiness"],"status":"UP"}`; `/api/info` shows `"profiles":"prod"`, the image in `version` and the container ID in `host`; the task is created with status 201. Your application is live at `PUBLIC_IP:8080`.

## Updating the Deployment

```bash
# Illustrative: on the server — a new image tag is available
nano .env                                # APP_IMAGE=ghcr.io/your-user/taskapi:9b7e3d0
docker compose pull app
docker compose up -d app                 # recreates only the app container
docker compose ps
curl -fsS http://127.0.0.1:8080/actuator/health/readiness
```

## Rollback Basics

Because images are immutable and tagged, rollback is "run the previous tag":

```bash
# Illustrative
nano .env                                # APP_IMAGE back to …:4f2c1a9
docker compose up -d app
```

> [!WARNING]
> Rolling back the **application** does not roll back the **database**. If the new version's Flyway migration dropped or renamed a column, the old version may fail. Write migrations that are backward-compatible (add first, remove in a later release), and back up before risky ones.

## Production Relevance

- This is a complete production deployment for a small service; the remaining lessons add a reverse proxy, HTTPS and automation around it.
- Every manual step here (pull, up, health check, rollback) becomes a line of the CD pipeline's deploy script.

## Common Mistakes

- Working as root, leaving password login enabled.
- Enabling ufw without allowing SSH; forgetting the provider firewall.
- Leaving the app or database published on `0.0.0.0` after testing (Docker bypasses ufw).
- Committing `.env` or copying it through Git.
- Building on an ARM laptop and deploying to an AMD64 server ("exec format error").
- Rolling back the app without thinking about the schema.

## Interview Angle

- Describe your deployment: VPS, deployment user with keys, firewall, Docker Compose, `.env` with `600`, health check, rollback by tag.
- Explain why Docker-published ports bypass ufw and how you avoided exposing them.
- Explain why app rollback and database rollback are different problems.

## Key Takeaways

- A VPS is a rented Linux VM; secure it first: key-only SSH, non-root user, ufw plus the provider firewall.
- Install Docker Engine and the Compose plugin from Docker's repository; add the deployment user to the `docker` group.
- Deploy = configuration (`compose.yaml` + protected `.env`) + an image (copied or pulled) + `docker compose up -d` + a health check.
- Update by changing the tag and running `pull` + `up -d`; roll back by restoring the previous tag — with backward-compatible migrations.
