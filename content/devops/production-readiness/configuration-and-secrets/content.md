# Configuration and Secrets

**Module:** Configuration and Production Readiness · **Interview priority:** Core

## What Is It?

**Configuration** is everything that differs between environments: database URLs, ports, log levels, feature switches. **Secrets** are the configuration values that grant access: database passwords, JWT signing keys, API keys, SSH keys, registry tokens.

The rule of this lesson: **code and images contain no environment-specific values and no secrets.** They are supplied at run time — by environment variables, a protected `.env` file on the server, and GitHub Secrets in the pipeline.

```text
                  same image everywhere
                          │
   development           CI                    production
   application.yml       GitHub Secrets +      /opt/taskapi/.env (chmod 600)
   defaults              job env variables     → compose.yaml → container env
```

## Why It Matters

- Secrets committed to GitHub are found by automated scanners within minutes; a leaked cloud key can be abused before you notice.
- Git never forgets: deleting the file in a later commit leaves the secret in the history and in every clone and fork.
- Separating configuration from code is what lets one image run in every environment.

## BAD vs GOOD

```properties
# BAD: src/main/resources/application-prod.properties, committed to GitHub
spring.datasource.password=123456
app.jwt.secret=mysecretkey
```

```yaml
# GOOD: src/main/resources/application-prod.yml — names only, values from the environment
spring:
  datasource:
    password: ${SPRING_DATASOURCE_PASSWORD}
app:
  jwt:
    secret: ${JWT_SECRET}
```

The GOOD version can be public. The values live only where they are needed: the server's `.env`, GitHub Secrets, a password manager.

## Environment Variables

Every process inherits a set of `KEY=value` pairs. Spring Boot reads them through relaxed binding (`SPRING_DATASOURCE_PASSWORD` → `spring.datasource.password`) and through `${…}` placeholders in YAML.

Spring Boot's precedence, highest first (abridged):

| Source | Example |
|--------|---------|
| Command-line arguments | `java -jar app.jar --server.port=9090` |
| OS environment variables | `SERVER_PORT=9090` |
| Profile-specific files (`application-prod.yml`) | `server.port: 9090` |
| `application.yml` | `server.port: 8080` |

So an environment variable overrides both YAML files — which is why containers are configured with environment variables. Details: [Externalized Configuration](../../../spring-boot/spring-boot-core/externalized-configuration/content.md) and [Profiles](../../../spring-boot/spring-boot-core/spring-profiles/content.md).

## The .env File

Docker Compose reads a file named `.env` in the project folder and uses it to fill `${…}` placeholders in `compose.yaml`:

```properties
# /opt/taskapi/.env — on the server only, never in Git
IMAGE_REPO=ghcr.io/your-user/taskapi
APP_IMAGE=ghcr.io/your-user/taskapi:4f2c1a9
DB_PASSWORD=Xq3v9LkP2mZt7Rw1Yb6Nc8Hd
```

| Mechanism | What it does |
|-----------|--------------|
| `.env` next to `compose.yaml` | Values for `${VAR}` **inside the Compose file** (interpolation) |
| `env_file: app.env` in a service | Every line becomes an environment variable **of that container** |
| `environment:` in a service | Explicit variables of that container, may use `${VAR}` |

Spring Boot itself does not read `.env` files; Compose turns the values into container environment variables, and Spring reads those.

Protect it and keep it out of Git:

```bash
# Illustrative: on the server
chmod 600 /opt/taskapi/.env
```

```text
# .gitignore (in the repository)
.env
*.env
!.env.example
```

Commit a **`.env.example`** with the same keys and placeholder values, so others know what to set:

```properties
# .env.example — copy to .env and fill in real values. Never commit .env.
IMAGE_REPO=ghcr.io/your-user/taskapi
APP_IMAGE=taskapi:local
DB_PASSWORD=change-me
```

## Production Profile

`SPRING_PROFILES_ACTIVE=prod` activates `application-prod.yml` on top of `application.yml`. Keep the split clear:

