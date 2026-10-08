# Production Preparation for Spring Boot

**Module:** Configuration and Production Readiness · **Interview priority:** Frequently asked

## What Is It?

An application that works on your laptop is not yet ready for production. **Production preparation** is the short list of settings and checks that make a Spring Boot service safe to expose, easy to operate and quick to diagnose: a production profile, a correct database setup, sensible logging, health checks, safe error responses, restricted CORS, secure configuration, a JVM sized for its container, graceful shutdown and restart policies.

## Why It Matters

- Most production incidents in small projects come from defaults that were fine in development: `ddl-auto: update` changing tables, stack traces shown to users, all Actuator endpoints public, a heap bigger than the container.
- A checklist done once before the first deployment prevents them.
- "How did you make your application production-ready?" is a common follow-up in project interviews.

## Production Profile

Keep production settings in `application-prod.yml`, activated with `SPRING_PROFILES_ACTIVE=prod`, with no secrets in it (see [Configuration and Secrets](../configuration-and-secrets/content.md)). Check the log line `The following 1 profile is active: "prod"` after every deployment.

## Database Configuration

| Setting | Production value | Why |
|---------|------------------|-----|
| Schema changes | Flyway (or Liquibase) migrations in `db/migration` | Versioned, repeatable, reviewed changes |
| `spring.jpa.hibernate.ddl-auto` | `validate` (or `none`) | Hibernate must never alter production tables by itself |
| `spring.jpa.open-in-view` | `false` | No lazy database access during view rendering; avoids holding connections |
| Connection pool (HikariCP) | Small and explicit, e.g. `maximum-pool-size: 10` | The database has a connection limit shared by all instances |
| Credentials | Environment variables, dedicated role | Least privilege, no secrets in Git |

The Task API runs Flyway on start-up; the real log of its first start shows `Migrating schema "public" to version "1 - create tasks"` and, on later starts, `Schema "public" is up to date. No migration necessary.` Deeper: [Connection Pooling and HikariCP](../../../spring-boot/production/connection-pooling-hikaricp/content.md).

## Logging

- Log to the console (stdout); Docker collects it.
- Production level `INFO` for your code, `WARN` for noisy libraries; switch a package to `DEBUG` temporarily with an environment variable (`LOGGING_LEVEL_COM_EXAMPLE=DEBUG`) and a container restart.
- Never log passwords, tokens or full request bodies with personal data.
- Structured (JSON) logs help log tools: Spring Boot supports `logging.structured.format.console: ecs` (or `logstash`, `gelf`).

Deeper: [Logging with SLF4J and Logback](../../../spring-boot/production/spring-logging/content.md).

## Health Checks

Expose `/actuator/health` with the liveness and readiness groups, and nothing sensitive:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      probes:
        enabled: true
      group:
        readiness:
          include: readinessState,db
      show-details: never     # in application-prod.yml
```

By default the readiness group reflects only the application's own state — it stays `UP` even when the database is down. The Task API adds `db` to it, so `/actuator/health/readiness` means "started **and** the database answers", which is what deployment scripts and Docker health checks should poll. Liveness deliberately excludes the database: a database outage should not make Docker or an orchestrator restart a healthy application.

With PostgreSQL stopped, the running Task API answered:

**Output:**

```text
{"groups":["liveness","readiness"],"status":"DOWN"} [503]
{"status":"DOWN"} [503]
{"status":"UP"} [200]
```

(`/actuator/health`, `/readiness` and `/liveness`, with the HTTP status from `curl -w " [%{http_code}]\n"`.) Before `db` was added to the group, `/readiness` had answered `{"status":"UP"}` with the database down. After PostgreSQL was started again, readiness returned to `UP` without restarting the application.

## Error Handling

Clients must get a clear status and message — never a stack trace. Spring Boot's default error response already hides it. These are the Task API's real responses to a blank title, malformed JSON and an unknown path:

**Output (varies):**

```text
{"timestamp":"2026-10-08T10:05:35.945Z","status":400,"error":"Bad Request","path":"/api/tasks"}
{"timestamp":"2026-10-08T10:05:35.985Z","status":400,"error":"Bad Request","path":"/api/tasks"}
{"timestamp":"2026-10-08T10:05:36.024Z","status":404,"error":"Not Found","path":"/api/nope"}
```

Keep `server.error.include-stacktrace` at its default (`never`). For useful messages, add a `@RestControllerAdvice` that returns `ProblemDetail` responses with field errors ([Global Exception Handling](../../../spring-boot/exception-handling/global-exception-handling/content.md)), and log the full exception on the server side.

## CORS Basics

Browsers block a web page on one origin (`https://app.example.com`) from calling an API on another origin (`https://api.example.com`) unless the API allows it with CORS headers. Allow exactly your front-end origins — never `*` together with credentials:

```java
package com.example.taskapi;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    // Comma-separated list, e.g. APP_CORS_ALLOWED_ORIGINS=https://app.example.com
    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE");
    }
}
```

Started with `APP_CORS_ALLOWED_ORIGINS=https://app.example.com`, a preflight request from that origin is allowed:

**Output:**

