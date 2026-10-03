# Hashing

## Definition

**Hashing** maps a key to an array index using a **hash function**, so a key's value can be stored and found without searching. A **hash table** is an array of slots (buckets) plus a hash function; it supports insert, lookup and delete in **O(1) average** time. Two keys mapping to the same index is a **collision**, resolved by **chaining** (each bucket holds a list) or **open addressing** (probe for another free slot).

## Why It Matters

Hash tables turn O(n) searches into O(1) average lookups, which is the single most common optimisation in interview solutions: "have I seen this before?", "how many times does it occur?", "where is its complement?". Java's `HashMap` and `HashSet` are hash tables; knowing their internals explains when they are fast and when they are not.

## Core Concept

### Hash function

A hash function turns a key into an integer; the table reduces it to an index:

```text
index = hash(key) mod capacity
```

A good hash function is:

- **Deterministic** — the same key always gives the same hash.
- **Uniform** — keys spread evenly over the indices, minimising collisions.
- **Fast** — O(1) for fixed-size keys, O(L) for strings of length L.

Java's `String.hashCode()` is s[0]×31ⁿ⁻¹ + s[1]×31ⁿ⁻² + … + s[n−1] (with `int` overflow), cached after the first call. `HashMap` then mixes the high bits into the low bits (`h ^ (h >>> 16)`) and uses `hash & (capacity − 1)` — capacity is always a power of two, so this equals `mod capacity` for non-negative values.

### Collisions are unavoidable

There are more possible keys than slots, so different keys will share an index (pigeonhole principle). Even with 23 random keys in 365 slots, the chance of at least one collision exceeds 50% (the birthday paradox). A hash table's design is mostly about handling collisions well.

### Collision resolution 1: separate chaining

Each bucket holds a linked list (or another small structure) of all entries that hashed there. Lookup = hash to the bucket, then scan its list.

```text
capacity 5, hash(k) = k mod 5
bucket 0: → (10, "ten") → (25, "twenty-five")
bucket 1: → (6, "six")
bucket 2: (empty)
bucket 3: → (3, "three")
bucket 4: → (14, "fourteen")
```

### Collision resolution 2: open addressing

All entries live in the array itself. On a collision, **probe** other slots in a fixed sequence until an empty one is found:

| Probing | Next slot on the i-th attempt | Issue |
|---------|-------------------------------|-------|
| Linear | (h + i) mod m | **primary clustering** — runs of occupied slots grow and slow everything down |
| Quadratic | (h + i²) mod m | secondary clustering; may not visit every slot unless m is chosen carefully |
| Double hashing | (h + i × h₂(key)) mod m | best spread; needs a second hash that is never 0 |

Deletion is subtle: emptying a slot would break the probe chain for keys inserted after it, so deleted slots are marked with a **tombstone** that lookups skip over but insertions may reuse.

| | Chaining | Open addressing |
|---|----------|-----------------|
| Load factor | can exceed 1 | must stay below 1 (typically ≤ 0.7) |
| Memory | extra node objects | compact single array, cache-friendly |
| Deletion | simple unlink | needs tombstones |
| Performance as table fills | degrades gradually | degrades sharply near full |
| Used by | Java `HashMap` | Python `dict`, many C++/Rust tables |

### Load factor and rehashing

**Load factor** α = number of entries ÷ number of buckets. With chaining and a uniform hash, the expected bucket length is α, so operations cost O(1 + α). Keeping α bounded keeps operations O(1) on average.

