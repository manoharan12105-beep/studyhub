# Container Registries and Image Tags — Interview Questions

## Beginner

### Q1. What is a container registry and where does it fit in CI/CD?

**Style:** What

<details>
<summary>Answer</summary>

A service that stores and distributes images (Docker Hub, GHCR, ECR). In CI/CD it is the hand-over point: the pipeline builds and tests an image and pushes it; servers pull exactly that image to deploy it.

</details>

### Q2. What is an image tag?

**Style:** What

<details>
<summary>Answer</summary>

A human-readable, movable label in a repository (`taskapi:1.4.0`, `taskapi:4f2c1a9`) that points to an image digest. Several tags can point to one image, and a tag can be moved to a different image by pushing again.

</details>

### Q3. Why shouldn't you deploy the `latest` tag?

**Style:** Why

<details>
<summary>Answer</summary>

It changes whenever someone pushes it, so two servers pulling at different times may run different code, you cannot tell which version runs, and "roll back to the previous latest" is impossible. Deploy immutable, traceable tags such as the commit SHA or a version number.

</details>

### Q4. What is the difference between public and private images?

**Style:** Comparison

<details>
<summary>Answer</summary>

Anyone can pull a public image; a private image requires authentication with access rights. Private images need credentials on every server that pulls them; public images expose the compiled application and its dependencies. Neither may contain secrets.

</details>

## Intermediate

### Q5. How does GitHub Actions authenticate to GitHub Container Registry?

**Style:** How

<details>
<summary>Answer</summary>

With the automatic `GITHUB_TOKEN`: the job declares `permissions: packages: write`, and `docker/login-action` logs in to `ghcr.io` with `username: ${{ github.actor }}` and `password: ${{ secrets.GITHUB_TOKEN }}`. No personal token is stored.

</details>

### Q6. What is the difference between a tag and a digest?

**Style:** Comparison

<details>
<summary>Answer</summary>

A digest (`sha256:…`) identifies image content and can never point to anything else; a tag is a mutable pointer to a digest. Pulling by digest (`image@sha256:…`) guarantees the exact bits; tags are friendlier and, when used per commit, effectively unique.

</details>

### Q7. The push fails with "repository name must be lowercase". Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

Docker image references must be lowercase, but the GitHub owner name (used in `ghcr.io/<owner>/…`) may contain capitals. Lowercase it, for example `${GITHUB_REPOSITORY_OWNER,,}` in Bash.

</details>

### Q8. How should the production server authenticate to pull private images?

**Style:** How

<details>
<summary>Answer</summary>

With a dedicated token that can only read packages (for GHCR, a token with `read:packages`), via `echo "$TOKEN" | docker login ghcr.io -u user --password-stdin`. Never use a token with write or delete rights, and rotate it periodically.

</details>

## Advanced

### Q9. Why do pulls of a new version usually take only seconds?

**Style:** How

<details>
<summary>Answer</summary>

Images are stacks of content-addressed layers. The server already has the base OS, JRE and (with a layered Dockerfile) dependency layers from the previous version; only changed layers — typically the application layer — are downloaded.

</details>

### Q10. Docker Hub rate limits are breaking your CI builds. What can you do?

**Style:** Production failure

<details>
<summary>Answer</summary>

Authenticate pulls (logged-in accounts get higher limits), cache base images (registry mirror or pull-through cache), use base images from registries with better limits for your environment, and reduce unnecessary pulls (Buildx layer cache). Avoid unauthenticated pulls in CI.

</details>
