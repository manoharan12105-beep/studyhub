# Linux Deployment

## Access

| Command | Does |
|---------|------|
| `ssh-keygen -t ed25519` | Create a key pair |
| `ssh-copy-id deploy@IP` | Install your public key on the server |
| `ssh deploy@IP` | Log in |
| `scp file deploy@IP:/opt/taskapi/` | Copy a file to the server |
| `ssh -L 15432:127.0.0.1:5432 deploy@IP` | Tunnel a remote port to your laptop |
| `sudo sshd -t && sudo systemctl reload ssh` | Check and apply SSH config |

## Users and Permissions

| Command | Does |
|---------|------|
| `adduser deploy` · `usermod -aG sudo,docker deploy` | User with sudo and Docker (log in again) |
| `id deploy` | Groups |
| `chmod 600 .env` · `chmod 755 deploy.sh` | Secret file · executable script |
| `chown deploy:deploy /opt/taskapi` | Owner |

## Processes, Ports, Services

| Command | Does |
|---------|------|
| `ps aux \| grep java` | Find processes |
| `top` (P / M to sort) | Live CPU and memory |
| `kill PID` · `kill -9 PID` | SIGTERM · SIGKILL (last resort) |
| `sudo ss -ltnp` | Listening TCP ports + processes |
| `curl -i localhost:8080/actuator/health` | Test HTTP locally |
| `systemctl status nginx` | Service state + last logs |
| `sudo systemctl enable --now nginx` | Start now and at boot |
| `sudo systemctl reload nginx` | Apply config without downtime |

## Logs

| Command | Does |
|---------|------|
| `journalctl -u docker -n 100 --no-pager` | A unit's last 100 lines |
| `journalctl -k` | Kernel: OOM kills |
| `tail -f /var/log/nginx/access.log` | Follow a file |
| `grep " 502 " /var/log/nginx/access.log` | Filter |
| `less file` (`/` search, `q` quit) | Page through |

## Disk and Memory

| Command | Watch |
|---------|-------|
| `df -h` | `Use%` of `/` |
| `sudo du -xh --max-depth=1 /var \| sort -h` | Biggest directories |
| `free -h` | `available`, not `free` |
| `uptime` | Load vs CPU count |

## Firewall (ufw)

```bash
sudo ufw allow OpenSSH      # FIRST
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

Docker-published ports bypass ufw → publish internal ports on `127.0.0.1`.

## Packages and Updates

```bash
sudo apt update && sudo apt upgrade
sudo apt install unattended-upgrades
cat /var/run/reboot-required
```
