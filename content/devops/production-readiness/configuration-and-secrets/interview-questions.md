# Configuration and Secrets — Interview Questions

## Beginner

### Q1. Why must secrets never be committed to Git?

**Style:** Why

<details>
<summary>Answer</summary>

Git keeps every version forever: a secret stays in the history, in every clone and fork, and in caches, even after a later commit deletes it. Public repositories are scanned by bots within minutes. Anyone with read access to the repository — now or in the future — gets production access.

</details>

### Q2. How does a Spring Boot application in Docker get its database password?

**Style:** How

<details>
<summary>Answer</summary>

From an environment variable. On the server, `.env` (git-ignored, `chmod 600`) holds `DB_PASSWORD`; `compose.yaml` maps it with `SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}`; Docker sets that variable in the container; Spring Boot's relaxed binding (or a `${…}` placeholder) turns it into `spring.datasource.password`.

</details>

### Q3. What is the purpose of a `.env.example` file?

**Style:** What

<details>
<summary>Answer</summary>

It documents every variable the application needs, with placeholder values, and is committed. Developers and operators copy it to `.env` and fill in real values, which are never committed.

</details>

### Q4. What are GitHub Secrets?

**Style:** What

<details>
<summary>Answer</summary>

Encrypted values stored per repository, environment or organisation and exposed to workflows as `${{ secrets.NAME }}`. They are masked in logs, not given to workflows triggered by pull requests from forks, and environment secrets can be protected by required reviewers.

</details>

## Intermediate

### Q5. A developer pushed `application-prod.properties` with the database password to a public repository and deleted it 10 minutes later. What do you do?

**Style:** Production failure

<details>
<summary>Answer</summary>

Treat the secret as compromised: rotate it immediately (change the database password, update the server's `.env`, recreate the app container), check database logs for unexpected access, and only then optionally rewrite history (`git filter-repo`) and ask GitHub to purge caches. Prevent a repeat: `.gitignore`, `${…}` placeholders, secret scanning with push protection.

</details>

### Q6. Which wins: `server.port` in `application-prod.yml` or the environment variable `SERVER_PORT`?

**Style:** Trap

<details>
<summary>Answer</summary>

The environment variable. OS environment variables rank above all `application*.yml` files in Spring Boot's precedence; only higher sources such as Java system properties, `SPRING_APPLICATION_JSON` and command-line arguments override them.

</details>

### Q7. What is the difference between Compose's `.env` file and `env_file:`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`.env` in the project folder supplies values for `${VAR}` interpolation in `compose.yaml` itself; its entries do not automatically become container variables. `env_file:` on a service loads a file's lines as environment variables of that container. A common pattern is `.env` + explicit `environment:` mappings, which documents exactly what each service receives.

</details>

### Q8. Why should each environment have its own secrets?

**Style:** Why

<details>
<summary>Answer</summary>

Blast radius: development and CI secrets are seen by more people and machines and leak more easily. If production shares them, a development leak becomes a production breach. Separate secrets also allow rotating one environment without touching the others.

</details>

## Advanced

### Q9. How would you generate and manage a JWT signing secret for production?

**Style:** How

<details>
<summary>Answer</summary>

Generate at least 256 random bits (`openssl rand -base64 32`), store it only in the server's protected `.env` or a secret manager, pass it as `JWT_SECRET`, and reference it with `${JWT_SECRET}` in configuration. Never log it. Plan rotation: changing it invalidates all tokens, so either accept forced re-login or support two keys during a transition (key IDs).

</details>

### Q10. Why are `ARG`/`ENV` in a Dockerfile poor places for secrets, and what are the alternatives?

**Style:** Trade-off

<details>
<summary>Answer</summary>

`ENV` values are stored in the image config (`docker inspect`), and `ARG` values used in build steps appear in `docker history`; anyone who pulls the image can read them, and images are copied to registries and caches. Provide run-time secrets via environment variables from a protected source (`.env`, a secret manager, Docker secrets), and build-time secrets (private repository tokens) via BuildKit secret mounts (`RUN --mount=type=secret,…`), which never land in a layer.

</details>
