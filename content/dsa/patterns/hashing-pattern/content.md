# Hashing Pattern

## What Is the Pattern

The **hashing pattern** replaces a repeated search with an O(1) expected lookup in a `HashMap` or `HashSet`. While scanning the input once, you store what you have seen (values, counts, indices, or a normalised key) and, for each new element, ask the map whether its "partner" has already appeared.

Tiny example: does `[4, 1, 7, 1]` contain a duplicate? Scan with a set: 4 (new), 1 (new), 7 (new), 1 (already in set) → yes, in one pass instead of comparing all pairs.

How hash tables work internally (hash functions, buckets, collisions, resizing, `equals`/`hashCode`) is covered in [Hashing](../../data-structures/hashing/content.md) and [Java Maps and Sets](../../fundamentals/java-maps-and-sets/content.md); this topic is about recognising when to reach for one.

## Why It Works

A brute-force pair search asks "is there an earlier j that matches i?" by scanning all earlier elements — O(n) per element, O(n²) total. A hash map answers the same question in O(1) expected time because it indexes earlier elements by the exact property you are looking for (the value, the complement, the sorted letters…). The trade is O(n) extra memory for a factor of n in time.

## Recognition Clues

| Clue in the problem | Why it points here |
|---------------------|--------------------|
| "Find two elements that sum to / differ by / pair with …" on **unsorted** data, original indices needed | store each value → index, look up the complement |
| "Duplicate", "seen before", "first unique", "within distance k" | set / map of last index |
| "Count frequency", "most common", "anagram", "same letters" | counting map; canonical key (sorted string, count signature) |
| "Group items that are equivalent" | map from canonical key → list |
| Need O(n) and the input is not sorted (and sorting would lose indices) | hashing instead of [two pointers](../two-pointers/content.md) |
| Subarray sums equal k | hashing over prefix sums ([Prefix Sum](../prefix-sum/content.md)) |

## Typical Problem Structure

- Input: an array or strings, unsorted; values up to 10⁹ (too large for a direct-address array).
- Output: indices of a pair, a boolean, counts, or groups.
- The key question per element: "what earlier element would complete an answer with me?" — that is the lookup key.

## Template

```pseudocode
seen ← empty map               // key → information about earlier elements
for i, x in input:
    partner ← whatPairsWith(x)
    if partner in seen:
        use seen[partner] and i    // answer found / counted
    seen[keyOf(x)] ← update(i)     // add x AFTER the lookup, so x does not pair with itself
```

## Java Template

```java
import java.util.*;

public class HashingTemplates {

    // Frequency counting.
    static Map<String, Integer> frequencies(String[] words) {
        Map<String, Integer> count = new HashMap<>();
        for (String w : words) count.merge(w, 1, Integer::sum);
        return count;
    }

    // Grouping by a canonical key (here: sorted letters).
    static Collection<List<String>> groupByLetters(String[] words) {
        Map<String, List<String>> groups = new LinkedHashMap<>();
        for (String w : words) {
            char[] key = w.toCharArray();
            Arrays.sort(key);
            groups.computeIfAbsent(new String(key), k -> new ArrayList<>()).add(w);
        }
        return groups.values();
    }

    public static void main(String[] args) {
        System.out.println(frequencies(new String[] {"a", "b", "a"}).get("a") + " " + groupByLetters(new String[] {"rat", "tar", "art", "car"}));
    }
}
```

**Output:**

```text
2 [[rat, tar, art], [car]]
```

## Example Problem

**Two Sum.** Given an unsorted integer array and a target, return the indices of the two different elements that add up to the target (exactly one answer exists). Example: `[2, 7, 11, 15]`, target 9 → `[0, 1]`.

- **Brute force:** check every pair (i, j) — O(n²).
- **Why not two pointers:** sorting would scramble the original indices (you could carry them along, but that costs O(n log n) and extra code).
- **Observation:** for element x at index i, the only partner that works is `target − x`. If it appeared earlier, its index is the answer. Store value → index as you scan.

```java
import java.util.*;

public class TwoSum {

    static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> indexOf = new HashMap<>();   // value → index of an earlier element
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            Integer j = indexOf.get(complement);
            if (j != null) return new int[] {j, i};
            indexOf.put(nums[i], i);                       // after the lookup: never pair i with itself
        }
        return new int[] {-1, -1};
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(twoSum(new int[] {2, 7, 11, 15}, 9)) + " "
                + Arrays.toString(twoSum(new int[] {3, 2, 4}, 6)) + " " + Arrays.toString(twoSum(new int[] {3, 3}, 6)));
    }
}
```

**Output:**

```text
[0, 1] [1, 2] [0, 1]
```

## Dry Run

`nums = [3, 2, 4]`, target 6:

| i | value | complement | map (before) | action |
|---|-------|------------|--------------|--------|
| 0 | 3 | 3 | {} | 3 not in map → store 3 → 0 |
| 1 | 2 | 4 | {3: 0} | 4 not in map → store 2 → 1 |
| 2 | 4 | 2 | {3: 0, 2: 1} | 2 found at index 1 → return [1, 2] |

At i = 0 the complement of 3 is 3 itself; because the lookup happens **before** storing, index 0 is not paired with itself. For `[3, 3]` the second 3 finds the first one, giving `[0, 1]`.

## Common Mistakes

- Inserting the current element before the lookup, so an element pairs with itself.
- Using mutable objects or arrays (`int[]`) as keys — arrays use identity `hashCode`; use `List<Integer>`, a `String`, or an encoded `long`.
- Assuming O(1) is guaranteed — it is **expected/average**; adversarial keys can degrade (Java 8+ treeifies large buckets, giving O(log n) worst case per operation).
- Comparing `Integer` values from a map with `==` (works only in the small-integer cache range −128 … 127).
- Iterating a `HashMap` and expecting insertion order (use `LinkedHashMap`).

## Variations

- **Value → count:** frequencies, majority, anagram check, "ransom note".
- **Value → last index:** duplicates within distance k, longest substring without repeats.
- **Value → first index:** longest subarray with a property (with prefix sums).
- **Canonical key → group:** anagram groups, isomorphic patterns, shifted strings.
- **Meet in the middle:** split into two halves, hash all sums of one half (4-sum count, subset sums with n ≈ 40).
- **Set for O(1) membership:** longest consecutive sequence, visited states in BFS.

## Complexity

| Task | Time | Space |
|------|------|-------|
| One pass with lookups | O(n) expected | O(n) |
| Grouping by sorted key (strings of length L) | O(n × L log L) | O(n × L) |
| Worst case (all keys collide) | O(n log n) with Java's tree bins, O(n²) without | O(n) |

## When Not to Use It

- The input is sorted and only values (not original indices) are needed — [two pointers](../two-pointers/content.md) use O(1) space.
- Keys are small integers in a known range — a plain `int[]` count array is faster and simpler.
- You need ordered operations (floor, ceiling, range) — use a `TreeMap` ([Binary Search Tree](../../data-structures/binary-search-tree/content.md)).
- Memory is very tight and an O(n log n) sort-based solution is acceptable.

## Key Takeaways

- Ask "what earlier element completes an answer with this one?" — make that the map key.
- Look up first, then insert.
- O(n) expected time for O(n) memory; prefer arrays for small key ranges and two pointers for sorted input.
