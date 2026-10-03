# Java Toolkit: HashMap, HashSet, LinkedHashMap, TreeMap and TreeSet

## Purpose

The Java maps and sets used in nearly every DSA solution: what each is built on, what each operation costs (average **and** worst case), which methods save code in interviews, and the traps around `equals`/`hashCode` and mutation. Theory: [Hashing](../../data-structures/hashing/content.md), [Binary Search Tree](../../data-structures/binary-search-tree/content.md).

## `HashMap` and `HashSet`

**Underlying structure:** an array of **buckets**. A key's `hashCode()` is mixed and reduced to a bucket index; colliding keys share a bucket as a linked list. In Java 8+, a bucket with 8 or more entries (when the table has at least 64 buckets) is converted to a **red-black tree**, so the worst case per bucket becomes O(log n) instead of O(n). When size exceeds capacity × **load factor 0.75**, the table doubles and every entry is redistributed. `HashSet` is a `HashMap` whose values are a shared dummy object.

| Operation | Average | Worst |
|-----------|---------|-------|
| `put`, `get`, `containsKey`, `remove` | O(1) | O(log n) treeified bucket; O(n) if keys are not `Comparable` and all collide |
| `add`, `contains`, `remove` (set) | O(1) | same as above |
| `containsValue` | O(n) | O(n) |
| Iterate | O(n + capacity) | |
| Order of iteration | unspecified — may change after resize | |

Useful methods:

| Method | Effect |
|--------|--------|
| `getOrDefault(k, d)` | value or default |
| `merge(k, 1, Integer::sum)` | increment a counter (inserts 1 if absent) |
| `computeIfAbsent(k, x -> new ArrayList<>()).add(v)` | grouping / adjacency lists |
| `putIfAbsent(k, v)` | insert only when absent |
| `entrySet()` | iterate keys and values together |
| `set.add(x)` | returns `false` if `x` was already present — a free duplicate check |

**Use when:** lookups by key, counting, grouping, deduplication, "have I seen this?", memoization.
**Avoid when:** you need ordering, min/max, or range queries (use `TreeMap`), or keys are small dense integers (a plain array is faster).

## `LinkedHashMap` and `LinkedHashSet`

**Underlying structure:** a hash table **plus** a doubly linked list through all entries. Same complexity as `HashMap`, a little more memory, and **predictable iteration order** — insertion order by default, or access order with `new LinkedHashMap<>(16, 0.75f, true)`.

Access order + `removeEldestEntry` gives an LRU cache in a few lines:

```java
import java.util.*;

public class LruCacheDemo {

    static class LruCache<K, V> extends LinkedHashMap<K, V> {
        private final int capacity;

        LruCache(int capacity) {
            super(16, 0.75f, true);              // true = order by access, least recent first
            this.capacity = capacity;
        }

        @Override
        protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
            return size() > capacity;            // evict the least recently used entry
        }
    }

    public static void main(String[] args) {
        LruCache<String, Integer> cache = new LruCache<>(2);
        cache.put("a", 1);
        cache.put("b", 2);
        cache.get("a");                          // "a" becomes most recent
        cache.put("c", 3);                       // evicts "b"
        System.out.println(cache.keySet());
    }
}
```

**Output:**

```text
[a, c]
```

> [!NOTE]
> Interviewers who ask for an LRU cache often want you to build it from a `HashMap` and your own doubly linked list. Know both versions.

## `TreeMap` and `TreeSet`

**Underlying structure:** a **red-black tree** — a self-balancing binary search tree ordered by `compareTo` or a supplied `Comparator`. Height stays O(log n), so every operation is O(log n) in the **worst** case.

| Operation | Cost |
|-----------|------|
| `put`, `get`, `remove`, `containsKey` | O(log n) |
| `firstKey()`, `lastKey()`, `pollFirstEntry()` | O(log n) |
| `floorKey(x)` (largest ≤ x), `ceilingKey(x)` (smallest ≥ x) | O(log n) |
| `lowerKey(x)` (< x), `higherKey(x)` (> x) | O(log n) |
| `headMap(x)`, `tailMap(x)`, `subMap(a, b)` | O(log n) to create a view |
| Iterate in sorted order | O(n) |

`TreeSet` offers the same with `first`, `last`, `floor`, `ceiling`, `lower`, `higher`, `pollFirst`.

