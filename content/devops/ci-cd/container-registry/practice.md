# Container Registries and Image Tags — Practice

### P1. Read the reference

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** image references

In `ghcr.io/alice/taskapi:9b7e3d0`, what is `9b7e3d0`?

- A) The registry
- B) The namespace
- C) The tag
- D) The digest

<details>
<summary>Answer</summary>

**Answer:** C) The tag

</details>

### P2. Which tag to deploy?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** tagging strategy

Which tag should the production `.env` reference?

- A) `latest`
- B) `stable`
- C) The commit SHA tag built by CI
- D) No tag

<details>
<summary>Answer</summary>

**Answer:** C) The commit SHA tag built by CI

</details>

### P3. Push manually

**Difficulty:** Easy · **Type:** Command · **Concepts:** tag and push

You built `taskapi:1.0.0` locally. Tag and push it to Docker Hub as `alice/taskapi:1.0.0`.

<details>
<summary>Answer</summary>

```bash
# Illustrative
docker login
docker tag taskapi:1.0.0 alice/taskapi:1.0.0
docker push alice/taskapi:1.0.0
```

</details>

### P4. Login safely

**Difficulty:** Medium · **Type:** Command · **Concepts:** authentication

On the server, log in to `ghcr.io` as `alice` with a token stored in the variable `GHCR_TOKEN`, without the token appearing in the command line.

<details>
<summary>Answer</summary>

```bash
# Illustrative
echo "$GHCR_TOKEN" | docker login ghcr.io -u alice --password-stdin
```

</details>

### P5. Push denied

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** GITHUB_TOKEN permissions

The `docker/build-push-action` step fails with `denied: permission_denied` when pushing to `ghcr.io`. What is missing in the job?

<details>
<summary>Answer</summary>

```yaml
permissions:
  contents: read
  packages: write
```

(and the `docker/login-action` step for `ghcr.io` before the push).

</details>

### P6. Pull fails on the server

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** private images

`docker compose pull app` on the VPS fails with `unauthorized`. The image is in a private GHCR package. Fix it.

<details>
<summary>Answer</summary>

Create a token with only `read:packages`, then on the server: `echo "$TOKEN" | docker login ghcr.io -u <user> --password-stdin`, and pull again.

</details>

### P7. Two tags

**Difficulty:** Medium · **Type:** CI/CD · **Concepts:** build-push-action

Write the `tags` input that pushes the image as both the commit SHA and `latest`, using `env.IMAGE` as the repository.

<details>
<summary>Answer</summary>

```yaml
tags: |
  ${{ env.IMAGE }}:${{ github.sha }}
  ${{ env.IMAGE }}:latest
```

</details>

### P8. Rollback

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** tags and rollback

Production runs `taskapi:latest`. After a bad release, the team wants to return to yesterday's version. Why is that hard, and what would have made it a one-line change?

<details>
<summary>Answer</summary>

`latest` now points to the bad image; nobody recorded which digest ran yesterday (it may be found in the registry's history or with `docker image ls --digests` on the server, if still present). With SHA tags in `.env`, yesterday's tag is known and still in the registry: set `APP_IMAGE=…:<previous-sha>` and `docker compose up -d app`.

</details>
