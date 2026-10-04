# Debugging Checklist

Symptom → likely causes → first things to check, for the 17 debugging scenarios. Full Problem → Cause → Diagnose → Fix → Prevention write-ups are in the Debugging module.

## General Approach

1. Read the **root cause** at the bottom of the stack trace (and Boot's "APPLICATION FAILED TO START" description).
2. Reproduce with the smallest input; turn on the relevant logger, not everything.
3. Check what Spring actually built: `/actuator/beans`, `/actuator/conditions`, `/actuator/env`, `/actuator/mappings`, `--debug`.
4. Ask "is this call going through a proxy?" for any annotation that "does nothing".
5. Fix the cause, then add a test that would have caught it.

## Beans and Injection

| Symptom | Likely causes | Check first |
|---------|---------------|-------------|
| `@Autowired` field is `null` | Object created with `new`; field read in the constructor; static field; class not a bean | Who created the object? Use constructor injection |
| Bean not detected (`NoSuchBeanDefinitionException`) | Class outside the scanned package; missing stereotype; `@Profile`/`@Conditional` not matched; excluded auto-config | Package of `@SpringBootApplication`; condition report |
| Multiple beans / unexpected instance | Two definitions (scan + `@Bean`); lite-mode `@Bean` calls; prototype scope; two contexts (parent/child, tests) | `/actuator/beans`; `proxyBeanMethods`; identity hash in logs |
| Circular dependency at startup | A ↔ B constructor injection; Boot forbids cycles | Cycle printed in the failure report; extract a third bean or use events |

## Startup and Configuration

| Symptom | Likely causes | Check first |
|---------|---------------|-------------|
| Application fails to start | Missing bean, bad property, port in use, DB unreachable, failed migration, `ddl-auto=validate` mismatch | The "Description/Action" block and root cause |
| Environment variable not applied | Wrong relaxed-binding name (`APP_MAIL_MAXSIZE`), set in another shell/container, overridden by a higher source, `@Value` key typo | `/actuator/env` shows the winning source |
| Profile not active | Not set where the process reads it; typo; set inside a profile-specific file; wrong file name `application-<profile>.yml` | Startup log "The following profiles are active" |

## Web Layer

| Symptom | Likely causes | Check first |
|---------|---------------|-------------|
| Validation not triggered | Missing `@Valid`; missing `spring-boot-starter-validation`; nested object without `@Valid`; method validation without `@Validated`; self-invocation | Starter on classpath; annotation on the parameter |
| `@ControllerAdvice` not catching | Exception thrown in a filter (security, CORS); advice outside scan / restricted by `basePackages`; a more specific handler wins; exception swallowed; `@Async` thread | Where is the exception thrown — before or inside `DispatcherServlet`? |

## Transactions and JPA

| Symptom | Likely causes | Check first |
|---------|---------------|-------------|
| `@Transactional` not working | Self-invocation; private/final method; object not a Spring bean; exception caught inside; checked exception; wrong transaction manager | `logging.level.org.springframework.transaction=trace`; is the caller another bean? |
| Unexpected rollback (`UnexpectedRollbackException`) | Inner REQUIRED method threw and outer caught it → rollback-only | Propagation of inner methods; use REQUIRES_NEW or don't catch |
| `LazyInitializationException` | Lazy association accessed after the transaction (in controller/serialiser), OSIV off | Where is the association touched? Fetch join / entity graph / DTO projection |
| N+1 queries | Lazy association accessed in a loop; EAGER mapping with JPQL; serialising entities | SQL log / statistics count; fix with fetch join, entity graph, batch size |
| Slow query | Missing index; N+1; huge result without paging; count query on `Page`; deep offset; pool waits; long transactions | `EXPLAIN ANALYZE`; Hikari pending-threads metric; SQL log timings |

## Security and CORS

| Symptom | Likely causes | Check first |
|---------|---------------|-------------|
| CORS fails in the browser | No `http.cors()` (preflight rejected with 401/403); origin mismatch (scheme/port); `*` with credentials; missing allowed header/method | Network tab: the `OPTIONS` response status and headers |
| JWT authentication fails (401) | Missing `Bearer ` prefix; expired; wrong secret/key between issuer and verifier; clock skew; filter not registered or after the wrong filter; path not matched | `logging.level.org.springframework.security=trace`; decode the token; check `exp` |
| `SecurityContext` has no authentication | Filter didn't set it; `permitAll` path; context cleared; reading on another thread (`@Async`); custom filter registered twice or outside the chain | Security trace log of the filter chain; `MODE_INHERITABLETHREADLOCAL` / `DelegatingSecurityContextExecutor` for async |