When α exceeds a threshold (0.75 in Java's `HashMap`), the table **rehashes**: it allocates a larger array (Java doubles it) and re-inserts every entry, because indices depend on capacity. A rehash costs O(n), but doubling makes it O(1) **amortized** per insertion (see [Amortized Analysis](../../fundamentals/amortized-analysis/content.md)).

### Worst case

If every key lands in one bucket (bad hash function or adversarial keys), each operation degrades to O(n). Java 8+ converts a bucket with 8 or more entries into a red-black tree (once the table has at least 64 buckets), which caps that bucket at O(log n) for keys that are `Comparable`.

### Java's hash-based classes

| Class | What it is |
|-------|-----------|
| `HashMap<K, V>` | chaining hash table, no order |
| `HashSet<E>` | a `HashMap` with dummy values — stores keys only |
| `LinkedHashMap<K, V>` | `HashMap` + doubly linked list of entries → insertion or access order |
| `TreeMap<K, V>` | **not** hashing: a red-black tree, O(log n), sorted keys |

API details, `equals`/`hashCode` rules and traps: [Java Toolkit: HashMap, HashSet, LinkedHashMap, TreeMap and TreeSet](../../fundamentals/java-maps-and-sets/content.md).

### Frequency maps

The most common use of hashing in interviews: count occurrences in one pass.

```java
Map<String, Integer> freq = new HashMap<>();
for (String word : words) {
    freq.merge(word, 1, Integer::sum);       // insert 1, or add 1 to the existing count
}
```

When keys are small integers or letters, an `int[]` indexed by the key is a "perfect hash" and faster still.

## Visual Explanation

```text
put("cat") with capacity 8:

"cat".hashCode() = 98262  →  98262 ^ (98262 >>> 16) = 98263  →  98263 & 7 = 7

index:   0     1     2     3     4     5     6     7
       [   ] [   ] [   ] [   ] [   ] [ • ] [ • ] [ • ]
                                       │     │     │
                                "dog"→"owl" "ant" "cat"

"dog" (99644) and "owl" (110468) both reduce to index 5, so they share a chain.
```

## Operations

### Insert / update (chaining)

1. Compute the bucket index from the key's hash.
2. Scan the bucket's list; if the key exists, replace its value.
3. Otherwise add a new entry; if size / capacity > load factor, rehash.

**Time:** O(1) average, amortized · **Space:** O(1) per entry

### Lookup

1. Compute the bucket index.
2. Scan the bucket comparing keys with `equals`.

**Time:** O(1) average, O(n) worst (O(log n) with treeified buckets)

### Delete

1. Find the entry as in lookup.
2. Unlink it from the bucket's list (chaining) or mark a tombstone (open addressing).

**Time:** O(1) average

## Full Java Implementation

A chaining hash map with resizing, written from scratch:

```java
import java.util.*;

public class ChainedHashMap<K, V> {

    private static class Entry<K, V> {
        final K key;
        V value;
        Entry<K, V> next;

        Entry(K key, V value, Entry<K, V> next) {
            this.key = key;
            this.value = value;
            this.next = next;
        }
    }

    private static final double MAX_LOAD = 0.75;
    private Entry<K, V>[] buckets;
    private int size;

    @SuppressWarnings("unchecked")
    public ChainedHashMap(int capacity) {
        buckets = (Entry<K, V>[]) new Entry[capacity];
    }

    private int indexFor(Object key, int capacity) {
        int h = (key == null) ? 0 : key.hashCode();
        return (h & 0x7fffffff) % capacity;         // clear the sign bit, then reduce
    }

    public V get(K key) {
        for (Entry<K, V> e = buckets[indexFor(key, buckets.length)]; e != null; e = e.next) {
            if (Objects.equals(e.key, key)) {
                return e.value;
            }
        }
        return null;
    }

    public void put(K key, V value) {
        int i = indexFor(key, buckets.length);
        for (Entry<K, V> e = buckets[i]; e != null; e = e.next) {
            if (Objects.equals(e.key, key)) {
                e.value = value;                    // update existing key
                return;
            }
        }
        buckets[i] = new Entry<>(key, value, buckets[i]);   // prepend to the chain
        size++;
        if ((double) size / buckets.length > MAX_LOAD) {
            resize();
        }
    }

    public boolean remove(K key) {
        int i = indexFor(key, buckets.length);
        Entry<K, V> prev = null;
        for (Entry<K, V> e = buckets[i]; e != null; prev = e, e = e.next) {
            if (Objects.equals(e.key, key)) {
                if (prev == null) {
                    buckets[i] = e.next;
                } else {
                    prev.next = e.next;
                }
                size--;
                return true;
            }
        }
        return false;
    }

    @SuppressWarnings("unchecked")
    private void resize() {
        Entry<K, V>[] old = buckets;
        buckets = (Entry<K, V>[]) new Entry[old.length * 2];
        for (Entry<K, V> head : old) {
            for (Entry<K, V> e = head; e != null; e = e.next) {
                int i = indexFor(e.key, buckets.length);     // index depends on capacity
                buckets[i] = new Entry<>(e.key, e.value, buckets[i]);
            }
        }
    }

    public int size() {
        return size;
    }

    public int capacity() {
        return buckets.length;
    }

    public static void main(String[] args) {
        ChainedHashMap<String, Integer> map = new ChainedHashMap<>(4);
        String[] words = {"apple", "banana", "apple", "cherry", "date", "banana", "apple"};
        for (String w : words) {
            Integer count = map.get(w);
            map.put(w, count == null ? 1 : count + 1);
        }
        System.out.println("apple=" + map.get("apple") + " banana=" + map.get("banana") + " fig=" + map.get("fig"));
        System.out.println("size=" + map.size() + " capacity=" + map.capacity());
        map.remove("apple");
        System.out.println("after remove: apple=" + map.get("apple") + " size=" + map.size());
    }
}
```

**Output:**

```text
apple=3 banana=2 fig=null
size=4 capacity=8
after remove: apple=null size=3
```

The table started with 4 buckets; the 4th distinct key pushed the load factor to 1.0 > 0.75, so it doubled to 8.

## Dry Run

Linear probing, capacity 7, h(k) = k mod 7. Insert 10, 3, 17, 24:

| Key | h(k) | Probe sequence | Placed at | Table |
|-----|------|----------------|-----------|-------|
| 10 | 3 | 3 | 3 | `[_, _, _, 10, _, _, _]` |
| 3 | 3 | 3 (taken) → 4 | 4 | `[_, _, _, 10, 3, _, _]` |
| 17 | 3 | 3 → 4 → 5 | 5 | `[_, _, _, 10, 3, 17, _]` |
| 24 | 3 | 3 → 4 → 5 → 6 | 6 | `[_, _, _, 10, 3, 17, 24]` |

Every key with hash 3 now walks the whole cluster — primary clustering. Delete 3 by emptying slot 4 and a later lookup of 17 would stop at the empty slot and wrongly report "not found"; a tombstone at slot 4 prevents that.

## Complexity Summary

| Operation | Average | Worst | Space |
|-----------|---------|-------|-------|
| Insert | O(1) amortized | O(n) (O(log n) treeified in Java) | O(n) total |
| Lookup | O(1) | O(n) (O(log n) treeified) | |
| Delete | O(1) | O(n) (O(log n) treeified) | |
| Rehash | — | O(n) occasionally | O(n) new array |
| Iterate | O(n + capacity) | | |

Averages assume a hash function that spreads keys uniformly and a bounded load factor.

## Advantages

- O(1) average insert, lookup and delete.
- Works for any key type with a good `hashCode`/`equals`.
- Simple to use; turns many O(n²) algorithms into O(n).

## Disadvantages

- No ordering: no min/max, floor/ceiling or sorted iteration.
- Worst case O(n) with bad hashing; occasional O(n) rehash pauses.
- Extra memory for buckets and entries.

## Comparison

| | Hash table (`HashMap`) | Balanced BST (`TreeMap`) | Sorted array |
|---|-----------------------|--------------------------|--------------|
| Lookup | O(1) average | O(log n) | O(log n) |
| Insert / delete | O(1) average | O(log n) | O(n) |
| Ordered queries (min, floor, range) | O(n) | O(log n) | O(log n) |
| Worst-case guarantee | no | yes | yes |

## Java Collections Equivalent

`HashMap`, `HashSet`, `LinkedHashMap`, `LinkedHashSet`; `TreeMap`/`TreeSet` when order is needed. Use `int[]` counts for small fixed alphabets.

## Real-World Applications

- Caches (memoization, web caches, LRU with `LinkedHashMap`).
- Database hash indexes and hash joins.
- Symbol tables in compilers and interpreters.
- Deduplication (sets of seen URLs, user ids); counting (word frequencies).
- Checksums and content-addressed storage use hash functions (cryptographic ones) for a different goal: detecting changes.

## Common Mistakes

- Overriding `equals` without `hashCode` (or vice versa) for custom keys.
- Mutating a key after inserting it.
- Using arrays (`int[]`) as keys — identity-based hashing.
- Assuming iteration order of a `HashMap`.
- Claiming O(1) without "average"; forgetting O(L) to hash a string of length L.

## Key Takeaways

- Hash function → index; collisions are resolved by chaining (Java) or open addressing (probing + tombstones).
- Load factor bounds bucket length; rehashing (doubling) keeps inserts O(1) amortized.
- O(1) average, O(n) worst (O(log n) treeified buckets in Java 8+).
- Use hashing for "seen before?", counting, grouping and complement lookups — see the [Hashing Pattern](../../patterns/hashing-pattern/content.md).
