# Lab 16 — Push the Docker Image to a Registry

**Lab:** 16 · **Module:** Container Registries and Image Tags · **Verification:** Instruction only

> [!NOTE]
> Needs your GitHub repository and VPS. **Instruction only:** the `publish` job was validated against the GitHub Actions workflow schema but not run; registry pushes and pulls were not executed.

## Objective

Let GitHub Actions build the image after a green test run and push it to GitHub Container Registry with a commit-SHA tag and `latest`; then pull it on the VPS.

## Prerequisites

- [Lab 15](../lab-github-actions-ci/content.md); [Lab 11](../lab-deploy-to-vps/content.md) server.
- Lesson: [Container Registries and Image Tags](../../ci-cd/container-registry/content.md).

## Scenario

The server should run exactly what CI tested — no more `docker save` from a laptop.

## Steps

### Step 1: Add the publish job

Append the `publish` job from the [registry lesson](../../ci-cd/container-registry/content.md) to `.github/workflows/pipeline.yml` (same indentation as `test`), commit and push to `main`.

**Expected result:** the run shows `test`, then `publish` (it `needs: test`). `publish` logs in to `ghcr.io`, builds and pushes two tags. The image appears under your GitHub profile → **Packages** as `taskapi`.

On a pull request, `publish` is shown as skipped — its `if:` allows only pushes to `main`.

### Step 2: Note the tag

Open the package page: you see the tag equal to the full commit SHA and `latest`, both pointing to the same digest.

### Step 3: Let the server pull it

If the package is private, create a personal access token (classic) with only `read:packages`, then on the server:

```bash
echo "PASTE_TOKEN_HERE" | docker login ghcr.io -u your-github-user --password-stdin
```

(Typing it with a leading space or from a file keeps it out of shell history: `docker login ghcr.io -u your-github-user --password-stdin < token.txt`, then delete the file.)

### Step 4: Deploy the registry image

On the server, edit `/opt/taskapi/.env`:

```properties
IMAGE_REPO=ghcr.io/your-github-user/taskapi
APP_IMAGE=ghcr.io/your-github-user/taskapi:<full commit sha>
DB_PASSWORD=…unchanged…
```

```bash
cd /opt/taskapi
docker compose pull app
docker compose up -d app
curl -s http://127.0.0.1:8080/api/info
```

**Expected result:** `pull` downloads the image layers; `/api/info` reports `"version":"ghcr.io/your-github-user/taskapi:<sha>"` — the running build is now traceable to a commit.

## Verification Checklist

- ☐ Pushing to `main` produces a package with a SHA tag and `latest`.
- ☐ Pull requests do not publish.
- ☐ The server pulls with a read-only token and runs the SHA tag.

## Common Mistakes

- Uppercase owner name in the image reference.
- Missing `permissions: packages: write`.
- Deploying `latest` instead of the SHA.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `denied: permission_denied` in `publish` | Add `permissions: packages: write`; check the package's *Manage Actions access* if it already existed |
| `repository name must be lowercase` | Use the lowercase step (`${GITHUB_REPOSITORY_OWNER,,}`) |
| Server: `unauthorized` on pull | `docker login ghcr.io` with a `read:packages` token, or make the package public |
