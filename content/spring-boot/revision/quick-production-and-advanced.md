# Production and Advanced Essentials

One line per topic for running Spring Boot in production and for the advanced mechanisms.

## Production

- **Logging** — SLF4J + Logback; per-package levels; `{}` placeholders; JSON logs; MDC trace ids; never log secrets.
- **Actuator** — health (only one exposed by default), metrics, prometheus, liveness/readiness probes; secure the rest.
- **Production config** — env/secret-manager config, Flyway + `ddl-auto=validate`, OSIV off, hidden error details, timeouts, graceful shutdown.
- **HikariCP** — default pool 10, 30 s connection timeout; exhaustion from long transactions/leaks; total ≤ DB limit.
- **Caching / Redis** — cache-aside with TTLs; local (Caffeine) vs distributed (Redis); stale data, stampede, penetration.
- **Async / scheduling** — `@EnableAsync` + `@Async` (`CompletableFuture`); `@Scheduled` pool size 1; locks for multi-instance jobs.
- **File upload** — `MultipartFile`; 1MB/10MB defaults → 413; don't trust names or content type; object storage.
- **OpenAPI** — springdoc generates `/v3/api-docs` + Swagger UI; `@Operation`, `@Schema`; protect in production.
- **Docker** — multi-stage or Buildpacks, layered JAR, JRE base, non-root, env config, probes, `MaxRAMPercentage`.

## Advanced

- **AOP** — aspects with advice (`@Before`, `@Around`…) at pointcuts; Spring AOP = runtime proxies, method executions only.
- **Proxies** — CGLIB by default in Boot; power `@Transactional`/`@Async`/`@Cacheable`/`@PreAuthorize`; self-calls bypass; fields are null on the proxy.
- **Events** — `publishEvent` + `@EventListener`, synchronous by default; `@TransactionalEventListener(AFTER_COMMIT)` for side effects.
- **Cache abstraction** — `@Cacheable` skip on hit, `@CachePut` always run, `@CacheEvict` remove; key = parameters; proxy-based.
- **Resilience** — timeouts, retries with backoff, circuit breaker, bulkhead, rate limit; Framework 7 `@Retryable(maxRetries)` + `@ConcurrencyLimit`.
- **Microservices** — independent deployables owning data; gateway, discovery, config, saga + outbox, tracing; start modular monolith.
