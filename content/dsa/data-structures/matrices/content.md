# 2D Arrays and Matrices

## Definition

A **2D array** (matrix) arranges elements in **rows** and **columns**; element `grid[r][c]` is in row r and column c. In Java a 2D array is an **array of arrays**: `grid` is an array whose elements are references to row arrays.

## Why It Matters

Grids model images, game boards, maps, spreadsheets and DP tables. Matrix problems test careful index handling: traversal orders (row-wise, column-wise, diagonal, spiral), in-place transformations (rotation, transpose), boundary checks, and treating a grid as a graph (islands, shortest path in a maze).

## Core Concept

### Java memory layout

```text
grid ──► [ ref0 | ref1 | ref2 ]          outer array: one reference per row
            │      │      │
            ▼      ▼      ▼
          [1 2 3] [4 5 6] [7 8 9]        each row is its own int[] (contiguous)
```

Consequences:

- `grid.length` = number of rows; `grid[r].length` = number of columns in row r.
- Rows may have different lengths (**jagged arrays**): `new int[3][]` then `grid[0] = new int[5]`.
- Iterating **row by row** (inner loop over columns) is cache-friendly; column by column jumps between separate row arrays and is slower for large matrices.

### Row-major indexing

Flattening an r × c grid into one array (for hashing a cell, union-find, or BFS state):

```text
index = row × cols + col
row   = index / cols
col   = index % cols
```

### Directions for neighbours

Moving up, down, left and right is easiest with a direction array — the backbone of every grid BFS/DFS:

```java
int[][] directions = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};   // up, down, left, right
for (int[] d : directions) {
    int nr = r + d[0];
    int nc = c + d[1];
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        // (nr, nc) is a valid neighbour
    }
}
```

Add `{-1,-1}, {-1,1}, {1,-1}, {1,1}` for 8-directional movement.

## Visual Explanation

```text
            col 0  col 1  col 2  col 3
row 0      [  1      2      3      4  ]
row 1      [  5      6      7      8  ]
row 2      [  9     10     11     12  ]

Main diagonal cells:      r == c            → 1, 6, 11
Anti-diagonal (square):   r + c == n − 1
Same diagonal ↘ :         r − c is constant
Same anti-diagonal ↙ :    r + c is constant
```

## Operations

### Traversal

```java
static void printRowWise(int[][] grid) {
    for (int r = 0; r < grid.length; r++) {
        for (int c = 0; c < grid[r].length; c++) {
            System.out.print(grid[r][c] + " ");
        }
        System.out.println();
    }
}
```

**Time:** O(rows × cols) · **Space:** O(1)

### Transpose (square matrix, in place)

Swap `grid[r][c]` with `grid[c][r]` for every cell **above** the main diagonal only (`c > r`); swapping all cells would swap each pair twice and undo the work.

```java
static void transpose(int[][] m) {
    int n = m.length;
    for (int r = 0; r < n; r++) {
        for (int c = r + 1; c < n; c++) {
            int temp = m[r][c];
            m[r][c] = m[c][r];
            m[c][r] = temp;
        }
    }
}
```

**Time:** O(n²) · **Space:** O(1)

### Rotate 90° clockwise (square matrix, in place)

Clockwise rotation = **transpose, then reverse each row**. (Counter-clockwise = transpose, then reverse each column.)

```text
1 2 3      transpose     1 4 7     reverse rows    7 4 1
4 5 6     ──────────►    2 5 8    ─────────────►   8 5 2
7 8 9                    3 6 9                     9 6 3
```

Why: rotating clockwise sends (r, c) to (c, n − 1 − r). Transposing sends (r, c) to (c, r); reversing each row then sends column r to column n − 1 − r.

### Spiral traversal

Keep four boundaries — `top`, `bottom`, `left`, `right` — and peel the matrix layer by layer: left→right along `top`, top→bottom along `right`, right→left along `bottom`, bottom→top along `left`, shrinking each boundary after use. Check the boundaries again before the last two legs, otherwise a single remaining row or column is visited twice.

### Search in a row- and column-sorted matrix

If each row and each column is sorted ascending, start at the **top-right** corner: if the value is too big, move left (everything below in that column is even bigger); if too small, move down. Each step discards a row or a column: **O(rows + cols)**. (If the whole matrix is sorted row after row, binary search over r × c indices is O(log(r × c)) — see [Binary Search Variations](../../algorithms/binary-search-variations/content.md).)

### Set matrix zeroes

If a cell is 0, its entire row and column must become 0. Marking while scanning would spread zeros incorrectly, so first **record** which rows and columns contain a zero (two boolean arrays, O(r + c) space — or the first row and column as markers for O(1) space), then apply.

## Full Java Implementation

