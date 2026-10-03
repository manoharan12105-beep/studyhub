# Knapsack DP (0/1 and Unbounded)

## Definition

The **knapsack problem**: given items with weights and values and a capacity W, choose items to maximise total value without exceeding W. In the **0/1 knapsack** each item is used at most once; in the **unbounded knapsack** each item may be used any number of times. Both are solved with DP over (items considered, remaining capacity) in **O(n × W)** time — **pseudo-polynomial**, because W is a number, not an input size.

## Why It Matters

Knapsack is the template behind a whole family of interview problems: subset sum, partition equal subset sum, target sum, coin change (fewest coins and number of ways), rod cutting, "ones and zeroes". Recognising "choose items under a budget" as knapsack — and knowing whether items are reusable — solves all of them with the same table.

## Prerequisites

- [Dynamic Programming](../dynamic-programming/content.md)
- [Greedy Algorithms](../greedy-algorithms/content.md) — why greedy fails for 0/1 knapsack.

## Intuition

Consider items one at a time. For each item and each capacity, there are only two choices: **leave it** (the best stays what it was with the previous items) or **take it** (its value plus the best for the remaining capacity). The table remembers the best answer for every (items-so-far, capacity) pair so each is computed once.

## How It Works

### 0/1 knapsack

1. **State:** `dp[i][w]` = maximum value using the first i items with capacity w.
2. **Transition:** `dp[i][w] = max(dp[i − 1][w], dp[i − 1][w − wt[i]] + val[i])` (the second only if `wt[i] ≤ w`).
3. **Base:** `dp[0][w] = 0` (no items).
4. **Answer:** `dp[n][W]`.

**1D compression:** row i reads only row i − 1. Use one array and iterate w **from W down to wt[i]**, so `dp[w − wt[i]]` still holds the previous row's value (the item is not used twice).

### Unbounded knapsack

Same, but taking item i leaves you in row **i** (it may be taken again): `dp[i][w] = max(dp[i − 1][w], dp[i][w − wt[i]] + val[i])`. In 1D, iterate w **upwards** — then `dp[w − wt[i]]` may already include item i, which is exactly what reuse means.

> [!IMPORTANT]
> With a 1D array, the only difference between 0/1 and unbounded is the loop direction over capacity: **downwards = each item once, upwards = unlimited**.

### Family members

| Problem | Items | Capacity | Combine | Base |
|---------|-------|----------|---------|------|
| Subset sum (can we hit target?) | numbers, 0/1 | target | OR | dp[0] = true |
| Partition equal subset sum | numbers, 0/1 | total / 2 | OR | dp[0] = true |
| Count subsets with sum = target / target sum (±) | numbers, 0/1 | target | + | dp[0] = 1 |
| Coin change: fewest coins | coins, unbounded | amount | min(… + 1) | dp[0] = 0, others ∞ |
| Coin change II: number of ways (combinations) | coins, unbounded, **coins outer loop** | amount | + | dp[0] = 1 |
| Rod cutting | piece lengths, unbounded | rod length | max | dp[0] = 0 |

**Combinations vs permutations in counting:** loop over **coins outside** and amounts inside to count combinations (1 + 2 and 2 + 1 counted once); loop amounts outside and coins inside to count ordered sequences (they are counted separately).

### Why "pseudo-polynomial"

O(n × W) looks polynomial, but W can be exponential in the number of bits needed to write it. With W = 10¹⁸ the table is impossible. Knapsack is NP-hard in general; DP is efficient only when W (or the target sum) is moderate — roughly ≤ 10⁵–10⁷.

## Visual Explanation

```text
0/1 knapsack, W = 5: items (weight, value) = (1, 1), (3, 4), (4, 5)

             w:  0  1  2  3  4  5
no items         0  0  0  0  0  0
+ (1,1)          0  1  1  1  1  1
+ (3,4)          0  1  1  4  5  5      dp[2][4] = max(1, dp[1][1] + 4) = 5
+ (4,5)          0  1  1  4  5  6      dp[3][5] = max(5, dp[2][1] + 5) = 6

answer 6: take (1,1) and (4,5)
```

## Pseudocode

```pseudocode
knapsack01(wt, val, W):
    dp[0..W] ← 0
    for each item i:
        for w from W down to wt[i]:            // downwards: item used at most once
            dp[w] ← max(dp[w], dp[w − wt[i]] + val[i])
    return dp[W]

unboundedKnapsack(wt, val, W):
    dp[0..W] ← 0
    for each item i:
        for w from wt[i] up to W:              // upwards: item may be reused
            dp[w] ← max(dp[w], dp[w − wt[i]] + val[i])
    return dp[W]
```

## Java Implementation

