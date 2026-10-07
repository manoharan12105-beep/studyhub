# Latency Percentiles: P50, P95, P99 — Interview Questions

## Beginner

### Q1. What does "P99 latency is 500 ms" mean?

**Style:** Direct

<details>
<summary>Answer</summary>

99 % of requests completed in 500 ms or less, and 1 % took longer. It describes the slow tail that a noticeable minority of requests experience.

</details>

### Q2. Why are percentiles better than averages for latency?

**Style:** Why

<details>
<summary>Answer</summary>

Latency distributions are skewed: most requests are fast and a few are very slow. The average is pulled up by outliers yet hides how slow they are, and often describes no real request. Percentiles show the typical experience (P50) and the tail (P95, P99) separately, which is what users feel and what SLOs should target.

</details>

## Intermediate

### Q3. Why can't you average P99 values from multiple servers?

**Style:** Trap

<details>
<summary>Answer</summary>

Percentiles are not linear: the fleet's P99 depends on the full combined distribution, including how many requests each server handled and how their tails overlap. Averaging per-server P99s can be far from the true value. Merge histograms (or raw distributions) and compute the percentile from the merged data.

</details>

### Q4. What causes tail latency?

**Style:** Direct

<details>
<summary>Answer</summary>

Garbage-collection pauses, cache misses and cold starts, lock contention, queueing when utilisation is high, noisy neighbours on shared hardware, background jobs (compaction, backups), network retransmissions, retries, and slow dependencies on some code paths.

</details>

## Advanced

### Q5. Why does fan-out make tail latency critical?

**Style:** Why

<details>
<summary>Answer</summary>

A request that waits for many parallel backend calls is as slow as the slowest one. If each backend exceeds its P99 1 % of the time, a request fanning out to 100 backends hits at least one slow response with probability 1 − 0.99¹⁰⁰ ≈ 63 %, so the tail of each backend becomes the typical latency of the whole request.

</details>

### Q6. How would you reduce tail latency in a fan-out service?

**Style:** Design

<details>
<summary>Answer</summary>

Send hedged (backup) requests to another replica when the first exceeds, say, the P95; use timeouts and return partial results when acceptable; reduce fan-out width (aggregate data, cache results); reduce variance in backends (avoid GC pauses, isolate background work, keep utilisation moderate); and route away from slow replicas based on latency (least response time).

</details>
