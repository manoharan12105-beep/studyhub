# Binary Search Variations

## Definition

Binary search works whenever, after one comparison at the middle, you can tell **which half cannot contain the answer** — full sortedness is not required. This topic covers the classic variations: searching a **rotated sorted array**, finding its **minimum**, finding a **peak element**, and searching a **2D matrix**.

## Why It Matters

These problems test whether you understand *why* binary search works rather than memorising the sorted-array version. Each requires finding a different property that lets you discard half of the range, and each has an O(n) linear-scan solution that interviewers expect you to improve to O(log n).

## Prerequisites

- [Binary Search](../binary-search/content.md) — the two templates and boundary search.

## Intuition

| Problem | What one comparison at mid tells you |
|---------|--------------------------------------|
| Rotated sorted array (search) | at least one half, [lo, mid] or [mid, hi], is sorted; check whether the target lies inside that sorted half |
| Rotated array minimum | if `arr[mid] > arr[hi]`, the rotation point (minimum) is right of mid; otherwise it is at mid or to the left |
| Peak element | if `arr[mid] < arr[mid + 1]`, you are on an uphill slope, so a peak exists to the right; otherwise one exists at mid or to the left |
| Fully sorted matrix | index k in a flattened r × c matrix is cell (k / c, k % c), so it is just a sorted array of length r × c |

## How It Works

### Search in a rotated sorted array (distinct values)

A **rotated** sorted array is a sorted array cut at some point and swapped: `[4, 5, 6, 7, 0, 1, 2]`.

1. `lo = 0`, `hi = n − 1`; while `lo ≤ hi`: compute mid; if `arr[mid] == target` return mid.
2. If `arr[lo] ≤ arr[mid]`, the **left** half is sorted:
   - if `arr[lo] ≤ target < arr[mid]`, search left (`hi = mid − 1`); else search right.
3. Otherwise the **right** half is sorted:
   - if `arr[mid] < target ≤ arr[hi]`, search right (`lo = mid + 1`); else search left.

### Minimum of a rotated sorted array

1. While `lo < hi`: mid; if `arr[mid] > arr[hi]`, the drop is to the right → `lo = mid + 1`; else `hi = mid`.
2. Return `arr[lo]`. The index of the minimum is also the **rotation count**.

With **duplicates** (`[2, 2, 2, 0, 2]`), when `arr[mid] == arr[hi]` you cannot tell which side holds the minimum — shrink with `hi--`. That keeps correctness but makes the worst case O(n).

### Peak element

A **peak** is an element strictly greater than its neighbours (treat out-of-range neighbours as −∞). With `arr[i] ≠ arr[i + 1]` for all i, a peak always exists.

1. While `lo < hi`: mid; if `arr[mid] < arr[mid + 1]`, a peak exists in (mid, hi] → `lo = mid + 1`; else in [lo, mid] → `hi = mid`.
2. Return `lo`.

Why: walking uphill from mid to the right, either the values keep rising until the last element (a peak, since its right neighbour is −∞) or they fall somewhere (the top of that rise is a peak).

### Search in a 2D matrix

- **Fully sorted** (each row sorted, and each row's first element > previous row's last): binary search over indices 0..r × c − 1, mapping k → (k / c, k % c). O(log(r × c)).
- **Rows and columns sorted independently**: binary search does not split the matrix cleanly; use the staircase walk from the top-right corner, O(r + c) — see [2D Arrays and Matrices](../../data-structures/matrices/content.md).

## Visual Explanation

```text
Rotated: [4, 5, 6, 7, 0, 1, 2], target 0

lo=0 (4)        mid=3 (7)        hi=6 (2)
[4  5  6  7] [0  1  2]
 sorted left half: 4 ≤ 0 < 7? no → go right
                     lo=4 (0)  mid=5 (1)  hi=6 (2)
                     arr[lo]=0 ≤ arr[mid]=1 → left half [0, 1] sorted; 0 ≤ 0 < 1 → go left
                     lo=4, hi=4, mid=4 → found 0 at index 4

Peak: [1, 2, 1, 3, 5, 6, 4]
      mid=3 (3) < arr[4]=5 → uphill → lo=4
      mid=5 (6) > arr[6]=4 → hi=5
      mid=4 (5) < 6 → lo=5 → peak at index 5 (value 6)
```

## Pseudocode

```pseudocode
findMinRotated(arr):
    lo ← 0, hi ← n − 1
    while lo < hi:
        mid ← lo + (hi − lo) / 2
        if arr[mid] > arr[hi]: lo ← mid + 1      // minimum is right of mid
        else: hi ← mid                           // minimum is mid or left of it
    return arr[lo]
```

## Java Implementation

