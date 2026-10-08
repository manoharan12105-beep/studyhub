# Block 1: DevOps and Linux

## DevOps in Five Lines

1. The team that builds a service also delivers and runs it — with automation.
2. **CI** builds and tests every change; **continuous delivery** makes it releasable (approval); **continuous deployment** releases it automatically.
3. Build once, deploy the same **immutable image** everywhere; only configuration differs per environment.
4. Small, frequent changes are safer than big, rare ones.
5. Lifecycle: plan → code → build → test → release → deploy → operate → monitor → plan.

## Linux You Must Know Cold

| Need | Command |
|------|---------|
| Log in securely | `ssh deploy@IP` with an ed25519 key; passwords and root login disabled |
| Who holds port 8080 | `sudo ss -ltnp 'sport = :8080'` |
| Disk full? | `df -h` → `sudo du -xh --max-depth=1 /var \| sort -h` |
| Memory | `free -h` → look at **available** |
| Killed by OOM? | `journalctl -k \| grep -i "out of memory"` |
| Service state | `systemctl status nginx docker` |
| Follow a log | `tail -f /var/log/nginx/error.log` |
| Stop a process | `kill PID` (SIGTERM) before `kill -9` |
| Secret file | `chmod 600 .env` |

## Firewall Truths

- `ufw allow OpenSSH` **before** `ufw enable`.
- Only 22, 80, 443 public.
- Docker-published ports bypass ufw → publish internal ports on `127.0.0.1`.

## Self-Check

- Delivery vs deployment in one sentence each?
- Why is `docker` group membership dangerous?
- Your order of checks when "the site is down"?