```java
import java.util.Arrays;

public class Knapsack {

    static int knapsack01(int[] wt, int[] val, int capacity) {
        int[] dp = new int[capacity + 1];
        for (int i = 0; i < wt.length; i++) {
            for (int w = capacity; w >= wt[i]; w--) {          // downwards: reads last item's row
                dp[w] = Math.max(dp[w], dp[w - wt[i]] + val[i]);
            }
        }
        return dp[capacity];
    }

    static int unboundedKnapsack(int[] wt, int[] val, int capacity) {
        int[] dp = new int[capacity + 1];
        for (int i = 0; i < wt.length; i++) {
            for (int w = wt[i]; w <= capacity; w++) {          // upwards: may reuse item i
                dp[w] = Math.max(dp[w], dp[w - wt[i]] + val[i]);
            }
        }
        return dp[capacity];
    }

    static int fewestCoins(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, Integer.MAX_VALUE);
        dp[0] = 0;
        for (int coin : coins) {
            for (int a = coin; a <= amount; a++) {
                if (dp[a - coin] != Integer.MAX_VALUE) {         // never add 1 to "impossible"
                    dp[a] = Math.min(dp[a], dp[a - coin] + 1);
                }
            }
        }
        return dp[amount] == Integer.MAX_VALUE ? -1 : dp[amount];
    }

    static boolean subsetSum(int[] nums, int target) {
        boolean[] reachable = new boolean[target + 1];
        reachable[0] = true;
        for (int x : nums) {
            for (int s = target; s >= x; s--) {
                reachable[s] |= reachable[s - x];
            }
        }
        return reachable[target];
    }

    public static void main(String[] args) {
        System.out.println("0/1 knapsack = " + knapsack01(new int[] {1, 3, 4}, new int[] {1, 4, 5}, 5));
        System.out.println("0/1 counterexample to greedy = " + knapsack01(new int[] {10, 20, 30}, new int[] {60, 100, 120}, 50));
        System.out.println("unbounded knapsack = " + unboundedKnapsack(new int[] {1, 3, 4}, new int[] {1, 4, 5}, 7));
        System.out.println("fewest coins {1,2,5} for 11 = " + fewestCoins(new int[] {1, 2, 5}, 11) + ", {2} for 3 = " + fewestCoins(new int[] {2}, 3)
                + ", {1,3,4} for 6 = " + fewestCoins(new int[] {1, 3, 4}, 6));
        System.out.println("subset sum to 9 from {3,34,4,12,5,2} = " + subsetSum(new int[] {3, 34, 4, 12, 5, 2}, 9) + ", to 30 = " + subsetSum(new int[] {3, 34, 4, 12, 5, 2}, 30));
    }
}
```

**Output:**

```text
0/1 knapsack = 6
0/1 counterexample to greedy = 220
unbounded knapsack = 9
fewest coins {1,2,5} for 11 = 3, {2} for 3 = -1, {1,3,4} for 6 = 2
subset sum to 9 from {3,34,4,12,5,2} = true, to 30 = false
```

## Dry Run

Fewest coins with {1, 3, 4} for amount 6 (the case where greedy gives 3 coins):

| a | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| after coin 1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
| after coin 3 | 0 | 1 | 2 | 1 | 2 | 3 | 2 |
| after coin 4 | 0 | 1 | 2 | 1 | 1 | 2 | 2 |

dp[6] = 2 (3 + 3).

## Complexity Analysis

| Problem | Time | Space |
|---------|------|-------|
| 0/1 knapsack (2D) | O(n × W) | O(n × W) |
| 0/1 knapsack (1D) | O(n × W) | O(W) |
| Unbounded knapsack / coin change | O(n × W) | O(W) |
| Brute force over subsets | O(2ⁿ) | O(n) |

Pseudo-polynomial: fast only when W (or the target) is moderate.

## Properties

- Choices per item: skip or take (0/1), skip or take-again (unbounded).
- Loop direction in 1D encodes reuse.
- Recovering **which** items were chosen requires the 2D table (or a parent array) — backtrack from `dp[n][W]`.

## Variations

- **Bounded knapsack** (item i up to kᵢ times) — split counts into powers of two to reduce to 0/1.
- **2D capacity** ("ones and zeroes": count of 0s and 1s) — `dp[a][b]`.
- **Target sum** (assign + or − to each number) — reduces to counting subsets with sum (total + target)/2.
- **Minimum subset sum difference** — subset sum up to total/2.

## Comparison

| | Fractional knapsack | 0/1 knapsack | Unbounded knapsack |
|---|---------------------|--------------|--------------------|
| Items | divisible | whole, once | whole, unlimited |
| Algorithm | greedy by value/weight | DP | DP |
| Time | O(n log n) | O(n × W) | O(n × W) |

## Edge Cases

- Capacity 0 → value 0. Amount 0 → 0 coins / 1 way.
- Items heavier than the capacity — never taken (loop bounds skip them).
- Impossible amounts in coin change — keep ∞, return −1.
- Odd total in partition equal subset sum → immediately false.

## Advantages

- One template solves a large family of problems; easy space compression.

## Disadvantages

- Infeasible for large capacities; reconstructing the chosen set needs more memory.

## When to Use

- "Choose a subset under a limit to maximise/minimise/count", "make a sum from given numbers/coins", "split into two groups with equal/closest sums".

## Common Mistakes

- Iterating capacity upwards in 0/1 knapsack (items get reused).
- Initialising min-coin DP with 0 instead of ∞ for unreachable amounts, or adding 1 to `Integer.MAX_VALUE`.
- Swapping loop order in coin change II and counting permutations instead of combinations.
- Applying the greedy value/weight ratio to 0/1 items.

## Key Takeaways

- `dp[capacity]` with "skip or take"; O(n × W), pseudo-polynomial.
- 1D: downwards loop = 0/1 (once), upwards = unbounded (reuse).
- Subset sum, partition, target sum, coin change and rod cutting are all knapsack.
