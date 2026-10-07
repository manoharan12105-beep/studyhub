# Synchronous vs Asynchronous Replication and Lag

**Module:** Scaling and Distribution · **Interview priority:** Core

## What Is It?

The key choice in replication is **when the primary tells the client "done"**:

- **Synchronous replication:** the primary waits until the replicas have the write before acknowledging. Every acknowledged write exists on several machines.
- **Asynchronous replication:** the primary acknowledges as soon as it has the write locally and sends it to replicas afterwards. Fast, but replicas lag behind.
- **Semi-synchronous:** the primary waits for **at least one** replica (or a quorum), and the rest catch up asynchronously — the common middle ground.

```text
Async                                  Sync (all replicas)
User → Primary: write                  User → Primary: write
Primary → User: OK (fast)              Primary → R1, R2: write
Primary → R1, R2: write (later)        R1, R2 → Primary: ok
                                        Primary → User: OK (slower)
```

**Replication lag** is the delay between a write committing on the primary and becoming visible on a replica.

## Why It Exists

You cannot have both zero-delay writes and copies that are always up to date: making every write wait for remote machines costs latency and availability; not waiting costs freshness and, on failover, possibly data.

## How It Works

### The trade-off

| | Synchronous | Asynchronous | Semi-synchronous |
|---|-------------|--------------|------------------|
| Write latency | Highest (slowest replica, plus network) | Lowest | Medium (fastest replica) |
| Data loss on primary failure | None for acknowledged writes | Recent writes can be lost | None if the acknowledging replica survives |
| Replica freshness | Up to date | Lags (ms to seconds, more under load) | At least one up to date |
| If a replica is slow or down | Writes slow down or **block** | Writes unaffected | Writes continue while one replica responds |
| Typical use | Financial ledgers within one region, consensus systems | Most web applications, cross-region replicas | Production default for critical relational data |

Fully synchronous replication to every replica is rare at scale: one slow or failed replica stalls all writes.

### What lag does to users

Lag on asynchronous replicas creates visible anomalies:

| Anomaly | What the user sees | Fix |
|---------|--------------------|-----|
| **Read-your-writes** violation | My comment disappears after I refresh | Read my own recent writes from the primary |
| **Monotonic reads** violation | A new comment appears, then vanishes on the next refresh (second read hit a more-lagging replica) | Pin a user's reads to one replica (by user ID hash) |
| **Consistent prefix** violation | A reply appears before the question it answers | Keep causally related writes in one partition / order |

See [Consistency Models](../../consistency-and-coordination/consistency-models/content.md) for the formal names.

### Measuring and handling lag

- Monitor lag (seconds behind, or bytes/log positions behind) per replica and alert on growth.
- Take lagging replicas out of the read pool beyond a threshold.
- Lag grows when replicas are underpowered, when long-running queries block replay, or when a big write burst (a bulk update) arrives — schedule large backfills in batches.

**Think about it:** a bank wants zero data loss if the primary's data centre burns down, but writes must stay under 20 ms, and the backup data centre is 60 ms away. What is possible?

<details>
<summary>Answer</summary>

Synchronous replication to the remote site would add at least one 60 ms round trip to every write — impossible within 20 ms. Options: synchronous replication to a replica in another availability zone of the same region (a few ms away) for zero loss on single-site failures, plus asynchronous replication to the remote region (accepting a small loss window for a regional disaster), or relax the latency target for the most critical writes. This is an explicit RPO trade-off ([Disaster Recovery](../../reliability/disaster-recovery-rpo-and-rto/content.md)).

</details>

## Common Traps

> [!WARNING]
> **Common trap:** "Synchronous replication is always safer, so always use it." It turns every replica's slowness or failure into write latency or unavailability. Use it where the data justifies it, usually to one nearby replica.

## Interview Follow-up

- *"Sync or async for your design?"* Async replicas for read scaling and cross-region copies; semi-synchronous (one nearby replica) for data that must not be lost on failover, such as payments.

## Key Takeaways

- Sync: no loss, higher latency, writes depend on replica health. Async: fast, replicas lag, recent writes can be lost on failover. Semi-sync: the practical middle.
- Lag causes read-your-writes, monotonic-read and ordering anomalies; each has a targeted fix.
- Monitor lag and remove badly lagging replicas from the read pool.
