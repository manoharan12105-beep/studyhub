# Security and Production Basics

**Module:** Operations and Security · **Interview priority:** Frequently asked

## What Is It?

The security baseline every deployed server needs — not an advanced cybersecurity course, but the small set of habits that stop the most common real attacks on small deployments: brute-forced SSH, exposed databases, leaked secrets, unpatched software and unrecoverable data loss.

## Why It Matters

- A new public server receives automated login attempts and port scans within minutes of getting an IP address.
- Exposed PostgreSQL and Redis ports, default passwords and committed secrets are among the most common causes of breaches of small projects.
- Interviewers expect a deployed project to come with a credible security answer.

## Attack Surface Awareness

The **attack surface** is everything reachable by an attacker. Shrink it:

```text
Internet ──► 22 (SSH, keys only) ──► server
         ──► 80/443 (Nginx)      ──► 127.0.0.1:8080 (app) ──► db:5432 (Docker network only)
Everything else: closed or bound to localhost.
```

```bash
# Illustrative: what listens on public interfaces?
sudo ss -ltnp | grep -v '127.0.0.1'
```

Expect only `sshd` on 22 and `nginx` on 80/443. Anything else needs a reason.

## SSH Keys Instead of Passwords

- Key-only login: `PasswordAuthentication no`, `PermitRootLogin no` ([VPS Deployment](../../server-deployment/vps-deployment/content.md)).
- One key per person and a separate key for CI deployments, so access can be revoked individually.
- Protect private keys with a passphrase on laptops; never commit them.
- Optional: `fail2ban` bans IPs after repeated failures — useful noise reduction, but key-only login is the real protection.

## Firewall and Exposed Ports

| Port | Open to the internet? |
|------|-----------------------|
| 22 (SSH) | Yes (optionally only from your IP) |
| 80, 443 (Nginx) | Yes |
| 8080 (app) | **No** — `127.0.0.1:8080:8080` |
| 5432 (PostgreSQL) | **No** — not published at all |

Two firewalls: ufw on the server and the provider's firewall. And remember Docker's published ports bypass ufw — binding to `127.0.0.1` (or not publishing) is what actually protects internal services.

## PostgreSQL Should Not Be Public

A published `5432:5432` invites password-guessing and exploits against the database itself. The application reaches PostgreSQL over the Docker network; administrators use `docker compose exec db psql …` over SSH, or an SSH tunnel for GUI tools:

```bash
# Illustrative: from your laptop — forwards localhost:15432 to the server's loopback
ssh -L 15432:127.0.0.1:5432 deploy@203.0.113.10
```

(This needs the database published on the server's `127.0.0.1` only, for example temporarily `"127.0.0.1:5432:5432"`.)

## Secrets and Environment Variables

- Secrets only in the server's `.env` (`chmod 600`) and GitHub Secrets; `.env` in `.gitignore`.
- Never in images, `ENV`/`ARG`, workflow files, logs or Actuator endpoints.
- Rotate after any suspected leak and when people leave the team.

Details: [Configuration and Secrets](../../production-readiness/configuration-and-secrets/content.md).

## Least Privilege

| Where | Practice |
|-------|----------|
| Server | Work as `deploy`, not root; `sudo` only when needed |
| Docker group | Only trusted users — it is root-equivalent |
| Containers | Non-root user in the image (`USER spring`); no `--privileged`; never mount `/var/run/docker.sock` into an app container |
| Database | Application role owns only its database; not the `postgres` superuser |
| CI | `permissions:` set per job (`contents: read`, `packages: write` only where needed); deploy key used only for deployments |
| Registry | The server's token can only read packages |

## HTTPS

All public traffic over HTTPS with automatic renewal, HTTP redirected, HSTS once stable, TLS 1.2+ only ([Domain, DNS and HTTPS](../../server-deployment/domain-dns-and-https/content.md)).

## Updating Server Packages

```bash
# Illustrative: needs root
sudo apt update && sudo apt upgrade
sudo apt install unattended-upgrades          # usually preinstalled on Ubuntu
sudo dpkg-reconfigure -plow unattended-upgrades
cat /var/run/reboot-required 2>/dev/null      # a kernel update waits for a reboot
```

Unattended upgrades install security updates automatically; plan reboots for kernel updates (containers with `restart: unless-stopped` come back by themselves).

## Docker Image Updates

Your image contains a base OS and a JRE that receive security fixes. Rebuilding regularly picks them up:

- Rebuild and redeploy at least monthly even without code changes (a scheduled workflow with `on: schedule` can do it).
- Keep Spring Boot and dependencies on supported versions (Dependabot or Renovate open pull requests for updates).
- Optionally scan images for known vulnerabilities (`docker scout`, Trivy) in CI.
- Update `postgres:18` minor versions with `docker compose pull db && docker compose up -d db`; major versions need a planned upgrade.

## Backup Strategy

| Question | Answer for the Task API |
|----------|-------------------------|
| What? | The PostgreSQL database (`pg_dump -Fc`); `.env` and configuration (stored securely elsewhere) |
| How often? | Daily at least (cron or a systemd timer on the server) |
| Where? | Off the server: object storage or another machine, encrypted |
| How long? | e.g. 7 daily + 4 weekly + 3 monthly |
| Tested? | Restore into a scratch container regularly |

```bash
# Illustrative: crontab -e for the deploy user — daily at 02:30
30 2 * * * cd /opt/taskapi && docker compose exec -T db pg_dump -U taskapp -d taskdb -Fc > backups/taskdb-$(date +\%F).dump
```

`-T` disables the pseudo-terminal (cron has none, and a TTY could corrupt binary output); `%` must be escaped as `\%` inside crontab. Add the off-site copy and old-file cleanup as the next steps of the same job.

## Production Relevance

This baseline — keys, firewall, nothing internal exposed, least privilege, secrets out of Git, HTTPS, updates and tested backups — defeats the automated attacks that hit every public server, and makes recovery possible when something still goes wrong.

## Common Mistakes

- Password SSH login, or root login, left enabled.
- `5432:5432` or `8080:8080` published "temporarily" and forgotten.
- `chmod 777` and running containers as root.
- Images never rebuilt, so base-image vulnerabilities accumulate.
- Backups on the same disk, never restored.

## Interview Angle

- List the security measures of your deployment from the outside in: firewall → SSH → HTTPS → Nginx → app (non-root, secrets) → database (not exposed, least-privilege role) → backups.
- Explain why the database is not published and how you still administer it.
- Explain least privilege with concrete examples.

## Key Takeaways

- Expose only 22, 80 and 443; bind or hide everything else — Docker can bypass ufw.
- Keys, not passwords; non-root everywhere; minimal CI and registry permissions.
- Secrets only in protected `.env` and GitHub Secrets; rotate after leaks.
- Patch the OS automatically, rebuild images regularly, and keep tested off-site backups.
