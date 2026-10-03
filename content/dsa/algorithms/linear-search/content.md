# Linear Search

## Definition

**Linear search** checks each element of a collection in order until it finds the target or reaches the end. It works on any sequence — sorted or not — and runs in **O(n)** time with **O(1)** extra space.

## Why It Matters

It is the baseline every other search is measured against, and it is the right choice more often than people think: for unsorted data searched once, for small arrays, for linked lists (no random access), and whenever the condition is not a simple comparison ("first element that is prime and greater than x"). Many "single pass" interview solutions are linear scans with extra bookkeeping.

## Intuition

Looking for a name on an unsorted attendance sheet: you read from the top until you see it. Without any order, every unchecked entry could be the one you want, so in the worst case you must look at all of them.

## How It Works

1. For i = 0 to n − 1:
2. If `arr[i]` equals the target (or satisfies the condition), return i.
3. If the loop ends, return −1 (not found).

## Pseudocode

```pseudocode
linearSearch(arr, target):
    for i from 0 to n − 1:
        if arr[i] = target: return i
    return −1
```

## Java Implementation

```java
public class LinearSearch {

    static int indexOf(int[] arr, int target) {
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) {
                return i;
            }
        }
        return -1;
    }

    // Same scan, but for any condition: the index of the first even number greater than limit.
    static int firstEvenAbove(int[] arr, int limit) {
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] > limit && arr[i] % 2 == 0) {
                return i;
            }
        }
        return -1;
    }

    // Counting needs a full pass: there is no early exit.
    static int count(int[] arr, int target) {
        int total = 0;
        for (int value : arr) {
            if (value == target) {
                total++;
            }
        }
        return total;
    }

    public static void main(String[] args) {
        int[] data = {14, 3, 9, 3, 22, 7, 18};
        System.out.println(indexOf(data, 9) + " " + indexOf(data, 5) + " " + indexOf(new int[] {}, 1));
        System.out.println(firstEvenAbove(data, 15) + " " + count(data, 3));
    }
}
```

**Output:**

```text
2 -1 -1
4 2
```

## Dry Run

`indexOf([14, 3, 9, 3, 22, 7, 18], 9)`:

| i | arr[i] | arr[i] == 9? |
|---|--------|--------------|
| 0 | 14 | no |
| 1 | 3 | no |
| 2 | 9 | **yes → return 2** |

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| Best | O(1) | target at index 0 |
| Average | O(n) | about n/2 comparisons if the target is present at a uniformly random position |
| Worst | O(n) | target last or absent: n comparisons |

**Space:** O(1) — a loop index only.

## Properties

- Works on unsorted data and on any sequence that can be iterated (arrays, linked lists, streams).
- **Online:** can process elements as they arrive.
- Finds the **first** occurrence when scanning left to right (scan right to left for the last).

## Variations

- **Sentinel search:** place the target at the end so the loop needs no bounds check — a micro-optimisation, rarely useful in Java.
- **Find all occurrences / count:** no early exit.
- **Search with a predicate:** any condition, not just equality.
- **Search from both ends:** still O(n), halves the worst-case iterations at best.

## Comparison

| | Linear search | Binary search | Hash set lookup |
|---|---------------|---------------|-----------------|
| Requires | nothing | sorted data, random access | building a hash set first (O(n)) |
| Time per search | O(n) | O(log n) | O(1) average |
| Best when | one search, unsorted data, small n, linked lists | many searches on sorted data | many membership checks |

If you will search **k** times: linear search costs O(k × n); sorting once then binary search costs O(n log n + k log n); building a hash set costs O(n + k).

## Edge Cases

- Empty array → return −1 without accessing any element.
- Duplicates → decide whether the first, last or all occurrences are needed.
- Searching for `null` or objects → compare with `equals`, not `==`.

## Advantages

- No preconditions; simplest correct search.
- O(1) memory; works on linked structures and streams.

## Disadvantages

- O(n) per search — too slow for many repeated searches on large data.

## When to Use

- Data is unsorted and searched once (sorting would cost more than the search).
- n is small (tens or a few hundred elements).
- The condition is complex or the data structure has no random access.

## Common Mistakes

- Returning −1 inside the loop on the first mismatch (the `else return -1` bug).
- Using `<= arr.length` and going out of bounds.
- Sorting first "to use binary search" for a single query — O(n log n) is worse than O(n).

## Key Takeaways

- Check each element in turn: O(n) worst/average, O(1) best, O(1) space.
- No preconditions — the default for unsorted or unindexed data.
- For many searches, sort + binary search or hash once instead.
