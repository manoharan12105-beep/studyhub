# Cache Stampede, Penetration and Hot Keys

**Module:** Caching · **Interview priority:** Frequently asked

## What Is It?

Three ways a cache fails exactly when load is highest:

- **Cache stampede** (thundering herd, dog-piling): a popular entry expires or is evicted, and hundreds or thousands of concurrent requests miss at the same moment and all hit the database to rebuild the same value.
- **Cache penetration:** requests for keys that **do not exist** (a deleted product, a random ID from a bot) always miss, because there is nothing to cache — every one goes to the database.
- **Hot key:** one key receives so much traffic (a celebrity's post, a flash-sale item) that the single cache node holding it is overloaded, even though the cluster as a whole has capacity.

## Why It Exists

Caches are sized for average behaviour. These three patterns concentrate load in time (stampede), on missing data (penetration) or on one node (hot key), turning the cache from protection into the trigger of an outage.

## How It Works

### Stampede

```text
10:00:00.000  trending:list expires (TTL 60 s) — 1,000 requests/s read it
10:00:00.000–10:00:00.400  all ~400 requests miss → 400 identical heavy queries hit the database
→ database CPU spikes, queries slow down, more requests pile up behind them
```

Defences:

| Technique | How it helps |
|-----------|--------------|
| **Request coalescing / single flight** | Only one request per key rebuilds; others wait for its result (in-process lock or a short distributed lock `SET lock:key NX PX 5000`) or get the old value |
| **Serve stale while revalidating** | Keep a soft expiry and a hard expiry: after the soft one, return the old value and refresh in the background |
| **Early (probabilistic) refresh** | Refresh a hot key shortly before it expires, with a probability that rises near expiry |
| **TTL jitter** | Add randomness (60 s ± 10 %) so many keys loaded together do not expire together |
| **Pre-warming** | Load known hot keys before traffic arrives (after deploys, before a sale) |

### Penetration

Requests for `product:99999999` miss every time, and an attacker can send millions.

| Technique | How it helps |
|-----------|--------------|
| **Negative caching** | Cache "not found" with a short TTL (`product:99999999 → NULL` for 60 s) |
| **Bloom filter** | A compact probabilistic set of all valid IDs: if it says "definitely not present", reject without touching the database (false positives possible, false negatives not) |
| **Input validation and rate limiting** | Reject malformed IDs; throttle clients producing many misses |

### Hot keys

One Redis node can serve on the order of 100,000 simple operations per second; a viral key can exceed what one node (or its network card) handles.

| Technique | How it helps |
|-----------|--------------|
| **Local (in-process) cache** for the hottest keys | Each app server keeps a copy for a few seconds — the cache node sees one request per server per few seconds |
| **Key replication / splitting** | Store copies under `post:42#1 … post:42#8` on different nodes and read a random one |
| **Read replicas** of the cache shard | Spread reads across replicas |
| **Detect hot keys** | Monitor per-key request rates (sampling, client-side counters) so mitigation is applied quickly |

Hot **write** keys (a global counter, a viral like count) need different tools: sharded counters, batching and write-back aggregation.

**Think about it:** a flash sale starts at 12:00 and the product page is cached only after the first request. What three things would you do before 12:00?

<details>
<summary>Answer</summary>

Pre-warm the cache with the sale product pages; enable request coalescing so any miss triggers a single rebuild; and put the hottest product data into local in-process caches (and/or replicate the hot keys) so one cache node is not the bottleneck. Also set jittered TTLs or serve-stale-while-revalidate so the entries do not all expire mid-sale.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** "A shorter TTL makes the cache safer." For hot keys, a short TTL means more frequent expiry and more stampede opportunities. Pair TTLs with coalescing, jitter or stale-while-revalidate.

## Interview Follow-up

- *"A celebrity posts and your cache cluster has one node at 100 % CPU. What do you do?"* Recognise a hot key: serve it from local caches on app servers with a short TTL, replicate the key across nodes, and coalesce misses; longer term, detect hot keys automatically.

## Key Takeaways

- Stampede: many simultaneous misses on one key → coalesce, serve stale, refresh early, jitter TTLs, pre-warm.
- Penetration: misses for non-existent keys → negative caching, Bloom filters, validation and rate limits.
- Hot key: one key overloads one node → local caches, key replication, cache replicas, detection.
