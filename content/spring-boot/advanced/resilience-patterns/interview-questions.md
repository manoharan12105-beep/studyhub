# Resilience: Retry, Circuit Breaker and Timeouts — Interview Questions

## Beginner

### Q1. What is a circuit breaker?

<details>
<summary>Answer</summary>

A pattern that monitors calls to a dependency and, when failures or slow calls exceed a threshold, "opens" to reject calls immediately (using a fallback) for a while, protecting both the caller and the struggling dependency. After a wait it lets a few trial calls through ("half-open") and closes again if they succeed.

</details>

### Q2. When should you retry a failed call?

<details>
<summary>Answer</summary>

When the failure is likely transient (timeouts, connection resets, 503/429) and the operation is idempotent or protected by an idempotency key. Use a small number of retries with exponential backoff and jitter; do not retry client errors such as 400 or 404.

</details>

### Q3. Why are timeouts important?

<details>
<summary>Answer</summary>

Without them, a slow or hung dependency keeps request threads (and database connections) waiting indefinitely, exhausting resources and causing cascading failures. Connect and read timeouts bound the damage and let circuit breakers and fallbacks act.

</details>

## Intermediate

### Q4. How do you implement retries in Spring Boot?

<details>
<summary>Answer</summary>

On Spring Framework 7 / Boot 4: `@EnableResilientMethods` and `@Retryable(includes = …, maxRetries = …, delay = …, multiplier = …)` on a bean method (or `RetryTemplate`). On Boot 3: Spring Retry (`@EnableRetry`, `@Retryable`, `@Recover`) or Resilience4j's `@Retry`. All are proxy-based, so self-invocation is not retried.

</details>

### Q5. What is the difference between retry and circuit breaker?

<details>
<summary>Answer</summary>

Retry repeats a failed call hoping it succeeds — useful for brief glitches but increases load. A circuit breaker stops calling a dependency that is failing persistently, failing fast to reduce load and latency. They are combined: limited retries inside a circuit breaker.

</details>

### Q6. What is the bulkhead pattern?

<details>
<summary>Answer</summary>

Isolating resources per dependency — separate thread pools or concurrency limits — so that a slow dependency can consume only its share, not all request threads. In Spring Framework 7, `@ConcurrencyLimit` provides a simple per-method limit; Resilience4j offers semaphore and thread-pool bulkheads.

</details>

## Advanced

### Q7. Why can retries make an outage worse?

<details>
<summary>Answer</summary>

Each retry multiplies traffic to an already overloaded dependency; with retries at several layers the multiplication compounds (3 × 3 × 3 = 27 calls). Synchronised retries without jitter create spikes. Mitigate with few retries, backoff with jitter, retry budgets, circuit breakers and respecting `Retry-After`.

</details>

### Q8. A downstream pricing service is slow. Design the calling side.

<details>
<summary>Answer</summary>

Use a client with a 2–3 s read timeout; wrap calls in a circuit breaker (e.g. 50 % failure/slow-call rate over 20 calls opens for 30 s); allow 1–2 retries with jittered backoff for idempotent GETs only; limit concurrency with a bulkhead; fall back to cached prices (with a staleness indicator) or a clear "temporarily unavailable" error; expose metrics for breaker state, retries and latency, and alert when the breaker opens.

</details>
