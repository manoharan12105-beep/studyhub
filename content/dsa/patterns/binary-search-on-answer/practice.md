# Binary Search on Answer — Practice

### P1. Minimum days to make bouquets

**Difficulty:** Medium · **Pattern:** Minimise a day count with a greedy check

Flower i blooms on day `bloomDay[i]`. A bouquet needs k **adjacent** bloomed flowers, and each flower is used at most once. Return the minimum day on which m bouquets can be made, or −1.

**Constraints:** 1 ≤ n ≤ 10⁵; 1 ≤ bloomDay[i] ≤ 10⁹; 1 ≤ m, k ≤ 10⁶.

Example: `[1, 10, 3, 10, 2]`, m = 3, k = 1 → `3`; m = 3, k = 2 → `-1`; `[7, 7, 7, 7, 12, 7, 7]`, m = 2, k = 3 → `12`.

<details>
<summary>Hint</summary>

If m × k > n it is impossible. Otherwise, waiting longer never hurts: feasible(day) = greedily count runs of bloomed flowers, taking a bouquet every k in a row.

</details>

<details>
<summary>Answer</summary>

```java
public class MinDaysBouquets {

    static boolean feasible(int[] bloom, int m, int k, int day) {
        int bouquets = 0, run = 0;
        for (int b : bloom) {
            run = b <= day ? run + 1 : 0;              // adjacency broken by an unbloomed flower
            if (run == k) {
                bouquets++;
                run = 0;
            }
        }
        return bouquets >= m;
    }

    static int minDays(int[] bloom, int m, int k) {
        if ((long) m * k > bloom.length) return -1;
        int lo = Integer.MAX_VALUE, hi = 0;
        for (int b : bloom) {
            lo = Math.min(lo, b);
            hi = Math.max(hi, b);                      // by the last bloom day everything is open
        }
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (feasible(bloom, m, k, mid)) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    public static void main(String[] args) {
        System.out.println(minDays(new int[] {1, 10, 3, 10, 2}, 3, 1) + " " + minDays(new int[] {1, 10, 3, 10, 2}, 3, 2) + " " + minDays(new int[] {7, 7, 7, 7, 12, 7, 7}, 2, 3));
    }
}
```

**Output:**

```text
3 -1 12
```

**Complexity:** O(n log D) time with D = max bloom day, O(1) space. Note `(long) m * k`: 10⁶ × 10⁶ overflows `int`.

</details>

### P2. Place balls as far apart as possible

**Difficulty:** Medium · **Pattern:** Maximise the minimum gap

Baskets stand at distinct positions on a line. Place m balls in baskets so that the minimum distance between any two balls is as large as possible; return that distance.

**Constraints:** 2 ≤ m ≤ n ≤ 10⁵; positions up to 10⁹.

Example: positions `[1, 2, 3, 4, 7]`, m = 3 → `3` (balls at 1, 4, 7).

<details>
<summary>Hint</summary>

Sort the positions. feasible(d) = place a ball in the first basket, then greedily in the next basket at least d away; can you place m? Larger d is harder, so the predicate is T…T F…F — search for the **last** true, rounding mid up.

</details>

<details>
<summary>Answer</summary>

**Approach:** Greedy placement is optimal for a fixed d: putting each ball as early as possible leaves the most room for the rest.

```java
import java.util.Arrays;

public class MaxMinGap {

    static boolean canPlace(int[] pos, int m, int d) {
        int placed = 1, last = pos[0];
        for (int i = 1; i < pos.length && placed < m; i++) {
            if (pos[i] - last >= d) {
                placed++;
                last = pos[i];
            }
        }
        return placed >= m;
    }

    static int maxDistance(int[] pos, int m) {
        Arrays.sort(pos);
        int lo = 1, hi = (pos[pos.length - 1] - pos[0]) / (m - 1);   // the gaps cannot all exceed the average
        while (lo < hi) {
            int mid = lo + (hi - lo + 1) / 2;          // round up: searching for the last feasible d
            if (canPlace(pos, m, mid)) lo = mid;
            else hi = mid - 1;
        }
        return lo;
    }

    public static void main(String[] args) {
        System.out.println(maxDistance(new int[] {1, 2, 3, 4, 7}, 3) + " " + maxDistance(new int[] {5, 4, 3, 2, 1, 1_000_000_000}, 2));
    }
}
```

**Output:**

```text
3 999999999
```

**Complexity:** O(n log n + n log R) time (sort + checks), O(1) extra space besides sorting.

</details>

### P3. Split an array to minimise the largest sum

**Difficulty:** Hard · **Pattern:** Minimise the maximum part sum

Split the array into k non-empty contiguous parts so that the largest part sum is as small as possible. Return that sum.

**Constraints:** 1 ≤ n ≤ 1000; 0 ≤ values ≤ 10⁶; 1 ≤ k ≤ min(50, n).

Example: `[7, 2, 5, 10, 8]`, k = 2 → `18` ([7, 2, 5] and [10, 8]); `[1, 2, 3, 4, 5]`, k = 2 → `9`.

<details>
<summary>Hint</summary>

feasible(S) = greedily extend the current part while its sum stays ≤ S; count parts. If at most k parts are needed, S works (parts can be split further to reach exactly k, since each split never increases the maximum). Range: [max element, total sum].

</details>

<details>
<summary>Answer</summary>

**Approach:** The DP over (prefix, parts) is O(k × n²); binary search on the answer is O(n log(sum)).

```java
public class SplitArrayLargestSum {

    static int partsNeeded(int[] a, long limit) {
        int parts = 1;
        long sum = 0;
        for (int v : a) {
            if (sum + v > limit) {
                parts++;
                sum = 0;
            }
            sum += v;
        }
        return parts;
    }

    static long splitArray(int[] a, int k) {
        long lo = 0, hi = 0;
        for (int v : a) {
            lo = Math.max(lo, v);
            hi += v;
        }
        while (lo < hi) {
            long mid = lo + (hi - lo) / 2;
            if (partsNeeded(a, mid) <= k) hi = mid;    // at most k parts: limit is achievable
            else lo = mid + 1;
        }
        return lo;
    }

    public static void main(String[] args) {
        System.out.println(splitArray(new int[] {7, 2, 5, 10, 8}, 2) + " " + splitArray(new int[] {1, 2, 3, 4, 5}, 2) + " " + splitArray(new int[] {1, 4, 4}, 3));
    }
}
```

**Output:**

```text
18 9 4
```

**Complexity:** O(n log(sum)) time, O(1) space.

</details>
