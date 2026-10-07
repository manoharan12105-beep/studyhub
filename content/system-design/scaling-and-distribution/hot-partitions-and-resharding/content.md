# Hot Partitions, Resharding and Secondary Indexes

**Module:** Scaling and Distribution · **Interview priority:** Frequently asked

> [!NOTE]
> **Advanced topic.** Builds on [Sharding and Partitioning](../sharding-fundamentals/content.md).

## What Is It?

Three problems that appear once data is partitioned:

- A **hot partition** (hotspot) is a shard receiving far more requests than the others — enough to overload it while the rest idle.
- **Resharding** (rebalancing) is moving data when shards are added, removed or split.
- **Secondary indexes** answer queries on fields other than the shard key, which are spread across shards.

## Why It Exists

Sharding assumes load follows the data evenly. Real traffic does not: celebrities, flash-sale products, the current day's data and large tenants concentrate requests. And data keeps growing, so the number of shards must change while the system stays online.

## How It Works

### Why hotspots happen

| Cause | Example |
|-------|---------|
| Skewed keys | A celebrity with 100 million followers; a giant tenant |
| Sequential keys under range partitioning | All new rows (latest timestamp or auto-increment ID) go to the last shard |
| Correlated popularity | Several popular users happen to hash to the same shard |
| Time-based bursts | A flash sale on one product ID |

Detect hotspots by measuring requests, CPU and latency **per shard** (and per key where possible) — an overloaded shard can overheat and fail while the cluster average looks fine.

### Fixing hotspots

- **Better key:** hash instead of range for sequential keys; add a high-cardinality component.
- **Split hot keys:** append a small random suffix (`post:42#0 … post:42#9`) to spread one key's writes over 10 partitions; reads combine them. Used for viral counters.
- **Cache and replicate hot reads:** hot keys served from caches and read replicas ([Hot Keys](../../caching/cache-stampede-penetration-and-hot-keys/content.md)).
- **Dedicated shards:** move a giant tenant to its own shard via a directory.
- **Split the hot shard:** divide its key range into two.

### Resharding without downtime

With `hash % N`, changing N moves most rows (about 80 % going from 4 to 5 shards). Better schemes move only what is needed:

| Scheme | How rebalancing works |
|--------|-----------------------|
| **Many fixed logical partitions** | Create, say, 1,024 partitions up front and map several to each physical node; adding a node moves whole partitions, never re-hashes keys (Redis Cluster's 16,384 slots, Elasticsearch shards, Kafka partitions) |
| **Consistent hashing** | A new node takes over a slice of the ring; only about 1/N of keys move ([Consistent Hashing](../consistent-hashing/content.md)) |
| **Range splitting** | A shard that grows too big splits its range in two (HBase, Bigtable, CockroachDB) |

Moving data online follows a common recipe: copy existing data to the new location, stream ongoing changes (dual writes or change data capture), verify, switch reads and writes, then delete the old copy.

### Secondary indexes across shards

Cars are sharded by `car_id`. You need "all red cars".

**Local (document-partitioned) index** — each shard indexes only its own rows:

```text
Shard 1 (cars 200–499): red → 350, 359   blue → 209, 305
Shard 2 (cars 500–799): red → 610, 690   blue → 509, 609
Query "red" → ask every shard, merge  (scatter-gather)
```

Writes are cheap (one shard), reads fan out to all shards. Cassandra and Elasticsearch work this way.

**Global (term-partitioned) index** — one index, itself partitioned by the indexed value:

```text
Index partition "r–z": red → [shard1: 350, 359; shard2: 610, 690]
Query "red" → one index lookup → fetch from the right shards only
```

Reads are targeted, but every write must also update the index, which may live on another shard — usually **asynchronously**, so the index lags (DynamoDB global secondary indexes are eventually consistent).

| | Local index | Global index |
|---|-------------|--------------|
| Write cost | Low (same shard) | Higher (another partition, often async) |
| Read cost | Query all shards | Query one index partition |
| Freshness | Immediate | Often lags |

**Think about it:** a viral post's like counter receives 50,000 increments per second, all on one shard. Name two fixes.

<details>
<summary>Answer</summary>

Split the counter into N sub-counters on different partitions (`likes:post42#0…#9`), incrementing a random one and summing on read (or caching the sum); or buffer increments in memory/Redis and flush aggregated totals periodically (write-back aggregation). Both trade exactness or read cost for write throughput.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** "Hash partitioning eliminates hotspots." It spreads *keys* evenly, but one extremely hot key still lands on one shard.

## Interview Follow-up

- *"How do you add shards without downtime?"* Use many logical partitions or consistent hashing so only some data moves; copy, stream changes, verify, switch, clean up.

## Key Takeaways

- Hotspots come from skewed keys, sequential keys, bursts and big tenants; measure per shard.
- Fix with better keys, key splitting, caching/replicas, dedicated shards or shard splits.
- Reshard with fixed logical partitions, consistent hashing or range splits, moving data online.
- Local secondary indexes: cheap writes, scatter-gather reads. Global: targeted reads, costlier and lagging writes.
