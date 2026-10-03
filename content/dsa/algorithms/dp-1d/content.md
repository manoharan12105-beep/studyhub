# 1D Dynamic Programming

## Definition

**1D DP** problems have a state described by **one index**: `dp[i]` = the answer for the first i elements (a prefix), for position i, or for the suffix starting at i. The transition reads a few earlier states (`dp[i − 1]`, `dp[i − 2]`) or, in harder cases, all earlier states. Typical complexity is O(n) time (or O(n²) when each state looks at all previous ones) and O(1)–O(n) space.

## Why It Matters

Most interview DP questions start here: house robber, decode ways, climbing stairs, maximum product subarray, perfect squares, jump game variants. They teach the most important DP decision — **what exactly `dp[i]` means** — in the simplest setting.

## Prerequisites

- [Dynamic Programming](../dynamic-programming/content.md) — the five-step process.

## Intuition

Walk along the array and, at each position, ask: "what are my options here, and which earlier answers do they build on?" If you can answer for position i using only answers for positions before i, the problem is 1D DP.

Two common meanings of `dp[i]`:

| Meaning | Answer | Example |
|---------|--------|---------|
| best/count over the **prefix** `0..i` | `dp[n − 1]` (or `dp[n]`) | house robber: best loot from the first i houses |
| best/count for something **ending exactly at i** | max over all `dp[i]` | maximum subarray / product ending at i |

## How It Works

### House robber (take or skip)

Houses in a row hold money; robbing two adjacent houses triggers an alarm. Maximise the loot.

1. **State:** `dp[i]` = maximum loot from houses `0..i`.
2. **Transition:** either skip house i (`dp[i − 1]`) or rob it (`dp[i − 2] + money[i]`): `dp[i] = max(dp[i − 1], dp[i − 2] + money[i])`.
3. **Base:** `dp[0] = money[0]`, `dp[1] = max(money[0], money[1])`.
4. **Answer:** `dp[n − 1]`. Only two previous values are read → O(1) space.

### Decode ways (counting)

A digit string maps letters A = 1 … Z = 26. Count the decodings of "226" ("BZ", "VF", "BBF" → 3).

1. **State:** `dp[i]` = number of ways to decode the first i characters.
2. **Transition:** the last piece is one digit (valid if it is 1–9) → add `dp[i − 1]`; or two digits (valid if 10–26) → add `dp[i − 2]`.
3. **Base:** `dp[0] = 1` (empty prefix: one way — choose nothing).
4. **Answer:** `dp[n]`. A '0' can only be decoded as part of "10" or "20".

### "Ending at i" states

For "maximum product subarray", knowing only the best product ending at i − 1 is not enough — a very negative product times a negative number becomes the maximum. Keep **two** values per position: the maximum and the minimum product ending at i. This is a reminder that the state must carry everything the future needs.

### When each state reads all earlier states

`dp[i] = best over j < i of (dp[j] + something)` gives O(n²) — e.g. longest increasing subsequence ([Subsequence DP](../subsequence-dp/content.md)) or word break ([String DP](../string-dp/content.md)).

## Visual Explanation

```text
House robber, money = [2, 7, 9, 3, 1]

i         0    1    2    3    4
money     2    7    9    3    1
skip i    -    2    7   11   11      (= dp[i−1])
rob i     2    7   11   10   12      (= dp[i−2] + money[i])
dp[i]     2    7   11   11   12      → rob houses 0, 2, 4 = 2 + 9 + 1 = 12
```

## Pseudocode

```pseudocode
rob(money):
    prev2 ← 0, prev1 ← 0               // dp[i−2], dp[i−1]
    for m in money:
        current ← max(prev1, prev2 + m)
        prev2 ← prev1; prev1 ← current
    return prev1
```

## Java Implementation

