# Euclidean GCD — Practice

### P1. GCD of two strings

**Difficulty:** Easy · **Pattern:** GCD of lengths

A string `x` divides `s` if `s` is `x` repeated some number of times. Return the longest `x` that divides both `s1` and `s2` (or `""`).

**Constraints:** 1 ≤ |s1|, |s2| ≤ 1000; uppercase letters.

Example: `"ABCABC"`, `"ABC"` → `"ABC"`; `"ABABAB"`, `"ABAB"` → `"AB"`; `"LEET"`, `"CODE"` → `""`.

<details>
<summary>Hint</summary>

If a common divisor exists, then `s1 + s2` equals `s2 + s1`. When it does, the answer is the prefix of length gcd(|s1|, |s2|).

</details>

<details>
<summary>Answer</summary>

**Approach:** If both strings are repetitions of the same block, concatenating in either order gives the same string; otherwise no divisor exists. The longest common block length must divide both lengths, and the largest such length is their gcd.

```java
public class GcdOfStrings {

    static int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }

    static String gcdOfStrings(String s1, String s2) {
        if (!(s1 + s2).equals(s2 + s1)) return "";
        return s1.substring(0, gcd(s1.length(), s2.length()));
    }

    public static void main(String[] args) {
        System.out.println(gcdOfStrings("ABCABC", "ABC") + " " + gcdOfStrings("ABABAB", "ABAB") + " [" + gcdOfStrings("LEET", "CODE") + "]");
    }
}
```

**Output:**

```text
ABC AB []
```

**Complexity:** O(|s1| + |s2|) time and space.

</details>

### P2. Water jug problem

**Difficulty:** Medium · **Pattern:** Bézout's identity

You have jugs of capacities x and y litres and unlimited water. You may fill a jug, empty a jug, or pour one into the other until one is empty or the other is full. Can you end with exactly `target` litres in total across both jugs?

**Constraints:** 1 ≤ x, y, target ≤ 10⁶.

Example: x = 3, y = 5, target = 4 → `true`; x = 2, y = 6, target = 5 → `false`.

<details>
<summary>Hint</summary>

Every reachable total is a combination a·x + b·y. By Bézout's identity those combinations are exactly the multiples of gcd(x, y). The total also cannot exceed x + y.

</details>

<details>
<summary>Answer</summary>

**Approach:** A BFS over (water in jug 1, water in jug 2) states also works but visits up to (x + 1)(y + 1) states. The number-theory condition answers in O(log min(x, y)).

```java
public class WaterJug {

    static int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }

    static boolean canMeasure(int x, int y, int target) {
        if (target > x + y) return false;              // both jugs together hold at most x + y
        return target % gcd(x, y) == 0;
    }

    public static void main(String[] args) {
        System.out.println(canMeasure(3, 5, 4) + " " + canMeasure(2, 6, 5) + " " + canMeasure(1, 2, 3) + " " + canMeasure(4, 6, 11));
    }
}
```

**Output:**

```text
true false true false
```

**Complexity:** O(log min(x, y)) time, O(1) space (iterative gcd) or O(log) recursion.

</details>

### P3. Maximum points on a line

**Difficulty:** Hard · **Pattern:** Slope normalised by GCD + hash map

Given n distinct points on a plane, return the maximum number that lie on one straight line.

**Constraints:** 1 ≤ n ≤ 300; coordinates −10⁴ … 10⁴.

Example: `[[1,1],[2,2],[3,3]]` → `3`; `[[1,1],[3,2],[5,3],[4,1],[2,3],[1,4]]` → `4`.

<details>
<summary>Hint</summary>

Fix each point as an anchor and group the other points by slope. Floating-point slopes are unreliable; store the slope as the reduced fraction (dy / g, dx / g) with g = gcd(|dx|, |dy|) and a fixed sign convention.

</details>

<details>
<summary>Answer</summary>

**Approach:** For anchor i, the points on the same line through i share the same reduced direction. Normalise the sign so that (−1, −2) and (1, 2) map to the same key. Checking every triple of points would be O(n³).

```java
import java.util.*;

public class MaxPointsOnLine {

    static int gcd(int a, int b) { return b == 0 ? a : gcd(b, a % b); }

    static int maxPoints(int[][] points) {
        int n = points.length, best = Math.min(n, 1);
        for (int i = 0; i < n; i++) {
            Map<String, Integer> slopes = new HashMap<>();
            for (int j = i + 1; j < n; j++) {
                int dx = points[j][0] - points[i][0], dy = points[j][1] - points[i][1];
                int g = gcd(Math.abs(dx), Math.abs(dy));
                dx /= g;
                dy /= g;
                if (dx < 0 || (dx == 0 && dy < 0)) {     // one sign convention per direction
                    dx = -dx;
                    dy = -dy;
                }
                int count = slopes.merge(dx + "/" + dy, 1, Integer::sum);
                best = Math.max(best, count + 1);        // + 1 for the anchor itself
            }
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(maxPoints(new int[][] {{1, 1}, {2, 2}, {3, 3}}) + " "
                + maxPoints(new int[][] {{1, 1}, {3, 2}, {5, 3}, {4, 1}, {2, 3}, {1, 4}}) + " " + maxPoints(new int[][] {{0, 0}}));
    }
}
```

**Output:**

```text
3 4 1
```

**Complexity:** O(n² log C) time (C = coordinate range, for the gcd), O(n) space per anchor. Vertical lines give (0, 1) and horizontal lines (1, 0) — no division by zero.

</details>
