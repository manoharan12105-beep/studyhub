# Monotonic Queue — Practice

### P1. Maximum score jumping at most k steps

**Difficulty:** Medium · **Pattern:** DP with a sliding-window maximum

Start at index 0 of `nums`; from index i you may jump to any index in [i + 1, min(n − 1, i + k)]. Your score is the sum of the values at visited indices (including the first and the last). Return the maximum score on reaching index n − 1.

**Constraints:** 1 ≤ n, k ≤ 10⁵; −10⁴ ≤ nums[i] ≤ 10⁴.

Example: `[1, -1, -2, 4, -7, 3]`, k = 2 → `7` (1 → −1 → 4 → 3); `[10, -5, -2, 4, 0, 3]`, k = 3 → `17`.

<details>
<summary>Hint</summary>

`dp[i] = nums[i] + max(dp[i − k … i − 1])`. Computing the max by scanning is O(n × k) = 10¹⁰. Keep a decreasing deque of indices by dp value; its front is the window maximum.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class JumpMaxScore {

    static int maxResult(int[] nums, int k) {
        int n = nums.length;
        int[] dp = new int[n];
        dp[0] = nums[0];
        Deque<Integer> dq = new ArrayDeque<>();
        dq.offerLast(0);
        for (int i = 1; i < n; i++) {
            if (dq.peekFirst() < i - k) dq.pollFirst();               // out of jump range
            dp[i] = nums[i] + dp[dq.peekFirst()];                       // best reachable predecessor
            while (!dq.isEmpty() && dp[dq.peekLast()] <= dp[i]) dq.pollLast();
            dq.offerLast(i);
        }
        return dp[n - 1];
    }

    public static void main(String[] args) {
        System.out.println(maxResult(new int[] {1, -1, -2, 4, -7, 3}, 2) + " " + maxResult(new int[] {10, -5, -2, 4, 0, 3}, 3) + " "
                + maxResult(new int[] {1, -5, -20, 4, -1, 3, -6, -3}, 2));
    }
}
```

**Output:**

```text
7 17 0
```

**Complexity:** O(n) time, O(n) space for dp (the deque holds at most k + 1 indices).

</details>

### P2. Shortest subarray with sum at least K

**Difficulty:** Hard · **Pattern:** Increasing deque of prefix sums

Return the length of the shortest non-empty contiguous subarray with sum ≥ K, or −1. Values **may be negative**.

**Constraints:** 1 ≤ n ≤ 10⁵; −10⁵ ≤ values ≤ 10⁵; 1 ≤ K ≤ 10⁹.

Example: `[2, -1, 2]`, K = 3 → `3`; `[1, 2]`, K = 4 → `-1`; `[84, -37, 32, 40, 95]`, K = 167 → `3`.

<details>
<summary>Hint</summary>

A sliding window fails because of negatives. With prefix sums P, you want the largest j < i with P[i] − P[j] ≥ K. Keep an increasing deque of indices by P: pop from the **front** while P[i] − P[front] ≥ K (record the length — that front will never give a shorter answer later); pop from the **back** while P[back] ≥ P[i] (a later, smaller prefix is a better start).

</details>

<details>
<summary>Answer</summary>

**Approach:** Both pops are justified by domination: a front start that already works for i would only give longer subarrays for later ends; a back start with a larger prefix and an earlier index is worse than i in every future comparison.

```java
import java.util.*;

public class ShortestSubarraySumAtLeastK {

    static int shortestSubarray(int[] a, int k) {
        int n = a.length;
        long[] p = new long[n + 1];
        for (int i = 0; i < n; i++) p[i + 1] = p[i] + a[i];
        Deque<Integer> dq = new ArrayDeque<>();
        int best = n + 1;
        for (int i = 0; i <= n; i++) {
            while (!dq.isEmpty() && p[i] - p[dq.peekFirst()] >= k) best = Math.min(best, i - dq.pollFirst());
            while (!dq.isEmpty() && p[dq.peekLast()] >= p[i]) dq.pollLast();
            dq.offerLast(i);
        }
        return best == n + 1 ? -1 : best;
    }

    public static void main(String[] args) {
        System.out.println(shortestSubarray(new int[] {2, -1, 2}, 3) + " " + shortestSubarray(new int[] {1, 2}, 4) + " " + shortestSubarray(new int[] {84, -37, 32, 40, 95}, 167));
    }
}
```

**Output:**

```text
3 -1 3
```

**Complexity:** O(n) time, O(n) space.

</details>
