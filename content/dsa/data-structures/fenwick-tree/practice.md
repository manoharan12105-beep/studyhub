# Fenwick Tree (Binary Indexed Tree) — Practice

### P1. Mutable range sum

**Difficulty:** Medium · **Pattern:** Fenwick tree with "set" via delta

Support `update(index, value)` (set, 0-indexed) and `sumRange(left, right)` on an integer array, both in O(log n).

**Constraints:** 1 ≤ n ≤ 3 × 10⁴; up to 3 × 10⁴ calls.

Example: `[1, 3, 5]`: sumRange(0, 2) = 9; update(1, 2); sumRange(0, 2) = 8.

<details>
<summary>Hint</summary>

A BIT supports "add delta". Setting a value is adding `value − current`, so keep a copy of the current values.

</details>

<details>
<summary>Answer</summary>

```java
public class NumArray {

    private final long[] tree;
    private final int[] values;

    NumArray(int[] nums) {
        values = nums.clone();
        tree = new long[nums.length + 1];
        for (int i = 0; i < nums.length; i++) add(i + 1, nums[i]);
    }

    private void add(int i, long delta) {
        for (; i < tree.length; i += i & -i) tree[i] += delta;
    }

    private long prefix(int i) {
        long s = 0;
        for (; i > 0; i -= i & -i) s += tree[i];
        return s;
    }

    void update(int index, int value) {
        add(index + 1, value - values[index]);
        values[index] = value;
    }

    long sumRange(int left, int right) {
        return prefix(right + 1) - prefix(left);
    }

    public static void main(String[] args) {
        NumArray na = new NumArray(new int[] {1, 3, 5});
        System.out.print(na.sumRange(0, 2) + " ");
        na.update(1, 2);
        System.out.println(na.sumRange(0, 2) + " " + na.sumRange(1, 1));
    }
}
```

**Output:**

```text
9 8 2
```

**Complexity:** O(n log n) construction (as written), O(log n) per call, O(n) space.

</details>

### P2. Range additions, then point values

**Difficulty:** Medium · **Pattern:** Difference array in a BIT

Start with n zeros. Process operations of two kinds online: "add v to every index in [l, r]" and "what is the value at index i?". Both in O(log n).

**Constraints:** 1 ≤ n, q ≤ 10⁵.

Example: n = 5; add(1, 3, 4); get(2) = 4; add(0, 1, 1); get(1) = 5; get(4) = 0.

<details>
<summary>Hint</summary>

Store differences: a range add becomes two point adds; the value at i is a prefix sum of differences.

</details>

<details>
<summary>Answer</summary>

```java
public class RangeAddPointQuery {

    private final long[] tree;

    RangeAddPointQuery(int n) {
        tree = new long[n + 2];                      // index r + 2 may be touched for r = n − 1
    }

    private void add(int i, long delta) {
        for (; i < tree.length; i += i & -i) tree[i] += delta;
    }

    void rangeAdd(int l, int r, long v) {            // 0-indexed, inclusive
        add(l + 1, v);
        add(r + 2, -v);
    }

    long get(int i) {
        long s = 0;
        for (int j = i + 1; j > 0; j -= j & -j) s += tree[j];
        return s;
    }

    public static void main(String[] args) {
        RangeAddPointQuery t = new RangeAddPointQuery(5);
        t.rangeAdd(1, 3, 4);
        System.out.print(t.get(2) + " ");
        t.rangeAdd(0, 1, 1);
        System.out.println(t.get(1) + " " + t.get(4) + " " + t.get(0));
    }
}
```

**Output:**

```text
4 5 0 1
```

**Complexity:** O(log n) per operation, O(n) space. If all updates come before all queries, a plain [Difference Array](../../patterns/difference-array/content.md) does it in O(1) per update and O(n) once.

</details>

### P3. Count of smaller numbers after self

**Difficulty:** Hard · **Pattern:** BIT over compressed values, scanning right to left

For each index i, count how many elements to the right of i are strictly smaller than `nums[i]`.

**Constraints:** 1 ≤ n ≤ 10⁵; −10⁴ ≤ nums[i] ≤ 10⁴.

Example: `[5, 2, 6, 1]` → `[2, 1, 1, 0]`.

<details>
<summary>Hint</summary>

Scan from the right, inserting each value into a BIT of counts. Before inserting nums[i], the number of smaller values already inserted is `prefixSum(rank(nums[i]) − 1)`.

</details>

<details>
<summary>Answer</summary>

**Approach:** Brute force is O(n²). Compress values to ranks 1..m (sort the distinct values), then a BIT over ranks counts how many inserted values fall below a rank in O(log m).

```java
import java.util.*;

public class CountSmallerAfterSelf {

    static List<Integer> countSmaller(int[] nums) {
        int[] distinct = Arrays.stream(nums).distinct().sorted().toArray();
        int m = distinct.length;
        int[] tree = new int[m + 1];
        Integer[] result = new Integer[nums.length];
        for (int i = nums.length - 1; i >= 0; i--) {
            int rank = Arrays.binarySearch(distinct, nums[i]) + 1;   // 1..m
            int smaller = 0;
            for (int j = rank - 1; j > 0; j -= j & -j) smaller += tree[j];
            result[i] = smaller;
            for (int j = rank; j <= m; j += j & -j) tree[j]++;
        }
        return Arrays.asList(result);
    }

    public static void main(String[] args) {
        System.out.println(countSmaller(new int[] {5, 2, 6, 1}));
        System.out.println(countSmaller(new int[] {-1, -1}));
    }
}
```

**Output:**

```text
[2, 1, 1, 0]
[0, 0]
```

**Complexity:** O(n log n) time (sorting + n BIT operations), O(n) space. A merge-sort-based solution has the same complexity.

</details>
