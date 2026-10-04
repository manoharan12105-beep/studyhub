# Spring Boot Tricky and Behavior Questions — Interview Questions

## Beginner

### Q1. A `@Transactional` method throws `IOException` after saving a row. Is the row saved?

**Style:** Behavior

<details>
<summary>Answer</summary>

Yes — checked exceptions commit by default. Only unchecked exceptions and errors roll back unless `rollbackFor` is set. (Verified in [@Transactional](../../transactions/transactional-annotation/content.md#how-it-works).)

</details>

### Q2. Two beans implement `Notifier`; one is `@Primary`; the constructor parameter is named after the other bean. Which is injected?

**Style:** Behavior

<details>
<summary>Answer</summary>

The `@Primary` bean. Primary is evaluated before the parameter-name fallback; only `@Qualifier` overrides it. (Verified in [@Autowired, @Qualifier and @Primary](../../dependency-injection/autowiring-and-bean-resolution/content.md#how-it-works).)

</details>

### Q3. Does `@NotEmpty` reject `"   "`?

**Style:** Behavior

<details>
<summary>Answer</summary>

No. `"   "` is not empty; only `@NotBlank` rejects whitespace-only strings. (Verified in [Bean Validation](../../validation/bean-validation/content.md#verifying-the-behaviour).)

</details>

### Q4. A singleton bean has a prototype dependency injected via the constructor. Do two method calls see two instances?

**Style:** Behavior

<details>
<summary>Answer</summary>

No — the prototype is injected once, when the singleton is created. Use `ObjectProvider<T>.getObject()` for a new instance per use.

</details>

## Intermediate

### Q5. In a `@Transactional` method, you load an entity, change a field and return without calling `save()`. What SQL runs?

**Style:** Behavior

<details>
<summary>Answer</summary>

The SELECT when loading, then an UPDATE at commit through dirty checking. (Verified in [Dirty Checking](../../jpa-hibernate/dirty-checking-and-flush/content.md#how-it-works).)

</details>

### Q6. Same as Q5, but the method is `@Transactional(readOnly = true)`. What happens to the change?

**Style:** Behavior

<details>
<summary>Answer</summary>

It is not written: Spring sets Hibernate's flush mode to MANUAL for read-only transactions, so no dirty checking/flush occurs at commit. The in-memory object is changed; the database is not.

</details>

### Q7. An inner REQUIRED method throws a `RuntimeException`; the outer method catches it and returns normally. Result?

**Style:** Behavior

<details>
<summary>Answer</summary>

`UnexpectedRollbackException` at commit and everything rolled back — the shared transaction was marked rollback-only. (Verified in [Propagation](../../transactions/transaction-propagation/content.md#how-it-works).)

</details>

### Q8. `@Cacheable` method `find(id)` is called twice from another method of the same class. How many times does the body execute?

**Style:** Behavior

<details>
<summary>Answer</summary>

Twice — self-invocation bypasses the caching proxy. (Verified in [Cache Abstraction](../../advanced/spring-cache-abstraction/content.md#how-it-works).)

</details>

### Q9. A `@Configuration(proxyBeanMethods = false)` class has `repository()` call `pool()` directly. How many pools exist?

**Style:** Behavior

<details>
<summary>Answer</summary>

Two: the `pool` bean and the extra instance created by the plain Java call (lite mode has no interception). With full-mode `@Configuration`, one. (Verified in [@Configuration and @Bean](../../fundamentals/configuration-and-bean-methods/content.md).)

</details>

### Q10. A plain `@EventListener` and an `@TransactionalEventListener` both listen to an event published in a transaction that then rolls back. Which run?

**Style:** Behavior

<details>
<summary>Answer</summary>

Only the plain `@EventListener` (immediately, during `publishEvent`); the transactional listener (AFTER_COMMIT by default) does not run. (Verified in [Spring Events](../../advanced/spring-events/content.md#how-it-works).)

</details>

### Q11. A logged-in USER calls an ADMIN-only URL with a valid JWT. And a request with a tampered JWT? Status codes?

**Style:** Behavior

<details>
<summary>Answer</summary>

403 for the valid USER token (authenticated, not authorised); 401 for the tampered token (signature invalid → not authenticated). (Verified in [JWT Authentication Flow](../../security/jwt-authentication-flow/content.md#how-it-works).)

</details>

### Q12. A browser sends a CORS preflight to an endpoint that requires authentication. With `http.cors()` configured, what status does the preflight get?

**Style:** Behavior

<details>
<summary>Answer</summary>

200 with CORS headers (for an allowed origin) even without credentials — `CorsFilter` answers preflights before authentication. Without `http.cors()`, the preflight would get 401/403. (Verified in [CORS](../../web-security/spring-cors/content.md#how-it-works-spring).)

</details>

## Advanced

### Q13. `persist()` is called on a new entity with `GenerationType.IDENTITY`. When does the INSERT run — at `persist` or at commit?

**Style:** Behavior

<details>
<summary>Answer</summary>

Immediately at `persist`, because Hibernate needs the generated id. With SEQUENCE, the INSERT waits until flush. (Verified in [Entity Lifecycle](../../jpa-hibernate/entity-lifecycle-and-persistence-context/content.md#how-it-works).)

</details>

### Q14. You `merge(detached)` and then modify `detached`. Is the modification saved?

**Style:** Behavior

<details>
<summary>Answer</summary>

No. `merge` returns a different managed instance; the argument stays detached and untracked. Modify the returned instance. (Verified: "merge returned the same object? false".)

</details>

### Q15. Ten authors are loaded with `findAll()` and each author's lazy `books` collection is read. How many SQL statements? With `hibernate.default_batch_fetch_size=25`?

**Style:** Behavior

<details>
<summary>Answer</summary>

11 (1 + N) without batching; 2 with batch fetching (one query for authors, one `IN` query for all ten collections). (Verified in [N+1](../../jpa-hibernate/n-plus-one-problem/content.md#how-it-works).)

</details>

### Q16. Spring Boot app, field injection cycle between two services (A ↔ B). Does it start?

**Style:** Behavior

<details>
<summary>Answer</summary>

No. Spring Framework could resolve a field-injection cycle with early references, but Spring Boot sets `spring.main.allow-circular-references=false` (since 2.6), so startup fails. Constructor cycles never resolve. (Verified in [Circular Dependencies](../../dependency-injection/circular-dependencies/content.md#how-it-works).)

</details>

### Q17. A test reads a public field of an injected `@Service` that has `@Transactional` methods and finds it `null`, although the bean's methods set it. Why?

**Style:** Behavior

<details>
<summary>Answer</summary>

The injected object is a CGLIB proxy — a separate subclass instance whose fields are never initialised; methods delegate to the target, whose fields hold the values. Read state through methods.

</details>

### Q18. A `@Bean` method named `pricingService` and a scanned `@Service PricingService` exist. Spring Boot disables bean overriding. Does startup fail?

**Style:** Behavior

<details>
<summary>Answer</summary>

No — a configuration-class `@Bean` method is allowed to replace a scanned component with the same name, so one `pricingService` bean (from the `@Bean` method) exists. Two `@Bean` methods with the same name would fail with `BeanDefinitionOverrideException`. (Verified while writing [Spring Beans](../../fundamentals/spring-beans/content.md).)

</details>

### Q19. With Framework 7's `@Retryable(maxRetries = 2)` on a method that always fails, how many invocations happen and what does the caller receive?

**Style:** Behavior

<details>
<summary>Answer</summary>

Three invocations (one attempt + two retries), then the last exception itself is rethrown to the caller. (Verified in [Resilience](../../advanced/resilience-patterns/content.md#retry).)

</details>

### Q20. A `@PreAuthorize` check fails in a controller method, and the app has `@ExceptionHandler(Exception.class)` returning 500. What does the client get?

**Style:** Behavior

<details>
<summary>Answer</summary>

500 — the `AccessDeniedException` is thrown inside handler execution, so the catch-all `@ExceptionHandler` handles it before Spring Security's `ExceptionTranslationFilter` can produce 403. Add an explicit `AccessDeniedException` handler (403) or rethrow it.

</details>
