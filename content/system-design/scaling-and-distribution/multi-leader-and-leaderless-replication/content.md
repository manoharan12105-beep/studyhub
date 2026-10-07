# Multi-Leader and Leaderless Replication

**Module:** Scaling and Distribution · **Interview priority:** Frequently asked

> [!NOTE]
> **Advanced topic.** Most systems use single-leader replication. Learn [Database Replication](../database-replication/content.md) and [Replication Lag](../sync-async-replication-and-lag/content.md) first.

## What Is It?

Two alternatives to one primary accepting all writes:

- **Multi-leader replication:** several nodes accept writes — typically one leader per data centre or region — and the leaders replicate to each other asynchronously.
- **Leaderless replication:** there is no leader at all. Clients (or a coordinator node) send each write and read to **several replicas in parallel** and wait for enough of them to answer. Amazon's Dynamo design popularised it; Cassandra, Riak and Voldemort follow it.

## Why It Exists

With one leader, every write in the world must travel to one region, and if that leader's region is unreachable, nobody can write. Multi-leader lets each region write locally with low latency and keep working when regions are disconnected. Leaderless avoids failover entirely: there is no leader to lose, and a write succeeds as long as enough replicas respond.

Both pay for it with **write conflicts**.

## How It Works

### Multi-leader and its conflicts

```text
Region A leader                        Region B leader
user 1 renames file "A" → "B"           user 2 renames file "A" → "C"   (same moment)
          ╲_______ replicate asynchronously ______╱
                 Which name is correct?
```

The same problem appears in collaborative tools: two people editing the same spreadsheet cell offline. Conflict resolution strategies:

| Strategy | How | Risk |
|----------|-----|------|
| **Last write wins (LWW)** | Keep the write with the latest timestamp | Silently discards the other write; clocks on different machines disagree, so "latest" can be wrong |
| **Priority / higher ID wins** | The write from the leader (or replica) with the higher ID wins | Deterministic but arbitrary; still discards data |
| **Merge** | Combine values (union of tags, concatenated edits) | Needs data-type-specific logic |
| **CRDTs** | Data types designed to merge automatically (counters, sets, text) | Limited to those types; more complex |
| **Ask the user** | Keep both versions and let a person choose, like a Git merge conflict | Burdens the user |

The best strategy is avoiding conflicts: route all writes for one record (a user's profile, a document) to the same "home" leader, so conflicts happen only during failover.

### Leaderless: replicas, quorums and repair

With **N** replicas per key, a write is sent to all N and succeeds after **W** acknowledge; a read queries the replicas and waits for **R** responses, returning the newest version among them. If **W + R > N**, every read overlaps at least one replica holding the latest write — see [Quorum Reads and Writes](../quorum-reads-and-writes/content.md).

Replicas that missed writes (they were down or slow) are brought up to date by:

- **Read repair:** a read that sees an older version on some replica writes the newer value back to it.
- **Hinted handoff:** while a replica is down, another node holds its writes ("hints") and delivers them when it returns.
- **Anti-entropy:** a background process compares replicas (using Merkle trees) and copies missing data.

Concurrent writes to the same key still conflict; leaderless stores detect them with version vectors or resolve them with LWW timestamps.

**Think about it:** a shopping cart is replicated leaderlessly. A user adds a book on their phone and a pen on their laptop at almost the same time, and the two writes reach different replicas. With last-write-wins, what happens? What would a better resolution be?

<details>
<summary>Answer</summary>

LWW keeps whichever write has the later timestamp, so one item silently disappears from the cart. A better resolution merges the two versions: the cart becomes the **union** of both (book and pen). That was the approach described in Amazon's original Dynamo paper; the catch is that deleted items can reappear unless removals are tracked too.

</details>

## Comparison

| | Single-leader | Multi-leader | Leaderless |
|---|---------------|--------------|------------|
| Who accepts writes | One primary | One leader per region/site | Any replica (quorum) |
| Write latency for remote users | High (to the primary's region) | Low (local leader) | Low to moderate |
| Survives leader/region loss without failover | No | Yes | Yes |
| Write conflicts | None | Yes | Yes |
| Typical systems | PostgreSQL, MySQL | Multi-region databases, offline-first apps, collaborative editors | Cassandra, Riak, DynamoDB-style stores |

## Common Traps

> [!WARNING]
> **Common trap:** "Last write wins is safe because clocks are synchronised." Clocks drift by milliseconds or more; LWW can drop a write that actually happened later, without any error.

## Interview Follow-up

- *"How would you make a globally distributed app writable in every region?"* Multi-leader or leaderless replication, plus a conflict strategy: home-region ownership per record where possible, CRDTs or merges for collaborative data, and LWW only where losing a concurrent write is acceptable.

## Key Takeaways

- Multi-leader: a leader per region; local writes and partition tolerance, but conflicts between leaders.
- Leaderless: writes and reads go to several replicas with quorums; no failover; repair via read repair, hinted handoff and anti-entropy.
- Conflicts need a strategy: LWW, priority, merge, CRDTs or asking the user — or avoid them by giving each record a home leader.
