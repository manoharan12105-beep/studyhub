# Timeouts, Retries, Backoff and Jitter

**Module:** Reliability and Resilience · **Interview priority:** Core

## What Is It?

Four tools for calling something over a network that may be slow or fail:

- **Timeout:** the maximum time to wait for a response before giving up.
- **Retry:** trying the call again after a failure, because many failures are **transient** (a dropped packet, a restarting instance, a brief overload).
- **Exponential backoff:** waiting longer before each retry — 100 ms, 200 ms, 400 ms, 800 ms … — up to a cap.
- **Jitter:** adding randomness to those waits so many clients do not retry at the same instant.

## Why It Exists

Without a timeout, a caller waiting on a dead dependency holds a thread, a connection and memory indefinitely; enough such calls and the caller itself stops responding — the failure spreads upstream. Without retries, every transient blip becomes a user-visible error. But **careless retries are dangerous**: they multiply load on a dependency that is already struggling.

## How It Works

### Timeouts

- **Every network call gets one** — HTTP clients, database drivers, cache clients, queue clients. Many libraries default to "wait forever" or very long values.
- Set separate **connect** and **read/request** timeouts.
- Derive them from the **latency budget**: if the user-facing SLO is 800 ms, a downstream call cannot be allowed 30 s. Base them on the dependency's observed P99 latency plus margin.
- Propagate **deadlines**: if the caller has 300 ms left, downstream calls should not wait longer than that.

### What to retry — and what not to

| Retry | Do not retry |
|-------|--------------|
| Connection failures, timeouts on **idempotent** operations | Client errors (400, 401, 403, 404, 422) — they will fail again |
| `503 Service Unavailable`, `429 Too Many Requests` (respecting `Retry-After`) | Non-idempotent operations (charging a card) **unless** protected by an idempotency key |
| Throttling and transient overload errors | Errors that indicate a bug or bad data |

A timed-out request may have **succeeded** on the server; retrying a non-idempotent call can do it twice. See [Idempotency](../idempotency-in-distributed-systems/content.md).

### Exponential backoff with jitter

```text
wait = random(0, min(cap, base × 2^retry))        "full jitter"
base = 100 ms, cap = 2 s:   retry 1 ≤ 100 ms, retry 2 ≤ 200 ms, retry 3 ≤ 400 ms, retry 4 ≤ 800 ms …
```

Backoff gives the dependency time to recover; jitter spreads retries out so they do not arrive as synchronised waves. Always cap the number of attempts (3–5 is common) or the total time.

```java
import java.util.Random;
import java.util.function.IntPredicate;

public class RetryWithBackoffDemo {

    static final long BASE_DELAY_MS = 100;
    static final long MAX_DELAY_MS = 2_000;
    static final int MAX_ATTEMPTS = 5;

    /**
     * Calls `operation` until it succeeds or MAX_ATTEMPTS is reached.
     * Between attempts it waits a random time in [0, min(MAX, BASE * 2^retry)] ("full jitter").
     * The wait is printed instead of slept, so the demo runs instantly.
     */
    static boolean callWithRetry(IntPredicate operation, Random random) {
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            if (operation.test(attempt)) {
                System.out.println("attempt " + attempt + ": success");
                return true;
            }
            if (attempt == MAX_ATTEMPTS) {
                System.out.println("attempt " + attempt + ": failed, giving up");
                return false;
            }
            long ceiling = Math.min(MAX_DELAY_MS, BASE_DELAY_MS << (attempt - 1));
            long delay = (long) (random.nextDouble() * ceiling);
            System.out.printf("attempt %d: failed, backoff ceiling %4d ms, wait %4d ms%n", attempt, ceiling, delay);
        }
        return false;
    }

    public static void main(String[] args) {
        Random random = new Random(42);   // fixed seed: the same "random" waits on every run

        System.out.println("Dependency recovers on attempt 4:");
        callWithRetry(attempt -> attempt >= 4, random);

        System.out.println("Dependency is down:");
        callWithRetry(attempt -> false, random);
    }
}
```

**Output:**

```text
Dependency recovers on attempt 4:
attempt 1: failed, backoff ceiling  100 ms, wait   72 ms
attempt 2: failed, backoff ceiling  200 ms, wait  136 ms
attempt 3: failed, backoff ceiling  400 ms, wait  123 ms
attempt 4: success
Dependency is down:
attempt 1: failed, backoff ceiling  100 ms, wait   27 ms
attempt 2: failed, backoff ceiling  200 ms, wait  133 ms
attempt 3: failed, backoff ceiling  400 ms, wait  361 ms
attempt 4: failed, backoff ceiling  800 ms, wait  295 ms
attempt 5: failed, giving up
```

The ceiling doubles each time; the actual wait is a random point below it, so a thousand clients failing together spread their retries across the window instead of retrying in lockstep.

### Retry storms

Retries multiply. If each of three layers retries 3 times (4 attempts), one user request can become **4 × 4 × 4 = 64** calls to the bottom service — exactly when it is overloaded:

```text
user → API (4 attempts) → orders service (4 each) → database proxy (4 each) = up to 64 database calls
```

Defences:

- **Retry at one layer** (usually the outermost or the client), not at every layer.
- **Retry budgets:** allow retries only up to, say, 10 % of normal traffic per client.
- **Circuit breakers** stop calling a dependency that keeps failing ([Circuit Breakers](../circuit-breakers-and-bulkheads/content.md)).
- Honour `Retry-After` and server-side load shedding signals.

**Think about it:** a payment API call times out after 5 s. Should the client retry `POST /payments`?

<details>
<summary>Answer</summary>

Only with an idempotency key. The timeout does not mean the payment failed — it may have been processed and only the response was lost. With an idempotency key, the retry returns the original outcome; without one, retrying risks charging twice. The client could also query the payment status before retrying.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** "Retries make the system more reliable." Unbounded, immediate or multi-layer retries turn a brief slowdown into an outage. Retry only transient errors, only idempotent operations, with capped exponential backoff, jitter and a budget.

## Interview Follow-up

- *"A dependency is slow and your service is falling over. Why?"* No or long timeouts let requests pile up and exhaust threads and connections (Little's law); retries add more load. Set timeouts from the latency budget, limit retries, add a circuit breaker and a fallback.

## Key Takeaways

- Every network call needs a timeout derived from the latency budget; propagate deadlines.
- Retry only transient failures of idempotent operations (or use idempotency keys).
- Use exponential backoff with a cap and jitter, and limit attempts.
- Retries multiply across layers into retry storms — retry in one place, with budgets and circuit breakers.
