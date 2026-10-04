# Spring Boot Scenario and Debugging Questions — Interview Questions

## Beginner

### Q1. An endpoint returns 500 for a missing product instead of 404. How do you fix it?

**Style:** Debugging

<details>
<summary>Answer</summary>

The service probably throws a generic exception (or `NoSuchElementException` from `Optional.get()`) that nothing maps. Throw a `ResourceNotFoundException` and map it to 404 in the `@RestControllerAdvice` (ProblemDetail), and use `orElseThrow(() -> new ResourceNotFoundException(...))` instead of `get()`.

</details>

### Q2. After deployment, every request to `/api/**` returns 401, including login. What do you check?

**Style:** Debugging

<details>
<summary>Answer</summary>

The security rules: is `/api/auth/login` `permitAll()` and placed before the broader rule? Is the correct `SecurityFilterChain` matched (multiple chains, `securityMatcher`, `@Order`)? Did a context path or path change break the matcher? Spring Security TRACE logs show the chain and the denying rule.

</details>

### Q3. A new column was added to an entity, and the application fails at startup in production but not locally. Why?

**Style:** Scenario

<details>
<summary>Answer</summary>

Locally `ddl-auto=update` (or `create`) added the column; production uses `validate` with Flyway, and no migration was written, so schema validation fails ("missing column"). Add a Flyway migration and keep local environments on migrations too.

</details>

## Intermediate

### Q4. Users occasionally see another user's name on their profile page. Where do you look?

**Style:** Debugging

<details>
<summary>Answer</summary>

Shared mutable state: a singleton bean storing the current user in a field, a `@Cacheable` method whose key does not include the user, a static variable, a `ThreadLocal`/MDC not cleared in pooled threads, or a CDN caching personalised responses without `Cache-Control: private`. Reproduce with concurrent requests and inspect those suspects.

</details>

### Q5. Customers are sometimes charged twice for one order. How do you investigate and fix it?

**Style:** Scenario

<details>
<summary>Answer</summary>

Check logs/traces for duplicate payment calls with the same order: client double-submits, retries after timeouts (client, gateway or `@Retryable`) on a non-idempotent POST, or webhook redelivery processed twice. Fix with idempotency keys on order/payment creation (unique constraint), pass the order id as the payment provider's idempotency key, make webhook handling idempotent, and disable automatic retries of non-idempotent calls.

</details>

### Q6. Response times rise from 100 ms to 5 s at peak while CPU stays low. What could it be?

**Style:** Debugging

<details>
<summary>Answer</summary>

Waiting rather than computing: connection pool exhaustion (`hikaricp.connections.pending` > 0, long acquire times), database locks, slow downstream calls without timeouts, Tomcat thread pool saturation, or a single-threaded executor. Check Actuator metrics, thread dumps (threads blocked in `HikariPool.getConnection` or socket reads), slow-query logs and traces.

</details>

### Q7. An `@Async` email method sometimes sends emails for orders that do not exist. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

The async task is triggered inside the transaction and runs before (or regardless of) the commit; if the transaction rolls back, the email is still sent — or the task can't find the uncommitted order. Publish an event and send the email from an `@TransactionalEventListener(phase = AFTER_COMMIT)` (async if needed), or use an outbox.

</details>

### Q8. A scheduled job processes each record twice after scaling to two pods. Fix it.

**Style:** Scenario

<details>
<summary>Answer</summary>

Both instances run the scheduler. Use a distributed lock (ShedLock) or a single job runner (Kubernetes CronJob), and make processing idempotent — e.g. claim records with `UPDATE … SET status='PROCESSING' WHERE status='NEW'` or `SELECT … FOR UPDATE SKIP LOCKED`.

</details>

### Q9. Memory grows steadily until the pod is OOMKilled every few days. How do you approach it?

**Style:** Debugging

<details>
<summary>Answer</summary>

Watch heap metrics (`jvm.memory.used`, GC pauses) to confirm a leak vs container limit misconfiguration; take heap dumps (`/actuator/heapdump` securely, or `jcmd`) and compare dominators. Common culprits: unbounded caches (`ConcurrentHashMap`, simple cache manager without TTL), `ThreadLocal`s never removed, growing collections in singletons, huge persistence contexts in long transactions, or `-Xmx` larger than the container limit.

</details>

## Advanced

### Q10. After upgrading to Spring Boot 3, several endpoints return 500 with `ConstraintViolationException`. They used to return 400. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

Controllers carry class-level `@Validated`, so parameter constraints are checked by AOP method validation, which throws `ConstraintViolationException` (unmapped → 500). Since Spring 6.1, remove class-level `@Validated` to use built-in MVC method validation (`HandlerMethodValidationException` → 400), or add a handler mapping `ConstraintViolationException` to 400.

</details>

### Q11. A bulk import of 100 000 rows takes 40 minutes. How do you speed it up?

**Style:** Scenario

<details>
<summary>Answer</summary>

Check ID generation (switch from IDENTITY to pooled SEQUENCE to enable batching), set `hibernate.jdbc.batch_size` and `order_inserts`, process in chunks with `flush()`/`clear()` or separate transactions per chunk, avoid per-row SELECTs (assigned ids with `merge`, lookups in loops — preload reference data), consider `JdbcTemplate.batchUpdate` or database COPY for pure inserts, and disable unnecessary per-row events/validation.

</details>

### Q12. A transaction intermittently fails with deadlock errors under load. What do you do?

**Style:** Debugging

<details>
<summary>Answer</summary>

Read the database deadlock report to see the competing statements and lock order. Typical causes: two code paths updating the same rows in different orders, long transactions holding locks, missing indexes causing range/table locks. Fix lock ordering (e.g. sort ids before locking), shorten transactions, add indexes, and retry deadlock victims (`CannotAcquireLockException`/`DeadlockLoserDataAccessException`) a limited number of times.

</details>

### Q13. A CORS error appears only for failed requests; successful ones work. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

The error response is produced by a component that does not add CORS headers — e.g. an exception in a filter before `CorsFilter`, a gateway/load balancer error page, or a 401 from a custom entry point placed before CORS handling. The browser then reports CORS instead of the real status. Ensure CORS runs first (`http.cors()`) and error paths include the headers; check the actual status in the network tab.

</details>

### Q14. Login works on one instance but tokens issued by it are rejected by the other. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

The instances use different signing keys — e.g. a secret generated at startup (`Keys.secretKeyFor(...)`) or different environment values. All instances must share the same key (from configuration/secret store) or validate with the issuer's public keys (JWKS).

</details>
