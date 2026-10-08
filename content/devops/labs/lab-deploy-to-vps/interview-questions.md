# Lab 11 — Interview Questions

## Beginner

### Q1. Why create the `.env` file directly on the server?

**Style:** Why

<details>
<summary>Answer</summary>

Secrets must never pass through Git, chat or shared drives. Creating `.env` on the server (or copying it once over SSH), with `chmod 600`, keeps the production password only where it is used.

</details>

## Intermediate

### Q2. After a reboot, the containers came back without anyone logging in. Which two settings made that happen?

**Style:** How

<details>
<summary>Answer</summary>

The Docker service is enabled at boot (`systemctl is-enabled docker` → `enabled`), and each service has `restart: unless-stopped`, so the daemon restarts the containers that were running.

</details>

### Q3. Why is exposing `PUBLIC_IP:8080` acceptable only as a temporary test?

**Style:** Trade-off

<details>
<summary>Answer</summary>

It serves plain HTTP (no TLS), exposes the application server directly (no proxy limits or headers), uses a non-standard port, and — because Docker bypasses ufw — stays open even if the firewall seems to block it. The next step puts Nginx with HTTPS in front and binds the app to `127.0.0.1`.

</details>
