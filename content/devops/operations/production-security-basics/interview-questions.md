# Security and Production Basics — Interview Questions

## Beginner

### Q1. What security measures did you apply to your deployment server?

**Style:** What

<details>
<summary>Answer</summary>

Key-only SSH with root login disabled; a non-root deployment user; a firewall exposing only 22, 80 and 443 (ufw and the provider firewall); the application bound to `127.0.0.1` behind Nginx with HTTPS; PostgreSQL not published; secrets in a `chmod 600` `.env` outside Git; non-root containers; automatic security updates; and daily off-site database backups with tested restores.

</details>

### Q2. Why should PostgreSQL not be exposed to the internet?

**Style:** Why

<details>
<summary>Answer</summary>

Nothing outside the server needs it — the application connects over the Docker network. A public database port invites password brute force and exploitation of database vulnerabilities, and a single weak credential exposes all data. Administer it through SSH (`docker compose exec db psql`) or an SSH tunnel.

</details>

### Q3. What is the principle of least privilege?

**Style:** What

<details>
<summary>Answer</summary>

Every user, process and token gets only the permissions it needs, for as long as it needs them. Examples: a non-root container user, an application database role without superuser rights, a read-only registry token on the server, CI jobs with minimal `permissions:`, and a dedicated deploy key.

</details>

### Q4. Why do Docker images need to be rebuilt even when the code has not changed?

**Style:** Why

<details>
<summary>Answer</summary>

The base image's OS packages and the JRE receive security fixes. An image built months ago keeps the old, vulnerable versions until it is rebuilt from an updated base and redeployed.

</details>

## Intermediate

### Q5. What is the attack surface of a VPS running your stack, and how do you minimise it?

**Style:** Architecture

<details>
<summary>Answer</summary>

Everything reachable from outside: open ports and the services behind them (SSH, Nginx), plus credentials, the CI pipeline and the registry. Minimise it by opening only 22/80/443, binding internal services to localhost or Docker networks, key-only SSH, removing unused software, minimal images, least-privilege tokens, and keeping everything patched. Verify with `sudo ss -ltnp` and an external port scan of your own server.

</details>

### Q6. Why is membership in the `docker` group dangerous?

**Style:** Trap

<details>
<summary>Answer</summary>

The Docker daemon runs as root, and anyone who can talk to its socket can start a container that mounts the host's root filesystem or runs privileged — effectively root on the host. Grant it only to trusted administrators and deployment users, and never mount the Docker socket into application containers.

</details>

### Q7. How would you back up a PostgreSQL container on a VPS?

**Style:** How

<details>
<summary>Answer</summary>

A scheduled job (cron or systemd timer) running `docker compose exec -T db pg_dump -U taskapp -d taskdb -Fc > backups/taskdb-<date>.dump`, then copying the file off the server (encrypted), keeping a retention scheme, monitoring that the job succeeded, and regularly restoring a backup into a scratch container to prove it works.

</details>

### Q8. Is `fail2ban` enough to secure SSH?

**Style:** Trade-off

<details>
<summary>Answer</summary>

No. It slows brute-force attempts by banning noisy IPs, but distributed attacks use many IPs. The real protection is key-only authentication (passwords disabled) and no root login; fail2ban then mostly reduces log noise.

</details>

## Advanced

### Q9. A dependency in your Spring Boot app has a critical vulnerability announced today. What is your process?

**Style:** Production failure

<details>
<summary>Answer</summary>

Check whether the vulnerable code path is used and whether a fixed version exists; upgrade the dependency (or Spring Boot version managing it), run the full CI, build a new image (which also picks up base-image fixes), deploy through the normal pipeline with health checks, and verify the version in production. If no fix exists, apply mitigations (configuration, WAF rule at Nginx, disabling the feature). Afterwards, add automated dependency updates and image scanning so the next one is caught quickly.

</details>

### Q10. How do you administer the database with a GUI tool without exposing port 5432?

**Style:** How

<details>
<summary>Answer</summary>

Publish the database only on the server's loopback (`127.0.0.1:5432:5432`) or not at all and use a jump container, then open an SSH tunnel from your laptop: `ssh -L 15432:127.0.0.1:5432 deploy@server`, and point the GUI at `localhost:15432`. Traffic travels encrypted inside SSH, and the firewall stays closed.

</details>
