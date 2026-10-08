# CI/CD Pipeline

## The Pipeline

```text
git push
  └─► test     checkout → JDK 21 → ./mvnw -B verify (PostgreSQL service) → docker build
        └─► publish  (main only) login ghcr.io → build + push :<sha>, :latest
              └─► deploy (environment production, concurrency)
                    ssh deploy@VPS "/opt/taskapi/deploy.sh <sha>"
                      set APP_IMAGE → compose pull app → up -d app → poll readiness (2 min)
                        ├─ UP   → public HTTPS check → LIVE
                        └─ DOWN → restore previous APP_IMAGE → up -d → exit 1 (job red)
```

## Stage Contracts

| Stage | Input | Output | Fails when |
|-------|-------|--------|-----------|
| test | Commit | Green/red status | Compile error, test failure, Dockerfile broken |
| publish | Green commit on `main` | Image `:<sha>` in GHCR | Auth / permissions |
| deploy | Tag from publish | New version live, or rollback | SSH, pull, readiness, public check |

## Delivery vs Deployment

| | Continuous delivery | Continuous deployment |
|---|---|---|
| Last gate | Human approval (environment reviewers) | None |
| Same pipeline? | Yes | Yes |

## Secrets Map

| Where | What |
|-------|------|
| GitHub environment `production` | `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, `DEPLOY_HOST`, `DEPLOY_USER` |
| Repository variable | `PUBLIC_HOST` |
| Automatic | `GITHUB_TOKEN` (push to GHCR) |
| Server `/opt/taskapi/.env` (600) | `IMAGE_REPO`, `APP_IMAGE`, `DB_PASSWORD` |
| Server `~/.docker/config.json` | Read-only GHCR token |

## Rollback

- Automatic: `deploy.sh` restores the previous `APP_IMAGE`.
- Manual: `/opt/taskapi/deploy.sh <previous-sha>`.
- Limit: schema changes — use expand/contract migrations.

## Quality Gates Checklist

- Branch protection requires `test`.
- Images tagged by SHA, never deployed as `latest`.
- Deploy verifies readiness **and** the public HTTPS endpoint.
- One deployment at a time (`concurrency`).
- Host key verified (`known_hosts`), never `StrictHostKeyChecking=no`.
