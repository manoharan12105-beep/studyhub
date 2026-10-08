# Capstone Deployment Project — Interview Questions

## Intermediate

### Q1. Draw and explain the architecture of your deployed project.

**Style:** Architecture

<details>
<summary>Answer</summary>

GitHub → GitHub Actions (test with a PostgreSQL service container → publish an image tagged with the commit SHA to GHCR → deploy over SSH) → Ubuntu VPS. On the VPS, Nginx on 80/443 terminates TLS and proxies to Spring Boot on `127.0.0.1:8080`; Spring Boot reaches PostgreSQL at `db:5432` on a private Compose network; PostgreSQL stores data on a named volume. Only 22, 80 and 443 are open.

</details>

### Q2. Why did you choose Docker Compose on a VPS instead of Kubernetes?

**Style:** Trade-off

<details>
<summary>Answer</summary>

One service and one database fit comfortably on one server; Compose gives reproducible configuration, networking, health checks and restart policies with almost no operational overhead and low cost. Kubernetes adds scheduling, self-healing across nodes and rolling updates, but also a lot of complexity — worth it for many services, high availability needs or a team that already runs it. The image and health endpoints would carry over unchanged.

</details>

### Q3. What happens if a deployment introduces a bug that prevents start-up?

**Style:** What happens if

<details>
<summary>Answer</summary>

The new container never becomes ready; the deploy script polls readiness for two minutes, then restores the previous image tag in `.env`, runs `docker compose up -d app` and exits non-zero, so the GitHub job fails and the team is notified while users keep the previous version (apart from a short gap during the attempt).

</details>

### Q4. Where are your secrets and how do they reach the application?

**Style:** How

<details>
<summary>Answer</summary>

The database password is in `/opt/taskapi/.env` on the server (`chmod 600`, never in Git). Compose interpolates it into `SPRING_DATASOURCE_PASSWORD` and `POSTGRES_PASSWORD`; Spring reads it as `spring.datasource.password`. Pipeline secrets (deploy key, known hosts, host, user) are GitHub environment secrets; the registry push uses the automatic `GITHUB_TOKEN`; the server pulls with a read-only token.

</details>

## Advanced

### Q5. What are the single points of failure, and how would you remove them?

**Style:** Architecture

<details>
<summary>Answer</summary>

The VPS itself (hardware, region), the single app instance (deployment gaps), the single PostgreSQL instance and its volume, and Nginx. Steps: off-server backups and tested restores first; then a managed or replicated database; two or more app instances (and servers) behind a load balancer; infrastructure as code for fast rebuilds; health-based failover. Each step costs money and complexity, so it follows real availability requirements.

</details>

### Q6. How do you know the system is healthy without logging in?

**Style:** How

<details>
<summary>Answer</summary>

An external uptime monitor checks `https://api.example.com/actuator/health` every minute and the certificate's expiry; the deploy job checks readiness and the public endpoint after every release. On demand, `/api/info` shows the running version. For deeper insight you would add metrics and centralised logs.

</details>
