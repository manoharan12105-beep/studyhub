# Backtracking Problems — Practice

### P1. Valid Sudoku (no solving)

**Difficulty:** Medium · **Pattern:** Constraint check with sets

Determine whether a partially filled 9 × 9 Sudoku board (`'.'` for empty) is valid: no digit repeats in any row, column or 3 × 3 box. The board does not need to be solvable.

**Constraints:** board is 9 × 9.

<details>
<summary>Hint</summary>

One pass over the cells with three boolean tables indexed by (row, digit), (column, digit) and (box, digit).

</details>

<details>
<summary>Answer</summary>

```java
public class ValidSudoku {

    static boolean isValid(char[][] board) {
        boolean[][] row = new boolean[9][9], col = new boolean[9][9], box = new boolean[9][9];
        for (int r = 0; r < 9; r++) {
            for (int c = 0; c < 9; c++) {
                if (board[r][c] == '.') continue;
                int d = board[r][c] - '1', b = (r / 3) * 3 + c / 3;
                if (row[r][d] || col[c][d] || box[b][d]) return false;
                row[r][d] = col[c][d] = box[b][d] = true;
            }
        }
        return true;
    }

    public static void main(String[] args) {
        String[] rows = {
            "53..7....", "6..195...", ".98....6.", "8...6...3", "4..8.3..1",
            "7...2...6", ".6....28.", "...419..5", "....8..79"};
        char[][] board = new char[9][];
        for (int i = 0; i < 9; i++) board[i] = rows[i].toCharArray();
        System.out.print(isValid(board) + " ");
        board[0][0] = '8';                     // 8 now repeats in column 0 and in the top-left box
        System.out.println(isValid(board));
    }
}
```

**Output:**

```text
true false
```

**Complexity:** O(81) = O(1) for a fixed board; O(n²) for an n² × n² generalisation.

</details>

### P2. Count N-Queens solutions with bitmasks

**Difficulty:** Medium · **Pattern:** Bitmask state

Return the number of distinct solutions to the N-Queens puzzle.

**Constraints:** 1 ≤ n ≤ 12.

Example: n = 4 → `2`; n = 8 → `92`.

<details>
<summary>Hint</summary>

Represent attacked columns, diagonals and anti-diagonals of the **current row** as bitmasks. Moving to the next row shifts the diagonal masks left and right by one.

</details>

<details>
<summary>Answer</summary>

**Approach:** `free = ~(cols | diag | anti) & full` lists safe columns as 1-bits. Take the lowest one with `free & −free`, place it, and recurse with the masks updated; shifting moves each diagonal's attack one column per row. See [Bit Manipulation](../bit-manipulation/content.md).

```java
public class CountQueens {

    static int count(int n) {
        return place(n, (1 << n) - 1, 0, 0, 0);
    }

    private static int place(int n, int full, int cols, int diag, int anti) {
        if (cols == full) return 1;                          // a queen in every column
        int total = 0;
        int free = ~(cols | diag | anti) & full;
        while (free != 0) {
            int bit = free & -free;                          // lowest safe column
            free -= bit;
            total += place(n, full, cols | bit, ((diag | bit) << 1) & full, (anti | bit) >> 1);
        }
        return total;
    }

    public static void main(String[] args) {
        System.out.println(count(4) + " " + count(6) + " " + count(8) + " " + count(10));
    }
}
```

**Output:**

```text
2 4 92 724
```

**Complexity:** Exponential (bounded by n!), O(n) recursion depth; bitmasks make each step O(1).

</details>

### P3. Paths that visit every open cell exactly once

**Difficulty:** Hard · **Pattern:** Backtracking with a remaining-cells counter

A grid contains one start (1), one end (2), empty cells (0) and obstacles (−1). Count the 4-directional walks from start to end that pass over **every** non-obstacle cell exactly once.

**Constraints:** 1 ≤ rows × cols ≤ 20.

Example: `[[1,0,0,0],[0,0,0,0],[0,0,2,-1]]` → `2`; `[[1,0,0,0],[0,0,0,0],[0,0,0,2]]` → `4`.

<details>
<summary>Hint</summary>

