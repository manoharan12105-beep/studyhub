# Keep-Alive and Connection Pooling — Practice

### P1. Default pool

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** HikariCP

Which connection pool does Spring Boot use by default for JDBC?

- A) Apache DBCP
- B) HikariCP
- C) c3p0
- D) PgBouncer

<details>
<summary>Answer</summary>

**Answer:** B) HikariCP

**Explanation:** PgBouncer is a server-side pooler in front of PostgreSQL, not an in-app JDBC pool.

</details>

### P2. Savings

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** connection reuse

RTT to an API is 40 ms. A batch job makes 1,000 sequential HTTPS calls. Estimate the handshake time saved by keep-alive (TLS 1.3).

<details>
<summary>Answer</summary>

Without reuse each call adds TCP + TLS = 2 RTT = 80 ms → 1,000 × 80 ms = **80 s**. With keep-alive only the first call pays it: ~80 ms. Saving ≈ **80 s**.

</details>

### P3. Total connections

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** pool sizing

PostgreSQL allows `max_connections = 200`, with 10 reserved for admin. You run 12 instances, each with `maximumPoolSize = 20`. Will it fit?

<details>
<summary>Answer</summary>

12 × 20 = 240 > 190 available — **no**. Reduce pool sizes (e.g. 15 each = 180), reduce instances, or add PgBouncer.

</details>

### P4. Spot the anti-pattern

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** client reuse

A service creates `HttpClient.newHttpClient()` inside every request handler. Under load you see thousands of TIME_WAIT sockets and rising latency. Explain and fix.

<details>
<summary>Answer</summary>

Each new client has its own empty connection pool, so every request opens (and later closes) a new TCP+TLS connection: extra handshakes, slow start, and TIME_WAIT sockets that exhaust ephemeral ports. Create one shared `HttpClient` (a singleton bean) and reuse it so connections are pooled.

</details>
