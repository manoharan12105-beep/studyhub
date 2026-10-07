# Timeouts, Retries, Backoff and Jitter — Interview Questions

## Beginner

### Q1. Why does every network call need a timeout?

**Style:** Why

<details>
<summary>Answer</summary>

Without one, a call to a dead or hung dependency waits indefinitely, holding a thread, a connection and memory. As more requests pile up, the caller runs out of resources and stops responding too, spreading the failure upstream. A timeout bounds how long a failure can tie up resources and lets the caller fail fast or fall back.

</details>

### Q2. What is exponential backoff?

**Style:** Direct

<details>
<summary>Answer</summary>

Increasing the wait between retries exponentially — for example 100 ms, 200 ms, 400 ms, 800 ms — up to a maximum, so a struggling dependency gets progressively more time to recover instead of being hit with constant retries.

</details>

### Q3. Why add jitter to backoff?

**Style:** Why

<details>
<summary>Answer</summary>

If many clients fail at the same moment (a dependency restart) and use the same backoff schedule, their retries arrive in synchronised waves that can knock the dependency over again. Randomising each wait spreads retries over time, smoothing the load.

</details>

## Intermediate

### Q4. Which errors should be retried and which should not?

**Style:** How

<details>
<summary>Answer</summary>

Retry transient failures: connection errors, timeouts, 503 and 429 (respecting `Retry-After`), and throttling errors — but only for idempotent operations or those protected by idempotency keys. Do not retry client errors (400, 401, 403, 404, 422), validation failures, or non-idempotent operations without protection, because the retry will fail again or duplicate side effects.

</details>

### Q5. What is a retry storm?

**Style:** Direct

<details>
<summary>Answer</summary>

A surge of load caused by retries: when a dependency slows down, callers retry, and if several layers each retry, attempts multiply (3 layers × 4 attempts = up to 64 calls per user request). The extra traffic arrives exactly when the dependency is weakest, turning a brief slowdown into a prolonged outage.

</details>

### Q6. How do you choose a timeout value?

**Style:** How

<details>
<summary>Answer</summary>

From the dependency's observed latency distribution (a little above its normal P99) and the caller's own latency budget: the sum of sequential downstream timeouts plus processing must fit within the caller's deadline. Use separate connect and request timeouts, propagate remaining deadlines downstream, and revisit values as latency profiles change.

</details>

## Advanced

### Q7. How do you prevent retry amplification across a microservice call chain?

**Style:** Design

<details>
<summary>Answer</summary>

Retry at only one layer (often the edge or client), use retry budgets that cap retries to a small percentage of traffic, propagate deadlines so downstream services stop work the caller has abandoned, add circuit breakers to stop calling failing dependencies, respect load-shedding signals (429/503 with `Retry-After`), and make retried operations idempotent.

</details>

### Q8. A request timed out. Did the operation fail?

**Style:** Trap

<details>
<summary>Answer</summary>

Not necessarily. A timeout only means the caller stopped waiting: the request may have been lost, still in progress, or completed with the response lost. That ambiguity is why retries need idempotency, and why clients sometimes check the operation's status before retrying non-idempotent actions.

</details>
