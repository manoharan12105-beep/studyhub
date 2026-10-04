# Binary Search Pattern

## What Is the Pattern

The **binary search pattern** applies whenever a search space can be split by a yes/no question whose answers are **monotone**: all "no" then all "yes" (or the reverse). Each probe in the middle discards half the space, so the boundary — the first "yes" — is found in O(log n) probes.

The search space does not have to be a plainly sorted array: it can be indices of a rotated array, positions where a predicate flips, the start of a window, or a range of possible answers (the last case has its own topic, [Binary Search on Answer](../binary-search-on-answer/content.md)).

Tiny example: in `[1, 3, 3, 5, 8]`, the first index with value ≥ 4 is the boundary of the predicate `a[i] ≥ 4`: F F F T T → index 3.

The mechanics of the classic algorithm and its variants (first/last occurrence, rotated arrays, peaks) are in [Binary Search](../../algorithms/binary-search/content.md) and [Binary Search Variations](../../algorithms/binary-search-variations/content.md).

## Why It Works

If `pred(mid)` is true, then by monotonicity it is true for everything to the right of mid, so the first true is at mid or to its left; if false, the first true is strictly to the right. Either way half of the remaining candidates are eliminated with a single O(1) (or O(cost of pred)) check. After ⌈log₂ n⌉ probes one candidate remains.

## Recognition Clues

| Clue in the problem | Why it points here |
|---------------------|--------------------|
| Sorted array/matrix and "find", "first", "last", "count of", "insert position" | sorted order makes `a[i] ≥ x` monotone |
| Required complexity **O(log n)** | almost always binary search |
| "Rotated sorted array", "bitonic/mountain array", "peak" | each half can still be classified by one comparison |
| A predicate over an index that flips once (e.g. "first bad version", "first day the condition holds") | boundary search |
| Very large n (10⁹ or an implicit range) with cheap checks | cannot scan, can probe |
| "Closest to x", "floor/ceiling" in sorted data | boundary then a neighbour comparison |

## Typical Problem Structure

- Input: a sorted (or piecewise sorted) array, a sorted matrix, an API that answers yes/no, or a numeric range.
- Output: an index, a value, a boundary position, or a count derived from two boundaries.
- The key design step is **writing the predicate** and checking it is monotone.

## Template

```pseudocode
// first index in [lo, hi) where pred is true; returns hi if none
firstTrue(lo, hi):
    while lo < hi:
        mid ← lo + (hi − lo) / 2
        if pred(mid): hi ← mid          // mid may be the answer
        else: lo ← mid + 1              // answer is right of mid
    return lo
```

## Java Template

```java
import java.util.function.IntPredicate;

public class BinarySearchTemplate {

    // First index in [lo, hi) where pred is true, or hi if none. pred must be F…F T…T.
    static int firstTrue(int lo, int hi, IntPredicate pred) {
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;              // no overflow
            if (pred.test(mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    public static void main(String[] args) {
        int[] a = {1, 3, 3, 5, 8};
        int lower = firstTrue(0, a.length, i -> a[i] >= 3);      // first ≥ 3
        int upper = firstTrue(0, a.length, i -> a[i] > 3);       // first > 3
        System.out.println("first >= 3: " + lower + ", count of 3: " + (upper - lower) + ", first >= 9: " + firstTrue(0, a.length, i -> a[i] >= 9));
    }
}
```

**Output:**

```text
first >= 3: 1, count of 3: 2, first >= 9: 5
```

## Example Problem

**K closest elements.** Given a sorted array, an integer k and a target x, return the k elements closest to x in sorted order (ties prefer the smaller element). Example: `[1, 2, 3, 4, 5]`, k = 4, x = 3 → `[1, 2, 3, 4]`.

- **Brute force:** sort by distance to x — O(n log n); or a heap of size k — O(n log k).
- **Observation:** the answer is a contiguous window `a[s … s + k − 1]`. Compare window start s with s + 1: moving right is better exactly when `x − a[s] > a[s + k] − x` (the element leaving is farther than the one entering). This predicate is false…false, true…true **reversed**: it is true while the window is too far left. So binary search for the first s in [0, n − k] where it is **false**.

