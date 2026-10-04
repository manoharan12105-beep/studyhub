# Difference Array — Practice

### P1. Integer points covered by parked cars

**Difficulty:** Easy · **Pattern:** +1/−1 coverage counting

Each car covers the integer points `[start, end]` (inclusive) on a line. Return how many integer points are covered by at least one car.

**Constraints:** 1 ≤ cars ≤ 100; 1 ≤ start ≤ end ≤ 100.

Example: `[[3, 6], [1, 5], [4, 7]]` → `7` (points 1 … 7); `[[1, 3], [5, 8]]` → `7`.

<details>
<summary>Hint</summary>

+1 at `start`, −1 at `end + 1`; the running sum at x is the number of cars covering x. Count positions with a positive running sum.

</details>

<details>
<summary>Answer</summary>

```java
public class CoveredPoints {

    static int numberOfPoints(int[][] cars) {
        int[] diff = new int[102];
        for (int[] c : cars) {
            diff[c[0]]++;
            diff[c[1] + 1]--;                       // inclusive end
        }
        int covered = 0, running = 0;
        for (int x = 1; x <= 100; x++) {
            running += diff[x];
            if (running > 0) covered++;
        }
        return covered;
    }

    public static void main(String[] args) {
        System.out.println(numberOfPoints(new int[][] {{3, 6}, {1, 5}, {4, 7}}) + " " + numberOfPoints(new int[][] {{1, 3}, {5, 8}}));
    }
}
```

**Output:**

```text
7 7
```

**Complexity:** O(cars + range) time, O(range) space.

</details>

### P2. Shift letters over ranges

**Difficulty:** Medium · **Pattern:** Difference array modulo 26

Each shift `[l, r, dir]` moves every letter of `s[l … r]` one step forward in the alphabet (dir = 1, wrapping z → a) or backward (dir = 0, wrapping a → z). Return the final string.

**Constraints:** 1 ≤ |s|, shifts ≤ 5 × 10⁴.

Example: `s = "abc"`, shifts `[[0, 1, 0], [1, 2, 1], [0, 2, 1]]` → `"ace"`.

<details>
<summary>Hint</summary>

A shift is +1 or −1 added to a range. Accumulate net shifts with a difference array, then apply each net shift mod 26 with `Math.floorMod` (it can be negative).

</details>

<details>
<summary>Answer</summary>

```java
public class ShiftingLetters {

    static String shiftingLetters(String s, int[][] shifts) {
        int n = s.length();
        int[] diff = new int[n + 1];
        for (int[] sh : shifts) {
            int v = sh[2] == 1 ? 1 : -1;
            diff[sh[0]] += v;
            diff[sh[1] + 1] -= v;
        }
        StringBuilder sb = new StringBuilder();
        int net = 0;
        for (int i = 0; i < n; i++) {
            net += diff[i];
            sb.append((char) ('a' + Math.floorMod(s.charAt(i) - 'a' + net, 26)));
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        System.out.println(shiftingLetters("abc", new int[][] {{0, 1, 0}, {1, 2, 1}, {0, 2, 1}}) + " " + shiftingLetters("dztz", new int[][] {{0, 0, 0}, {1, 1, 1}}));
    }
}
```

**Output:**

```text
ace catz
```

**Complexity:** O(n + shifts) time, O(n) space. Applying each shift directly would be O(n × shifts) ≈ 2.5 × 10⁹.

</details>

### P3. Increment submatrices by one

**Difficulty:** Medium · **Pattern:** 2D difference array

Start with an n × n zero matrix. Each query `[r1, c1, r2, c2]` adds 1 to every cell of that rectangle (inclusive). Return the final matrix.

**Constraints:** 1 ≤ n ≤ 500; 1 ≤ queries ≤ 10⁴.

Example: n = 3, queries `[[1, 1, 2, 2], [0, 0, 1, 1]]` → `[[1, 1, 0], [1, 2, 1], [0, 1, 1]]`.

<details>
<summary>Hint</summary>

Mark four corners: +1 at (r1, c1), −1 at (r1, c2 + 1), −1 at (r2 + 1, c1), +1 at (r2 + 1, c2 + 1). Then take prefix sums along rows and along columns.

</details>

<details>
<summary>Answer</summary>

**Approach:** The two −1 marks cancel the +1 to the right of and below the rectangle; the final +1 restores the bottom-right region that was cancelled twice. Updating every cell would be O(queries × n²) ≈ 2.5 × 10⁹.

```java
import java.util.Arrays;

public class IncrementSubmatrices {

    static int[][] rangeAddQueries(int n, int[][] queries) {
        int[][] d = new int[n + 1][n + 1];
        for (int[] q : queries) {
            d[q[0]][q[1]]++;
            d[q[0]][q[3] + 1]--;
            d[q[2] + 1][q[1]]--;
            d[q[2] + 1][q[3] + 1]++;
        }
        int[][] result = new int[n][n];
        for (int r = 0; r < n; r++) {
            for (int c = 0; c < n; c++) {
                int up = r > 0 ? result[r - 1][c] : 0;
                int left = c > 0 ? result[r][c - 1] : 0;
                int diag = r > 0 && c > 0 ? result[r - 1][c - 1] : 0;
                result[r][c] = d[r][c] + up + left - diag;     // 2D prefix sum
            }
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(Arrays.deepToString(rangeAddQueries(3, new int[][] {{1, 1, 2, 2}, {0, 0, 1, 1}})));
    }
}
```

**Output:**

```text
[[1, 1, 0], [1, 2, 1], [0, 1, 1]]
```

**Complexity:** O(queries + n²) time, O(n²) space.

</details>
