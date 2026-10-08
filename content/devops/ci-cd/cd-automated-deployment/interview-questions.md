# CD and Automated Deployment — Interview Questions

## Beginner

### Q1. What is the difference between continuous delivery and continuous deployment?

**Style:** Comparison

<details>
<summary>Answer</summary>

Both automatically build, test and package every change. With continuous delivery, releasing to production needs a manual approval; with continuous deployment, every change that passes the pipeline is released automatically.

</details>

### Q2. How does your pipeline deploy to the VPS?

**Style:** How

<details>
<summary>Answer</summary>

After tests pass, a publish job pushes an image tagged with the commit SHA to GHCR. A deploy job in the `production` environment SSHes to the server with a deployment-only key and runs `deploy.sh <sha>`, which updates `APP_IMAGE` in `.env`, runs `docker compose pull app` and `docker compose up -d app`, and polls the readiness endpoint, rolling back to the previous tag if it is not healthy within two minutes.

</details>

### Q3. Why does a deployment need a health check?

**Style:** Why

<details>
<summary>Answer</summary>

`docker compose up -d` succeeds as soon as the container starts, even if the application then fails (bad configuration, unreachable database, migration error). Only a readiness check proves the new version can serve traffic, and it is the trigger for an automatic rollback.

</details>

### Q4. How do you roll back with Docker images?

**Style:** How

<details>
<summary>Answer</summary>

Deploy the previous image tag again: images are immutable, so the old tag is exactly the old version. Set it in `.env` and run `docker compose up -d app` (or run the deploy script with the old SHA).

</details>

## Intermediate

### Q5. How do you give GitHub Actions SSH access to the server securely?

**Style:** How

<details>
<summary>Answer</summary>

Create a key pair used only for deployments; add its public key to the deploy user's `authorized_keys` (optionally restricted to one command); store the private key and the server's `known_hosts` line as secrets of the `production` environment. The job writes them to files with `600` permissions and uses normal host key verification. The deploy user is not root (but note that `docker` group membership is root-equivalent).

</details>

### Q6. What does `concurrency: production` prevent?

**Style:** What happens if

<details>
<summary>Answer</summary>

Two deployments running at the same time — for example after two quick merges — editing `.env` and restarting containers concurrently, which could leave an unexpected version running or break the rollback information. With the concurrency group, the second deployment waits for the first.

</details>

### Q7. The deploy job is green but users see errors. How can that happen?

**Style:** Troubleshooting

<details>
<summary>Answer</summary>

The checks did not cover the failure: readiness may pass while a specific endpoint fails (a bug, a missing migration for one feature), or the server-local check passed while the public path is broken (Nginx, certificate, DNS). Add a public end-to-end check, smoke-test key endpoints after deployment, and watch error rates and logs for a few minutes.

</details>

### Q8. How do you add a manual approval before production in GitHub Actions?

**Style:** How

<details>
<summary>Answer</summary>

Create an environment `production` with required reviewers and reference it in the deploy job (`environment: production`). The job pauses until a reviewer approves; only then does it receive the environment's secrets.

</details>

## Advanced

### Q9. Why can't every failed deployment be rolled back by switching the image tag?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Database changes are not rolled back with the image. If the new version ran a migration that the old version cannot work with (dropped or renamed columns, changed types), the old image fails too. Use expand/contract migrations so each schema version works with the previous application version, back up before risky migrations, and treat destructive changes as separate, later releases.

</details>

### Q10. How would you remove the short downtime during each deployment?

**Style:** Architecture

<details>
<summary>Answer</summary>

Run the new version beside the old one and switch traffic only after it is ready: blue/green with two Compose services (or projects) on different loopback ports, waiting for the new one's readiness, then changing Nginx's `proxy_pass`/upstream and reloading Nginx, then stopping the old one. Or run two instances behind an Nginx upstream and replace them one at a time. Orchestrators (Kubernetes rolling updates) automate this at larger scale.

</details>
