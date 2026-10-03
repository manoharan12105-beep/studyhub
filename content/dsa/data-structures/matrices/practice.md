# 2D Arrays and Matrices — Practice

### P1. Matrix diagonal sum

**Difficulty:** Easy · **Pattern:** Index relationships

Return the sum of both diagonals of a square matrix, counting the centre cell only once when n is odd.

**Constraints:** 1 ≤ n ≤ 100.

Example: `[[1,2,3],[4,5,6],[7,8,9]]` → 1 + 5 + 9 + 3 + 7 = `25`.

<details>
<summary>Hint</summary>

Main diagonal: (i, i). Anti-diagonal: (i, n − 1 − i). They meet when i = n − 1 − i.

</details>

<details>
<summary>Answer</summary>

```java
public class DiagonalSum {

    static int diagonalSum(int[][] m) {
        int n = m.length;
        int sum = 0;
        for (int i = 0; i < n; i++) {
            sum += m[i][i];
            if (i != n - 1 - i) {              // skip the shared centre
                sum += m[i][n - 1 - i];
            }
        }
        return sum;
    }

    public static void main(String[] args) {
        System.out.println(diagonalSum(new int[][] {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}));
        System.out.println(diagonalSum(new int[][] {{1, 1}, {1, 1}}));
    }
}
```

**Output:**

```text
25
4
```

**Complexity:** O(n) time, O(1) space.

</details>

### P2. Transpose a rectangular matrix

**Difficulty:** Easy · **Pattern:** New matrix with swapped dimensions

Return the transpose of an r × c matrix (it becomes c × r).

**Constraints:** 1 ≤ r, c ≤ 1000.

Example: `[[1,2,3],[4,5,6]]` → `[[1,4],[2,5],[3,6]]`.

<details>
<summary>Hint</summary>

In-place transposition only works for square matrices. Allocate `new int[c][r]`.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.Arrays;

public class TransposeRect {

    static int[][] transpose(int[][] m) {
        int rows = m.length, cols = m[0].length;
        int[][] t = new int[cols][rows];
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                t[c][r] = m[r][c];
            }
        }
        return t;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.deepToString(transpose(new int[][] {{1, 2, 3}, {4, 5, 6}})));
    }
}
```

**Output:**

```text
[[1, 4], [2, 5], [3, 6]]
```

**Complexity:** O(r × c) time and space.

</details>

### P3. Set matrix zeroes in O(1) extra space

**Difficulty:** Medium · **Pattern:** Use the input as marker storage

If a cell is 0, set its entire row and column to 0, in place, with O(1) extra space.

**Constraints:** 1 ≤ r, c ≤ 200.

Example: `[[1,1,1],[1,0,1],[1,1,1]]` → `[[1,0,1],[0,0,0],[1,0,1]]`.

<details>
<summary>Hint</summary>

Use row 0 and column 0 as the marker arrays. Remember separately whether row 0 and column 0 themselves contained a zero.

</details>

<details>
<summary>Answer</summary>

**Approach:** The O(r + c) version keeps two boolean arrays. To save that space, write the markers into the first row and first column, but first record (in two booleans) whether those lines originally had zeros. Apply the markers to the inner cells, then to the first row/column last.

```java
import java.util.Arrays;

public class SetZeroes {

    static void setZeroes(int[][] m) {
        int rows = m.length, cols = m[0].length;
        boolean firstRowZero = false, firstColZero = false;
        for (int c = 0; c < cols; c++) if (m[0][c] == 0) firstRowZero = true;
        for (int r = 0; r < rows; r++) if (m[r][0] == 0) firstColZero = true;

        for (int r = 1; r < rows; r++) {
            for (int c = 1; c < cols; c++) {
                if (m[r][c] == 0) {
                    m[r][0] = 0;                 // mark row r
                    m[0][c] = 0;                 // mark column c
                }
            }
        }
        for (int r = 1; r < rows; r++) {
            for (int c = 1; c < cols; c++) {
                if (m[r][0] == 0 || m[0][c] == 0) {
                    m[r][c] = 0;
                }
            }
        }
        if (firstRowZero) Arrays.fill(m[0], 0);
        if (firstColZero) for (int r = 0; r < rows; r++) m[r][0] = 0;
    }

