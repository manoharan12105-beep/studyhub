# Cache Eviction Policies and LRU

**Module:** Caching · **Interview priority:** Core

## What Is It?

A cache has limited memory. When it is full and a new entry must be stored, an **eviction policy** chooses which existing entry to remove. The goal is to keep the entries most likely to be requested again, maximising the hit ratio.

## Why It Exists

Caches work because a small hot set of keys gets most requests. Eviction is how the cache keeps tracking that hot set as it changes — yesterday's promotion gives way to today's, last year's phone model to this year's.

## How It Works

### The common policies

| Policy | Evicts | Intuition | Example of a good fit |
|--------|--------|-----------|-----------------------|
| **LRU** — least recently used | The entry not accessed for the longest time | Recently used things will be used again soon | General-purpose: sessions, product pages (nobody looks up last decade's model) |
| **LFU** — least frequently used | The entry with the fewest accesses | Popular things stay popular | Stable popularity: a catalogue's evergreen items; one-off searches get evicted |
| **FIFO** — first in, first out | The oldest inserted entry, regardless of use | Simple age-based turnover | Simple caches where age matters more than use |
| **MRU** — most recently used | The entry just used | Once used, unlikely to be needed again | Sequential scans; a coupon just redeemed; a video segment already watched |
| **LIFO** — last in, first out | The newest inserted entry | Stack-like | Rarely the right choice for caches |
| **TTL-based** | Expired entries first | Time bounds freshness | Combined with any of the above |
| **Random** | A random entry | Cheap, surprisingly decent | Very large caches, hardware caches |

Redis exposes these through `maxmemory-policy` (for example `allkeys-lru`, `allkeys-lfu`, `volatile-ttl`); it uses **approximated** LRU/LFU by sampling a few keys rather than tracking exact order, which saves memory.

### One sequence, five policies

Capacity 3, requests `A B C A D B E`:

| Policy | Evictions | Final contents | Hits |
|--------|-----------|----------------|------|
| LRU | D evicts B, B evicts C, E evicts A | D, B, E | 1 (A) |
| LFU (ties → oldest) | D evicts B, B evicts C, E evicts D | A, B, E | 1 (A) |
| FIFO | D evicts A, E evicts B | C, D, E | 2 (A, B) |
| MRU | D evicts A, E evicts B | C, D, E | 2 (A, B) |
| LIFO | D evicts C, E evicts D | A, B, E | 2 (A, B) |

On this tiny sequence LRU is not the winner — B returned after being pushed out. No policy is best for every access pattern; LRU wins on typical workloads where recent use predicts future use, which is why it is the default.

### Implementing LRU in O(1)

An LRU cache needs `get` and `put` in O(1) time. The classic structure is a **hash map** (key → node) plus a **doubly linked list** ordered by recency: a hit moves the node to the "most recent" end; eviction removes the node at the "least recent" end. Java's `LinkedHashMap` provides exactly this in access-order mode:

```java
import java.util.LinkedHashMap;
import java.util.Map;

public class LruCacheDemo {

    /** LinkedHashMap in access order keeps the least recently used entry first. */
    static final class LruCache<K, V> extends LinkedHashMap<K, V> {
        private final int capacity;

        LruCache(int capacity) {
            super(16, 0.75f, true);              // accessOrder = true: get() moves the entry to the end
            this.capacity = capacity;
        }

        @Override
        protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
            boolean evict = size() > capacity;   // called after every put
            if (evict) {
                System.out.println("  evict " + eldest.getKey());
            }
            return evict;
        }
    }

    public static void main(String[] args) {
        LruCache<String, String> cache = new LruCache<>(3);
        String[] requests = {"A", "B", "C", "A", "D", "B", "E"};
        for (String key : requests) {
            if (cache.get(key) != null) {
                System.out.println(key + ": hit   " + cache.keySet());
            } else {
                System.out.println(key + ": miss");
                cache.put(key, "value-" + key);
                System.out.println("  now   " + cache.keySet());
            }
        }
    }
}
```

**Output:**

```text
A: miss
  now   [A]
B: miss
  now   [A, B]
C: miss
  now   [A, B, C]
A: hit   [B, C, A]
D: miss
  evict B
  now   [C, A, D]
B: miss
  evict C
  now   [A, D, B]
E: miss
  evict A
  now   [D, B, E]
```

`keySet()` lists entries from least to most recently used, so the first key is always the next victim. This class is not thread-safe; a shared cache needs synchronisation or a concurrent cache library.

**Think about it:** a nightly report job scans every product once. Under LRU, what happens to the cache, and which policy would protect it?

<details>
<summary>Answer</summary>

The scan touches millions of products once each, so LRU treats each as "recently used" and evicts the genuinely hot items — the hit ratio collapses for live traffic (**cache pollution**). LFU protects frequently used entries; alternatively, have the job bypass the cache, or use scan-resistant variants (segmented LRU, W-TinyLFU) that admit new keys cautiously.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** "LRU is always best." It fails on scans and on patterns where items return after long gaps. Measure the hit ratio on real traffic before and after changing policy.

## Interview Follow-up

- *"Implement an LRU cache."* Hash map + doubly linked list, O(1) `get` and `put`: on access move the node to the head; on insert beyond capacity remove the tail. In Java, `LinkedHashMap` with `accessOrder = true` and `removeEldestEntry`.

## Key Takeaways

- Eviction chooses what to drop when the cache is full; the goal is the highest hit ratio.
- LRU (recency) is the default; LFU (frequency) resists one-off traffic; FIFO is simple; MRU fits sequential access.
- LRU in O(1): hash map + doubly linked list (`LinkedHashMap` in access order).
- No policy wins everywhere — measure with real access patterns.
