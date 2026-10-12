# Observability: Metrics and Traces for AI Calls — Interview Questions

## Beginner

### Q1. What does Spring AI observe out of the box?

**Style:** Direct

<details>
<summary>Answer</summary>

`ChatClient` calls (`spring.ai.chat.client`), each advisor (`spring.ai.advisor`), provider model calls (`gen_ai.client.operation`, for chat and embeddings), tool executions (`spring.ai.tool`) and vector store operations. Each becomes a Micrometer timer and, with tracing enabled, a span; token usage is exported as `gen_ai.client.token.usage`.

</details>

### Q2. What do you need in a Spring Boot 4 application to see these metrics and traces?

**Style:** How

<details>
<summary>Answer</summary>

`spring-boot-starter-actuator` plus a metrics registry (for example `micrometer-registry-prometheus`) for metrics; `spring-boot-starter-opentelemetry` (or another tracing setup) and an exporter for traces; and AI components created through auto-configuration so they share the `ObservationRegistry`.

</details>

## Intermediate

### Q3. A tool-calling request takes 9 seconds. How do you find out why?

**Style:** Debugging

<details>
<summary>Answer</summary>

Open its trace: under `spring.ai.chat.client`, see how many `gen_ai.client.operation` spans (model rounds) there are and their durations, and the `spring.ai.tool` spans between them. Typical findings: many rounds (model looping on a tool), one slow tool (database or API), slow first model call because of a huge prompt (check input tokens), or retrieval/advisor time before the model call.

</details>

### Q4. Why shouldn't you tag AI metrics with the user id or conversation id?

**Style:** Why

<details>
<summary>Answer</summary>

Each distinct tag value creates a new time series; user or conversation ids create unbounded cardinality, overloading the metrics backend and leaking personal identifiers. Use low-cardinality tags (model, feature, operation, outcome) for metrics; put ids in traces or logs if needed.

</details>

## Advanced

### Q5. Design the dashboards and alerts for a production AI assistant.

**Style:** Design

<details>
<summary>Answer</summary>

Dashboards: latency p50/p95/p99 per model and feature; tokens per minute by type and model with cost estimates; error rate by type (rate limit, auth, timeout, server); tool calls per request and tool failure rate; retrieval latency and empty-retrieval rate; fallback-model usage; budget refusals. Alerts: any 401/403 (keys/quota), p95 above SLO, error rate spikes, token spend above forecast, sudden rise in tool calls per request (possible loop or injection). Traces sampled with all errors kept; content logging off; feature tags added through a shared advisor or convention.

</details>