```java
public class BinarySearchVariations {

    static int searchRotated(int[] arr, int target) {
        int lo = 0, hi = arr.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (arr[mid] == target) return mid;
            if (arr[lo] <= arr[mid]) {                         // left half sorted
                if (arr[lo] <= target && target < arr[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {                                           // right half sorted
                if (arr[mid] < target && target <= arr[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return -1;
    }

    static int minRotatedIndex(int[] arr) {
        int lo = 0, hi = arr.length - 1;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (arr[mid] > arr[hi]) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }

    static int peakIndex(int[] arr) {
        int lo = 0, hi = arr.length - 1;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (arr[mid] < arr[mid + 1]) lo = mid + 1;         // uphill: a peak is to the right
            else hi = mid;
        }
        return lo;
    }

    static boolean searchMatrix(int[][] m, int target) {
        int rows = m.length, cols = m[0].length;
        int lo = 0, hi = rows * cols - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            int value = m[mid / cols][mid % cols];             // flattened index → cell
            if (value == target) return true;
            if (value < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return false;
    }

    public static void main(String[] args) {
        int[] rotated = {4, 5, 6, 7, 0, 1, 2};
        System.out.println("search 0 -> " + searchRotated(rotated, 0) + ", search 3 -> " + searchRotated(rotated, 3) + ", search 5 -> " + searchRotated(rotated, 5));
        int minIndex = minRotatedIndex(rotated);
        System.out.println("min " + rotated[minIndex] + " at index " + minIndex + " (rotated " + minIndex + " times)");
        System.out.println("not rotated: min index " + minRotatedIndex(new int[] {1, 2, 3}));
        System.out.println("peak index " + peakIndex(new int[] {1, 2, 1, 3, 5, 6, 4}) + ", increasing array peak " + peakIndex(new int[] {1, 2, 3}));
        int[][] matrix = {{1, 3, 5, 7}, {10, 11, 16, 20}, {23, 30, 34, 60}};
        System.out.println("matrix has 16: " + searchMatrix(matrix, 16) + ", has 13: " + searchMatrix(matrix, 13));
    }
}
```

**Output:**

```text
search 0 -> 4, search 3 -> -1, search 5 -> 1
min 0 at index 4 (rotated 4 times)
not rotated: min index 0
peak index 5, increasing array peak 2
matrix has 16: true, has 13: false
```

## Dry Run

`minRotatedIndex([4, 5, 6, 7, 0, 1, 2])`:

| lo | hi | mid | arr[mid] vs arr[hi] | Action |
|----|----|-----|---------------------|--------|
| 0 | 6 | 3 | 7 > 2 | lo = 4 |
| 4 | 6 | 5 | 1 ≤ 2 | hi = 5 |
| 4 | 5 | 4 | 0 ≤ 1 | hi = 4 |
| 4 | 4 | — | stop | minimum at 4 |

Comparing with `arr[hi]` (not `arr[lo]`) also handles the un-rotated case correctly.

## Complexity Analysis

| Problem | Time | Space |
|---------|------|-------|
| Search rotated (distinct) | O(log n) | O(1) |
| Min of rotated (distinct) | O(log n) | O(1) |
| Min / search rotated with duplicates | O(log n) average, O(n) worst | O(1) |
| Peak element | O(log n) | O(1) |
| Fully sorted matrix | O(log(r × c)) | O(1) |
| Row- and column-sorted matrix | O(r + c) | O(1) |

## Variations

- **Search in a bitonic array** (increasing then decreasing): find the peak, then binary search each side (ascending, then descending).
- **Peak in a 2D grid**: binary search on columns; in the middle column take the row of the maximum, then move toward a larger neighbour — O(r log c).
- **Rotation count** = index of the minimum.
- **Search in a nearly sorted array** (each element at most one position away): also compare `mid − 1` and `mid + 1`.

## Comparison

| Approach | Rotated search | Peak |
|----------|----------------|------|
| Linear scan | O(n), trivial | O(n), trivial |
| Find pivot, then one normal binary search | O(log n), two passes | — |
| Single modified binary search | O(log n), one pass | O(log n) |

## Edge Cases

- Array not rotated at all (rotation count 0).
- Arrays of length 1 or 2.
- Target equal to `arr[lo]` or `arr[hi]` (inclusive comparisons matter).
- Peak at index 0 or n − 1.
- Duplicates in rotated arrays (degrade to O(n) worst case).

## Advantages

- Logarithmic time without full sortedness.
- Constant extra space.

## Disadvantages

- Each variation needs its own reasoning; small comparison mistakes (`<` vs `≤`) break correctness.
- Duplicates can destroy the O(log n) guarantee.

## When to Use

- "Sorted array rotated at an unknown pivot", "find the minimum/rotation count".
- "Find any peak / local maximum" in O(log n).
- "Matrix where each row starts after the previous row ends".

## Common Mistakes

- In rotated search, using strict `<` where the boundary should be inclusive (`arr[lo] ≤ target`).
- Comparing `arr[mid]` with `arr[lo]` in the min search without handling the un-rotated case.
- Reading `arr[mid + 1]` with `mid == hi` (the `lo < hi` loop guarantees mid < hi).
- Applying flattened-index search to a matrix that is only row- and column-sorted.

## Key Takeaways

- Binary search needs a test at mid that discards half — not full sortedness.
- Rotated array: one half is always sorted; check whether the target lies in it.
- Rotated minimum: compare `arr[mid]` with `arr[hi]`.
- Peak: move toward the larger neighbour.
- Fully sorted matrix = sorted array via k → (k / c, k % c).
