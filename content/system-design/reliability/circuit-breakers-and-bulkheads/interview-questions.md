# Circuit Breakers, Bulkheads and Fallbacks — Interview Questions

## Beginner

### Q1. What is a circuit breaker in software?

**Style:** Direct

<details>
<summary>Answer</summary>

A wrapper around calls to a dependency that tracks failures. After failures exceed a threshold it "opens" and rejects calls immediately (serving a fallback) for a cool-down period, then "half-opens" to allow trial calls; success closes it, failure reopens it. It protects callers from waiting on a broken dependency and gives the dependency time to recover.

</details>

### Q2. What is a cascading failure?

**Style:** Direct

<details>
<summary>Answer</summary>

A failure in one component that spreads to others: a slow or failed dependency causes its callers to exhaust threads, connections or memory while waiting (and to retry), so they fail too, and their callers fail in turn, until a large part of the system is down.

</details>

## Intermediate

### Q3. Explain the three states of a circuit breaker.

**Style:** How

<details>
<summary>Answer</summary>

Closed: calls pass through and failures are counted (consecutive failures or a failure rate in a window). Open: calls fail immediately without reaching the dependency, for a configured cool-down. Half-open: after the cool-down a limited number of trial calls are allowed; if they succeed the breaker closes, if they fail it opens again.

</details>

### Q4. What is the bulkhead pattern?

**Style:** Direct

<details>
<summary>Answer</summary>

Partitioning resources — thread pools, connection pools, semaphores, queues, even deployments — per dependency or per type of work, so that exhaustion in one partition (a slow recommendations service) cannot starve the others (checkout, search). Like watertight compartments, a leak floods only one section.

</details>

### Q5. Circuit breaker vs retry — how do they interact?

**Style:** Comparison

<details>
<summary>Answer</summary>

Retries handle brief, transient failures by trying again, which adds load; circuit breakers handle sustained failures by stopping calls, which removes load. They work together: retries with backoff for occasional errors, and a breaker around them so that when failures persist, retries stop instead of hammering the dependency. Retries must never bypass an open breaker.

</details>

## Advanced

### Q6. How would you choose circuit breaker thresholds and cool-down times?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Base thresholds on failure rate over a sliding window with a minimum number of calls (so a few errors at low traffic don't trip it), include slow calls above a latency threshold as failures, and pick a cool-down that gives the dependency time to recover (seconds to tens of seconds). Too sensitive and it trips on noise, causing unnecessary degradation; too lax and it reacts after resources are already exhausted; too long a cool-down delays recovery. Tune from observed behaviour and test with fault injection.

</details>

### Q7. Design resilience for a product page that calls price, inventory, reviews and recommendations services.

**Style:** Design

<details>
<summary>Answer</summary>

Call independent services in parallel with per-call timeouts within the page's latency budget; give each its own bulkhead (concurrency limit) and circuit breaker. Classify criticality: price and inventory are essential (fall back to cached values, re-validated at checkout, or show "unavailable" for purchase), reviews and recommendations are optional (fall back to empty or cached content). Monitor fallback rates and breaker states so degradation is visible.

</details>
