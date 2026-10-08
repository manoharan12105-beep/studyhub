# Spring Boot in Docker — Practice

### P1. Map the variable

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** relaxed binding

Which environment variable sets `spring.datasource.username`?

- A) `spring.datasource.username`
- B) `SPRING_DATASOURCE_USERNAME`
- C) `DATASOURCE-USERNAME`
- D) `SPRING.DATASOURCE.USERNAME`

<details>
<summary>Answer</summary>

**Answer:** B) `SPRING_DATASOURCE_USERNAME`

</details>

### P2. Pick the URL

**Difficulty:** Easy · **Type:** Output · **Concepts:** port mapping

`docker run -d -p 127.0.0.1:9090:8080 taskapi:1.0.0`. Which of these work: (a) `curl localhost:9090` on the host, (b) `curl localhost:8080` on the host, (c) `curl SERVER_PUBLIC_IP:9090` from another machine?

<details>
<summary>Answer</summary>

Only (a). Nothing is published on host port 8080, and the binding to `127.0.0.1` makes 9090 unreachable from other machines.

</details>

### P3. Activate the profile

**Difficulty:** Easy · **Type:** Command · **Concepts:** profiles

Run `taskapi:1.0.0` in the background as `api`, on host port 8080, with the `prod` profile and database settings from `db.env`.

<details>
<summary>Answer</summary>

```bash
# Illustrative
docker run -d --name api -p 8080:8080 -e SPRING_PROFILES_ACTIVE=prod --env-file db.env taskapi:1.0.0
```

</details>

### P4. Read the cause

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** start-up failures

`docker logs api` ends with `Caused by: java.net.UnknownHostException: db`. The container was started with `docker run` (no Compose, no network option). What is wrong?

<details>
<summary>Answer</summary>

The name `db` cannot be resolved: the app container is on the default bridge network, which has no container-name DNS, or no container named `db` exists on its network. Create a user-defined network and run both containers on it (`docker network create appnet`, `--network appnet` for both), or use Compose, which does this automatically.

</details>

### P5. Which health endpoint?

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** liveness vs readiness

A deployment script waits until a new container can serve traffic before declaring success. Which endpoint should it poll?

- A) `/actuator/health/liveness`
- B) `/actuator/health/readiness`
- C) `/actuator/env`
- D) `/api/tasks`

<details>
<summary>Answer</summary>

**Answer:** B) `/actuator/health/readiness`

</details>

### P6. Missing variable

**Difficulty:** Medium · **Type:** Output · **Concepts:** fail fast

The Task API runs with `SPRING_PROFILES_ACTIVE=prod` but no `SPRING_DATASOURCE_URL`. Which cause line do you expect in the logs, and why does the app not use the URL from `application.yml`?

<details>
<summary>Answer</summary>

`Caused by: java.lang.IllegalArgumentException: 'url' must start with "jdbc"`. `application-prod.yml` overrides the URL with `${SPRING_DATASOURCE_URL}`; with no such variable the placeholder stays as literal text, which is not a JDBC URL. That is intentional: production must not fall back to the development database.

</details>

### P7. Two replicas

**Difficulty:** Medium · **Type:** Command · **Concepts:** one image, many containers

Start two containers from `taskapi:1.0.0` named `api-1` and `api-2`, reachable on host ports 8081 and 8082.

<details>
<summary>Answer</summary>

```bash
# Illustrative
docker run -d --name api-1 -p 8081:8080 --env-file db.env taskapi:1.0.0
docker run -d --name api-2 -p 8082:8080 --env-file db.env taskapi:1.0.0
```

The container port stays 8080; only the host ports differ.

</details>

### P8. Expose safely

**Difficulty:** Hard · **Type:** Configuration · **Concepts:** Actuator in production

Write the `application-prod.yml` fragment that exposes only `health` and `info` over HTTP and hides health details from anonymous users.

<details>
<summary>Answer</summary>

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      show-details: never
```

</details>

### P9. Logs disappeared

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** logging to stdout

A team configured Logback to write only to `/app/logs/app.log`. After a crash the container was replaced and the logs are gone; `docker logs` shows only the banner. What two changes do you make?

<details>
<summary>Answer</summary>

Log to stdout (Spring Boot's default console appender) so Docker captures the output, and configure Docker log rotation (or a log shipper) so the logs survive restarts without filling the disk. If files are truly needed, write them to a volume — but stdout is the container convention.

</details>
