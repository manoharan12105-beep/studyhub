# Comparison Tables

The comparisons interviewers ask most often, side by side. Each row is a difference worth saying out loud.

## Spring vs Spring Boot

| Aspect | Spring Framework | Spring Boot |
|--------|------------------|-------------|
| What it is | Application framework: IoC container, AOP, MVC, transactions, data access | Opinionated layer on top of Spring |
| Configuration | You configure every piece (beans, data source, MVC, server) | Auto-configuration with sensible defaults; override what you need |
| Dependencies | Choose and align library versions yourself | Starters + managed versions (BOM) |
| Server | Deploy a WAR to an external server | Embedded Tomcat/Jetty; runnable JAR |
| Production features | Build yourself | Actuator: health, metrics, probes |
| Relationship | The foundation | Uses Spring — does not replace it |

## IoC vs DI

| Aspect | Inversion of Control | Dependency Injection |
|--------|---------------------|----------------------|
| Kind | Principle: the framework controls flow and object creation | Technique: dependencies are supplied from outside |
| Scope | Broader — also callbacks, templates, event listeners | One way to achieve IoC |
| In Spring | The container creates and manages beans | Constructor, setter or field injection |
| Benefit | Framework handles plumbing | Loose coupling, easy testing with fakes |

## BeanFactory vs ApplicationContext

| Aspect | BeanFactory | ApplicationContext |
|--------|-------------|--------------------|
| Role | Basic DI container | Full container used in practice (extends `BeanFactory`) |
| Singleton creation | Lazy (on first `getBean`) | Eager at startup → errors found early |
| Post-processors | Must be registered manually | Detected and registered automatically |
| Extras | — | Events, `MessageSource` (i18n), resource loading, `Environment`/profiles |
| Use | Rare, very constrained environments | Always (Spring Boot creates one) |

## @Component vs @Service vs @Repository vs @Controller

| Annotation | Layer | Extra behaviour |
|------------|-------|-----------------|
| `@Component` | Any generic bean | None — base stereotype |
| `@Service` | Business logic | None today; documents intent, usable in pointcuts |
| `@Repository` | Data access | Exception translation to `DataAccessException` (with the post-processor Boot registers) |
| `@Controller` / `@RestController` | Web | Detected as handler; `@RestController` adds `@ResponseBody` |

All are detected by component scanning; the choice is about intent and the extra behaviour above.

## Constructor vs Setter vs Field Injection

| Aspect | Constructor | Setter | Field |
|--------|-------------|--------|-------|
| Required dependencies | Enforced — object cannot exist without them | Not enforced | Not enforced |
| `final` / immutability | Yes | No | No |
| Testing without Spring | `new Service(fake)` | Call setters | Needs reflection or Spring |
| Visibility of dependencies | Explicit in the signature | Moderately | Hidden |
| Circular dependency | Fails fast at startup | Possible (Boot still forbids by default) | Possible (Boot still forbids by default) |
| Use for | Default choice | Optional / reconfigurable deps | Tests only, if at all |

## @Primary vs @Qualifier

| Aspect | `@Primary` | `@Qualifier` |
|--------|------------|--------------|
| Placed on | The bean (definition side) | Injection point (and optionally the bean) |
| Meaning | "Default when several candidates match" | "I want exactly this one" |
| Scope | Global default for that type | Per injection point |
| Precedence | Beats parameter-name matching | Beats `@Primary` |
| Typical use | Main `DataSource`, default implementation | Choose a specific implementation |

## JPA vs Hibernate vs Spring Data JPA

| Aspect | JPA | Hibernate | Spring Data JPA |
|--------|-----|-----------|-----------------|
| What | Specification (Jakarta Persistence) | ORM implementing JPA (+ extras) | Repository abstraction over JPA |
| Provides | Annotations, `EntityManager`, JPQL, lifecycle rules | SQL generation, dirty checking, caching, proxies, HQL | `JpaRepository`, derived queries, paging, projections, specifications |
| Code you write | Entities + `EntityManager` calls | Same (or Hibernate `Session` APIs) | Repository interfaces only |
| Can run alone | No (needs a provider) | Yes | No (needs a JPA provider) |

