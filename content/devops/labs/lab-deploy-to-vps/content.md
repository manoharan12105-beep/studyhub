# Lab 11 — Deploy to a Linux VPS

**Lab:** 11 · **Module:** Deploying to a Linux VPS · **Verification:** Instruction only

> [!NOTE]
> Run on **your** VPS. **Instruction only:** no server was created when this lab was written. Commands follow the official Docker installation steps and standard Ubuntu administration; results are described, not captured.

## Objective

Deploy the Task API stack to a real Linux server and reach it at `http://PUBLIC_IP:8080`.

## Prerequisites

- A VPS with Ubuntu LTS, 2 GB RAM recommended, your SSH public key added at creation.
- [Lab 10](../lab-production-configuration/content.md) done; image `taskapi:local` built for `linux/amd64` (`docker build --platform linux/amd64 -t taskapi:local .` on Apple Silicon).
- Lessons: [Linux for Deployment](../../devops-foundations/linux-for-deployment/content.md), [Deploying to a Linux VPS](../../server-deployment/vps-deployment/content.md).

In this lab `203.0.113.10` stands for your server's public IP.

## Scenario

Your API must be reachable by a friend's laptop for a demo. No registry or domain yet — just the server.

## Steps

### Step 1: First login and updates

```bash
ssh root@203.0.113.10            # or ubuntu@… depending on the provider
apt update && apt upgrade -y
```

### Step 2: Deployment user and SSH hardening

Follow "SSH Access and a Deployment User" in the [VPS lesson](../../server-deployment/vps-deployment/content.md): create `deploy`, give it `sudo`, copy the authorized key, verify `ssh deploy@203.0.113.10` in a **second** terminal, then disable password and root login and `sudo systemctl reload ssh`.

### Step 3: Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

In the provider's firewall allow 22, 80, 443 and — **for this lab only** — 8080.

### Step 4: Install Docker and the Compose plugin

Run the "Installing Docker and Docker Compose" commands from the VPS lesson, then `sudo usermod -aG docker deploy`, log out and in, and check:

```bash
docker run --rm hello-world
docker compose version
```

### Step 5: Upload configuration and image

```bash
# On the server
sudo mkdir -p /opt/taskapi && sudo chown deploy:deploy /opt/taskapi
```

```bash
# On your laptop, in the project folder
scp compose.yaml deploy@203.0.113.10:/opt/taskapi/
docker save taskapi:local | gzip | ssh deploy@203.0.113.10 'gunzip | docker load'
```

```bash
# On the server: create the secrets file there, not via Git
cd /opt/taskapi
printf 'APP_IMAGE=taskapi:local\nDB_PASSWORD=%s\n' "$(openssl rand -base64 24)" > .env
chmod 600 .env
```

**Expected result:** `docker load` ends with `Loaded image: taskapi:local`; `ls -l .env` shows `-rw-------`.

### Step 6: Publish temporarily and start

Edit `/opt/taskapi/compose.yaml`: change the app's port line to `"8080:8080"` (this lab only). Then:

```bash
docker compose up -d
docker compose ps
docker compose logs --tail 30 app
curl -s http://127.0.0.1:8080/actuator/health
```

**Expected result:** both services `Up (healthy)`; health `{"groups":["liveness","readiness"],"status":"UP"}`.

### Step 7: Test from outside

```bash
# On your laptop
curl -s http://203.0.113.10:8080/api/info
curl -s -X POST http://203.0.113.10:8080/api/tasks -H 'Content-Type: application/json' -d '{"title":"Hello from the internet"}'
```

**Expected result:** `/api/info` shows `"profiles":"prod"` and the container ID; the task is created. Your application is live at `PUBLIC_IP:8080`.

### Step 8: Survive a reboot

```bash
sudo reboot
# wait a minute, ssh in again
docker compose -f /opt/taskapi/compose.yaml ps
```

**Expected result:** both containers are running again (Docker is enabled at boot; `restart: unless-stopped`), and your task is still there.

## Verification Checklist

- ☐ Key-only SSH as `deploy`; root and password login disabled.
- ☐ ufw active with 22/80/443; the provider firewall matches.
- ☐ `http://PUBLIC_IP:8080/api/info` works from your laptop.
- ☐ The stack and data survived a reboot.
- ☐ You know that port 8080 must be closed again in Lab 12.

## Common Mistakes

- Locking yourself out (ufw without OpenSSH; disabling passwords before testing keys).
- Copying `.env` from your laptop through Git or chat.
- An `arm64` image on an `amd64` server (`exec format error`).

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `curl` from laptop times out | Provider firewall blocks 8080; port line still `127.0.0.1:8080:8080` |
| `exec format error` in app logs | Rebuild with `--platform linux/amd64` |
| `app` restarts; logs show OOM / `db` killed | Add swap (VPS lesson) or a bigger server |
| `permission denied … docker.sock` | Log out and in after `usermod -aG docker` |
