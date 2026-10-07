# Hot Partitions, Resharding and Secondary Indexes — Practice

### P1. Spot the hotspot

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** sequential keys

Orders use an auto-increment ID and are range-partitioned by that ID. Where do new orders go?

- A) Evenly across all shards
- B) All to the shard holding the highest ID range
- C) To the shard with the fewest rows
- D) Randomly

<details>
<summary>Answer</summary>

**Answer:** B) All to the shard holding the highest ID range

</details>

### P2. Scatter-gather cost

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** local indexes

A product catalogue is sharded across 32 shards by `product_id`, with local indexes on `category`. A category page query takes as long as the slowest shard. Why, and what alternative exists?

<details>
<summary>Answer</summary>

With local indexes the query must go to all 32 shards and wait for every response, so its latency is the slowest shard's (tail latency). Alternatives: a global index on `category` (targeted reads, slower and possibly lagging writes), a search engine for category browsing, or caching category pages.

</details>

### P3. Split the hot key

**Difficulty:** Hard · **Type:** Design · **Concepts:** key splitting

A vote counter for a live show receives 100,000 increments/s; one partition handles 10,000 writes/s. Design the counter.

<details>
<summary>Answer</summary>

Split it into at least 10 (better 20 for headroom) sub-counters, `votes:show7#0` … `#19`, each on a different partition; each increment picks a random sub-counter; the total is the sum of all sub-counters, computed on read or periodically and cached. Optionally batch increments in memory before writing.

</details>
