# Bubble Sort

## Definition

**Bubble sort** repeatedly walks through the array comparing **adjacent** pairs and swapping them when they are out of order. After pass k, the k largest elements have "bubbled" to their final positions at the end. With an **early exit** (stop when a pass makes no swaps) it is O(n) on sorted input; otherwise it is **O(n²)**. It is **stable** and **in-place**.

## Why It Matters

Bubble sort is rarely used in practice, but it is the simplest sort to reason about, and interviews use it to test loop invariants, stability, the early-exit optimisation and the link between adjacent swaps and **inversions**.

## Prerequisites

- [Algorithm Properties](../../fundamentals/algorithm-properties/content.md) — stable, in-place, adaptive.

## Intuition

Large values rise like bubbles: each pass carries the largest remaining element rightward through a chain of swaps until it reaches the end of the unsorted part. The sorted region grows from the right by one element per pass.

## How It Works

1. For pass = 0 to n − 2:
   1. `swapped = false`.
   2. For i = 0 to n − 2 − pass: if `arr[i] > arr[i + 1]`, swap them and set `swapped = true`.
   3. If no swap happened, the array is sorted — stop.
2. Invariant: after `pass` passes, the last `pass` elements are the largest, in final order.

## Visual Explanation

```text
[5, 1, 4, 2, 8]

pass 1: (5,1) swap → [1,5,4,2,8]; (5,4) swap → [1,4,5,2,8]; (5,2) swap → [1,4,2,5,8]; (5,8) ok
        largest 8 is in place:                                      [1, 4, 2, 5 | 8]
pass 2: (1,4) ok; (4,2) swap → [1,2,4,5,8]; (4,5) ok                 [1, 2, 4 | 5, 8]
pass 3: (1,2) ok; (2,4) ok — no swaps → stop early                   [1, 2, 4, 5, 8]
```

## Pseudocode

```pseudocode
bubbleSort(arr):
    for pass from 0 to n − 2:
        swapped ← false
        for i from 0 to n − 2 − pass:
            if arr[i] > arr[i + 1]:
                swap(arr[i], arr[i + 1]); swapped ← true
        if not swapped: break
```

## Java Implementation

```java
import java.util.Arrays;

public class BubbleSort {

    static int comparisons, swaps;

    static void bubbleSort(int[] arr) {
        int n = arr.length;
        for (int pass = 0; pass < n - 1; pass++) {
            boolean swapped = false;
            for (int i = 0; i < n - 1 - pass; i++) {      // the last `pass` elements are already final
                comparisons++;
                if (arr[i] > arr[i + 1]) {                // strict > keeps equal elements in order (stable)
                    int temp = arr[i];
                    arr[i] = arr[i + 1];
                    arr[i + 1] = temp;
                    swaps++;
                    swapped = true;
                }
            }
            if (!swapped) {
                break;                                     // early exit: already sorted
            }
        }
    }

    static void run(int[] arr) {
        comparisons = 0;
        swaps = 0;
        String before = Arrays.toString(arr);
        bubbleSort(arr);
        System.out.println(before + " -> " + Arrays.toString(arr) + " comparisons=" + comparisons + " swaps=" + swaps);
    }

    public static void main(String[] args) {
        run(new int[] {5, 1, 4, 2, 8});
        run(new int[] {1, 2, 3, 4, 5});      // best case: one pass
        run(new int[] {5, 4, 3, 2, 1});      // worst case
    }
}
```

**Output:**

```text
[5, 1, 4, 2, 8] -> [1, 2, 4, 5, 8] comparisons=9 swaps=4
[1, 2, 3, 4, 5] -> [1, 2, 3, 4, 5] comparisons=4 swaps=0
[5, 4, 3, 2, 1] -> [1, 2, 3, 4, 5] comparisons=10 swaps=10
```

## Dry Run

The swap count equals the number of **inversions** (pairs i < j with arr[i] > arr[j]): each adjacent swap fixes exactly one inversion. For `[5, 1, 4, 2, 8]` the inversions are (5,1), (5,4), (5,2), (4,2) — 4 swaps.

| Pass | Comparisons | Swaps | Array after pass |
|------|-------------|-------|------------------|
| 1 | 4 | 3 | `[1, 4, 2, 5, 8]` |
| 2 | 3 | 1 | `[1, 2, 4, 5, 8]` |
| 3 | 2 | 0 | unchanged → stop |

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| Best | O(n) | already sorted: one pass of n − 1 comparisons, no swaps, early exit |
| Average | O(n²) | about n²/4 inversions → that many swaps |
| Worst | O(n²) | reverse order: n(n − 1)/2 comparisons and swaps |

**Space:** O(1) — only a temporary variable for swapping.

## Properties

| Property | Value |
|----------|-------|
| Stable | Yes — only adjacent elements swap, and only when strictly greater |
| In-place | Yes |
| Adaptive | Yes, with the early-exit flag |
| Online | No |
| Comparison-based | Yes |

## Variations

- **Cocktail shaker sort:** alternate left-to-right and right-to-left passes; moves small elements ("turtles") left faster. Still O(n²).
- **Remember the last swap position:** everything after the last swap of a pass is sorted, so the next pass can stop there.
- **Odd–even transposition sort:** a parallel-friendly variant.

## Comparison

| | Bubble | Selection | Insertion |
|---|--------|-----------|-----------|
| Comparisons (worst) | n²/2 | n²/2 | n²/2 |
| Swaps / writes (worst) | n²/2 | n − 1 | n²/2 shifts |
| Best case | O(n) | O(n²) | O(n) |
| Stable | yes | no | yes |
| In practice | slowest | few writes | fastest of the three |

## Edge Cases

- Empty or single-element arrays — the outer loop does not run.
- All elements equal — one pass, no swaps.
- Using `>=` in the comparison swaps equal elements and breaks stability.

## Advantages

- Very simple; stable; in-place; detects sorted input in O(n).

## Disadvantages

- O(n²) with many swaps — the slowest of the simple sorts in practice.

## When to Use

- Teaching, or tiny arrays where code simplicity matters most.
- Checking "is it sorted?" while fixing a handful of adjacent inversions.

**When not to use:** any real data beyond a few dozen elements — use `Arrays.sort` or [Insertion Sort](../insertion-sort/content.md) for small/nearly-sorted inputs.

## Common Mistakes

- Inner loop running to `n − 1` every pass (correct but wasteful) or to `n` (out of bounds on `i + 1`).
- Forgetting the early-exit flag, losing the O(n) best case.
- Using `>=`, making the sort unstable.

## Key Takeaways

- Swap adjacent out-of-order pairs; each pass fixes the largest remaining element at the end.
- O(n²) average/worst, O(n) best with early exit; O(1) space; stable; in-place.
- Number of swaps = number of inversions.
