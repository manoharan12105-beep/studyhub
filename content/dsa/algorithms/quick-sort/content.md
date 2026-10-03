# Quick Sort

## Definition

**Quick sort** is a divide-and-conquer sort that picks a **pivot**, **partitions** the array so that smaller elements come before the pivot and larger ones after it, then recursively sorts the two parts. It is **O(n log n)** on average and **O(n²)** in the worst case (consistently unbalanced partitions). It sorts **in place** with O(log n) stack on average and is **not stable**.

## Why It Matters

Quick sort is usually the fastest general-purpose sort for arrays in practice: it works in place, scans memory sequentially (cache-friendly) and has small constant factors. Java's `Arrays.sort` for primitives is a dual-pivot quick sort. Its **partition** step is a reusable tool — quickselect (k-th element), Dutch national flag (three-way partition), moving zeros — and its worst case is a favourite interview question.

## Prerequisites

- [Recursion](../recursion/content.md)
- [Divide and Conquer](../divide-and-conquer/content.md)

## Intuition

Choose one element and put it exactly where it belongs: everything smaller goes to its left, everything larger to its right. The pivot is now in its final position and never moves again; the two sides are independent smaller problems. Unlike merge sort, the hard work happens **before** recursing (partition), and there is nothing to combine afterwards.

## How It Works

### Lomuto partition (pivot = last element)

1. `pivot = arr[hi]`, `i = lo` (next slot for a "small" element).
2. For j = lo to hi − 1: if `arr[j] < pivot`, swap `arr[i]` and `arr[j]`, `i++`.
3. Swap `arr[i]` and `arr[hi]` — the pivot lands at index i, its final position.
4. Recurse on [lo, i − 1] and [i + 1, hi].

Invariant during the loop: `arr[lo..i−1] < pivot`, `arr[i..j−1] ≥ pivot`.

### Hoare partition (awareness)

Two pointers move inward from both ends and swap pairs that are on the wrong sides. It does about three times fewer swaps than Lomuto on average and handles many duplicates better, but the pivot is not necessarily at its final position afterwards — recurse on [lo, p] and [p + 1, hi].

### Choosing the pivot

| Strategy | Effect |
|----------|--------|
| First or last element | O(n²) on already sorted or reverse-sorted input |
| **Random element** | expected O(n log n) for **every** input; worst case still possible but vanishingly unlikely |
| Median of three (first, middle, last) | handles sorted input well; cheap |
| Median of medians | guaranteed O(n log n) but large constants — rarely used |

### Why the worst case is O(n²)

If every partition puts the pivot at one end (e.g. sorted input with last-element pivot), the sizes are n − 1, n − 2, …: T(n) = T(n − 1) + O(n) = O(n²), and recursion depth n (stack overflow risk). Balanced splits give T(n) = 2T(n/2) + O(n) = O(n log n). Even consistently uneven splits such as 10% / 90% still give O(n log n) — depth log base 10/9 of n.

### Duplicates

With many equal keys, two-way partitioning can degrade (all equal → O(n²) for Lomuto). **Three-way partitioning** (Dutch national flag) splits into < pivot, = pivot, > pivot and skips the middle block entirely.

## Visual Explanation

```text
Lomuto partition of [10, 80, 30, 90, 40, 50, 70], pivot = 70

j=0 10 < 70 → swap(i=0, j=0), i=1     [10 | 80, 30, 90, 40, 50, 70]
j=1 80 ≥ 70                            [10 | 80, 30, 90, 40, 50, 70]
j=2 30 < 70 → swap(1, 2), i=2         [10, 30 | 80, 90, 40, 50, 70]
j=3 90 ≥ 70
j=4 40 < 70 → swap(2, 4), i=3         [10, 30, 40 | 90, 80, 50, 70]
j=5 50 < 70 → swap(3, 5), i=4         [10, 30, 40, 50 | 80, 90, 70]
end: swap pivot into i=4              [10, 30, 40, 50, 70, 90, 80]
                                        < 70          ↑      > 70
```

## Pseudocode

```pseudocode
quickSort(arr, lo, hi):
    if lo ≥ hi: return
    p ← partition(arr, lo, hi)
    quickSort(arr, lo, p − 1)
    quickSort(arr, p + 1, hi)

partition(arr, lo, hi):            // Lomuto, after moving a random pivot to hi
    pivot ← arr[hi]; i ← lo
    for j from lo to hi − 1:
        if arr[j] < pivot: swap(arr[i], arr[j]); i ← i + 1
    swap(arr[i], arr[hi])
    return i
```

## Java Implementation

