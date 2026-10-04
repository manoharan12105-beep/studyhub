# Actuator, Health Checks, Metrics and Monitoring — Interview Questions

## Beginner

### Q1. What is Spring Boot Actuator?

<details>
<summary>Answer</summary>

A Spring Boot module that adds production endpoints for monitoring and managing an application — health, info, metrics, loggers, environment, mappings, thread dumps and more — integrated with Micrometer for metrics export.

</details>

### Q2. Which Actuator endpoints are exposed over HTTP by default?

<details>
<summary>Answer</summary>

Only `/actuator/health`. Others must be listed in `management.endpoints.web.exposure.include`, and sensitive ones should be secured or kept on an internal management port.

</details>

### Q3. What does `/actuator/health` check?

<details>
<summary>Answer</summary>

It aggregates all `HealthIndicator`s — auto-configured ones for the database, disk space, Redis, message brokers and others, plus custom ones — into an overall status (UP, DOWN, OUT_OF_SERVICE, UNKNOWN), returning 503 when DOWN. Details are shown according to `management.endpoint.health.show-details`.

</details>

## Intermediate

### Q4. What is the difference between liveness and readiness probes?

<details>
<summary>Answer</summary>

Liveness answers "is the process healthy enough to keep running?" — failure makes Kubernetes restart the container. Readiness answers "can it accept traffic now?" — failure removes it from load balancing without a restart (e.g. during startup, warm-up or shutdown). External dependencies belong in readiness, not liveness.

</details>

### Q5. How do you add a custom metric?

<details>
<summary>Answer</summary>

Inject `MeterRegistry` and register meters — `Counter`, `Timer`, `Gauge`, `DistributionSummary` — with names and low-cardinality tags, or use `@Timed`/`@Observed`. They appear under `/actuator/metrics` and in the configured backend (e.g. Prometheus).

</details>

### Q6. How do you secure Actuator endpoints?

<details>
<summary>Answer</summary>

Expose only what is needed, run management on a separate internal port (`management.server.port`), and add a `SecurityFilterChain` for `EndpointRequest.toAnyEndpoint()` requiring an admin role while permitting `health` (and perhaps `info`). Keep `show-details=when-authorized`.

</details>

## Advanced

### Q7. Why shouldn't the database health check be part of the liveness probe?

<details>
<summary>Answer</summary>

If the database goes down, every instance would fail liveness and be restarted repeatedly, adding startup load and making recovery slower — while restarting does not fix the database. The application is alive; it just cannot serve requests, which is what readiness expresses.

</details>

### Q8. What is high cardinality in metrics and why is it a problem?

<details>
<summary>Answer</summary>

Cardinality is the number of unique tag combinations of a metric. Tags with unbounded values (user id, order id, raw URL with ids) create a new time series per value, exploding memory and storage in the metrics system and slowing queries. Use bounded tags (URI templates like `/api/orders/{id}`, status codes, regions).

</details>