```java
import java.util.*;

public class KClosestElements {

    static List<Integer> findClosestElements(int[] a, int k, int x) {
        int lo = 0, hi = a.length - k;                 // window start ∈ [0, n − k]
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (x - a[mid] > a[mid + k] - x) lo = mid + 1;   // a[mid] is farther than a[mid + k]: shift right
            else hi = mid;
        }
        List<Integer> result = new ArrayList<>();
        for (int i = lo; i < lo + k; i++) result.add(a[i]);
        return result;
    }

    public static void main(String[] args) {
        System.out.println(findClosestElements(new int[] {1, 2, 3, 4, 5}, 4, 3) + " " + findClosestElements(new int[] {1, 2, 3, 4, 5}, 4, -1) + " "
                + findClosestElements(new int[] {1, 1, 2, 3, 4, 5, 9}, 3, 8));
    }
}
```

**Output:**

```text
[1, 2, 3, 4] [1, 2, 3, 4] [4, 5, 9]
```

## Dry Run

`a = [1, 1, 2, 3, 4, 5, 9]`, k = 3, x = 8; window starts 0 … 4:

| lo | hi | mid | x − a[mid] | a[mid + k] − x | Shift right? |
|----|----|-----|------------|----------------|--------------|
| 0 | 4 | 2 | 8 − 2 = 6 | a[5] − 8 = −3 | 6 > −3 → yes, lo = 3 |
| 3 | 4 | 3 | 8 − 3 = 5 | a[6] − 8 = 1 | 5 > 1 → yes, lo = 4 |
| 4 | 4 | — | — | — | stop: window a[4 … 6] = [4, 5, 9] |

Note the signed comparison `x − a[mid] > a[mid + k] − x` (not absolute values): it handles x outside the window correctly.

## Common Mistakes

- `mid = (lo + hi) / 2` overflowing for large `int` bounds — use `lo + (hi − lo) / 2`.
- Mixing templates: `while (lo <= hi)` with `hi = mid` loops forever; pick one invariant (half-open `[lo, hi)` above) and keep it.
- A predicate that is not monotone (e.g. using `abs` distances in the k-closest problem breaks ties inconsistently).
- Forgetting the "not found" case (`lo == hi` at the end of the range).
- Using binary search on unsorted data.

## Variations

- **Lower / upper bound:** first ≥ x, first > x; count of x = upper − lower.
- **Last true:** search for the first false and subtract one.
- **Rotated array:** decide which half is sorted, then whether the target lies in it.
- **Peak / mountain:** compare `a[mid]` with `a[mid + 1]` — the slope direction is the predicate.
- **2D sorted matrix:** treat as a flattened array (row-major sorted) or binary search per row.
- **Search over answers:** [Binary Search on Answer](../binary-search-on-answer/content.md).
- **Real numbers:** loop a fixed number of times (e.g. 100) instead of `lo < hi`.

## Complexity

| Task | Time | Space |
|------|------|-------|
| Boundary in an array of n | O(log n) | O(1) iterative |
| With a predicate costing O(c) | O(c log n) | O(1) |
| Library: `Arrays.binarySearch`, `Collections.binarySearch` | O(log n) — return `−(insertionPoint) − 1` when absent | O(1) |

## When Not to Use It

- Data unsorted and queried only once — a linear scan O(n) beats sorting first O(n log n).
- The predicate is not monotone (multiple flips). For a unimodal sequence, compare neighbours instead (the peak technique in [Binary Search Variations](../../algorithms/binary-search-variations/content.md)); otherwise use a different approach.
- Linked lists — no O(1) access to the middle.
- Many insertions/deletions interleaved with searches — use a balanced BST (`TreeMap`/`TreeSet`).

## Key Takeaways

- Find a monotone yes/no question over the search space; binary search finds where it flips.
- Use one template consistently (`[lo, hi)`, `hi = mid` / `lo = mid + 1`).
- O(log n) probes; the predicate can be anything you can evaluate.
