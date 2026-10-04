# Dynamic Programming Pattern — Practice

### P1. Minimum falling path sum

**Difficulty:** Medium · **Pattern:** Grid DP from the row above

In an n × n matrix, a falling path starts at any cell in the first row and moves to the next row's cell directly below or diagonally left/right. Return the minimum sum of a falling path.

**Constraints:** 1 ≤ n ≤ 100; −100 ≤ values ≤ 100.

Example: `[[2, 1, 3], [6, 5, 4], [7, 8, 9]]` → `13` (1 → 5 → 7 or 1 → 4 → 8).

<details>
<summary>Hint</summary>

State: `dp[r][c]` = minimum sum of a falling path ending at (r, c). Transition: `matrix[r][c] + min(dp[r − 1][c − 1], dp[r − 1][c], dp[r − 1][c + 1])` (within bounds). Only the previous row is needed.

</details>

<details>
<summary>Answer</summary>

```java
public class MinFallingPathSum {

    static int minFallingPathSum(int[][] m) {
        int n = m.length;
        int[] prev = m[0].clone();
        for (int r = 1; r < n; r++) {
            int[] cur = new int[n];
            for (int c = 0; c < n; c++) {
                int best = prev[c];
                if (c > 0) best = Math.min(best, prev[c - 1]);
                if (c < n - 1) best = Math.min(best, prev[c + 1]);
                cur[c] = m[r][c] + best;
            }
            prev = cur;                                // rolling row: O(n) space
        }
        int answer = Integer.MAX_VALUE;
        for (int v : prev) answer = Math.min(answer, v);
        return answer;
    }

    public static void main(String[] args) {
        System.out.println(minFallingPathSum(new int[][] {{2, 1, 3}, {6, 5, 4}, {7, 8, 9}}) + " " + minFallingPathSum(new int[][] {{-19, 57}, {-40, -5}}));
    }
}
```

**Output:**

```text
13 -59
```

**Complexity:** O(n²) time, O(n) space.

</details>

### P2. Count strings built from fixed-length blocks

**Difficulty:** Medium · **Pattern:** Counting DP over length (unbounded choices)

Starting from an empty string, each step appends either `zero` copies of `'0'` or `one` copies of `'1'`. Count the distinct strings whose length is between `low` and `high` inclusive, mod 10⁹ + 7.

**Constraints:** 1 ≤ low ≤ high ≤ 10⁵; 1 ≤ zero, one ≤ low.

Example: low = 3, high = 3, zero = 1, one = 1 → `8`; low = 2, high = 3, zero = 1, one = 2 → `5`.

<details>
<summary>Hint</summary>

Different sequences of appends give different strings (the blocks are distinguishable by character). `dp[len]` = number of strings of exactly length len: `dp[len] = dp[len − zero] + dp[len − one]`, `dp[0] = 1`. Sum `dp[low … high]`.

</details>

<details>
<summary>Answer</summary>

```java
public class CountGoodStrings {

    static int countGoodStrings(int low, int high, int zero, int one) {
        final int MOD = 1_000_000_007;
        int[] dp = new int[high + 1];
        dp[0] = 1;                                     // the empty string
        long total = 0;
        for (int len = 1; len <= high; len++) {
            if (len >= zero) dp[len] = (dp[len] + dp[len - zero]) % MOD;
            if (len >= one) dp[len] = (dp[len] + dp[len - one]) % MOD;
            if (len >= low) total = (total + dp[len]) % MOD;
        }
        return (int) total;
    }

    public static void main(String[] args) {
        System.out.println(countGoodStrings(3, 3, 1, 1) + " " + countGoodStrings(2, 3, 1, 2));
    }
}
```

**Output:**

```text
8 5
```

**Complexity:** O(high) time and space. This is the stairs recurrence with step sizes `zero` and `one`.

</details>

### P3. Minimum difficulty of a job schedule

**Difficulty:** Hard · **Pattern:** Partition DP (split a sequence into d consecutive groups)

Jobs must be done in order over exactly d days, at least one job per day. A day's difficulty is the maximum difficulty of its jobs; the schedule's difficulty is the sum over days. Return the minimum schedule difficulty, or −1 if there are fewer jobs than days.

**Constraints:** 1 ≤ n ≤ 300; 1 ≤ d ≤ 10; 0 ≤ difficulty ≤ 1000.

Example: `[6, 5, 4, 3, 2, 1]`, d = 2 → `7` (day 1: first five jobs, max 6; day 2: job 1); `[9, 9, 9]`, d = 4 → `-1`.

<details>
<summary>Hint</summary>

State: `dp[k][i]` = minimum difficulty to do the first i jobs in k days. Transition: the last day takes jobs j … i − 1 for some j ≥ k − 1: `dp[k][i] = min over j of dp[k − 1][j] + max(jobs[j … i − 1])`. Iterate j downward from i − 1 to keep the running maximum in O(1).

</details>

<details>
<summary>Answer</summary>

```java
import java.util.Arrays;

public class JobScheduleDifficulty {

    static int minDifficulty(int[] jobs, int d) {
        int n = jobs.length;
        if (n < d) return -1;
        final int INF = Integer.MAX_VALUE / 2;
        int[][] dp = new int[d + 1][n + 1];
        for (int[] row : dp) Arrays.fill(row, INF);
        dp[0][0] = 0;
        for (int k = 1; k <= d; k++) {
            for (int i = k; i <= n; i++) {                 // at least one job per day
                int dayMax = 0;
                for (int j = i - 1; j >= k - 1; j--) {     // last day = jobs j..i-1
                    dayMax = Math.max(dayMax, jobs[j]);
                    dp[k][i] = Math.min(dp[k][i], dp[k - 1][j] + dayMax);
                }
            }
        }
        return dp[d][n];
    }

    public static void main(String[] args) {
        System.out.println(minDifficulty(new int[] {6, 5, 4, 3, 2, 1}, 2) + " " + minDifficulty(new int[] {9, 9, 9}, 4) + " " + minDifficulty(new int[] {1, 1, 1}, 3) + " "
                + minDifficulty(new int[] {7, 1, 7, 1, 7, 1}, 3));
    }
}
```

**Output:**

```text
7 -1 3 15
```

**Complexity:** O(d × n²) time, O(d × n) space (O(n) with two rows).

</details>
