# Lab 17 — Interview Questions

## Beginner

### Q1. What does your deploy job actually do on the server?

**Style:** How

<details>
<summary>Answer</summary>

It SSHes in as `deploy` with a deployment-only key and runs `/opt/taskapi/deploy.sh <sha>`. The script remembers the current image, writes the new one into `.env`, runs `docker compose pull app` and `docker compose up -d app`, polls the readiness endpoint for up to two minutes, and restores the previous image (failing the job) if it never becomes ready.

</details>

## Intermediate

### Q2. Why keep the deployment logic in a script on the server rather than inline in the workflow?

**Style:** Trade-off

<details>
<summary>Answer</summary>

The same script works for manual deployments and rollbacks during an incident when GitHub is unavailable; the workflow stays small; and the logic is tested and versioned in the repository (`deploy/deploy.sh`). The trade-off is that the server's copy must be updated when the script changes.

</details>

### Q3. How did you test the rollback path without breaking production for real?

**Style:** Scenario

<details>
<summary>Answer</summary>

The script's control flow was exercised with stubbed `docker` and `curl` commands (healthy and unhealthy cases), then in the pipeline by merging a deliberately broken release, observing the automatic rollback and the red job, and reverting. A staging server is the safer place for the second test when available.

</details>