Count the cells that must be visited (all non-obstacles). Walk from the start, marking cells as you go; a path counts only if it reaches the end exactly when the remaining count hits zero.

</details>

<details>
<summary>Answer</summary>

**Approach:** Standard grid backtracking with one extra piece of state — how many cells are still unvisited. Reaching the end early (cells left) is a dead end, which prunes many branches.

```java
public class VisitAllCells {

    static int countPaths(int[][] grid) {
        int toVisit = 0, sr = 0, sc = 0;
        for (int r = 0; r < grid.length; r++) {
            for (int c = 0; c < grid[0].length; c++) {
                if (grid[r][c] != -1) toVisit++;
                if (grid[r][c] == 1) { sr = r; sc = c; }
            }
        }
        return walk(grid, sr, sc, toVisit);
    }

    private static int walk(int[][] g, int r, int c, int remaining) {
        if (r < 0 || r >= g.length || c < 0 || c >= g[0].length || g[r][c] == -1) return 0;
        if (g[r][c] == 2) return remaining == 1 ? 1 : 0;     // the end must be the last cell
        int saved = g[r][c];
        g[r][c] = -1;                                         // mark visited
        int paths = walk(g, r + 1, c, remaining - 1) + walk(g, r - 1, c, remaining - 1)
                  + walk(g, r, c + 1, remaining - 1) + walk(g, r, c - 1, remaining - 1);
        g[r][c] = saved;                                      // undo
        return paths;
    }

    public static void main(String[] args) {
        System.out.println(countPaths(new int[][] {{1, 0, 0, 0}, {0, 0, 0, 0}, {0, 0, 2, -1}}) + " "
                + countPaths(new int[][] {{1, 0, 0, 0}, {0, 0, 0, 0}, {0, 0, 0, 2}}) + " "
                + countPaths(new int[][] {{0, 1}, {2, 0}}));
    }
}
```

**Output:**

```text
2 4 0
```

**Complexity:** O(3^k) for k open cells (at most 3 new directions per step), O(k) recursion depth.

</details>

### P4. Graph m-colouring

**Difficulty:** Hard · **Pattern:** Assign values vertex by vertex

Can the vertices of an undirected graph be coloured with at most m colours so that no edge joins two vertices of the same colour?

**Constraints:** 1 ≤ V ≤ 20; 1 ≤ m ≤ V.

Example: a 4-cycle 0–1–2–3–0 plus the chord 0–2: m = 3 → `true`; m = 2 → `false`.

<details>
<summary>Hint</summary>

Colour vertices in order 0, 1, 2, …. For vertex v, try each colour not used by an already-coloured neighbour; backtrack when none fits.

</details>

<details>
<summary>Answer</summary>

**Approach:** Same template as Sudoku: the decision is "colour of vertex v", the constraint is "differs from coloured neighbours". Deciding whether a graph is m-colourable is NP-complete for m ≥ 3, so exponential search is expected; pruning keeps small inputs fast.

```java
import java.util.*;

public class GraphColouring {

    static boolean colourable(int vertices, int[][] edges, int m) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < vertices; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            adj.get(e[1]).add(e[0]);
        }
        return assign(0, adj, new int[vertices], m);         // colour 0 = uncoloured
    }

    private static boolean assign(int v, List<List<Integer>> adj, int[] colour, int m) {
        if (v == colour.length) return true;
        for (int c = 1; c <= m; c++) {
            boolean clash = false;
            for (int u : adj.get(v)) {
                if (colour[u] == c) { clash = true; break; }
            }
            if (clash) continue;
            colour[v] = c;
            if (assign(v + 1, adj, colour, m)) return true;
            colour[v] = 0;
        }
        return false;
    }

    public static void main(String[] args) {
        int[][] edges = {{0, 1}, {1, 2}, {2, 3}, {3, 0}, {0, 2}};
        System.out.println(colourable(4, edges, 3) + " " + colourable(4, edges, 2));
    }
}
```

**Output:**

```text
true false
```

**Complexity:** O(m^V × V) worst case (each of m^V assignments checked against neighbours), O(V) recursion depth.

</details>
