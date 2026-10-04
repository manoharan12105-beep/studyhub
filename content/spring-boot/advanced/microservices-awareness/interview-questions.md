# Microservices Awareness for Spring Boot Developers — Interview Questions

## Beginner

### Q1. What is the difference between a monolith and microservices?

<details>
<summary>Answer</summary>

A monolith is one deployable application containing all features, usually with one database. Microservices split the system into independently deployable services, each owning a business capability and its own data, communicating over the network. Microservices give independent scaling and deployment at the cost of distributed-system complexity.

</details>

### Q2. What is an API gateway?

<details>
<summary>Answer</summary>

A single entry point for clients that routes requests to backend services and handles cross-cutting concerns — authentication, rate limiting, CORS, TLS, logging, sometimes response aggregation. Spring Cloud Gateway is the Spring option.

</details>

## Intermediate

### Q3. What is service discovery and do you need Eureka on Kubernetes?

<details>
<summary>Answer</summary>

Service discovery lets services find each other's current instances by logical name instead of fixed addresses. Eureka provides a registry for client-side discovery. On Kubernetes, Services and cluster DNS already provide discovery and load balancing, so Eureka is usually unnecessary.

</details>

### Q4. What is distributed tracing?

<details>
<summary>Answer</summary>

Following a single request across services using a shared trace id and per-hop spans propagated in headers (W3C `traceparent`). It shows where time is spent and where failures happen. In Spring Boot, Micrometer Tracing with an OpenTelemetry bridge creates spans, propagates context and puts trace ids into logs; traces are exported to Zipkin, Jaeger or Tempo.

</details>

### Q5. How do you keep data consistent across microservices without distributed transactions?

<details>
<summary>Answer</summary>

Each service commits its own local transaction and publishes events reliably (transactional outbox). Multi-step business processes are sagas: a sequence of local transactions coordinated by events (choreography) or an orchestrator, with compensating actions to undo earlier steps on failure. Operations are idempotent, and the system is eventually consistent.

</details>

## Advanced

### Q6. When would you NOT choose microservices?

<details>
<summary>Answer</summary>

For a new product with unclear domain boundaries, a small team, or limited operational maturity (no CI/CD per service, monitoring, tracing, on-call). A modular monolith gives clear boundaries with simple deployment and strong consistency, and modules can be extracted into services later when there is a concrete need (independent scaling, team autonomy).

</details>

### Q7. What is a distributed monolith?

<details>
<summary>Answer</summary>

A system split into services that are still tightly coupled — they share a database, must be deployed together, or call each other synchronously in long chains — so it has the costs of distribution without the independence benefits. Signs: coordinated releases, cascading failures, shared schemas.

</details>
