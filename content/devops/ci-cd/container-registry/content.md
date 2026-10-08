# Container Registries and Image Tags

**Module:** CI/CD · **Interview priority:** Core

## What Is It?

A **container registry** stores Docker images and serves them to anyone allowed to pull them. In the delivery pipeline it is the hand-over point: **CI pushes** a tested image, **servers pull** it.

```text
GitHub Actions ──docker push──► ghcr.io/your-user/taskapi:4f2c1a9 ──docker pull──► VPS
                                ghcr.io/your-user/taskapi:latest
```

## Why It Matters

- Servers should never build images; they should run exactly the image CI tested.
- Tags make every version addressable, which is what makes deployments and rollbacks a one-line change.
- Private images keep your code's compiled form away from the public.

## Docker Hub and GitHub Container Registry

| | Docker Hub | GitHub Container Registry (GHCR) |
|---|---|---|
| Address | `docker.io` (default) | `ghcr.io` |
| Image name | `your-dockerhub-user/taskapi` | `ghcr.io/your-github-user/taskapi` |
| Login from CI | Username + access token stored in GitHub Secrets | The automatic `GITHUB_TOKEN` with `packages: write` |
| Good for | Public images, official base images | Images built from a GitHub repository |
| Pull limits | Anonymous and free accounts are rate-limited | Generous for public images |

This subject uses **GHCR**, because GitHub Actions can push to it without creating any extra credentials.

## Image Names and Tags

```text
ghcr.io / your-user / taskapi : 4f2c1a9
registry   namespace   repository  tag
```

A tag is a **movable label** pointing to an image digest (`sha256:…`, the immutable content ID). Several tags can point to the same image.

| Tag style | Example | Use |
|-----------|---------|-----|
| Commit SHA | `taskapi:4f2c1a9…` | **Deploy this.** Unique and traceable to the exact commit |
| Semantic version | `taskapi:1.4.0` | Releases people refer to |
| `latest` | `taskapi:latest` | Convenience for "newest build" — never for deployments |
| Digest | `taskapi@sha256:…` | Immutable pinning |

> [!WARNING]
> **Common trap:** `latest` is just a tag name; it does not mean "newest" unless someone pushes it every time, and it changes under you. With `latest`, you cannot tell what is running or roll back to "the previous latest". Deploy SHA or version tags.

## Versioning

- **Every build:** tag with the full commit SHA (`${{ github.sha }}`).
- **Releases:** additionally tag `1.4.0` when you create a Git tag `v1.4.0` (the `docker/metadata-action` can generate tags from Git refs).
- Keep old tags for rollback; delete very old ones with a retention policy.

## Authentication

```bash
# Illustrative: log in to GHCR from your laptop or the server with a personal access token
echo "$GHCR_TOKEN" | docker login ghcr.io -u your-github-user --password-stdin
```

| Who | Credential | Permission |
|-----|-----------|------------|
| GitHub Actions (push) | `GITHUB_TOKEN` (automatic) | `permissions: packages: write` in the job |
| The VPS (pull, private image) | A personal access token (classic) with only `read:packages` | Stored by `docker login` in `~/.docker/config.json` |
| Docker Hub from Actions | An access token, saved as a repository secret | Read & write |

`--password-stdin` keeps the token out of the shell history and process list.

## Push

The `publish` job of `.github/workflows/pipeline.yml` (part of the file validated against the workflow schema):

```yaml
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
```

| Part | Why |
|------|-----|
| `needs: test` | Only images whose code passed CI are pushed |
| `if: … push … main` | Pull requests are tested but never published |
| `permissions: packages: write` | Lets `GITHUB_TOKEN` push to GHCR |
| `${GITHUB_REPOSITORY_OWNER,,}` | Bash lowercase: image names must be lowercase, GitHub user names may not be |
| `>> "$GITHUB_ENV"` | Makes `IMAGE` available to later steps as `env.IMAGE` |
| `setup-buildx-action` + `build-push-action` | Build with BuildKit and push both tags in one step |
| `outputs: tag` | The deploy job reads which tag to deploy |

Manually, the same push is:

```bash
# Illustrative
docker build -t ghcr.io/your-user/taskapi:1.0.0 .
docker push ghcr.io/your-user/taskapi:1.0.0
```

## Pull

```bash
# Illustrative: on the VPS
docker pull ghcr.io/your-user/taskapi:4f2c1a9
# or, with APP_IMAGE in .env:
docker compose pull app
```

`pull` downloads only layers the server does not have yet — after the first deployment usually just the application layer.

## Public vs Private Images

| | Public | Private |
|---|---|---|
| Who can pull | Anyone | Only authenticated users with access |
| Server setup | Nothing | `docker login ghcr.io` with a read-only token |
| Risk | Your compiled code and its dependencies are visible | Token must be protected and rotated |

New GHCR packages are private by default; change visibility in the package settings. Never put secrets in an image — even private images get shared, cached and copied.

## Production Relevance

- The registry is the single source of deployable versions; the server's `.env` only names a tag.
- Rollback = deploy the previous SHA tag, which is still in the registry.
- A read-only token on the server limits damage if the server is compromised.

## Common Mistakes

- Uppercase letters in the image name (`invalid reference format: repository name must be lowercase`).
- Missing `permissions: packages: write` (push denied).
- Deploying `latest`.
- Logging in on the server with a token that can also push or delete.
- Forgetting that the server needs `docker login` for private images (`denied` / `unauthorized` on pull).

## Interview Angle

- Explain tags vs digests and why you deploy commit-SHA tags.
- Describe how CI authenticates to the registry and how the server does.
- Explain public vs private images and what never belongs in an image.

## Key Takeaways

- CI pushes, servers pull; the registry holds every deployable version.
- Tag every build with the commit SHA; `latest` is a convenience, not a deployment target.
- GHCR + `GITHUB_TOKEN` (`packages: write`) needs no extra credentials in CI; the server uses a read-only token.
- Image names are lowercase; secrets never go into images.
