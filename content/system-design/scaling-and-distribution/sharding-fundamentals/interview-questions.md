# Sharding and Partitioning — Interview Questions

## Beginner

### Q1. What is sharding?

**Style:** Direct

<details>
<summary>Answer</summary>

Splitting a dataset horizontally across multiple database servers: each shard holds a subset of the rows, chosen by a shard key and a partitioning rule, so data size and write load are divided across machines. Each shard is usually replicated for availability.

</details>

### Q2. What is the difference between replication and sharding?

**Style:** Comparison

<details>
<summary>Answer</summary>

Replication copies the entire dataset onto several nodes to improve availability and read throughput; write capacity and maximum data size stay those of one primary. Sharding divides the dataset so each node stores and writes only part of it, scaling data size and writes. Large systems use both: each shard is replicated.

</details>

## Intermediate

### Q3. Compare range-based and hash-based partitioning.

**Style:** Comparison

<details>
<summary>Answer</summary>

Range partitioning assigns contiguous key ranges to shards, so range queries on the key are efficient, but traffic concentrates on hot ranges (latest dates, popular users). Hash partitioning spreads keys evenly by hashing, avoiding hotspots from sequential keys, but range queries must hit every shard and naive modulo hashing moves most data when the shard count changes.

</details>

### Q4. What makes a good shard key?

**Style:** How

<details>
<summary>Answer</summary>

High cardinality and an even distribution of both data and traffic, alignment with the most frequent queries so they touch one shard (for example `user_id` for user-centric apps or `tenant_id` for SaaS), and stability (a row's key rarely changes). Avoid keys with dominant values or monotonically increasing values under range partitioning.

</details>

### Q5. What becomes harder after sharding?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Queries not keyed by the shard key need scatter-gather across all shards; joins and foreign keys across shards are not supported by the database; multi-shard transactions need two-phase commit or sagas; global unique constraints need a separate mechanism; resharding requires moving data online; and operations (backups, schema changes) multiply by the number of shards.

</details>

### Q6. Why should you shard as late as possible?

**Style:** Why

<details>
<summary>Answer</summary>

Because it permanently adds complexity to queries, transactions, operations and future changes, and a poor shard key is very expensive to change. Indexing, caching, read replicas and vertical scaling handle very large workloads with far less complexity; shard when data size or write throughput truly exceeds one primary.

</details>

## Advanced

### Q7. How do you enforce unique emails across a sharded users table sharded by `user_id`?

**Style:** Design

<details>
<summary>Answer</summary>

Maintain a separate mapping keyed by email (its own table sharded by email hash, or a key-value store) with a unique constraint: on signup, insert the email mapping first (atomic conditional insert), then create the user on its shard; on failure, compensate by removing the mapping. The mapping also serves login lookups by email.

</details>

### Q8. An orders table sharded by `order_id` makes "customer's order history" slow. What do you do?

**Style:** Debugging

<details>
<summary>Answer</summary>

Re-shard by `customer_id` so a customer's orders are colocated, migrating data online (dual writes or change data capture, backfill, verify, cut over), and encode the customer or shard in new order IDs so lookups by order ID still route directly. Alternatively, maintain a secondary index table keyed by customer listing their order IDs, accepting extra writes.

</details>
