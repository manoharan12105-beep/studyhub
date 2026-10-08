# CD and Automated Deployment

**Module:** CI/CD · **Interview priority:** Core

## What Is It?

**Continuous Delivery** extends CI so that every change on `main` produces a release that can go to production at the push of a button. **Continuous Deployment** removes the button: every change that passes the pipeline is deployed automatically. This lesson builds the deploy job of the Task API pipeline: GitHub Actions connects to the VPS over SSH, runs a deploy script that pulls the new image, restarts the app with Docker Compose, checks its health and rolls back if it is unhealthy.

```text
git push main
   │
   ▼  GitHub Actions
 test ──► publish ──► deploy (environment: production)
 build,   image to        │ ssh deploy@VPS "/opt/taskapi/deploy.sh <sha>"
 tests    ghcr.io         ▼
                     VPS: set APP_IMAGE → docker compose pull app → up -d app
                          → poll /actuator/health/readiness
                              ├─ healthy  → LIVE ✓
                              └─ 2 min no → restore previous tag → up -d → job fails ✗
```

## Why It Matters

- Automated deployments are repeatable, fast and logged — no forgotten steps, no "who deployed what?".
- Every deployment includes a health check and an automatic rollback, which a tired human often skips.
- It is the final, most impressive part of a project walkthrough in interviews.

## Continuous Delivery vs Continuous Deployment

| | Continuous Delivery | Continuous Deployment |
|---|---|---|
| After CI passes on `main` | A release is ready | The release goes live |
| Manual step | Approval / button | None |
| In GitHub Actions | `environment: production` with **required reviewers** | `environment: production` without reviewers |

The workflow below is the same for both; only the environment's protection rules differ (Settings → Environments → production).

## Deployment Workflow Design

| Decision | Choice here | Why |
|----------|-------------|-----|
| How the runner reaches the server | SSH with a dedicated key | Simple, no agent on the server |
| What the runner sends | Only the image tag | The server already has `compose.yaml` and `.env` |
| Where the logic lives | `deploy.sh` on the server | Same script for manual and automated deployments |
| Success criterion | Readiness endpoint healthy within 2 minutes | Proves the app started and reached the database |
| Failure handling | Restore the previous tag automatically | Production returns to the last good version |
| Concurrency | One deployment at a time | Two overlapping deploys would race on `.env` |

## The Deploy Script

`/opt/taskapi/deploy.sh` on the server (`chmod 755`). `.env` holds `IMAGE_REPO` (for example `ghcr.io/your-user/taskapi`) and `APP_IMAGE` (the currently deployed reference):

```bash
#!/usr/bin/env bash
# Deploys one image tag of taskapi and rolls back if it does not become healthy.
# Usage: /opt/taskapi/deploy.sh <image-tag>
set -euo pipefail
cd "$(dirname "$0")"

TAG="${1:?usage: deploy.sh <image-tag>}"
REPO=$(grep '^IMAGE_REPO=' .env | cut -d= -f2)
PREVIOUS=$(grep '^APP_IMAGE=' .env | cut -d= -f2)

set_image() {
  sed -i "s|^APP_IMAGE=.*|APP_IMAGE=$1|" .env
}

echo "Deploying $REPO:$TAG (previous: $PREVIOUS)"
set_image "$REPO:$TAG"
docker compose pull app
docker compose up -d app

for attempt in $(seq 1 24); do
  if curl -fsS http://127.0.0.1:8080/actuator/health/readiness > /dev/null; then
    echo "Healthy after $attempt check(s): $REPO:$TAG is live"
    exit 0
  fi
  sleep 5
done

echo "Not healthy after 2 minutes: rolling back to $PREVIOUS" >&2
set_image "$PREVIOUS"
docker compose up -d app
exit 1
```

| Line | Purpose |
|------|---------|
| `set -euo pipefail` | Stop on the first failing command, unset variable or failing pipe stage |
| `${1:?usage…}` | Refuse to run without a tag |
| `PREVIOUS=…` | Remember the running image before changing anything |
| `pull` + `up -d app` | Download the new image, recreate only the app container |
| 24 × 5 s loop | Up to two minutes for JVM start-up, Flyway and readiness |
| `curl -f` | Fails on HTTP errors (a `503 DOWN` readiness counts as not ready) |
| Rollback branch | Restores the previous reference and exits non-zero, so the GitHub job fails visibly |

