# Graceful Degradation and Load Shedding

**Module:** Reliability and Resilience · **Interview priority:** Frequently asked

## What Is It?

- **Graceful degradation:** when parts of the system fail or are overloaded, keep the **core** function working in reduced form instead of failing completely. A shop that cannot show recommendations still lets you buy.
- **Load shedding:** when incoming load exceeds capacity, deliberately **reject some requests early and cheaply** (preferably the least important ones) so the rest are served well, instead of slowing down for everyone until everything times out.

## Why It Exists

An overloaded system without protection does not degrade linearly — it collapses. Queues grow, latency exceeds client timeouts, clients retry, and the system spends its capacity on requests whose callers have already given up ("goodput" falls toward zero). Serving 80 % of requests quickly beats serving 100 % of them too late to matter.

## How It Works

### Degrade by priority

Classify features before an incident:

| Tier | Example (e-commerce) | Under stress |
|------|----------------------|--------------|
| Critical | Browse, cart, checkout, payment | Protect at all costs |
| Important | Search filters, order history | Simplify (cached results, fewer filters) |
| Optional | Recommendations, reviews, "recently viewed", analytics | Turn off first |

Mechanisms:

- **Feature flags / kill switches** to disable expensive optional features instantly.
- **Fallbacks** with circuit breakers: cached or default content when a dependency fails ([Circuit Breakers](../circuit-breakers-and-bulkheads/content.md)).
- **Serve stale:** show the last cached version rather than an error.
- **Reduce quality:** lower image or video resolution, smaller page sizes, approximate counts.
- **Read-only mode:** keep reads working while writes are paused during a database incident.
- **Defer work:** queue non-urgent writes (emails, analytics) for later ([Backpressure](../../messaging/backpressure/content.md)).

### Shed load, early and cheaply

- **Admission control:** cap concurrent requests (or queue length) per instance; beyond it, return **503** (or 429) immediately with `Retry-After` — rejecting costs microseconds, serving late costs everything.
- **Prioritised shedding:** drop optional traffic (prefetches, background syncs, bots, analytics) before user-facing requests, and free-tier before paid where appropriate.
- **Deadline awareness:** drop requests whose client deadline has already passed instead of doing useless work.
- **Bounded queues:** a queue with no limit just converts overload into unbounded latency.
- **Rate limiting** per client protects against one client causing the overload ([Rate Limiting](../../communication/rate-limiting/content.md)).

Autoscaling helps with sustained growth but takes minutes; shedding handles the seconds-to-minutes gap and bursts that exceed any budget.

**Think about it:** during a sale, the API receives 2× its capacity. Option A: accept everything (unbounded queues). Option B: accept up to capacity and reject the excess with 503 immediately. Which serves more customers successfully, and why?

<details>
<summary>Answer</summary>

**Option B.** In A, queues grow without limit, every request waits longer than client timeouts, clients retry (adding more load), and nearly all requests fail or arrive too late — throughput of *useful* work collapses. In B, half the requests are served within their deadlines and the rest get a fast, retryable rejection (ideally retried with backoff and jitter), so the system keeps doing useful work at full capacity.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** treating every request as equally important, or making the fallback path heavier than the normal path. Decide priorities in advance and make degradation cheap.

## Interview Follow-up

- *"What happens to your design at 10× the expected traffic?"* Autoscale where possible; shed low-priority traffic and excess requests early with 503/429; turn off optional features; serve cached or stale data; protect the database with limits and queues.

## Key Takeaways

- Graceful degradation keeps the core working by disabling or simplifying non-critical features.
- Classify features into critical, important and optional before incidents; use flags, fallbacks, stale data and read-only modes.
- Load shedding rejects excess work early and cheaply so the remaining work succeeds; unbounded queues cause collapse.
- Combine shedding with rate limiting, autoscaling and backpressure.
