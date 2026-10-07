# Graceful Degradation and Load Shedding — Interview Questions

## Beginner

### Q1. What is graceful degradation?

**Style:** Direct

<details>
<summary>Answer</summary>

Designing a system so that when components fail or capacity runs short, it keeps providing its core functionality in a reduced form — hiding recommendations, serving cached data, switching to read-only — rather than failing entirely.

</details>

### Q2. What is load shedding?

**Style:** Direct

<details>
<summary>Answer</summary>

Deliberately rejecting part of the incoming requests when load exceeds capacity, early and cheaply (for example with 503 and `Retry-After`), so the requests that are accepted are completed within their deadlines instead of everything slowing down and timing out.

</details>

## Intermediate

### Q3. Why can accepting every request during overload reduce successful throughput?

**Style:** Why

<details>
<summary>Answer</summary>

Queues grow and latency rises past client timeouts, so the server spends its capacity on requests whose clients have already given up; clients then retry, adding more load. Useful completed work (goodput) falls sharply. Rejecting excess early keeps latency within deadlines for the accepted share.

</details>

### Q4. How do you decide what to shed or degrade first?

**Style:** How

<details>
<summary>Answer</summary>

Classify traffic and features by business importance in advance: protect critical paths (login, checkout, payments), simplify important ones, and turn off optional ones (recommendations, analytics, prefetching, background sync). Shed lower-priority request classes first, using headers or routes to identify them, and expose kill switches and feature flags for fast action.

</details>

## Advanced

### Q5. The database is struggling during an incident. What degradation options do you have?

**Style:** Design

<details>
<summary>Answer</summary>

Serve reads from caches (including stale entries) and replicas; disable expensive queries and optional features; switch to read-only mode for non-essential writes; queue deferrable writes for later; reduce page sizes; shed low-priority traffic and limit concurrency to the database with admission control; and show clear messages to users rather than timeouts.

</details>

### Q6. How does load shedding relate to autoscaling?

**Style:** Comparison

<details>
<summary>Answer</summary>

They complement each other. Autoscaling adds capacity for sustained load increases but reacts in minutes and has limits (budget, database capacity). Load shedding acts in milliseconds to protect the system during the gap and during spikes beyond any capacity. Shedding also protects shared dependencies that cannot autoscale.

</details>
