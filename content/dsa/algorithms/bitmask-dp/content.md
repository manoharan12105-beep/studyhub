# Bitmask DP

> [!NOTE]
> **Advanced topic.** Bitmask DP appears when n is very small (typically n ≤ 20) and the state must remember **which items have been used**. Learn [Bit Manipulation](../bit-manipulation/content.md) and [Dynamic Programming](../dynamic-programming/content.md) first.

## Definition

**Bitmask DP** stores a **set** of chosen items as the bits of an integer `mask` (bit i = 1 means item i is used) and uses the mask as part of the DP state, for example `dp[mask][last]`. With n items there are 2ⁿ masks, so the method is exponential — but far faster than the n! orderings that brute force would try.

## Why It Matters

Some problems need the full set of used items in the state, because which ones remain changes the future: the **travelling salesman problem** (visit every city once), **assignment** (match n workers to n jobs), partitioning into equal groups, shortest path visiting all nodes. For n ≈ 15–20, 2ⁿ × n states is feasible where n! is not (20! ≈ 2.4 × 10¹⁸).

## Prerequisites

- [Bit Manipulation](../bit-manipulation/content.md) — `1 << i`, `mask & (1 << i)`, `mask | (1 << i)`.
- [Dynamic Programming](../dynamic-programming/content.md)

## Intuition

For the travelling salesman, the cost of finishing a tour depends only on **which cities are already visited** and **where you are now** — not on the order in which you visited them. Many different orders lead to the same (set, current city) state; DP solves each state once. A bitmask is a compact, array-indexable way to name the set.

## How It Works

### Bitmask basics

| Operation | Expression |
|-----------|------------|
| Is item i in the set? | `(mask & (1 << i)) != 0` |
| Add item i | `mask | (1 << i)` |
| Remove item i | `mask & ~(1 << i)` |
| Full set of n items | `(1 << n) − 1` |
| Number of items in the set | `Integer.bitCount(mask)` |

### Travelling salesman (Held–Karp)

1. **State:** `dp[mask][v]` = minimum cost of a path that starts at city 0, visits exactly the cities in `mask`, and ends at v (v ∈ mask).
2. **Base:** `dp[1][0] = 0` (only city 0 visited, standing at 0).
3. **Transition:** from `dp[mask][v]`, go to an unvisited city u: `dp[mask | (1 << u)][u] = min(…, dp[mask][v] + dist[v][u])`.
4. **Answer:** min over v of `dp[full][v] + dist[v][0]` (return to the start).

Processing masks in increasing numeric order is valid: adding a city always produces a larger mask.

### Assignment problem

`dp[mask]` = minimum cost to assign the first `bitCount(mask)` workers to the jobs in `mask`. Worker k = bitCount(mask) takes any free job j: `dp[mask | (1 << j)] = min(…, dp[mask] + cost[k][j])`. O(2ⁿ × n).

## Visual Explanation

```text
4 cities, masks written as binary (bit i = city i visited):

dp[0001][0] = 0                      start at city 0
dp[0011][1] = dist[0][1]             visited {0,1}, at 1
dp[0101][2] = dist[0][2]
dp[0111][2] = min(dp[0011][1] + dist[1][2], …)   visited {0,1,2}, at 2 — reached from {0,1}@1
...
answer = min over v of dp[1111][v] + dist[v][0]

states: 2^4 masks × 4 cities = 64 (instead of 3! = 6 orders here, but 2^20 × 20 ≈ 2·10^7 vs 19! ≈ 1.2·10^17 for n = 20)
```

## Pseudocode

```pseudocode
tsp(dist, n):
    dp[all][all] ← ∞; dp[1][0] ← 0
    for mask from 1 to 2ⁿ − 1:
        for v in mask:
            if dp[mask][v] = ∞: continue
            for u not in mask:
                next ← mask | (1 << u)
                dp[next][u] ← min(dp[next][u], dp[mask][v] + dist[v][u])
    return min over v of dp[full][v] + dist[v][0]
```

## Java Implementation

