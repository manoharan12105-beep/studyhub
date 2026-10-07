# Caching Fundamentals — Interview Questions

## Beginner

### Q1. What is a cache, and what are a cache hit and a cache miss?

**Style:** Direct

<details>
<summary>Answer</summary>

A cache is a small, fast store holding copies of data that is expensive to fetch or compute. A hit means the requested data is in the cache and is returned quickly; a miss means it is not, so the system fetches it from the slower source and usually stores it in the cache for next time.

</details>

### Q2. Why do systems use caches?

**Style:** Why

<details>
<summary>Answer</summary>

To reduce latency (memory is far faster than disk or a remote query), to reduce load on databases and services that are hard or expensive to scale, to absorb read spikes on popular data, and to cut cost by doing expensive work once and reusing the result.

</details>

### Q3. What kind of data is a good candidate for caching?

**Style:** Direct

<details>
<summary>Answer</summary>

Data that is read frequently, changes rarely, is expensive to produce and is reasonably small: trending posts, product pages, profile cards, configuration, computed results, sessions. Poor candidates change on every read, are read once, are huge, or must be exactly current for the decision being made.

</details>

## Intermediate

### Q4. Why not cache the entire database in memory?

**Style:** Why not

<details>
<summary>Answer</summary>

Memory costs much more than disk, a cache that holds everything is a second database you must keep consistent, and it is unnecessary: a small hot subset of keys receives most of the traffic. Caches stay small, hold the hot set, and evict the rest.

</details>

### Q5. What is the hit ratio and why does it matter so much?

**Style:** Why

<details>
<summary>Answer</summary>

Hits divided by total lookups. Backend load is proportional to the miss ratio, so going from 95 % to 90 % doubles database load (5 % → 10 % of reads), and average latency rises toward the backend's latency. Monitoring the hit ratio is essential for capacity planning.

</details>

### Q6. Name the layers where caching can happen.

**Style:** Direct

<details>
<summary>Answer</summary>

Client (browser HTTP cache, app memory), edge (CDN), application (in-process local caches), shared cache tier (Redis, Memcached), and inside the database (buffer pool, OS page cache). Each saves a different cost: round trips, distance, network hops, queries or disk reads.

</details>

## Advanced

### Q7. Your cache tier fails and the database collapses. How do you design to survive cache loss?

**Style:** What happens if

<details>
<summary>Answer</summary>

Replicate the cache (primary/replica with automatic failover) and spread keys across nodes so one failure loses only part of the cache; size the database or replicas to tolerate a degraded hit ratio; collapse concurrent misses per key into one backend request; warm caches before routing traffic; shed or rate-limit load and serve degraded responses when the backend is saturated; and alert on hit-ratio drops.

</details>

### Q8. When would caching be the wrong fix for a slow endpoint?

**Style:** Trade-off

<details>
<summary>Answer</summary>

When the slowness comes from a missing index or inefficient query (fix it — misses still pay the cost), when data changes on almost every read (low hit ratio, constant invalidation), when each request asks for unique data (no reuse), or when correctness requires the latest value, such as stock levels at purchase time.

</details>
