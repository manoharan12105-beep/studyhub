# Sharding and Partitioning

**Module:** Scaling and Distribution · **Interview priority:** Core

## What Is It?

**Partitioning** splits a dataset into parts; when the parts live on different machines, each part is a **shard**, and the technique is **sharding** (horizontal partitioning). Each shard is a database holding a slice of the rows; together the shards hold the whole dataset.

A **shard key** (or partition key) — such as `user_id` — and a **rule** decide which shard every row belongs to:

```text
shard = user_id % 4
Alan  (user_id 10) → 10 % 4 = shard 2
Bea   (user_id 13) → 13 % 4 = shard 1
```

Two goals: **all shards together equal the whole dataset**, and **load is spread evenly**.

## Why It Exists

Replication copies **all** the data to every node, so it does not help when:

- the data no longer fits on one machine (50 million users and billions of photos), or
- the **write** rate exceeds what one primary can handle, or
- queries crawl even with indexes because each index is enormous.

Sharding divides both data and writes across machines, so capacity grows by adding shards. Each shard is usually also replicated for availability.

## How It Works

### Partitioning strategies

| Strategy | Rule | Strengths | Weaknesses |
|----------|------|-----------|------------|
| **Range** | Key ranges: users 1–50,000 → P1, 50,001–100,000 → P2; or dates by month | Range queries on the key are efficient (all of October is on one shard) | Hot spots: recent dates, or a range holding popular users, get most traffic |
| **Hash** | `hash(key) % N` or hash ranges | Spreads keys evenly | Range queries on the key hit every shard; changing N moves most data (unless consistent hashing) |
| **Directory (lookup)** | A lookup table maps key (or tenant) → shard | Full control; move one tenant at a time | The directory is an extra dependency to keep available and fast |
| **Geographic** | By user region | Data near users; data-residency rules | Uneven regions; cross-region users |

Range example: if users 50,001–100,000 are mostly in a country where the app is popular, P2 can see 10,000 requests/s while P1 sees 100 — a **hotspot**. Hash partitioning would scatter them.

### Choosing a shard key

A good shard key:

1. **Spreads data and load evenly** — high cardinality, no dominant values.
2. **Keeps the most frequent queries on one shard** — for a photo app, `user_id` keeps a user's profile and photos together, so "show Alan's photos" touches one shard.
3. **Rarely changes** — changing a row's shard key means moving the row.

There is no perfect key: whatever you choose, some queries become **cross-shard**.

### What becomes harder

- **Cross-shard queries:** "top 10 photos globally by likes" must ask every shard and merge (scatter-gather), and the slowest shard sets latency.
- **Joins across shards:** usually impossible in the database; done in the application, or avoided by denormalising.
- **Transactions across shards:** need distributed transactions or sagas ([Distributed Transactions](../../consistency-and-coordination/distributed-transactions-and-sagas/content.md)).
- **Unique constraints across shards:** "unique email" needs a separate lookup service or a global index.
- **Resharding:** adding shards means moving data ([Hot Partitions and Resharding](../hot-partitions-and-resharding/content.md)).

### Shard as late as possible

Because of these costs, shard only when vertical scaling, indexing, caching and read replicas are no longer enough. Some databases build sharding in (MongoDB, Cassandra, DynamoDB, distributed SQL systems such as CockroachDB or Vitess for MySQL), which removes much of the routing work but not the need for a good key.

**Think about it:** an e-commerce orders table is sharded by `order_id` hash. The most common query is "show this customer's orders". What is wrong, and what key would be better?

<details>
<summary>Answer</summary>

A customer's orders are scattered across all shards, so the most frequent query becomes a scatter-gather over every shard. Shard by `customer_id` instead, so one customer's orders live on one shard; look-ups by `order_id` can embed the customer or shard in the order ID or use a small global index.

</details>

## Comparison

| | Replication | Sharding |
|---|-------------|----------|
| Each node holds | All data | Part of the data |
| Scales | Reads, availability | Data size, writes (and reads) |
| New problems | Lag, failover | Shard key choice, cross-shard queries, resharding, hotspots |

## Common Traps

> [!WARNING]
> **Common trap:** "Sharding is the first step when the database is slow." It is usually the last: check queries and indexes, add caching and replicas, and scale vertically first.

## Interview Follow-up

- *"How would you shard the photo app?"* By `user_id` (hash or consistent hashing), keeping each user's photos and profile together; the feed and global queries use caches, precomputation or scatter-gather; each shard has replicas.

## Key Takeaways

- Sharding splits data across machines by a shard key; each shard is usually replicated.
- Range keeps ranges together but creates hotspots; hash spreads load but scatters ranges; directory gives control at the cost of a lookup.
- A good shard key spreads load, keeps frequent queries on one shard and rarely changes.
- Sharding makes cross-shard queries, joins, transactions, unique constraints and resharding hard — shard late.
