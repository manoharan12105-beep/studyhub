# Partition and Interval DP

## Definition

**Interval DP** solves problems on a contiguous range [i, j] by trying every **split point** k inside it and combining the best answers for [i, k] and [k + 1, j] (or every "last operation" k). States are `dp[i][j]`; there are O(n²) of them and each tries O(n) splits, so the typical cost is **O(n³)** time and O(n²) space. **Partition DP** is the 1D cousin: `dp[i]` = best way to cut the prefix of length i into pieces, trying every position of the last cut — typically O(n²).

## Why It Matters

Matrix chain multiplication, palindrome partitioning, burst balloons, optimal binary search trees, polygon triangulation, cutting sticks, merging stones — all are "choose where to split, recursively". The difficulty is seeing that the **order of operations** inside a range is the real decision, and choosing which operation to make **last**.

## Prerequisites

- [Dynamic Programming](../dynamic-programming/content.md)
- [String DP](../string-dp/content.md) — substring tables filled by increasing length.

## Intuition

Multiplying matrices A·B·C·D: the result is the same whatever the parenthesisation, but the cost is not. Whichever multiplication happens **last** splits the chain into a left part and a right part, each multiplied optimally on its own. Try every possible last split and keep the cheapest — the subranges repeat, so store them.

## How It Works

### Matrix chain multiplication (interval DP)

Matrices A₁…Aₙ, where Aᵢ has dimensions `p[i−1] × p[i]`. Multiplying an (a × b) by a (b × c) matrix costs a·b·c scalar multiplications.

1. **State:** `dp[i][j]` = minimum cost to multiply Aᵢ…Aⱼ.
2. **Transition:** `dp[i][j] = min over i ≤ k < j of dp[i][k] + dp[k+1][j] + p[i−1]·p[k]·p[j]` (k = position of the last multiplication).
3. **Base:** `dp[i][i] = 0`.
4. **Order:** by increasing chain length, so both halves are ready.

### Palindrome partitioning II (partition DP)

Minimum cuts so that every piece of s is a palindrome.

1. Precompute `isPal[i][j]` in O(n²).
2. `cuts[i]` = minimum cuts for the prefix `s[0..i]`.
3. If `s[0..i]` is a palindrome, `cuts[i] = 0`; otherwise `cuts[i] = min over j ≤ i with isPal[j][i] of cuts[j − 1] + 1` (the last piece is `s[j..i]`).

### Choosing the "last" operation

For burst balloons (bursting balloon k earns `left × k × right`), splitting on the **first** balloon burst does not work — its neighbours change. Choosing the **last** balloon burst in (i, j) works: when it bursts, its neighbours are exactly the boundaries i and j, and the two sides are independent. Asking "what happens last?" is the standard trick for interval DP.

## Visual Explanation

```text
Matrix chain p = [10, 30, 5, 60]   → A1: 10×30, A2: 30×5, A3: 5×60

(A1·A2)·A3 = 10·30·5 + 10·5·60  = 1500 + 3000  = 4500   ← best
A1·(A2·A3) = 30·5·60 + 10·30·60 = 9000 + 18000 = 27000

dp table (i, j):          length 1: dp[i][i] = 0
          j=1   j=2   j=3     length 2: dp[1][2] = 10·30·5 = 1500; dp[2][3] = 30·5·60 = 9000
   i=1     0   1500  4500     length 3: dp[1][3] = min(k=1: 0 + 9000 + 10·30·60 = 27000,
   i=2           0   9000                            k=2: 1500 + 0 + 10·5·60 = 4500) = 4500
   i=3                 0
```

## Pseudocode

```pseudocode
matrixChain(p):                      // n = p.length − 1 matrices
    for length from 2 to n:
        for i from 1 to n − length + 1:
            j ← i + length − 1
            dp[i][j] ← ∞
            for k from i to j − 1:
                dp[i][j] ← min(dp[i][j], dp[i][k] + dp[k+1][j] + p[i−1]·p[k]·p[j])
    return dp[1][n]
```

## Java Implementation

