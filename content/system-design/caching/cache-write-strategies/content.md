# Write-Through, Write-Around and Write-Back

**Module:** Caching · **Interview priority:** Core

## What Is It?

Read patterns decide how data gets into the cache on a miss. **Write strategies** decide what happens when data changes:

- **Write-through:** write to the cache **and** the database synchronously, as one operation; acknowledge when both are done.
- **Write-around:** write **only to the database**, bypassing the cache; the cache is filled later by reads (cache-aside or read-through).
- **Write-back (write-behind):** write **only to the cache** and acknowledge immediately; the cache writes to the database **later**, asynchronously and often in batches.

```text
Write-through   App ──write──► Cache ──write now──► DB      ack after both
Write-around    App ──write──────────────────────► DB      cache untouched (or entry deleted)
Write-back      App ──write──► Cache ──ack          … later, batched ──► DB
```

## Why It Exists

Each strategy balances three things differently: **freshness** of cached data, **write latency**, and **risk of losing data**.

## How It Works

### Write-through

- Reads after a write always find fresh data in the cache.
- Writes are slower: two systems must succeed.
- The cache fills with everything written, including data nobody reads (pair with a TTL).
- If the database write fails after the cache write, the two disagree — implementations must handle partial failure.
- **Fits:** data that is written and then read soon and often, where stale reads are not acceptable — for example, live stock prices or user settings shown right after saving.

### Write-around

- Writes are as fast as the database alone; the cache is not polluted with data that is never read.
- A read right after a write misses (or must find the old entry deleted) and pays the database cost.
- **Fits:** write-heavy data where most written items are rarely read. Example: most posts on a large social network are seen by few people; cache a post only once people start reading it.

### Write-back

- Writes are very fast (memory speed) and the database receives fewer, batched writes — good for rapidly changing values.
- **Risk of data loss:** if the cache node fails before flushing, acknowledged writes are gone. Mitigate with a replicated, persistent cache (append-only logs) and frequent flushes.
- The database is behind the cache; anything reading the database directly sees old data.
- **Fits:** high-frequency updates where losing the last few seconds is tolerable or recoverable — view counters, analytics counters, rapidly changing delivery-order statuses, game state.

### Comparison

| | Write-through | Write-around | Write-back |
|---|---------------|--------------|------------|
| Write path | Cache + DB, synchronous | DB only | Cache only; DB later |
| Write latency | Higher | DB latency | Lowest |
| Read after write | Hit, fresh | Miss (then load) | Hit, fresh |
| Data-loss risk | Low | Low | **Higher** (unflushed writes) |
| Cache pollution | Yes (all writes cached) | No | Yes |
| Typical pairing | Read-through | Cache-aside / read-through | Read-through |
| Good for | Read-after-write data, must be fresh | Write-heavy, rarely re-read data | Bursty, high-frequency updates |

**Think about it:** a misconception says "write-around is a combination of read-through and write-through". What is wrong with that statement?

<details>
<summary>Answer</summary>

Write-around is the opposite of write-through on the write path: it **skips** the cache for writes. It is often *paired* with read-through (or cache-aside) for reads, which is probably the source of the confusion.

</details>

## What Can Fail

- **Write-through:** cache write succeeds, database write fails → inconsistent copies unless rolled back or invalidated.
- **Write-around:** an existing cached copy becomes stale unless the write also deletes it.
- **Write-back:** cache crash before flush → lost writes; flush backlog during database outages → the cache fills up.

## Common Traps

> [!WARNING]
> **Common trap:** using write-back for money or orders "for speed". Acknowledged writes that live only in memory can vanish. Use it only where loss of recent updates is acceptable or recoverable.

## Interview Follow-up

- *"Which write strategy for a like counter on viral posts?"* Write-back style aggregation: increment in Redis, flush periodically to the database; a small loss on a crash is acceptable and can be reconciled from the likes table.

## Key Takeaways

- Write-through: fresh cache, slower writes, low loss risk.
- Write-around: fast writes, no pollution, misses after writes.
- Write-back: fastest writes and batching, at the risk of losing unflushed data.
- Pick per data type based on freshness, write latency and acceptable loss.
