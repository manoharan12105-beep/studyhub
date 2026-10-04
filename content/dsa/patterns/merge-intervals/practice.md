# Merge Intervals — Practice

### P1. Insert an interval

**Difficulty:** Medium · **Pattern:** Three phases over a sorted list

`intervals` is sorted by start and non-overlapping. Insert `newInterval`, merging where necessary, and return the result (still sorted and non-overlapping).

**Constraints:** 0 ≤ n ≤ 10⁴.

Example: `[[1, 3], [6, 9]]` + `[2, 5]` → `[[1, 5], [6, 9]]`; `[[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]]` + `[4, 8]` → `[[1, 2], [3, 10], [12, 16]]`.

<details>
<summary>Hint</summary>

Copy intervals ending before the new one starts; merge every interval that overlaps it (take min start, max end); copy the rest. No sorting needed — O(n).

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class InsertInterval {

    static int[][] insert(int[][] intervals, int[] add) {
        List<int[]> result = new ArrayList<>();
        int i = 0, n = intervals.length, start = add[0], end = add[1];
        while (i < n && intervals[i][1] < start) result.add(intervals[i++]);     // entirely before
        while (i < n && intervals[i][0] <= end) {                                // overlapping
            start = Math.min(start, intervals[i][0]);
            end = Math.max(end, intervals[i][1]);
            i++;
        }
        result.add(new int[] {start, end});
        while (i < n) result.add(intervals[i++]);                                // entirely after
        return result.toArray(new int[0][]);
    }

    public static void main(String[] args) {
        System.out.println(Arrays.deepToString(insert(new int[][] {{1, 3}, {6, 9}}, new int[] {2, 5})));
        System.out.println(Arrays.deepToString(insert(new int[][] {{1, 2}, {3, 5}, {6, 7}, {8, 10}, {12, 16}}, new int[] {4, 8})));
        System.out.println(Arrays.deepToString(insert(new int[][] {}, new int[] {5, 7})));
    }
}
```

**Output:**

```text
[[1, 5], [6, 9]]
[[1, 2], [3, 10], [12, 16]]
[[5, 7]]
```

**Complexity:** O(n) time, O(n) space for the output. Binary search can find the overlap range in O(log n), but building the output is O(n) anyway.

</details>

### P2. Intersections of two interval lists

**Difficulty:** Medium · **Pattern:** Two pointers over sorted interval lists

Each list is sorted and pairwise disjoint (closed intervals). Return all intersections between the two lists.

**Constraints:** 0 ≤ n, m ≤ 1000.

Example: A = `[[0, 2], [5, 10], [13, 23], [24, 25]]`, B = `[[1, 5], [8, 12], [15, 24], [25, 26]]` → `[[1, 2], [5, 5], [8, 10], [15, 23], [24, 24], [25, 25]]`.

<details>
<summary>Hint</summary>

The intersection of A[i] and B[j] is [max starts, min ends] when that is non-empty. Then advance the interval that ends first — it cannot intersect anything further in the other list.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class IntervalIntersections {

    static int[][] intervalIntersection(int[][] a, int[][] b) {
        List<int[]> result = new ArrayList<>();
        int i = 0, j = 0;
        while (i < a.length && j < b.length) {
            int lo = Math.max(a[i][0], b[j][0]), hi = Math.min(a[i][1], b[j][1]);
            if (lo <= hi) result.add(new int[] {lo, hi});
            if (a[i][1] < b[j][1]) i++;                 // a[i] ends first: done with it
            else j++;
        }
        return result.toArray(new int[0][]);
    }

    public static void main(String[] args) {
        int[][] a = {{0, 2}, {5, 10}, {13, 23}, {24, 25}}, b = {{1, 5}, {8, 12}, {15, 24}, {25, 26}};
        System.out.println(Arrays.deepToString(intervalIntersection(a, b)));
    }
}
```

**Output:**

```text
[[1, 2], [5, 5], [8, 10], [15, 23], [24, 24], [25, 25]]
```

**Complexity:** O(n + m) time, O(n + m) space for the output.

</details>

### P3. Common free time of all employees

**Difficulty:** Hard · **Pattern:** Merge everything, then read the gaps

Each employee has a sorted list of non-overlapping busy intervals. Return the finite intervals of positive length during which **every** employee is free, sorted.

**Constraints:** 1 ≤ employees, total intervals ≤ 10⁴; 0 ≤ start < end ≤ 10⁸.

Example: `[[[1, 2], [5, 6]], [[1, 3]], [[4, 10]]]` → `[[3, 4]]`; `[[[1, 3], [6, 7]], [[2, 4]], [[2, 5], [9, 12]]]` → `[[5, 6], [7, 9]]`.

<details>
<summary>Hint</summary>

Common free time = gaps in the **union** of all busy intervals. Flatten, sort by start, sweep keeping the furthest end so far; whenever the next start is beyond that end, the gap between them is free.

</details>

<details>
<summary>Answer</summary>

**Approach:** A min-heap merging the k sorted lists gives O(N log k); flattening and sorting gives O(N log N) and is simpler to write.

```java
import java.util.*;

public class EmployeeFreeTime {

    static List<int[]> freeTime(int[][][] schedule) {
        List<int[]> all = new ArrayList<>();
        for (int[][] employee : schedule) all.addAll(Arrays.asList(employee));
        all.sort(Comparator.comparingInt(iv -> iv[0]));
        List<int[]> free = new ArrayList<>();
        int end = all.get(0)[1];
        for (int[] iv : all) {
            if (iv[0] > end) free.add(new int[] {end, iv[0]});   // strict: touching blocks leave no gap
            end = Math.max(end, iv[1]);
        }
        return free;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.deepToString(freeTime(new int[][][] {{{1, 2}, {5, 6}}, {{1, 3}}, {{4, 10}}}).toArray()));
        System.out.println(Arrays.deepToString(freeTime(new int[][][] {{{1, 3}, {6, 7}}, {{2, 4}}, {{2, 5}, {9, 12}}}).toArray()));
    }
}
```

**Output:**

```text
[[3, 4]]
[[5, 6], [7, 9]]
```

**Complexity:** O(N log N) time for N intervals in total, O(N) space.

</details>