```java
import java.util.Arrays;

public class BitmaskDp {

    static int tsp(int[][] dist) {
        int n = dist.length, full = (1 << n) - 1;
        final int INF = Integer.MAX_VALUE / 2;
        int[][] dp = new int[1 << n][n];
        for (int[] row : dp) Arrays.fill(row, INF);
        dp[1][0] = 0;                                         // start at city 0
        for (int mask = 1; mask <= full; mask++) {
            if ((mask & 1) == 0) continue;                    // every tour starts at city 0
            for (int v = 0; v < n; v++) {
                if ((mask & (1 << v)) == 0 || dp[mask][v] == INF) continue;
                for (int u = 0; u < n; u++) {
                    if ((mask & (1 << u)) != 0) continue;     // already visited
                    int next = mask | (1 << u);
                    dp[next][u] = Math.min(dp[next][u], dp[mask][v] + dist[v][u]);
                }
            }
        }
        int best = INF;
        for (int v = 1; v < n; v++) best = Math.min(best, dp[full][v] + dist[v][0]);
        return n == 1 ? 0 : best;
    }

    static int assignment(int[][] cost) {
        int n = cost.length;
        int[] dp = new int[1 << n];
        Arrays.fill(dp, Integer.MAX_VALUE);
        dp[0] = 0;
        for (int mask = 0; mask < (1 << n); mask++) {
            if (dp[mask] == Integer.MAX_VALUE) continue;
            int worker = Integer.bitCount(mask);              // next worker to assign
            if (worker == n) continue;
            for (int job = 0; job < n; job++) {
                if ((mask & (1 << job)) == 0) {
                    int next = mask | (1 << job);
                    dp[next] = Math.min(dp[next], dp[mask] + cost[worker][job]);
                }
            }
        }
        return dp[(1 << n) - 1];
    }

    public static void main(String[] args) {
        int[][] dist = {{0, 10, 15, 20}, {10, 0, 35, 25}, {15, 35, 0, 30}, {20, 25, 30, 0}};
        System.out.println("TSP tour cost: " + tsp(dist));
        int[][] cost = {{9, 2, 7, 8}, {6, 4, 3, 7}, {5, 8, 1, 8}, {7, 6, 9, 4}};
        System.out.println("assignment cost: " + assignment(cost));
    }
}
```

**Output:**

```text
TSP tour cost: 80
assignment cost: 13
```

## Dry Run

Assignment with 4 workers (rows) and 4 jobs (columns), optimal 13 = worker 0 → job 1 (2), worker 1 → job 0 (6), worker 2 → job 2 (1), worker 3 → job 3 (4):

| mask (jobs taken) | worker assigned next | best cost so far |
|-------------------|----------------------|------------------|
| 0000 | 0 | 0 |
| 0010 (job 1) | 1 | 2 |
| 0011 (jobs 0, 1) | 2 | 2 + 6 = 8 |
| 0111 (jobs 0, 1, 2) | 3 | 8 + 1 = 9 |
| 1111 | — | 9 + 4 = 13 |

## Complexity Analysis

| Problem | Time | Space |
|---------|------|-------|
| TSP (Held–Karp) | O(2ⁿ × n²) | O(2ⁿ × n) |
| Assignment | O(2ⁿ × n) | O(2ⁿ) |
| Brute force over orders | O(n!) | O(n) |

n = 16: 2¹⁶ × 16² ≈ 1.7 × 10⁷ — fine. n = 25: 2²⁵ × 625 ≈ 2 × 10¹⁰ — too slow.

## Properties

- The mask encodes a set; numeric order of masks is a valid processing order when transitions only add elements.
- Memory is often the limit (2ⁿ × n entries).

## Variations

- **Shortest path visiting all nodes** — BFS over (node, mask) states.
- **Partition into k equal-sum subsets** — `dp[mask]` = current partial bucket sum.
- **Iterating submasks** — `for (sub = mask; sub > 0; sub = (sub − 1) & mask)`; over all masks totals O(3ⁿ).
- **Hamiltonian path existence** — boolean `dp[mask][v]`.

## Comparison

| Approach | Time for n = 15 |
|----------|-----------------|
| All permutations | 15! ≈ 1.3 × 10¹² |
| Bitmask DP (TSP) | 2¹⁵ × 15² ≈ 7.4 × 10⁶ |

## Edge Cases

- n = 1 (no travel needed).
- Unreachable transitions (∞ distances) — guard against overflow when adding to ∞.
- Masks beyond 31 items do not fit in `int` (use `long`, but 2³² states are already infeasible).

## Advantages

- Exact answers for small NP-hard problems far faster than brute force.

## Disadvantages

- Exponential; only for n ≲ 20; memory heavy.

## When to Use

- n ≤ ~20 and the state must remember **which** items are used (not just how many).
- "Visit all", "assign each to exactly one", "partition into groups" with tiny n.

## Common Mistakes

- Operator precedence: write `(mask & (1 << i)) != 0` with parentheses.
- Allocating `dp[1 << n][n]` for n = 25 (out of memory).
- Forgetting the return to the start city in TSP.

## Key Takeaways

- A bitmask names a subset; `dp[mask][…]` remembers which items are used.
- TSP: `dp[mask][v]`, O(2ⁿ n²); assignment: `dp[mask]`, O(2ⁿ n).
- Exponential but vastly better than n! — use when n is tiny.
