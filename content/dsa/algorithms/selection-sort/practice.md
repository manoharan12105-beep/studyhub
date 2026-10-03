# Selection Sort — Practice

### P1. How many comparisons does selection sort make on an already sorted array of 6 elements?

**Difficulty:** Easy · **Pattern:** Not adaptive

- A) 5
- B) 6
- C) 15
- D) 36

<details>
<summary>Hint</summary>

The minimum search does not know the array is sorted.

</details>

<details>
<summary>Answer</summary>

**Answer:** C) 15

**Explanation:** 5 + 4 + 3 + 2 + 1 = n(n − 1)/2 = 15, regardless of the input order. Bubble or insertion sort would make only 5 comparisons on sorted input.

</details>

### P2. K smallest elements in sorted order with partial selection sort

**Difficulty:** Medium · **Pattern:** Stop after k passes

Return the k smallest elements of an array in ascending order by running only the first k passes of selection sort. When is this better than sorting everything?

**Constraints:** 1 ≤ k ≤ n ≤ 10⁴.

Example: `[7, 2, 9, 4, 1, 8]`, k = 3 → `[1, 2, 4]`.

<details>
<summary>Hint</summary>

After pass i, `arr[0..i]` already holds the i + 1 smallest elements in order.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.Arrays;

public class PartialSelection {

    static int[] kSmallest(int[] input, int k) {
        int[] arr = input.clone();                 // do not mutate the caller's array
        for (int i = 0; i < k; i++) {
            int minIndex = i;
            for (int j = i + 1; j < arr.length; j++) {
                if (arr[j] < arr[minIndex]) minIndex = j;
            }
            int temp = arr[i];
            arr[i] = arr[minIndex];
            arr[minIndex] = temp;
        }
        return Arrays.copyOf(arr, k);
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(kSmallest(new int[] {7, 2, 9, 4, 1, 8}, 3)));
    }
}
```

**Output:**

```text
[1, 2, 4]
```

**Complexity:** O(n × k) time, O(n) space for the copy. It beats a full O(n log n) sort only when k is smaller than about log n; for larger k use a size-k heap (O(n log k)) — see [Heap Applications](../../data-structures/heap-applications/content.md).

</details>

### P3. Minimum swaps to sort a permutation

**Difficulty:** Medium · **Pattern:** Cycle decomposition

Given a permutation of 0..n − 1, return the minimum number of swaps (any two positions) needed to sort it.

**Constraints:** 1 ≤ n ≤ 10⁵.

Example: `[2, 0, 1, 3]` → `2`; `[1, 0, 3, 2]` → `2`.

<details>
<summary>Hint</summary>

Draw an arrow from each index i to the index where `arr[i]` belongs (index `arr[i]`). The arrows form cycles; a cycle of length L needs L − 1 swaps.

</details>

<details>
<summary>Answer</summary>

**Approach:** Selection sort uses at most n − 1 swaps, but the minimum is n − (number of cycles): each swap can increase the number of cycles by at most one, and the sorted array has n cycles of length 1.

```java
public class MinSwapsPermutation {

    static int minSwaps(int[] arr) {
        boolean[] visited = new boolean[arr.length];
        int swaps = 0;
        for (int i = 0; i < arr.length; i++) {
            if (visited[i] || arr[i] == i) continue;
            int cycleLength = 0;
            for (int j = i; !visited[j]; j = arr[j]) {    // follow the cycle
                visited[j] = true;
                cycleLength++;
            }
            swaps += cycleLength - 1;
        }
        return swaps;
    }

    public static void main(String[] args) {
        System.out.println(minSwaps(new int[] {2, 0, 1, 3}) + " " + minSwaps(new int[] {1, 0, 3, 2}) + " " + minSwaps(new int[] {0, 1, 2}));
    }
}
```

**Output:**

```text
2 2 0
```

**Complexity:** O(n) time, O(n) space. For arbitrary distinct values, sort a copy with original indices first (O(n log n)) to build the permutation.

</details>
