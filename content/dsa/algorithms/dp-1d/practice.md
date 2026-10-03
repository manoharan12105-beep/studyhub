# 1D Dynamic Programming — Practice

### P1. House robber in a circle

**Difficulty:** Medium · **Pattern:** Split a circular constraint into two linear cases

Houses are arranged in a circle (the first and last are adjacent). No two adjacent houses can both be robbed. Return the maximum loot.

**Constraints:** 1 ≤ n ≤ 100.

Example: `[2, 3, 2]` → `3`; `[1, 2, 3, 1]` → `4`.

<details>
<summary>Hint</summary>

The first and last house cannot both be robbed, so either the first house is excluded or the last house is. Solve the linear problem on each range and take the better.

</details>

<details>
<summary>Answer</summary>

```java
public class HouseRobberCircle {

    static int rob(int[] money) {
        if (money.length == 1) return money[0];
        return Math.max(robRange(money, 0, money.length - 2), robRange(money, 1, money.length - 1));
    }

    private static int robRange(int[] money, int from, int to) {
        int prev2 = 0, prev1 = 0;
        for (int i = from; i <= to; i++) {
            int current = Math.max(prev1, prev2 + money[i]);
            prev2 = prev1;
            prev1 = current;
        }
        return prev1;
    }

    public static void main(String[] args) {
        System.out.println(rob(new int[] {2, 3, 2}) + " " + rob(new int[] {1, 2, 3, 1}) + " " + rob(new int[] {5}));
    }
}
```

**Output:**

```text
3 4 5
```

**Complexity:** O(n) time, O(1) space.

</details>

### P2. Delete and earn

**Difficulty:** Medium · **Pattern:** Transform into house robber over values

Pick a number x to earn x points; every occurrence of x − 1 and x + 1 is then deleted. You may pick any number of times. Return the maximum points.

**Constraints:** 1 ≤ n ≤ 2 × 10⁴; 1 ≤ values ≤ 10⁴.

Example: `[3, 4, 2]` → `6`; `[2, 2, 3, 3, 3, 4]` → `9`.

<details>
<summary>Hint</summary>

Taking x once means you may as well take all copies: total[x] = x × count(x). Choosing value x forbids x − 1 and x + 1 — adjacent values, like adjacent houses.

</details>

<details>
<summary>Answer</summary>

```java
public class DeleteAndEarn {

    static int deleteAndEarn(int[] nums) {
        int max = 0;
        for (int x : nums) max = Math.max(max, x);
        int[] total = new int[max + 1];
        for (int x : nums) total[x] += x;                 // all copies of x are taken together
        int prev2 = 0, prev1 = 0;
        for (int v = 1; v <= max; v++) {                  // house robber over values 1..max
            int current = Math.max(prev1, prev2 + total[v]);
            prev2 = prev1;
            prev1 = current;
        }
        return prev1;
    }

    public static void main(String[] args) {
        System.out.println(deleteAndEarn(new int[] {3, 4, 2}) + " " + deleteAndEarn(new int[] {2, 2, 3, 3, 3, 4}));
    }
}
```

**Output:**

```text
6 9
```

**Complexity:** O(n + V) time, O(V) space, V = maximum value.

</details>

### P3. Maximum product subarray

**Difficulty:** Medium · **Pattern:** Track max and min ending at i

Return the largest product of a contiguous non-empty subarray.

**Constraints:** 1 ≤ n ≤ 2 × 10⁴; −10 ≤ values ≤ 10; the answer fits in `int`.

Example: `[2, 3, -2, 4]` → `6`; `[-2, 0, -1]` → `0`; `[-2, 3, -4]` → `24`.

<details>
<summary>Hint</summary>

A negative number swaps the roles of the largest and smallest products ending at the previous position.

</details>

<details>
<summary>Answer</summary>

```java
public class MaxProductSubarray {

    static int maxProduct(int[] nums) {
        int maxEnding = nums[0], minEnding = nums[0], best = nums[0];
        for (int i = 1; i < nums.length; i++) {
            int x = nums[i];
            int candidateMax = Math.max(x, Math.max(maxEnding * x, minEnding * x));
            int candidateMin = Math.min(x, Math.min(maxEnding * x, minEnding * x));
            maxEnding = candidateMax;                   // both computed from the OLD values
            minEnding = candidateMin;
            best = Math.max(best, maxEnding);
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(maxProduct(new int[] {2, 3, -2, 4}) + " " + maxProduct(new int[] {-2, 0, -1}) + " " + maxProduct(new int[] {-2, 3, -4}));
    }
}
```

**Output:**

```text
6 0 24
```

**Complexity:** O(n) time, O(1) space.

</details>

### P4. Perfect squares

**Difficulty:** Medium · **Pattern:** dp over amounts, min over choices

Return the least number of perfect squares (1, 4, 9, 16, …) that sum to n.

**Constraints:** 1 ≤ n ≤ 10⁴.

Example: 12 → `3` (4 + 4 + 4); 13 → `2` (4 + 9).

<details>
<summary>Hint</summary>

`dp[i] = 1 + min over squares s ≤ i of dp[i − s]`, with dp[0] = 0.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.Arrays;

public class PerfectSquares {

    static int numSquares(int n) {
        int[] dp = new int[n + 1];
        Arrays.fill(dp, Integer.MAX_VALUE);
        dp[0] = 0;
        for (int i = 1; i <= n; i++) {
            for (int s = 1; s * s <= i; s++) {
                dp[i] = Math.min(dp[i], dp[i - s * s] + 1);     // last square used is s*s
            }
        }
        return dp[n];
    }

    public static void main(String[] args) {
        System.out.println(numSquares(12) + " " + numSquares(13) + " " + numSquares(1) + " " + numSquares(7));
    }
}
```

**Output:**

```text
3 2 1 4
```

**Complexity:** O(n √n) time, O(n) space. (Lagrange's four-square theorem guarantees the answer is at most 4.)

</details>
