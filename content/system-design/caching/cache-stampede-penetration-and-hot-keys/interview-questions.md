# Cache Stampede, Penetration and Hot Keys — Interview Questions

## Beginner

### Q1. What is a cache stampede?

**Style:** Direct

<details>
<summary>Answer</summary>

When a popular cache entry expires or is evicted, many concurrent requests miss at the same time and all query the backend to rebuild the same value, overloading the database — sometimes slowing it so much that the cache cannot be refilled, causing a cascading failure.

</details>

### Q2. How do you prevent a cache stampede?

**Style:** How

<details>
<summary>Answer</summary>

Let only one request rebuild a missing key while others wait or receive the stale value (request coalescing / single flight, possibly with a short distributed lock); serve stale data while refreshing in the background; refresh hot keys before they expire; add random jitter to TTLs so keys do not expire together; and pre-warm hot keys before traffic spikes.

</details>

## Intermediate

### Q3. What is cache penetration and how do you defend against it?

**Style:** How

<details>
<summary>Answer</summary>

Requests for keys that do not exist in the database always miss the cache and reach the database, which attackers can exploit. Defend by caching negative results briefly, using a Bloom filter of valid keys to reject impossible lookups early, validating input formats, and rate-limiting clients that generate many misses.

</details>

### Q4. What is a hot key, and why can it overload a cache cluster that has spare capacity?

**Style:** Why

<details>
<summary>Answer</summary>

A single key receiving a very large share of requests. In a partitioned cache, each key lives on one node (plus maybe replicas), so all its traffic lands on that node's CPU and network, regardless of how idle the other nodes are. Partitioning spreads keys, not the load of one key.

</details>

### Q5. Why does a Bloom filter help with penetration, and what is its limitation?

**Style:** Trade-off

<details>
<summary>Answer</summary>

It answers "is this key possibly in the set?" using little memory: a "no" is always correct, so requests for keys that cannot exist are rejected without a database query. Its limitation is false positives — some non-existent keys are reported as possibly present and still reach the database — and standard Bloom filters do not support deletion (counting variants do), so they must be rebuilt as data changes.

</details>

## Advanced

### Q6. A viral post's cache key gets 500,000 reads per second. Design the mitigation.

**Style:** Design

<details>
<summary>Answer</summary>

Detect it from per-key metrics, then: cache it in each application server's local memory for a few seconds (cutting cache-tier traffic to a handful of requests per server), replicate the key under several suffixes on different cache nodes and read a random copy, add read replicas for that shard, and coalesce misses so expiry triggers one rebuild. If the like count is also hot for writes, aggregate increments locally or in sharded counters and flush periodically.

</details>

### Q7. How does "stale-while-revalidate" work, and what does it trade?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Each entry has a soft expiry and a hard expiry. Between them, readers receive the cached (slightly stale) value immediately while one background task refreshes it; only after the hard expiry do reads block on the backend. It removes stampedes and latency spikes on hot keys at the cost of serving data up to the hard expiry old — fine for feeds and listings, not for data requiring freshness.

</details>
