# Heap Sort

## Definition

**Heap sort** first rearranges the array into a **max-heap** (bottom-up heapify, O(n)), then repeatedly swaps the maximum at the root with the last element of the heap, shrinks the heap by one, and sifts the new root down. It runs in **O(n log n)** in every case, uses **O(1)** extra space, and is **not stable**.

## Why It Matters

Heap sort is the only common comparison sort that is both **in-place** and **guaranteed O(n log n)**. That makes it the safety net in introsort (quick sort that switches to heap sort when recursion gets too deep). In interviews it shows you understand heaps beyond `PriorityQueue`, and partial heap sort is a classic answer for "top k" questions.

## Prerequisites

- [Heap](../../data-structures/heap/content.md) — sift down and bottom-up heapify.
- [Selection Sort](../selection-sort/content.md) — heap sort is selection sort with a heap to find the maximum quickly.

## Intuition

Selection sort spends O(n) per pass finding the maximum. A max-heap keeps the maximum at the root and restores itself in O(log n) after removal. So: build the heap once, then "select" the maximum n times — each time placing it at the end of the array, exactly where it belongs.

## How It Works

1. **Build a max-heap** in place: for i from n/2 − 1 down to 0, sift down i. Now `arr[0]` is the maximum.
2. For `end` from n − 1 down to 1:
   1. Swap `arr[0]` (the maximum) with `arr[end]` — the maximum is now in its final position.
   2. Sift down index 0 within the heap `arr[0..end−1]`.
3. The array is sorted ascending: the sorted region grows from the right, the heap shrinks from the right.

## Visual Explanation

```text
[4, 10, 3, 5, 1]

build max-heap:   sift 10 (i=1): children 5, 1 → stays; sift 4 (i=0): 10 is larger → swap, then 5 > 4 → swap
                  heap = [10, 5, 3, 4, 1]

swap root↔end, sift down:
  [1, 5, 3, 4 | 10] → sift 1 → [5, 4, 3, 1 | 10]
  [1, 4, 3 | 5, 10] → sift 1 → [4, 1, 3 | 5, 10]
  [3, 1 | 4, 5, 10] → sift 3 → [3, 1 | 4, 5, 10]
  [1 | 3, 4, 5, 10] → done   → [1, 3, 4, 5, 10]
```

## Pseudocode

```pseudocode
heapSort(arr):
    for i from n/2 − 1 down to 0: siftDown(arr, i, n)
    for end from n − 1 down to 1:
        swap(arr[0], arr[end])
        siftDown(arr, 0, end)          // heap is arr[0..end−1]

siftDown(arr, i, size):
    loop:
        largest ← i; l ← 2i + 1; r ← 2i + 2
        if l < size and arr[l] > arr[largest]: largest ← l
        if r < size and arr[r] > arr[largest]: largest ← r
        if largest = i: return
        swap(arr[i], arr[largest]); i ← largest
```

## Java Implementation

```java
import java.util.Arrays;

public class HeapSort {

    static void sort(int[] arr) {
        int n = arr.length;
        for (int i = n / 2 - 1; i >= 0; i--) {      // 1. bottom-up heapify: O(n)
            siftDown(arr, i, n);
        }
        for (int end = n - 1; end > 0; end--) {      // 2. move the max to the end, shrink the heap
            swap(arr, 0, end);
            siftDown(arr, 0, end);
        }
    }

    // Restores the max-heap property for the subtree rooted at i, within arr[0..size-1].
    private static void siftDown(int[] arr, int i, int size) {
        while (true) {
            int left = 2 * i + 1, right = left + 1, largest = i;
            if (left < size && arr[left] > arr[largest]) largest = left;
            if (right < size && arr[right] > arr[largest]) largest = right;
            if (largest == i) return;
            swap(arr, i, largest);
            i = largest;
        }
    }

    private static void swap(int[] arr, int a, int b) {
        int temp = arr[a];
        arr[a] = arr[b];
        arr[b] = temp;
    }

    public static void main(String[] args) {
        int[] a = {4, 10, 3, 5, 1};
        sort(a);
        System.out.println(Arrays.toString(a));
        int[] b = {12, 11, 13, 5, 6, 7, 5};
        sort(b);
        System.out.println(Arrays.toString(b));
    }
}
```

**Output:**

```text
[1, 3, 4, 5, 10]
[5, 5, 6, 7, 11, 12, 13]
```

## Dry Run

Extraction phase after building `[10, 5, 3, 4, 1]`:

| end | Swap | Before sift (heap part \| sorted) | After sift down |
|-----|------|-----------------------------------|-----------------|
| 4 | 10 ↔ 1 | `[1, 5, 3, 4 \| 10]` | `[5, 4, 3, 1 \| 10]` |
| 3 | 5 ↔ 1 | `[1, 4, 3 \| 5, 10]` | `[4, 1, 3 \| 5, 10]` |
| 2 | 4 ↔ 3 | `[3, 1 \| 4, 5, 10]` | `[3, 1 \| 4, 5, 10]` |
| 1 | 3 ↔ 1 | `[1 \| 3, 4, 5, 10]` | done |

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| Best | O(n log n) | each of the n − 1 extractions sifts down up to log n levels (O(n) only if all keys are equal) |
| Average | O(n log n) | |
| Worst | O(n log n) | build O(n) + (n − 1) × O(log n) |

**Space:** O(1) — iterative sift-down, everything in the input array.

## Properties

| Property | Value |
|----------|-------|
| Stable | No — the root swap sends elements across the array |
| In-place | Yes, O(1) extra |
| Adaptive | No |
| Comparison-based | Yes |
| Cache behaviour | poor — children are far from parents in memory, so it is slower than quick sort in practice |

## Variations

- **Partial heap sort / top k:** build the heap (O(n)) and extract only k times: O(n + k log n).
- **Min-heap version** gives descending order (or extract to a separate array).
- **Bottom-up heap sort:** sifts the hole down to a leaf first, then up — fewer comparisons.
- **Smoothsort:** an adaptive heap-sort variant (rarely used).

## Comparison

| | Heap sort | Quick sort | Merge sort |
|---|-----------|------------|------------|
| Worst case | O(n log n) | O(n²) | O(n log n) |
| Extra space | O(1) | O(log n) | O(n) |
| Stable | no | no | yes |
| Speed in practice | slowest of the three | fastest | fast |

## Edge Cases

- Empty and single-element arrays (loops do not run).
- Duplicates (sorted correctly; relative order of equal keys not preserved).
- Already sorted input — still O(n log n), no advantage.

## Advantages

- Guaranteed O(n log n) with O(1) extra space.
- No recursion needed; no worst-case input.

## Disadvantages

- Not stable; not adaptive; poor cache locality → slower than quick sort and merge sort in practice.

## When to Use

- Memory is strictly limited and worst-case O(n log n) is required.
- As the fallback inside introsort.
- Extracting only the top k elements of an array in place.

**When not to use:** stability is needed (merge sort) or average speed matters most (quick sort / `Arrays.sort`).

## Common Mistakes

- Building the heap with n inserts (O(n log n)) instead of bottom-up heapify (O(n)).
- Sifting down with the full array size instead of the shrinking heap size `end`.
- Using a min-heap and expecting ascending order in place.
- Starting the heapify loop at n − 1 (wasted work) or at n/2 (out of range for small n is harmless, but n/2 − 1 is the last internal node).

## Key Takeaways

- Build a max-heap in O(n), then n − 1 times: swap root with the end and sift down.
- O(n log n) in every case, O(1) space, not stable.
- Selection sort + heap = heap sort; partial extraction gives top k in O(n + k log n).
