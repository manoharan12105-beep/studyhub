# Dynamic Programming

## Definition

**Dynamic programming (DP)** solves a problem by breaking it into **overlapping subproblems**, solving each subproblem **once**, and storing its answer for reuse. It applies when the problem has **optimal substructure** (an optimal answer is built from optimal answers to subproblems). DP is implemented top-down with **memoization** (recursion + cache) or bottom-up with **tabulation** (filling a table in dependency order).

## Why It Matters

DP turns exponential brute-force searches into polynomial algorithms: naive Fibonacci makes ~1.6ⁿ calls, DP makes n. It is the most feared interview topic because there is no single template — but there is a reliable **process**: define the state, write the transition, set the base cases, choose the order. Once you can do that, the many DP "patterns" are variations of one idea.

## Prerequisites

- [Recursion](../recursion/content.md) — DP starts as a recursive formulation.
- [Recurrence Relations](../../fundamentals/recurrence-relations/content.md)

## Intuition

Asked "what is 1 + 1 + 1 + 1 + 1 + 1 + 1?" you count 7. Add one more "+ 1" and you answer 8 instantly — you **remembered** 7 instead of recounting. DP is exactly that: never recompute something you already know.

### The two properties

| Property | Meaning | Example |
|----------|---------|---------|
| **Overlapping subproblems** | the same smaller problem is needed many times | fib(5) needs fib(3) twice, fib(2) three times |
| **Optimal substructure** | the optimal answer combines optimal answers of subproblems | the shortest path to C through B uses the shortest path to B |

