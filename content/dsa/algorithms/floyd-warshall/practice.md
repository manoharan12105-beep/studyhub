# Floyd–Warshall Algorithm — Practice

### P1. A student writes the loops in the order `for i, for j, for k`. What happens?

**Difficulty:** Easy · **Pattern:** Loop order of the DP

- A) Same results, just slower
- B) Some shortest paths are missed, because dist[i][k] and dist[k][j] may not be final when they are used
- C) It detects more negative cycles
- D) It becomes O(V²)

<details>
<summary>Hint</summary>

What does the state "shortest path using intermediates 0..k" require before vertex k is considered?

</details>

<details>
<summary>Answer</summary>

**Answer:** B) Some shortest paths are missed, because dist[i][k] and dist[k][j] may not be final when they are used

**Explanation:** With k innermost, `dist[i][j]` is finalised after looking at each k once, using partially computed values. A path needing two intermediate vertices discovered in a later (i, j) iteration is never combined. Time stays O(V³) — only correctness changes.

</details>

### P2. City with the fewest reachable cities

**Difficulty:** Medium · **Pattern:** All-pairs distances, then count

n cities are joined by undirected weighted roads. For each city, count the cities reachable with total distance ≤ `threshold`. Return the city with the smallest count; on ties, the one with the largest number.

**Constraints:** 2 ≤ n ≤ 100; weights ≤ 10⁴.

Example: n = 4, roads `[[0,1,3],[1,2,1],[1,3,4],[2,3,1]]`, threshold 4 → `3`.

<details>
<summary>Hint</summary>

n ≤ 100 means O(n³) = 10⁶ — Floyd–Warshall fits easily.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class FewestReachableCity {

    static int findTheCity(int n, int[][] roads, int threshold) {
        final int INF = 1_000_000_000;
        int[][] dist = new int[n][n];
        for (int[] row : dist) Arrays.fill(row, INF);
        for (int i = 0; i < n; i++) dist[i][i] = 0;
        for (int[] r : roads) {
            dist[r[0]][r[1]] = Math.min(dist[r[0]][r[1]], r[2]);
            dist[r[1]][r[0]] = Math.min(dist[r[1]][r[0]], r[2]);
        }
        for (int k = 0; k < n; k++)
            for (int i = 0; i < n; i++)
                for (int j = 0; j < n; j++)
                    if (dist[i][k] + dist[k][j] < dist[i][j]) dist[i][j] = dist[i][k] + dist[k][j];   // INF + INF fits in int
        int bestCity = -1, bestCount = Integer.MAX_VALUE;
        for (int i = 0; i < n; i++) {
            int count = 0;
            for (int j = 0; j < n; j++) if (i != j && dist[i][j] <= threshold) count++;
            if (count <= bestCount) {                 // <= : later (larger) city wins ties
                bestCount = count;
                bestCity = i;
            }
        }
        return bestCity;
    }

    public static void main(String[] args) {
        System.out.println(findTheCity(4, new int[][] {{0, 1, 3}, {1, 2, 1}, {1, 3, 4}, {2, 3, 1}}, 4) + " "
                + findTheCity(5, new int[][] {{0, 1, 2}, {0, 4, 8}, {1, 2, 3}, {1, 4, 2}, {2, 3, 1}, {3, 4, 1}}, 2));
    }
}
```

**Output:**

```text
3 0
```

**Complexity:** O(n³) time, O(n²) space. (INF = 10⁹ so that INF + INF = 2 × 10⁹ still fits below `Integer.MAX_VALUE` ≈ 2.147 × 10⁹.)

</details>
