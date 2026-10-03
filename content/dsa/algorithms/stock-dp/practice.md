# Stock Buy-and-Sell DP — Practice

### P1. Best time to buy and sell with a cooldown

**Difficulty:** Medium · **Pattern:** Three-state machine

Unlimited transactions, but after selling you must wait one day before buying again. Return the maximum profit.

**Constraints:** 1 ≤ n ≤ 5000.

Example: `[1, 2, 3, 0, 2]` → `3` (buy, sell, cooldown, buy, sell).

<details>
<summary>Hint</summary>

States: `hold` (own a share), `sold` (sold today → cooldown tomorrow), `rest` (no share, free to buy). Buying is only allowed from `rest`.

</details>

<details>
<summary>Answer</summary>

```java
public class StockCooldown {

    static int maxProfit(int[] prices) {
        int hold = Integer.MIN_VALUE / 2, sold = 0, rest = 0;
        for (int p : prices) {
            int newHold = Math.max(hold, rest - p);      // buy only from rest (not right after selling)
            int newSold = hold + p;                      // sell today
            int newRest = Math.max(rest, sold);          // wait, or finish yesterday's cooldown
            hold = newHold;
            sold = newSold;
            rest = newRest;
        }
        return Math.max(sold, rest);
    }

    public static void main(String[] args) {
        System.out.println(maxProfit(new int[] {1, 2, 3, 0, 2}) + " " + maxProfit(new int[] {1}));
    }
}
```

**Output:**

```text
3 0
```

**Complexity:** O(n) time, O(1) space.

</details>

### P2. Best time with a transaction fee

**Difficulty:** Medium · **Pattern:** Two-state machine with a fee on selling

Unlimited transactions; each completed transaction costs `fee`. Return the maximum profit.

**Constraints:** 1 ≤ n ≤ 5 × 10⁴.

Example: prices `[1, 3, 2, 8, 4, 9]`, fee 2 → `8` ((8 − 1 − 2) + (9 − 4 − 2)).

<details>
<summary>Hint</summary>

Same as unlimited, subtracting the fee when selling.

</details>

<details>
<summary>Answer</summary>

```java
public class StockFee {

    static int maxProfit(int[] prices, int fee) {
        long hold = Long.MIN_VALUE / 2, free = 0;
        for (int p : prices) {
            long newHold = Math.max(hold, free - p);
            long newFree = Math.max(free, hold + p - fee);   // pay the fee once per round trip
            hold = newHold;
            free = newFree;
        }
        return (int) free;
    }

    public static void main(String[] args) {
        System.out.println(maxProfit(new int[] {1, 3, 2, 8, 4, 9}, 2) + " " + maxProfit(new int[] {1, 3, 7, 5, 10, 3}, 3));
    }
}
```

**Output:**

```text
8 6
```

**Complexity:** O(n) time, O(1) space. Note the fee changes the greedy "take every rise" answer — small rises are not worth paying for.

</details>

### P3. At most two transactions

**Difficulty:** Hard · **Pattern:** k-transaction state machine with k = 2

Return the maximum profit with at most two transactions (sell before buying again).

**Constraints:** 1 ≤ n ≤ 10⁵.

Example: `[3, 3, 5, 0, 0, 3, 1, 4]` → `6` (buy 0 sell 3, buy 1 sell 4).

<details>
<summary>Hint</summary>

Four running values: best after the first buy, first sell, second buy, second sell. The second buy starts from the first sell's profit.

</details>

<details>
<summary>Answer</summary>

```java
public class StockTwoTransactions {

    static int maxProfit(int[] prices) {
        int buy1 = Integer.MIN_VALUE, sell1 = 0, buy2 = Integer.MIN_VALUE, sell2 = 0;
        for (int p : prices) {
            sell2 = Math.max(sell2, buy2 + p);          // update in reverse dependency order
            buy2 = Math.max(buy2, sell1 - p);
            sell1 = Math.max(sell1, buy1 + p);
            buy1 = Math.max(buy1, -p);
        }
        return sell2;
    }

    public static void main(String[] args) {
        System.out.println(maxProfit(new int[] {3, 3, 5, 0, 0, 3, 1, 4}) + " " + maxProfit(new int[] {1, 2, 3, 4, 5}) + " " + maxProfit(new int[] {7, 6, 4, 3, 1}));
    }
}
```

**Output:**

```text
6 4 0
```

**Complexity:** O(n) time, O(1) space. (`buy + p` with `buy = Integer.MIN_VALUE` would overflow only if p were negative; prices are non-negative, so `MIN_VALUE + p` stays valid.)

</details>
