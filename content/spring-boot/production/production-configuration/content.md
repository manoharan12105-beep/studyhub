# Production Configuration, Secrets and Graceful Shutdown

**Module:** Production Spring Boot · **Interview priority:** Frequently asked

## Definition

**Production configuration** is the set of settings, secrets and runtime behaviours that make a Spring Boot application safe, observable and operable outside a developer's laptop: values supplied per environment (**environment variables**, **profiles**), **secrets** kept out of source control, sensible server/database/logging settings, and **graceful shutdown** so deployments do not cut requests in half.

## Why It Matters

- Most production incidents come from configuration: a leaked secret, a debug flag left on, a wrong pool size, or requests killed during a rolling deploy.
- Interviewers ask how you manage environment-specific config and secrets and what happens when a pod is stopped.

## Environment Variables

The Twelve-Factor App principle: **config lives in the environment**, not in the build. The same JAR/image runs everywhere; only environment variables differ. Spring Boot maps them by relaxed binding (`SPRING_DATASOURCE_URL` → `spring.datasource.url`) — details in [Externalized Configuration](../../spring-boot-core/externalized-configuration/content.md).

```yaml
# docker-compose / Kubernetes env (illustrative)
SPRING_PROFILES_ACTIVE: prod
SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/shop
SPRING_DATASOURCE_USERNAME: shop_app
SPRING_DATASOURCE_PASSWORD: ${from the secret store}
APP_JWT_SECRET: ${from the secret store}
JAVA_TOOL_OPTIONS: -XX:MaxRAMPercentage=75
```

## Profiles

Use profiles for environment-specific **defaults** (`application-prod.yml`: pool sizes, log format, disabled dev features), and environment variables for **values that change per deployment or are secret**. See [Profiles](../../spring-boot-core/spring-profiles/content.md).

## Secrets Management Awareness

| Approach | Notes |
|----------|-------|
| Environment variables injected by the platform | Simple; visible to anyone who can inspect the process/pod spec |
| Kubernetes Secrets (as env vars or mounted files) | Base64 in etcd — enable encryption at rest and RBAC |
| Mounted files + `spring.config.import=configtree:/run/secrets/` | Each file becomes a property; avoids env var leakage |
| Secret managers: HashiCorp Vault, AWS Secrets Manager/Parameter Store, Azure Key Vault, GCP Secret Manager | Central, audited, rotation; Spring Cloud Vault / AWS integrations, or the platform injects them |

Rules: never commit secrets (use `.gitignore`, secret scanning), never log them, rotate them, give each environment and service its own credentials with least privilege (the app's DB user should not own the schema).

## Production Configuration

A checklist with typical properties:

```yaml
server:
  shutdown: graceful                       # default since Boot 3.4
  forward-headers-strategy: framework      # behind a load balancer/proxy (X-Forwarded-*)
  error:
    include-stacktrace: never              # defaults — do not loosen in prod
    include-message: never
spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s
  jpa:
    open-in-view: false
    hibernate:
      ddl-auto: validate                   # schema by Flyway/Liquibase
  datasource:
    hikari:
      maximum-pool-size: 20
      connection-timeout: 3000
  threads:
    virtual:
      enabled: true                        # Java 21+, if libraries are virtual-thread friendly
management:
  endpoints:
    web:
      exposure:
        include: health,info,prometheus
  endpoint:
    health:
      probes:
        enabled: true
logging:
  structured:
    format:
      console: ecs                         # JSON logs to stdout
```

Also: HTTPS terminated at the load balancer (HSTS), CORS restricted to real origins, Actuator secured, DevTools absent, JVM memory sized for the container (`-XX:MaxRAMPercentage`), timeouts on every outbound HTTP client, and database migrations run before (or during) deployment.

## Graceful Shutdown Awareness

When a container is stopped (rolling deploy, scale-in), the platform sends **SIGTERM**, waits a grace period, then sends **SIGKILL**.

```text
SIGTERM
  └─► JVM shutdown hook → Spring context close begins
        1. Readiness → REFUSING_TRAFFIC (load balancer stops sending new requests)
        2. Web server stops accepting new connections
        3. In-flight requests finish (up to spring.lifecycle.timeout-per-shutdown-phase, default 30 s)
        4. Beans destroyed: @PreDestroy, connection pools closed, executors shut down
  process exits
```

- `server.shutdown=graceful` is the default since Spring Boot 3.4 (earlier versions defaulted to `immediate`).
- The platform's grace period (Kubernetes `terminationGracePeriodSeconds`, default 30 s) must exceed Spring's shutdown timeout.
- In Kubernetes, a short `preStop` sleep (a few seconds) helps because endpoint removal propagates asynchronously — otherwise some requests still arrive after shutdown starts.
- Long-running work (`@Async` tasks, consumers, scheduled jobs) needs its own shutdown handling (`setWaitForTasksToCompleteOnShutdown`, idempotent jobs that can be resumed).

## Common Mistakes

- Secrets in `application.properties`, Docker images or Git history.
- `ddl-auto=update`, `show-sql=true`, DEBUG logging or DevTools in production.
- Actuator `*` exposure without security.
- No graceful shutdown or a platform grace period shorter than in-flight request time.
- Different builds per environment instead of one artifact with external config.

## Common Interview Traps

- **"Profiles are for secrets."** Profiles select configuration sets; secrets should come from the environment or a secret manager, not from profile files in Git.
- **"Kubernetes Secrets are encrypted."** By default they are only Base64-encoded in etcd unless encryption at rest is configured.
- **"Stopping the app kills in-flight requests."** Not with graceful shutdown configured and adequate grace periods.

## Key Takeaways

- One artifact, config from the environment; profiles for environment defaults.
- Secrets from a secret store or platform secrets — never in Git or logs.
- Production checklist: validate schema, OSIV off, secure Actuator, JSON logs, timeouts, sized pools.
- Graceful shutdown: SIGTERM → stop traffic → finish requests → close resources; align timeouts with the platform.
