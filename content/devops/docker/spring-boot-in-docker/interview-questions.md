# Spring Boot in Docker — Interview Questions

## Beginner

### Q1. Why does a Spring Boot container not need Tomcat installed?

**Style:** Why

<details>
<summary>Answer</summary>

The Spring Boot Maven plugin builds an executable fat JAR that contains the application, all dependencies and an embedded Tomcat. The container only needs a JRE to run `java -jar app.jar`.

</details>

### Q2. How do you pass configuration to a Spring Boot application in a container?

**Style:** How

<details>
<summary>Answer</summary>

With environment variables (`docker run -e`, `--env-file`, or `environment:` in Compose). Spring Boot's relaxed binding maps `SPRING_DATASOURCE_URL` to `spring.datasource.url`, `SERVER_PORT` to `server.port`, and so on, and environment variables override `application.yml`. Profiles are activated with `SPRING_PROFILES_ACTIVE`.

</details>

### Q3. You run `docker run -p 9000:8080 taskapi`. Which URL do you open on the host?

**Style:** What

<details>
<summary>Answer</summary>

`http://localhost:9000`. Host port 9000 is forwarded to port 8080 inside the container, where Spring Boot listens.

</details>

### Q4. Where should a containerised Spring Boot application write its logs?

**Style:** What

<details>
<summary>Answer</summary>

To stdout/stderr (Spring Boot's default console logging). Docker collects that output, so `docker logs` and `docker compose logs` show it, and the log driver can rotate or ship it. Log files inside the container fill its writable layer and disappear with the container.

</details>

## Intermediate

### Q5. What is the difference between the liveness and readiness health groups?

**Style:** Comparison

<details>
<summary>Answer</summary>

Liveness answers "is the process in a working state, or should it be restarted?"; readiness answers "can it accept traffic right now?". By default readiness reflects only the application's own state; adding `db` to the group (`management.endpoint.health.group.readiness.include: readinessState,db`) makes it also require a reachable database. A deployment script or load balancer should poll readiness before sending traffic; restart decisions use liveness, which should not depend on external systems such as the database.

</details>

### Q6. The application works with `java -jar` on your laptop but in a container it cannot reach PostgreSQL at `localhost:5432`. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

Inside the container, `localhost` is the container itself, which runs no PostgreSQL. On the laptop, `localhost` was the laptop where PostgreSQL runs. Use the database container's name on a shared Docker network (`jdbc:postgresql://db:5432/taskdb`), or, for a database on the host, `host.docker.internal` (Docker Desktop, or Linux with `--add-host=host.docker.internal:host-gateway`).

</details>

### Q7. Why should production configuration fail fast when a variable is missing?

**Style:** Why

<details>
<summary>Answer</summary>

If production silently fell back to development defaults (a local URL, a development password), the app might start against the wrong database or with insecure settings, and the error would surface much later. Referencing `${SPRING_DATASOURCE_URL}` without a default in `application-prod.yml` makes start-up fail immediately with a clear cause in the logs, so the deployment's health check fails and nothing broken goes live.

</details>

### Q8. How can you tell which container answered a request when several replicas run?

**Style:** How

<details>
<summary>Answer</summary>

Return or log the host name: inside a container, the host name defaults to the short container ID. The Task API's `/api/info` returns it, along with the version and active profiles, so a single request shows which build and which container served it.

</details>

## Advanced

### Q9. Which Actuator endpoints would you expose in production, and how?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Only what is needed publicly: `health` (with `show-details: never` or `when-authorized`) and perhaps `info`. Endpoints such as `env`, `heapdump`, `loggers` or `beans` reveal secrets and internals; expose them only on a separate management port bound to localhost or a private network, or protect them with Spring Security. The Task API sets `management.endpoints.web.exposure.include: health,info`.

</details>

### Q10. During a deployment, requests fail for a few seconds while the old container stops. What would you check?

**Style:** Production failure

<details>
<summary>Answer</summary>

Graceful shutdown: Spring Boot (graceful by default since 3.4) stops accepting new requests on SIGTERM and finishes in-flight ones — but only if Java receives the signal (exec-form `ENTRYPOINT`) and the stop timeout is longer than the shutdown phase. Then check the switch-over: with a single container, there is a gap between the old container stopping and the new one becoming ready; avoiding it needs two instances behind Nginx or a blue/green switch, with traffic sent only after readiness is UP.

</details>
