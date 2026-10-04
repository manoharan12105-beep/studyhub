# Project-Based Spring Boot Questions — Interview Questions

## Beginner

### Q1. Design a Spring Boot e-commerce backend at a high level.

**Style:** Scenario

<details>
<summary>Answer</summary>

A modular monolith with feature modules — auth, catalog, cart, order, payment, notification — each with controller/service/repository layers, PostgreSQL via Spring Data JPA with Flyway migrations, Redis for caching and rate limiting, object storage for images, Spring Security with JWT, events for side effects, Actuator/metrics/logging, packaged as a Docker image. Core flows: browse (paged, cached), cart, checkout (transactional order placement with stock decrement), payment (gateway + webhook), notifications after commit.

</details>

### Q2. How would you structure the controller, service and repository layers?

**Style:** How

<details>
<summary>Answer</summary>

Package by feature. Controllers: map URLs, accept request DTOs with `@Valid`, call one service method, return response DTOs/`ResponseEntity`. Services: business rules, `@Transactional` boundaries, entity ↔ DTO mapping, domain exceptions. Repositories: Spring Data interfaces with derived queries, `@Query`, projections and entity graphs. One `@RestControllerAdvice` maps exceptions to ProblemDetail.

</details>

### Q3. Why did you use DTOs?

**Style:** Why

<details>
<summary>Answer</summary>

To decouple the API from the database schema, prevent mass assignment (clients cannot set `role` or `price` on create), avoid leaking fields like password hashes, validate per operation (create vs update), avoid lazy-loading and recursion problems during JSON serialisation, and document a stable contract in OpenAPI.

</details>

### Q4. How would you validate user input?

**Style:** How

<details>
<summary>Answer</summary>

Bean Validation annotations on request DTOs (`@NotBlank`, `@Email`, `@Size`, `@Positive`, `@Pattern`, `@Valid` for nested items), constraints on path/query parameters, custom constraints for rules such as strong passwords or date ranges, business validation in services (stock, coupon validity), database constraints as the final guard, and a global handler returning 400 with field errors.

</details>

## Intermediate

### Q5. How would you secure login?

**Style:** Scenario

<details>
<summary>Answer</summary>

Passwords hashed with BCrypt (or Argon2) via `PasswordEncoder`; login through `AuthenticationManager` (`DaoAuthenticationProvider` + database `UserDetailsService`); generic error messages; rate limiting and lockout/backoff on repeated failures; HTTPS only; optional MFA/OTP; short-lived access tokens and rotating refresh tokens; audit logging of logins.

</details>

### Q6. How would JWT authentication work in this project?

**Style:** How

<details>
<summary>Answer</summary>

`POST /api/auth/login` authenticates and returns a 15-minute access JWT (`sub`, roles, `exp`, signed with a secret from the environment) and a refresh token stored hashed in the database and sent as an HttpOnly cookie. A `OncePerRequestFilter` before `UsernamePasswordAuthenticationFilter` validates the bearer token and sets the `SecurityContext`; the chain is stateless with CSRF disabled for the API; `/api/auth/refresh` rotates refresh tokens; logout revokes them.

</details>

### Q7. How would you handle product images?

**Style:** Scenario

<details>
<summary>Answer</summary>

Admins upload via multipart (size limits, content-type checks by magic bytes, generated names) or, for large files, directly to object storage using pre-signed URLs. Files live in S3-compatible storage; the database stores keys and metadata; thumbnails are generated asynchronously; images are served through a CDN with long cache lifetimes.

</details>

### Q8. How would you implement pagination for the product listing?

**Style:** How

<details>
<summary>Answer</summary>

`GET /api/products?page=0&size=20&sort=price,asc&category=…` bound to `Pageable` (max page size configured, sort fields whitelisted, `id` as tie-breaker) and a filter record; repository returns `Page<ProductSummary>` projections (or `Slice`/keyset pagination for infinite scroll); the controller returns a page DTO; indexes support the filters and sorts.

</details>

### Q9. How would you prevent duplicate orders?

**Style:** Scenario

<details>
<summary>Answer</summary>

Clients send an `Idempotency-Key` per checkout attempt; the server stores it with a unique constraint (scoped to the user) together with the resulting order; a repeated key returns the existing order instead of creating a new one, and a concurrent duplicate gets 409. The UI also disables the button after submit, but server-side idempotency is what guarantees correctness.

</details>

### Q10. How would you handle concurrent stock updates?

**Style:** Scenario

