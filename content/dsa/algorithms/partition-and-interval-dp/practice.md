# Partition and Interval DP — Practice

### P1. Minimum score triangulation of a polygon

**Difficulty:** Medium · **Pattern:** Interval DP over polygon vertices

A convex polygon has vertices with values `v[0..n−1]` in order. Triangulate it; each triangle (i, j, k) scores v[i] × v[j] × v[k]. Return the minimum total score.

**Constraints:** 3 ≤ n ≤ 50.

Example: `[1, 2, 3]` → `6`; `[3, 7, 4, 5]` → `144`.

<details>
<summary>Hint</summary>

In any triangulation, edge (i, j) belongs to exactly one triangle (i, k, j) with i < k < j. That k splits the polygon into the parts (i..k) and (k..j).

</details>

<details>
<summary>Answer</summary>

```java
public class PolygonTriangulation {

    static int minScore(int[] v) {
        int n = v.length;
        int[][] dp = new int[n][n];                      // dp[i][j] = best for vertices i..j (0 if fewer than 3)
        for (int length = 3; length <= n; length++) {
            for (int i = 0; i + length - 1 < n; i++) {
                int j = i + length - 1;
                dp[i][j] = Integer.MAX_VALUE;
                for (int k = i + 1; k < j; k++) {        // third vertex of the triangle on edge (i, j)
                    dp[i][j] = Math.min(dp[i][j], dp[i][k] + dp[k][j] + v[i] * v[k] * v[j]);
                }
            }
        }
        return dp[0][n - 1];
    }

    public static void main(String[] args) {
        System.out.println(minScore(new int[] {1, 2, 3}) + " " + minScore(new int[] {3, 7, 4, 5}) + " " + minScore(new int[] {1, 3, 1, 4, 1, 5}));
    }
}
```

**Output:**

```text
6 144 13
```

**Complexity:** O(n³) time, O(n²) space.

</details>

### P2. Minimum cost to cut a stick

**Difficulty:** Hard · **Pattern:** Interval DP over sorted cut positions

A stick of length n must be cut at given positions (in any order). Each cut costs the current length of the piece being cut. Return the minimum total cost.

**Constraints:** 2 ≤ n ≤ 10⁶; 1 ≤ cuts ≤ 100.

Example: n = 7, cuts `[1, 3, 4, 5]` → `16`.

<details>
<summary>Hint</summary>

Add 0 and n to the cut list and sort it. `dp[i][j]` = minimum cost to make all cuts strictly between positions c[i] and c[j]; the **first** cut k in that piece costs c[j] − c[i] and splits it into (i, k) and (k, j).

</details>

<details>
<summary>Answer</summary>

**Approach:** The stick length n is huge, but only the cut positions matter — the state is over cut **indices** (≤ 102), not lengths.

```java
import java.util.Arrays;

public class CutStick {

    static int minCost(int n, int[] cuts) {
        int m = cuts.length + 2;
        int[] c = new int[m];
        c[0] = 0;
        c[m - 1] = n;
        for (int i = 0; i < cuts.length; i++) c[i + 1] = cuts[i];
        Arrays.sort(c);
        int[][] dp = new int[m][m];
        for (int gap = 2; gap < m; gap++) {                       // pieces containing at least one cut
            for (int i = 0; i + gap < m; i++) {
                int j = i + gap;
                dp[i][j] = Integer.MAX_VALUE;
                for (int k = i + 1; k < j; k++) {
                    dp[i][j] = Math.min(dp[i][j], dp[i][k] + dp[k][j] + c[j] - c[i]);
                }
            }
        }
        return dp[0][m - 1];
    }

    public static void main(String[] args) {
        System.out.println(minCost(7, new int[] {1, 3, 4, 5}) + " " + minCost(9, new int[] {5, 6, 1, 4, 2}));
    }
}
```

**Output:**

```text
16 22
```

**Complexity:** O(m³) for m = number of cuts + 2; O(m²) space.

</details>

### P3. Burst balloons

**Difficulty:** Hard · **Pattern:** Choose the last balloon in an interval

Bursting balloon i earns `nums[left] × nums[i] × nums[right]`, where left and right are its current neighbours (treat out-of-range neighbours as 1). Return the maximum coins from bursting all balloons.

**Constraints:** 1 ≤ n ≤ 300.

Example: `[3, 1, 5, 8]` → `167`.

<details>
<summary>Hint</summary>

Pad the array with 1 at both ends. `dp[i][j]` = best coins from bursting every balloon strictly between i and j. If k is burst **last** in that range, its neighbours at that moment are i and j: `dp[i][j] = max over k of dp[i][k] + dp[k][j] + a[i]·a[k]·a[j]`.

</details>

<details>
<summary>Answer</summary>

**Approach:** Choosing the first balloon fails because its removal changes neighbours on both sides. Choosing the last one makes the left and right parts independent.

```java
public class BurstBalloons {

    static int maxCoins(int[] nums) {
        int n = nums.length + 2;
        int[] a = new int[n];
        a[0] = 1;
        a[n - 1] = 1;
        for (int i = 0; i < nums.length; i++) a[i + 1] = nums[i];
        int[][] dp = new int[n][n];
        for (int gap = 2; gap < n; gap++) {
            for (int i = 0; i + gap < n; i++) {
                int j = i + gap;
                for (int k = i + 1; k < j; k++) {               // k is the last balloon burst in (i, j)
                    dp[i][j] = Math.max(dp[i][j], dp[i][k] + dp[k][j] + a[i] * a[k] * a[j]);
                }
            }
        }
        return dp[0][n - 1];
    }

    public static void main(String[] args) {
        System.out.println(maxCoins(new int[] {3, 1, 5, 8}) + " " + maxCoins(new int[] {1, 5}));
    }
}
```

**Output:**

```text
167 10
```

**Complexity:** O(n³) time, O(n²) space.

</details>
