# Binary Search

## Definition

**Binary search** finds a target in a **sorted** array by comparing it with the middle element and discarding the half that cannot contain it. Each step halves the search range, so it takes **O(log n)** time. The same idea finds boundaries: the **first** or **last occurrence** of a value, the **lower bound** (first element ≥ x), the **upper bound** (first element > x) and the **insert position**.

## Why It Matters

Halving is extraordinarily powerful: 10⁹ sorted elements need at most 30 comparisons. Binary search is one of the most frequently tested algorithms, mostly through its **boundary** variants — which are also where most bugs live (infinite loops, off-by-one, overflow). Mastering one consistent template prevents those bugs. The idea generalises to any **monotonic** yes/no condition: see [Binary Search Pattern](../../patterns/binary-search-pattern/content.md) and [Binary Search on Answer](../../patterns/binary-search-on-answer/content.md).

## Prerequisites

- [Arrays](../../data-structures/arrays/content.md)
- [Time Complexity](../../fundamentals/time-complexity/content.md) — why halving gives log n

## Intuition

Guessing a number between 1 and 100 with "higher/lower" hints: guess 50, then 25 or 75, and so on. Each answer eliminates half of the remaining possibilities. Sortedness is what makes "lower" or "higher" meaningful — one comparison with the middle tells you about **all** elements on one side.

## How It Works

### Classic search (exact match)

1. `lo = 0`, `hi = n − 1` — the target, if present, is in [lo, hi].
2. While `lo ≤ hi`:
   1. `mid = lo + (hi − lo) / 2`.
   2. If `arr[mid] == target`, return mid.
   3. If `arr[mid] < target`, the target is right of mid: `lo = mid + 1`.
   4. Otherwise it is left of mid: `hi = mid − 1`.
3. Range empty → return −1.

> [!IMPORTANT]
> Write `mid = lo + (hi − lo) / 2`, not `(lo + hi) / 2`. When `lo + hi` exceeds `Integer.MAX_VALUE` (about 2.1 × 10⁹), the sum overflows to a negative number. (`(lo + hi) >>> 1` also works.)

### Boundary search: one template for all variants

Most variants ask for the **first index where a condition becomes true**, for a condition that is false, false, …, false, true, true, …, true across the array (monotonic). Use a half-open range and never return early:

1. `lo = 0`, `hi = n` — the answer is in [lo, hi]; `n` means "no index satisfies it".
2. While `lo < hi`: `mid = lo + (hi − lo) / 2`. If `condition(mid)` is true, the answer is mid or to its left: `hi = mid`. Otherwise it is to the right: `lo = mid + 1`.
3. Return `lo` (= `hi`).

The range shrinks every iteration (`mid < hi`, and `lo = mid + 1 > mid`), so the loop always terminates.

| Variant | Condition at index i | Result |
|---------|----------------------|--------|
| **Lower bound** (first element ≥ x) | `arr[i] >= x` | index, or n if all < x |
| **Upper bound** (first element > x) | `arr[i] > x` | index, or n if all ≤ x |
| **First occurrence** of x | lower bound, then check `arr[lb] == x` | index or −1 |
| **Last occurrence** of x | upper bound − 1, then check | index or −1 |
| **Count** of x | upper bound − lower bound | count |
| **Search insert position** | lower bound | where x would be inserted to keep order |
| Last element < x | lower bound − 1 | index or −1 |

## Visual Explanation

```text
lower bound of 7 in [1, 3, 5, 7, 7, 7, 9, 11]   condition: arr[i] >= 7

index:     0  1  2  3  4  5  6  7    (n = 8)
value:     1  3  5  7  7  7  9  11
condition: F  F  F  T  T  T  T  T    ← one switch from F to T: find the first T

lo=0 hi=8  mid=4 (7 ≥ 7, T) → hi=4
lo=0 hi=4  mid=2 (5 ≥ 7, F) → lo=3
lo=3 hi=4  mid=3 (7 ≥ 7, T) → hi=3
lo=3 hi=3  stop → lower bound = 3 (first 7)
upper bound of 7 = 6 (first element > 7); count of 7 = 6 − 3 = 3
```

## Pseudocode

```pseudocode
firstTrue(lo, hi, condition):        // answer in [lo, hi]; hi means "none"
    while lo < hi:
        mid ← lo + (hi − lo) / 2
        if condition(mid): hi ← mid
        else: lo ← mid + 1
    return lo
```

## Java Implementation