    public static void main(String[] args) {
        int[][] a = {{1, 1, 1}, {1, 0, 1}, {1, 1, 1}};
        setZeroes(a);
        System.out.println(Arrays.deepToString(a));
        int[][] b = {{0, 1, 2, 0}, {3, 4, 5, 2}, {1, 3, 1, 5}};
        setZeroes(b);
        System.out.println(Arrays.deepToString(b));
    }
}
```

**Output:**

```text
[[1, 0, 1], [0, 0, 0], [1, 0, 1]]
[[0, 0, 0, 0], [0, 4, 5, 0], [0, 3, 1, 0]]
```

**Complexity:** O(r × c) time, O(1) extra space.

</details>

### P4. Pascal's triangle

**Difficulty:** Medium · **Pattern:** Row built from the previous row

Return the first `numRows` rows of Pascal's triangle, where each inner value is the sum of the two values above it.

**Constraints:** 1 ≤ numRows ≤ 30.

Example: numRows = 5 → `[[1],[1,1],[1,2,1],[1,3,3,1],[1,4,6,4,1]]`.

<details>
<summary>Hint</summary>

Row i has i + 1 values; the ends are 1; `row[j] = prev[j − 1] + prev[j]`.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class PascalTriangle {

    static List<List<Integer>> generate(int numRows) {
        List<List<Integer>> rows = new ArrayList<>();
        for (int i = 0; i < numRows; i++) {
            List<Integer> row = new ArrayList<>();
            for (int j = 0; j <= i; j++) {
                if (j == 0 || j == i) {
                    row.add(1);
                } else {
                    List<Integer> prev = rows.get(i - 1);
                    row.add(prev.get(j - 1) + prev.get(j));
                }
            }
            rows.add(row);
        }
        return rows;
    }

    public static void main(String[] args) {
        System.out.println(generate(5));
    }
}
```

**Output:**

```text
[[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1]]
```

**Complexity:** O(numRows²) time and space (the output itself has that many values). Jagged rows are natural here.

</details>

### P5. Game of Life — next state in place

**Difficulty:** Hard · **Pattern:** Encode two states in one cell

Each cell is alive (1) or dead (0). Next state: a live cell with 2 or 3 live neighbours (8 directions) survives; a dead cell with exactly 3 live neighbours becomes alive; all others die or stay dead. All cells update **simultaneously**. Compute the next state in place.

**Constraints:** 1 ≤ r, c ≤ 25.

<details>
<summary>Hint</summary>

Updating cells one by one corrupts neighbour counts for later cells. Store the new state in a second bit: `cell |= newState << 1`, read the old state as `cell & 1`.

</details>

<details>
<summary>Answer</summary>

**Approach:** Bit 0 holds the current state and bit 1 the next state. Counting neighbours reads only bit 0, so cells already processed still report their old state. A final pass shifts right by 1.

```java
import java.util.Arrays;

public class GameOfLife {

    static final int[][] DIRS = {{-1, -1}, {-1, 0}, {-1, 1}, {0, -1}, {0, 1}, {1, -1}, {1, 0}, {1, 1}};

    static void nextState(int[][] board) {
        int rows = board.length, cols = board[0].length;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                int live = 0;
                for (int[] d : DIRS) {
                    int nr = r + d[0], nc = c + d[1];
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                        live += board[nr][nc] & 1;          // old state only
                    }
                }
                boolean alive = (board[r][c] & 1) == 1;
                if ((alive && (live == 2 || live == 3)) || (!alive && live == 3)) {
                    board[r][c] |= 2;                        // next state = alive
                }
            }
        }
        for (int[] row : board) {
            for (int c = 0; c < cols; c++) {
                row[c] >>= 1;
            }
        }
    }

    public static void main(String[] args) {
        int[][] board = {{0, 1, 0}, {0, 0, 1}, {1, 1, 1}, {0, 0, 0}};
        nextState(board);
        System.out.println(Arrays.deepToString(board));
    }
}
```

**Output:**

```text
[[0, 0, 0], [1, 0, 1], [0, 1, 1], [0, 1, 0]]
```

**Complexity:** O(r × c) time (8 neighbours per cell), O(1) extra space.

</details>
