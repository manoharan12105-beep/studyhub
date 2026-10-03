# Grid and 2D Dynamic Programming

## Definition

**Grid DP** solves problems on a 2D grid where each cell's answer depends on neighbouring cells already computed — usually the cell **above** and the cell to the **left** when movement is only right/down. The state is `dp[r][c]`; the table has r × c entries, so time is O(r × c) and space O(r × c), often compressible to one row, O(c). More generally, **2D DP** is any DP whose state has two indices.

## Why It Matters

Unique paths, minimum path sum, paths with obstacles, triangle paths, largest square of 1s, dungeon problems — these are among the most common DP interview questions, and they make the "fill the table in dependency order" idea visual. They also prepare you for two-sequence DP ([LCS](../subsequence-dp/content.md), [edit distance](../string-dp/content.md)), which uses the same 2D table shape.

## Prerequisites

- [Dynamic Programming](../dynamic-programming/content.md)
- [2D Arrays and Matrices](../../data-structures/matrices/content.md)

## Intuition

If a robot can move only right or down, the last step into cell (r, c) came either from above or from the left. So whatever you want to know about reaching (r, c) — how many ways, cheapest cost — follows from those two cells. Fill the grid row by row and every needed value is ready when you reach it.

## How It Works

### Unique paths (counting)

- State: `dp[r][c]` = number of paths from (0, 0) to (r, c).
- Transition: `dp[r][c] = dp[r − 1][c] + dp[r][c − 1]`.
- Base: first row and first column are 1 (only one straight path). With obstacles, an obstacle cell is 0 and blocks everything after it in the first row/column.

### Minimum path sum (optimising)

- State: `dp[r][c]` = minimum sum of a path from (0, 0) to (r, c).
- Transition: `dp[r][c] = grid[r][c] + min(dp[r − 1][c], dp[r][c − 1])`.
- Base: `dp[0][0] = grid[0][0]`; first row/column are prefix sums.

### Maximal square (shape DP)

- State: `dp[r][c]` = side of the largest all-1 square whose **bottom-right corner** is (r, c).
- Transition: if `grid[r][c] = 1`: `dp[r][c] = 1 + min(dp[r − 1][c], dp[r][c − 1], dp[r − 1][c − 1])`, else 0.
- Answer: (max over all cells)².
- Why: a square of side k ending at (r, c) needs squares of side k − 1 ending above, left and diagonally up-left.

### Space compression

Each row only reads the previous row (and cells to its left in the current row). Keep one array `row[c]`: before updating, `row[c]` still holds the value from above; `row[c − 1]` already holds the current row's left value. For the diagonal (maximal square) keep the old `row[c − 1]` in a variable before overwriting.

## Visual Explanation

```text
Minimum path sum                    dp (row by row)
grid:  1  3  1                      1   4   5
       1  5  1           →          2   7   6
       4  2  1                      6   8   7      answer 7: 1 → 3 → 1 → 1 → 1

each cell = its value + min(above, left)
dp[1][1] = 5 + min(dp[0][1]=4, dp[1][0]=2) = 7
dp[2][2] = 1 + min(dp[1][2]=6, dp[2][1]=8) = 7
```

## Pseudocode

```pseudocode
minPathSum(grid):
    for r from 0 to R − 1:
        for c from 0 to C − 1:
            if r = 0 and c = 0: dp[r][c] ← grid[0][0]
            else if r = 0: dp[r][c] ← dp[r][c−1] + grid[r][c]
            else if c = 0: dp[r][c] ← dp[r−1][c] + grid[r][c]
            else: dp[r][c] ← grid[r][c] + min(dp[r−1][c], dp[r][c−1])
    return dp[R−1][C−1]
```

## Java Implementation