**What was tested:** this script's control flow was run in Bash on Ubuntu with `docker`, `curl` and `sleep` replaced by stubs. With a healthy stub it set the new `APP_IMAGE`, called `docker compose pull app` and `docker compose up -d app`, printed `Healthy after 1 check(s): ghcr.io/demo/taskapi:bbb222 is live` and exited 0. With an unhealthy stub it checked 24 times, printed `Not healthy after 2 minutes: rolling back to ghcr.io/demo/taskapi:aaa111`, restored that value in `.env`, ran `up -d app` again and exited 1. Without an argument it stopped with the usage message. It has not been run against real Docker on a server as part of writing this lesson.

## Secrets for SSH Deployment

| Secret (environment `production`) | Value |
|-----------------------------------|-------|
| `DEPLOY_SSH_KEY` | Private key of a key pair made **only** for deployments (`ssh-keygen -t ed25519 -f deploy_key -N ""`); its `.pub` goes into `~deploy/.ssh/authorized_keys` on the server |
| `DEPLOY_KNOWN_HOSTS` | The server's host key line, from `ssh-keyscan 203.0.113.10` (verify its fingerprint against the provider console) |
| `DEPLOY_HOST` | The server's IP or name |
| `DEPLOY_USER` | `deploy` |

Plus a repository **variable** `PUBLIC_HOST` = `api.example.com` for the final public check. The server also needs a one-time `docker login ghcr.io` with a read-only token if the image is private.

## The Deploy Job

The `deploy` job of `.github/workflows/pipeline.yml` (validated against the workflow schema together with the `test` and `publish` jobs):

```yaml
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

| Part | Why |
|------|-----|
| `needs: publish` | Deploy only an image that was built and pushed — which only happens after `test` passed |
| `environment: production` | Uses the environment's secrets and protection rules (reviewers = continuous delivery) |
| `concurrency: production` | Queues a second deployment until the first finishes |
| `known_hosts` from a secret | Verifies the server's identity — never disable host key checking |
| `needs.publish.outputs.tag` | The exact commit SHA that was pushed |
| Public check | Proves the full path works: DNS → Nginx → HTTPS → app |

## Health Verification and Rollback

Two layers of verification: the script checks readiness on the server (and rolls back), and the job checks the public HTTPS endpoint. If the public check fails while the server check passed, the problem is between the internet and the app (Nginx, certificate, DNS, firewall).

Manual rollback is the same script with an older tag:

```bash
# Illustrative: on the server, or by re-running the workflow for an older commit
/opt/taskapi/deploy.sh 4f2c1a9d…          # the previous good commit SHA
```

## Production Relevance

- This pipeline is a complete, honest CD setup for a single server: tested images, traceable tags, gated secrets, health-checked deployments and automatic rollback.
- Its limit is the brief downtime while the single app container restarts; removing it needs two instances and a traffic switch (blue/green or rolling) — the job of orchestrators such as Kubernetes or a load balancer in front of several servers.

## Common Mistakes

- Using a personal SSH key (or root) for deployments.
- `StrictHostKeyChecking=no` to "fix" the first connection — it allows man-in-the-middle attacks.
- Deploying `latest` instead of the SHA.
- No health check: the job is green while the app crashes.
- Running database-destructive commands (`down -v`) in the script.
- Copying `.env` from the repository during deployment (it must never be there).

## Interview Angle

- Draw the pipeline: push → test → publish → deploy → health check → live or rollback.
- Explain continuous delivery vs deployment and how environment approvals implement the difference.
- Explain how the runner authenticates to the server and how secrets are kept out of the repository.
- Explain the rollback strategy and its limits (database migrations).

## Key Takeaways

- CD = CI + automatic, repeatable release; continuous deployment removes the manual approval.
- The deploy job SSHes in with a deployment-only key and runs one script: set tag → `pull` → `up -d` → readiness check → rollback on failure.
- GitHub environments hold production secrets and optional reviewers; `concurrency` prevents overlapping deployments.
- Verify twice: readiness on the server, then the public HTTPS endpoint.