**Use when:** you need sorted keys, nearest smaller/larger, ranges, or a multiset of values with removal of any element (sliding-window median, interval booking, leaderboards).
**Avoid when:** you only need lookups — `HashMap` is faster on average.

## Comparison

| Feature | `HashMap` | `LinkedHashMap` | `TreeMap` |
|---------|-----------|-----------------|-----------|
| Underlying structure | hash table | hash table + linked list | red-black tree |
| get/put/remove | O(1) average | O(1) average | O(log n) worst |
| Iteration order | none | insertion or access | sorted by key |
| floor/ceiling/first/last | no | no | yes, O(log n) |
| `null` keys | one allowed | one allowed | not allowed with natural ordering |
| Key requirement | consistent `equals` + `hashCode` | same | `Comparable` or a `Comparator` |

## Interview Traps

### Custom keys need `equals` and `hashCode`

If you override `equals` but not `hashCode`, two equal keys usually land in different buckets and the map treats them as different. Java `record`s generate both automatically, which makes them convenient keys.

### Never mutate a key after inserting it

Changing a field used by `hashCode` (or by `compareTo` for `TreeMap`) leaves the entry in the wrong bucket or tree position; lookups fail.

### Arrays are bad keys

`int[]` uses identity `equals`/`hashCode`. Use `List<Integer>`, a `String` like `"3,4"`, a `record`, or encode two ints into one `long`.

### `TreeMap` uses `compareTo`, not `equals`

Two keys whose comparator returns 0 are treated as the **same key**, even if `equals` says otherwise. A comparator that compares only one field silently merges distinct objects.

### Counting with `get(k) + 1`

`map.put(k, map.get(k) + 1)` throws `NullPointerException` the first time (unboxing `null`). Use `merge` or `getOrDefault`.

```java
import java.util.*;

public class MapTraps {

    static class BadPoint {                       // equals without hashCode
        final int x, y;
        BadPoint(int x, int y) { this.x = x; this.y = y; }
        @Override public boolean equals(Object o) {
            return o instanceof BadPoint p && p.x == x && p.y == y;
        }
    }

    record Point(int x, int y) { }                 // record: equals + hashCode generated

    public static void main(String[] args) {
        Set<BadPoint> bad = new HashSet<>();
        bad.add(new BadPoint(1, 2));
        Set<Point> good = new HashSet<>();
        good.add(new Point(1, 2));
        System.out.println(bad.contains(new BadPoint(1, 2)) + " " + good.contains(new Point(1, 2)));

        Set<int[]> arrays = new HashSet<>();
        arrays.add(new int[] {1, 2});
        System.out.println(arrays.contains(new int[] {1, 2}));

        Map<Character, Integer> freq = new TreeMap<>();
        for (char c : "banana".toCharArray()) {
            freq.merge(c, 1, Integer::sum);
        }
        System.out.println(freq);

        TreeMap<Integer, String> slots = new TreeMap<>(Map.of(9, "nine", 12, "noon", 15, "three"));
        System.out.println(slots.floorKey(13) + " " + slots.ceilingKey(13) + " " + slots.higherKey(15));

        TreeSet<String> byLength = new TreeSet<>(Comparator.comparingInt(String::length));
        byLength.addAll(List.of("ab", "cd", "efg"));
        System.out.println(byLength);              // "cd" was treated as a duplicate of "ab"
    }
}
```

**Output:**

```text
false true
false
{a=3, b=1, n=2}
12 15 null
[ab, efg]
```

## Common Mistakes

- Relying on `HashMap` iteration order (use `LinkedHashMap` or `TreeMap` when order matters).
- Using `TreeMap` when only lookups are needed — an unnecessary log n factor.
- Comparators that consider only part of the key in `TreeSet`/`TreeMap`, silently losing elements. Add tie-breakers (`thenComparing`).
- `map.get(k) == otherMap.get(k)` with `Integer` values above 127 — compare with `equals`.
- Modifying a map while iterating over `keySet()` — use `entrySet().removeIf(...)` or an iterator.

## Key Takeaways

- `HashMap`/`HashSet`: O(1) average, unordered; Java 8+ treeifies crowded buckets (worst O(log n) for comparable keys); resizes at load factor 0.75.
- `LinkedHashMap`: same cost + insertion/access order; basis of a quick LRU cache.
- `TreeMap`/`TreeSet`: red-black tree, O(log n) worst case, sorted, with floor/ceiling/first/last.
- Keys need consistent `equals` + `hashCode` (hash) or `compareTo` (tree), and must not change while stored.
