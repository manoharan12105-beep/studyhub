# Latency Percentiles: P50, P95, P99

**Module:** Observability and Operations · **Interview priority:** Core

## What Is It?

A **percentile** of latency is the value below which a given percentage of requests fall:

- **P50** (the median): half the requests are faster than this.
- **P90 / P95:** 90 % / 95 % of requests are faster.
- **P99:** 99 % are faster — only 1 in 100 is slower. **P99.9** for 1 in 1,000.

The slow end of the distribution (P99 and above) is called the **tail latency**.

## Why It Exists

Averages lie. Ten response times in seconds:

```text
1, 2, 2, 3, 4, 4, 5, 8, 12, 27
average = 68 ÷ 10 = 6.8 s       P50 = 4 s       P90 = 12 s       P99 = 27 s
```

The average (6.8 s) describes **no actual request**: most requests took 4 s or less, while a few took 12 and 27 s. One extreme outlier pulls the average up while hiding how bad the slow requests are. Percentiles show both the typical experience (P50) and the bad one (P90/P99). A large gap between P50 and P90 means some requests or code paths need fixing.

## How It Works

### Computing a percentile (nearest-rank method)

Sort the values; the P-th percentile is the value at position `ceil(P/100 × n)`:

```text
sorted: 1, 2, 2, 3, 4, 4, 5, 8, 12, 27   (n = 10)
P50 → position ceil(0.50 × 10) = 5 → 4
P90 → position ceil(0.90 × 10) = 9 → 12
P99 → position ceil(0.99 × 10) = 10 → 27
```

Real monitoring systems compute percentiles from **histograms** (counts per latency bucket) and interpolate, because storing every value is too expensive. Two rules follow:

- **You cannot average percentiles.** The P99 of a fleet is not the average of each server's P99; compute it from merged histograms.
- **Small samples make high percentiles noisy.** A P99.9 needs thousands of requests in the window to mean anything.

### Why the tail matters more than it seems

- **Heavy users hit it constantly.** A user who loads 100 resources per page will almost certainly experience a P99 request on every page view.
- **Fan-out amplifies it.** If a request calls 100 backends in parallel and must wait for all, and each backend is slow 1 % of the time:

```text
P(at least one slow) = 1 − 0.99^100 ≈ 63 %
```

Most user requests become slow even though each backend is "fast 99 % of the time". Large systems therefore track P99 and P99.9 and use techniques such as **hedged requests** (send a backup request if the first is slow), timeouts with partial results, and fewer serial hops.

- **Tail causes:** garbage-collection pauses, cache misses, cold instances, lock contention, noisy neighbours, retries, queueing at high utilisation.

### Using percentiles in SLOs

State latency objectives as percentiles over a window: "P99 of `/checkout` under 400 ms over 30 days", together with an error objective. Alert when the percentile breaches its target for a sustained period ([Monitoring and Alerting](../monitoring-and-alerting/content.md)).

**Think about it:** a service's average latency improved from 120 ms to 90 ms after a release, yet complaints increased. How is that possible?

<details>
<summary>Answer</summary>

The change made most requests faster (lowering P50 and the average) but made some slower — for example a new cache that speeds up hits while misses now do extra work, or GC pauses from higher memory use. P99 may have risen from 400 ms to 2 s; users hitting the tail complain. Always compare percentiles, not just averages.

</details>

## Comparison

| | Average (mean) | P50 (median) | P95 / P99 |
|---|----------------|--------------|-----------|
| Describes | Sum ÷ count | Typical request | Slow requests (the tail) |
| Sensitive to outliers | Very | No | Designed to show them |
| Use for | Capacity maths (throughput × time) | Typical user experience | SLOs, alerts, user pain |

## Common Traps

> [!WARNING]
> **Common trap:** reporting average latency as the main metric, or averaging per-server P99s to get a fleet P99. Use percentiles computed from merged distributions.

## Interview Follow-up

- *"What does P99 = 800 ms mean?"* 99 % of requests completed in 800 ms or less; 1 % took longer.

## Key Takeaways

- P50 is the typical request; P95/P99 describe the tail. Averages hide both.
- Nearest-rank: sort and take position ceil(P/100 × n); production systems use histograms.
- Do not average percentiles; high percentiles need enough samples.
- Tail latency dominates for heavy users and fan-out requests — track P99/P99.9 and design to reduce it.
