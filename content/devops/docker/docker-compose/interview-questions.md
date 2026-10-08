# Docker Compose — Interview Questions

## Beginner

### Q1. What is Docker Compose and why use it?

**Style:** What

<details>
<summary>Answer</summary>

A tool (the `docker compose` CLI plugin) that defines a multi-container application in a YAML file — services, networks, volumes, environment, ports, health checks — and manages it as one project with commands such as `up`, `ps`, `logs` and `down`. It makes the stack reproducible from Git and wires networking and start order for you.

</details>

### Q2. How does the Spring Boot service find the PostgreSQL service in Compose?

**Style:** How

<details>
<summary>Answer</summary>

Compose puts all services on a project network with Docker's embedded DNS, and each service name is a host name. The app uses `jdbc:postgresql://db:5432/taskdb`, where `db` is the service name and 5432 the container port.

</details>

### Q3. What is the difference between `docker compose down` and `docker compose down -v`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`down` removes the project's containers and networks but keeps named volumes. `down -v` also removes the named volumes declared in the file (and anonymous volumes), which deletes database data.

</details>

### Q4. What does `docker compose up -d` do when the stack is already running?

**Style:** What happens if

<details>
<summary>Answer</summary>

It compares the desired state with what runs: services whose configuration or image changed are recreated, unchanged ones keep running, and missing ones are created. That makes `up -d` the deployment command after editing `compose.yaml`, `.env` or pulling a new image.

</details>

## Intermediate

### Q5. Does `depends_on` guarantee that PostgreSQL is ready before the app starts?

**Style:** Trap

<details>
<summary>Answer</summary>

The short form only orders container start-up: PostgreSQL's container is started first, but it may still be initialising when the app connects. Use the long form with `condition: service_healthy` and give `db` a health check (`pg_isready`), so Compose starts the app only when the database accepts connections. The app should still retry or fail fast cleanly.

</details>

### Q6. Compare the restart policies `always`, `unless-stopped` and `on-failure`.

**Style:** Comparison

<details>
<summary>Answer</summary>

`on-failure` restarts only after a non-zero exit and does not restart when the daemon restarts. `always` restarts whenever the container stops; a manually stopped container comes back when the daemon restarts. `unless-stopped` is like `always`, but a container you stopped stays stopped even after a daemon restart or reboot. Long-running production services typically use `unless-stopped`.

</details>

### Q7. How do you keep passwords out of `compose.yaml`?

**Style:** How

<details>
<summary>Answer</summary>

Use variable interpolation (`${DB_PASSWORD}`) and put the values in a `.env` file next to `compose.yaml` (or in the shell environment). Add `.env` to `.gitignore`, commit a `.env.example` with placeholders, and restrict the server copy with `chmod 600`. `${DB_PASSWORD:?message}` makes Compose fail with a message if the variable is missing. `docker compose config` shows the interpolated result for checking.

</details>

### Q8. What does a health check add beyond "the container is running"?

**Style:** Why

<details>
<summary>Answer</summary>

A running container only means its main process exists. A health check runs a real probe (`pg_isready`, `curl …/actuator/health/readiness`) and marks the container `healthy` or `unhealthy`. Compose uses it for `depends_on: service_healthy`, `docker compose ps` shows it, and deploy scripts and monitors can act on it.

</details>

## Advanced

### Q9. How do you deploy a new version of the app service with Compose on a server, and what is the downtime?

**Style:** Architecture

<details>
<summary>Answer</summary>

Set the new image tag (for example `APP_IMAGE` in `.env`), run `docker compose pull app` and `docker compose up -d app`. Compose stops the old container (SIGTERM → graceful shutdown) and starts a new one; with a single replica there is a short gap until the new one is ready (JVM start-up plus readiness). Then poll the readiness endpoint and roll back to the previous tag if it fails. Zero-downtime needs two instances behind Nginx (or blue/green), which plain Compose does not orchestrate for you.

</details>

### Q10. After `docker compose up -d`, `app` is `Restarting` and `db` is `healthy`. What do you check?

**Style:** Troubleshooting

<details>
<summary>Answer</summary>

`docker compose logs --tail 100 app` for the start-up error. Typical causes: `localhost` instead of `db` in the datasource URL, a password that does not match the existing volume (`password authentication failed`), a missing variable (`'url' must start with "jdbc"` with the Task API's prod profile), a Flyway migration failure, or the container being OOM-killed (`docker inspect` → `OOMKilled`). Fix the configuration and run `up -d` again.

</details>
