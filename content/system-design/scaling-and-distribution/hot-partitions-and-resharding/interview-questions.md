# Hot Partitions, Resharding and Secondary Indexes — Interview Questions

## Beginner

### Q1. What is a hot partition?

**Style:** Direct

<details>
<summary>Answer</summary>

A shard that receives a disproportionate share of reads or writes, so it becomes overloaded (and may fail) while other shards are underused. It caps the system's throughput at that one shard's capacity.

</details>

## Intermediate

### Q2. What causes hotspots and how do you fix them?

**Style:** How

<details>
<summary>Answer</summary>

Causes: skewed keys (celebrities, giant tenants), sequential keys under range partitioning (all new rows on the last shard), time-bound bursts and unlucky hashing. Fixes: hash or compound keys, splitting a hot key across sub-keys, caching and read replicas for hot reads, dedicated shards for huge tenants, and splitting hot ranges.

</details>

### Q3. Why does hash partitioning not solve every hotspot?

**Style:** Trap

<details>
<summary>Answer</summary>

Hashing distributes different keys evenly, but all traffic for one key still goes to one shard. A single extremely popular key — a viral post, a celebrity account, a flash-sale item — overloads its shard regardless of how keys are spread; it needs key splitting or caching.

</details>

### Q4. Compare local and global secondary indexes in a sharded database.

**Style:** Comparison

<details>
<summary>Answer</summary>

A local index lives on each shard and covers only that shard's rows: writes update only their own shard, but queries on the indexed field must ask every shard and merge (scatter-gather). A global index is partitioned by the indexed value: queries go to one index partition, but each write must also update an index partition that may be on another node, typically asynchronously, so the index can lag.

</details>

## Advanced

### Q5. How do systems rebalance data without re-hashing everything?

**Style:** How

<details>
<summary>Answer</summary>

By decoupling keys from nodes: hash keys into a large fixed number of logical partitions or slots and move whole partitions between nodes (Redis Cluster, Kafka, Elasticsearch); use consistent hashing so a new node takes over only a slice of the key space; or split ranges that grow too large. Data moves online by copying, streaming changes, verifying and switching routing.

</details>

### Q6. Walk through migrating a live sharded table to a new shard layout.

**Style:** Design

<details>
<summary>Answer</summary>

Create the new shards; backfill existing data in batches; capture ongoing changes (dual writes from the application or change data capture from the old shards) and apply them to the new layout; verify counts and checksums; switch reads to the new layout (possibly gradually), then writes; keep the old data briefly for rollback; and finally delete it. Throttle the backfill to protect production traffic.

</details>
