# Resilience: Retry, Circuit Breaker and Timeouts — Practice

### P1. Retry or not?

**Difficulty:** Easy · **Type:** MCQ

Which failure should be retried automatically?

- A) 400 Bad Request from the payment API
- B) 404 Not Found for a customer id
- C) 503 Service Unavailable from a courier API on an idempotent GET
- D) 401 Unauthorized

<details>
<summary>Answer</summary>

**Answer:** C) 503 Service Unavailable from a courier API on an idempotent GET

</details>

### P2. Count the attempts

**Difficulty:** Easy · **Type:** Behavior

With Framework 7's `@Retryable(maxRetries = 4)`, how many times is the method invoked if it always fails?

<details>
<summary>Answer</summary>

Five: one initial attempt plus four retries; then the last exception is rethrown.

</details>

### P3. Breaker states

**Difficulty:** Medium · **Type:** Conceptual

Describe what happens to calls in each circuit breaker state.

<details>
<summary>Answer</summary>

CLOSED: calls go through; outcomes are recorded. OPEN: calls are rejected immediately (fallback) until the wait duration elapses. HALF_OPEN: a limited number of trial calls go through; if they succeed the breaker closes, if they fail it opens again.

</details>
