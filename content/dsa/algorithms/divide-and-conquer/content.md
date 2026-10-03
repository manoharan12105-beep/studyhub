# Divide and Conquer

## Definition

**Divide and conquer** solves a problem in three steps: **divide** it into smaller independent subproblems of the same kind, **conquer** each subproblem recursively (solving tiny ones directly), and **combine** their solutions into the answer. Its running time follows a recurrence such as T(n) = a·T(n/b) + f(n), usually solved with the Master Theorem.

## Why It Matters

Many of the most important algorithms are divide and conquer: [Merge Sort](../merge-sort/content.md), [Quick Sort](../quick-sort/content.md), [Binary Search](../binary-search/content.md), fast exponentiation, Karatsuba multiplication, closest pair of points. Recognising the pattern lets you turn an O(n²) "compare everything with everything" solution into O(n log n) by asking: *if I knew the answers for the two halves, how cheaply could I combine them?*

## Prerequisites

- [Recursion](../recursion/content.md)
- [Recurrence Relations](../../fundamentals/recurrence-relations/content.md)

## Intuition

A manager sorting 10,000 files splits them between two assistants, who each split theirs further, until someone holds a single file. Then the sorted piles are merged back up the chain. No one ever handles the whole problem; the work at each level is shared, and there are only log₂ n levels.

## How It Works

1. **Base case:** if the input is small (size 0 or 1, or below a threshold), solve it directly.
2. **Divide:** split into a subproblems, each of size about n/b. The pieces must be **independent** — no shared sub-subproblems (if they overlap, use [Dynamic Programming](../dynamic-programming/content.md)).
3. **Conquer:** solve each piece recursively.
4. **Combine:** build the answer from the pieces' answers in f(n) time.
5. **Analyse:** T(n) = a·T(n/b) + f(n).

| Algorithm | Divide | Conquer | Combine | Recurrence | Time |
|-----------|--------|---------|---------|------------|------|
| Binary search | compare with the middle | one half only | nothing | T(n/2) + O(1) | O(log n) |
| Merge sort | split at the middle — O(1) | both halves | merge — O(n) | 2T(n/2) + O(n) | O(n log n) |
| Quick sort | partition — O(n) | both sides | nothing | 2T(n/2) + O(n) on average | O(n log n) average |
| Fast power aⁿ | halve the exponent | one subproblem | square (× a if odd) | T(n/2) + O(1) | O(log n) |
| Maximum subarray (D&C) | split at the middle | both halves | best crossing sum — O(n) | 2T(n/2) + O(n) | O(n log n) |
| Count inversions | split | both halves | count while merging — O(n) | 2T(n/2) + O(n) | O(n log n) |
| Closest pair of points | split by x | both halves | check a strip — O(n) after sorting | 2T(n/2) + O(n) | O(n log n) |
| Karatsuba multiplication | split digits | 3 products | additions — O(n) | 3T(n/2) + O(n) | O(n^1.585) |

Note where the work lives: merge sort's work is in **combine**, quick sort's in **divide**, binary search discards half and has neither.

## Visual Explanation

```text
Maximum subarray sum of [-2, 1, -3, 4, -1, 2, 1, -5, 4] by divide and conquer:

                     whole array
              /           |              \
     best in left    best in right    best CROSSING the middle
     [-2, 1, -3, 4]  [-1, 2, 1, -5, 4]   = best suffix of left + best prefix of right
          = 4             = 4               = 4 + (−1 + 2 + 1) = 6

answer = max(4, 4, 6) = 6     (subarray [4, -1, 2, 1])
```

## Pseudocode

```pseudocode
solve(problem):
    if size(problem) ≤ threshold: return directSolution(problem)
    parts ← divide(problem)
    results ← [solve(p) for p in parts]
    return combine(results)
```

## Java Implementation

```java
public class DivideAndConquer {

    // Maximum subarray sum, O(n log n): best of left, best of right, best crossing the middle.
    static long maxSubarray(int[] a, int lo, int hi) {
        if (lo == hi) return a[lo];
        int mid = lo + (hi - lo) / 2;
        long left = maxSubarray(a, lo, mid);
        long right = maxSubarray(a, mid + 1, hi);
        long bestSuffix = Long.MIN_VALUE, sum = 0;
        for (int i = mid; i >= lo; i--) {                // best sum ending at mid
            sum += a[i];
            bestSuffix = Math.max(bestSuffix, sum);
        }
        long bestPrefix = Long.MIN_VALUE;
        sum = 0;
        for (int i = mid + 1; i <= hi; i++) {            // best sum starting at mid + 1
            sum += a[i];
            bestPrefix = Math.max(bestPrefix, sum);
        }
        return Math.max(Math.max(left, right), bestSuffix + bestPrefix);
    }

    // Fast exponentiation: a^n = (a^(n/2))^2, times a if n is odd.
    static long power(long a, int n) {
        if (n == 0) return 1;
        long half = power(a, n / 2);                     // one subproblem, reused twice
        return (n % 2 == 0) ? half * half : half * half * a;
    }

    // Count how many times the recursion splits, to show the log n depth.
    static int depth(int lo, int hi) {
        if (lo >= hi) return 0;
        int mid = lo + (hi - lo) / 2;
        return 1 + Math.max(depth(lo, mid), depth(mid + 1, hi));
    }

    public static void main(String[] args) {
        int[] a = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
        System.out.println("max subarray = " + maxSubarray(a, 0, a.length - 1));
        System.out.println("max subarray of all negatives = " + maxSubarray(new int[] {-8, -3, -6}, 0, 2));
        System.out.println("3^13 = " + power(3, 13) + ", 2^62 = " + power(2, 62));
        System.out.println("recursion depth for n = 1,000,000: " + depth(0, 999_999));
    }
}
```