```java
public class IntervalDp {

    static long matrixChain(int[] p) {
        int n = p.length - 1;                               // number of matrices
        long[][] dp = new long[n + 1][n + 1];               // 1-indexed: dp[i][j] for A_i..A_j
        for (int length = 2; length <= n; length++) {
            for (int i = 1; i + length - 1 <= n; i++) {
                int j = i + length - 1;
                dp[i][j] = Long.MAX_VALUE;
                for (int k = i; k < j; k++) {               // last multiplication splits after A_k
                    long cost = dp[i][k] + dp[k + 1][j] + (long) p[i - 1] * p[k] * p[j];
                    dp[i][j] = Math.min(dp[i][j], cost);
                }
            }
        }
        return dp[1][n];
    }

    static int minPalindromeCuts(String s) {
        int n = s.length();
        boolean[][] isPal = new boolean[n][n];
        for (int i = n - 1; i >= 0; i--) {
            for (int j = i; j < n; j++) {
                isPal[i][j] = s.charAt(i) == s.charAt(j) && (j - i < 2 || isPal[i + 1][j - 1]);
            }
        }
        int[] cuts = new int[n];
        for (int i = 0; i < n; i++) {
            if (isPal[0][i]) {
                cuts[i] = 0;                                // whole prefix is a palindrome
                continue;
            }
            cuts[i] = i;                                    // worst case: cut between every character
            for (int j = 1; j <= i; j++) {
                if (isPal[j][i]) cuts[i] = Math.min(cuts[i], cuts[j - 1] + 1);   // last piece s[j..i]
            }
        }
        return cuts[n - 1];
    }

    public static void main(String[] args) {
        System.out.println("matrix chain [10,30,5,60] = " + matrixChain(new int[] {10, 30, 5, 60})
                + ", [40,20,30,10,30] = " + matrixChain(new int[] {40, 20, 30, 10, 30}));
        System.out.println("min palindrome cuts aab = " + minPalindromeCuts("aab") + ", a = " + minPalindromeCuts("a")
                + ", ababbbabbababa = " + minPalindromeCuts("ababbbabbababa"));
    }
}
```

**Output:**

```text
matrix chain [10,30,5,60] = 4500, [40,20,30,10,30] = 26000
min palindrome cuts aab = 1, a = 0, ababbbabbababa = 3
```

## Dry Run

`minPalindromeCuts("aab")`:

| i | Prefix | Whole prefix palindrome? | Candidate last pieces s[j..i] | cuts[i] |
|---|--------|--------------------------|-------------------------------|---------|
| 0 | "a" | yes | — | 0 |
| 1 | "aa" | yes | — | 0 |
| 2 | "aab" | no | j = 2: "b" → cuts[1] + 1 = 1 | 1 |

Answer: 1 cut ("aa" | "b").

## Complexity Analysis

| Problem | Time | Space |
|---------|------|-------|
| Matrix chain / burst balloons / triangulation (interval DP) | O(n³) | O(n²) |
| Palindrome partitioning II | O(n²) | O(n²) for `isPal` |
| Brute force over all parenthesisations | Catalan number ≈ 4ⁿ / n^1.5 | — |

## Properties

- Interval states must be filled by increasing length (or i descending, j ascending).
- The split point (or last operation) is the choice tried exhaustively in each state.

## Variations

- **Burst balloons** — choose the last balloon in an open interval; add 1s at both ends.
- **Minimum score triangulation of a polygon** — choose the third vertex of the triangle on edge (i, j).
- **Minimum cost to cut a stick** — sort cut positions, interval over cut indices.
- **Optimal BST, merging stones, boolean parenthesisation (count ways to evaluate to true).**

## Comparison

| | Interval DP | Partition DP |
|---|-------------|--------------|
| State | `dp[i][j]` (range) | `dp[i]` (prefix) |
| Choice | split point / last operation inside the range | position of the last cut |
| Typical time | O(n³) | O(n²) |
| Examples | matrix chain, burst balloons | palindrome partitioning II, word break |

## Edge Cases

- Ranges of length 1 (base cases).
- Overflow of dimension products — use `long`.
- Strings that are already palindromes (0 cuts).

## Advantages

- Handles "order of operations" problems that have no greedy rule.

## Disadvantages

- O(n³) limits n to a few hundred.

## When to Use

- "Minimum/maximum cost to combine/merge/split a sequence", "best parenthesisation", "cut into pieces with a property", small n (≤ 500).

## Common Mistakes

- Filling `dp[i][j]` row by row from the top — the sub-intervals are not ready.
- Choosing the **first** operation as the split when its cost depends on later choices (burst balloons).
- Off-by-one in dimension indexing (matrix i is `p[i−1] × p[i]`).

## Key Takeaways

- Interval DP: `dp[i][j]` = best over split points k of `dp[i][k] + dp[k+1][j] + cost`; fill by length; O(n³).
- Partition DP: `dp[i]` = best over the last piece; O(n²) with a precomputed validity table.
- Ask "what happens last?" to make the two sides independent.
