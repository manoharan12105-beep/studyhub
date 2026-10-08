# Configuration and Secrets — Practice

### P1. Bad or good?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** secrets in code

Which line is safe to commit in `application-prod.yml`?

- A) `password: 123456`
- B) `password: ${SPRING_DATASOURCE_PASSWORD}`
- C) `password: prodPassword2026`
- D) `password: ${SPRING_DATASOURCE_PASSWORD:prodPassword2026}`

<details>
<summary>Answer</summary>

**Answer:** B) `password: ${SPRING_DATASOURCE_PASSWORD}`

**Explanation:** D still commits the real password as the default value.

</details>

### P2. Ignore it

**Difficulty:** Easy · **Type:** Configuration · **Concepts:** .gitignore

Write `.gitignore` lines that ignore `.env` and any `*.env` file but keep `.env.example`.

<details>
<summary>Answer</summary>

```text
.env
*.env
!.env.example
```

</details>

### P3. Protect the file

**Difficulty:** Easy · **Type:** Command · **Concepts:** permissions

On the server, make `/opt/taskapi/.env` readable and writable only by its owner.

<details>
<summary>Answer</summary>

```bash
# Illustrative
chmod 600 /opt/taskapi/.env
```

</details>

### P4. Wire it through Compose

**Difficulty:** Medium · **Type:** Compose · **Concepts:** interpolation

`.env` contains `DB_PASSWORD=…`. Write the `environment` entry of the `app` service that passes it to Spring Boot's datasource password, failing with a clear message if it is missing.

<details>
<summary>Answer</summary>

```yaml
environment:
  SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD:?Set DB_PASSWORD in .env}
```

</details>

### P5. Precedence

**Difficulty:** Medium · **Type:** Output · **Concepts:** Spring Boot precedence

`application.yml` sets `server.port: 8080`, `application-prod.yml` sets `server.port: 8081`, the container has `SERVER_PORT=8082` and the `prod` profile is active. Which port does Tomcat use?

<details>
<summary>Answer</summary>

8082 — environment variables override both files.

</details>

### P6. Leaked key

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** rotation

A Stripe test key and a production database password were committed to a public repository last week. Order the response steps: rewrite history, rotate the database password, check database access logs, revoke the Stripe key, add `.gitignore` and secret scanning.

<details>
<summary>Answer</summary>

Rotate the database password and revoke the Stripe key (immediately) → check database access logs → add `.gitignore` and secret scanning → rewrite history (optional, last; copies may already exist).

</details>

### P7. Use the secret in a workflow

**Difficulty:** Medium · **Type:** CI/CD · **Concepts:** GitHub Secrets

Write a workflow step that makes the repository secret `DEPLOY_HOST` available to a shell command as the environment variable `HOST` and prints a message that does **not** reveal it.

<details>
<summary>Answer</summary>

```yaml
- name: Show target
  env:
    HOST: ${{ secrets.DEPLOY_HOST }}
  run: echo "Deploying to the configured host"
```

Referencing it through `env:` keeps it out of the script text; it would be masked as `***` even if printed, but printing secrets is still avoided.

</details>

### P8. Which mechanism?

**Difficulty:** Medium · **Type:** Decision · **Concepts:** .env vs env_file

You want twelve variables from `app.env` to become container variables of `app` without listing each one in `compose.yaml`. Which Compose key?

<details>
<summary>Answer</summary>

`env_file: app.env` on the `app` service. (`.env` alone would only fill `${…}` placeholders in `compose.yaml`.)

</details>

### P9. Spot the leaks

**Difficulty:** Hard · **Type:** Configuration · **Concepts:** secret review

Find four places where secrets leak in this setup: `Dockerfile` has `ENV JWT_SECRET=abc123`; the workflow runs `echo ${{ secrets.DB_PASSWORD }} | base64`; `application.yml` exposes `management.endpoints.web.exposure.include: "*"`; the server's `.env` is mode `644`.

<details>
<summary>Answer</summary>

1. `ENV JWT_SECRET` bakes the key into the image (visible with `docker inspect`). 2. The base64 of a secret is not masked in workflow logs. 3. Exposing all Actuator endpoints includes `/actuator/env` and `/actuator/heapdump`, which reveal configuration and memory. 4. `.env` with `644` is readable by every user on the server.

</details>

### P10. Generate it

**Difficulty:** Hard · **Type:** Command · **Concepts:** strong secrets

Generate a random value suitable as an HS256 JWT signing key and as a database password.

<details>
<summary>Answer</summary>

```bash
# Illustrative
openssl rand -base64 32     # 256 random bits for the JWT key
openssl rand -base64 24     # a long random database password
```

</details>
