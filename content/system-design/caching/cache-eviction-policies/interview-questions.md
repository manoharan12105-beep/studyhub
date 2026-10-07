# Cache Eviction Policies and LRU — Interview Questions

## Beginner

### Q1. What is a cache eviction policy?

**Style:** Direct

<details>
<summary>Answer</summary>

The rule a full cache uses to choose which entry to remove when a new one must be stored — for example least recently used, least frequently used or first in first out. Its aim is to keep the entries most likely to be requested again so the hit ratio stays high.

</details>

### Q2. What is the difference between LRU and LFU?

**Style:** Comparison

<details>
<summary>Answer</summary>

LRU evicts the entry that has gone longest without being accessed, betting that recent use predicts future use. LFU evicts the entry accessed the fewest times, betting that popular items stay popular. LRU adapts quickly to changing popularity but is polluted by one-off scans; LFU resists one-off traffic but can keep formerly popular items too long unless counts decay.

</details>

## Intermediate

### Q3. How do you implement an LRU cache with O(1) operations?

**Style:** How

<details>
<summary>Answer</summary>

Combine a hash map from key to node with a doubly linked list ordered by recency. `get`: look up the node, move it to the head, return the value. `put`: update and move to the head if present; otherwise insert at the head and, if over capacity, remove the tail node and its map entry. All steps are O(1). In Java, `LinkedHashMap` with access order and `removeEldestEntry` provides this.

</details>

### Q4. When is MRU a better choice than LRU?

**Style:** Scenario

<details>
<summary>Answer</summary>

When access is sequential and items are unlikely to be reused soon after use — scanning through a large file or dataset, video segments already watched, a one-time coupon just redeemed. Evicting the item just used keeps older items that are more likely to be requested.

</details>

### Q5. What is cache pollution?

**Style:** Direct

<details>
<summary>Answer</summary>

Filling the cache with entries that will not be reused — typically from a bulk scan, crawler or batch job — which evicts genuinely hot entries and lowers the hit ratio for normal traffic. Avoid it by letting batch jobs bypass the cache, using LFU or scan-resistant policies, or admitting new entries only after repeated access.

</details>

## Advanced

### Q6. How does Redis implement LRU without a linked list over millions of keys?

**Style:** How

<details>
<summary>Answer</summary>

It approximates: each key stores a last-access clock, and on eviction Redis samples a small number of random keys (configurable, 5 by default) and evicts the best candidate among them, keeping a small pool of good candidates between evictions. This costs little memory and gets close to true LRU; LFU mode similarly uses a compact, decaying access counter per key.

</details>

### Q7. How would you make an LRU cache safe for concurrent access?

**Style:** Design

<details>
<summary>Answer</summary>

Simplest: synchronise `get` and `put` (a lock around the map), accepting contention because even reads modify recency order. For high concurrency, use a proven library (such as Caffeine in Java), which buffers access events and applies them in batches, or stripe the cache into independent segments by key hash so threads rarely contend on the same lock.

</details>