```java
import java.util.*;

public class MatrixOps {

    static void rotateClockwise(int[][] m) {
        int n = m.length;
        for (int r = 0; r < n; r++) {                 // transpose
            for (int c = r + 1; c < n; c++) {
                int temp = m[r][c];
                m[r][c] = m[c][r];
                m[c][r] = temp;
            }
        }
        for (int[] row : m) {                          // reverse each row
            for (int left = 0, right = n - 1; left < right; left++, right--) {
                int temp = row[left];
                row[left] = row[right];
                row[right] = temp;
            }
        }
    }

    static List<Integer> spiral(int[][] m) {
        List<Integer> out = new ArrayList<>();
        if (m.length == 0) {
            return out;
        }
        int top = 0, bottom = m.length - 1, left = 0, right = m[0].length - 1;
        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) out.add(m[top][c]);
            top++;
            for (int r = top; r <= bottom; r++) out.add(m[r][right]);
            right--;
            if (top <= bottom) {                       // a row is still left
                for (int c = right; c >= left; c--) out.add(m[bottom][c]);
                bottom--;
            }
            if (left <= right) {                       // a column is still left
                for (int r = bottom; r >= top; r--) out.add(m[r][left]);
                left++;
            }
        }
        return out;
    }

    static boolean searchSorted(int[][] m, int target) {
        int r = 0, c = m[0].length - 1;                // top-right corner
        while (r < m.length && c >= 0) {
            if (m[r][c] == target) return true;
            if (m[r][c] > target) c--;                 // whole column below is larger
            else r++;                                  // whole row to the left is smaller
        }
        return false;
    }

    public static void main(String[] args) {
        int[][] square = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
        rotateClockwise(square);
        System.out.println(Arrays.deepToString(square));

        int[][] rect = {{1, 2, 3, 4}, {5, 6, 7, 8}, {9, 10, 11, 12}};
        System.out.println(spiral(rect));
        System.out.println(spiral(new int[][] {{1}, {2}, {3}}));

        int[][] sorted = {{1, 4, 7}, {2, 5, 8}, {3, 6, 9}};
        System.out.println(searchSorted(sorted, 6) + " " + searchSorted(sorted, 10));
    }
}
```

**Output:**

```text
[[7, 4, 1], [8, 5, 2], [9, 6, 3]]
[1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]
[1, 2, 3]
true false
```

(One-line `for` bodies without braces are used here only to keep the spiral legs readable side by side.)

## Dry Run

Spiral on the 3 × 4 matrix above:

| Leg | Boundaries before (top, bottom, left, right) | Cells added | Boundary change |
|-----|---------------------------------------------|-------------|-----------------|
| → top row | 0, 2, 0, 3 | 1 2 3 4 | top = 1 |
| ↓ right col | 1, 2, 0, 3 | 8 12 | right = 2 |
| ← bottom row | 1, 2, 0, 2 | 11 10 9 | bottom = 1 |
| ↑ left col | 1, 1, 0, 2 | 5 | left = 1 |
| → top row | 1, 1, 1, 2 | 6 7 | top = 2 |
| ↓ right col | 2, 1, 1, 2 | (none: top > bottom) | right = 1 |
| ← bottom row | skipped: top 2 > bottom 1 | — | — |
| ↑ left col | 2, 1, 1, 1 | (none: bottom < top) | left = 2 |
| loop test | top 2 > bottom 1 | — | loop ends |

## Complexity Summary

| Operation | Time | Space |
|-----------|------|-------|
| Traverse / spiral / copy | O(r × c) | O(1) extra (output aside) |
| Transpose / rotate (square, in place) | O(n²) | O(1) |
| Search, row- and column-sorted | O(r + c) | O(1) |
| Search, fully sorted row after row | O(log(r × c)) | O(1) |
| Set matrix zeroes | O(r × c) | O(r + c), or O(1) with marker row/column |

## Advantages

- Natural model for grids, boards, images and tables.
- O(1) access to any cell.

## Disadvantages

- Memory is r × c even when most cells are empty (use a map or adjacency list for sparse data).
- Index bugs are easy: rows vs columns, boundary checks, jagged rows.

## Java Collections Equivalent

- `int[][]` for fixed grids; `List<List<Integer>>` when rows grow (e.g. Pascal's triangle).
- Print with `Arrays.deepToString(grid)`; copy each row (`row.clone()`), since `grid.clone()` copies only the outer array.

## Real-World Applications

- Image processing (pixels), game boards (chess, Sudoku), maps (grid pathfinding).
- Spreadsheets and DP tables (LCS, edit distance, knapsack).
- Adjacency matrices for dense graphs.

## Common Mistakes

- Mixing up `grid.length` (rows) and `grid[0].length` (columns), especially for non-square input.
- Missing boundary checks before reading neighbours.
- Transposing the full square instead of one triangle (swaps twice → no change).
- Spiral traversal on single rows/columns without the extra boundary checks (duplicates).
- Changing cells while still reading the original values (set-zeroes, Game of Life) — record first, or encode both states.

## Key Takeaways

- Java 2D arrays are arrays of row arrays; rows may differ in length.
- Use a direction array and one bounds check for neighbours.
- Rotate clockwise = transpose + reverse rows; spiral = four shrinking boundaries.
- Row- and column-sorted matrix: start top-right for O(r + c) search.
