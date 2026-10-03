# Selection Sort

## Definition

**Selection sort** divides the array into a sorted prefix and an unsorted suffix. Each pass **selects the minimum** of the unsorted part and swaps it into the next position of the sorted prefix. It always makes n(n − 1)/2 comparisons — **O(n²)** in every case — but at most **n − 1 swaps**. It is **in-place** and **not stable**.

## Why It Matters

It is the sort with the fewest writes, which matters when writing is expensive (flash memory, large records). Interviewers use it to test the difference between comparisons and swaps, why it is not adaptive, and why long-distance swaps break stability.

## Prerequisites

- [Algorithm Properties](../../fundamentals/algorithm-properties/content.md)

## Intuition

Sorting a hand of cards face up on a table: scan for the smallest card, move it to the left end; scan the rest for the next smallest, put it second; and so on. You always look at every remaining card, even if they are already in order.

## How It Works

1. For i = 0 to n − 2:
   1. Find `minIndex`, the index of the smallest element in `arr[i..n−1]`.
   2. Swap `arr[i]` with `arr[minIndex]` (skip if equal indices).
2. Invariant: after pass i, `arr[0..i]` holds the i + 1 smallest elements in sorted order.

## Visual Explanation

```text
[64, 25, 12, 22, 11]

i=0: min of all = 11 (index 4) → swap with 64   [11 | 25, 12, 22, 64]
i=1: min of rest = 12 (index 2) → swap with 25  [11, 12 | 25, 22, 64]
i=2: min of rest = 22 (index 3) → swap with 25  [11, 12, 22 | 25, 64]
i=3: min of rest = 25 (index 3) → no swap        [11, 12, 22, 25 | 64]
```

## Pseudocode

```pseudocode
selectionSort(arr):
    for i from 0 to n − 2:
        minIndex ← i
        for j from i + 1 to n − 1:
            if arr[j] < arr[minIndex]: minIndex ← j
        if minIndex ≠ i: swap(arr[i], arr[minIndex])
```

## Java Implementation

```java
import java.util.Arrays;

public class SelectionSort {

    static int comparisons, swaps;

    static void selectionSort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n - 1; i++) {
            int minIndex = i;
            for (int j = i + 1; j < n; j++) {
                comparisons++;
                if (arr[j] < arr[minIndex]) {
                    minIndex = j;
                }
            }
            if (minIndex != i) {                     // at most one swap per pass
                int temp = arr[i];
                arr[i] = arr[minIndex];
                arr[minIndex] = temp;
                swaps++;
            }
        }
    }

    static void run(int[] arr) {
        comparisons = 0;
        swaps = 0;
        String before = Arrays.toString(arr);
        selectionSort(arr);
        System.out.println(before + " -> " + Arrays.toString(arr) + " comparisons=" + comparisons + " swaps=" + swaps);
    }

    public static void main(String[] args) {
        run(new int[] {64, 25, 12, 22, 11});
        run(new int[] {1, 2, 3, 4, 5});          // still n(n-1)/2 comparisons: not adaptive
    }
}
```

**Output:**

```text
[64, 25, 12, 22, 11] -> [11, 12, 22, 25, 64] comparisons=10 swaps=3
[1, 2, 3, 4, 5] -> [1, 2, 3, 4, 5] comparisons=10 swaps=0
```

## Dry Run

| i | Scan range | Minimum found | Swap | Array after |
|---|-----------|---------------|------|-------------|
| 0 | [64, 25, 12, 22, 11] | 11 at 4 | 64 ↔ 11 | `[11, 25, 12, 22, 64]` |
| 1 | [25, 12, 22, 64] | 12 at 2 | 25 ↔ 12 | `[11, 12, 25, 22, 64]` |
| 2 | [25, 22, 64] | 22 at 3 | 25 ↔ 22 | `[11, 12, 22, 25, 64]` |
| 3 | [25, 64] | 25 at 3 | none | `[11, 12, 22, 25, 64]` |

**Why it is not stable:** in `[2a, 2b, 1]`, pass 0 swaps 2a with 1, giving `[1, 2b, 2a]` — 2a jumped over its equal 2b.

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| Best | O(n²) | the minimum search always scans the whole unsorted part: (n − 1) + … + 1 comparisons |
| Average | O(n²) | same comparisons |
| Worst | O(n²) | same comparisons |

**Swaps:** at most n − 1 (O(n)). **Space:** O(1).

## Properties

| Property | Value |
|----------|-------|
| Stable | No (the long-distance swap can pass an equal element) |
| In-place | Yes |
| Adaptive | No |
| Online | No (needs the global minimum) |
| Comparison-based | Yes |

## Variations

- **Stable selection sort:** instead of swapping, shift elements right and insert the minimum — stable but O(n²) writes.
- **Double selection sort:** find min and max in each pass, placing both — about half the passes, same O(n²).
- **Heap sort** is selection sort with a heap to find the extreme element in O(log n) — see [Heap Sort](../heap-sort/content.md).

## Comparison

| | Selection | Bubble | Insertion |
|---|-----------|--------|-----------|
| Comparisons | always n(n − 1)/2 | up to n(n − 1)/2 | n − 1 to n(n − 1)/2 |
| Writes | ≤ n − 1 swaps | up to n(n − 1)/2 swaps | up to n(n − 1)/2 shifts |
| Best case | O(n²) | O(n) | O(n) |
| Stable | no | yes | yes |

## Edge Cases

- Already sorted input: still O(n²) comparisons, zero swaps.
- Duplicates: correct order of values, but equal elements may be reordered.

## Advantages

- Minimal number of writes (n − 1 swaps).
- Simple, in-place, predictable running time.

## Disadvantages

- O(n²) even on sorted input; not stable.

## When to Use

- Writes are much more expensive than reads.
- Tiny arrays, or explaining the idea behind heap sort.

**When not to use:** general sorting, nearly-sorted data (insertion sort is O(n) there), or when stability is required.

## Common Mistakes

- Swapping inside the inner loop every time a smaller element is seen (turns it into a worse bubble sort).
- Starting the inner loop at i instead of i + 1 (harmless but wasteful).
- Claiming it is stable or adaptive.

## Key Takeaways

- Repeatedly select the minimum of the unsorted part and swap it into place.
- Always n(n − 1)/2 comparisons → O(n²) in every case; ≤ n − 1 swaps.
- In-place, not stable, not adaptive.
