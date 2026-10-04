# Common Interview Traps

The wrong answers interviewers listen for, grouped by module. Each line is the trap, then the precise answer.

## Spring Fundamentals

- "Spring and Spring Boot are the same" → Spring is the framework; Boot configures and packages it.
- "Any object in the app is a bean" → only container-managed objects; DTOs and entities are not beans.
- "Singleton bean = Singleton pattern" → one instance per bean definition per container, not per JVM.
- "Spring singletons are thread-safe" → only if stateless or synchronised; Spring adds no thread safety.
- "`@PostConstruct` runs before injection" → after all injection; that is its purpose.
- "Destroy callbacks run for every bean" → never for prototypes.
- "Calling a `@Bean` method always creates a new object" → not in full-mode `@Configuration`; yes in lite mode.
- "`@Service`, `@Repository`, `@Component` are identical" → `@Repository` adds exception translation.

## Dependency Injection

- "IoC and DI are the same" → DI is one way to achieve IoC.
- "Spring autowires by name" → by type; names only break ties.
- "`@Autowired` is required on constructors" → not for a single constructor.
- "`@Primary` and `@Qualifier` together fail" → `@Qualifier` wins at that injection point.
- "Field injection is bad because it's slow" → it's about testability, immutability and hidden dependencies.
- "Spring always resolves circular dependencies" → never constructor cycles; Boot forbids all cycles by default.
- "`@Lazy` fixes a cycle" → it hides it; redesign instead.

## Spring Boot Core

- "Auto-configuration overrides my beans" → it backs off when your bean exists (`@ConditionalOnMissingBean`).
- "A starter contains auto-configuration" → a starter is only a dependency set.
- "`@SpringBootApplication` scans the whole classpath" → its own package and sub-packages only.
- "`application.yml` beats environment variables" → environment variables win.
- "Profile files replace `application.yml`" → they are layered on top and override only their keys.
- "No active profile means no profile" → `default` is active.
- "Boot means microservices" / "Boot generates code" → neither.
- "Runners run before the server starts" → in a servlet app the server is already started.

## Spring MVC

- "Each controller is a servlet" → one `DispatcherServlet` delegates to controller beans.
- "Interceptors run before filters" → filters wrap the whole `DispatcherServlet`.
- "Spring Security uses interceptors" → it is a servlet filter chain (+ AOP for method security).
- "`postHandle` always runs" → not when the handler throws; `afterCompletion` does.
- "`@ResponseBody` means JSON" → it means "write as body"; content negotiation picks the format.
- "Validation happens in the service" → `@Valid` runs during argument resolution, before the controller body.

## REST

- "REST = JSON over HTTP" → REST is an architectural style with constraints.
- "Stateless means no data on the server" → no client session state between requests.
- "DELETE isn't idempotent because the second call returns 404" → idempotency is about state, not status.
- "PATCH is idempotent like PUT" → not by definition.
- "401 means no permission" → 401 = not authenticated; 403 = not allowed.
- "Spring pages start at 1" → zero-based by default.
- "Adding a response field needs a new version" → not if clients ignore unknown fields.

## Validation

- "`@NotEmpty` rejects `"   "`" → only `@NotBlank` does.
- "`@Size(min = 1)` makes a field required" → `null` passes; add `@NotNull`.
- "Nested objects validate automatically" → only with `@Valid` on the field.
- "`@Valid` and `@Validated` are interchangeable" → `@Validated` has groups and enables method validation; `@Valid` cascades.
- "All validation failures are 400" → `ConstraintViolationException` from method validation is 500 unless mapped.

## Exception Handling

- "`@ControllerAdvice` catches every exception" → only those during handler processing — not filters, `@Async` or scheduled jobs.
- "A global handler overrides a controller's own `@ExceptionHandler`" → the controller-local handler wins.
- "Spring rolls back on any exception" → unchecked only, by default.
- "A catch-all `Exception` handler is harmless" → it can turn `AccessDeniedException` from `@PreAuthorize` into 500.
- "Whitelabel page means the app crashed" → an unhandled error rendered by Boot's fallback.

