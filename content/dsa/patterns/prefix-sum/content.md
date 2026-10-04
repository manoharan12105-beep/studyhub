# Prefix Sum

## What Is the Pattern

A **prefix sum** array stores running totals: `prefix[0] = 0` and `prefix[i] = a[0] + … + a[i − 1]`. Any range sum then takes O(1):

**sum(a[l … r]) = prefix[r + 1] − prefix[l]**

Combined with a hash map of earlier prefix values, it also counts or finds subarrays with a given sum in one pass — even when the array has negative numbers.

Tiny example: `a = [3, 1, 4, 1, 5]` → `prefix = [0, 3, 4, 8, 9, 14]`; sum of `a[1 … 3]` = 9 − 3 = 6 (1 + 4 + 1).

## Why It Works

A subarray sum is the difference of two prefix sums: everything up to r, minus everything before l. Precomputing all prefixes once (O(n)) turns each range query from O(length) into O(1).

For "subarrays with sum k", a subarray ending at index i has sum k exactly when some earlier prefix equals `prefix[i + 1] − k`. A hash map from prefix value → number of times seen answers that in O(1), so the whole count takes O(n) instead of O(n²) over all (l, r) pairs. Unlike a [sliding window](../sliding-window/content.md), this does not need the values to be non-negative.

## Recognition Clues

| Clue in the problem | Why it points here |
|---------------------|--------------------|
| Many queries "sum of elements between l and r" on a fixed array | O(1) per query after O(n) setup |
| "Number of subarrays whose sum equals k" (values can be negative) | prefix difference + hash map |
| "Subarray sum divisible by k", "equal number of 0s and 1s", "balanced" | transform values, then match equal prefix values (or residues) |
| "Product of array except self", "left total vs right total", "pivot index" | prefix (and suffix) aggregates |
| 2D grid with rectangle sum queries | 2D prefix sums |

## Typical Problem Structure

- Input: an integer array (or matrix), possibly with negative values; a target k or a list of range queries.
- Output: range sums, a count of subarrays, the longest/shortest subarray meeting a sum condition, or an index.
- No updates between queries — if values change, use a [Fenwick tree](../../data-structures/fenwick-tree/content.md) or [segment tree](../../data-structures/segment-tree/content.md).

## Template

```pseudocode
// range sums
prefix[0] ← 0
for i from 0 to n − 1: prefix[i + 1] ← prefix[i] + a[i]
rangeSum(l, r) = prefix[r + 1] − prefix[l]

// count subarrays with sum k
seen ← map {0: 1}            // the empty prefix
running ← 0; count ← 0
for x in a:
    running ← running + x
    count ← count + seen.get(running − k, 0)
    seen[running] ← seen.get(running, 0) + 1
```

## Java Template

```java
import java.util.*;

public class PrefixSumTemplates {

    static long[] buildPrefix(int[] a) {
        long[] prefix = new long[a.length + 1];        // long: sums can exceed int
        for (int i = 0; i < a.length; i++) prefix[i + 1] = prefix[i] + a[i];
        return prefix;
    }

    static long rangeSum(long[] prefix, int l, int r) { return prefix[r + 1] - prefix[l]; }

    public static void main(String[] args) {
        long[] p = buildPrefix(new int[] {3, 1, 4, 1, 5});
        System.out.println(Arrays.toString(p) + " sum[1..3] = " + rangeSum(p, 1, 3));
    }
}
```

**Output:**

```text
[0, 3, 4, 8, 9, 14] sum[1..3] = 6
```

## Example Problem

**Count subarrays with sum k.** Given an integer array (values may be negative) and k, return how many contiguous subarrays sum to k. Example: `[1, 2, 3]`, k = 3 → `2` (`[1, 2]` and `[3]`).

