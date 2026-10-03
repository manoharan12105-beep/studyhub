# Stock Buy-and-Sell DP (State Machine DP)

## Definition

The **stock problems** give a list of daily prices and ask for the maximum profit from buying and selling under rules: at most one transaction, unlimited transactions, at most k transactions, a cooldown after selling, or a fee per transaction. They are solved with **state machine DP**: on each day you are in one of a few states (holding a share or not, number of transactions used), and `dp[day][state]` records the best profit in that state.

## Why It Matters

This family is one of the most common DP series in interviews because each rule changes the state space slightly. Learning to draw the states and their transitions once solves all of them — and the same "state machine" technique applies to many other problems (painting houses with constraints, string automata).

## Prerequisites

- [Dynamic Programming](../dynamic-programming/content.md)
- [1D DP](../dp-1d/content.md)

## Intuition

Each day you either hold one share or hold none. If you hold one today, either you already held it yesterday, or you bought it today (cash goes down by the price). If you hold none, either you held none yesterday, or you sold today (cash goes up by the price). Track the best cash for both situations every day; the answer is the best cash while holding nothing at the end.

## How It Works

### One transaction (buy once, sell once)

Track the lowest price seen so far; the best profit is the maximum of `price − minSoFar`. (In state terms: `hold = max(hold, −price)`, `free = max(free, hold + price)` — with buying allowed only from zero cash.)

### Unlimited transactions

```text
hold[i] = max(hold[i−1], free[i−1] − price[i])     // keep holding, or buy today
free[i] = max(free[i−1], hold[i−1] + price[i])     // keep waiting, or sell today
```

Equivalently, add every positive day-to-day increase (greedy) — both give the same answer.

### At most k transactions

Add the transaction count to the state: `hold[j]` and `free[j]` for j = 1..k (a transaction = buy + sell; count it when buying).

```text
hold[j] = max(hold[j], free[j−1] − price)          // buy as the j-th transaction
free[j] = max(free[j], hold[j] + price)            // sell the j-th transaction
```

Time O(n × k). If k ≥ n/2, the limit cannot bind — use the unlimited version.

### Cooldown and fees

- **Cooldown (one day after selling):** add a third state `cooldown`; buying is allowed only from `free` (not from the day you just sold).
- **Transaction fee:** subtract the fee once per transaction, e.g. when selling.

## Visual Explanation

```text
States (unlimited transactions):

         buy: −price
   ┌──────────────────────┐
   │                      ▼
 FREE ◀──────────────── HOLD
 (wait)   sell: +price   (keep)

prices:   7    1    5    3    6    4
hold:    -7   -1   -1    1    1    3
free:     0    0    4    4    7    7      answer 7 (buy 1 → sell 5, buy 3 → sell 6)
```

## Pseudocode

```pseudocode
maxProfitUnlimited(prices):
    hold ← −∞; free ← 0
    for p in prices:
        newHold ← max(hold, free − p)
        newFree ← max(free, hold + p)
        hold ← newHold; free ← newFree
    return free
```

## Java Implementation

