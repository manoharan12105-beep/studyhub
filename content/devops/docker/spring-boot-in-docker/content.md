# Spring Boot in Docker

**Module:** Docker · **Interview priority:** Core

## What Is It?

This lesson runs a realistic Spring Boot backend — the **Task API** used throughout this subject — inside a container: package the JAR, build the image, run it with port mapping, configure it with environment variables and profiles, read its logs and check its health.

The Task API is a Spring Boot 4.1 application on JDK 21 with Spring Web MVC, Spring Data JPA, Flyway, Actuator and PostgreSQL. Its endpoints:

| Endpoint | Returns |
|----------|---------|
| `GET /api/tasks` | All tasks as JSON |
| `POST /api/tasks` | Creates a task from `{"title": "…"}` (400 if the title is blank) |
| `GET /api/info` | App name, version, active profiles and the host name that answered |
| `GET /actuator/health` (+ `/liveness`, `/readiness`) | Health status for Docker, scripts and load balancers |

The complete source is in the [Lab Setup](../../labs/devops-lab-setup/content.md).

## Why It Matters

- "How did you deploy your Spring Boot app?" is a standard project-interview question.
- Most container problems with Spring Boot are configuration problems: wrong port mapping, `localhost` pointing at the wrong place, a missing environment variable, or a profile that was never activated.

## Packaging the Application

The Spring Boot Maven plugin builds an **executable fat JAR**: your classes, every dependency and an embedded Tomcat in one file.

```bash
# Illustrative: in the project folder (tests need PostgreSQL — see the Lab Setup)
./mvnw -B verify
ls -lh target/*.jar
java -jar target/taskapi-1.0.0.jar
```

**Expected result:** `BUILD SUCCESS`, a JAR of roughly 55 MB in `target/`, and the application starting with its own Tomcat on port 8080. No application server needs to be installed anywhere — the container only needs a JRE.

## From JAR to Image to Container

With the multi-stage `Dockerfile` from [Writing a Dockerfile](../dockerfile-fundamentals/content.md) in the project root:

```bash
# Illustrative: run on a machine with Docker
docker build -t taskapi:1.0.0 .
docker images taskapi
docker run -d --name taskapi -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/taskdb \
  taskapi:1.0.0
docker logs -f taskapi
```

**Expected result:** the image appears in `docker images`; the logs show the Spring banner and end with `Tomcat started on port 8080 (http)` and `Started TaskApiApplication in … seconds` — if a database is reachable. Without one, start-up fails (see "Running without a database" below). The next lessons give PostgreSQL its own container; `host.docker.internal` is explained under [Docker Networking](../docker-networking/content.md).

## Port Mapping

```text
          your laptop (host)                         container
 browser ──► localhost:8080 ──-p 8080:8080──► 0.0.0.0:8080  Tomcat (Spring Boot)
```

| Mapping | Host URL | Notes |
|---------|----------|-------|
| `-p 8080:8080` | `http://localhost:8080` | Same port both sides |
| `-p 9000:8080` | `http://localhost:9000` | Host port 9000 → container port 8080 |
| `-p 127.0.0.1:8080:8080` | `http://localhost:8080` | Only this machine can connect — the production setting behind Nginx |
| no `-p` | — | Reachable only from other containers on the same network |

Spring Boot listens on all interfaces (`0.0.0.0`) by default, which is what port publishing needs. An app that listened only on `127.0.0.1` *inside* the container could not receive forwarded traffic.

## Host, Container and Localhost

`localhost` always means "the machine (network namespace) I am running in":

| Who calls | URL | Reaches |
|-----------|-----|---------|
| You on the host | `http://localhost:8080` | The container, through the published port |
| A process **inside** the container | `http://localhost:8080` | The app itself (its own network namespace) |
| Another container | `http://localhost:8080` | **Itself**, not the app — usually "connection refused" |
| Another container on the same network | `http://taskapi:8080` | The app, by container/service name |

The last two rows are the most important rule in this subject: **containers reach each other by name, never by `localhost`**. The [Docker Networking](../docker-networking/content.md) lesson demonstrates it with PostgreSQL.

## Environment Variables and Relaxed Binding

Spring Boot reads environment variables and maps them to properties ("relaxed binding"): uppercase, dots and dashes become underscores.

| Environment variable | Property |
|----------------------|----------|
| `SPRING_PROFILES_ACTIVE=prod` | `spring.profiles.active` |
| `SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/taskdb` | `spring.datasource.url` |
| `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | `spring.datasource.username`, `.password` |
| `SERVER_PORT=9090` | `server.port` |
| `APP_VERSION=1.0.0` | `app.version` (read by `/api/info`) |

Environment variables override `application.yml`, so the same image runs in every environment with different variables. Deeper: [Externalized Configuration](../../../spring-boot/spring-boot-core/externalized-configuration/content.md).

## Spring Profiles and Production Configuration

`application.yml` holds local development defaults; `application-prod.yml` is applied on top when the `prod` profile is active:

```yaml
# src/main/resources/application-prod.yml
# Active when SPRING_PROFILES_ACTIVE=prod. No credentials in this file:
# the placeholders have no defaults, so a missing variable stops the start-up.
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL}
    username: ${SPRING_DATASOURCE_USERNAME}
    password: ${SPRING_DATASOURCE_PASSWORD}

