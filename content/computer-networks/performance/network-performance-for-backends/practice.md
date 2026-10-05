# Network Performance for Backend Systems — Practice

### P1. Bound by what?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** latency-bound vs bandwidth-bound

A mobile app makes 30 sequential 1 KB API calls over a 50 Mbit/s connection with 80 ms RTT. What dominates the total time?

- A) Bandwidth
- B) Round-trip latency
- C) Server disk speed
- D) DNS TTL

<details>
<summary>Answer</summary>

**Answer:** B) Round-trip latency

**Explanation:** 30 × 80 ms = 2.4 s of round trips; transferring 30 KB at 50 Mbit/s takes about 5 ms.

</details>

### P2. Cold connection cost

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** handshake round trips

RTT = 120 ms, DNS not cached (resolver 20 ms away), TLS 1.3, server processing 30 ms. Estimate time to first byte for a new HTTPS connection.

<details>
<summary>Answer</summary>

DNS 20 + TCP 120 + TLS 120 + request/response 120 + 30 = **410 ms**.

</details>

### P3. Parallelise

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** sequential vs parallel calls

A handler calls three independent services taking 40, 60 and 25 ms. What is the time sequentially and in parallel?

<details>
<summary>Answer</summary>

Sequential: 40 + 60 + 25 = **125 ms**. Parallel: the slowest, **60 ms** (plus small overhead).

</details>

### P4. Cross-region database

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** co-location

An app in Mumbai uses a database in Frankfurt (RTT ≈ 120 ms). An endpoint runs 8 sequential queries. Estimate the network time and propose two fixes.

<details>
<summary>Answer</summary>

8 × 120 = **960 ms** of round trips. Fixes: move the app next to the database (or a read replica next to the app), and reduce round trips (combine queries, batch, cache results).

</details>