| `application.yml` | `application-prod.yml` |
|-------------------|------------------------|
| Safe local defaults (local database, dev-only password) | No credentials; `${…}` placeholders without defaults so a missing variable fails start-up |
| Developer conveniences | Production behaviour: hidden health details, forwarded headers, log levels |

The Task API's production profile fails fast — its real start-up error without the variables is `'url' must start with "jdbc"` ([Spring Boot in Docker](../../docker/spring-boot-in-docker/content.md)).

## Database Credentials

- Use a dedicated application role (`taskapp`), not the `postgres` superuser.
- A long random password, generated rather than invented: `openssl rand -base64 24`.
- Different credentials per environment, so a leaked development password opens nothing in production.
- Changing it means: change the role's password in PostgreSQL **and** the `.env` value, then recreate the app container.

## JWT Secrets and API Keys

- An HMAC JWT signing key must be long and random (at least 256 bits for HS256: `openssl rand -base64 32`). Anyone with the key can forge tokens for any user.
- Third-party API keys (payment, email, maps) are secrets too; give each environment its own key with the smallest permissions.
- Never log secrets; never return them from endpoints such as `/actuator/env` (do not expose it).

## GitHub Secrets

GitHub stores encrypted secrets per repository, per **environment** (for example `production`) or per organisation. Workflows read them as `${{ secrets.NAME }}`:

```yaml
- name: Deploy over SSH
  env:
    SSH_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
  run: …
```

| Property | Consequence |
|----------|-------------|
| Values are masked in logs (`***`) | Still avoid printing them — transformed values (base64) are not masked |
| Not passed to workflows triggered by pull requests from forks | Strangers cannot steal them with a malicious PR |
| Environment secrets can require approval | The `production` environment can wait for a reviewer before the job sees its secrets |
| `GITHUB_TOKEN` is created automatically per run | Use it (with `permissions:`) instead of a personal token where possible |

Create them under **Settings → Secrets and variables → Actions**. Non-secret settings (a public host name) can be **variables** (`${{ vars.NAME }}`).

## Why Secrets Must Never Be Committed

```text
commit A: add password   ──►  commit B: remove password
                                   │
   the password is still in commit A, in every clone, every fork,
   every CI cache, and in scanners' databases
```

If a secret was pushed: **rotate it first** (change the password, revoke the key) — that is the only real fix. Then clean the history if you want to (`git filter-repo`), knowing copies may already exist. GitHub's secret scanning and push protection can block some secrets before they land.

## Example: Checking What a Container Really Gets

```bash
# Illustrative: on the server
docker compose config | grep -A6 "environment:"     # interpolated values Compose will use
docker compose exec app env | grep SPRING_            # what the running container received
```

**Expected result:** the variables with their real values. These commands print secrets — run them only in your own terminal, never in a shared log or screenshot.

## Production Relevance

- A protected `.env` plus `${…}` in Compose is a simple, sound secret setup for one server. Larger systems use a secret manager (Vault, a cloud secrets service) — the same idea with auditing and rotation.
- Most real-world breaches of small projects start with a committed `.env`, key file or `application.properties`.

## Common Mistakes

- Passwords in `application.yml`, `compose.yaml`, `Dockerfile` `ENV`, or workflow files.
- Committing `.env` "just once" and deleting it in the next commit.
- Sharing one secret across development, staging and production.
- Printing secrets in CI logs or exposing `/actuator/env`.
- `.env` readable by every user on the server (`644`).

## Interview Angle

- Explain where each secret of your project lives (server `.env`, GitHub Secrets) and how it reaches the app (Compose → environment variable → Spring property).
- Explain what you do if a secret is committed (rotate first).
- Explain Spring Boot precedence: environment variables override YAML.

## Key Takeaways

- Same image everywhere; configuration and secrets come from the environment.
- `.env` (chmod 600, git-ignored) feeds `${…}` in `compose.yaml`; commit only `.env.example`.
- GitHub Secrets for the pipeline: masked, unavailable to fork PRs, scoped by environment.
- A leaked secret must be rotated; deleting the commit is not enough.
