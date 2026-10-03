# Backtracking Problems: N-Queens, Sudoku, Maze, Word Search

## Definition

Four classic **constraint-satisfaction** problems solved with backtracking: **N-Queens** (place n queens on an n × n board so none attack each other), **Sudoku** (fill a 9 × 9 grid under row, column and box rules), **rat in a maze** (find paths through open cells), and **word search** (find a word along adjacent grid cells). Each places one piece at a time, checks constraints immediately, and undoes the placement when it leads nowhere.

## Why It Matters

These are the standard interview examples of backtracking **with pruning**: the search space is astronomically large (9⁸¹ Sudoku fillings), but checking constraints at every step cuts it down to something solvable. They also teach efficient constraint checks (O(1) with boolean arrays instead of rescanning the board) and in-place visited marking on grids.

## Prerequisites

- [Backtracking](../backtracking/content.md) — choose, explore, undo.
- [2D Arrays and Matrices](../../data-structures/matrices/content.md) — grid indexing and directions.

## Intuition

All four follow one loop: *find the next decision point → try each legal option → recurse → undo*. The difference is only in what a "decision point" is (a row for N-Queens, an empty cell for Sudoku, the current cell for mazes and word search) and in the constraint check.

## How It Works

### N-Queens

- One queen per row, so the decision at row r is **which column**.
- A queen at (r, c) attacks its column, its "↘ diagonal" (all cells with the same r − c) and its "↙ anti-diagonal" (same r + c).
- Keep three boolean arrays: `cols[c]`, `diag[r − c + n − 1]`, `anti[r + c]` → each safety check is O(1).
- Place, recurse to row r + 1, unplace. Row n reached = one solution.

### Sudoku

1. Find the next empty cell (scan in row-major order).
2. Try digits 1–9; a digit is legal if it is not already in that row, column or 3 × 3 box (box index = (r / 3) × 3 + c / 3).
3. Place it, recurse; if the recursion returns `false`, remove it and try the next digit.
4. If no digit works, return `false` (backtrack). If no empty cell remains, return `true`.

Keeping `rowUsed[9][10]`, `colUsed[9][10]`, `boxUsed[9][10]` makes each check O(1).

### Rat in a maze

From (r, c), move in each direction to an open, unvisited cell inside the grid; mark it visited, recurse, unmark. Reaching the target records the path (for "all paths") or returns `true` (for "any path"). For the **shortest** path in an unweighted grid, use [BFS](../bfs/content.md) instead — backtracking explores every path.

### Word search (single word)

For each cell matching the first letter, DFS: at step i the cell must equal `word[i]`; mark the cell (e.g. replace with `'#'`), explore 4 neighbours for `word[i + 1]`, restore the cell. To find **many** words at once, combine with a trie — see [Trie](../../data-structures/trie/content.md) practice.

## Visual Explanation

```text
4-Queens, first solution found:

row 0:  . Q . .      col 1
row 1:  . . . Q      col 3
row 2:  Q . . .      col 0
row 3:  . . Q .      col 2

Trying row 0 col 0 first: rows 1–2 can be placed (cols 2, then none / 3, then 1),
but row 3 always fails → backtrack all the way to row 0 and try col 1.
```

## Pseudocode

```pseudocode
solveQueens(row):
    if row = n: record board; return
    for col from 0 to n − 1:
        if not cols[col] and not diag[row − col + n − 1] and not anti[row + col]:
            place queen; mark three arrays     // choose
            solveQueens(row + 1)               // explore
            remove queen; unmark arrays        // undo

solveSudoku():
    (r, c) ← next empty cell; if none: return true
    for d from 1 to 9:
        if d legal at (r, c):
            place d; if solveSudoku(): return true
            remove d
    return false
```

## Java Implementation

