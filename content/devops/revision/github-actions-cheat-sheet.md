# GitHub Actions

## Structure

```yaml
name: CI/CD
on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:18
        env: { POSTGRES_DB: taskdb, POSTGRES_USER: taskapp, POSTGRES_PASSWORD: ci-only-password }
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U taskapp -d taskdb"
          --health-interval 10s --health-timeout 5s --health-retries 5
    env:
      SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/taskdb
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-java@v6
        with: { distribution: temurin, java-version: '21', cache: maven }
      - run: ./mvnw -B verify
```

## Vocabulary

| Term | Meaning |
|------|---------|
| Workflow | `.github/workflows/*.yml` |
| `on` | Triggers: `push`, `pull_request`, `workflow_dispatch`, `schedule` |
| Job | Runs on a fresh runner; parallel unless `needs:` |
| Step | `uses:` an action or `run:` commands |
| Service container | e.g. PostgreSQL beside the job |
| Artifact | `actions/upload-artifact@v7` — files kept after the run |
| Output | `outputs:` of a job, read with `needs.<job>.outputs.<name>` |
| Environment | `environment: production` — secrets + reviewers |
| Concurrency | `concurrency: production` — one run at a time |

## Expressions and Context

| Expression | Value |
|------------|-------|
| `${{ github.sha }}` | Commit SHA |
| `${{ github.ref }}` | `refs/heads/main` |
| `${{ github.event_name }}` | `push`, `pull_request`, … |
| `${{ github.actor }}` | User who triggered |
| `${{ secrets.NAME }}` / `${{ vars.NAME }}` | Secret / non-secret variable |
| `if: failure()` / `if: github.ref == 'refs/heads/main'` | Conditions |
| `echo "K=V" >> "$GITHUB_ENV"` | Variable for later steps |

## Actions Used in This Subject

| Action | Purpose |
|--------|---------|
| `actions/checkout@v7` | Clone the repository |
| `actions/setup-java@v6` | JDK + Maven cache |
| `actions/upload-artifact@v7` | Keep files |
| `docker/setup-buildx-action@v4` | BuildKit builder |
| `docker/login-action@v4` | Registry login |
| `docker/build-push-action@v7` | Build and push images |

## Permissions

```yaml
permissions:
  contents: read
  packages: write     # only in the job that pushes to GHCR
```

## Fixes

| Problem | Fix |
|---------|-----|
| `./mvnw: Permission denied` | `git update-index --chmod=+x mvnw` |
| Push to GHCR denied | `permissions: packages: write` |
| Image name must be lowercase | `${GITHUB_REPOSITORY_OWNER,,}` |
| Secrets empty in fork PRs | By design — forks get no secrets |