- **Brute force:** every (l, r) pair with a running sum — O(n²).
- **Why a sliding window fails:** with negative numbers, extending a window can lower its sum, so there is no rule for when to shrink.
- **Observation:** subarray (l, r] sums to k ⇔ `prefix[r] − prefix[l] = k` ⇔ `prefix[l] = prefix[r] − k`. Count earlier prefixes with that value using a map.

```java
import java.util.*;

public class SubarraySumK {

    static int subarraySum(int[] a, int k) {
        Map<Long, Integer> seen = new HashMap<>();
        seen.put(0L, 1);                                   // empty prefix: subarrays starting at index 0
        long running = 0;
        int count = 0;
        for (int x : a) {
            running += x;
            count += seen.getOrDefault(running - k, 0);    // earlier prefixes that leave exactly k
            seen.merge(running, 1, Integer::sum);
        }
        return count;
    }

    public static void main(String[] args) {
        System.out.println(subarraySum(new int[] {1, 1, 1}, 2) + " " + subarraySum(new int[] {1, 2, 3}, 3) + " "
                + subarraySum(new int[] {1, -1, 0}, 0) + " " + subarraySum(new int[] {3, 4, 7, 2, -3, 1, 4, 2}, 7));
    }
}
```

**Output:**

```text
2 2 3 4
```

## Dry Run

`a = [1, -1, 0]`, k = 0:

| x | running | running − k | seen before | count += | seen after |
|---|---------|-------------|-------------|----------|------------|
| 1 | 1 | 1 | {0:1} | 0 | {0:1, 1:1} |
| −1 | 0 | 0 | {0:1, 1:1} | 1 (`[1, −1]`) | {0:2, 1:1} |
| 0 | 0 | 0 | {0:2, 1:1} | 2 (`[0]`, `[1, −1, 0]`) | {0:3, 1:1} |

Total 3. The update order matters: query the map **before** adding the current prefix, or a subarray of length 0 would be counted when k = 0.

## Common Mistakes

- Forgetting `seen.put(0, 1)` — misses subarrays that start at index 0.
- Adding the current prefix to the map before querying it.
- Off-by-one between `prefix[r] − prefix[l − 1]` and `prefix[r + 1] − prefix[l]` — pick the length-(n + 1) convention and stick to it.
- `int` overflow in running sums (n × max value can exceed 2³¹).
- Using prefix sums when the array is updated between queries (each update costs O(n) to rebuild).

## Variations

- **Longest subarray with sum k:** store the **first** index of each prefix value instead of a count.
- **Divisible by k:** match prefix residues `Math.floorMod(prefix, k)`.
- **Equal 0s and 1s:** map 0 → −1, then look for equal prefix sums.
- **Prefix XOR / product:** same idea with another invertible operation (`xor(l, r) = px[r + 1] ^ px[l]`).
- **2D prefix sums:** `P[i][j]` = sum of the top-left i × j rectangle; rectangle sum by inclusion–exclusion of four corners.
- **Range updates instead of queries:** the inverse idea, the [difference array](../difference-array/content.md).

## Complexity

| Task | Time | Space |
|------|------|-------|
| Build prefix array | O(n) | O(n) |
| Range sum query | O(1) | — |
| Count subarrays with sum k | O(n) expected | O(n) map |
| 2D build / query | O(R × C) / O(1) | O(R × C) |

## When Not to Use It

- Values change between queries — use a Fenwick or segment tree (O(log n) per update and query).
- Range **minimum/maximum** — not invertible by subtraction; use a [sparse table](../../data-structures/sparse-table/content.md) or a segment tree.
- All values non-negative and you need the longest/shortest window — a sliding window uses O(1) space.

## Key Takeaways

- `sum(l … r) = prefix[r + 1] − prefix[l]`, with `prefix[0] = 0`.
- Count/find subarrays with sum k: map of earlier prefix values, seeded with {0: 1}; works with negatives.
- Transform the values (0 → −1, residues, XOR) to reduce new problems to "equal prefixes".
