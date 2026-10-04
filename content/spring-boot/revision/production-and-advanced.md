# Production and Advanced Spring

Revision points for logging, Actuator, production configuration, connection pooling, caching, async work, uploads, OpenAPI, Docker, AOP, proxies, events, resilience and microservices awareness.

## Logging

- SLF4J API + Logback by default; `private static final Logger log = LoggerFactory.getLogger(X.class)`.
- Levels TRACE < DEBUG < INFO < WARN < ERROR; set per package: `logging.level.com.example=debug`.
- Parameterised messages `log.info("Order {} placed", id)`; pass the exception as last argument.
- Structured JSON logs: `logging.structured.format.console=ecs|logstash|gelf`.
- MDC for correlation/trace ids (Micrometer Tracing fills `traceId`/`spanId`).
- Never log passwords, tokens or full personal data.

## Actuator and Monitoring

- `spring-boot-starter-actuator`: `/actuator/health`, `info`, `metrics`, `prometheus`, `loggers`, `env`, `conditions`, `beans`, `threaddump`, `heapdump`.
- Only `health` is exposed over HTTP by default; expose explicitly with `management.endpoints.web.exposure.include`.
- Secure sensitive endpoints; consider a separate `management.server.port`.
- Liveness vs readiness probes (`/actuator/health/liveness`, `/readiness`) for Kubernetes.
- Custom `HealthIndicator` (Boot 4 package `org.springframework.boot.health.contributor`); custom metrics via `MeterRegistry`.
- Micrometer → Prometheus/Grafana; tracing → OpenTelemetry/Zipkin.

## Production Configuration

- Config from environment/secret managers; no secrets in Git or images.
- `ddl-auto=validate` + Flyway/Liquibase migrations.
- `open-in-view=false`; hide error details (`server.error.include-message/stacktrace=never`).
- Timeouts everywhere (HTTP clients, DB, transactions).
- Graceful shutdown (default) with `spring.lifecycle.timeout-per-shutdown-phase`.
- `server.forward-headers-strategy=framework` behind proxies; compression; HTTP/2.
- Virtual threads: `spring.threads.virtual.enabled=true` (JDK 21).

## Connection Pooling (HikariCP)

- Opening DB connections is expensive → pool reuses them; HikariCP is Boot's default.
- Key settings: `maximum-pool-size` (default 10), `minimum-idle`, `connection-timeout` (default 30 s wait), `max-lifetime`, `idle-timeout`, `leak-detection-threshold`.
- Pool exhaustion = all connections busy → `SQLTransientConnectionException` after the timeout.
- Causes: long transactions, remote calls inside transactions, leaks, too many threads; fix those before raising the size.
- Total connections = pool size × instances ≤ database limit.
- Bigger pool ≠ faster; small pools near CPU-core-based sizes often perform best.

## Caching and Redis

- Cache read-heavy, rarely changing, expensive data; never cache without an invalidation/TTL plan.
- Local (Caffeine): fastest, per instance, inconsistent across instances. Distributed (Redis): shared, network hop, serialisation.
- Redis also for sessions, rate limiting, distributed locks.
- Patterns: cache-aside (default), write-through, write-behind.
- Problems: stale data, stampede (lock / early refresh), penetration (cache nulls), large objects.
- Set TTLs (`spring.cache.redis.time-to-live`); serialise as JSON, not Java serialisation.

## Async and Scheduling

- `@EnableAsync` + `@Async` → method runs on a task executor; return `void` or `CompletableFuture<T>`.
- Proxy-based: self-invocation runs synchronously.
- Boot auto-configures `ThreadPoolTaskExecutor` (or virtual threads when enabled); size the queue; exceptions in `void` methods go to `AsyncUncaughtExceptionHandler`.
- `@EnableScheduling` + `@Scheduled(fixedRate|fixedDelay|cron)`; scheduler pool size **1** by default.
- Multiple instances run every schedule → use ShedLock/DB locks or a single scheduler.
- `SecurityContext` and transactions don't propagate to async threads automatically.

## File Upload

- `MultipartFile` with `@RequestParam` or `@RequestPart` (file + JSON metadata).
- Limits: `spring.servlet.multipart.max-file-size` (default 1MB), `max-request-size` (10MB); exceeding → `MaxUploadSizeExceededException` → 413.
- Never trust the client file name (path traversal) or content type; check magic bytes; generate names.
- Store files in object storage, metadata in the DB; stream large files; scan for malware.
- Download with `ResponseEntity<Resource>` + `Content-Disposition`.

