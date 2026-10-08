# Lab 04 — Run Spring Boot Inside Docker

**Lab:** 04 · **Module:** Spring Boot in Docker · **Verification:** Partly tested

> [!NOTE]
> Run on your own machine. **Partly tested:** the Task API was built with Maven (3 tests passing) and its JAR was run with the `prod` profile against PostgreSQL 18; the responses below come from that run. The Docker build and container steps were not executed.

## Objective

Build the Task API image with the multi-stage Dockerfile and run it as a container, configured only by environment variables, reachable through a published port.

## Prerequisites

- The Task API project from the [Lab Setup](../devops-lab-setup/content.md).
- A PostgreSQL to connect to. Until [Lab 05](../lab-postgresql-in-docker/content.md), use a PostgreSQL on your host (Docker Desktop provides the host name `host.docker.internal`; on Linux add `--add-host=host.docker.internal:host-gateway`).
- Lessons: [Writing a Dockerfile](../../docker/dockerfile-fundamentals/content.md), [Spring Boot in Docker](../../docker/spring-boot-in-docker/content.md).

## Scenario

The Task API must run on servers without Java or Maven. You produce one image and prove it runs with production settings.

## Steps

### Step 1: Add the Dockerfile and .dockerignore

Copy the multi-stage `Dockerfile` and the `.dockerignore` from [Writing a Dockerfile](../../docker/dockerfile-fundamentals/content.md) into the project root.

### Step 2: Build the image

```bash
docker build -t taskapi:local .
docker images taskapi
```

**Expected result:** the first build downloads the Maven and JRE base images and all dependencies (several minutes); the final image is listed as `taskapi:local`. Build again without changes: every step is `CACHED`.

### Step 3: Prove the cache ordering

Change a log message in `TaskController.java` and rebuild.

**Expected result:** `COPY pom.xml` and `dependency:go-offline` are `CACHED`; only `COPY src`, `mvn package` and the final `COPY --from=build` run.

### Step 4: Run with production configuration

```bash
docker run -d --name taskapi -p 8080:8080 \
  --add-host=host.docker.internal:host-gateway \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/taskdb \
  -e SPRING_DATASOURCE_USERNAME=taskapp \
  -e SPRING_DATASOURCE_PASSWORD=dev-only-password \
  -e APP_VERSION=local-1 \
  taskapi:local
docker logs -f taskapi
```

**Expected result:** the logs show `The following 1 profile is active: "prod"`, Flyway's migration lines, `Tomcat started on port 8080 (http)` and `Started TaskApiApplication`. Press Ctrl+C to stop following (the container keeps running).

### Step 5: Call the API

```bash
curl -s localhost:8080/actuator/health
curl -s -X POST localhost:8080/api/tasks -H 'Content-Type: application/json' -d '{"title":"Write Dockerfile"}'
curl -s localhost:8080/api/tasks
curl -s localhost:8080/api/info
```

The same requests against the JAR run outside Docker printed (on an empty database):

**Output (varies):**

```text
{"groups":["liveness","readiness"],"status":"UP"}
{"title":"Write Dockerfile","done":false,"id":1}
[{"title":"Write Dockerfile","done":false,"id":1}]
{"app":"taskapi","version":"1.0.0","profiles":"prod","host":"devbox"}
```

In the container, `version` is `local-1` (from `APP_VERSION`) and `host` is the container ID.

### Step 6: Stop gracefully

```bash
docker stop taskapi
docker logs --tail 5 taskapi
docker rm taskapi
```

**Expected result:** `docker stop` returns within a few seconds (not exactly 10 — that would mean SIGTERM did not reach Java); the last log lines show the shutdown (`Commencing graceful shutdown…`).

## Verification Checklist

- ☐ Image builds; a code change rebuilds only the source layers.
- ☐ Log shows the `prod` profile.
- ☐ Health is `UP`; a task can be created and listed.
- ☐ `/api/info` shows your `APP_VERSION` and the container ID.
- ☐ `docker stop` triggers a graceful shutdown.

## Common Mistakes

- `localhost` in the datasource URL (the container itself, not your host).
- Forgetting `SPRING_PROFILES_ACTIVE=prod` — the app then uses development defaults.
- Copying `target/*.jar` from your laptop instead of building inside the image (stale JARs).

## Troubleshooting

| Log line | Cause → fix |
|----------|-------------|
| `Connection to localhost:5432 refused` | Use `host.docker.internal` (or the database container's name from Lab 06) |
| `FATAL: password authentication failed for user "taskapp"` | Wrong password variable |
| `'url' must start with "jdbc"` | `SPRING_DATASOURCE_URL` not set while `prod` is active |
| `Web server failed to start. Port 8080 was already in use.` | Only inside the container is this unusual; on the host use another published port (`-p 8081:8080`) |
| `UnknownHostException: host.docker.internal` (Linux) | Add `--add-host=host.docker.internal:host-gateway` |
