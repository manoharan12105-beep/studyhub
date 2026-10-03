# Bubble Sort — Practice

### P1. How many passes does bubble sort with early exit make on `[2, 1, 3, 4, 5]`?

**Difficulty:** Easy · **Pattern:** Early exit

- A) 1
- B) 2
- C) 4
- D) 5

<details>
<summary>Hint</summary>

The pass that sorts the array is not the last one — a further pass must observe "no swaps".

</details>

<details>
<summary>Answer</summary>

**Answer:** B) 2

**Explanation:** Pass 1 swaps (2, 1) and the array becomes sorted. Pass 2 makes no swaps, so the algorithm stops.

</details>

### P2. A programmer changes the comparison to `if (arr[i] >= arr[i + 1]) swap`. What changes?

**Difficulty:** Easy · **Pattern:** Stability

- A) Nothing — the output is identical for every input
- B) The array may end up unsorted
- C) Equal elements may be reordered, so the sort is no longer stable (and it does useless swaps)
- D) It becomes O(n log n)

<details>
<summary>Hint</summary>

What happens when two adjacent elements are equal?

</details>

<details>
<summary>Answer</summary>

**Answer:** C) Equal elements may be reordered, so the sort is no longer stable (and it does useless swaps)

**Explanation:** The result is still sorted, but equal keys swap places, which matters when elements carry other data. The early-exit check also never succeeds on input with adjacent equal values, because every pass "swaps" them.

</details>

### P3. Minimum adjacent swaps to sort

**Difficulty:** Medium · **Pattern:** Inversions = adjacent swaps

Return the minimum number of **adjacent** swaps needed to sort an array in ascending order.

**Constraints:** 1 ≤ n ≤ 1000 (an O(n²) solution is acceptable).

Example: `[3, 1, 2]` → `2`; `[4, 3, 2, 1]` → `6`.

<details>
<summary>Hint</summary>

Every adjacent swap of an out-of-order pair removes exactly one inversion, and no adjacent swap can remove more than one.

</details>

<details>
<summary>Answer</summary>

**Approach:** The answer is the number of inversions — exactly the number of swaps bubble sort performs. Count pairs directly in O(n²); for n up to 10⁵ use the merge-sort count ([Merge Sort](../merge-sort/content.md) practice) or a [Fenwick tree](../../data-structures/fenwick-tree/content.md).

```java
public class AdjacentSwaps {

    static long minAdjacentSwaps(int[] arr) {
        long inversions = 0;
        for (int i = 0; i < arr.length; i++) {
            for (int j = i + 1; j < arr.length; j++) {
                if (arr[i] > arr[j]) inversions++;
            }
        }
        return inversions;
    }

    public static void main(String[] args) {
        System.out.println(minAdjacentSwaps(new int[] {3, 1, 2}) + " " + minAdjacentSwaps(new int[] {4, 3, 2, 1}) + " " + minAdjacentSwaps(new int[] {1, 2, 2, 3}));
    }
}
```

**Output:**

```text
2 6 0
```

**Complexity:** O(n²) time, O(1) space.

</details>
