# Binary Search Pattern — Practice

### P1. Count negatives in a sorted matrix

**Difficulty:** Easy · **Pattern:** Boundary search per row

Every row and every column of the matrix is sorted in non-increasing order. Count the negative numbers.

**Constraints:** 1 ≤ rows, cols ≤ 100.

Example: `[[4, 3, 2, -1], [3, 2, 1, -1], [1, 1, -1, -2], [-1, -1, -2, -3]]` → `8`.

<details>
<summary>Hint</summary>

In each row the predicate `value < 0` is F…F T…T. Binary search for the first negative; everything after it is negative.

</details>

<details>
<summary>Answer</summary>

```java
public class CountNegatives {

    static int countNegatives(int[][] grid) {
        int total = 0;
        for (int[] row : grid) {
            int lo = 0, hi = row.length;
            while (lo < hi) {                          // first index with row[i] < 0
                int mid = lo + (hi - lo) / 2;
                if (row[mid] < 0) hi = mid;
                else lo = mid + 1;
            }
            total += row.length - lo;
        }
        return total;
    }

    public static void main(String[] args) {
        System.out.println(countNegatives(new int[][] {{4, 3, 2, -1}, {3, 2, 1, -1}, {1, 1, -1, -2}, {-1, -1, -2, -3}}) + " " + countNegatives(new int[][] {{3, 2}, {1, 0}}));
    }
}
```

**Output:**

```text
8 0
```

**Complexity:** O(R log C) time, O(1) space. Using the column order too, a staircase walk from the bottom-left is O(R + C).

</details>

### P2. Time-based key-value store

**Difficulty:** Medium · **Pattern:** Floor search on timestamps

Design `set(key, value, timestamp)` and `get(key, timestamp)`; `get` returns the value set for `key` at the largest timestamp ≤ the given one, or `""`. Timestamps of `set` calls are strictly increasing.

**Constraints:** up to 2 × 10⁵ calls.

Example: set("foo", "bar", 1); get("foo", 1) → `"bar"`; get("foo", 3) → `"bar"`; set("foo", "bar2", 4); get("foo", 4) → `"bar2"`; get("foo", 5) → `"bar2"`.

<details>
<summary>Hint</summary>

Because timestamps arrive in increasing order, each key's list of (timestamp, value) is already sorted. `get` is "last timestamp ≤ t" = (first timestamp > t) − 1.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class TimeMap {

    private final Map<String, List<Integer>> times = new HashMap<>();
    private final Map<String, List<String>> values = new HashMap<>();

    void set(String key, String value, int timestamp) {
        times.computeIfAbsent(key, k -> new ArrayList<>()).add(timestamp);   // appended in sorted order
        values.computeIfAbsent(key, k -> new ArrayList<>()).add(value);
    }

    String get(String key, int timestamp) {
        List<Integer> t = times.get(key);
        if (t == null) return "";
        int lo = 0, hi = t.size();
        while (lo < hi) {                              // first index with time > timestamp
            int mid = lo + (hi - lo) / 2;
            if (t.get(mid) > timestamp) hi = mid;
            else lo = mid + 1;
        }
        return lo == 0 ? "" : values.get(key).get(lo - 1);
    }

    public static void main(String[] args) {
        TimeMap m = new TimeMap();
        m.set("foo", "bar", 1);
        System.out.print(m.get("foo", 1) + " " + m.get("foo", 3) + " ");
        m.set("foo", "bar2", 4);
        System.out.println(m.get("foo", 4) + " " + m.get("foo", 5) + " [" + m.get("foo", 0) + "]");
    }
}
```

**Output:**

```text
bar bar bar2 bar2 []
```

**Complexity:** `set` O(1) amortized, `get` O(log m) for m versions of the key; O(total calls) space. A `TreeMap<Integer, String>` per key with `floorEntry` also works in O(log m).

</details>

### P3. Find a value in a mountain array with few reads

**Difficulty:** Hard · **Pattern:** Three binary searches (peak, ascending side, descending side)

A mountain array strictly increases to a peak and then strictly decreases. You may only read it through `get(i)`, at most 100 times for n ≤ 10⁴. Return the **minimum** index holding `target`, or −1.

**Constraints:** 3 ≤ n ≤ 10⁴.

Example: `[1, 2, 3, 4, 5, 3, 1]`, target 3 → `2` (3 also appears at index 5); target 6 → `-1`.

<details>
<summary>Hint</summary>

1. Find the peak with the slope predicate `get(mid) < get(mid + 1)`. 2. Binary search the increasing part [0, peak]. 3. Only if not found, binary search the decreasing part with the comparison reversed. Each search uses about 2 log₂ n ≈ 28 reads at most.

</details>

<details>
<summary>Answer</summary>

```java
public class MountainArraySearch {

    static int reads = 0;

    static int get(int[] a, int i) {
        reads++;
        return a[i];
    }

    static int findInMountainArray(int target, int[] a) {
        int lo = 0, hi = a.length - 1;
        while (lo < hi) {                              // peak: first index where the slope goes down
            int mid = lo + (hi - lo) / 2;
            if (get(a, mid) < get(a, mid + 1)) lo = mid + 1;
            else hi = mid;
        }
        int peak = lo;
        int i = search(a, target, 0, peak, true);
        return i != -1 ? i : search(a, target, peak + 1, a.length - 1, false);
    }

    static int search(int[] a, int target, int lo, int hi, boolean ascending) {
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2, v = get(a, mid);
            if (v == target) return mid;
            if ((v < target) == ascending) lo = mid + 1;   // reverse the direction on the descending side
            else hi = mid - 1;
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] a = {1, 2, 3, 4, 5, 3, 1};
        System.out.print(findInMountainArray(3, a) + " " + findInMountainArray(6, a) + " " + findInMountainArray(1, new int[] {0, 5, 1}));
        reads = 0;
        int[] big = new int[10_000];
        for (int k = 0; k < 10_000; k++) big[k] = k < 6000 ? k : 12_000 - k;
        int idx = findInMountainArray(2_500, big);              // n = 10⁴: well under the 100-read budget
        System.out.println(" | big: index " + idx + " in " + reads + " reads");
    }
}
```

**Output:**

```text
2 -1 2 | big: index 2500 in 36 reads
```

**Complexity:** O(log n) reads and time, O(1) space.

</details>
