# Docker Compose — Practice

### P1. Start in the background

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** compose commands

Which command starts the whole stack in the background?

- A) `docker compose run`
- B) `docker compose up -d`
- C) `docker compose start -a`
- D) `docker-compose build`

<details>
<summary>Answer</summary>

**Answer:** B) `docker compose up -d`

</details>

### P2. Keep the data

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** down vs down -v

You want to remove the containers but keep the PostgreSQL data. Which command?

- A) `docker compose down -v`
- B) `docker compose down`
- C) `docker volume prune -a`
- D) `docker compose rm -v`

<details>
<summary>Answer</summary>

**Answer:** B) `docker compose down`

</details>

### P3. Fix the URL

**Difficulty:** Easy · **Type:** Compose · **Concepts:** service names

```yaml
services:
  postgres:
    image: postgres:18
  api:
    image: taskapi:local
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/taskdb
```

What should the URL be?

<details>
<summary>Answer</summary>

`jdbc:postgresql://postgres:5432/taskdb` — the service is named `postgres`, and that name is its host name on the project network.

</details>

### P4. Wait for the database

**Difficulty:** Medium · **Type:** Compose · **Concepts:** depends_on, healthcheck

Write the `db` health check and the `app` dependency so `app` starts only when PostgreSQL accepts connections for user `taskapp` and database `taskdb`.

<details>
<summary>Answer</summary>

```yaml
services:
  db:
    image: postgres:18
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U taskapp -d taskdb"]
      interval: 10s
      timeout: 5s
      retries: 5
  app:
    image: taskapi:local
    depends_on:
      db:
        condition: service_healthy
```

</details>

### P5. Which restart policy?

**Difficulty:** Medium · **Type:** Decision · **Concepts:** restart policies

The API must come back after crashes and after a server reboot, but stay down when an operator deliberately stops it for maintenance. Which policy?

<details>
<summary>Answer</summary>

`restart: unless-stopped`.

</details>

### P6. What gets recreated?

**Difficulty:** Medium · **Type:** Output · **Concepts:** declarative up

The stack runs. You change only `app.environment` in `compose.yaml` and run `docker compose up -d`. What happens to `db` and `app`?

<details>
<summary>Answer</summary>

`db` keeps running untouched; `app` is recreated with the new environment.

</details>

### P7. Missing secret

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** interpolation

`docker compose up -d` fails immediately with "Set DB_PASSWORD in .env". Why, and which command would have shown the problem before starting anything?

<details>
<summary>Answer</summary>

The file uses `${DB_PASSWORD:?Set DB_PASSWORD in .env}` and the variable is not defined (no `.env` next to `compose.yaml`, or the key is missing). `docker compose config` interpolates and validates the file without starting containers, and shows the same error.

</details>

### P8. Publish safely

**Difficulty:** Medium · **Type:** Compose · **Concepts:** ports on a server

On a VPS where Nginx runs on the host, write the `ports` entry for the app so only Nginx (on the same machine) can reach it on 8080.

<details>
<summary>Answer</summary>

```yaml
ports:
  - "127.0.0.1:8080:8080"
```

</details>

### P9. Review this file

**Difficulty:** Hard · **Type:** Compose · **Concepts:** compose review

Find five problems:

```yaml
version: "3"
services:
  db:
    image: postgres:latest
    environment:
      POSTGRES_PASSWORD: 123456
    ports:
      - "5432:5432"
  app:
    image: taskapi:local
    depends_on: [db]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/postgres
```

<details>
<summary>Answer</summary>

1. Obsolete `version:` key. 2. `postgres:latest` — pin a major version. 3. Password committed in the file — use `${DB_PASSWORD}` from `.env`. 4. Database port published to the world. 5. No volume — data lost when the container is removed. 6. `localhost` instead of `db` in the URL. 7. Short `depends_on` without a health check. 8. No restart policies. (Any five.)

</details>

### P10. Reset development, protect production

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** down -v

A developer adds `docker compose down -v && docker compose up -d` to the deployment script "to start clean". What happens on the next production deployment, and what should the script do instead?

<details>
<summary>Answer</summary>

`down -v` deletes the `pgdata` volume — every production row is lost, and Flyway recreates empty tables. A deployment script should only update what changed: `docker compose pull app` and `docker compose up -d app`, then a health check (and a backup before risky changes).

</details>