```java
import java.util.*;

public class QuickSort {

    private static final Random RANDOM = new Random(42);   // fixed seed only to make the demo repeatable

    static void sort(int[] arr) {
        quickSort(arr, 0, arr.length - 1);
    }

    private static void quickSort(int[] arr, int lo, int hi) {
        while (lo < hi) {
            int p = partition(arr, lo, hi);
            // Recurse into the smaller side and loop on the larger: stack depth stays O(log n).
            if (p - lo < hi - p) {
                quickSort(arr, lo, p - 1);
                lo = p + 1;
            } else {
                quickSort(arr, p + 1, hi);
                hi = p - 1;
            }
        }
    }

    private static int partition(int[] arr, int lo, int hi) {
        int randomIndex = lo + RANDOM.nextInt(hi - lo + 1);
        swap(arr, randomIndex, hi);                 // random pivot moved to the end
        int pivot = arr[hi];
        int i = lo;
        for (int j = lo; j < hi; j++) {
            if (arr[j] < pivot) {
                swap(arr, i++, j);
            }
        }
        swap(arr, i, hi);
        return i;
    }

    // Three-way partition (Dutch national flag): < pivot | == pivot | > pivot.
    static void sortThreeWay(int[] arr, int lo, int hi) {
        if (lo >= hi) return;
        int pivot = arr[lo + RANDOM.nextInt(hi - lo + 1)];
        int lt = lo, i = lo, gt = hi;
        while (i <= gt) {
            if (arr[i] < pivot) swap(arr, lt++, i++);
            else if (arr[i] > pivot) swap(arr, i, gt--);     // do not advance i: the swapped-in value is unchecked
            else i++;
        }
        sortThreeWay(arr, lo, lt - 1);
        sortThreeWay(arr, gt + 1, hi);
    }

    private static void swap(int[] arr, int a, int b) {
        int temp = arr[a];
        arr[a] = arr[b];
        arr[b] = temp;
    }

    public static void main(String[] args) {
        int[] a = {10, 80, 30, 90, 40, 50, 70};
        sort(a);
        System.out.println(Arrays.toString(a));

        int[] sorted = new int[100_000];
        for (int i = 0; i < sorted.length; i++) sorted[i] = i;     // worst case for a fixed last-element pivot
        sort(sorted);
        System.out.println("sorted input of 100000 handled, first/last: " + sorted[0] + " " + sorted[99_999]);

        int[] dups = {3, 1, 3, 3, 2, 3, 1, 3};
        sortThreeWay(dups, 0, dups.length - 1);
        System.out.println(Arrays.toString(dups));
    }
}
```

**Output:**

```text
[10, 30, 40, 50, 70, 80, 90]
sorted input of 100000 handled, first/last: 0 99999
[1, 1, 2, 3, 3, 3, 3, 3]
```

## Dry Run

Recursion on `[10, 80, 30, 90, 40, 50, 70]` with the pivots shown (deterministic last-element pivots, for illustration):

| Call range | Pivot | After partition | Pivot index |
|------------|-------|-----------------|-------------|
| [0, 6] | 70 | `[10, 30, 40, 50, 70, 90, 80]` | 4 |
| [0, 3] | 50 | `[10, 30, 40, 50]` (all smaller) | 3 |
| [0, 2] | 40 | unchanged | 2 |
| [0, 1] | 30 | unchanged | 1 |
| [5, 6] | 80 | `[80, 90]` | 5 |

The left side shows the sorted-input problem in miniature: each partition peels off only one element.

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| Best | O(n log n) | pivots split evenly: T(n) = 2T(n/2) + O(n) |
| Average | O(n log n) | random pivots: expected about 1.39 n log₂ n comparisons |
| Worst | O(n²) | pivot always the min or max: T(n) = T(n − 1) + O(n) |

**Space:** O(log n) stack on average; O(n) worst case for naive recursion — recursing into the smaller side first (as above) bounds it at O(log n) even then.

## Properties

| Property | Value |
|----------|-------|
| Stable | No — partition swaps across long distances |
| In-place | Yes (O(log n) stack) |
| Adaptive | No (sorted input is a bad case for naive pivots) |
| Comparison-based | Yes |
| Cache behaviour | excellent — sequential scans |

## Variations

- **Randomised quick sort** — random pivot; expected O(n log n) for every input.
- **Three-way (Dutch national flag)** — fast with many duplicates.
- **Dual-pivot quick sort** — two pivots, three parts; Java's `Arrays.sort(int[])`.
- **Introsort** — quick sort that switches to heap sort when recursion gets too deep (C++ `std::sort`); Java 14+ also falls back to heap sort.
- **Quickselect** — partition, then recurse into only the side containing index k: O(n) average for the k-th smallest.

## Comparison

| | Quick sort | Merge sort | Heap sort |
|---|------------|------------|-----------|
| Average | O(n log n), fastest in practice | O(n log n) | O(n log n) |
| Worst | O(n²) (rare with random pivots) | O(n log n) | O(n log n) |
| Extra space | O(log n) | O(n) | O(1) |
| Stable | no | yes | no |
| Best for | in-memory arrays of primitives | stability, linked lists, external data | strict memory + guaranteed time |

## Edge Cases

- Empty, single element, two elements.
- Already sorted or reverse-sorted input (bad for fixed pivots).
- All elements equal (bad for two-way Lomuto; fine with three-way).

## Advantages

- Fastest in practice for arrays; in-place; cache-friendly.
- Partition is a reusable building block (quickselect, Dutch flag).

## Disadvantages

- O(n²) worst case with poor pivot choices; deep recursion risk.
- Not stable.

## When to Use

- Sorting large in-memory arrays where stability is not needed.
- When you need partitioning itself: k-th element, grouping by a predicate.

**When not to use:** stability required, guaranteed worst-case time required, or linked lists (use merge sort).

## Common Mistakes

- Fixed first/last pivot on sorted input → O(n²) and stack overflow.
- Off-by-one in partition loops (`j <= hi` includes the pivot itself).
- Recursing on [lo, p] and [p, hi] with Lomuto (infinite recursion when p = hi).
- In three-way partition, advancing `i` after swapping with `gt`.
- Claiming quick sort is "O(n log n)" without mentioning its O(n²) worst case.

## Key Takeaways

- Partition around a pivot, then sort both sides; the pivot ends in its final position.
- O(n log n) average, O(n²) worst; random pivots make the worst case practically impossible.
- In-place, not stable; fastest in practice for primitive arrays.
- Three-way partitioning handles duplicates; quickselect finds the k-th element in O(n) average.