```java
import java.util.*;

public class BacktrackingProblems {

    // ---------- N-Queens ----------
    static List<List<String>> solveNQueens(int n) {
        List<List<String>> boards = new ArrayList<>();
        int[] queenCol = new int[n];
        placeQueen(0, n, queenCol, new boolean[n], new boolean[2 * n - 1], new boolean[2 * n - 1], boards);
        return boards;
    }

    private static void placeQueen(int row, int n, int[] queenCol, boolean[] cols, boolean[] diag, boolean[] anti,
                                   List<List<String>> boards) {
        if (row == n) {
            List<String> board = new ArrayList<>();
            for (int r = 0; r < n; r++) {
                char[] line = new char[n];
                Arrays.fill(line, '.');
                line[queenCol[r]] = 'Q';
                board.add(new String(line));
            }
            boards.add(board);
            return;
        }
        for (int c = 0; c < n; c++) {
            int d = row - c + n - 1, a = row + c;
            if (cols[c] || diag[d] || anti[a]) continue;        // attacked: prune
            cols[c] = diag[d] = anti[a] = true;
            queenCol[row] = c;
            placeQueen(row + 1, n, queenCol, cols, diag, anti, boards);
            cols[c] = diag[d] = anti[a] = false;                 // undo
        }
    }

    // ---------- Sudoku ----------
    static boolean solveSudoku(int[][] g) {
        boolean[][] row = new boolean[9][10], col = new boolean[9][10], box = new boolean[9][10];
        for (int r = 0; r < 9; r++) {
            for (int c = 0; c < 9; c++) {
                int d = g[r][c];
                if (d != 0) row[r][d] = col[c][d] = box[(r / 3) * 3 + c / 3][d] = true;
            }
        }
        return fill(g, 0, row, col, box);
    }

    private static boolean fill(int[][] g, int cell, boolean[][] row, boolean[][] col, boolean[][] box) {
        while (cell < 81 && g[cell / 9][cell % 9] != 0) cell++;      // next empty cell
        if (cell == 81) return true;
        int r = cell / 9, c = cell % 9, b = (r / 3) * 3 + c / 3;
        for (int d = 1; d <= 9; d++) {
            if (row[r][d] || col[c][d] || box[b][d]) continue;
            g[r][c] = d;
            row[r][d] = col[c][d] = box[b][d] = true;
            if (fill(g, cell + 1, row, col, box)) return true;      // stop at the first solution
            g[r][c] = 0;
            row[r][d] = col[c][d] = box[b][d] = false;
        }
        return false;
    }

    // ---------- Rat in a maze: all paths from top-left to bottom-right (1 = open) ----------
    static List<String> mazePaths(int[][] maze) {
        List<String> paths = new ArrayList<>();
        if (maze[0][0] == 1) walk(maze, 0, 0, new StringBuilder(), new boolean[maze.length][maze[0].length], paths);
        return paths;
    }

    private static final int[][] MOVES = {{1, 0}, {0, -1}, {0, 1}, {-1, 0}};
    private static final char[] NAMES = {'D', 'L', 'R', 'U'};       // alphabetical order of moves

    private static void walk(int[][] m, int r, int c, StringBuilder path, boolean[][] visited, List<String> paths) {
        int n = m.length;
        if (r == n - 1 && c == m[0].length - 1) {
            paths.add(path.toString());
            return;
        }
        visited[r][c] = true;
        for (int i = 0; i < 4; i++) {
            int nr = r + MOVES[i][0], nc = c + MOVES[i][1];
            if (nr >= 0 && nr < n && nc >= 0 && nc < m[0].length && m[nr][nc] == 1 && !visited[nr][nc]) {
                path.append(NAMES[i]);
                walk(m, nr, nc, path, visited, paths);
                path.deleteCharAt(path.length() - 1);
            }
        }
        visited[r][c] = false;                                       // other paths may use this cell
    }

    // ---------- Word search ----------
    static boolean exist(char[][] board, String word) {
        for (int r = 0; r < board.length; r++) {
            for (int c = 0; c < board[0].length; c++) {
                if (search(board, word, 0, r, c)) return true;
            }
        }
        return false;
    }

    private static boolean search(char[][] b, String word, int i, int r, int c) {
        if (i == word.length()) return true;
        if (r < 0 || r >= b.length || c < 0 || c >= b[0].length || b[r][c] != word.charAt(i)) return false;
        char saved = b[r][c];
        b[r][c] = '#';                                               // mark as used on this path
        boolean found = search(b, word, i + 1, r + 1, c) || search(b, word, i + 1, r - 1, c)
                || search(b, word, i + 1, r, c + 1) || search(b, word, i + 1, r, c - 1);
        b[r][c] = saved;                                             // undo
        return found;
    }

    public static void main(String[] args) {
        List<List<String>> queens = solveNQueens(4);
        System.out.println("4-queens solutions: " + queens.size() + " first: " + queens.get(0));
        System.out.println("8-queens solutions: " + solveNQueens(8).size());

        int[][] sudoku = {
            {5, 3, 0, 0, 7, 0, 0, 0, 0}, {6, 0, 0, 1, 9, 5, 0, 0, 0}, {0, 9, 8, 0, 0, 0, 0, 6, 0},
            {8, 0, 0, 0, 6, 0, 0, 0, 3}, {4, 0, 0, 8, 0, 3, 0, 0, 1}, {7, 0, 0, 0, 2, 0, 0, 0, 6},
            {0, 6, 0, 0, 0, 0, 2, 8, 0}, {0, 0, 0, 4, 1, 9, 0, 0, 5}, {0, 0, 0, 0, 8, 0, 0, 7, 9}};
        System.out.println("sudoku solved: " + solveSudoku(sudoku) + ", first row " + Arrays.toString(sudoku[0]));

        int[][] maze = {{1, 0, 0, 0}, {1, 1, 0, 1}, {1, 1, 0, 0}, {0, 1, 1, 1}};
        System.out.println("maze paths: " + mazePaths(maze));

        char[][] board = {{'A', 'B', 'C', 'E'}, {'S', 'F', 'C', 'S'}, {'A', 'D', 'E', 'E'}};
        System.out.println("ABCCED " + exist(board, "ABCCED") + ", SEE " + exist(board, "SEE") + ", ABCB " + exist(board, "ABCB"));
    }
}
```

