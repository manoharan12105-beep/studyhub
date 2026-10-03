# Merge Sort

## Definition

**Merge sort** is a divide-and-conquer sort: split the array into two halves, sort each half recursively, then **merge** the two sorted halves into one sorted array. It runs in **Θ(n log n)** time in every case, needs **O(n)** extra memory for merging, and is **stable**.

## Why It Matters

Merge sort is the standard example of [Divide and Conquer](../divide-and-conquer/content.md) and the guaranteed-O(n log n) stable sort. Java's object sort (TimSort) is a merge sort variant; external sorting of data too large for memory uses merging; and the merge step solves many interview problems (merging sorted lists, counting inversions, sorting linked lists).

## Prerequisites

- [Recursion](../recursion/content.md)
- [Recurrence Relations](../../fundamentals/recurrence-relations/content.md)

## Intuition

Two sorted piles of exam papers can be combined into one sorted pile by repeatedly taking the smaller of the two top papers — one linear pass. Merge sort reduces the whole problem to this easy step: keep splitting until piles have one paper (already sorted), then merge piles back together.

## How It Works

1. **Divide:** if the range [lo, hi] has fewer than 2 elements, return. Otherwise `mid = lo + (hi − lo) / 2`.
2. **Conquer:** recursively sort [lo, mid] and [mid + 1, hi].
3. **Combine (merge):**
   1. Copy the range into a temporary buffer (or merge from the halves into the buffer).
   2. Keep pointers i (left half) and j (right half). Repeatedly take the smaller current element; on a **tie take from the left** (this keeps the sort stable).
   3. When one half is exhausted, copy the rest of the other.

## Visual Explanation

```text
                 [38, 27, 43, 3, 9, 82, 10]
                 /                         \
        [38, 27, 43, 3]               [9, 82, 10]
         /          \                  /        \
     [38, 27]    [43, 3]           [9, 82]     [10]
      /   \       /   \            /   \
   [38]  [27]  [43]   [3]        [9]  [82]
      \   /       \   /            \   /
     [27, 38]    [3, 43]          [9, 82]      [10]
          \        /                   \        /
        [3, 27, 38, 43]              [9, 10, 82]
                 \                       /
              [3, 9, 10, 27, 38, 43, 82]
```

## Pseudocode

```pseudocode
mergeSort(arr, lo, hi, buffer):
    if lo ≥ hi: return
    mid ← lo + (hi − lo) / 2
    mergeSort(arr, lo, mid, buffer)
    mergeSort(arr, mid + 1, hi, buffer)
    merge(arr, lo, mid, hi, buffer)

merge(arr, lo, mid, hi, buffer):
    copy arr[lo..hi] into buffer[lo..hi]
    i ← lo, j ← mid + 1
    for k from lo to hi:
        if i > mid:                 arr[k] ← buffer[j++]
        else if j > hi:             arr[k] ← buffer[i++]
        else if buffer[j] < buffer[i]: arr[k] ← buffer[j++]
        else:                       arr[k] ← buffer[i++]   // ties from the left → stable
```

## Java Implementation

```java
import java.util.Arrays;

public class MergeSort {

    static void sort(int[] arr) {
        int[] buffer = new int[arr.length];          // allocated once, reused by every merge
        mergeSort(arr, 0, arr.length - 1, buffer);
    }

    private static void mergeSort(int[] arr, int lo, int hi, int[] buffer) {
        if (lo >= hi) {
            return;                                  // 0 or 1 element: already sorted
        }
        int mid = lo + (hi - lo) / 2;
        mergeSort(arr, lo, mid, buffer);
        mergeSort(arr, mid + 1, hi, buffer);
        if (arr[mid] <= arr[mid + 1]) {
            return;                                  // halves already in order: skip the merge
        }
        merge(arr, lo, mid, hi, buffer);
    }

    private static void merge(int[] arr, int lo, int mid, int hi, int[] buffer) {
        for (int k = lo; k <= hi; k++) {
            buffer[k] = arr[k];
        }
        int i = lo, j = mid + 1;
        for (int k = lo; k <= hi; k++) {
            if (i > mid) arr[k] = buffer[j++];               // left half used up
            else if (j > hi) arr[k] = buffer[i++];           // right half used up
            else if (buffer[j] < buffer[i]) arr[k] = buffer[j++];
            else arr[k] = buffer[i++];                       // tie → left first (stable)
        }
    }

    // Bottom-up (iterative) version: merge runs of width 1, 2, 4, ... — no recursion.
    static void sortBottomUp(int[] arr) {
        int n = arr.length;
        int[] buffer = new int[n];
        for (int width = 1; width < n; width *= 2) {
            for (int lo = 0; lo < n - width; lo += 2 * width) {
                int mid = lo + width - 1;
                int hi = Math.min(lo + 2 * width - 1, n - 1);
                merge(arr, lo, mid, hi, buffer);
            }
        }
    }

    public static void main(String[] args) {
        int[] a = {38, 27, 43, 3, 9, 82, 10};
        sort(a);
        System.out.println(Arrays.toString(a));
        int[] b = {5, 1, 4, 1, 5, 9, 2, 6};
        sortBottomUp(b);
        System.out.println(Arrays.toString(b));
        int[] empty = {};
        sort(empty);
        System.out.println(Arrays.toString(empty));
    }
}
```

