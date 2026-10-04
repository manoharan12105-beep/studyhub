# Caching Strategies and Redis — Interview Questions

## Beginner

### Q1. What is caching and when should you use it?

<details>
<summary>Answer</summary>

Storing results of expensive operations so subsequent requests can reuse them. Use it for data that is read often, changes rarely, is expensive to produce, and can tolerate brief staleness — catalogues, configuration, reference data, aggregated reports.

</details>

### Q2. What is the cache-aside pattern?

<details>
<summary>Answer</summary>

The application checks the cache first; on a miss it loads from the database and stores the result in the cache. On updates it writes to the database and evicts (or updates) the cache entry. Spring's `@Cacheable` and `@CacheEvict` implement this pattern.

</details>

### Q3. What is Redis used for in Spring Boot applications?

<details>
<summary>Answer</summary>

As a distributed cache shared by all instances (via `RedisCacheManager`), as a session store (Spring Session), for rate limiting and counters (atomic `INCR` with TTL), distributed locks, pub/sub and short-lived tokens (OTPs, refresh-token denylists).

</details>

## Intermediate

### Q4. Local cache or Redis — how do you decide?

<details>
<summary>Answer</summary>

Local caches are fastest and simplest but each instance has its own copy, so updates on one instance leave others stale — fine for small, rarely changing reference data with a short TTL. Redis adds a network hop and operational cost but gives one consistent copy across instances and survives restarts — needed for shared mutable data, sessions and rate limits.

</details>

### Q5. What is a cache stampede and how do you prevent it?

<details>
<summary>Answer</summary>

When a popular entry expires, many concurrent requests miss at once and all hit the database to rebuild it, potentially overloading it. Mitigations: let only one request rebuild the value (`@Cacheable(sync = true)` for a local per-instance lock, or a distributed lock), randomise TTLs (jitter), refresh entries before expiry, or serve stale data while refreshing.

</details>

### Q6. How do you keep cached data consistent with the database?

<details>
<summary>Answer</summary>

Evict (or update) the cache when the data changes — ideally after the transaction commits so readers cannot repopulate it with old data — and set a TTL as a safety net. With multiple instances, use a distributed cache or broadcast invalidation messages. Accept that caches are eventually consistent and do not cache data that must always be current.

</details>

## Advanced

### Q7. Why is it risky to cache JPA entities?

<details>
<summary>Answer</summary>

Cached entities are detached and may contain uninitialised lazy proxies (causing `LazyInitializationException` later), carry mutable state shared across requests, and serialise poorly into Redis (proxies, cycles). Cache immutable DTOs/records built for the use case instead.

</details>

### Q8. How would you implement API rate limiting with Redis?

<details>
<summary>Answer</summary>

Use a key per client and time window, e.g. `rate:{apiKey}:{minute}`, increment it atomically with `INCR` and set a TTL on first increment; reject with 429 when the count exceeds the limit. For smoother limits use a sliding window (sorted sets) or a token bucket implemented with a Lua script so the check-and-update is atomic across instances.

</details>
