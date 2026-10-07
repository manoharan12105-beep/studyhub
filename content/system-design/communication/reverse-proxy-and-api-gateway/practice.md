# Reverse Proxy and API Gateway — Practice

### P1. Which proxy?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** forward vs reverse proxy

A company routes all employee web traffic through a server that blocks certain sites and logs access. This server is a:

- A) Reverse proxy
- B) Forward proxy
- C) API gateway
- D) CDN

<details>
<summary>Answer</summary>

**Answer:** B) Forward proxy

It acts on behalf of the clients (employees).

</details>

### P2. Gateway responsibilities

**Difficulty:** Easy · **Type:** Comparison · **Concepts:** gateway scope

Which belong in an API gateway: (a) JWT validation, (b) computing order discounts, (c) per-plan rate limits, (d) routing `/v2/*` to new services, (e) updating inventory?

<details>
<summary>Answer</summary>

(a), (c) and (d). Discounts and inventory updates are business logic that belong in services.

</details>

### P3. Slow service, stuck gateway

**Difficulty:** Hard · **Type:** Failure · **Concepts:** timeouts, isolation

The recommendations service becomes very slow. Soon every route through the gateway times out, including checkout. Why, and what should the gateway have had?

<details>
<summary>Answer</summary>

Requests to the slow service held gateway connections or worker threads until they were exhausted, so unrelated routes could not be served. The gateway needed per-route timeouts, a circuit breaker for the recommendations route, and separate resource pools (bulkheads) per downstream service, plus a fallback such as returning no recommendations.

</details>
