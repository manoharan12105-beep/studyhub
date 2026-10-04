# Dynamic Programming Pattern

## What Is the Pattern

The **dynamic programming (DP) pattern** solves a problem whose answer can be built from answers to **smaller overlapping subproblems**, storing each subproblem's answer so it is computed once. As a problem-solving pattern, the work is recognising that DP applies and then designing it in five steps:

1. **State** — what a subproblem is: `dp[i]`, `dp[i][j]`, `dp[i][capacity]`, `dp[mask][v]`.
2. **Transition** — how a state's answer comes from smaller states (the choices at this step).
3. **Base cases** — the smallest states, answered directly.
4. **Order** — compute states so every dependency is ready (or use memoised recursion).
5. **Answer** — which state (or combination) is the final result.

Tiny example: ways to climb 4 stairs taking 1 or 2 steps: `ways[n] = ways[n − 1] + ways[n − 2]`, `ways[0] = ways[1] = 1` → 1, 1, 2, 3, 5.

Foundations (memoisation vs tabulation, optimal substructure, space optimisation) are in [Dynamic Programming](../../algorithms/dynamic-programming/content.md); the families of DP problems each have their own topic (linked in Variations).

## Why It Works

**Optimal substructure:** an optimal solution contains optimal solutions to its subproblems, so a correct recurrence exists. **Overlapping subproblems:** plain recursion solves the same subproblems many times (often exponentially many); storing them turns the cost into (number of states) × (work per transition). For example, the stairs recursion makes O(φⁿ) calls, the DP makes n.

## Recognition Clues

| Clue in the problem | Why it points here |
|---------------------|--------------------|
| "Count the number of ways …" | counts add up over choices — DP, not greedy |
| "Minimum/maximum cost/length/profit" where a greedy rule has a counterexample | optimise over all choices with memory |
| "Can you reach / partition / form …?" (yes/no over many combinations) | boolean DP (subset sum, word break) |
| Decisions made in sequence where earlier choices limit later ones (take/skip, buy/sell, cooldown) | state = position + what you must remember |
| Two strings/sequences compared ("edit", "common", "interleave", "match") | `dp[i][j]` over prefixes |
| Grid paths moving only right/down | `dp[r][c]` from top and left |
| Small n (≤ 20) with "use each item once, any order" | bitmask DP |
| Brute force recursion repeats the same arguments | memoise it |

## Typical Problem Structure

- Input: an array, one or two strings, a grid, a capacity/target, or a small set.
- Output: a count (often mod 10⁹ + 7), an optimum value, or a boolean.
- Constraints hint at the state size: n ≤ 10⁵ → O(n) or O(n log n) states; n, m ≤ 1000–5000 → `dp[n][m]`; n ≤ 20 → 2ⁿ states.

## Template

```pseudocode
// top-down (memoisation)
solve(state):
    if state is a base case: return base value
    if memo has state: return memo[state]
    memo[state] ← combine over choices c of solve(next(state, c)) (+ cost of c)
    return memo[state]

// bottom-up (tabulation)
dp[base states] ← base values
for states in dependency order:
    dp[state] ← combine over choices of dp[smaller states]
return dp[answer state]
```

## Java Template

```java
import java.util.*;

public class DpTemplates {

    static long[] memo;

    // Top-down: ways to climb n stairs with steps 1 or 2.
    static long ways(int n) {
        if (n <= 1) return 1;                          // base cases
        if (memo[n] != -1) return memo[n];
        return memo[n] = ways(n - 1) + ways(n - 2);    // transition
    }

    // Bottom-up with O(1) space: only the last two states are needed.
    static long waysIterative(int n) {
        long prev = 1, cur = 1;
        for (int i = 2; i <= n; i++) {
            long next = prev + cur;
            prev = cur;
            cur = next;
        }
        return cur;
    }

    public static void main(String[] args) {
        memo = new long[51];
        Arrays.fill(memo, -1);
        System.out.println(ways(4) + " " + ways(50) + " " + waysIterative(50));
    }
}
```

**Output:**

```text
5 20365011074 20365011074
```

## Example Problem

**Minimum cost for travel passes.** You travel on given days of the year (sorted, 1 … 365). Passes cost `costs[0]` for 1 day, `costs[1]` for 7 consecutive days, `costs[2]` for 30 consecutive days. Return the minimum total cost to cover all travel days. Example: days `[1, 4, 6, 7, 8, 20]`, costs `[2, 7, 15]` → `11` (1-day on day 1, 7-day for days 4–10, 1-day on day 20).

- **Greedy fails:** "buy the pass with the best price per day" depends on future days — a 7-day pass is only worth it if enough travel days fall in the window.
- **Brute force:** at each travel day, try all three passes recursively — O(3ⁿ), with the same suffixes solved again and again.
- **DP design:**
  - State: `dp[d]` = minimum cost to cover all travel days from day d to 365.
  - Transition: if d is not a travel day, `dp[d] = dp[d + 1]`; otherwise `dp[d] = min(costs[0] + dp[d + 1], costs[1] + dp[d + 7], costs[2] + dp[d + 30])`.
  - Base: `dp[d] = 0` for d > 365.
  - Order: d from 365 down to 1. Answer: `dp[1]`.

