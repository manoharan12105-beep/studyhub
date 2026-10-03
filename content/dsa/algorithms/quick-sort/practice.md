# Quick Sort — Practice

### P1. Quick sort always picks the **last** element as pivot. Which input of size n triggers its worst case?

**Difficulty:** Easy · **Pattern:** Worst-case input

- A) A random permutation
- B) An already sorted array
- C) An array with all distinct values
- D) An array of length 1

<details>
<summary>Hint</summary>

What happens to the partition sizes when the pivot is the maximum?

</details>

<details>
<summary>Answer</summary>

**Answer:** B) An already sorted array

**Explanation:** The last element is the maximum, so every partition is (n − 1, 0): T(n) = T(n − 1) + O(n) = O(n²), with recursion depth n. Reverse-sorted input is equally bad. Random or median-of-three pivots avoid it.

</details>

### P2. Sort colours (Dutch national flag)

**Difficulty:** Medium · **Pattern:** Three-way partition

An array contains only 0, 1 and 2. Sort it in place in one pass with O(1) extra space.

**Constraints:** 1 ≤ n ≤ 300.

Example: `[2, 0, 2, 1, 1, 0]` → `[0, 0, 1, 1, 2, 2]`.

<details>
<summary>Hint</summary>

Three-way partition around pivot 1: `low` marks the end of the 0s, `high` the start of the 2s, `mid` scans.

</details>

<details>
<summary>Answer</summary>

**Approach:** Counting sort needs two passes. The three-way partition keeps `[0, low)` = 0s, `[low, mid)` = 1s, `(high, n − 1]` = 2s, and `[mid, high]` unknown.

```java
import java.util.Arrays;

public class SortColours {

    static void sortColours(int[] a) {
        int low = 0, mid = 0, high = a.length - 1;
        while (mid <= high) {
            if (a[mid] == 0) {
                swap(a, low++, mid++);
            } else if (a[mid] == 2) {
                swap(a, mid, high--);       // the value swapped in is unexamined: keep mid
            } else {
                mid++;
            }
        }
    }

    static void swap(int[] a, int i, int j) {
        int t = a[i]; a[i] = a[j]; a[j] = t;
    }

    public static void main(String[] args) {
        int[] a = {2, 0, 2, 1, 1, 0};
        sortColours(a);
        System.out.println(Arrays.toString(a));
    }
}
```

**Output:**

```text
[0, 0, 1, 1, 2, 2]
```

**Complexity:** O(n) time, one pass, O(1) space.

</details>

### P3. K-th largest element with quickselect

**Difficulty:** Medium · **Pattern:** Partition, recurse into one side

Find the k-th largest element in O(n) average time.

**Constraints:** 1 ≤ k ≤ n ≤ 10⁵.

Example: `[3, 2, 1, 5, 6, 4]`, k = 2 → `5`; `[3, 2, 3, 1, 2, 4, 5, 5, 6]`, k = 4 → `4`.

<details>
<summary>Hint</summary>

The k-th largest is at index n − k in sorted order. After partitioning, the pivot's index tells you which side holds that index — recurse (or loop) into that side only.

</details>

<details>
<summary>Answer</summary>

**Approach:** Expected work n + n/2 + n/4 + … = O(n) with random pivots (O(n²) worst case). The size-k heap alternative ([Heap Applications](../../data-structures/heap-applications/content.md)) is O(n log k) and works on streams.

```java
import java.util.Random;

public class QuickSelect {

    private static final Random RANDOM = new Random(7);

    static int kthLargest(int[] input, int k) {
        int[] a = input.clone();
        int target = a.length - k, lo = 0, hi = a.length - 1;
        while (true) {
            int p = partition(a, lo, hi);
            if (p == target) return a[p];
            if (p < target) lo = p + 1;
            else hi = p - 1;
        }
    }

    static int partition(int[] a, int lo, int hi) {
        int r = lo + RANDOM.nextInt(hi - lo + 1);
        int t = a[r]; a[r] = a[hi]; a[hi] = t;
        int pivot = a[hi], i = lo;
        for (int j = lo; j < hi; j++) {
            if (a[j] < pivot) { t = a[i]; a[i] = a[j]; a[j] = t; i++; }
        }
        t = a[i]; a[i] = a[hi]; a[hi] = t;
        return i;
    }

    public static void main(String[] args) {
        System.out.println(kthLargest(new int[] {3, 2, 1, 5, 6, 4}, 2) + " " + kthLargest(new int[] {3, 2, 3, 1, 2, 4, 5, 5, 6}, 4) + " " + kthLargest(new int[] {7}, 1));
    }
}
```

**Output:**

```text
5 4 7
```

**Complexity:** O(n) average, O(n²) worst time; O(n) space for the copy (O(1) if mutating the input is allowed).

</details>