## LAZY vs EAGER

| Aspect | LAZY | EAGER |
|--------|------|-------|
| Loading | On first access (proxy / collection wrapper) | Immediately with the owner |
| Default for | `@OneToMany`, `@ManyToMany` | `@ManyToOne`, `@OneToOne` |
| Risk | `LazyInitializationException` outside the session; N+1 if accessed in loops | Loads unneeded data always; can still cause N+1; cannot be made lazy per query |
| Recommendation | Default for all associations | Avoid; fetch per use case with `JOIN FETCH` / entity graphs |

## Cascade vs orphanRemoval

| Aspect | `cascade = REMOVE` (or `ALL`) | `orphanRemoval = true` |
|--------|------------------------------|------------------------|
| Trigger | Parent entity is removed | Child is removed from the parent's collection (or reference set to null) |
| Effect | Children deleted with the parent | Orphaned child deleted, parent stays |
| Other operations | Cascade also covers PERSIST, MERGE, DETACH, REFRESH | Only deletion of orphans |
| Use | Parent owns child lifecycle | Child cannot exist without its parent |

## save vs saveAndFlush

| Aspect | `save` | `saveAndFlush` |
|--------|--------|----------------|
| SQL timing | Usually deferred to flush/commit (immediate INSERT only for IDENTITY ids) | Flushes the persistence context immediately |
| Constraint errors | Surface at commit | Surface at the call |
| Commit | No | No — the transaction still decides |
| Cost | Allows batching | Extra flush; defeats batching |
| Use | Default | When later native SQL / triggers need the row, or to catch a constraint violation at that point |

## JPQL vs Native Query

| Aspect | JPQL | Native SQL |
|--------|------|-----------|
| Operates on | Entities and fields | Tables and columns |
| Portability | Database-independent | Database-specific |
| Validation | Parsed at startup in `@Query` | Not validated until execution |
| Features | Fetch joins, polymorphism, managed results | Window functions, CTEs, vendor features, hints |
| Result | Managed entities / DTOs | Entities, projections or scalars |
| Use | Default | When JPQL cannot express the query or for tuned SQL |

## PUT vs PATCH

| Aspect | PUT | PATCH |
|--------|-----|-------|
| Semantics | Replace the whole resource with the representation | Apply a partial change |
| Body | Complete resource | Only changed fields (JSON Merge Patch / JSON Patch) |
| Idempotent | Yes | Not guaranteed (e.g. "increment") |
| Missing fields | Treated as cleared/defaulted | Left unchanged |
| Can create | Yes, at a client-chosen URI | Typically no |

## Authentication vs Authorization

| Aspect | Authentication | Authorization |
|--------|----------------|---------------|
| Question | Who are you? | What may you do? |
| Happens | First | After authentication |
| Spring components | `AuthenticationManager`, providers, `UserDetailsService`, JWT filter | `AuthorizationFilter`, `authorizeHttpRequests`, `@PreAuthorize` |
| Failure | 401 Unauthorized | 403 Forbidden |
| Data | Credentials, tokens | Roles, authorities, ownership |

## 401 vs 403

| Aspect | 401 Unauthorized | 403 Forbidden |
|--------|------------------|---------------|
| Meaning | Not authenticated (missing, invalid or expired credentials) | Authenticated but not allowed |
| Client action | Log in / refresh the token and retry | Retrying won't help without different permissions |
| Header | `WWW-Authenticate` | — |
| Spring | `AuthenticationEntryPoint` | `AccessDeniedHandler` |

## CORS vs CSRF