**Output:**

```text
max subarray = 6
max subarray of all negatives = -3
3^13 = 1594323, 2^62 = 4611686018427387904
recursion depth for n = 1,000,000: 20
```

## Dry Run

`power(3, 13)`: 13 = 1101₂.

| Call | n | half = power(3, n/2) | Result |
|------|---|----------------------|--------|
| power(3, 13) | 13 (odd) | power(3, 6) = 729 | 729 × 729 × 3 = 1,594,323 |
| power(3, 6) | 6 (even) | power(3, 3) = 27 | 27 × 27 = 729 |
| power(3, 3) | 3 (odd) | power(3, 1) = 3 | 3 × 3 × 3 = 27 |
| power(3, 1) | 1 (odd) | power(3, 0) = 1 | 1 × 1 × 3 = 3 |
| power(3, 0) | 0 | — | 1 |

Five calls instead of 13 multiplications. Calling `power(a, n/2)` **twice** instead of reusing `half` would make it T(n) = 2T(n/2) + O(1) = O(n) — the classic mistake.

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| General | from T(n) = a·T(n/b) + f(n) | Master Theorem: compare f(n) with n^(log_b a) |
| Best / Average / Worst | depends on the algorithm | quick sort differs by case because its split sizes depend on the pivot |

**Space:** recursion depth × space per frame, plus combine buffers (O(log n) depth for balanced halving; merge sort adds an O(n) buffer).

## Properties

- Subproblems are **independent** (contrast with DP's overlapping subproblems).
- Naturally parallel: independent subproblems can run on different cores.
- Balanced splits give O(log n) depth; unbalanced splits (quick sort's worst case) give O(n).

## Variations

- **Decrease and conquer:** only one subproblem (binary search, fast power, quickselect).
- **Hybrid algorithms:** switch to a simple method below a threshold (insertion sort for small subarrays).
- **D&C on trees:** a node's answer from its subtrees (height, diameter) — see [Binary Tree Problems](../../data-structures/binary-tree-problems/content.md).

## Comparison

| | Divide and conquer | Dynamic programming | Greedy |
|---|--------------------|---------------------|--------|
| Subproblems | independent | overlapping — solved once and stored | one choice, no backtracking |
| Typical example | merge sort | longest common subsequence | activity selection |
| If used on overlapping subproblems | exponential repeated work | — | — |

## Edge Cases

- Base cases for size 0 and 1 (and odd sizes when splitting).
- Integer overflow in `mid` and in combined values (sums, powers).
- Very unbalanced splits → deep recursion.

## Advantages

- Often turns O(n²) into O(n log n); clean recursive structure; parallelisable; cache-friendly when subproblems fit in cache.

## Disadvantages

- Recursion overhead and stack usage; combine steps can need extra memory.
- Inefficient when subproblems overlap (use DP).

## When to Use

- The problem on n items can be answered from answers on halves plus a linear (or cheaper) combine.
- "Sort", "count pairs with a property across the array", "search a sorted space", "compute a power".

**When not to use:** subproblems overlap (Fibonacci) — memoize instead; or a simple linear scan exists (maximum subarray also has an O(n) Kadane solution — see [Brute Force to Optimal](../../problem-solving/brute-force-to-optimal/content.md)).

## Common Mistakes

- Recomputing the same subproblem twice in one call (`power(a, n/2) * power(a, n/2)`).
- Forgetting the crossing case in the combine step (maximum subarray, closest pair).
- Wrong base case for odd/even splits causing infinite recursion (e.g. splitting [lo, hi] as [lo, mid − 1] and [mid, hi] with mid = lo).

## Key Takeaways

- Divide into independent subproblems, conquer recursively, combine.
- Write the recurrence T(n) = a·T(n/b) + f(n) and solve it with the Master Theorem.
- Work can live in divide (quick sort), in combine (merge sort) or nowhere (binary search).
- Overlapping subproblems → dynamic programming instead.
