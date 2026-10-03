# Sparse Table and Range Minimum Query

> [!NOTE]
> **Advanced topic.** Useful when an array never changes and you must answer many range minimum/maximum queries. Learn [Prefix Sum](../../patterns/prefix-sum/content.md) first; compare with the [Segment Tree](../segment-tree/content.md).

## Definition

The **range minimum query (RMQ)** problem asks for the minimum of `arr[l..r]` for many (l, r) pairs. A **sparse table** precomputes the answer for every range whose length is a **power of two**: `table[k][i]` = min of `arr[i .. i + 2ᵏ − 1]`. After O(n log n) preprocessing, any range minimum is answered in **O(1)** by combining two overlapping power-of-two ranges. It works for the **static** case only (no updates).

## Why It Matters

Range min/max queries appear in sliding-window problems, in [lowest common ancestor](../binary-tree-problems/content.md) computation (via an Euler tour of the tree), and in string algorithms (LCP queries on suffix arrays). When there are no updates, a sparse table gives faster queries than a segment tree with simpler code.

## Core Concept

### Doubling

Every range of length 2ᵏ splits into two ranges of length 2ᵏ⁻¹:

```text
table[0][i] = arr[i]
table[k][i] = min(table[k−1][i], table[k−1][i + 2^(k−1)])
```

There are ⌊log₂ n⌋ + 1 levels, each with up to n entries → O(n log n) time and space.

### O(1) query by overlapping

For [l, r], let len = r − l + 1 and k = ⌊log₂ len⌋. The two blocks [l, l + 2ᵏ − 1] and [r − 2ᵏ + 1, r] together cover [l, r] (they may overlap):

```text
min(l, r) = min(table[k][l], table[k][r − 2^k + 1])
```

Overlap is harmless because min is **idempotent**: min(x, x) = x. The same works for max, gcd, bitwise AND/OR. It does **not** work for sum (overlapping elements would be counted twice); for sums use prefix sums, or decompose [l, r] into non-overlapping power-of-two blocks in O(log n).

### Precomputed logarithms

Compute `log[i] = log[i / 2] + 1` for i = 2..n once, so each query avoids floating-point `Math.log`.

## Visual Explanation

```text
arr:      index 0  1  2  3  4  5  6  7
          value 7  2  3  0  5  10 3  12

k = 0 (len 1): 7  2  3  0  5  10 3  12
k = 1 (len 2): 2  2  0  0  5  3  3
k = 2 (len 4): 0  0  0  0  3
k = 3 (len 8): 0

query min(1, 6): len = 6, k = 2 (4 ≤ 6 < 8)
   block A = [1, 4] → table[2][1] = 0
   block B = [3, 6] → table[2][3] = 0          (overlap on [3, 4] is fine)
   answer 0
```

## Operations

### Build

```java
int n = arr.length;
int levels = 32 - Integer.numberOfLeadingZeros(n);        // floor(log2 n) + 1
int[][] table = new int[levels][];
table[0] = arr.clone();
for (int k = 1; k < levels; k++) {
    int half = 1 << (k - 1);
    table[k] = new int[n - (1 << k) + 1];
    for (int i = 0; i < table[k].length; i++) {
        table[k][i] = Math.min(table[k - 1][i], table[k - 1][i + half]);
    }
}
```

**Time:** O(n log n) · **Space:** O(n log n)

### Query

```java
int k = log[r - l + 1];
int answer = Math.min(table[k][l], table[k][r - (1 << k) + 1]);
```

**Time:** O(1)

## Full Java Implementation

```java
public class SparseTable {

    private final int[][] table;
    private final int[] log;

    SparseTable(int[] arr) {
        int n = arr.length;
        log = new int[n + 1];
        for (int i = 2; i <= n; i++) log[i] = log[i / 2] + 1;
        int levels = log[n] + 1;
        table = new int[levels][];
        table[0] = arr.clone();
        for (int k = 1; k < levels; k++) {
            int half = 1 << (k - 1);
            table[k] = new int[n - (1 << k) + 1];
            for (int i = 0; i < table[k].length; i++) {
                table[k][i] = Math.min(table[k - 1][i], table[k - 1][i + half]);
            }
        }
    }

    int min(int l, int r) {                           // inclusive, O(1)
        int k = log[r - l + 1];
        return Math.min(table[k][l], table[k][r - (1 << k) + 1]);
    }

    public static void main(String[] args) {
        SparseTable st = new SparseTable(new int[] {7, 2, 3, 0, 5, 10, 3, 12});
        System.out.println(st.min(1, 6) + " " + st.min(4, 7) + " " + st.min(0, 2) + " " + st.min(5, 5) + " " + st.min(0, 7));
    }
}
```

**Output:**

```text
0 3 2 10 0
```

## Dry Run

Query `min(4, 7)`: len = 4, k = log[4] = 2.

| Block | Range | Value |
|-------|-------|-------|
| A | [4, 7] = table[2][4] | min(5, 10, 3, 12) = 3 |
| B | [7 − 4 + 1, 7] = [4, 7] = table[2][4] | 3 |
| answer | | 3 |

When the length is an exact power of two, both blocks coincide.

## Complexity Summary

| Operation | Time | Space |
|-----------|------|-------|
| Build | O(n log n) | O(n log n) |
| Idempotent query (min, max, gcd) | O(1) | — |
| Sum query (non-overlapping decomposition) | O(log n) | — |
| Update | not supported (rebuild O(n log n)) | — |

## Advantages

- O(1) queries — the fastest RMQ for static data.
- Short, loop-only code; no recursion.

## Disadvantages

- No updates.
- O(n log n) memory (for n = 10⁶, about 20 million ints ≈ 80 MB — check limits).
- O(1) only for idempotent operations.

## Comparison

| | Sparse table | Segment tree | Monotonic deque |
|---|--------------|--------------|-----------------|
| Query type | any static range | any range | sliding windows of fixed or moving bounds |
| Query time | O(1) | O(log n) | O(1) amortized per step |
| Updates | no | O(log n) | stream appends |
| Memory | n log n | 4n | window size |

For "maximum of every window of size k", the [Monotonic Queue](../../patterns/monotonic-queue/content.md) is simpler and O(n) total.

## Java Collections Equivalent

None in the JDK.

## Real-World Applications

- LCA queries in trees via Euler tour + RMQ (O(1) per query).
- Longest common prefix queries between suffixes in string processing.
- Static range statistics in analytics where data is loaded once and queried many times.

## Common Mistakes

- Using floating-point `Math.log` and getting off-by-one levels from rounding.
- Using a sparse table for sums with overlapping blocks (double counting).
- Allocating full n columns at every level and reading past the valid part.
- Choosing it when the array changes — rebuild cost is O(n log n) per change.

## Key Takeaways

- `table[k][i]` = answer for the block of length 2ᵏ starting at i; built by doubling.
- Query = two overlapping power-of-two blocks → O(1) for idempotent operations.
- O(n log n) build and memory; static data only.
