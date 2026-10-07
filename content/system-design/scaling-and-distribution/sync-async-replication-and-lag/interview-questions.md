# Synchronous vs Asynchronous Replication and Lag — Interview Questions

## Beginner

### Q1. What is the difference between synchronous and asynchronous replication?

**Style:** Comparison

<details>
<summary>Answer</summary>

Synchronous replication acknowledges a write only after replicas have received it, so acknowledged data survives a primary failure but writes are slower and depend on replica health. Asynchronous replication acknowledges after the primary's local commit and ships changes later, so writes are fast but replicas lag and recently acknowledged writes can be lost on failover.

</details>

### Q2. What is replication lag?

**Style:** Direct

<details>
<summary>Answer</summary>

The delay between a change committing on the primary and becoming visible on a replica — usually milliseconds, but seconds or more under heavy load, long queries on the replica, or network problems. During that time, reads from the replica return older data.

</details>

## Intermediate

### Q3. What is semi-synchronous replication and why is it popular?

**Style:** Trade-off

<details>
<summary>Answer</summary>

The primary waits for at least one replica (or a quorum) to confirm a write before acknowledging, while other replicas update asynchronously. It guarantees each acknowledged write exists on two machines (no loss if the primary dies) while keeping latency tied to the fastest replica and tolerating a slow or failed replica.

</details>

### Q4. A user posts a comment, refreshes, sees it, refreshes again and it is gone. What is happening?

**Style:** Debugging

<details>
<summary>Answer</summary>

A monotonic-reads violation: the first refresh hit an up-to-date replica, the second hit a replica that lags further behind. Pin each user's reads to the same replica (for example by hashing the user ID) or route reads of recently written data to the primary.

</details>

### Q5. Why is fully synchronous replication to all replicas rare?

**Style:** Why

<details>
<summary>Answer</summary>

Every write waits for the slowest replica, so latency is set by the worst machine and network path, and if any replica is down or partitioned writes block entirely — availability falls as replicas are added. Semi-synchronous or quorum-based acknowledgement gives durability without that fragility.

</details>

## Advanced

### Q6. Your replica lag suddenly grows from 50 ms to 10 minutes. What might cause it, and what do you do immediately?

**Style:** Debugging

<details>
<summary>Answer</summary>

Causes: a large write burst (bulk update, backfill, index creation), a long-running query on the replica blocking or conflicting with replay, an undersized replica (CPU or I/O), or network problems between sites. Immediately remove the lagging replica from the read pool (route reads elsewhere or to the primary), stop or throttle the bulk job, cancel blocking queries, and then fix the cause — batch large writes and size replicas like the primary.

</details>

### Q7. How would you replicate a payments database across two regions?

**Style:** Design

<details>
<summary>Answer</summary>

Keep a single primary region for writes with semi-synchronous replication to a replica in another availability zone of that region (zero loss for zone failures at low latency), and asynchronous replication to the second region for disaster recovery (a small, stated RPO for a full-region loss), with tested failover procedures. If zero loss across regions is mandatory, accept cross-region write latency with synchronous or consensus-based replication.

</details>