```java
public class MinCostTickets {

    static int mincostTickets(int[] days, int[] costs) {
        boolean[] travel = new boolean[366];
        for (int d : days) travel[d] = true;
        int[] dp = new int[366 + 30];                  // dp[d] = 0 for d > 365 (padding avoids bounds checks)
        for (int d = 365; d >= 1; d--) {
            if (!travel[d]) {
                dp[d] = dp[d + 1];                     // nothing to cover today
            } else {
                dp[d] = Math.min(costs[0] + dp[d + 1], Math.min(costs[1] + dp[d + 7], costs[2] + dp[d + 30]));
            }
        }
        return dp[1];
    }

    public static void main(String[] args) {
        System.out.println(mincostTickets(new int[] {1, 4, 6, 7, 8, 20}, new int[] {2, 7, 15}) + " "
                + mincostTickets(new int[] {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 30, 31}, new int[] {2, 7, 15}));
    }
}
```

**Output:**

```text
11 17
```

## Dry Run

Days `[1, 4, 6, 7, 8, 20]`, costs `[2, 7, 15]`. Only travel days change the value; other days copy `dp[d + 1]`.

| d | dp[d + 1] + 2 | dp[d + 7] + 7 | dp[d + 30] + 15 | dp[d] |
|---|---------------|---------------|-----------------|-------|
| 20 | 0 + 2 = 2 | 0 + 7 = 7 | 0 + 15 = 15 | 2 |
| 8 | dp[9] = 2 → 4 | dp[15] = 2 → 9 | dp[38] = 0 → 15 | 4 |
| 7 | dp[8] = 4 → 6 | dp[14] = 2 → 9 | 15 | 6 |
| 6 | dp[7] = 6 → 8 | dp[13] = 2 → 9 | 15 | 8 |
| 4 | dp[5] = 8 → 10 | dp[11] = 2 → 9 | 15 | 9 |
| 1 | dp[2] = 9 → 11 | dp[8] = 4 → 11 | dp[31] = 0 → 15 | 11 |

Answer `dp[1] = 11`.

## Common Mistakes

- A state that forgets information the future depends on (e.g. holding a stock or not; last colour used).
- Wrong iteration order: reading a state before it is computed.
- Base cases off by one (empty prefix, zero capacity).
- In 0/1 knapsack with a 1D array, iterating capacity upwards (reuses an item) — iterate downwards.
- Using greedy without a proof for an optimisation problem that needs DP.
- Overflow in counting DP — take `% MOD` at every addition.

## Variations

| Family | Typical state | Topic |
|--------|---------------|-------|
| Linear sequences | `dp[i]` over a prefix/suffix | [1D DP](../../algorithms/dp-1d/content.md) |
| Grids | `dp[r][c]` | [2D Grid DP](../../algorithms/dp-2d-grid/content.md) |
| Knapsack / subset sums | `dp[i][capacity]` or `dp[capacity]` | [Knapsack DP](../../algorithms/knapsack-dp/content.md) |
| Subsequences (LIS, LCS-style) | `dp[i]` or `dp[i][j]` | [Subsequence DP](../../algorithms/subsequence-dp/content.md) |
| Two strings (edit distance, matching) | `dp[i][j]` over prefixes | [String DP](../../algorithms/string-dp/content.md) |
| Partitions and intervals | `dp[i]` over cut points, `dp[l][r]` | [Partition and Interval DP](../../algorithms/partition-and-interval-dp/content.md) |
| State machines (buy/sell/cooldown) | `dp[i][state]` | [Stock DP](../../algorithms/stock-dp/content.md) |
| Trees | values per node from children | [Tree DP](../../algorithms/tree-dp/content.md) |
| Subsets of a small set | `dp[mask][…]` | [Bitmask DP](../../algorithms/bitmask-dp/content.md) |

## Complexity

**Time = number of states × work per state; space = number of states stored.**

| Example | States | Work per state | Time | Space |
|---------|--------|----------------|------|-------|
| Travel passes | 365 | O(1) | O(365) | O(365) |
| Edit distance | n × m | O(1) | O(n m) | O(n m), or O(min(n, m)) rolling |
| Matrix-chain style interval DP | n² | O(n) | O(n³) | O(n²) |
| Bitmask TSP | 2ⁿ × n | O(n) | O(2ⁿ n²) | O(2ⁿ n) |

## When Not to Use It

- Subproblems do not overlap — plain [divide and conquer](../divide-and-conquer-pattern/content.md) or recursion.
- A greedy choice is provably optimal — greedy is simpler and faster.
- You must list **all** solutions (output is exponential) — [backtracking](../backtracking-pattern/content.md).
- The state space is too large (e.g. a value dimension of 10⁹) — look for another formulation.

## Key Takeaways

- Counting, or optimising when greedy fails, with repeated subproblems → DP.
- Design: state → transition → base → order → answer; complexity = states × transition cost.
- Recognise the family (1D, grid, knapsack, two strings, intervals, state machine, tree, bitmask) to find the state quickly.
