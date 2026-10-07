# Write-Through, Write-Around and Write-Back — Practice

### P1. Fastest writes

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** write-back

Which strategy acknowledges writes fastest?

- A) Write-through
- B) Write-around
- C) Write-back
- D) Read-through

<details>
<summary>Answer</summary>

**Answer:** C) Write-back

It acknowledges after the in-memory cache write.

</details>

### P2. Match the strategy

**Difficulty:** Medium · **Type:** Design · **Concepts:** strategy choice

Match: (a) page-view counters on articles, (b) audit log entries that are rarely read, (c) a user's privacy settings.

<details>
<summary>Answer</summary>

(a) Write-back (fast increments, batch flushes; small loss acceptable). (b) Write-around (don't pollute the cache with rarely read entries). (c) Write-through (must be fresh immediately and never lost).

</details>

### P3. Crash scenario

**Difficulty:** Hard · **Type:** Failure · **Concepts:** write-back risk

A write-back cache flushes to the database every 10 seconds. It receives 2,000 counter increments per second and crashes 7 seconds after the last flush. How many updates are lost (without persistence), and what two measures limit this?

<details>
<summary>Answer</summary>

About 7 × 2,000 = **14,000 increments**. Limit with cache replication/persistence (an append-only log on the cache node or a replica that takes over) and shorter flush intervals; for counters, reconcile from the source events.

</details>