```java
public class OneDimensionalDp {

    static int rob(int[] money) {
        int prev2 = 0, prev1 = 0;                       // best up to i-2 and i-1
        for (int m : money) {
            int current = Math.max(prev1, prev2 + m);   // skip this house, or rob it
            prev2 = prev1;
            prev1 = current;
        }
        return prev1;
    }

    static int numDecodings(String s) {
        int n = s.length();
        int[] dp = new int[n + 1];
        dp[0] = 1;                                       // empty prefix
        for (int i = 1; i <= n; i++) {
            char one = s.charAt(i - 1);
            if (one != '0') dp[i] += dp[i - 1];          // last piece is a single digit 1-9
            if (i >= 2) {
                int two = Integer.parseInt(s.substring(i - 2, i));
                if (two >= 10 && two <= 26) dp[i] += dp[i - 2];   // last piece is 10-26
            }
        }
        return dp[n];
    }

    public static void main(String[] args) {
        System.out.println("rob [2,7,9,3,1] = " + rob(new int[] {2, 7, 9, 3, 1}) + ", rob [2,1,1,2] = " + rob(new int[] {2, 1, 1, 2}));
        System.out.println("decode 226 = " + numDecodings("226") + ", 12 = " + numDecodings("12") + ", 06 = " + numDecodings("06") + ", 11106 = " + numDecodings("11106"));
    }
}
```

**Output:**

```text
rob [2,7,9,3,1] = 12, rob [2,1,1,2] = 4
decode 226 = 3, 12 = 2, 06 = 0, 11106 = 2
```

## Dry Run

`numDecodings("226")`:

| i | Prefix | One digit (s[i−1]) | Two digits | dp[i] |
|---|--------|--------------------|------------|-------|
| 0 | "" | — | — | 1 |
| 1 | "2" | '2' valid → + dp[0] = 1 | — | 1 |
| 2 | "22" | '2' valid → + dp[1] = 1 | "22" valid → + dp[0] = 1 | 2 |
| 3 | "226" | '6' valid → + dp[2] = 2 | "26" valid → + dp[1] = 1 | 3 |

## Complexity Analysis

| Problem | Time | Space |
|---------|------|-------|
| House robber | O(n) | O(1) |
| Decode ways | O(n) | O(n), or O(1) with two variables |
| Each state reads all previous states | O(n²) | O(n) |

## Properties

- State = one index (prefix, position or suffix); answers depend on a window of earlier states.
- Space compresses to the size of that window.

## Variations

- **House robber II** — houses in a circle: run the linear version twice (without the first house, without the last).
- **Delete and earn** — reduce to house robber over values.
- **Maximum product subarray** — track max and min ending at i.
- **Perfect squares, coin change** — `dp[i]` over amounts (these are [knapsack](../knapsack-dp/content.md) in disguise).
- **Maximum subarray (Kadane)** — `dp[i]` = best sum ending at i; see [Brute Force to Optimal](../../problem-solving/brute-force-to-optimal/content.md).

## Comparison

| Approach for house robber | Time | Space |
|---------------------------|------|-------|
| Try all subsets of non-adjacent houses | O(2ⁿ) | O(n) |
| Memoized recursion | O(n) | O(n) + stack |
| Tabulation | O(n) | O(n) |
| Two variables | O(n) | O(1) |

## Edge Cases

- Empty array or a single element.
- Decode ways: leading '0', "00", "30" (no valid decoding), "10"/"20".
- All-negative values in "maximum" problems.

## Advantages

- Simple states, linear time, constant space after compression.

## Disadvantages

- Choosing the wrong meaning of `dp[i]` (prefix vs ending-at-i) makes the transition impossible to write.

## When to Use

- A sequence where each decision depends on the previous one or two decisions (adjacent constraints, last piece of a split).

## Common Mistakes

- Base cases off by one (dp of the empty prefix).
- Forgetting the '0' rules in decode ways.
- Keeping only a maximum when a minimum is also needed (products, negatives).

## Key Takeaways

- Define `dp[i]` precisely: prefix answer or "ending at i".
- Take-or-skip and last-piece transitions cover most 1D problems.
- Compress to O(1) space when only a fixed window of states is read.
