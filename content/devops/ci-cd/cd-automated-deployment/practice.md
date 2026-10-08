# CD and Automated Deployment — Practice

### P1. Which release style?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** delivery vs deployment

The deploy job uses `environment: production`, and that environment requires one reviewer. Which practice is this?

- A) Continuous integration only
- B) Continuous delivery
- C) Continuous deployment
- D) Manual deployment

<details>
<summary>Answer</summary>

**Answer:** B) Continuous delivery

</details>

### P2. Order the pipeline

**Difficulty:** Easy · **Type:** CI/CD · **Concepts:** pipeline stages

Order: health check, push image, run tests, `docker compose up -d`, build image, SSH to VPS, pull image.

<details>
<summary>Answer</summary>

run tests → build image → push image → SSH to VPS → pull image → `docker compose up -d` → health check.

</details>

### P3. Job dependency

**Difficulty:** Easy · **Type:** CI/CD · **Concepts:** needs

Write the lines that make `deploy` run only after `publish` succeeded and read its `tag` output into `TAG`.

<details>
<summary>Answer</summary>

```yaml
deploy:
  needs: publish
  steps:
    - env:
        TAG: ${{ needs.publish.outputs.tag }}
      run: echo "Deploying $TAG"
```

</details>

### P4. Fail fast in Bash

**Difficulty:** Medium · **Type:** Output · **Concepts:** set -euo pipefail

What does `set -euo pipefail` change in a deploy script?

<details>
<summary>Answer</summary>

`-e`: exit when a command fails; `-u`: treat unset variables as errors; `-o pipefail`: a pipeline fails if any command in it fails, not only the last. Together they stop the script before it continues in a broken state.

</details>

### P5. Predict the rollback

**Difficulty:** Medium · **Type:** Output · **Concepts:** deploy script

`.env` has `APP_IMAGE=ghcr.io/demo/taskapi:aaa111`. You run `./deploy.sh ccc333`, and the new version never becomes ready. What does `.env` contain afterwards, what is printed on stderr, and what is the exit code?

<details>
<summary>Answer</summary>

`APP_IMAGE=ghcr.io/demo/taskapi:aaa111` (restored); stderr: `Not healthy after 2 minutes: rolling back to ghcr.io/demo/taskapi:aaa111`; exit code 1 — the GitHub job fails.

</details>

### P6. Host key verification failed

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** known_hosts

The SSH step fails with `Host key verification failed`. A teammate suggests `-o StrictHostKeyChecking=no`. What do you do instead?

<details>
<summary>Answer</summary>

Store the server's host key: run `ssh-keyscan <host>` from a trusted machine, compare the fingerprint with the provider console, and save the line as the `DEPLOY_KNOWN_HOSTS` secret written to `~/.ssh/known_hosts`. Disabling the check would allow a man-in-the-middle to receive your deployment commands. (If the server was rebuilt, its host key changed — update the secret.)

</details>

### P7. Two merges, one minute apart

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** concurrency

Without `concurrency`, two deployments overlap. Describe one bad outcome.

<details>
<summary>Answer</summary>

Deployment A records `PREVIOUS=v1` and starts v2; deployment B records `PREVIOUS=v2` and starts v3 while v2 is still starting; if v3 fails, B rolls back to v2 (possibly unverified), and A's health check might be checking v3. The end state and rollback target are unpredictable.

</details>

### P8. Green job, broken site

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** verification layers

`deploy.sh` reported healthy, but the public check `curl -fsS https://api.example.com/actuator/health` failed. Where is the problem, and what do you check?

<details>
<summary>Answer</summary>

Between the internet and the app: Nginx (`systemctl status nginx`, `nginx -t`, `error.log`), the certificate (expired? renewal?), DNS (`dig`), firewalls (443 open in ufw and the provider), and whether `proxy_pass` points to the published port.

</details>

### P9. Safe schema change

**Difficulty:** Hard · **Type:** Decision · **Concepts:** rollback and migrations

A release must rename `tasks.title` to `tasks.name`. Plan the releases so any single deployment can be rolled back by tag.

<details>
<summary>Answer</summary>

Release 1: add `name`, copy data, write both columns, read `title`. Release 2: read `name` (still writing both). Release 3: stop writing `title`. Release 4: drop `title`. At every step the previous image still works with the current schema.

</details>