```text
HTTP/1.1 200 
Vary: Access-Control-Request-Method
Vary: Access-Control-Request-Headers
Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Methods: GET,POST,PUT,DELETE
Access-Control-Max-Age: 1800
```

The same request with `Origin: https://evil.example` gets `HTTP/1.1 403` and the body `Invalid CORS request`. (Commands: `curl -s -i -X OPTIONS localhost:8080/api/tasks -H "Origin: …" -H "Access-Control-Request-Method: POST"`.) CORS protects users' browsers; it is not authentication — `curl` ignores it.

## Secure Configuration

| Item | Setting |
|------|---------|
| Actuator | Expose only `health,info`; details hidden |
| Behind Nginx | `server.forward-headers-strategy: native`, so redirects and logs use the client's scheme and IP from `X-Forwarded-*` |
| Container user | Non-root (`USER spring` in the Dockerfile) |
| Ports | App published on `127.0.0.1` only; HTTPS terminated at Nginx |
| Secrets | Environment variables from a protected `.env` |
| Dependencies | Keep Spring Boot on a supported version; rebuild images for security patches |

## JVM Configuration Basics

- The JVM reads the container memory limit. Default maximum heap = 25 % of it; `-XX:MaxRAMPercentage=75` (in the Dockerfile `ENTRYPOINT`) uses more of it while leaving room for non-heap memory.
- Give the container a memory limit that fits the server (`mem_limit` / `deploy.resources.limits.memory` in Compose) so one service cannot starve the others.
- Exit code 137 plus `OOMKilled: true` means the limit is too small or the application leaks memory.

## Graceful Shutdown

On `SIGTERM` (`docker stop`, `docker compose up -d` replacing a container), Spring Boot stops accepting new requests and waits for in-flight ones — graceful shutdown is the default since Spring Boot 3.4 (`server.shutdown: graceful`), with up to 30 seconds per shutdown phase (`spring.lifecycle.timeout-per-shutdown-phase`).

Conditions for it to work:

1. Java is PID 1 — exec-form `ENTRYPOINT`.
2. Docker waits long enough — Docker's default stop timeout is 10 seconds; if requests can take longer, raise `stop_grace_period` in Compose above Spring's timeout.

## Restart Policies

`restart: unless-stopped` on every long-running service: Docker restarts a crashed container and brings the stack back after a server reboot. A restart loop (`Restarting (1)` in `docker compose ps`) is a symptom to investigate, not a fix.

## Application Health Verification

After every deployment, verify from the outside in:

```bash
# Illustrative: on the server, then from your laptop
docker compose ps                                        # both services Up (healthy)
curl -fsS http://127.0.0.1:8080/actuator/health/readiness
curl -s http://127.0.0.1:8080/api/info                   # expected version (image tag) and profile
curl -fsS https://api.example.com/actuator/health        # through Nginx and HTTPS
docker compose logs --since 5m app | grep -E "ERROR|WARN"
```

## Production-Readiness Checklist

| ✓ | Item | Verify with |
|---|------|-------------|
| ☐ | `prod` profile active | Log line `profile is active: "prod"`, `/api/info` |
| ☐ | No secrets in Git, image or `application-prod.yml` | `git grep -i password`, review |
| ☐ | Schema managed by migrations; `ddl-auto: validate` | Flyway log on start-up |
| ☐ | Logs to stdout at INFO, no secrets logged | `docker compose logs app` |
| ☐ | Health with liveness/readiness; only `health,info` exposed | `curl …/actuator/health/readiness`, `curl …/actuator/env` → 404 |
| ☐ | No stack traces in error responses | `curl` a bad request |
| ☐ | CORS limited to real front-end origins | Preflight from another origin → 403 |
| ☐ | Non-root container, exec-form `ENTRYPOINT`, `MaxRAMPercentage` | `Dockerfile` review, `docker exec app id` |
| ☐ | Graceful shutdown completes within the stop timeout | `docker compose stop app` and read the logs |
| ☐ | `restart: unless-stopped` on every service | `compose.yaml` review |
| ☐ | Database backed up and restore tested | `pg_dump` / `pg_restore` run |

## Production Relevance

Every item above maps to a real incident class: schema drift, data leaks through errors, credential leaks, OOM kills, dropped requests during deployments, services that do not return after a reboot.

## Common Mistakes

- `ddl-auto: update` in production.
- `management.endpoints.web.exposure.include: "*"` on a public port.
- `allowedOrigins("*")` "to make the front end work".
- A fixed `-Xmx` equal to or larger than the container limit.
- Expecting graceful shutdown while the `ENTRYPOINT` is in shell form.

## Interview Angle

- Walk through your production-readiness checklist, briefly justifying each item.
- Explain graceful shutdown end to end: SIGTERM → stop accepting → finish in-flight → exit, and the Docker timeout.
- Explain what CORS protects and what it does not.

## Key Takeaways

- Production profile without secrets; migrations instead of `ddl-auto`; logs to stdout.
- Health with readiness for deployments; minimal Actuator exposure; no stack traces to clients.
- CORS for exact origins; non-root container; heap sized from the container limit.
- Graceful shutdown needs an exec-form `ENTRYPOINT` and a long enough stop timeout; `unless-stopped` brings services back after crashes and reboots.