```java
public class GridDp {

    static long uniquePaths(int rows, int cols) {
        long[][] dp = new long[rows][cols];
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (r == 0 || c == 0) dp[r][c] = 1;                  // single straight path
                else dp[r][c] = dp[r - 1][c] + dp[r][c - 1];         // from above + from the left
            }
        }
        return dp[rows - 1][cols - 1];
    }

    static int minPathSum(int[][] grid) {
        int cols = grid[0].length;
        int[] row = new int[cols];                                   // one row: O(cols) space
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < cols; c++) {
                if (r == 0 && c == 0) row[c] = grid[0][0];
                else if (r == 0) row[c] = row[c - 1] + grid[r][c];
                else if (c == 0) row[c] = row[c] + grid[r][c];       // row[c] still holds "above"
                else row[c] = grid[r][c] + Math.min(row[c], row[c - 1]);
            }
        }
        return row[cols - 1];
    }

    static int maximalSquare(char[][] grid) {
        int rows = grid.length, cols = grid[0].length, best = 0;
        int[][] dp = new int[rows + 1][cols + 1];                    // padded: no edge cases
        for (int r = 1; r <= rows; r++) {
            for (int c = 1; c <= cols; c++) {
                if (grid[r - 1][c - 1] == '1') {
                    dp[r][c] = 1 + Math.min(dp[r - 1][c - 1], Math.min(dp[r - 1][c], dp[r][c - 1]));
                    best = Math.max(best, dp[r][c]);
                }
            }
        }
        return best * best;
    }

    public static void main(String[] args) {
        System.out.println("unique paths 3x7 = " + uniquePaths(3, 7) + ", 10x10 = " + uniquePaths(10, 10));
        System.out.println("min path sum = " + minPathSum(new int[][] {{1, 3, 1}, {1, 5, 1}, {4, 2, 1}}));
        char[][] g = {"10100".toCharArray(), "10111".toCharArray(), "11111".toCharArray(), "10010".toCharArray()};
        System.out.println("maximal square area = " + maximalSquare(g));
    }
}
```

**Output:**

```text
unique paths 3x7 = 28, 10x10 = 48620
min path sum = 7
maximal square area = 4
```

## Dry Run

Maximal square on the 4 × 5 grid (padded dp shown without the zero row/column):

```text
grid          dp
1 0 1 0 0     1 0 1 0 0
1 0 1 1 1     1 0 1 1 1
1 1 1 1 1     1 1 1 2 2      dp[2][3] = 1 + min(up 1, left 1, diag 1) = 2
1 0 0 1 0     1 0 0 1 0
largest side 2 → area 4
```

## Complexity Analysis

| Problem | Time | Space |
|---------|------|-------|
| Unique paths | O(r × c) | O(r × c), or O(c) with one row |
| Minimum path sum | O(r × c) | O(c) as written |
| Maximal square | O(r × c) | O(r × c), or O(c) with a saved diagonal |

## Properties

- Valid fill order: row by row, left to right (any order where above/left come first).
- Movement restricted to right/down makes the dependency graph acyclic — a requirement for DP. If movement is in all four directions, the "DP" becomes a shortest-path problem (BFS/Dijkstra).

## Variations

- **Obstacles** — set blocked cells to 0 paths (or ∞ cost).
- **Triangle minimum path** — bottom-up: `dp[c] = tri[r][c] + min(dp[c], dp[c + 1])`.
- **Dungeon game** — fill from the bottom-right, because the requirement depends on the future.
- **Cherry pickup / two walkers** — state (step, r1, r2) for two paths at once.
- **Longest increasing path in a matrix** — DFS with memoization (moves in four directions, but strictly increasing values keep it acyclic).

## Comparison

| Movement | Technique |
|----------|-----------|
| Only right/down (acyclic) | grid DP, O(r × c) |
| Any direction, unit cost | BFS |
| Any direction, non-negative costs | Dijkstra |
| Any direction, strictly increasing values | memoized DFS |

## Edge Cases

- 1 × n or n × 1 grids; 1 × 1 grid.
- Start or end cell blocked.
- Counting overflow (use `long` or the stated modulus).

## Advantages

- Straightforward table filling; easy to compress to one row.

## Disadvantages

- O(r × c) memory if paths must be reconstructed (the full table is needed to backtrack).

## When to Use

- Grid with restricted (monotone) movement and a count/min/max question.
- Two-index states in general (two sequences, ranges), which share the same table mechanics.

## Common Mistakes

- Initialising the whole first row/column to 1 even after an obstacle.
- Reading `dp[r − 1][c]` when r = 0 (use padding or explicit cases).
- Using grid DP when movement is allowed in all directions (cycles!).

## Key Takeaways

- `dp[r][c]` from `dp[r − 1][c]`, `dp[r][c − 1]` (and sometimes `dp[r − 1][c − 1]`).
- Fill row by row; compress to one row because each row reads only the previous one.
- Monotone movement keeps it acyclic; free movement needs BFS/Dijkstra.
