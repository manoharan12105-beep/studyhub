# Bitmask DP — Practice

### P1. Shortest path visiting all nodes

**Difficulty:** Hard · **Pattern:** BFS over (node, visited-mask) states

In an undirected, connected, unweighted graph with n nodes, return the length of the shortest walk that visits every node (you may start and end anywhere and revisit nodes and edges).

**Constraints:** 1 ≤ n ≤ 12.

Example: `[[1,2,3],[0],[0],[0]]` (a star) → `4` (1 → 0 → 2 → 0 → 3).

<details>
<summary>Hint</summary>

The state must contain the current node **and** the set of visited nodes. All edges cost 1, so BFS from every start state (node i, mask {i}) at once finds the shortest walk.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class VisitAllNodes {

    static int shortestPathLength(int[][] graph) {
        int n = graph.length, full = (1 << n) - 1;
        boolean[][] seen = new boolean[n][1 << n];
        Queue<int[]> q = new ArrayDeque<>();
        for (int i = 0; i < n; i++) {                       // multi-source: start anywhere
            q.offer(new int[] {i, 1 << i});
            seen[i][1 << i] = true;
        }
        for (int steps = 0; !q.isEmpty(); steps++) {
            for (int k = q.size(); k > 0; k--) {
                int[] s = q.poll();
                if (s[1] == full) return steps;
                for (int next : graph[s[0]]) {
                    int mask = s[1] | (1 << next);
                    if (!seen[next][mask]) {
                        seen[next][mask] = true;
                        q.offer(new int[] {next, mask});
                    }
                }
            }
        }
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(shortestPathLength(new int[][] {{1, 2, 3}, {0}, {0}, {0}}) + " "
                + shortestPathLength(new int[][] {{1}, {0, 2, 4}, {1, 3, 4}, {2}, {1, 2}}) + " " + shortestPathLength(new int[][] {{}}));
    }
}
```

**Output:**

```text
4 4 0
```

**Complexity:** O(2ⁿ × n²) time (2ⁿ × n states, each scanning up to n neighbours), O(2ⁿ × n) space.

</details>

### P2. Partition into k equal-sum subsets

**Difficulty:** Hard · **Pattern:** dp[mask] = filled amount of the current bucket

Can the array be divided into k non-empty subsets with equal sums?

**Constraints:** 1 ≤ k ≤ n ≤ 16; values ≤ 10⁴.

Example: `[4, 3, 2, 3, 5, 2, 1]`, k = 4 → `true` (5, 1+4, 2+3, 2+3).

<details>
<summary>Hint</summary>

Target = total / k. Fill buckets one at a time: `dp[mask]` = amount in the current (partially filled) bucket after using the elements in `mask`, or −1 if unreachable. Adding element i is allowed if it does not overflow the current bucket; a full bucket wraps back to 0.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.Arrays;

public class PartitionKSubsets {

    static boolean canPartition(int[] nums, int k) {
        int total = Arrays.stream(nums).sum();
        if (total % k != 0) return false;
        int target = total / k, n = nums.length;
        int[] dp = new int[1 << n];
        Arrays.fill(dp, -1);
        dp[0] = 0;
        for (int mask = 0; mask < (1 << n); mask++) {
            if (dp[mask] == -1) continue;
            for (int i = 0; i < n; i++) {
                int next = mask | (1 << i);
                if (next != mask && dp[next] == -1 && dp[mask] + nums[i] <= target) {
                    dp[next] = (dp[mask] + nums[i]) % target;     // full bucket → start the next one at 0
                }
            }
        }
        return dp[(1 << n) - 1] == 0;
    }

    public static void main(String[] args) {
        System.out.println(canPartition(new int[] {4, 3, 2, 3, 5, 2, 1}, 4) + " " + canPartition(new int[] {1, 2, 3, 4}, 3));
    }
}
```

**Output:**

```text
true false
```

**Complexity:** O(2ⁿ × n) time, O(2ⁿ) space. The amount in the current bucket is determined by the mask (sum of used elements mod target), so one value per mask suffices.

</details>
