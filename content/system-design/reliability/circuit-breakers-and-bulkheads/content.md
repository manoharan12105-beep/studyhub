# Circuit Breakers, Bulkheads and Fallbacks

**Module:** Reliability and Resilience · **Interview priority:** Core

## What Is It?

Three patterns that stop one failing dependency from taking down everything that calls it:

- **Circuit breaker:** after a dependency fails repeatedly, stop calling it for a while and fail immediately instead, then test carefully whether it has recovered. Named after the electrical breaker that cuts a circuit to prevent a fire.
- **Bulkhead:** give each dependency (or class of work) its **own limited pool** of resources — threads, connections, queue slots — so one cannot consume them all. Named after the watertight compartments in a ship's hull.
- **Fallback:** what to return when a call fails or the breaker is open — a cached value, a default, a reduced response.

## Why It Exists

When a dependency becomes slow, every caller waits up to its timeout; requests pile up (Little's law), threads and connections run out, and the caller stops serving **all** requests, including those that never touch the slow dependency. Its callers then fail in turn — a **cascading failure**. Retries make it worse. These patterns contain the damage.

## How It Works

### The circuit breaker state machine

```text
          failures ≥ threshold                     cool-down elapsed
 CLOSED ───────────────────────────► OPEN ──────────────────────────► HALF-OPEN
   ▲  (calls pass through;            (calls fail fast;                (a few trial calls pass)
   │   failures counted)               fallback served)                   │        │
   │                                       ▲                       success│        │failure
   └───────────────────────────────────────┼───────────────────────────────┘        │
                                           └────────────────────────────────────────┘
```

- **Closed:** normal operation; failures (errors, timeouts) are counted — consecutive failures, or a failure **rate** over a sliding window (for example over 50 % of the last 100 calls).
- **Open:** calls are rejected immediately without touching the dependency, which gets time to recover, and callers stop wasting threads.
- **Half-open:** after a cool-down, a limited number of trial calls go through. Success closes the circuit; failure reopens it.

```java
import java.util.function.LongPredicate;

public class CircuitBreakerDemo {

    enum State { CLOSED, OPEN, HALF_OPEN }

    /** Opens after `threshold` consecutive failures; after `openMillis` lets one trial call through. */
    static final class CircuitBreaker {
        private final int threshold;
        private final long openMillis;
        private State state = State.CLOSED;
        private int consecutiveFailures;
        private long openedAt;

        CircuitBreaker(int threshold, long openMillis) {
            this.threshold = threshold;
            this.openMillis = openMillis;
        }

        String call(long now, LongPredicate dependency) {
            if (state == State.OPEN) {
                if (now - openedAt < openMillis) {
                    return "OPEN      -> rejected instantly, fallback served";
                }
                state = State.HALF_OPEN;                 // cool-down over: allow one trial call
            }
            boolean ok = dependency.test(now);
            if (ok) {
                consecutiveFailures = 0;
                String before = state.name();
                state = State.CLOSED;
                return String.format("%-9s -> success%s", before, before.equals("HALF_OPEN") ? ", circuit CLOSED again" : "");
            }
            consecutiveFailures++;
            String before = state.name();
            if (state == State.HALF_OPEN || consecutiveFailures >= threshold) {
                state = State.OPEN;
                openedAt = now;
                return String.format("%-9s -> failure, circuit OPENS", before);
            }
            return String.format("%-9s -> failure %d of %d", before, consecutiveFailures, threshold);
        }
    }

    public static void main(String[] args) {
        CircuitBreaker breaker = new CircuitBreaker(3, 5_000);
        LongPredicate dependency = now -> now >= 8_000;   // down until t = 8 s, healthy afterwards
        for (long t = 0; t <= 12_000; t += 1_000) {
            System.out.printf("t=%2d s  %s%n", t / 1_000, breaker.call(t, dependency));
        }
    }
}
```

**Output:**

```text
t= 0 s  CLOSED    -> failure 1 of 3
t= 1 s  CLOSED    -> failure 2 of 3
t= 2 s  CLOSED    -> failure, circuit OPENS
t= 3 s  OPEN      -> rejected instantly, fallback served
t= 4 s  OPEN      -> rejected instantly, fallback served
t= 5 s  OPEN      -> rejected instantly, fallback served
t= 6 s  OPEN      -> rejected instantly, fallback served
t= 7 s  HALF_OPEN -> failure, circuit OPENS
t= 8 s  OPEN      -> rejected instantly, fallback served
t= 9 s  OPEN      -> rejected instantly, fallback served
t=10 s  OPEN      -> rejected instantly, fallback served
t=11 s  OPEN      -> rejected instantly, fallback served
t=12 s  HALF_OPEN -> success, circuit CLOSED again
```

Notice the trade-off: the dependency recovered at 8 s, but the breaker kept rejecting until its next trial at 12 s. A longer cool-down protects the dependency more; a shorter one recovers sooner. Production libraries (Resilience4j in Java, service-mesh proxies) count failure rates over windows and are thread-safe; this demo is single-threaded.

### Bulkheads

```text
Without bulkheads:   one pool of 200 threads ── recommendations slow ──► all 200 threads stuck → checkout fails too
With bulkheads:      checkout pool 100 │ search pool 60 │ recommendations pool 40
                     recommendations slow → only its 40 are stuck; checkout and search keep working
```

Implement with separate thread pools or semaphores (limit concurrent calls per dependency), separate connection pools, separate queues and worker fleets, or even separate deployments for critical and non-critical traffic.

### Fallbacks

| Situation | Fallback |
|-----------|----------|
| Recommendations down | Show bestsellers or nothing |
| Profile service slow | Show cached profile data (possibly stale) |
| Price service down | Show the cached price but re-check at checkout; or disable "buy" |
| Payment provider down | Queue the order for later processing, or switch to a second provider |

A fallback must be cheap and safe — never one that hammers another struggling component — and must not hide errors from monitoring. See [Graceful Degradation](../graceful-degradation-and-load-shedding/content.md).

**Think about it:** the recommendations service starts taking 20 s per request. The product page calls it with a 30 s timeout, no breaker, and one shared thread pool. Describe what happens over the next minute.

<details>
<summary>Answer</summary>

Each product-page request holds a thread for 20 s. At, say, 100 requests/s, about 2,000 threads would be needed (Little's law); the pool is exhausted within seconds, so **every** page — including checkout — queues and times out. Load balancers mark instances unhealthy; the outage spreads. Fix: a 300 ms timeout, a circuit breaker that opens after repeated failures, a bulkhead limiting concurrent recommendation calls, and a fallback of "no recommendations".

</details>

## Comparison

| | Timeout | Retry | Circuit breaker | Bulkhead |
|---|---------|-------|-----------------|----------|
| Protects against | Waiting forever | Transient failures | Repeatedly calling a broken dependency | One dependency consuming all resources |
| Effect on load | Frees resources | **Adds** load | Removes load from the failing dependency | Caps load per dependency |
| Used with | Everything | Backoff, jitter, idempotency | Fallbacks, timeouts | Timeouts, breakers |

## Common Traps

> [!WARNING]
> **Common trap:** a fallback that calls another overloaded service, or retries inside an open circuit. Fallbacks must be cheap and local (cache, default), and open circuits must actually stop calls.

## Interview Follow-up

- *"How do you prevent cascading failures in microservices?"* Timeouts on every call, limited retries with backoff, circuit breakers per dependency, bulkheads isolating resources, fallbacks for non-critical features, and load shedding at the edge.

## Key Takeaways

- Slow dependencies cause cascading failures by exhausting callers' threads and connections.
- Circuit breakers: closed → open after failures (fail fast) → half-open trials → closed.
- Bulkheads give each dependency its own resource limits so one cannot sink the rest.
- Fallbacks keep the user experience working in reduced form; they must be cheap and safe.
