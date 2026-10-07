# Message Ordering, Partitions and Consumer Groups — Interview Questions

## Beginner

### Q1. Does Kafka guarantee message ordering?

**Style:** Trap

<details>
<summary>Answer</summary>

Only within a partition. Messages with the same key go to the same partition and are read in order there; across partitions there is no ordering guarantee. To keep related events ordered, give them the same key.

</details>

### Q2. What is a consumer group?

**Style:** Direct

<details>
<summary>Answer</summary>

A set of consumer instances, identified by a group ID, that share the work of reading a topic: each partition is assigned to exactly one member at a time, and the group tracks its own offsets. Different groups each receive the full stream independently.

</details>

## Intermediate

### Q3. Why doesn't global ordering scale?

**Style:** Why

<details>
<summary>Answer</summary>

A single total order means messages must be processed one after another by one consumer (or with heavy coordination), so throughput is capped by one worker and any slow or failing message blocks everything behind it. Per-key ordering lets independent keys proceed in parallel.

</details>

### Q4. How does the number of partitions limit consumer scaling?

**Style:** How

<details>
<summary>Answer</summary>

Within one consumer group, a partition is consumed by at most one consumer, so the maximum number of active consumers equals the number of partitions. Extra consumers sit idle. To scale further, add partitions (planning for key remapping) or make each consumer process faster.

</details>

### Q5. How would you choose a message key for bank transactions?

**Style:** Design

<details>
<summary>Answer</summary>

Use the account ID: all transactions for an account land in one partition and are applied in order (important for balances), while different accounts spread across partitions for parallelism. Watch for extremely active accounts creating hot partitions.

</details>

## Advanced

### Q6. What can break per-key ordering even with correct keys?

**Style:** Debugging

<details>
<summary>Answer</summary>

Retrying a failed message later while continuing with later messages for the same key; processing a partition's messages concurrently on a thread pool without grouping by key; increasing the partition count so a key maps to a new partition; non-idempotent producer retries reordering batches; and multiple producers writing events for the same entity without coordination.

</details>

### Q7. What happens during a consumer group rebalance, and why does it matter?

**Style:** What happens if

<details>
<summary>Answer</summary>

When members join, leave or fail, partitions are reassigned. Consumption pauses briefly, and a partition can move to another consumer before the previous owner committed its latest offsets, so some messages are reprocessed (duplicates). Consumers should commit offsets after processing, handle duplicates idempotently, and use cooperative rebalancing to reduce pauses.

</details>
