# Dynamic Programming — Practice

### P1. Which problem does **not** have overlapping subproblems, so plain recursion is already efficient?

**Difficulty:** Easy · **Pattern:** Recognising overlap

- A) Fibonacci numbers
- B) Merge sort
- C) Counting paths in a grid
- D) Longest common subsequence

<details>
<summary>Hint</summary>

Do any two recursive calls ever receive the same input?

</details>

<details>
<summary>Answer</summary>

**Answer:** B) Merge sort

**Explanation:** Merge sort's halves are disjoint, so no subproblem repeats — that is divide and conquer. The others repeatedly solve the same (index, index) or n subproblems and need DP.

</details>

### P2. Count ways to climb with steps of 1, 2 or 3

**Difficulty:** Easy · **Pattern:** Linear recurrence with three terms

Count the ways to climb n stairs taking 1, 2 or 3 steps at a time.

**Constraints:** 0 ≤ n ≤ 37 (fits in `int`).

Example: n = 4 → `7`.

<details>
<summary>Hint</summary>

The last move was 1, 2 or 3 steps: `dp[i] = dp[i−1] + dp[i−2] + dp[i−3]`, with dp[0] = 1.

</details>

<details>
<summary>Answer</summary>

```java
public class ThreeSteps {

    static int ways(int n) {
        int[] dp = new int[Math.max(n + 1, 3)];
        dp[0] = 1;                                  // one way to stand still
        dp[1] = 1;
        dp[2] = 2;
        for (int i = 3; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2] + dp[i - 3];
        return dp[n];
    }

    public static void main(String[] args) {
        System.out.println(ways(4) + " " + ways(0) + " " + ways(10));
    }
}
```

**Output:**

```text
7 1 274
```

**Complexity:** O(n) time, O(n) space (O(1) with three variables).

</details>

### P3. Convert a memoized solution to tabulation

**Difficulty:** Medium · **Pattern:** Finding a valid fill order

`f(i, j)` = number of ways to move from (0, 0) to (i, j) moving only right or down, where `f(0, j) = f(i, 0) = 1` and `f(i, j) = f(i − 1, j) + f(i, j − 1)`. Write the bottom-up version for an r × c grid and state a valid order of computation and the space after compression.

**Constraints:** 1 ≤ r, c ≤ 100; return the answer modulo 10⁹ + 7 (for r = c = 100 the exact count C(198, 99) does not fit in a `long`).

Example: 3 × 7 → `28`.

<details>
<summary>Hint</summary>

Each cell depends on the cell above and the cell to the left; row-by-row, left-to-right satisfies both. Only the previous row is needed.

</details>

<details>
<summary>Answer</summary>

```java
public class GridPathsTable {

    static long paths(int rows, int cols) {
        final long MOD = 1_000_000_007L;
        long[] row = new long[cols];
        java.util.Arrays.fill(row, 1);                   // first row: one way to each cell
        for (int r = 1; r < rows; r++) {
            for (int c = 1; c < cols; c++) {
                row[c] = (row[c] + row[c - 1]) % MOD;    // old row[c] = above, new row[c-1] = left
            }
        }
        return row[cols - 1];
    }

    public static void main(String[] args) {
        System.out.println(paths(3, 7) + " " + paths(3, 2) + " " + paths(1, 1));
    }
}
```

**Output:**

```text
28 3 1
```

**Complexity:** O(r × c) time; O(c) space after compressing to one row (left-to-right order keeps `row[c]` = the value from the previous row until it is overwritten). The combinatorial answer is C(r + c − 2, r − 1).

</details>

### P4. Fibonacci memo with a sentinel bug

**Difficulty:** Medium · **Pattern:** Memo initialisation

A memoized function counts the number of ways to tile a 2 × n board with 2 × 1 dominoes **modulo 7**. It uses `memo[n] != 0` to test "already computed". Explain the bug and fix it.

<details>
<summary>Hint</summary>

Can a correct answer modulo 7 be 0?

</details>

<details>
<summary>Answer</summary>

**Answer:** Some answers are exactly 0 modulo 7 (the tilings follow Fibonacci numbers, and F(8) = 21 ≡ 0). Those states look "not computed" and are recomputed every time — correctness survives, but the complexity silently returns to exponential for parts of the recursion.

**Fix:** use a sentinel that cannot be an answer (fill the memo with −1), or a separate `boolean[] computed`.

```java
import java.util.Arrays;

public class MemoSentinel {

    static long calls;

    static int tilings(int n, int[] memo) {            // memo filled with -1 = "not computed"
        calls++;
        if (n <= 1) return 1;
        if (memo[n] != -1) return memo[n];
        return memo[n] = (tilings(n - 1, memo) + tilings(n - 2, memo)) % 7;
    }

    public static void main(String[] args) {
        int[] memo = new int[61];
        Arrays.fill(memo, -1);
        System.out.println(tilings(60, memo) + " computed in " + calls + " calls");
    }
}
```

**Output:**

```text
2 computed in 119 calls
```

**Complexity:** O(n) time and space with the sentinel.

</details>
