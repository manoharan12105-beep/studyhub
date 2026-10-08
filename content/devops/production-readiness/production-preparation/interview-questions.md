# Production Preparation — Interview Questions

## Beginner

### Q1. What would you change in a Spring Boot application before its first production deployment?

**Style:** What

<details>
<summary>Answer</summary>

Activate a `prod` profile without secrets; take credentials from environment variables; manage the schema with Flyway and set `ddl-auto` to `validate`; log to stdout at INFO; expose only `health` and `info` with liveness/readiness groups; keep stack traces out of responses; restrict CORS to real origins; run as a non-root user with a heap sized from the container limit; rely on graceful shutdown; set restart policies; and verify health after deployment.

</details>

### Q2. Why should `spring.jpa.hibernate.ddl-auto` not be `update` in production?

**Style:** Why

<details>
<summary>Answer</summary>

`update` lets Hibernate alter tables on start-up from the current entity classes, without review, version history or rollback; it never drops obsolete columns and can make unintended changes. Production schemas should change only through versioned migrations (Flyway/Liquibase), with Hibernate set to `validate` to fail fast if entities and schema disagree.

</details>

### Q3. What is CORS and when does a Spring Boot API need it?

**Style:** What

<details>
<summary>Answer</summary>

Cross-Origin Resource Sharing: a browser mechanism that blocks scripts on one origin from reading responses from another origin unless the server sends `Access-Control-Allow-*` headers. An API needs CORS configuration when a browser front end on a different origin (scheme, host or port) calls it. Allow only the specific front-end origins.

</details>

### Q4. Why must error responses not contain stack traces?

**Style:** Why

<details>
<summary>Answer</summary>

Stack traces reveal internals — class names, libraries and versions, SQL, file paths — that help attackers, and they are useless to clients. Return a status and a clear message (Spring Boot's default error JSON or `ProblemDetail`), and log the full exception on the server.

</details>

## Intermediate

### Q5. Explain graceful shutdown in a containerised Spring Boot application.

**Style:** How

<details>
<summary>Answer</summary>

`docker stop` sends SIGTERM to PID 1. With an exec-form `ENTRYPOINT`, the JVM receives it; Spring Boot (graceful by default since 3.4) stops accepting new requests, lets in-flight requests finish within `spring.lifecycle.timeout-per-shutdown-phase` (30 s default), closes resources and exits. Docker sends SIGKILL after its stop timeout (10 s default), so set `stop_grace_period` longer than the requests you need to finish.

</details>

### Q6. How do you size the JVM heap for a container?

**Style:** How

<details>
<summary>Answer</summary>

Give the container a memory limit and let the container-aware JVM size the heap from it with `-XX:MaxRAMPercentage` (often 60–75 %), leaving the rest for metaspace, thread stacks, code cache and direct buffers. Avoid a fixed `-Xmx` near the limit. Watch `docker stats` under load and look for exit code 137 / `OOMKilled`.

</details>

### Q7. Which Actuator endpoints are dangerous to expose publicly and why?

**Style:** Trap

<details>
<summary>Answer</summary>

`env` and `configprops` (configuration, possibly secrets — values are masked by default in recent versions, but structure and some values still leak), `heapdump` (memory, including secrets and user data), `threaddump`, `loggers` (can change log levels), `beans`, `mappings`, `shutdown` if enabled. Expose only `health` and `info` publicly; serve the rest on a private management port or behind authentication.

</details>

### Q8. Why set `server.forward-headers-strategy` when Nginx is in front of Spring Boot?

**Style:** Why

<details>
<summary>Answer</summary>

Behind a proxy, Spring sees requests from `127.0.0.1` over plain HTTP. With the strategy set, it uses `X-Forwarded-For`, `X-Forwarded-Proto` and related headers from Nginx, so redirects use `https://`, generated links are correct, and logs show the real client IP. Only enable it when a trusted proxy sets those headers.

</details>

## Advanced

### Q9. During each deployment a few requests fail with 502. How do you make deployments smoother?

**Style:** Production failure

<details>
<summary>Answer</summary>

Check graceful shutdown first (exec-form `ENTRYPOINT`, adequate stop timeout) so in-flight requests finish. The remaining gap is the time between the old container stopping and the new one becoming ready: with one instance, Nginx has nothing to proxy to. Options: run two instances behind Nginx and replace them one at a time, or blue/green (start the new version on another port, wait for readiness, switch Nginx with a reload, then stop the old one). Nginx's `proxy_next_upstream` can retry idempotent requests on another instance.

</details>

### Q10. Is CORS a security control for your API?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Only for browsers: it stops other websites' scripts from reading your API's responses in a user's browser (protecting users' sessions). It does nothing against non-browser clients — `curl`, scripts or attackers call the API directly. Real protection is authentication, authorization, input validation and rate limiting; CORS should still be restrictive to avoid helping cross-site attacks.

</details>
