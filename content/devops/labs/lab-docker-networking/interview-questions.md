# Lab 08 — Interview Questions

## Beginner

### Q1. What DNS server answers inside a container on a user-defined network?

**Style:** What

<details>
<summary>Answer</summary>

Docker's embedded DNS server at `127.0.0.11`. It resolves container names, aliases and Compose service names on that network and forwards other names to the host's resolvers.

</details>

## Intermediate

### Q2. How would you test connectivity between two containers without installing tools in them?

**Style:** How

<details>
<summary>Answer</summary>

Start a throwaway container on the same network with the tool you need: `docker run --rm --network appnet postgres:18 pg_isready -h db` or `docker run --rm --network appnet busybox nslookup db`. It tests exactly the network path the application uses.

</details>

### Q3. `db` is published as `127.0.0.1:15432:5432`. Which address does each client use: a host tool, and the app container on the same network?

**Style:** Trap

<details>
<summary>Answer</summary>

The host tool uses `127.0.0.1:15432`. The app container uses `db:5432` — the container port over the Docker network; the published port is only a host-side forwarding rule.

</details>