server:
  forward-headers-strategy: native

management:
  endpoint:
    health:
      show-details: never
```

The JAR was started with `SPRING_PROFILES_ACTIVE=prod` and the three datasource variables set (directly on the host, the same configuration the container receives). Its log confirms the profile:

**Output (varies):**

```text
INFO 13856 --- [taskapi] [           main] com.example.taskapi.TaskApiApplication   : The following 1 profile is active: "prod"
```

(The timestamp prefix is removed here; the process ID varies.) Started **without** the variables, the `prod` profile fails fast instead of silently using development defaults — this is the real cause line from that run:

**Output:**

```text
Caused by: java.lang.IllegalArgumentException: 'url' must start with "jdbc"
```

The unresolved placeholder `${SPRING_DATASOURCE_URL}` stayed as literal text, so the datasource rejected it. If you see this in `docker logs`, a variable is missing from the container's environment.

## Application Logs

Inside a container, log to **stdout** — Spring Boot's default. Docker captures stdout and stderr, so `docker logs` (and `docker compose logs`) show everything without log files inside the container. The Task API logs each created task:

**Output (varies):**

```text
INFO 18036 --- [taskapi] [nio-8080-exec-3] c.example.taskapi.task.TaskController    : Created task 1
```

## Health Endpoint

Spring Boot Actuator exposes `/actuator/health`. The Task API enables the liveness and readiness groups (`management.endpoint.health.probes.enabled: true`), adds the database check to readiness (`management.endpoint.health.group.readiness.include: readinessState,db` — by default readiness ignores the database), and exposes only `health` and `info` over HTTP. Requests against the running JAR:

```bash
curl -s localhost:8080/actuator/health
curl -s localhost:8080/actuator/health/readiness
curl -s localhost:8080/api/info
```

**Output (varies):**

```text
{"groups":["liveness","readiness"],"status":"UP"}
{"status":"UP"}
{"app":"taskapi","version":"1.0.0","profiles":"prod","host":"devbox"}
```

The `host` value was the test machine's name (shown here as `devbox`). Inside a container it is the container ID — a quick way to see *which* container answered.

| Endpoint | Means | Used by |
|----------|-------|---------|
| `/actuator/health` | Overall status, including the database check | Uptime monitors, people |
| `/actuator/health/liveness` | "The process is alive — do not restart me" | Restart decisions |
| `/actuator/health/readiness` | "I can serve traffic now" — in the Task API, including "the database answers" | Deployment scripts, Docker health checks, load balancers |

`show-details: never` in production hides component details (database type, disk space) from the public. Deeper: [Actuator, Health Checks, Metrics and Monitoring](../../../spring-boot/production/actuator-and-monitoring/content.md).

## Running Without a Database

Start-up runs Flyway migrations, so the application needs PostgreSQL **before** it can start. With a wrong host, the logs say exactly why. These are the real cause lines from the test runs:

| Situation | Cause line in the logs |
|-----------|------------------------|
| Host name does not resolve (e.g. `db` used outside Docker) | `Caused by: java.net.UnknownHostException: db` |
| Nothing listens at that host and port | `Connection to localhost:5999 refused. Check that the hostname and port are correct and that the postmaster is accepting TCP/IP connections.` |
| Wrong password | `FATAL: password authentication failed for user "taskapp"` |
| Port 8080 already taken | `Web server failed to start. Port 8080 was already in use.` |

## Example: Same Image, Two Configurations

```bash
# Illustrative: two containers from one image
docker run -d --name api-a -p 8081:8080 -e APP_VERSION=a --env-file db.env taskapi:1.0.0
docker run -d --name api-b -p 8082:8080 -e APP_VERSION=b --env-file db.env taskapi:1.0.0
curl -s localhost:8081/api/info
curl -s localhost:8082/api/info
```

**Expected result:** each container answers on its own host port with its own `version` and its own container ID as `host`, while both use the same database settings from `db.env`. One image, two configurations.

## Production Relevance

- Build once, configure per environment: the image never contains database URLs or passwords.
- Health endpoints let the deployment script and Docker decide automatically whether a new version is healthy.
- Logging to stdout keeps logs available through `docker logs` and avoids filling the container's filesystem.

## Common Mistakes

- Using `localhost` in `SPRING_DATASOURCE_URL` while PostgreSQL runs in another container.
- Mapping `-p 8080` (random host port) or reversing `HOST:CONTAINER`.
- Forgetting `SPRING_PROFILES_ACTIVE=prod`, so production runs with development settings.
- Exposing every Actuator endpoint (`include: "*"`) on a public port.
- Writing logs to files inside the container.

## Interview Angle

- Explain how one image runs in many environments: environment variables + profiles + relaxed binding.
- Explain localhost inside vs outside a container and how containers find each other by name.
- Explain liveness vs readiness and which one a deployment script should poll.

## Key Takeaways

- A Spring Boot fat JAR plus a JRE image is all a container needs; Tomcat is embedded.
- `-p HOST:CONTAINER` publishes; `127.0.0.1:` limits it to the host.
- Configure with environment variables (`SPRING_DATASOURCE_URL`, `SPRING_PROFILES_ACTIVE`); keep credentials out of the image and out of `application-prod.yml`.
- Log to stdout and expose `/actuator/health` with liveness and readiness groups.
