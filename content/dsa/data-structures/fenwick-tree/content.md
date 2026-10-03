# Fenwick Tree (Binary Indexed Tree)

> [!NOTE]
> **Advanced topic.** Learn [Prefix Sum](../../patterns/prefix-sum/content.md) and [Bit Manipulation](../../algorithms/bit-manipulation/content.md) first. A Fenwick tree is the shortest structure that supports both prefix-sum queries and updates in O(log n), so it is worth knowing for harder interviews.

## Definition

A **Fenwick tree** or **binary indexed tree (BIT)** is an array-based structure that maintains prefix sums of an array under updates. Both `add(i, delta)` (point update) and `prefixSum(i)` take **O(log n)**. Each cell `tree[i]` (1-indexed) stores the sum of a range of elements whose length is the **lowest set bit** of i.

## Why It Matters

It solves the same "sums with updates" problem as a segment tree in about 10 lines of code and n + 1 memory. Typical uses: running counts of values seen so far (inversions, "count of smaller numbers after self"), dynamic frequency tables, and range-update/point-query problems with the difference-array trick.

## Core Concept

### The lowest set bit

`lowbit(i) = i & (−i)` isolates the lowest 1-bit of i (two's complement makes −i = ~i + 1):

| i | binary | i & −i | `tree[i]` covers (1-indexed) |
|---|--------|--------|------------------------------|
| 1 | 0001 | 1 | [1, 1] |
| 2 | 0010 | 2 | [1, 2] |
| 3 | 0011 | 1 | [3, 3] |
| 4 | 0100 | 4 | [1, 4] |
| 5 | 0101 | 1 | [5, 5] |
| 6 | 0110 | 2 | [5, 6] |
| 7 | 0111 | 1 | [7, 7] |
| 8 | 1000 | 8 | [1, 8] |

`tree[i]` stores the sum of `arr[i − lowbit(i) + 1 .. i]`.

### Prefix sum: strip low bits

To get the sum of `arr[1..i]`, add `tree[i]`, then jump to `i − lowbit(i)` (remove the lowest set bit) and repeat until 0. The covered ranges tile [1, i] exactly, and i has at most log₂ n set bits.

```text
prefixSum(7): tree[7] covers [7,7], tree[6] covers [5,6], tree[4] covers [1,4]
              7 (0111) → 6 (0110) → 4 (0100) → 0
```

### Update: add low bits

To add `delta` to `arr[i]`, update every cell whose range contains i: `tree[i]`, then `i + lowbit(i)`, and so on while ≤ n.

```text
add(3, δ): 3 (0011) → 4 (0100) → 8 (1000) → 16 > n stop
           tree[3], tree[4], tree[8] all contain index 3
```

### Range sum

`sum(l, r) = prefixSum(r) − prefixSum(l − 1)` — requires an invertible operation (sum, xor). For min/max use a segment tree or sparse table.

### Range update, point query

Store a **difference array** in the BIT: to add v to [l, r], do `add(l, v)` and `add(r + 1, −v)`. Then the value at index i is `prefixSum(i)`. (Range update + range query needs two BITs — rarely asked.)

## Visual Explanation

```text
index:    1    2    3    4    5    6    7    8
arr:      5    3    7    9    6    4    1    2

tree[8] ┌──────────────────────────────────────┐ 37
tree[4] ┌──────────────────┐                      24
tree[2] ┌────────┐            tree[6] ┌────────┐ 8 | 10
tree[1] ┌──┐ tree[3] ┌──┐ tree[5] ┌──┐ tree[7] ┌──┐  5 | 7 | 6 | 1
```

## Operations

### Add (point update)

```java
void add(int i, long delta) {            // i is 1-indexed
    for (; i <= n; i += i & (-i)) {
        tree[i] += delta;
    }
}
```

**Time:** O(log n)

### Prefix sum

```java
long prefixSum(int i) {                  // sum of arr[1..i]
    long sum = 0;
    for (; i > 0; i -= i & (-i)) {
        sum += tree[i];
    }
    return sum;
}
```

**Time:** O(log n)

### Build

Calling `add` for every element is O(n log n). An O(n) build: copy the array into `tree`, then for each i push `tree[i]` into its parent `i + lowbit(i)` once.

## Full Java Implementation

```java
import java.util.*;

public class FenwickTree {

    private final long[] tree;               // 1-indexed; tree[0] unused
    private final int n;

    FenwickTree(int n) {
        this.n = n;
        tree = new long[n + 1];
    }

    // O(n) build from a 0-indexed array.
    FenwickTree(int[] arr) {
        this(arr.length);
        for (int i = 1; i <= n; i++) {
            tree[i] += arr[i - 1];
            int parent = i + (i & -i);
            if (parent <= n) tree[parent] += tree[i];
        }
    }

    void add(int i, long delta) {
        for (; i <= n; i += i & -i) tree[i] += delta;
    }

    long prefixSum(int i) {
        long sum = 0;
        for (; i > 0; i -= i & -i) sum += tree[i];
        return sum;
    }

    long rangeSum(int l, int r) {            // 1-indexed, inclusive
        return prefixSum(r) - prefixSum(l - 1);
    }

    // Counts inversions (pairs i < j with a[i] > a[j]) using a BIT over values.
    static long countInversions(int[] a) {
        int[] sorted = a.clone();
        Arrays.sort(sorted);
        FenwickTree seen = new FenwickTree(a.length);
        long inversions = 0;
        for (int j = 0; j < a.length; j++) {
            int rank = Arrays.binarySearch(sorted, a[j]) + 1;        // value compressed to 1..n (distinct values)
            inversions += j - seen.prefixSum(rank);                 // earlier elements greater than a[j]
            seen.add(rank, 1);
        }
        return inversions;
    }

    public static void main(String[] args) {
        int[] arr = {5, 3, 7, 9, 6, 4, 1, 2};
        FenwickTree ft = new FenwickTree(arr);
        System.out.println("prefix(7)=" + ft.prefixSum(7) + " sum(2,5)=" + ft.rangeSum(2, 5) + " total=" + ft.prefixSum(8));
        ft.add(3, 10);                                       // arr[3] (1-indexed) 7 -> 17
        System.out.println("after add(3,10): sum(2,5)=" + ft.rangeSum(2, 5));

        FenwickTree diff = new FenwickTree(6);               // range update, point query
        diff.add(2, 5);
        diff.add(5, -5);                                     // +5 on [2, 4]
        diff.add(1, 1);                                      // +1 on [1, 6]
        StringBuilder values = new StringBuilder();
        for (int i = 1; i <= 6; i++) values.append(diff.prefixSum(i)).append(' ');
        System.out.println("point values: " + values.toString().trim());

        System.out.println("inversions: " + countInversions(new int[] {8, 4, 2, 1}) + " " + countInversions(new int[] {3, 1, 2}));
    }
}
```

**Output:**

```text
prefix(7)=35 sum(2,5)=25 total=37
after add(3,10): sum(2,5)=35
point values: 1 6 6 6 1 1
inversions: 6 2
```

## Dry Run

`prefixSum(7)` on the array above (before the update):

| i | binary | tree[i] covers | tree[i] | running sum | next i = i − lowbit |
|---|--------|----------------|---------|-------------|---------------------|
| 7 | 0111 | [7, 7] | 1 | 1 | 6 |
| 6 | 0110 | [5, 6] | 10 | 11 | 4 |
| 4 | 0100 | [1, 4] | 24 | 35 | 0 |

## Complexity Summary

| Operation | Time | Space |
|-----------|------|-------|
| Build | O(n) (or O(n log n) with n adds) | O(n) |
| Point update | O(log n) | — |
| Prefix / range sum | O(log n) | — |
| Range update + point query (difference) | O(log n) each | — |

## Advantages

- Very short code; n + 1 memory.
- Fast in practice (tight loops over an array).

## Disadvantages

- Only works directly for invertible operations (sum, xor); min/max need a segment tree.
- 1-indexing and bit tricks are easy to get wrong.

## Comparison

| | Prefix sum array | Fenwick tree | Segment tree |
|---|------------------|--------------|--------------|
| Query | O(1) | O(log n) | O(log n) |
| Point update | O(n) | O(log n) | O(log n) |
| Operations | invertible | invertible | any associative |
| Code | 3 lines | ~10 lines | 30+ lines |

## Java Collections Equivalent

None in the JDK.

## Real-World Applications

- Counting inversions and order statistics in competitive programming.
- Cumulative frequency tables that change over time (arithmetic coding).
- Leaderboards: "how many players have a score ≤ x?" with score updates.

## Common Mistakes

- Using index 0 (`i & -i` is 0 there, so the loops never end or never run) — shift to 1-indexing.
- Forgetting coordinate compression when values are large or negative.
- Using a BIT for range minimum.
- Mixing up `i += lowbit` (update) and `i -= lowbit` (query).

## Key Takeaways

- `tree[i]` stores the sum of a block of length `i & −i` ending at i.
- Query: strip the lowest bit; update: add the lowest bit — both O(log n).
- Range sum = prefix(r) − prefix(l − 1); range update + point query via a difference array.
- Use it for sums/counts with updates; use a segment tree for min/max or complex operations.