```java
public class StockDp {

    static int oneTransaction(int[] prices) {
        int minPrice = Integer.MAX_VALUE, best = 0;
        for (int p : prices) {
            minPrice = Math.min(minPrice, p);           // cheapest buy so far
            best = Math.max(best, p - minPrice);        // sell today
        }
        return best;
    }

    static int unlimited(int[] prices) {
        long hold = Long.MIN_VALUE / 2, free = 0;       // cannot hold before buying
        for (int p : prices) {
            long newHold = Math.max(hold, free - p);
            long newFree = Math.max(free, hold + p);
            hold = newHold;                             // update both from yesterday's values
            free = newFree;
        }
        return (int) free;
    }

    static int atMostK(int k, int[] prices) {
        if (k >= prices.length / 2) return unlimited(prices);   // limit cannot bind
        long[] hold = new long[k + 1], free = new long[k + 1];
        java.util.Arrays.fill(hold, Long.MIN_VALUE / 2);
        for (int p : prices) {
            for (int j = k; j >= 1; j--) {             // descending: use yesterday's free[j-1]
                free[j] = Math.max(free[j], hold[j] + p);
                hold[j] = Math.max(hold[j], free[j - 1] - p);
            }
        }
        return (int) free[k];
    }

    public static void main(String[] args) {
        int[] prices = {7, 1, 5, 3, 6, 4};
        System.out.println("one transaction: " + oneTransaction(prices) + ", unlimited: " + unlimited(prices));
        int[] p2 = {3, 2, 6, 5, 0, 3};
        System.out.println("k=1: " + atMostK(1, p2) + ", k=2: " + atMostK(2, p2) + ", falling prices: " + unlimited(new int[] {7, 6, 4, 3, 1}));
    }
}
```

**Output:**

```text
one transaction: 5, unlimited: 7
k=1: 4, k=2: 7, falling prices: 0
```

## Dry Run

Unlimited transactions on `[7, 1, 5, 3, 6, 4]` (hold starts at −∞, free at 0):

| Day | Price | hold = max(hold, free − p) | free = max(free, hold + p) |
|-----|-------|----------------------------|----------------------------|
| 0 | 7 | −7 | 0 |
| 1 | 1 | max(−7, 0 − 1) = −1 | max(0, −7 + 1) = 0 |
| 2 | 5 | max(−1, 0 − 5) = −1 | max(0, −1 + 5) = 4 |
| 3 | 3 | max(−1, 4 − 3) = 1 | max(4, −1 + 3) = 4 |
| 4 | 6 | max(1, 4 − 6) = 1 | max(4, 1 + 6) = 7 |
| 5 | 4 | max(1, 7 − 4) = 3 | max(7, 1 + 4) = 7 |

## Complexity Analysis

| Variant | Time | Space |
|---------|------|-------|
| One transaction | O(n) | O(1) |
| Unlimited | O(n) | O(1) |
| At most k | O(n × k) | O(k) |
| Cooldown / fee | O(n) | O(1) |

## Properties

- Each day's states depend only on the previous day's states → O(1) space per state.
- Compute all new states from the **old** values (temporaries or descending loops).

## Variations

- **Best time with cooldown** — states hold, sold (cooldown), free.
- **With transaction fee** — `free = max(free, hold + p − fee)`.
- **At most two transactions** — k = 2.
- **Paint house / non-adjacent colour rules** — the same "state per day" idea.

## Comparison

| Rule | States per day |
|------|----------------|
| One transaction | min price so far (or hold/free with buying from 0 only) |
| Unlimited | hold, free |
| At most k | hold[j], free[j] for j ≤ k |
| Cooldown | hold, sold, free |
| Fee | hold, free (fee on sell) |

## Edge Cases

- Fewer than 2 days → profit 0.
- Prices only falling → profit 0 (never trade).
- Large k (≥ n/2) → unlimited.

## Advantages

- One framework for the entire family; constant space.

## Disadvantages

- Easy to read already-updated values on the same day (wrong answers that pass some tests).

## When to Use

- Sequential decisions where your current "mode" restricts the next action (holding/not holding, used/unused allowance, cooldown).

## Common Mistakes

- Initialising `hold` to 0 (you cannot hold a share you never bought) — use −∞.
- Updating `hold` and then using the new `hold` to compute `free` on the same day without meaning to.
- For k transactions, iterating j upwards with in-place arrays (allows buy and sell of several transactions in one day — harmless for profit but breaks the counting in variants).

## Key Takeaways

- Model each day as a few states (hold / free / cooldown / transactions used) and write transitions between them.
- Unlimited: hold ↔ free; at most k: index the states by transactions used.
- O(n) or O(n × k) time, O(1) or O(k) space.
