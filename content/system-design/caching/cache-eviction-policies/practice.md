# Cache Eviction Policies and LRU — Practice

### P1. Pick the victim

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** LRU

LRU cache of capacity 3 holds X, Y, Z, accessed in that order (X longest ago). Then Y is read. A new key W arrives. Which key is evicted?

- A) X
- B) Y
- C) Z
- D) W

<details>
<summary>Answer</summary>

**Answer:** A) X

Order from least to most recent after reading Y: X, Z, Y.

</details>

### P2. Trace LRU

**Difficulty:** Medium · **Type:** Output · **Concepts:** LRU trace

Capacity 2. Requests: `1 2 1 3 2 4 1`. Under LRU, which requests hit, and what is in the cache at the end?

<details>
<summary>Answer</summary>

1 miss [1]; 2 miss [1,2]; 1 hit [2,1]; 3 miss, evict 2 → [1,3]; 2 miss, evict 1 → [3,2]; 4 miss, evict 3 → [2,4]; 1 miss, evict 2 → [4,1]. **One hit** (the second request for 1); final contents **{4, 1}**.

</details>

### P3. Trace FIFO

**Difficulty:** Medium · **Type:** Output · **Concepts:** FIFO trace

Same capacity 2 and requests `1 2 1 3 2 4 1` under FIFO. Which hit?

<details>
<summary>Answer</summary>

1 miss [1]; 2 miss [1,2]; 1 hit (order unchanged); 3 miss, evict 1 (oldest) → [2,3]; 2 hit; 4 miss, evict 2 → [3,4]; 1 miss, evict 3 → [4,1]. **Two hits** (1 and 2). FIFO happens to beat LRU on this sequence.

</details>

### P4. Choose a policy

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** policy choice

An e-commerce cache's hit ratio collapses every night at 2 a.m. when a pricing job reads every product once. Suggest two fixes.

<details>
<summary>Answer</summary>

Make the job bypass the cache (read the database or a replica directly), or switch to LFU or a scan-resistant policy (such as W-TinyLFU) so one-off reads cannot evict frequently used items.

</details>
