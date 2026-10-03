# Insertion Sort

## Definition

**Insertion sort** builds a sorted prefix one element at a time: it takes the next element (the **key**), shifts every larger element of the sorted prefix one position right, and drops the key into the gap. It is **O(n²)** in the worst and average case but **O(n)** on sorted input, and more generally O(n + number of inversions). It is **stable**, **in-place**, **adaptive** and **online**.

## Why It Matters

Insertion sort is the fastest simple sort in practice and the best algorithm for small or nearly-sorted arrays. Real library sorts use it inside faster algorithms: Java's TimSort sorts short runs with (binary) insertion sort, and its dual-pivot quick sort switches to insertion sort for tiny subarrays.

## Prerequisites

- [Algorithm Properties](../../fundamentals/algorithm-properties/content.md)

## Intuition

Sorting playing cards as you are dealt them: each new card is slid leftwards past the higher cards in your hand until it sits in the right place. Cards already in your hand stay sorted the whole time.

## How It Works

1. For i = 1 to n − 1:
   1. `key = arr[i]`; `j = i − 1`.
   2. While `j ≥ 0` and `arr[j] > key`: shift `arr[j]` to `arr[j + 1]`; `j--`.
   3. Place `arr[j + 1] = key`.
2. Invariant: before iteration i, `arr[0..i−1]` is sorted (it contains the original first i elements in order).

Using **shifts** (one write per step) instead of swaps (three writes) is the standard optimisation.

## Visual Explanation

```text
[12, 11, 13, 5, 6]

i=1 key=11: 12 > 11 shift → [_, 12, 13, 5, 6] → insert at 0 → [11, 12 | 13, 5, 6]
i=2 key=13: 12 < 13, no shift                    → [11, 12, 13 | 5, 6]
i=3 key=5:  shift 13, 12, 11                     → [5, 11, 12, 13 | 6]
i=4 key=6:  shift 13, 12, 11 (5 < 6 stops)       → [5, 6, 11, 12, 13]
```

## Pseudocode

```pseudocode
insertionSort(arr):
    for i from 1 to n − 1:
        key ← arr[i]; j ← i − 1
        while j ≥ 0 and arr[j] > key:
            arr[j + 1] ← arr[j]; j ← j − 1
        arr[j + 1] ← key
```

## Java Implementation

```java
import java.util.Arrays;

public class InsertionSort {

    static int shifts;

    static void insertionSort(int[] arr) {
        for (int i = 1; i < arr.length; i++) {
            int key = arr[i];
            int j = i - 1;
            while (j >= 0 && arr[j] > key) {     // strict > keeps equal elements in order (stable)
                arr[j + 1] = arr[j];             // shift right; the key's old slot is already saved
                j--;
                shifts++;
            }
            arr[j + 1] = key;
        }
    }

    static void run(int[] arr) {
        shifts = 0;
        String before = Arrays.toString(arr);
        insertionSort(arr);
        System.out.println(before + " -> " + Arrays.toString(arr) + " shifts=" + shifts);
    }

    public static void main(String[] args) {
        run(new int[] {12, 11, 13, 5, 6});
        run(new int[] {1, 2, 3, 4, 6, 5});       // nearly sorted: one shift
        run(new int[] {5, 4, 3, 2, 1});          // reversed: n(n-1)/2 shifts
    }
}
```

**Output:**

```text
[12, 11, 13, 5, 6] -> [5, 6, 11, 12, 13] shifts=7
[1, 2, 3, 4, 6, 5] -> [1, 2, 3, 4, 5, 6] shifts=1
[5, 4, 3, 2, 1] -> [1, 2, 3, 4, 5] shifts=10
```

## Dry Run

Each shift removes exactly one inversion, so shifts = inversions. For `[12, 11, 13, 5, 6]`:

| i | key | Elements shifted | Inserted at | Array after |
|---|-----|------------------|-------------|-------------|
| 1 | 11 | 12 | 0 | `[11, 12, 13, 5, 6]` |
| 2 | 13 | — | 2 | `[11, 12, 13, 5, 6]` |
| 3 | 5 | 13, 12, 11 | 0 | `[5, 11, 12, 13, 6]` |
| 4 | 6 | 13, 12, 11 | 1 | `[5, 6, 11, 12, 13]` |

Total shifts 7 = inversions (12,11), (12,5), (12,6), (11,5), (11,6), (13,5), (13,6).

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| Best | O(n) | sorted input: each key compares once with its left neighbour |
| Average | O(n²) | about n²/4 inversions on random input |
| Worst | O(n²) | reversed input: every key shifts past all previous elements |

More precisely O(n + I), where I is the number of inversions — so an array where every element is at most k positions from its final place sorts in O(n × k).

**Space:** O(1).

## Properties

| Property | Value |
|----------|-------|
| Stable | Yes |
| In-place | Yes |
| Adaptive | Yes — cost grows with disorder |
| Online | Yes — can sort a stream as elements arrive |
| Comparison-based | Yes |

## Variations

- **Binary insertion sort:** find the insert position with binary search (O(log i) comparisons) — fewer comparisons, but shifting still makes it O(n²).
- **Shell sort:** insertion sort on elements a "gap" apart with shrinking gaps; sub-quadratic in practice.
- **Insertion into a linked list:** no shifting, but finding the position is O(i).

## Comparison

| Input | Insertion | Merge | Quick |
|-------|-----------|-------|-------|
| Small (n ≤ ~20–50) | fastest (low overhead) | slower | slower |
| Nearly sorted | O(n + I), excellent | Θ(n log n) | O(n log n) average |
| Large random | O(n²) — too slow | O(n log n) | O(n log n) average |

## Edge Cases

- Empty and single-element arrays — loop does not run.
- Duplicates — strict `>` keeps them in original order.
- Reverse-sorted input — worst case.

## Advantages

- Fast on small and nearly-sorted data; minimal overhead.
- Stable, in-place, online.

## Disadvantages

- O(n²) on large random or reversed input.

## When to Use

- Small arrays (including as the base case inside merge/quick sort).
- Data that is almost sorted (a few elements out of place; new elements appended to a sorted list).
- Streams where elements must stay sorted as they arrive (for small sizes).

**When not to use:** large unsorted inputs — use O(n log n) sorts.

## Common Mistakes

- Overwriting `arr[i]` before saving it as `key`.
- Loop condition order: `arr[j] > key && j >= 0` reads `arr[-1]` — check `j >= 0` first.
- Placing the key at `arr[j]` instead of `arr[j + 1]`.

## Key Takeaways

- Insert each element into the sorted prefix by shifting larger elements right.
- O(n) best, O(n²) worst/average; precisely O(n + inversions).
- Stable, in-place, adaptive, online — the best simple sort and a building block of TimSort.