<details>
<summary>Answer</summary>

Decrement atomically in the database: `update product set stock = stock - :qty where id = :id and stock >= :qty` — 0 rows means insufficient stock — inside the order transaction, plus a `CHECK (stock >= 0)` constraint. Alternatives: `@Version` optimistic locking with retry for low contention, or `PESSIMISTIC_WRITE` locks for hot items. Never check-then-update in Java without a lock.

</details>

### Q11. How would you design exception handling?

**Style:** How

<details>
<summary>Answer</summary>

A hierarchy of unchecked domain exceptions (`ResourceNotFoundException`, `BusinessRuleException`, `DuplicateResourceException`…), one `@RestControllerAdvice` extending `ResponseEntityExceptionHandler` that maps them, validation errors, optimistic-lock and data-integrity exceptions, and security exceptions to ProblemDetail with consistent `type`/`code` fields and a trace id; a safe 500 fallback that logs at ERROR; security entry point/access-denied handler for filter-level 401/403.

</details>

### Q12. How would you handle database transactions in order placement?

**Style:** How

<details>
<summary>Answer</summary>

`@Transactional` on `OrderService.placeOrder`: validate cart, decrement stock atomically, insert order and lines, record the idempotency key — all or nothing. Payment happens outside this transaction (order PENDING → gateway call with the order id as idempotency key → webhook updates status in a new transaction). Emails and messages are triggered after commit via transactional events or an outbox.

</details>

## Advanced

### Q13. The order history API is slow. How would you optimise it?

**Style:** Scenario

<details>
<summary>Answer</summary>

Measure first (traces, SQL logs, `EXPLAIN ANALYZE`). Then: paginate (keyset for deep history), return projections instead of entities, fix N+1 (entity graph for lines/products or batch fetching), add a composite index on `(customer_id, created_at desc)`, avoid expensive counts, cache recent history if acceptable, and check the connection pool and transaction length.

</details>

### Q14. How did you (or would you) solve N+1 in this project?

**Style:** Debugging

<details>
<summary>Answer</summary>

Detected it with `org.hibernate.SQL` logs and statistics — the order list issued one query per order for lines and per line for products. Fixed with `@EntityGraph(attributePaths = {"lines", "lines.product"})` for the detail endpoint, batch fetching (`default_batch_fetch_size`) plus paging parent ids for the list, DTO projections for summaries, and disabled Open Session in View so lazy loading cannot hide in serialisation.

</details>

### Q15. How would you deploy the application?

**Style:** How

<details>
<summary>Answer</summary>

CI runs tests (including Testcontainers integration tests), builds a layered Docker image (multi-stage, non-root, JRE base) tagged with the version, pushes it to a registry and deploys to Kubernetes (or a managed container service) with env-based configuration, secrets from a secret manager, managed PostgreSQL and Redis, Flyway migrations, liveness/readiness probes, resource limits, graceful shutdown, rolling updates, and monitoring via Prometheus/Grafana and centralised JSON logs.

</details>

### Q16. Payment succeeded at the gateway but your server crashed before marking the order paid. How do you recover?

**Style:** Scenario

<details>
<summary>Answer</summary>

Treat the gateway webhook (and a periodic reconciliation job querying the gateway for PENDING orders older than N minutes) as the source of truth. Webhook handling is idempotent (store processed event ids), verifies the signature, and moves the order PENDING → PAID in a transaction. Because the payment was created with the order id as idempotency key, retries never double-charge.

</details>

### Q17. Black Friday traffic is expected to be 20× normal. What would you prepare?

**Style:** Scenario

<details>
<summary>Answer</summary>

Load-test realistic flows; scale instances horizontally (stateless app); cache catalogue reads (Redis/CDN) and pre-warm; protect checkout with rate limits and queueing; ensure stock updates are atomic and indexed; size DB connections against limits (add replicas/poolers); move emails/analytics to async queues; set timeouts and circuit breakers for payment and courier APIs; set alerts on error rate, latency and pool saturation; freeze risky deployments.

</details>

### Q18. What would you improve in your project if you had more time?

**Style:** Scenario

<details>
<summary>Answer</summary>

Pick concrete, justified items: integration tests with Testcontainers and contract tests, refresh-token rotation with reuse detection, structured logging with trace ids, Flyway instead of `ddl-auto`, query-count tests to prevent N+1 regressions, rate limiting on login, OpenAPI-driven client generation, and outbox-based events. Explain the risk each one reduces.

</details>
