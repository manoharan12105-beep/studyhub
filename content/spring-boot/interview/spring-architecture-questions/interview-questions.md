# Spring Boot Architecture Questions — Interview Questions

## Beginner

### Q1. Describe the architecture of a typical Spring Boot REST application.

**Style:** Direct

<details>
<summary>Answer</summary>

Layers: controllers (HTTP, DTOs, validation), services (business rules, transactions), repositories (Spring Data JPA), entities; cross-cutting configuration for security (filter chain), global exception handling, and observability (Actuator, logging). It runs as one executable JAR with an embedded server, configured from the environment, backed by a relational database.

</details>

### Q2. Why separate controller, service and repository layers?

**Style:** Why

<details>
<summary>Answer</summary>

Each layer has one reason to change: HTTP contract, business rules, data access. Separation keeps business logic reusable from other entry points (jobs, consumers), makes transactions coherent per use case, and allows testing each layer in isolation.

</details>

## Intermediate

### Q3. Package by layer or package by feature?

**Style:** Comparison

<details>
<summary>Answer</summary>

By feature (`order`, `catalog`, `payment`, each with controller/service/repository/DTOs) for anything beyond a small app: changes stay local, package-private visibility hides internals, and modules can later be extracted. By layer is simple for tiny apps but spreads each feature across the codebase.

</details>

### Q4. What is a modular monolith and why might you prefer it to microservices?

**Style:** Why

<details>
<summary>Answer</summary>

One deployable application split into well-defined modules with explicit APIs and no shared internals (enforced with packages, ArchUnit or Spring Modulith). It keeps transactions, deployment and debugging simple while preserving boundaries, and lets you extract services later when scaling or team needs justify it.

</details>

### Q5. How do modules or services communicate without tight coupling?

**Style:** How

<details>
<summary>Answer</summary>

Within a monolith: interfaces owned by the consuming module and application events. Across services: synchronous HTTP/gRPC for queries needing immediate answers (with timeouts and circuit breakers) and asynchronous messages/events (Kafka, RabbitMQ) for notifications and workflows, with the outbox pattern for reliability.

</details>

### Q6. How would you make a Spring Boot service horizontally scalable?

**Style:** How

<details>
<summary>Answer</summary>

Keep instances stateless (no in-memory sessions or per-instance caches for shared data; use JWT or Spring Session with Redis), externalise configuration, use a shared cache, size connection pools against the database limit, make scheduled jobs single-run (locks), run behind a load balancer with readiness probes, and scale the database separately (read replicas, indexing, caching).

</details>

## Advanced

### Q7. Traffic grows 10× next quarter. What do you check and change first?

**Style:** Scenario

<details>
<summary>Answer</summary>

Measure where time goes (traces, slow queries, pool metrics). Typical steps: fix N+1 and add indexes, cache read-heavy endpoints, paginate everything, add replicas behind the load balancer, tune pool sizes within database limits, move slow side effects to async/queues, add read replicas or a search engine for heavy reads, set rate limits, and load-test before the peak.

</details>

### Q8. How do you keep data consistent between an order service and an inventory service?

**Style:** Scenario

<details>
<summary>Answer</summary>

Avoid distributed transactions; use a saga: order created as PENDING (outbox event), inventory reserves stock and emits success/failure, order confirms or cancels with compensations (release stock, refund). Handlers are idempotent and messages durable. Accept eventual consistency and design the UI around pending states.

</details>

### Q9. Where should validation live in a layered architecture?

**Style:** Why

<details>
<summary>Answer</summary>

Syntactic validation (formats, required fields, ranges) on request DTOs at the controller boundary with Bean Validation; business rules (stock availability, state transitions, uniqueness checks) in services/domain objects; integrity in the database (constraints, foreign keys, unique indexes) as the final guard against races.

</details>

### Q10. How would you design the read side of a product catalogue with heavy traffic and complex search?

**Style:** Scenario

<details>
<summary>Answer</summary>

Separate reads from writes: writes go to PostgreSQL; changes are published (events/CDC) to a search index (Elasticsearch/OpenSearch) for full-text search and facets, and hot product details are cached in Redis/CDN. APIs return projections, use keyset pagination for browsing, and tolerate seconds of staleness.

</details>
