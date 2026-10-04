# Caching Strategies and Redis

**Module:** Production Spring Boot · **Interview priority:** Frequently asked

## Definition

**Caching** stores the result of an expensive operation (database query, remote call, computation) so later requests can reuse it quickly. A **cache** can be **local** (in the application's memory, e.g. Caffeine) or **distributed** (a separate server shared by all instances, e.g. **Redis**). Correct caching requires choosing **what** to cache, **how long** (TTL) and **how to keep it fresh** (invalidation).

## Why It Matters

- Caching is the cheapest big performance win for read-heavy endpoints (product catalogue, configuration, user profiles).
- It is also a classic source of bugs: stale data, inconsistent instances, memory blow-ups.
- Interviewers ask about strategies (cache-aside, write-through), TTL/invalidation, local vs distributed caches and Redis.

## Caching

What to cache:

| Good candidates | Poor candidates |
|-----------------|-----------------|
| Read often, change rarely (catalogue, categories, country lists) | Frequently changing data (stock levels, balances) |
| Expensive to compute or fetch (aggregates, external API responses) | Cheap primary-key lookups on an idle database |
| Same result for many users | Highly personalised, rarely repeated data |
| Tolerates short staleness | Must be strictly consistent (payments) |

Layers where caching happens: HTTP (browser/CDN with `Cache-Control`, `ETag`), application (Spring's cache abstraction, Redis), ORM (Hibernate second-level cache), database (buffer pool).

## Caching Strategies

| Strategy | How it works | Notes |
|----------|-------------|-------|
| **Cache-aside (lazy loading)** | Read: check cache → miss → load from DB → put in cache. Write: update DB → **evict** cache entry | Most common; what Spring's `@Cacheable` + `@CacheEvict` implement |
| Read-through | The cache itself loads missing entries via a loader | Caffeine `LoadingCache` |
| **Write-through** | Write to cache and DB together | Cache always fresh; slower writes (`@CachePut`) |
| Write-behind | Write to cache; flush to DB asynchronously | Fast writes; risk of data loss |
| Refresh-ahead | Refresh hot entries before they expire | Avoids latency spikes |

### TTL and invalidation

- **TTL (time to live)** bounds staleness: even if an eviction is missed, data is at most TTL old.
- **Explicit eviction** on writes keeps data fresh sooner.
- "There are only two hard things in computer science: cache invalidation and naming things." Prefer **evict on write** over updating the cache in place, and always set a TTL.

### Common caching problems

| Problem | Description | Mitigation |
|---------|-------------|-----------|
| Stale data | Cache not invalidated after an update (or updated on another instance's local cache) | Evict on write, TTL, distributed cache or invalidation messages |
| Cache stampede | A hot key expires; many requests hit the DB at once | Locking/single-flight (`@Cacheable(sync = true)`), jittered TTLs, refresh-ahead |
| Cache penetration | Requests for nonexistent keys always miss | Cache "not found" briefly, validate ids |
| Memory growth | Unbounded local caches | Size limits and eviction policies (LRU/LFU) |

## Redis Awareness

**Redis** is an in-memory key–value data store used as a distributed cache (also for rate limiting, session storage via Spring Session, distributed locks, queues/pub-sub, leaderboards).

- Shared by all application instances → consistent cache across pods, survives application restarts.
- Network hop (~sub-millisecond on a LAN) — slower than local memory, much faster than a database query.
- Values are serialised (JSON is common; Java serialisation is fragile across versions).
- Data structures: strings, hashes, lists, sets, sorted sets, streams; atomic operations (`INCR`, `SETNX`); per-key TTL.

Spring Boot integration: `spring-boot-starter-data-redis` (Lettuce client) + `spring.data.redis.host/port/password`; with `spring-boot-starter-cache` and `@EnableCaching`, Boot configures a `RedisCacheManager`:

```properties
spring.cache.type=redis
spring.cache.redis.time-to-live=10m
spring.cache.redis.key-prefix=shop:
spring.data.redis.host=redis
spring.data.redis.port=6379
```

The annotations (`@Cacheable`, `@CacheEvict`, `@CachePut`) are covered in [Cache Abstraction](../../advanced/spring-cache-abstraction/content.md).

## Comparison: Local vs Distributed Cache

| | Local (Caffeine, ConcurrentMap) | Distributed (Redis) |
|--|---------------------------------|---------------------|
| Latency | Nanoseconds–microseconds | Sub-millisecond network call |
| Shared across instances | No — each instance has its own copy | Yes |
| Consistency across instances | Hard (stale copies) | One copy |
| Survives app restart | No | Yes (if persistence configured) |
| Capacity | Limited by heap | Separate memory, scalable |
| Operational cost | None | Another system to run and secure |
| Good for | Small, rarely changing reference data per instance | Shared data, sessions, rate limits, multi-instance consistency |

A two-level cache (local L1 + Redis L2) is used at high scale.

## Common Mistakes

- Caching without TTL or size limits.
- Caching mutable JPA entities (lazy proxies, detached state) instead of DTOs.
- Updating the database and forgetting to evict — or evicting before the transaction commits (another request may reload old data).
- Using a local cache in a multi-instance deployment for data that must be consistent.
- Caching per-user data under keys that do not include the user (data leaks between users).

## Common Interview Traps

- **"Caching always improves performance."** It adds memory use, serialisation, network hops and consistency complexity; measure first.
- **"Redis is a database, so cached data is safe."** Treat cache data as disposable; the database is the source of truth.
- **"@Cacheable caches across instances."** Only if the configured cache manager is distributed.

## Key Takeaways

- Cache read-heavy, slow-changing, expensive data; never strictly consistent data like balances.
- Cache-aside + evict-on-write + TTL is the standard pattern.
- Local caches are fastest but per-instance; Redis is shared and consistent across instances.
- Watch for stampedes, stale data, unbounded growth and per-user key leaks.
