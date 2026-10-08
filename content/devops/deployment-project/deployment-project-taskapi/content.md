# Capstone: Deploy a Spring Boot + PostgreSQL API End to End

**Module:** Deployment Project · **Interview priority:** Core

## What You Build

The Task API — Spring Boot 4.1 on JDK 21 with PostgreSQL — taken from a GitHub repository to a public HTTPS endpoint, released automatically on every merge:

- a tested, multi-stage Docker image published to GitHub Container Registry,
- Spring Boot and PostgreSQL run by Docker Compose on a Linux VPS, data on a persistent volume,
- Nginx with a Let's Encrypt certificate as the only public entry point,
- a GitHub Actions pipeline: test → publish → deploy with health check and automatic rollback,
- logs, health checks, backups and a security baseline.

The [Practical Labs](../../labs/devops-lab-setup/content.md) build it one step at a time; this page is the complete picture.

## Architecture

```text
                    GitHub (repository: code, Dockerfile, compose.yaml, workflow)
                       │ push / merge to main
                       ▼
                GitHub Actions
                  │          │
             test job     publish job ──────────────► GitHub Container Registry
   (JDK 21, mvnw verify,   (build + push                ghcr.io/you/taskapi:<sha>
    PostgreSQL service)     :<sha>, :latest)                     │
                                  │                              │ docker compose pull
                             deploy job ──ssh──► VPS (Ubuntu) ◄──┘
                                                  │
                         Internet ──443/80──► Nginx (TLS, Let's Encrypt, headers)
                                                  │ proxy_pass 127.0.0.1:8080
                                                  ▼
                                      Spring Boot container (app)
                                                  │ db:5432 — Docker network
                                                  ▼
                                      PostgreSQL container (db)
                                                  │
                                      Persistent volume (pgdata)
```

| Component | Runs where | Public? |
|-----------|-----------|---------|
| Nginx | VPS host (apt package) | 80, 443 |
| Spring Boot | Container, `127.0.0.1:8080` | No |
| PostgreSQL | Container, no published port | No |
| Data | Named volume `pgdata` | — |
| Secrets | `/opt/taskapi/.env` (600), GitHub environment secrets | — |

## Request Flow

```text
browser ─DNS: api.example.com → 203.0.113.10─► :443 Nginx ─TLS terminated─► 127.0.0.1:8080 Spring Boot
        ◄──────────────── JSON over HTTPS ◄──────────────────────────────── │ SQL over db:5432
                                                                             ▼
                                                                         PostgreSQL ⇄ volume
```

## Delivery Flow

```text
git push ─► test (build + tests) ─► publish (image :<sha>) ─► deploy (ssh deploy.sh <sha>)
                                                              │
                                    set APP_IMAGE → pull → up -d → readiness?
                                         ├─ UP within 2 min → public HTTPS check → LIVE
                                         └─ not UP → restore previous APP_IMAGE → up -d → job fails
```

## Project Files

| File | Shown in |
|------|----------|
| Application source, `pom.xml`, `application*.yml`, migration, tests, `.gitignore`, `.env.example` | [Lab Setup](../../labs/devops-lab-setup/content.md) |
| `Dockerfile`, `.dockerignore` | below |
| `compose.yaml` | below |
| `deploy/taskapi.conf` (Nginx) | [Domain, DNS and HTTPS](../../server-deployment/domain-dns-and-https/content.md) |
| `deploy/deploy.sh` | [CD and Automated Deployment](../../ci-cd/cd-automated-deployment/content.md) |
| `.github/workflows/pipeline.yml` | below |

### Dockerfile

```dockerfile
# ---- Stage 1: build the JAR with Maven and a full JDK ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace

# Dependencies first: this layer is reused until pom.xml changes.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

COPY src ./src
# Tests run in CI against a real PostgreSQL, before the image is built.
RUN mvn -B -q package -DskipTests

# ---- Stage 2: run it on a JRE only ----
FROM eclipse-temurin:21-jre
RUN useradd --system --uid 10001 spring
WORKDIR /app
COPY --from=build /workspace/target/*.jar app.jar
USER spring
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
```