## OpenAPI Documentation

- springdoc-openapi generates an OpenAPI 3 spec (`/v3/api-docs`) and Swagger UI from controllers.
- Enrich with `@Operation`, `@ApiResponse`, `@Schema`, `@Parameter`, `@Tag`; security schemes for bearer auth.
- Spec-first (write the YAML, generate code) vs code-first (generate spec from code).
- Disable or protect Swagger UI in production if the API is private.
- Generated clients and contract tests keep consumers in sync.

## Docker and Deployment

- Multi-stage build or Buildpacks (`spring-boot:build-image`); JRE base image; run as non-root.
- Layered JARs (`java -Djarmode=tools -jar app.jar extract --layers`) → better image caching.
- Container-aware JVM: `-XX:MaxRAMPercentage=75`.
- Configure via env vars; health probes for orchestrators; graceful shutdown on SIGTERM.
- One process per container; logs to stdout.
- CI: test → build image → scan → push → deploy (rolling/blue-green).

## AOP

- Cross-cutting concerns (logging, transactions, security, metrics) separated into **aspects**.
- Terms: aspect, advice (`@Before`, `@AfterReturning`, `@AfterThrowing`, `@After`, `@Around`), pointcut (`execution(* com.x.service.*.*(..))`, `@annotation(...)`), join point (method execution in Spring AOP), weaving.
- Spring AOP = runtime proxies, method executions on Spring beans only; AspectJ = compile/load-time weaving, fields/constructors too.
- `@Around` must call `proceed()` and return its result.
- Starter: `spring-boot-starter-aspectj` (Boot 4).

## Proxies

- JDK dynamic proxy (implements interfaces) vs CGLIB (subclass); Boot defaults to CGLIB (`proxyTargetClass=true`).
- Powering: `@Transactional`, `@Async`, `@Cacheable`, `@PreAuthorize`, `@Retryable`, `@Configuration` (full mode), scoped proxies.
- Calls through the proxy get advice; `this.method()` calls don't.
- Final classes/methods can't be CGLIB-proxied; private methods are never advised.
- Proxy fields are uninitialised — read state through methods.
- Fixes for self-invocation: split into another bean, inject self lazily, or programmatic API (`TransactionTemplate`).

## Spring Events

- `ApplicationEventPublisher.publishEvent(obj)` + `@EventListener` methods; synchronous on the caller's thread by default.
- Decouple side effects (emails, audits) from core logic within one application.
- `@TransactionalEventListener(phase = AFTER_COMMIT)` runs only after successful commit (not on rollback).
- `@Async` listeners for non-blocking side effects; `@Order` for ordering; conditions via SpEL.
- Events are in-memory — lost on crash; use an outbox/broker for durability.
- Boot lifecycle events: `ApplicationStartedEvent`, `ApplicationReadyEvent`, `ContextClosedEvent`.

## Cache Abstraction

- `@EnableCaching` + `@Cacheable("products")` (skip method on hit), `@CachePut` (always run, update), `@CacheEvict` (remove; `allEntries`, `beforeInvocation`), `@Caching`.
- Default key from parameters (`SimpleKey`); custom with SpEL `key = "#id"`; `condition`/`unless`.
- Providers: simple `ConcurrentMap` (default), Caffeine, Redis, JCache.
- Proxy-based: self-invocation bypasses caching.
- Cache DTOs (immutable), not managed entities.

## Resilience Patterns

- Timeouts (always), retries (with backoff + jitter, idempotent operations only), circuit breaker (stop calling a failing dependency), bulkhead (limit concurrency), rate limiter, fallback.
- Framework 7: `@EnableResilientMethods` + `@Retryable(maxRetries=…, delay, multiplier)` and `@ConcurrencyLimit`; `maxRetries=2` = 3 attempts, then the last exception is rethrown.
- Resilience4j for circuit breakers (CLOSED → OPEN → HALF_OPEN).
- Retries + no timeout = worse outage; retries at every layer multiply load.

## Microservices (Awareness)

- Independently deployable services owning their data; communicate via HTTP/gRPC or messaging.
- Benefits: independent scaling/deployment, team autonomy. Costs: network failures, distributed data, observability, ops complexity.
- Patterns: API gateway, service discovery, config server, circuit breaker, saga + outbox, distributed tracing.
- Spring Cloud provides Gateway, Config, OpenFeign, LoadBalancer.
- Start with a modular monolith; split when a real need appears.
