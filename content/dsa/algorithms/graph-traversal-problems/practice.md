# Graph Traversal Problems — Practice

### P1. Number of provinces

**Difficulty:** Medium · **Pattern:** Components from an adjacency matrix

`connected[i][j] = 1` if cities i and j are directly connected. A province is a group of directly or indirectly connected cities. Return the number of provinces.

**Constraints:** 1 ≤ n ≤ 200.

Example: `[[1,1,0],[1,1,0],[0,0,1]]` → `2`.

<details>
<summary>Hint</summary>

The matrix is the graph. Start a DFS from each unvisited city; scanning a row lists its neighbours.

</details>

<details>
<summary>Answer</summary>

```java
public class Provinces {

    static int findCircleNum(int[][] connected) {
        int n = connected.length, provinces = 0;
        boolean[] visited = new boolean[n];
        for (int city = 0; city < n; city++) {
            if (!visited[city]) {
                provinces++;
                dfs(connected, city, visited);
            }
        }
        return provinces;
    }

    private static void dfs(int[][] m, int city, boolean[] visited) {
        visited[city] = true;
        for (int other = 0; other < m.length; other++) {
            if (m[city][other] == 1 && !visited[other]) dfs(m, other, visited);
        }
    }

    public static void main(String[] args) {
        System.out.println(findCircleNum(new int[][] {{1, 1, 0}, {1, 1, 0}, {0, 0, 1}}) + " " + findCircleNum(new int[][] {{1, 0, 0}, {0, 1, 0}, {0, 0, 1}}));
    }
}
```

**Output:**

```text
2 3
```

**Complexity:** O(n²) time (adjacency matrix), O(n) space.

</details>

### P2. Max area of island

**Difficulty:** Medium · **Pattern:** DFS returning a size

Return the area (number of cells) of the largest island of 1s (4-directional), or 0 if there is none.

**Constraints:** 1 ≤ r, c ≤ 50.

<details>
<summary>Hint</summary>

Make the sinking DFS return how many cells it sank.

</details>

<details>
<summary>Answer</summary>

```java
public class MaxIslandArea {

    static int maxArea(int[][] grid) {
        int best = 0;
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[0].length; c++) {
                if (grid[r][c] == 1) best = Math.max(best, area(grid, r, c));
            }
        }
        return best;
    }

    private static int area(int[][] g, int r, int c) {
        if (r < 0 || r >= g.length || c < 0 || c >= g[0].length || g[r][c] != 1) return 0;
        g[r][c] = 0;
        return 1 + area(g, r + 1, c) + area(g, r - 1, c) + area(g, r, c + 1) + area(g, r, c - 1);
    }

    public static void main(String[] args) {
        int[][] grid = {
            {0, 0, 1, 0, 0},
            {1, 1, 1, 0, 0},
            {0, 0, 0, 1, 1},
            {0, 0, 0, 1, 0}};
        System.out.println(maxArea(grid) + " " + maxArea(new int[][] {{0, 0}}));
    }
}
```

**Output:**

```text
4 0
```

**Complexity:** O(r × c) time and recursion space.

</details>

### P3. Surrounded regions

**Difficulty:** Medium · **Pattern:** Flood from the border, flip the rest

Capture every region of 'O' that is completely surrounded by 'X' (flip it to 'X'). Regions touching the border are not captured.

**Constraints:** 1 ≤ r, c ≤ 200.

Example:
```text
X X X X        X X X X
X O O X   →    X X X X
X X O X        X X X X
X O X X        X O X X
```

<details>
<summary>Hint</summary>