## JPA and Hibernate

- "JPA is a framework" → a specification; Hibernate implements it.
- "Without `save()` changes are lost" → managed entities are saved by dirty checking at flush.
- "Flush commits" → flush sends SQL; commit makes it permanent.
- "`merge` attaches the object you pass" → it returns a different managed copy.
- "`@OneToMany` owns the relationship" → the FK side (`@ManyToOne`) owns it; `mappedBy` marks the inverse.
- "EAGER prevents N+1" → EAGER can still issue one query per row.
- "`AUTO` means auto-increment" → a sequence in Hibernate 6+ for numeric ids.
- "Optimistic locking locks rows" → it detects conflicts; locks nothing.
- "JPQL uses table names" → entity and field names.

## Transactions

- "Checked exceptions roll back" → they commit unless `rollbackFor`.
- "Every `@Transactional` method commits on return" → only the one that started the physical transaction.
- "Catching the inner exception saves the outer transaction" → with REQUIRED it's already rollback-only → `UnexpectedRollbackException`.
- "REQUIRES_NEW is nested" → it's independent; NESTED uses a savepoint.
- "`@Transactional` works on private methods / self-calls" → not through proxies.
- "`@Transactional` prevents lost updates" → not at READ COMMITTED; use versioning, locks or atomic SQL.
- "`readOnly=true` is a security guard" → a hint (no flush, possible driver optimisations).
- "Default isolation is REPEATABLE READ" → depends on the database.

## Security and JWT

- "Authentication and authorization are the same" → identity (401) vs permission (403).
- "`UserDetailsService` authenticates" → it loads users; the provider checks passwords.
- "BCrypt is encryption" → one-way, salted, slow hash.
- "Different BCrypt hashes for one password = bug" → random salt by design.
- "JWT payload is encrypted" → Base64URL-encoded; signature only protects integrity.
- "Invalid JWT → 403" → 401.
- "Logout deletes the JWT" → revoke refresh tokens; access tokens expire.
- "OAuth2 is authentication" → authorization; OIDC adds authentication.
- "Roles and authorities are different types" → roles are authorities prefixed `ROLE_`.

## CORS, CSRF and Cookies

- "CORS protects my API" → it protects browser users; curl and servers ignore it.
- "A CORS error means the server failed" → the browser blocked reading; the request may have run.
- "CORS and CSRF are the same" → CORS permits cross-origin reads; CSRF is an attack on cookie auth.
- "JWT APIs are immune to CSRF" → only when the token is in a header.
- "`HttpOnly` prevents XSS" → it prevents cookie theft by JavaScript.
- "`Secure` encrypts the cookie" → HTTPS-only transport.
- "`allowedOrigins("*")` with credentials works" → invalid; list origins.

## Production

- "Actuator exposes everything" → only `health` over HTTP by default.
- "Liveness = readiness" → liveness failure restarts; readiness failure stops traffic.
- "More DB connections = more throughput" → beyond DB capacity it gets slower.
- "Closing a pooled connection closes it" → returns it to the pool.
- "Caching always helps" → it adds consistency problems; measure first.
- "`fixedRate` = `fixedDelay`" → start-to-start vs end-to-start.
- "Spring cron has five fields" → six (seconds first).
- "Content-Type tells you the uploaded file type" → the client controls it.
- "SLF4J is a logging framework" → a facade; Logback logs.

## Advanced

- "Spring AOP is AspectJ" → AspectJ syntax, proxy implementation; method execution only.
- "`@After` runs only on success" → success or exception; `@AfterReturning` is success-only.
- "Boot uses JDK proxies for interfaces" → Boot defaults to CGLIB.
- "CGLIB handles self-calls" → the proxy delegates to a separate target; `this` bypasses it.
- "Spring events are async" → synchronous by default, same thread and transaction.
- "`@CachePut` reads from the cache" → it always runs the method and updates the cache.
- "Retry fixes failures" → only transient ones; use timeouts and circuit breakers too.
- "Microservices are always better" → they trade code complexity for operational complexity.