```java
import java.util.Arrays;

public class BinarySearch {

    static int search(int[] arr, int target) {
        int lo = 0, hi = arr.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;          // no overflow
            if (arr[mid] == target) return mid;
            if (arr[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return -1;
    }

    static int searchRecursive(int[] arr, int target, int lo, int hi) {
        if (lo > hi) return -1;
        int mid = lo + (hi - lo) / 2;
        if (arr[mid] == target) return mid;
        return arr[mid] < target ? searchRecursive(arr, target, mid + 1, hi) : searchRecursive(arr, target, lo, mid - 1);
    }

    // First index i with arr[i] >= x, or arr.length if none.
    static int lowerBound(int[] arr, int x) {
        int lo = 0, hi = arr.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (arr[mid] >= x) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    // First index i with arr[i] > x, or arr.length if none.
    static int upperBound(int[] arr, int x) {
        int lo = 0, hi = arr.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (arr[mid] > x) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    static int firstOccurrence(int[] arr, int x) {
        int i = lowerBound(arr, x);
        return (i < arr.length && arr[i] == x) ? i : -1;
    }

    static int lastOccurrence(int[] arr, int x) {
        int i = upperBound(arr, x) - 1;
        return (i >= 0 && arr[i] == x) ? i : -1;
    }

    public static void main(String[] args) {
        int[] arr = {1, 3, 5, 7, 7, 7, 9, 11};
        System.out.println("search 9 -> " + search(arr, 9) + ", search 4 -> " + search(arr, 4) + ", recursive 11 -> " + searchRecursive(arr, 11, 0, arr.length - 1));
        System.out.println("lower(7)=" + lowerBound(arr, 7) + " upper(7)=" + upperBound(arr, 7) + " count(7)=" + (upperBound(arr, 7) - lowerBound(arr, 7)));
        System.out.println("first(7)=" + firstOccurrence(arr, 7) + " last(7)=" + lastOccurrence(arr, 7) + " first(4)=" + firstOccurrence(arr, 4));
        System.out.println("insert position of 4=" + lowerBound(arr, 4) + ", of 12=" + lowerBound(arr, 12) + ", of 0=" + lowerBound(arr, 0));
        System.out.println("JDK Arrays.binarySearch(arr, 4) = " + Arrays.binarySearch(arr, 4) + "  (-(insertion point) - 1)");
    }
}
```

**Output:**

```text
search 9 -> 6, search 4 -> -1, recursive 11 -> 7
lower(7)=3 upper(7)=6 count(7)=3
first(7)=3 last(7)=5 first(4)=-1
insert position of 4=2, of 12=8, of 0=0
JDK Arrays.binarySearch(arr, 4) = -3  (-(insertion point) - 1)
```

## Dry Run

Classic `search([1, 3, 5, 7, 7, 7, 9, 11], 9)`:

| lo | hi | mid | arr[mid] | Action |
|----|----|-----|----------|--------|
| 0 | 7 | 3 | 7 | 7 < 9 → lo = 4 |
| 4 | 7 | 5 | 7 | 7 < 9 → lo = 6 |
| 6 | 7 | 6 | 9 | found → return 6 |

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| Best | O(1) | target at the first middle (classic search only) |
| Average | O(log n) | |
| Worst | O(log n) | the range halves each step: n → n/2 → … → 1 takes ⌊log₂ n⌋ + 1 steps |

**Space:** O(1) iterative; O(log n) recursive (call stack). Recurrence: T(n) = T(n/2) + O(1) → O(log n) ([Recurrence Relations](../../fundamentals/recurrence-relations/content.md)).

The boundary template always runs the full ~log₂ n iterations (no early exit) — still O(log n).

## Properties

- Requires sorted data (or, more generally, a monotonic condition) **and** O(1) random access — binary search on a linked list is O(n).
- With duplicates, classic search returns **some** matching index, not necessarily the first.

## Variations

- Rotated sorted arrays, peaks, 2D matrices: [Binary Search Variations](../binary-search-variations/content.md).
- Searching for an answer value rather than an index (minimum capacity, square root): [Binary Search on Answer](../../patterns/binary-search-on-answer/content.md).
- Binary search on real numbers: loop a fixed number of times (e.g. 100) instead of `lo < hi`.

## Comparison

| | Linear search | Binary search | Hash lookup |
|---|---------------|---------------|-------------|
| Precondition | none | sorted + random access | hash set built |
| Exact match | O(n) | O(log n) | O(1) average |
| Boundary / nearest / range count | O(n) | O(log n) | not possible |
| Maintaining under inserts | O(1) append | O(n) to keep sorted | O(1) average |

For many inserts and ordered queries, use a `TreeMap`/`TreeSet` (balanced BST): O(log n) for both.

## Edge Cases

- Empty array (`hi = −1` in the classic version → returns −1 immediately).
- Target smaller than all / larger than all elements → lower bound 0 / n.
- All elements equal to the target.
- Arrays of length 1 and 2 (where many off-by-one bugs show up).

## Advantages

- O(log n) — practically constant for any in-memory array.
- O(1) extra space; simple once a template is fixed.

## Disadvantages

- Needs sorted data with random access; sorting first costs O(n log n).
- Easy to write subtly wrong boundary code.

## When to Use

- The input is sorted (or rotated/partly sorted), and you need a position, a boundary or a count.
- "Find the first/last…", "smallest index such that…", "how many elements ≤ x" on sorted data.
- A huge search space with a yes/no check that is monotonic — binary search on the answer.

## Common Mistakes

- `(lo + hi) / 2` overflow.
- Mixing templates: `while (lo <= hi)` with `hi = mid` causes infinite loops; `while (lo < hi)` with `hi = mid − 1` skips the answer.
- Returning on the first match when the first or last occurrence is required.
- Forgetting to check that `lowerBound` actually found the value (index n or a different value).
- Misreading `Arrays.binarySearch`'s negative return value.

## Key Takeaways

- Halve the range each step → O(log n); sorted data and random access are required.
- Classic: `lo ≤ hi`, `lo = mid + 1`, `hi = mid − 1`. Boundary: half-open `[lo, hi)`, `lo < hi`, `hi = mid` / `lo = mid + 1`, return `lo`.
- Lower bound = first ≥ x; upper bound = first > x; count = upper − lower.
- `mid = lo + (hi − lo) / 2`.
