# Block 6: CI/CD and Registry

## CI (GitHub Actions)

- Workflow (`.github/workflows/`) → jobs on fresh runners → steps (`uses` / `run`).
- `services: postgres` with health options; job `env` sets `SPRING_DATASOURCE_*`.
- `actions/checkout@v7` → `actions/setup-java@v6` (`cache: maven`) → `./mvnw -B verify` → `docker build`.
- `if: failure()` + `upload-artifact` for test reports. Branch protection requires the check.

## Registry

- GHCR: `ghcr.io/<owner-lowercase>/taskapi:<sha>`; login with `GITHUB_TOKEN`, `permissions: packages: write`.
- Deploy SHA tags; `latest` is only a convenience label.
- Server pulls with a `read:packages` token: `docker login ghcr.io --password-stdin`.

## CD

```text
deploy job (environment: production, concurrency: production)
  ssh -i deploy_key deploy@VPS "/opt/taskapi/deploy.sh <sha>"
    set APP_IMAGE → pull → up -d → readiness 24×5 s → OK | rollback + exit 1
  public check: curl -fsS https://api.example.com/actuator/health
```

- Secrets: `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, `DEPLOY_HOST`, `DEPLOY_USER` (environment); verify host keys — never disable checking.
- Delivery = environment reviewers; deployment = no reviewers.

## Self-Check

- Which jobs run for a pull request?
- Why tag by SHA, and how does that make rollback trivial?
- The deploy job is green but users see errors — what was not verified?