Checking each region for border contact is awkward. Instead, flood from every border 'O' and mark it safe; afterwards, every unmarked 'O' is captured.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class SurroundedRegions {

    static void solve(char[][] b) {
        int rows = b.length, cols = b[0].length;
        for (int r = 0; r < rows; r++) {
            mark(b, r, 0);
            mark(b, r, cols - 1);
        }
        for (int c = 0; c < cols; c++) {
            mark(b, 0, c);
            mark(b, rows - 1, c);
        }
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (b[r][c] == 'O') b[r][c] = 'X';        // not reachable from the border: captured
                else if (b[r][c] == 'S') b[r][c] = 'O';   // safe: restore
            }
        }
    }

    private static void mark(char[][] b, int r, int c) {
        if (r < 0 || r >= b.length || c < 0 || c >= b[0].length || b[r][c] != 'O') return;
        b[r][c] = 'S';
        mark(b, r + 1, c);
        mark(b, r - 1, c);
        mark(b, r, c + 1);
        mark(b, r, c - 1);
    }

    public static void main(String[] args) {
        char[][] board = {"XXXX".toCharArray(), "XOOX".toCharArray(), "XXOX".toCharArray(), "XOXX".toCharArray()};
        solve(board);
        for (char[] row : board) System.out.println(new String(row));
    }
}
```

**Output:**

```text
XXXX
XXXX
XXXX
XOXX
```

**Complexity:** O(r × c) time and space.

</details>

### P4. Pacific–Atlantic water flow

**Difficulty:** Medium · **Pattern:** Two multi-source traversals, intersected

Water flows from a cell to a 4-neighbour with height ≤ its own. The Pacific touches the top and left edges, the Atlantic the bottom and right. Return all cells from which water can reach both oceans.

**Constraints:** 1 ≤ r, c ≤ 200.

Example: heights `[[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]` → `[[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]`.

<details>
<summary>Hint</summary>

Simulating from every cell is O((r × c)²). Reverse the flow: from each ocean's edge, climb to neighbours with height ≥ current. Cells reached from both oceans are the answer.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class PacificAtlantic {

    static List<List<Integer>> flow(int[][] h) {
        int rows = h.length, cols = h[0].length;
        boolean[][] pacific = new boolean[rows][cols], atlantic = new boolean[rows][cols];
        for (int r = 0; r < rows; r++) {
            climb(h, r, 0, pacific, Integer.MIN_VALUE);
            climb(h, r, cols - 1, atlantic, Integer.MIN_VALUE);
        }
        for (int c = 0; c < cols; c++) {
            climb(h, 0, c, pacific, Integer.MIN_VALUE);
            climb(h, rows - 1, c, atlantic, Integer.MIN_VALUE);
        }
        List<List<Integer>> result = new ArrayList<>();
        for (int r = 0; r < rows; r++)
            for (int c = 0; c < cols; c++)
                if (pacific[r][c] && atlantic[r][c]) result.add(List.of(r, c));
        return result;
    }

    // Reverse flow: move only to cells at least as high as the previous one.
    private static void climb(int[][] h, int r, int c, boolean[][] reached, int previous) {
        if (r < 0 || r >= h.length || c < 0 || c >= h[0].length || reached[r][c] || h[r][c] < previous) return;
        reached[r][c] = true;
        climb(h, r + 1, c, reached, h[r][c]);
        climb(h, r - 1, c, reached, h[r][c]);
        climb(h, r, c + 1, reached, h[r][c]);
        climb(h, r, c - 1, reached, h[r][c]);
    }

    public static void main(String[] args) {
        int[][] h = {{1, 2, 2, 3, 5}, {3, 2, 3, 4, 4}, {2, 4, 5, 3, 1}, {6, 7, 1, 4, 5}, {5, 1, 1, 2, 4}};
        System.out.println(flow(h));
    }
}
```

**Output:**

```text
[[0, 4], [1, 3], [1, 4], [2, 2], [3, 0], [3, 1], [4, 0]]
```

**Complexity:** O(r × c) time and space — each cell is reached at most once per ocean.

</details>

### P5. Making a large island

**Difficulty:** Hard · **Pattern:** Label components, then combine around each water cell

You may change at most one 0 to 1. Return the size of the largest island possible.

**Constraints:** 1 ≤ n ≤ 500 (n × n grid).

Example: `[[1,0],[0,1]]` → `3`; `[[1,1],[1,0]]` → `4`; `[[1,1],[1,1]]` → `4`.

<details>
<summary>Hint</summary>

Flipping each 0 and recomputing is O(n⁴). Instead, label every island with an id and record its size once. For each 0, sum the sizes of the **distinct** island ids around it, plus 1.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class LargestIsland {

    static final int[][] DIRS = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

    static int largestIsland(int[][] grid) {
        int n = grid.length;
        Map<Integer, Integer> size = new HashMap<>();
        int id = 2;                                         // 0 and 1 are taken
        for (int r = 0; r < n; r++)
            for (int c = 0; c < n; c++)
                if (grid[r][c] == 1) size.put(id, paint(grid, r, c, id++));
        int best = size.values().stream().max(Integer::compare).orElse(0);
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                if (grid[r][c] != 0) continue;
                Set<Integer> touching = new HashSet<>();
                for (int[] d : DIRS) {
                    int nr = r + d[0], nc = c + d[1];
                    if (nr >= 0 && nr < n && nc >= 0 && nc < n && grid[nr][nc] > 1) touching.add(grid[nr][nc]);
                }
                int total = 1;
                for (int island : touching) total += size.get(island);
                best = Math.max(best, total);
            }
        }
        return best;
    }

    private static int paint(int[][] g, int r, int c, int id) {
        if (r < 0 || r >= g.length || c < 0 || c >= g.length || g[r][c] != 1) return 0;
        g[r][c] = id;
        int area = 1;
        for (int[] d : DIRS) area += paint(g, r + d[0], c + d[1], id);
        return area;
    }

    public static void main(String[] args) {
        System.out.println(largestIsland(new int[][] {{1, 0}, {0, 1}}) + " " + largestIsland(new int[][] {{1, 1}, {1, 0}}) + " " + largestIsland(new int[][] {{1, 1}, {1, 1}}));
    }
}
```

**Output:**

```text
3 4 4
```

**Complexity:** O(n²) time and space.

</details>
