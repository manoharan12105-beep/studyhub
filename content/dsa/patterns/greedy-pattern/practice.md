# Greedy Pattern — Practice

### P1. Lemonade change

**Difficulty:** Easy · **Pattern:** Greedy with the largest usable note first

Lemonade costs 5. Customers pay in order with a 5, 10 or 20 note; you start with no change. Return whether you can give every customer correct change.

**Constraints:** 1 ≤ n ≤ 10⁵.

Example: `[5, 5, 5, 10, 20]` → `true`; `[5, 5, 10, 10, 20]` → `false`.

<details>
<summary>Hint</summary>

For a 20, giving 10 + 5 is never worse than 5 + 5 + 5: fives are more flexible (they serve both 10s and 20s), so keep them when you can.

</details>

<details>
<summary>Answer</summary>

```java
public class LemonadeChange {

    static boolean lemonadeChange(int[] bills) {
        int fives = 0, tens = 0;
        for (int b : bills) {
            if (b == 5) fives++;
            else if (b == 10) {
                if (fives == 0) return false;
                fives--;
                tens++;
            } else if (tens > 0 && fives > 0) {        // prefer 10 + 5: saves fives
                tens--;
                fives--;
            } else if (fives >= 3) {
                fives -= 3;
            } else {
                return false;
            }
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.println(lemonadeChange(new int[] {5, 5, 5, 10, 20}) + " " + lemonadeChange(new int[] {5, 5, 10, 10, 20}));
    }
}
```

**Output:**

```text
true false
```

**Complexity:** O(n) time, O(1) space. Exchange argument: any successful plan that used 5 + 5 + 5 when a 10 was available can swap to 10 + 5 and keep at least as many fives.

</details>

### P2. Reconstruct a queue by height

**Difficulty:** Medium · **Pattern:** Sort by a compound key, then insert by index

People are given as `[h, k]`: height h and the number of people in front who are at least as tall. Reconstruct the queue.

**Constraints:** 1 ≤ n ≤ 2000.

Example: `[[7, 0], [4, 4], [7, 1], [5, 0], [6, 1], [5, 2]]` → `[[5, 0], [7, 0], [5, 2], [6, 1], [4, 4], [7, 1]]`.

<details>
<summary>Hint</summary>

Process people from tallest to shortest (ties: smaller k first). When a person is processed, everyone already placed is at least as tall, and shorter people inserted later do not affect their k. So insert each person at index k.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class QueueReconstruction {

    static int[][] reconstructQueue(int[][] people) {
        int[][] sorted = people.clone();
        Arrays.sort(sorted, (a, b) -> a[0] != b[0] ? Integer.compare(b[0], a[0]) : Integer.compare(a[1], b[1]));
        List<int[]> queue = new ArrayList<>();
        for (int[] p : sorted) queue.add(p[1], p);     // exactly k taller-or-equal people are ahead
        return queue.toArray(new int[0][]);
    }

    public static void main(String[] args) {
        System.out.println(Arrays.deepToString(reconstructQueue(new int[][] {{7, 0}, {4, 4}, {7, 1}, {5, 0}, {6, 1}, {5, 2}})));
    }
}
```

**Output:**

```text
[[5, 0], [7, 0], [5, 2], [6, 1], [4, 4], [7, 1]]
```

**Complexity:** O(n²) time (list insertions), O(n) space. A Fenwick tree over free positions brings it to O(n log² n) or O(n log n).

</details>

### P3. Minimum taps to water a garden

**Difficulty:** Hard · **Pattern:** Furthest reach (interval covering)

A garden spans [0, n]. Tap i at position i waters [i − ranges[i], i + ranges[i]]. Return the minimum number of taps to water the whole garden, or −1.

**Constraints:** 1 ≤ n ≤ 10⁴; 0 ≤ ranges[i] ≤ 100.

Example: n = 5, ranges `[3, 4, 1, 1, 0, 0]` → `1` (tap 1 covers [−3, 5]); n = 3, ranges `[0, 0, 0, 0]` → `-1`.

<details>
<summary>Hint</summary>

Convert taps to intervals. For each left point x, record the furthest right end reachable by a tap starting at or before x (`reach[left] = max(reach[left], right)`). Then sweep like jump game II: when you pass the current covered end, open the tap that extends coverage furthest.

</details>

<details>
<summary>Answer</summary>

**Approach:** Greedy choice: when the current coverage ends at `end`, among all taps starting at or before `end`, the one reaching furthest is never a worse choice — any other choice covers a subset of what it covers.

```java
public class MinTaps {

    static int minTaps(int n, int[] ranges) {
        int[] reach = new int[n + 1];                  // reach[x] = furthest right end of a tap starting at x
        for (int i = 0; i <= n; i++) {
            int left = Math.max(0, i - ranges[i]), right = Math.min(n, i + ranges[i]);
            reach[left] = Math.max(reach[left], right);
        }
        int taps = 0, end = 0, furthest = 0;
        for (int x = 0; x < n; x++) {
            furthest = Math.max(furthest, reach[x]);
            if (x == end) {                            // must open another tap to go past x
                if (furthest <= x) return -1;          // nothing extends beyond x
                taps++;
                end = furthest;
            }
        }
        return taps;
    }

    public static void main(String[] args) {
        System.out.println(minTaps(5, new int[] {3, 4, 1, 1, 0, 0}) + " " + minTaps(3, new int[] {0, 0, 0, 0}) + " " + minTaps(7, new int[] {1, 2, 1, 0, 2, 1, 0, 1}));
    }
}
```

**Output:**

```text
1 -1 3
```

**Complexity:** O(n + Σ) = O(n) time, O(n) space.

</details>
