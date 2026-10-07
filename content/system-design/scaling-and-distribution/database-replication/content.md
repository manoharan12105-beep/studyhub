# Database Replication and Read Replicas

**Module:** Scaling and Distribution · **Interview priority:** Core

## What Is It?

**Replication** keeps copies of the same data on several machines (nodes). The most common setup is **single-leader** (primary–replica): one **primary** (leader) accepts all writes and streams every change to one or more **replicas** (followers, read replicas), which serve reads.

```text
              writes                  change stream (lag: milliseconds)
App ───────────────────► Primary ─────────────┬──────────► Replica 1
 │                                             └──────────► Replica 2
 └── reads ──► read load balancer ──► Primary / Replica 1 / Replica 2
```

A common standard is one primary plus two replicas — three copies of the data.

## Why It Exists

- **No single point of failure:** if the primary dies, a replica can take over (**failover**).
- **Higher availability:** the data stays reachable during machine failures and maintenance.
- **Read throughput:** reads spread across copies; two replicas roughly triple read capacity.
- **Data near users:** replicas in other regions serve local reads with low latency.

## How It Works

### Why only one node accepts writes

If two copies accept writes independently, the primary may set `x = 9` while a replica sets `x = 13` — and nobody knows which is true. With one writer, every change has a single order, and replicas apply changes in that order. (Systems with several writers must resolve conflicts — see [Multi-Leader and Leaderless](../multi-leader-and-leaderless-replication/content.md).)

### Read/write splitting

Writes go to the primary; reads go to replicas (or any copy) through a read load balancer or the application's data-source routing. You pay for three copies, so use them.

### Replication lag and read-your-own-writes

Replicas apply changes slightly after the primary — usually milliseconds, sometimes seconds under load. That gives **eventual consistency** on replicas.

The classic bug: Alan uploads a photo, refreshes half a second later, the read lands on a lagging replica, and the photo is "missing". It was never lost. Fix: route **a user's reads of their own recent changes** to the primary (for example for a few seconds after they write, or for "my profile" pages), and let everyone else read replicas. See [Replication Lag](../sync-async-replication-and-lag/content.md).

### Failover

When the primary fails:

1. Detect it (missed heartbeats, failed health checks).
2. Choose the replica with the most recent data (the highest applied log position).
3. Promote it to primary.
4. Repoint the other replicas and the application's write traffic to the new primary.

Risks: with asynchronous replication, writes acknowledged by the old primary but not yet copied are **lost**; and if the old primary was only partitioned, not dead, two nodes may both believe they are primary (**split brain**) — prevented with fencing and consensus-based leader election ([Leader Election](../../consistency-and-coordination/distributed-locks-and-leader-election/content.md)). Managed databases automate failover in roughly tens of seconds.

### Adding a new replica

You cannot simply copy a live database: it changes while you copy.

1. Take a consistent **snapshot** of the primary, noting its exact log position.
2. Restore the snapshot on the new node (can take hours for large data).
3. Replay all changes from the primary's log since that position until caught up.
4. Keep streaming changes — the replica is now live.

### Replication is not a backup

A bad `DELETE` that removes a million rows on the primary is copied to every replica within milliseconds. **Backups** are separate snapshots stored away from the live system (with point-in-time recovery from logs), so you can restore last night's data. You need both — see [Disaster Recovery](../../reliability/disaster-recovery-rpo-and-rto/content.md).

**Think about it:** a system has one primary and two replicas. Reads are 90 % of traffic. The primary is at 90 % CPU. Where is the load coming from, and what do you check?

<details>
<summary>Answer</summary>

Probably reads still going to the primary: check whether read/write splitting is actually configured (many ORMs send everything to the primary by default), whether reads use read-only transactions, and whether some read endpoints were deliberately pinned to the primary for read-your-writes too broadly. Move reads that tolerate lag to replicas.

</details>

## Comparison

| | Replication | Sharding |
|---|-------------|----------|
| What | Full copies of the same data | Each node holds a different part of the data |
| Solves | Availability, read scaling, locality | Data size and write throughput |
| Write capacity | Unchanged (one primary) | Grows with shards |
| Used together? | Yes: each shard is usually replicated | |

## Common Traps

> [!WARNING]
> **Common trap:** "We have replicas, so we don't need backups." Replicas copy mistakes and corruption instantly. Keep independent, tested backups.

## Interview Follow-up

- *"A user can't see the photo they just uploaded — why?"* Replication lag: the read hit a replica that had not applied the write yet. Route the user's own recent reads to the primary.

## Key Takeaways

- Single-leader replication: one primary takes writes; replicas copy changes and serve reads.
- Benefits: failover, availability, read scaling, data near users.
- Replicas lag: expect eventual consistency and fix read-your-own-writes by reading from the primary when needed.
- Failover promotes the most up-to-date replica; async replication can lose recent writes; guard against split brain.
- Replication is not a backup.