`.dockerignore`:

```text
target/
.git/
.github/
.idea/
.vscode/
*.iml
.env
*.log
```

### compose.yaml

```yaml
services:
  db:
    image: postgres:18
    restart: unless-stopped
    environment:
      POSTGRES_DB: taskdb
      POSTGRES_USER: taskapp
      POSTGRES_PASSWORD: ${DB_PASSWORD:?Set DB_PASSWORD in .env}
    volumes:
      - pgdata:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taskapp -d taskdb"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    image: ${APP_IMAGE:-taskapi:local}
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      SPRING_PROFILES_ACTIVE: prod
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/taskdb
      SPRING_DATASOURCE_USERNAME: taskapp
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD:?Set DB_PASSWORD in .env}
      APP_VERSION: ${APP_IMAGE:-taskapi:local}
    ports:
      - "127.0.0.1:8080:8080"
    healthcheck:
      test: ["CMD", "curl", "-fsS", "http://localhost:8080/actuator/health/readiness"]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 60s

volumes:
  pgdata:
```

On the server, add the log rotation block from [Logging, Monitoring and Health](../../operations/logging-monitoring-and-health/content.md) to both services. The server's `/opt/taskapi/.env`:

```properties
IMAGE_REPO=ghcr.io/your-github-user/taskapi
APP_IMAGE=ghcr.io/your-github-user/taskapi:<commit sha>
DB_PASSWORD=<openssl rand -base64 24>
```

### .github/workflows/pipeline.yml

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:18
        env:
          POSTGRES_DB: taskdb
          POSTGRES_USER: taskapp
          # Not a secret: a throwaway database that exists only during this job.
          POSTGRES_PASSWORD: ci-only-password
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U taskapp -d taskdb"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/taskdb
      SPRING_DATASOURCE_USERNAME: taskapp
      SPRING_DATASOURCE_PASSWORD: ci-only-password

    steps:
      - name: Check out the code
        uses: actions/checkout@v7

      - name: Set up JDK 21
        uses: actions/setup-java@v6
        with:
          distribution: temurin
          java-version: '21'
          cache: maven

      - name: Build and run tests
        run: ./mvnw -B verify

      - name: Keep test reports when tests fail
        if: failure()
        uses: actions/upload-artifact@v7
        with:
          name: test-reports
          path: target/surefire-reports

      - name: Check that the Docker image builds
        run: docker build -t taskapi:${{ github.sha }} .

  publish:
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    outputs:
      tag: ${{ github.sha }}

    steps:
      - uses: actions/checkout@v7

      - name: Image name in lowercase
        run: echo "IMAGE=ghcr.io/${GITHUB_REPOSITORY_OWNER,,}/taskapi" >> "$GITHUB_ENV"

      - uses: docker/setup-buildx-action@v4

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v4
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v7
        with:
          context: .
          push: true
          tags: |
            ${{ env.IMAGE }}:${{ github.sha }}
            ${{ env.IMAGE }}:latest

  deploy:
    needs: publish
    runs-on: ubuntu-latest
    environment: production
    concurrency: production

    steps:
      - name: Deploy over SSH
        env:
          SSH_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
          KNOWN_HOSTS: ${{ secrets.DEPLOY_KNOWN_HOSTS }}
          DEPLOY_HOST: ${{ secrets.DEPLOY_HOST }}
          DEPLOY_USER: ${{ secrets.DEPLOY_USER }}
          TAG: ${{ needs.publish.outputs.tag }}
        run: |
          mkdir -p ~/.ssh
          printf '%s\n' "$SSH_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          printf '%s\n' "$KNOWN_HOSTS" > ~/.ssh/known_hosts
          ssh -i ~/.ssh/deploy_key "$DEPLOY_USER@$DEPLOY_HOST" "/opt/taskapi/deploy.sh $TAG"

      - name: Check the public endpoint
        run: curl -fsS --retry 5 --retry-delay 5 --retry-all-errors https://${{ vars.PUBLIC_HOST }}/actuator/health