Without overlap, plain recursion / divide and conquer is enough (merge sort's halves never repeat). Without optimal substructure, DP does not apply (longest **simple** path: the best path to B may use vertices the rest of the path needs).

## How It Works

### The DP process (five steps)

1. **State:** what parameters identify a subproblem? Write it as a sentence: "`dp[i]` = number of ways to reach step i". The state must contain everything the future depends on.
2. **Transition (recurrence):** how does a state depend on smaller states? "`dp[i] = dp[i − 1] + dp[i − 2]`" (last move was 1 step or 2 steps).
3. **Base cases:** the smallest states, answered directly: `dp[0] = 1`, `dp[1] = 1`.
4. **Order / answer:** compute states so that dependencies are ready first (increasing i), and say which state is the answer (`dp[n]`).
5. **Complexity:** time = number of states × work per transition; space = number of states (often reducible).

### From recursion to DP — four stages

Climbing stairs: n steps, climb 1 or 2 at a time; count the ways.

| Stage | Idea | Time | Space |
|-------|------|------|-------|
| 1. Plain recursion | `ways(n) = ways(n−1) + ways(n−2)` | O(φⁿ) ≈ O(1.618ⁿ) | O(n) stack |
| 2. **Memoization** (top-down) | same recursion, cache results in `memo[n]` | O(n) | O(n) memo + O(n) stack |
| 3. **Tabulation** (bottom-up) | fill `dp[0..n]` from small to large | O(n) | O(n) |
| 4. **State compression** | `dp[i]` needs only the last two values → two variables | O(n) | O(1) |

### Memoization vs tabulation

| | Memoization (top-down) | Tabulation (bottom-up) |
|---|------------------------|------------------------|
| How | recursion + cache | loops over a table |
| Computes | only the states actually needed | all states in the table |
| Order | automatic (recursion handles it) | you must choose a valid order |
| Risk | stack overflow for deep recursion | none |
| Space optimisation | hard | natural (keep only needed rows) |
| Ease of writing | closest to the recurrence | needs the order worked out |

Start with memoization when the recurrence is clear but the order is not; convert to tabulation for speed, stack safety and space savings.

### State compression

If `dp[i]` only reads `dp[i − 1]` and `dp[i − 2]`, keep two variables. If a 2D table's row i only reads row i − 1, keep two rows (or one row updated in the right direction — see [Knapsack DP](../knapsack-dp/content.md)). This turns O(n × m) space into O(m).

### Counting vs optimising vs deciding

The same state space answers different questions by changing the combine operation:

| Question | Combine | Base value for "impossible" |
|----------|---------|------------------------------|
| How many ways? | sum | 0 |
| Minimum cost? | min | +∞ |
| Maximum value? | max | −∞ |
| Is it possible? | OR | false |

## Visual Explanation

```text
Recursion tree for ways(5) — repeated subtrees are the overlap:

                    ways(5)
               /              \
          ways(4)            ways(3)            ← ways(3) computed twice
          /     \            /     \
     ways(3)  ways(2)   ways(2)  ways(1)        ← ways(2) computed three times
     /    \
 ways(2) ways(1)

Tabulation: each value computed once, left to right
 i      0   1   2   3   4   5
 dp[i]  1   1   2   3   5   8      dp[i] = dp[i−1] + dp[i−2]
```

## Pseudocode

```pseudocode
// memoization
ways(n):
    if n ≤ 1: return 1
    if memo[n] known: return memo[n]
    memo[n] ← ways(n − 1) + ways(n − 2)
    return memo[n]

// tabulation
dp[0] ← 1; dp[1] ← 1
for i from 2 to n: dp[i] ← dp[i − 1] + dp[i − 2]
return dp[n]
```

## Java Implementation

```java
import java.util.*;

public class DynamicProgramming {

    static long calls;

    static long waysRecursive(int n) {                    // stage 1: exponential
        calls++;
        if (n <= 1) return 1;
        return waysRecursive(n - 1) + waysRecursive(n - 2);
    }

    static long waysMemo(int n, long[] memo) {            // stage 2: top-down
        calls++;
        if (n <= 1) return 1;
        if (memo[n] != 0) return memo[n];                 // already solved
        return memo[n] = waysMemo(n - 1, memo) + waysMemo(n - 2, memo);
    }

    static long waysTable(int n) {                        // stage 3: bottom-up
        long[] dp = new long[n + 1];
        dp[0] = 1;
        if (n >= 1) dp[1] = 1;
        for (int i = 2; i <= n; i++) {
            dp[i] = dp[i - 1] + dp[i - 2];                // dependencies already filled
        }
        return dp[n];
    }

    static long waysConstantSpace(int n) {                // stage 4: keep only what the transition reads
        long twoBack = 1, oneBack = 1;
        for (int i = 2; i <= n; i++) {
            long current = oneBack + twoBack;
            twoBack = oneBack;
            oneBack = current;
        }
        return oneBack;
    }

    // Same state space, different question: minimum cost to reach the top
    // when stepping on stair i costs cost[i] (start at stair 0 or 1).
    static int minCostClimbing(int[] cost) {
        int n = cost.length;
        int[] dp = new int[n + 1];                        // dp[i] = min cost to stand at position i
        for (int i = 2; i <= n; i++) {
            dp[i] = Math.min(dp[i - 1] + cost[i - 1], dp[i - 2] + cost[i - 2]);
        }
        return dp[n];
    }

    public static void main(String[] args) {
        calls = 0;
        long r = waysRecursive(30);
        System.out.println("recursive ways(30) = " + r + " in " + calls + " calls");
        calls = 0;
        long m = waysMemo(30, new long[31]);
        System.out.println("memoized  ways(30) = " + m + " in " + calls + " calls");
        System.out.println("table ways(30) = " + waysTable(30) + ", constant space ways(90) = " + waysConstantSpace(90));
        System.out.println("min cost climbing [10, 15, 20] = " + minCostClimbing(new int[] {10, 15, 20})
                + ", [1,100,1,1,1,100,1,1,100,1] = " + minCostClimbing(new int[] {1, 100, 1, 1, 1, 100, 1, 1, 100, 1}));
    }
}
```

**Output:**

```text
recursive ways(30) = 1346269 in 2692537 calls
memoized  ways(30) = 1346269 in 59 calls
table ways(30) = 1346269, constant space ways(90) = 4660046610375530309
min cost climbing [10, 15, 20] = 15, [1,100,1,1,1,100,1,1,100,1] = 6
```

## Dry Run

`minCostClimbing([10, 15, 20])` — dp[i] = cheapest cost to stand on position i (position 3 = the top):

| i | Option A: from i − 1 | Option B: from i − 2 | dp[i] |
|---|----------------------|----------------------|-------|
| 0 | start | — | 0 |
| 1 | start | — | 0 |
| 2 | dp[1] + cost[1] = 15 | dp[0] + cost[0] = 10 | 10 |
| 3 | dp[2] + cost[2] = 30 | dp[1] + cost[1] = 15 | 15 |

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| General DP | O(states × transition cost) | each state computed once |
| Climbing stairs | O(n) | n states, O(1) transition |

**Space:** O(states), reducible to the "window" of states that transitions read. Memoization adds recursion depth to the space.

## Properties

- Correctness rests on the recurrence; efficiency on the number of distinct states.
- Every DP is a DAG of states: edges point from a state to the states it depends on, and tabulation processes them in topological order.

## Variations

The DP families in this section, each with its own topic:

| Family | State shape | Topic |
|--------|------------|-------|
| 1D / linear | `dp[i]` | [1D DP](../dp-1d/content.md) |
| Grid / 2D | `dp[r][c]` | [Grid and 2D DP](../dp-2d-grid/content.md) |
| Knapsack | `dp[i][capacity]` | [Knapsack DP](../knapsack-dp/content.md) |
| Subsequences | `dp[i][j]` over two prefixes or `dp[i]` ending at i | [Subsequence DP](../subsequence-dp/content.md) |
| Strings | `dp[i][j]` over prefixes / substrings | [String DP](../string-dp/content.md) |
| Partition / interval | `dp[i][j]` over a range | [Partition and Interval DP](../partition-and-interval-dp/content.md) |
| State machine | `dp[i][state]` | [Stock DP](../stock-dp/content.md) |
| Trees | values returned from children | [Tree DP](../tree-dp/content.md) |
| Subsets | `dp[mask]` | [Bitmask DP](../bitmask-dp/content.md) |

How to recognise which one applies: [Dynamic Programming Pattern](../../patterns/dp-pattern/content.md).

## Comparison

| | Divide and conquer | Dynamic programming | Greedy |
|---|--------------------|---------------------|--------|
| Subproblems | independent | overlapping | one per step |
| Choices | — | tries all options per state | commits to one option |
| Typical time | O(n log n) | polynomial in the number of states | O(n log n) |
| Correct when | always (for its problems) | optimal substructure | greedy choice property |

## Edge Cases

- Base cases for n = 0 and n = 1; empty inputs.
- Overflow in counting problems — use `long` or the requested modulus.
- Memo arrays that use 0 as "not computed" when 0 is a valid answer — use −1 or a `Long` wrapper/boolean array.

## Advantages

- Exponential → polynomial; systematic method once the state is right.

## Disadvantages

- Finding the right state is the hard part; tables can be large (memory).

## When to Use

- "Count the number of ways", "minimum/maximum cost/value", "is it possible" — **and** the choices at each step lead to repeated subproblems.
- Constraints around n ≤ 10³–10⁴ for O(n²) DP, or n ≤ 10⁵–10⁶ for O(n) DP.

## Common Mistakes

- A state that leaves out information the future depends on (e.g. forgetting "did I take the previous item?").
- Wrong iteration order in tabulation (reading states not yet computed).
- Off-by-one between "first i items" and "item i".
- Initialising "impossible" states with 0 in a min-cost DP.

## Key Takeaways

- DP = recursion + "never solve the same subproblem twice".
- Five steps: state, transition, base cases, order/answer, complexity.
- Memoization (top-down) vs tabulation (bottom-up); compress space when transitions read only recent states.
- Time = number of states × cost per transition.
