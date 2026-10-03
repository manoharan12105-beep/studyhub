# Grid and 2D Dynamic Programming — Practice

### P1. Unique paths with obstacles

**Difficulty:** Medium · **Pattern:** Counting grid DP with blocked cells

Count the paths from the top-left to the bottom-right moving only right or down, where 1 marks an obstacle.

**Constraints:** 1 ≤ r, c ≤ 100; the answer fits in `int`.

Example: `[[0,0,0],[0,1,0],[0,0,0]]` → `2`.

<details>
<summary>Hint</summary>

An obstacle cell has 0 paths. With a single row array, the first cell of each row keeps its value from above unless it is blocked.

</details>

<details>
<summary>Answer</summary>

```java
public class UniquePathsObstacles {

    static int paths(int[][] grid) {
        int cols = grid[0].length;
        int[] row = new int[cols];
        row[0] = grid[0][0] == 1 ? 0 : 1;
        for (int[] cells : grid) {
            for (int c = 0; c < cols; c++) {
                if (cells[c] == 1) row[c] = 0;                // blocked: no paths through here
                else if (c > 0) row[c] += row[c - 1];         // above (old value) + left
            }
        }
        return row[cols - 1];
    }

    public static void main(String[] args) {
        System.out.println(paths(new int[][] {{0, 0, 0}, {0, 1, 0}, {0, 0, 0}}) + " " + paths(new int[][] {{0, 1}, {0, 0}}) + " " + paths(new int[][] {{1}}));
    }
}
```

**Output:**

```text
2 1 0
```

**Complexity:** O(r × c) time, O(c) space.

</details>

### P2. Triangle minimum path

**Difficulty:** Medium · **Pattern:** Bottom-up from the last row

From the top of a triangle, move to an adjacent number on the row below (index i → i or i + 1). Return the minimum path sum to the bottom.

**Constraints:** 1 ≤ rows ≤ 200.

Example: `[[2],[3,4],[6,5,7],[4,1,8,3]]` → `11` (2 + 3 + 5 + 1).

<details>
<summary>Hint</summary>

Going top-down gives many possible end positions. Going bottom-up, every cell has exactly two children: `dp[i] = tri[r][i] + min(dp[i], dp[i + 1])`.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class TriangleMinPath {

    static int minimumTotal(List<List<Integer>> tri) {
        int n = tri.size();
        int[] dp = new int[n + 1];                         // row below the last row: zeros
        for (int r = n - 1; r >= 0; r--) {
            for (int i = 0; i <= r; i++) {
                dp[i] = tri.get(r).get(i) + Math.min(dp[i], dp[i + 1]);   // left to right is safe: dp[i+1] not yet overwritten
            }
        }
        return dp[0];
    }

    public static void main(String[] args) {
        System.out.println(minimumTotal(List.of(List.of(2), List.of(3, 4), List.of(6, 5, 7), List.of(4, 1, 8, 3))) + " " + minimumTotal(List.of(List.of(-10))));
    }
}
```

**Output:**

```text
11 -10
```

**Complexity:** O(n²) time (number of cells), O(n) space.

</details>

### P3. Dungeon game

**Difficulty:** Hard · **Pattern:** DP from the destination backwards

A knight starts at the top-left and must reach the princess at the bottom-right, moving right or down. Each cell adds (positive) or removes (negative) health; health must stay ≥ 1 at all times. Return the minimum initial health.

**Constraints:** 1 ≤ r, c ≤ 200; values in [−1000, 1000].

Example: `[[-2,-3,3],[-5,-10,1],[10,30,-5]]` → `7`.

<details>
<summary>Hint</summary>

Forward DP fails: the best path so far may be ruined later. Define `need[r][c]` = minimum health required **on entering** (r, c) to survive to the end: `need = max(1, min(needRight, needDown) − cell)`.

</details>

<details>
<summary>Answer</summary>

**Approach:** The requirement at a cell depends on the cells **after** it, so fill from the bottom-right. A large positive cell can make the requirement drop to 1, never lower.

```java
import java.util.Arrays;

public class DungeonGame {

    static int minimumHealth(int[][] d) {
        int rows = d.length, cols = d[0].length;
        int[] need = new int[cols + 1];
        Arrays.fill(need, Integer.MAX_VALUE);
        need[cols - 1] = 1;                                // virtual cell after the princess
        for (int r = rows - 1; r >= 0; r--) {
            for (int c = cols - 1; c >= 0; c--) {
                int next = Math.min(need[c], need[c + 1]);    // below (old need[c]) or right
                need[c] = Math.max(1, next - d[r][c]);
            }
        }
        return need[0];
    }

    public static void main(String[] args) {
        System.out.println(minimumHealth(new int[][] {{-2, -3, 3}, {-5, -10, 1}, {10, 30, -5}}) + " " + minimumHealth(new int[][] {{0}}) + " " + minimumHealth(new int[][] {{100}}));
    }
}
```

**Output:**

```text
7 1 1
```

**Complexity:** O(r × c) time, O(c) space.

</details>
