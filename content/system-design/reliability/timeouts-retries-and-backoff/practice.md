# Timeouts, Retries, Backoff and Jitter — Practice

### P1. Retry or not

**Difficulty:** Easy · **Type:** Comparison · **Concepts:** retryable errors

Retry (R) or don't (D)? (a) 503 from an idempotent GET, (b) 400 Bad Request, (c) connection timeout on `PUT /settings`, (d) timeout on `POST /payments` without an idempotency key, (e) 429 with `Retry-After: 2`.

<details>
<summary>Answer</summary>

(a) R, (b) D, (c) R, (d) D (or retry only after checking status / adding an idempotency key), (e) R after 2 seconds.

</details>

### P2. Backoff schedule

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** exponential backoff

Base 200 ms, factor 2, cap 3 s, no jitter. What are the waits before retries 1 to 6?

<details>
<summary>Answer</summary>

200, 400, 800, 1,600, 3,000 (capped from 3,200), 3,000 ms.

</details>

### P3. Amplification

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** retry storms

A request passes through 3 services; each makes up to 3 attempts (1 + 2 retries) to the next. If the bottom dependency is down, how many calls can one user request generate at the bottom?

<details>
<summary>Answer</summary>

3 × 3 × 3 = **27** calls. Retrying in one layer only would make it 3.

</details>

### P4. Timeout budget

**Difficulty:** Medium · **Type:** Design · **Concepts:** latency budgets

An endpoint must answer within 1 s. It calls a cache (P99 5 ms), then a database (P99 120 ms), then a recommendation service (P99 250 ms) sequentially, and the recommendations are optional. Propose timeouts.

<details>
<summary>Answer</summary>

For example: cache 50 ms (fall back to the database on timeout), database 300 ms, recommendations 300 ms with a fallback of "no recommendations". Worst case ≈ 650 ms plus processing, inside the 1 s budget; the optional call can never make the endpoint fail.

</details>
