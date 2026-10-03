# Counting Sort — Practice

### P1. Sort ages

**Difficulty:** Easy · **Pattern:** Counting over a fixed range

Sort an array of ages, each between 0 and 120, in O(n) time.

**Constraints:** 1 ≤ n ≤ 10⁷.

Example: `[34, 2, 34, 120, 0, 17]` → `[0, 2, 17, 34, 34, 120]`.

<details>
<summary>Hint</summary>

121 counters; then write each age as many times as it was counted.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.Arrays;

public class SortAges {

    static void sortAges(int[] ages) {
        int[] count = new int[121];
        for (int a : ages) count[a]++;
        int write = 0;
        for (int age = 0; age <= 120; age++) {
            while (count[age]-- > 0) ages[write++] = age;
        }
    }

    public static void main(String[] args) {
        int[] ages = {34, 2, 34, 120, 0, 17};
        sortAges(ages);
        System.out.println(Arrays.toString(ages));
    }
}
```

**Output:**

```text
[0, 2, 17, 34, 34, 120]
```

**Complexity:** O(n + 121) = O(n) time, O(1) extra space (the count array has fixed size). For 10⁷ ages this is far faster than an O(n log n) sort.

</details>

### P2. Relative sort array

**Difficulty:** Medium · **Pattern:** Counting with a custom order

Sort `a` so that elements appearing in `order` come first, in the sequence given by `order`; remaining elements follow in ascending order. All values of `order` are distinct and appear in `a`.

**Constraints:** values 0 ≤ x ≤ 1000; lengths ≤ 1000.

Example: a = `[2,3,1,3,2,4,6,7,9,2,19]`, order = `[2,1,4,3,9,6]` → `[2,2,2,1,4,3,3,9,6,7,19]`.

<details>
<summary>Hint</summary>

Count every value; output the values of `order` first (draining their counts), then sweep the count array for what is left.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.Arrays;

public class RelativeSort {

    static int[] relativeSort(int[] a, int[] order) {
        int[] count = new int[1001];
        for (int x : a) count[x]++;
        int[] out = new int[a.length];
        int w = 0;
        for (int x : order) {
            while (count[x]-- > 0) out[w++] = x;
        }
        for (int x = 0; x <= 1000; x++) {
            while (count[x]-- > 0) out[w++] = x;   // counts of ordered values are already exhausted
        }
        return out;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.toString(relativeSort(new int[] {2, 3, 1, 3, 2, 4, 6, 7, 9, 2, 19}, new int[] {2, 1, 4, 3, 9, 6})));
    }
}
```

**Output:**

```text
[2, 2, 2, 1, 4, 3, 3, 9, 6, 7, 19]
```

**Complexity:** O(n + m + k) time with k = 1001, O(k) extra space. A comparator sort with a rank map works for any range in O(n log n).

</details>

### P3. H-index

**Difficulty:** Medium · **Pattern:** Counting with capped buckets

A researcher's h-index is the largest h such that at least h papers have at least h citations each. Compute it in O(n).

**Constraints:** 1 ≤ n ≤ 5000; 0 ≤ citations ≤ 1000.

Example: `[3, 0, 6, 1, 5]` → `3`.

<details>
<summary>Hint</summary>

The answer is at most n, so any citation count above n can be treated as n. Count papers per citation value, then scan from n down, accumulating "papers with at least h citations".

</details>

<details>
<summary>Answer</summary>

**Approach:** Sorting descending and finding the last i with `citations[i] ≥ i + 1` is O(n log n). Capping at n turns it into a counting problem over n + 1 buckets.

```java
public class HIndex {

    static int hIndex(int[] citations) {
        int n = citations.length;
        int[] buckets = new int[n + 1];
        for (int c : citations) buckets[Math.min(c, n)]++;
        int atLeast = 0;
        for (int h = n; h >= 0; h--) {
            atLeast += buckets[h];                 // papers with ≥ h citations
            if (atLeast >= h) return h;
        }
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(hIndex(new int[] {3, 0, 6, 1, 5}) + " " + hIndex(new int[] {1, 3, 1}) + " " + hIndex(new int[] {0, 0}));
    }
}
```

**Output:**

```text
3 1 0
```

**Complexity:** O(n) time, O(n) space.

</details>