```

## Build Order

| Phase | Goal | Labs |
|-------|------|------|
| 1. Containerise | The app runs from an image | 01–04 |
| 2. Add the database | App + PostgreSQL with persistent data | 05–08 |
| 3. Compose and configuration | One command; production-safe configuration | 09–10 |
| 4. Server | Live on a VPS | 11 |
| 5. Edge | Nginx, domain, HTTPS | 12–14 |
| 6. Automation | CI, registry, CD | 15–17 |
| 7. Operations | Troubleshooting, monitoring, backups, security | 18 + [checklist](../deployment-checklist/content.md) |

## Final Verification

```bash
# Illustrative: from your laptop
curl -sI http://api.example.com/api/info | head -n 1                 # 301 to HTTPS
curl -s https://api.example.com/api/info                             # version = latest commit SHA, profile prod
curl -s -X POST https://api.example.com/api/tasks -H 'Content-Type: application/json' -d '{"title":"Shipped"}'
curl -s --max-time 5 http://203.0.113.10:8080 || echo "app port closed"
```

```bash
# Illustrative: on the server
docker compose -f /opt/taskapi/compose.yaml ps        # both Up (healthy)
sudo ss -ltnp | grep -v 127.0.0.1                     # only sshd and nginx
```

## What Was Verified

| Part | Status |
|------|--------|
| Application source, Maven build, 3 tests | **Tested** (`./mvnw -B verify` against PostgreSQL 18) |
| `prod` profile, environment configuration, fail-fast, CORS, health and readiness behaviour | **Tested** (JAR run with environment variables) |
| `compose.yaml` | Schema-validated against the Compose Specification; **not run** |
| `pipeline.yml` | Schema-validated against the GitHub Actions workflow schema; **not run on GitHub** |
| Nginx site (HTTP→HTTPS, proxy, headers, 502) | **Tested** with Nginx 1.30.5 and a self-signed certificate on a development machine (high ports) |
| `deploy.sh` | Control flow **tested** with stubbed `docker`/`curl`; not run against real Docker |
| Docker image build, Compose run, VPS, DNS, Let's Encrypt, GHCR, SSH deployment | **Instruction only** — no Docker, server, domain or GitHub repository was available while writing |

## Extending the Project

Natural next steps, outside this subject's core scope: a staging environment and promotion of the same image; two app instances with an Nginx upstream for zero-downtime deployments; metrics with Micrometer + Prometheus + Grafana; managed PostgreSQL; infrastructure as code (Terraform, Ansible); and, for many services, Kubernetes.

## Interview Walkthrough

A two-minute answer to "How did you deploy your project?":

1. "The Spring Boot API is packaged with a multi-stage Dockerfile — Maven build stage, JRE runtime stage, non-root user."
2. "On every push, GitHub Actions runs the tests against a PostgreSQL service container; on `main` it pushes an image tagged with the commit SHA to GHCR."
3. "A deploy job SSHes to an Ubuntu VPS with a deployment-only key and runs a script: set the new tag, `docker compose pull`, `up -d`, poll the readiness endpoint — which includes the database — and roll back to the previous tag if it is not ready in two minutes."
4. "Compose runs the app and PostgreSQL on a private network; the database has no published port and keeps its data on a named volume, backed up daily off-server."
5. "Nginx terminates HTTPS with Let's Encrypt certificates that renew automatically and proxies to the app on localhost; the firewall exposes only 22, 80 and 443."
6. "Secrets live in a protected `.env` on the server and in GitHub environment secrets — never in Git or the image."

## Key Takeaways

- Every arrow in the architecture is something you configured and can explain.
- The pipeline only ever deploys tested images, by SHA, with a health-checked rollback.
- Only Nginx is public; the app is on loopback, the database on a private network.
- State what you verified and how — honesty about testing is part of professional delivery.
