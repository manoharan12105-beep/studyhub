# Caching Fundamentals

**Module:** Caching · **Interview priority:** Core

## What Is It?

A **cache** is a small, fast store that keeps copies of data that is expensive to get, so repeated requests can skip the expensive work. In system design the expensive work is usually a database query, a call to another service, or a computation; the cache is usually memory — in the application process, or in a dedicated server such as **Redis** or **Memcached**.

- **Cache hit:** the data is in the cache → return it quickly.
- **Cache miss:** it is not → do the expensive work, return the result, and usually store it in the cache for next time.

## Why It Exists

Consider a course website's home page showing 6 courses, each assembled from 4 lookups (course, price, discount, details): 24 database lookups for every visitor, even though the answer is the same for everyone and changes once a day. Or a celebrity posts a photo and millions of people ask for the same record within minutes. Caching turns those into one computation and millions of cheap reads.

```text
                      hit (≈ 1 ms)
App ──"have feed:alan?"──► Redis ──────────────► return
   │                        │ miss
   └──────────► Database (tens of ms) ──► write result into Redis ──► return
```

The gains: lower latency, far less load on the database (which is hard to scale), and lower cost.

## How It Works

### Hit ratio decides everything

```text
hit ratio = hits ÷ (hits + misses)
average latency ≈ hit_ratio × cache_time + (1 − hit_ratio) × (cache_time + db_time)
```

With a 1 ms cache, a 30 ms database query and a 95 % hit ratio, average latency ≈ 0.95 × 1 + 0.05 × 31 ≈ 2.5 ms, and the database sees only 5 % of reads. At an 80 % hit ratio the database sees 20 % — four times as much load. Small changes in hit ratio cause large changes in database load.

### Where caches live

| Layer | Example | Saves |
|-------|---------|-------|
| Client | Browser HTTP cache, mobile app memory | A whole network round trip |
| Edge | CDN ([Content Delivery Networks](../../communication/content-delivery-networks/content.md)) | Distance and origin bandwidth |
| Application (local) | An in-process map with a short TTL | A network hop to the cache server |
| Application (shared) | Redis, Memcached ([Distributed Caching](../distributed-caching/content.md)) | Database queries and computation |
| Database | Buffer pool / page cache inside the database | Disk reads |

### What is worth caching

Good candidates are **read often, changed rarely, expensive to produce, and small**: trending posts, profile cards, product pages, configuration, computed feeds, session data. Poor candidates: data that changes on every read, data read once, huge objects, and data where any staleness is unacceptable (account balances during a withdrawal).

### Why not cache everything?

Memory costs far more per gigabyte than disk, and a cache that holds everything is just a second database you must keep consistent. A cache works because a **small hot subset** of data receives most requests (in many systems, a few percent of keys get most reads). So caches stay small, hold the hot set, and evict the rest ([Eviction Policies](../cache-eviction-policies/content.md)).

### The price of caching

- **Staleness:** the cache may return old data after the source changes ([Invalidation and TTL](../cache-invalidation-and-ttl/content.md)).
- **Complexity:** another component to run, monitor and fail over.
- **New failure modes:** stampedes when hot entries expire, and a database overwhelmed if the cache disappears ([Stampede and Hot Keys](../cache-stampede-penetration-and-hot-keys/content.md)).

**Think about it:** a database handles 2,000 queries/s comfortably. Traffic is 20,000 reads/s with a 95 % hit ratio. The cache cluster restarts and comes back empty. What happens?

<details>
<summary>Answer</summary>

Normally the database gets 5 % of 20,000 = 1,000 queries/s. With an empty cache every read misses: up to 20,000 queries/s, ten times what the database can handle, so it slows or fails and the cache cannot be refilled quickly — a cascading outage. Defences: replicated caches that survive a node restart, warming the cache before taking traffic, request coalescing, and load shedding.

</details>

## When Not to Use

Do not add a cache to hide a missing index or a bad query — fix the query first. Do not cache data that must always be exact for the decision being made; read it from the source of truth.

## Common Traps

> [!WARNING]
> **Common trap:** "A cache is just an optimisation, so it can't cause outages." Systems sized around a high hit ratio depend on the cache; losing it can overload everything behind it.

## Interview Follow-up

- *"Where would you add caching in this design?"* At the layer that removes the most expensive repeated work: CDN for static content, Redis for hot database reads, and the client for user-specific data, each with a stated TTL and invalidation rule.

## Key Takeaways

- A cache keeps hot data close and fast: hits are cheap, misses do the expensive work.
- The hit ratio drives both latency and backend load; small drops multiply database traffic.
- Cache data that is read often, changed rarely, expensive and small.
- Caching adds staleness, complexity and new failure modes — plan for each.
