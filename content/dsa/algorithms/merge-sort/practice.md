# Merge Sort — Practice

### P1. Merge two sorted arrays in place

**Difficulty:** Easy · **Pattern:** Merge from the back

`a` has length m + n: its first m elements are sorted and the last n slots are empty. `b` has n sorted elements. Merge `b` into `a` so that `a` is sorted, using no extra array.

**Constraints:** 0 ≤ m, n ≤ 200.

Example: a = `[1, 2, 3, 0, 0, 0]`, m = 3; b = `[2, 5, 6]` → `[1, 2, 2, 3, 5, 6]`.

<details>
<summary>Hint</summary>

Merging from the front would overwrite unread elements of `a`. Fill from the **back** with the larger element each time.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.Arrays;

public class MergeInPlace {

    static void merge(int[] a, int m, int[] b, int n) {
        int i = m - 1, j = n - 1, write = m + n - 1;
        while (j >= 0) {                                   // once b is used up, a's rest is in place
            if (i >= 0 && a[i] > b[j]) a[write--] = a[i--];
            else a[write--] = b[j--];
        }
    }

    public static void main(String[] args) {
        int[] a = {1, 2, 3, 0, 0, 0};
        merge(a, 3, new int[] {2, 5, 6}, 3);
        System.out.println(Arrays.toString(a));
        int[] c = {0};
        merge(c, 0, new int[] {1}, 1);
        System.out.println(Arrays.toString(c));
    }
}
```

**Output:**

```text
[1, 2, 2, 3, 5, 6]
[1]
```

**Complexity:** O(m + n) time, O(1) extra space. The write index never overtakes unread elements of `a` because it starts n positions ahead.

</details>

### P2. Count inversions

**Difficulty:** Medium · **Pattern:** Count during merge

Count pairs (i, j) with i < j and `arr[i] > arr[j]`.

**Constraints:** 1 ≤ n ≤ 10⁵ (answer can exceed `int`).

Example: `[2, 4, 1, 3, 5]` → `3` ((2,1), (4,1), (4,3)).

<details>
<summary>Hint</summary>

While merging, when an element is taken from the right half, it is smaller than every remaining element of the left half — that many inversions at once.

</details>

<details>
<summary>Answer</summary>

**Approach:** Brute force is O(n²). Inversions = inversions inside the left half + inside the right half + "cross" inversions, which the merge counts in O(n): taking `right[j]` while `mid − i + 1` left elements remain adds that many.

```java
public class CountInversions {

    static long count(int[] arr) {
        return sortCount(arr.clone(), new int[arr.length], 0, arr.length - 1);
    }

    private static long sortCount(int[] a, int[] buf, int lo, int hi) {
        if (lo >= hi) return 0;
        int mid = lo + (hi - lo) / 2;
        long total = sortCount(a, buf, lo, mid) + sortCount(a, buf, mid + 1, hi);
        for (int k = lo; k <= hi; k++) buf[k] = a[k];
        int i = lo, j = mid + 1;
        for (int k = lo; k <= hi; k++) {
            if (i > mid) a[k] = buf[j++];
            else if (j > hi) a[k] = buf[i++];
            else if (buf[j] < buf[i]) {
                total += mid - i + 1;            // buf[j] is smaller than all of buf[i..mid]
                a[k] = buf[j++];
            } else a[k] = buf[i++];
        }
        return total;
    }

    public static void main(String[] args) {
        System.out.println(count(new int[] {2, 4, 1, 3, 5}) + " " + count(new int[] {5, 4, 3, 2, 1}) + " " + count(new int[] {1, 1, 1}));
    }
}
```

**Output:**

```text
3 10 0
```

**Complexity:** O(n log n) time, O(n) space.

</details>

### P3. Reverse pairs

**Difficulty:** Hard · **Pattern:** Count with two pointers before merging

Count pairs (i, j) with i < j and `arr[i] > 2 × arr[j]`.

**Constraints:** 1 ≤ n ≤ 5 × 10⁴; values in the full `int` range (2 × value needs `long`).

Example: `[1, 3, 2, 3, 1]` → `2`; `[2, 4, 3, 5, 1]` → `3`.

<details>
<summary>Hint</summary>

The condition differs from the merge order, so count separately: with both halves sorted, for each i in the left half advance a pointer j in the right half while `arr[i] > 2 × arr[j]`. Then merge normally.

</details>

<details>
<summary>Answer</summary>

**Approach:** Because both halves are sorted, the pointer j only moves forward as i increases — an O(n) two-pointer count per merge, keeping O(n log n) overall.

```java
public class ReversePairs {

    static int count(int[] arr) {
        return sortCount(arr.clone(), new int[arr.length], 0, arr.length - 1);
    }

    private static int sortCount(int[] a, int[] buf, int lo, int hi) {
        if (lo >= hi) return 0;
        int mid = lo + (hi - lo) / 2;
        int total = sortCount(a, buf, lo, mid) + sortCount(a, buf, mid + 1, hi);
        int j = mid + 1;
        for (int i = lo; i <= mid; i++) {
            while (j <= hi && (long) a[i] > 2L * a[j]) j++;
            total += j - (mid + 1);              // right elements counted so far all qualify for a[i]
        }
        for (int k = lo; k <= hi; k++) buf[k] = a[k];
        int i = lo;
        j = mid + 1;
        for (int k = lo; k <= hi; k++) {
            if (i > mid) a[k] = buf[j++];
            else if (j > hi) a[k] = buf[i++];
            else if (buf[j] < buf[i]) a[k] = buf[j++];
            else a[k] = buf[i++];
        }
        return total;
    }

    public static void main(String[] args) {
        System.out.println(count(new int[] {1, 3, 2, 3, 1}) + " " + count(new int[] {2, 4, 3, 5, 1}) + " " + count(new int[] {2147483647, 2147483647, -2147483647}));
    }
}
```

**Output:**

```text
2 3 2
```

**Complexity:** O(n log n) time, O(n) space.

</details>
