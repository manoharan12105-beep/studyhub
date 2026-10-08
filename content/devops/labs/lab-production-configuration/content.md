# Lab 10 — Environment Variables and Production Configuration

**Lab:** 10 · **Module:** Configuration and Secrets · **Verification:** Partly tested

> [!NOTE]
> Run on your own machine. **Partly tested:** the Task API's `prod` profile, its fail-fast behaviour without variables, the CORS configuration and the error responses were tested by running the JAR with environment variables; the Compose steps were not executed.

## Objective

Configure the stack for production entirely through environment variables: a secrets file outside Git, the `prod` profile, fail-fast behaviour, restricted CORS and minimal Actuator exposure.

## Prerequisites

- [Lab 09](../lab-docker-compose-application/content.md).
- Lessons: [Configuration and Secrets](../../production-readiness/configuration-and-secrets/content.md), [Production Preparation](../../production-readiness/production-preparation/content.md).

## Scenario

Before the first deployment, a reviewer asks you to prove three things: no secret is in Git, production cannot accidentally start with development settings, and the API is not over-exposed.

## Steps

### Step 1: Keep secrets out of Git

```bash
cat .gitignore            # must contain .env
git status --short        # .env must NOT appear
git check-ignore -v .env  # prints the .gitignore rule that ignores it
```

Generate a real password for `.env`:

```bash
openssl rand -base64 24
```

### Step 2: Prove the fail-fast behaviour

Run the image with the `prod` profile and **no** datasource variables:

```bash
docker run --rm -e SPRING_PROFILES_ACTIVE=prod taskapi:local 2>&1 | grep "Caused by" | head -n 3
```

**Output:** (the cause line captured when the JAR ran with `prod` and no variables)

```text
Caused by: java.lang.IllegalArgumentException: 'url' must start with "jdbc"
```

**Explanation:** `application-prod.yml` refers to `${SPRING_DATASOURCE_URL}` with no default; the unresolved placeholder is not a JDBC URL, so start-up stops instead of using the development database.

### Step 3: Restrict CORS through the environment

Add to `app.environment` in `compose.yaml`:

```yaml
      APP_CORS_ALLOWED_ORIGINS: https://app.example.com
```

```bash
docker compose up -d
curl -s -i -X OPTIONS localhost:8080/api/tasks -H "Origin: https://app.example.com" -H "Access-Control-Request-Method: POST" | grep -i "^access-control-allow-origin"
curl -s -o /dev/null -w "%{http_code}\n" -X OPTIONS localhost:8080/api/tasks -H "Origin: https://evil.example" -H "Access-Control-Request-Method: POST"
```

**Output:** (captured from the JAR configured the same way)

```text
Access-Control-Allow-Origin: https://app.example.com
403
```

### Step 4: Check Actuator exposure and error responses

```bash
curl -s -o /dev/null -w "%{http_code}\n" localhost:8080/actuator/env
curl -s localhost:8080/actuator/health
curl -s -X POST localhost:8080/api/tasks -H 'Content-Type: application/json' -d '{"title":""}'
```

**Expected result:** `404` for `/actuator/env` (not exposed); health without component details; a `400` JSON with `timestamp`, `status`, `error` and `path` — no stack trace.

### Step 5: Inspect what the container receives

```bash
docker compose exec app env | grep -E "SPRING_PROFILES_ACTIVE|APP_CORS"
```

Never paste the full `env` output anywhere — it contains the database password.

## Verification Checklist

- ☐ `.env` is ignored by Git; `.env.example` is committed.
- ☐ Production start-up fails without the datasource variables.
- ☐ Only the configured origin passes CORS.
- ☐ `/actuator/env` returns 404; errors contain no stack traces.

## Common Mistakes

- A default value for a secret in YAML (`${DB_PASSWORD:admin}`) — it commits the secret.
- Testing CORS with `curl` alone and concluding it "protects the API" — only browsers enforce it.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `.env` appears in `git status` | Add it to `.gitignore`; if already committed: `git rm --cached .env`, commit, and **rotate** the secrets |
| CORS still allows everything | The variable name: `APP_CORS_ALLOWED_ORIGINS` maps to `app.cors.allowed-origins`; recreate the container |
