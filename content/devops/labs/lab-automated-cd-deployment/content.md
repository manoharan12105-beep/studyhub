# Lab 17 — Automated CD Deployment

**Lab:** 17 · **Module:** CD and Automated Deployment · **Verification:** Partly tested

> [!NOTE]
> Needs your repository, registry and VPS. **Partly tested:** `deploy.sh` was run in Bash with `docker`, `curl` and `sleep` replaced by stubs — the success path, the rollback after 24 failed checks and the missing-argument guard all behaved as described. The workflow was validated against the GitHub Actions schema. The real SSH deployment was not executed.

## Objective

Complete the pipeline: every push to `main` is tested, published and deployed to the VPS automatically, with a health check and automatic rollback.

## Prerequisites

- [Lab 16](../lab-push-image-to-registry/content.md) (images on GHCR, server pulls them); HTTPS from [Lab 14](../lab-enable-https/content.md).
- Lesson: [CD and Automated Deployment](../../ci-cd/cd-automated-deployment/content.md).

## Scenario

Merging a pull request should be the only thing anyone does to release.

## Steps

### Step 1: Install the deploy script on the server

Copy `deploy.sh` from the [CD lesson](../../ci-cd/cd-automated-deployment/content.md) to `deploy/deploy.sh` in the repository (so it is reviewed and versioned), then:

```bash
# On your laptop
scp deploy/deploy.sh deploy@203.0.113.10:/opt/taskapi/deploy.sh
ssh deploy@203.0.113.10 'chmod 755 /opt/taskapi/deploy.sh && grep -E "^(IMAGE_REPO|APP_IMAGE)=" /opt/taskapi/.env'
```

**Expected result:** both `IMAGE_REPO` and `APP_IMAGE` lines exist in `.env` (from Lab 16).

Try it by hand once with the current tag:

```bash
ssh deploy@203.0.113.10 '/opt/taskapi/deploy.sh <current-sha>'
```

**Expected result:** `Deploying … (previous: …)`, the pull, and `Healthy after N check(s): … is live`.

### Step 2: Create a deployment key

```bash
# On your laptop
ssh-keygen -t ed25519 -f taskapi_deploy -N "" -C "github-actions-deploy"
ssh-copy-id -i taskapi_deploy.pub deploy@203.0.113.10
ssh-keyscan 203.0.113.10 > known_hosts_line
```

Compare the host key fingerprint (`ssh-keygen -lf known_hosts_line`) with the one shown in your provider's console or by `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` on the server.

### Step 3: Configure the GitHub environment

Settings → Environments → **New environment** `production`. Add secrets: `DEPLOY_SSH_KEY` (content of `taskapi_deploy`), `DEPLOY_KNOWN_HOSTS` (content of `known_hosts_line`), `DEPLOY_HOST`, `DEPLOY_USER` (`deploy`). Add the repository **variable** `PUBLIC_HOST` = `api.example.com`. Optional: *Required reviewers* (continuous delivery). Then delete the local private key files.

### Step 4: Add the deploy job

Append the `deploy` job from the CD lesson to `pipeline.yml`, commit, push.

**Expected result:** the run shows `test` → `publish` → `deploy`. With reviewers configured, `deploy` waits for approval. Its log ends with `Healthy after N check(s): ghcr.io/…/taskapi:<sha> is live`, and *Check the public endpoint* succeeds.

### Step 5: Ship a visible change

Change a log message or add a field to `/api/info`, merge, and watch the pipeline. Afterwards:

```bash
curl -s https://api.example.com/api/info
```

**Expected result:** `version` shows the new commit SHA.

### Step 6: Prove the rollback

On a branch, break start-up on purpose — for example change `@Table(name = "tasks")` to `@Table(name = "taskz")`; with `ddl-auto: validate`, Hibernate's schema validation then stops the start-up because that table does not exist — merge, and watch.

**Expected result:** the deploy log prints `Not healthy after 2 minutes: rolling back to …` and the job fails (red); `/api/info` still shows the previous SHA. Revert the change.

## Verification Checklist

- ☐ One merge deploys automatically (or after approval).
- ☐ The deploy job verifies readiness and the public HTTPS endpoint.
- ☐ A broken release was rolled back automatically, and the job turned red.
- ☐ No private key or password exists in the repository.

## Common Mistakes

- `StrictHostKeyChecking=no` instead of a verified `known_hosts`.
- Reusing your personal SSH key.
- Forgetting `IMAGE_REPO` in the server's `.env`: the `grep` finds nothing, `set -e` with `pipefail` stops the script with exit code 1 before any `docker` command runs (verified with the stubbed test), and the job fails.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Permission denied (publickey)` | Public key not in `~deploy/.ssh/authorized_keys`, or the secret lost its newline (paste the whole key) |
| `Host key verification failed` | `DEPLOY_KNOWN_HOSTS` missing or the server was rebuilt — rescan and verify |
| `unauthorized` during `docker compose pull` | Server's `docker login ghcr.io` missing or expired token |
| Deploy healthy, public check fails | Nginx/TLS/DNS/firewall problem, not the app |