**Output:**

```text
4-queens solutions: 2 first: [.Q.., ...Q, Q..., ..Q.]
8-queens solutions: 92
sudoku solved: true, first row [5, 3, 4, 6, 7, 8, 9, 1, 2]
maze paths: [DDRDRR, DRDDRR]
ABCCED true, SEE true, ABCB false
```

## Dry Run

4-Queens, exploring from row 0, column 0 (`cols`, `diag`, `anti` updated at each placement):

| Row | Tried columns | Result |
|-----|---------------|--------|
| 0 | 0 | place |
| 1 | 0 (column), 1 (diagonal), 2 | place at 2 |
| 2 | 0 (column), 1 (anti-diagonal of (1,2)), 2 (column), 3 (diagonal) | all fail → backtrack |
| 1 | 3 | place at 3 |
| 2 | 0 (column), 1 | place at 1 |
| 3 | 0, 1, 2, 3 all attacked | backtrack |
| 2 | 2, 3 attacked | backtrack to row 1, then to row 0 |
| 0 | 1 | place — leads to the first solution `.Q.. / ...Q / Q... / ..Q.` |

## Complexity Analysis

| Problem | Time | Space |
|---------|------|-------|
| N-Queens | O(n!) upper bound (one queen per row, distinct columns); far less with pruning | O(n) |
| Sudoku | O(9^m) worst case for m empty cells; pruning makes typical puzzles fast | O(m) recursion |
| Maze, all paths | O(4^(r·c)) loose upper bound (3 choices after the first step); exponential | O(r · c) |
| Word search | O(r · c · 4 · 3^(L−1)) for word length L | O(L) recursion |

## Properties

- All four are depth-first, modify shared state in place, and must restore it exactly.
- Sudoku and "any path" return on the first success; N-Queens and "all paths" collect every solution.

## Variations

- **Count N-Queens solutions** without building boards (return counts; bitmasks make it very fast).
- **Valid Sudoku** — only check the given digits, no search.
- **Maze shortest path** — BFS; **maze with keys/obstacles** — BFS over (cell, state).
- **Graph colouring (m-colouring)** — same pattern: assign colours vertex by vertex, check neighbours.

## Comparison

| | Backtracking | BFS | DP |
|---|--------------|-----|----|
| Maze: any path | works | works | — |
| Maze: shortest path | explores everything (slow) | optimal, O(r · c) | — |
| Maze: number of paths moving only right/down | exponential | — | O(r · c) grid DP |
| Puzzles with global constraints (Sudoku, N-Queens) | the standard tool | — | — |

## Edge Cases

- N-Queens: n = 1 (one solution), n = 2 and n = 3 (none).
- Maze: start or end blocked; 1 × 1 maze.
- Word search: word longer than the number of cells; the same cell must not be reused.
- Sudoku: an invalid puzzle — the solver must return `false`, not loop forever.

## Advantages

- Solves problems with complex constraints using one simple template.
- Early pruning makes many "impossible-looking" searches fast.

## Disadvantages

- Exponential worst case; performance depends heavily on pruning and choice order.

## When to Use

- Placement and assignment puzzles with constraints checked incrementally.
- "All paths", "all placements", "does a configuration exist" on small grids/boards.

## Common Mistakes

- Checking constraints by rescanning the board (O(n) per check) instead of O(1) arrays.
- Wrong diagonal indexing (`r − c` can be negative — offset by n − 1).
- Forgetting to unmark visited cells, so other paths cannot use them.
- Not restoring the board cell in word search after exploring.
- Continuing the search after Sudoku is solved (return as soon as `true` comes back).

## Key Takeaways

- Same template everywhere: pick the next decision, try legal options, recurse, undo.
- O(1) constraint checks with boolean arrays: N-Queens columns + both diagonals; Sudoku rows, columns, boxes.
- Mark and unmark visited cells on grids; use BFS when you need the shortest path, not all paths.