| Aspect | CORS | CSRF |
|--------|------|------|
| What | Browser mechanism letting a server allow cross-origin reads | Attack: forged state-changing request using the victim's cookies |
| Protects | Relaxes the same-origin policy safely | Users from unwanted actions |
| Who enforces | The browser, using response headers | The server, by checking a token |
| Spring | `CorsConfigurationSource` + `http.cors()` | `CsrfFilter` (enabled by default) |
| Relevant when | Frontend on another origin calls your API | Authentication is carried by cookies |

CORS is not CSRF protection: a cross-site form POST is sent without a preflight.

## Session vs JWT

| Aspect | Server session | JWT |
|--------|----------------|-----|
| State | Server stores the security context | Self-contained token; server stateless |
| Sent as | `JSESSIONID` cookie | `Authorization: Bearer` header (or cookie) |
| Scaling | Sticky sessions or shared store (Redis) | Any instance can validate |
| Logout / revocation | Invalidate the session — immediate | Hard: wait for expiry or keep a deny list |
| CSRF | Needs protection (cookies) | Not needed with header tokens |
| Fits | Server-rendered apps, BFF | APIs, mobile, service-to-service |

## Access Token vs Refresh Token

| Aspect | Access token | Refresh token |
|--------|--------------|---------------|
| Purpose | Call APIs | Get new access tokens |
| Lifetime | Short (minutes) | Long (days/weeks) |
| Sent to | Every API request | Only the refresh endpoint |
| Format | Often JWT (stateless validation) | Usually opaque, stored hashed server-side |
| Revocation | Expires quickly | Revocable; rotated on every use |
| Storage (browser) | Memory | HttpOnly Secure SameSite cookie |

## Optimistic vs Pessimistic Locking

| Aspect | Optimistic | Pessimistic |
|--------|-----------|-------------|
| Assumption | Conflicts are rare | Conflicts are likely |
| Mechanism | `@Version` checked in UPDATE … WHERE version = ? | `SELECT … FOR UPDATE` (`@Lock(PESSIMISTIC_WRITE)`) |
| Blocking | None; loser gets an exception | Others wait |
| On conflict | `OptimisticLockException` → retry or 409 | Waits; possible timeouts/deadlocks |
| Fits | Web apps, long user think time | Hot rows, short critical sections (stock, balances) |

## Monolith vs Microservices

| Aspect | Monolith (modular) | Microservices |
|--------|--------------------|---------------|
| Deployment | One unit | Many independent units |
| Data | One database, local transactions | Database per service, sagas, eventual consistency |
| Communication | In-process calls | Network (HTTP/gRPC/messaging) |
| Scaling | Whole app | Per service |
| Operations | Simple | Complex: discovery, tracing, gateways, CI/CD per service |
| Fits | Most new projects and small teams | Large orgs, independent teams, different scaling needs |

## Filter vs Interceptor

| Aspect | Servlet Filter | `HandlerInterceptor` |
|--------|----------------|----------------------|
| Level | Servlet container, before `DispatcherServlet` | Spring MVC, around handler execution |
| Sees | All requests (static, errors), raw request/response | Only requests mapped to handlers; knows the handler method |
| Hooks | `doFilter` (before/after chain) | `preHandle`, `postHandle`, `afterCompletion` |
| Can wrap request/response | Yes | No |
| Exceptions reach `@ControllerAdvice` | No | Yes (from `preHandle`/handler) |
| Use | Security, CORS, logging, request ids | Handler-aware auth checks, timing, locale |

## Checked vs Unchecked Exceptions (in Spring)

| Aspect | Checked (`Exception`) | Unchecked (`RuntimeException`) |
|--------|----------------------|--------------------------------|
| Compiler | Must be declared or caught | No requirement |
| `@Transactional` default | **Commits** | **Rolls back** |
| Change behaviour | `rollbackFor = X.class` | `noRollbackFor = X.class` |
| Spring style | Wrapped/translated (e.g. `SQLException` → `DataAccessException`) | Preferred for domain and data access exceptions |
| Handling | `@ExceptionHandler` works for both | Same |
