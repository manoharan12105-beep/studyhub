# Quorum Reads and Writes

**Module:** Scaling and Distribution · **Interview priority:** Frequently asked

## What Is It?

In a replicated store where each piece of data lives on **N** replicas, a **quorum** is the number of replicas that must respond before an operation counts as successful:

- **W** — replicas that must acknowledge a **write**.
- **R** — replicas that must respond to a **read**; the read returns the newest version among those responses.

The central rule:

```text
W + R > N   →  every read set overlaps every write set in at least one replica,
               so a read sees the latest successful write
```

With N = 3, W = 2, R = 2: any 2 replicas you read share at least 1 replica with any 2 that acknowledged the write.

```text
replicas:   [ r1 ]  [ r2 ]  [ r3 ]
write W=2:  [ v2 ]  [ v2 ]  [ v1 ]   (r3 missed it)
read  R=2:          [ v2 ]  [ v1 ]   → newest is v2 ✓ (overlap at r2)
```

## Why It Exists

Waiting for **all** replicas makes every operation as slow as the slowest replica and fails whenever one is down. Waiting for **one** is fast but can return stale data. Quorums let you choose a point between them, per operation, and tolerate failed replicas.

## How It Works

### Common configurations (N = 3)

| W | R | W + R > N? | Behaviour |
|---|---|-----------|-----------|
| 2 | 2 | 4 > 3 ✓ | Balanced: reads see the latest write; tolerates 1 slow/failed replica for both reads and writes |
| 3 | 1 | 4 > 3 ✓ | Fast reads; writes fail if any replica is down |
| 1 | 3 | 4 > 3 ✓ | Fast, always-available writes; reads need every replica |
| 1 | 1 | 2 ≤ 3 ✗ | Fastest and most available; reads may be stale (eventual consistency) |

Fault tolerance: writes keep working with up to **N − W** replicas down; reads with up to **N − R** down.

A frequent simplification is "read and write a majority" (each more than N/2, i.e. W = R = ⌊N/2⌋ + 1). Majorities always satisfy W + R > N, but the general condition is W + R > N — a configuration like W = 3, R = 1 is also consistent without either being a majority.

### Tunable consistency

Stores such as Cassandra let you choose per request: `ONE`, `QUORUM`, `ALL` (and `LOCAL_QUORUM` within a data centre). A logging write might use `ONE`; a balance read `QUORUM`.

### Why quorums are not a perfect guarantee

W + R > N gives strong-looking behaviour, but edge cases remain: concurrent writes resolved by last-write-wins can lose data; a write that reached fewer than W replicas reports failure but may remain on some of them; with **sloppy quorums** (writes accepted by substitute nodes during failures, delivered later by hinted handoff) the overlap guarantee does not hold. Treat quorums as a strong tool for freshness, not as full linearizability ([Consistency Models](../../consistency-and-coordination/consistency-models/content.md)).

**Think about it:** with N = 5, what are the smallest W and R that guarantee overlap if you want writes to survive 2 failed replicas?

<details>
<summary>Answer</summary>

Writes surviving 2 failures means N − W ≥ 2 → W ≤ 3. Overlap needs W + R > 5. With W = 3, R = 3 (3 + 3 = 6 > 5). Reads then also survive 2 failures. W = 3, R = 2 gives 5, which is not greater than 5 — no guarantee.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** "A quorum means reading from all replicas." It means waiting for enough replicas — W and R — such that W + R > N. That is the point: you don't wait for all of them.

## Interview Follow-up

- *"How does Cassandra give you consistent reads?"* Use `QUORUM` (or `LOCAL_QUORUM`) for both writes and reads with replication factor 3, so W + R = 4 > 3.

## Key Takeaways

- N replicas; a write needs W acknowledgements; a read needs R responses.
- W + R > N makes read and write sets overlap, so reads return the latest successful write.
- Lower W or R for speed and availability; raise them for freshness. Writes tolerate N − W failures, reads N − R.
- Edge cases (concurrent writes, sloppy quorums) mean quorums are not a full linearizability guarantee.
