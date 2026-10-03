# Knapsack DP (0/1 and Unbounded) — Practice

### P1. Partition equal subset sum

**Difficulty:** Medium · **Pattern:** 0/1 subset sum to total / 2

Can the array be split into two subsets with equal sums?

**Constraints:** 1 ≤ n ≤ 200; 1 ≤ values ≤ 100.

Example: `[1, 5, 11, 5]` → `true` ({1, 5, 5} and {11}); `[1, 2, 3, 5]` → `false`.

<details>
<summary>Hint</summary>

Equal halves means one subset sums to total / 2 (so the total must be even). Each number is used at most once.

</details>

<details>
<summary>Answer</summary>

```java
public class PartitionEqualSubset {

    static boolean canPartition(int[] nums) {
        int total = 0;
        for (int x : nums) total += x;
        if (total % 2 == 1) return false;
        int target = total / 2;
        boolean[] reachable = new boolean[target + 1];
        reachable[0] = true;
        for (int x : nums) {
            for (int s = target; s >= x; s--) {          // downwards: each number once
                reachable[s] |= reachable[s - x];
            }
        }
        return reachable[target];
    }

    public static void main(String[] args) {
        System.out.println(canPartition(new int[] {1, 5, 11, 5}) + " " + canPartition(new int[] {1, 2, 3, 5}));
    }
}
```

**Output:**

```text
true false
```

**Complexity:** O(n × total) time, O(total) space.

</details>

### P2. Coin change II — number of combinations

**Difficulty:** Medium · **Pattern:** Unbounded counting, coins in the outer loop

Count the combinations of coins (unlimited supply) that make `amount`. Order does not matter.

**Constraints:** 1 ≤ coins ≤ 300; amount ≤ 5000; the answer fits in `int`.

Example: amount 5, coins `[1, 2, 5]` → `4` (5, 2+2+1, 2+1+1+1, 1×5).

<details>
<summary>Hint</summary>

Put coins in the outer loop: each combination is then built in a fixed coin order, so 1 + 2 and 2 + 1 are not both counted.

</details>

<details>
<summary>Answer</summary>

```java
public class CoinChangeWays {

    static int combinations(int amount, int[] coins) {
        int[] ways = new int[amount + 1];
        ways[0] = 1;                                         // one way to make 0: no coins
        for (int coin : coins) {
            for (int a = coin; a <= amount; a++) {
                ways[a] += ways[a - coin];
            }
        }
        return ways[amount];
    }

    static int orderedSequences(int amount, int[] coins) { // loops swapped: counts permutations
        int[] ways = new int[amount + 1];
        ways[0] = 1;
        for (int a = 1; a <= amount; a++) {
            for (int coin : coins) {
                if (coin <= a) ways[a] += ways[a - coin];
            }
        }
        return ways[amount];
    }

    public static void main(String[] args) {
        System.out.println(combinations(5, new int[] {1, 2, 5}) + " " + combinations(3, new int[] {2}) + " (ordered sequences for 5: " + orderedSequences(5, new int[] {1, 2, 5}) + ")");
    }
}
```

**Output:**

```text
4 0 (ordered sequences for 5: 9)
```

**Complexity:** O(n × amount) time, O(amount) space.

</details>

### P3. Target sum

**Difficulty:** Medium · **Pattern:** Reduce ± assignment to counting subsets

Assign + or − to every number so that the expression equals `target`. Count the assignments.

**Constraints:** 1 ≤ n ≤ 20; 0 ≤ values ≤ 1000; |target| ≤ 1000.

Example: `[1, 1, 1, 1, 1]`, target 3 → `5`.

<details>
<summary>Hint</summary>

If P is the sum of the + numbers and N of the − numbers: P − N = target and P + N = total, so P = (total + target)/2. Count subsets with sum P (zeros double the count — the DP handles that automatically).

</details>

<details>
<summary>Answer</summary>

**Approach:** Brute force tries 2ⁿ sign patterns. The algebra turns it into 0/1 counting knapsack. If (total + target) is odd or |target| > total, the answer is 0.

```java
public class TargetSum {

    static int findTargetSumWays(int[] nums, int target) {
        int total = 0;
        for (int x : nums) total += x;
        if (Math.abs(target) > total || (total + target) % 2 != 0) return 0;
        int p = (total + target) / 2;
        int[] count = new int[p + 1];
        count[0] = 1;
        for (int x : nums) {
            for (int s = p; s >= x; s--) {
                count[s] += count[s - x];
            }
        }
        return count[p];
    }

    public static void main(String[] args) {
        System.out.println(findTargetSumWays(new int[] {1, 1, 1, 1, 1}, 3) + " " + findTargetSumWays(new int[] {1}, 1) + " " + findTargetSumWays(new int[] {0, 0, 1}, 1));
    }
}
```

**Output:**

```text
5 1 4
```

**Complexity:** O(n × P) time, O(P) space. (`[0, 0, 1]` → 4: each 0 can be + or −.)

</details>

### P4. Ones and zeroes

**Difficulty:** Hard · **Pattern:** 0/1 knapsack with two capacities

Given binary strings, find the size of the largest subset that contains at most m zeros and n ones in total.

**Constraints:** 1 ≤ strings ≤ 600; 1 ≤ m, n ≤ 100.

Example: `["10","0001","111001","1","0"]`, m = 5, n = 3 → `4` ({"10", "0001", "1", "0"}).

<details>
<summary>Hint</summary>

Each string is an item with two weights (zeros, ones) and value 1. `dp[z][o]` = largest subset within z zeros and o ones; iterate both capacities downwards.

</details>

<details>
<summary>Answer</summary>

```java
public class OnesAndZeroes {

    static int findMaxForm(String[] strs, int m, int n) {
        int[][] dp = new int[m + 1][n + 1];
        for (String s : strs) {
            int zeros = 0, ones = 0;
            for (char c : s.toCharArray()) {
                if (c == '0') zeros++; else ones++;
            }
            for (int z = m; z >= zeros; z--) {           // both dimensions downwards: each string once
                for (int o = n; o >= ones; o--) {
                    dp[z][o] = Math.max(dp[z][o], dp[z - zeros][o - ones] + 1);
                }
            }
        }
        return dp[m][n];
    }

    public static void main(String[] args) {
        System.out.println(findMaxForm(new String[] {"10", "0001", "111001", "1", "0"}, 5, 3) + " " + findMaxForm(new String[] {"10", "0", "1"}, 1, 1));
    }
}
```

**Output:**

```text
4 2
```

**Complexity:** O(L + k × m × n) time for k strings of total length L; O(m × n) space.

</details>