**Output:**

```text
[3, 9, 10, 27, 38, 43, 82]
[1, 1, 2, 4, 5, 5, 6, 9]
[]
```

## Dry Run

Final merge of `[3, 27, 38, 43]` and `[9, 10, 82]`:

| Step | Left (i) | Right (j) | Take | Output so far |
|------|----------|-----------|------|---------------|
| 1 | 3 | 9 | 3 (left) | 3 |
| 2 | 27 | 9 | 9 (right) | 3 9 |
| 3 | 27 | 10 | 10 (right) | 3 9 10 |
| 4 | 27 | 82 | 27 (left) | 3 9 10 27 |
| 5 | 38 | 82 | 38 (left) | … 38 |
| 6 | 43 | 82 | 43 (left) | … 43 |
| 7 | — | 82 | 82 (left half exhausted) | 3 9 10 27 38 43 82 |

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| Best | O(n log n) | still splits fully; O(n) with the "already in order" check on sorted input |
| Average | O(n log n) | |
| Worst | O(n log n) | T(n) = 2T(n/2) + O(n): log₂ n levels, O(n) merging work per level |

**Space:** O(n) for the buffer + O(log n) recursion stack = O(n). (The textbook version without the "skip merge" check is Θ(n log n) even on sorted input.)

## Properties

| Property | Value |
|----------|-------|
| Stable | Yes, if ties take from the left half |
| In-place | No — O(n) buffer (in-place merging exists but is complex and slower) |
| Adaptive | Not in its basic form; natural merge sort / TimSort exploit existing runs |
| Parallelisable | Yes — the halves are independent |
| Suits linked lists | Yes — merging needs no random access and no buffer |

## Variations

- **Bottom-up merge sort:** iterative, merges runs of width 1, 2, 4, …
- **Natural merge sort / TimSort:** detects existing sorted runs and merges them; O(n) on sorted input. Used by `Arrays.sort(Object[])` and `Collections.sort`.
- **Merge sort on linked lists:** see [Linked List Techniques](../../data-structures/linked-list-techniques/content.md).
- **External merge sort:** sort chunks that fit in memory, then k-way merge them from disk with a heap.
- **Counting inversions:** count, during each merge, how many left elements a right element jumps over.

## Comparison

| | Merge sort | Quick sort | Heap sort |
|---|------------|------------|-----------|
| Worst case | O(n log n) | O(n²) | O(n log n) |
| Average in practice | fast | fastest (cache-friendly, in place) | slower (poor locality) |
| Extra space | O(n) | O(log n) | O(1) |
| Stable | yes | no | no |
| Linked lists | excellent | poor | poor |

## Edge Cases

- Empty array and single element.
- Many duplicates (stability matters for objects).
- Odd lengths: halves differ in size by one — handled by `mid`.

## Advantages

- Guaranteed O(n log n); stable; predictable.
- Works well for linked lists and external (disk) data; parallelises naturally.

## Disadvantages

- O(n) extra memory for arrays.
- Slower than quick sort on arrays in practice (copying, less cache-friendly).

## When to Use

- Stability is required (sorting records by several keys).
- Guaranteed O(n log n) is required (no worst-case risk).
- Sorting linked lists or data that does not fit in memory.
- Problems that need the merge step: counting inversions, merging sorted sequences.

**When not to use:** memory is very tight (use heap sort) or raw speed on primitive arrays matters most (quick sort / `Arrays.sort`).

## Common Mistakes

- Allocating a new buffer in every call — O(n log n) total allocation; allocate once.
- Using `<` instead of `<=` when taking from the left (breaks stability).
- `mid = (lo + hi) / 2` overflow for huge indices.
- Forgetting to copy the remaining elements of one half.

## Key Takeaways

- Split, sort halves recursively, merge in linear time.
- Θ(n log n) always (T(n) = 2T(n/2) + O(n)); O(n) extra space.
- Stable (ties from the left); ideal for linked lists and external sorting.
- Java's `Collections.sort` and object `Arrays.sort` use TimSort, a merge-sort hybrid.
