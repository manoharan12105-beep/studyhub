# Distributed Caching

**Module:** Caching · **Interview priority:** Frequently asked

## What Is It?

A **distributed cache** spreads cached data across several cache servers that all application servers share, such as a **Redis Cluster** or a fleet of **Memcached** nodes. It contrasts with a **local cache** that lives inside each application process.

```text
Local caches                               Shared distributed cache
App 1 [cache]  App 2 [cache]  App 3 [cache]       App 1   App 2   App 3
  each holds its own copy                            \      |      /
  (fast, but copies differ)                   [node A] [node B] [node C]   keys partitioned by hash
```

## Why It Exists

One cache server eventually runs out of memory, CPU or network capacity, and is a single point of failure. Local caches avoid the network hop but duplicate data on every server and drift apart. A distributed cache gives a **single shared view** of cached data, capacity that grows by adding nodes, and replication for availability.

## How It Works

### Local vs shared

| | Local (in-process) cache | Shared distributed cache |
|---|--------------------------|--------------------------|
| Latency | Nanoseconds–microseconds | ~0.2–1 ms (network round trip) |
| Consistency across servers | Each server has its own copy; can differ | One copy per key; all servers agree |
| Capacity | Limited by each server's heap | Sum of the cluster's memory |
| Survives app restart | No | Yes |
| Typical use | Tiny, very hot, rarely changing data (config, hot keys) | Sessions, query results, computed objects |

**Two-level caching** combines them: check the local cache (seconds of TTL), then the shared cache, then the database. It is the standard defence against [hot keys](../cache-stampede-penetration-and-hot-keys/content.md).

### Partitioning keys across nodes

Each key must map to one node, so every app server finds it in the same place:

- **Modulo hashing** (`hash(key) % N`) is simple but adding or removing a node remaps almost every key — the cache is effectively emptied, and the database takes the miss traffic.
- **Consistent hashing** remaps only about `1/N` of keys when a node is added or removed ([Consistent Hashing](../../scaling-and-distribution/consistent-hashing/content.md)). Memcached clients typically use it.
- **Redis Cluster** splits the key space into **16,384 hash slots** (`CRC16(key) mod 16384`) and assigns slot ranges to primaries; resharding moves whole slots between nodes instead of remapping every key. Keys sharing a **hash tag** (`{user:42}:cart`, `{user:42}:profile`) land in the same slot, so multi-key operations work on them.

### Replication and failover

Each shard can have replicas. If a primary fails, a replica is promoted (Redis Sentinel or Redis Cluster's built-in failover). Replication is asynchronous, so a failover can lose the last few writes — acceptable for a cache, which can be refilled, but a reason not to store the only copy of important data in it.

### Redis vs Memcached

| | Redis | Memcached |
|---|-------|-----------|
| Data types | Strings, hashes, lists, sets, sorted sets, streams, geo, bitmaps | Strings (bytes) only |
| Persistence | Optional (snapshots, append-only file) | None |
| Replication / failover | Built in | Not built in (client-side) |
| Threads | Mostly single-threaded command execution (I/O threads optional) | Multi-threaded |
| Extra uses | Sessions, rate limits, leaderboards (sorted sets), queues, locks, pub/sub | Pure caching |

Choose Memcached for simple, large, multi-threaded key-value caching; Redis when you need data structures, persistence or replication.

**Think about it:** the cache tier grows from 4 to 5 nodes using `hash(key) % N`. What fraction of keys now map to a different node, and what happens to the database?

<details>
<summary>Answer</summary>

A key stays on the same node only if `hash % 4 == hash % 5`, which holds for about 1 in 5 keys, so about **80 %** of keys move — their old copies become unreachable and those reads miss. The database suddenly receives most of the read traffic, possibly overloading it. Consistent hashing would move only about 20 % (the share taken by the new node).

</details>

## Common Traps

> [!WARNING]
> **Common trap:** treating the cache as the database. Asynchronous replication, eviction and restarts mean cached data can vanish; anything that must not be lost belongs in a durable store.

## Interview Follow-up

- *"How would you scale a Redis cache that has hit one node's memory limit?"* Move to Redis Cluster (hash slots across several primaries, each with a replica), use hash tags for keys that must be accessed together, and keep a local cache for the hottest keys.

## Key Takeaways

- Local caches are fastest but duplicated and inconsistent; shared caches are consistent and scalable at network latency. Two levels combine both.
- Keys are partitioned by hashing; modulo remaps most keys on resize, consistent hashing or hash slots move only a fraction.
- Replicate cache shards for availability; replication is async, so caches can lose recent writes.
- Redis offers data structures, persistence and replication; Memcached is simple, multi-threaded caching.
