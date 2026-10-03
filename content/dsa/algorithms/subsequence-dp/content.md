# Subsequence DP (LIS and LCS)

## Definition

A **subsequence** keeps elements in their original order but may skip some. Two classic DP problems ask for the longest one with a property: the **longest increasing subsequence (LIS)** of one sequence, and the **longest common subsequence (LCS)** of two sequences. LIS is O(n²) with simple DP or **O(n log n)** with binary search; LCS is **O(m × n)** with a 2D table.

## Why It Matters

Subsequences have 2ⁿ candidates, so brute force is hopeless beyond tiny inputs. These two DPs are the basis of many problems: diff tools and version control (LCS), DNA alignment, scheduling and nesting problems (LIS: "Russian doll envelopes", "box stacking"), minimum deletions/insertions to transform strings.

## Prerequisites

- [Dynamic Programming](../dynamic-programming/content.md)
- [Binary Search](../binary-search/content.md) — for O(n log n) LIS.
- [Strings](../../data-structures/strings/content.md) — substring vs subsequence.

## Intuition

**LIS:** the longest increasing subsequence that **ends at** element i extends the best one ending at some earlier, smaller element j. So `dp[i]` = 1 + max `dp[j]` over j < i with `a[j] < a[i]`.

**LCS:** compare the last characters of the two prefixes. If they match, they can both be the last character of a common subsequence (+1, shrink both). If not, at least one of them is not used — try dropping either and take the better.

## How It Works

### LIS in O(n²)

1. `dp[i]` = length of the LIS ending exactly at index i (initially 1).
2. For each i, for each j < i with `a[j] < a[i]`: `dp[i] = max(dp[i], dp[j] + 1)`.
3. Answer: max over all `dp[i]` (the LIS can end anywhere).

### LIS in O(n log n) — "tails" array

Keep `tails[k]` = the **smallest possible tail** of an increasing subsequence of length k + 1 seen so far. `tails` is always sorted. For each x:

- If x is larger than every tail, append it (a longer subsequence exists).
- Otherwise replace the first tail ≥ x (lower bound) with x — the same length can now end with a smaller value, which is never worse.

The length of `tails` is the LIS length. (`tails` itself is **not** necessarily an actual LIS.)

### LCS

1. `dp[i][j]` = LCS length of `a[0..i−1]` and `b[0..j−1]` (prefix lengths, so row/column 0 are empty prefixes = 0).
2. If `a[i−1] == b[j−1]`: `dp[i][j] = dp[i−1][j−1] + 1`; else `dp[i][j] = max(dp[i−1][j], dp[i][j−1])`.
3. Answer: `dp[m][n]`. To recover the subsequence, walk back from (m, n): on a match take the character and go diagonally; otherwise move toward the larger neighbour.

## Visual Explanation

```text
LCS of "ABCBDAB" and "BDCABA" (length 4, e.g. "BCBA"):

        ""  B  D  C  A  B  A
   ""    0  0  0  0  0  0  0
   A     0  0  0  0  1  1  1
   B     0  1  1  1  1  2  2
   C     0  1  1  2  2  2  2
   B     0  1  1  2  2  3  3
   D     0  1  2  2  2  3  3
   A     0  1  2  2  3  3  4
   B     0  1  2  2  3  4  4

LIS tails for [10, 9, 2, 5, 3, 7, 101, 18]:
10 → [10]   9 → [9]   2 → [2]   5 → [2,5]   3 → [2,3]   7 → [2,3,7]   101 → [2,3,7,101]   18 → [2,3,7,18]
length 4
```

## Pseudocode

```pseudocode
lisLength(a):
    tails ← []
    for x in a:
        k ← lowerBound(tails, x)       // first index with tails[k] ≥ x
        if k = tails.size: tails.append(x) else: tails[k] ← x
    return tails.size

lcs(a, b):
    for i from 1 to m:
        for j from 1 to n:
            if a[i−1] = b[j−1]: dp[i][j] ← dp[i−1][j−1] + 1
            else: dp[i][j] ← max(dp[i−1][j], dp[i][j−1])
    return dp[m][n]
```

## Java Implementation

```java
import java.util.*;

public class SubsequenceDp {

    static int lisQuadratic(int[] a) {
        int n = a.length, best = 0;
        int[] dp = new int[n];
        for (int i = 0; i < n; i++) {
            dp[i] = 1;                                     // the element alone
            for (int j = 0; j < i; j++) {
                if (a[j] < a[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
            }
            best = Math.max(best, dp[i]);
        }
        return best;
    }

    static int lisFast(int[] a) {
        int[] tails = new int[a.length];
        int size = 0;
        for (int x : a) {
            int lo = 0, hi = size;                          // lower bound of x in tails[0..size)
            while (lo < hi) {
                int mid = (lo + hi) >>> 1;
                if (tails[mid] >= x) hi = mid; else lo = mid + 1;
            }
            tails[lo] = x;                                  // extend (lo == size) or improve a tail
            if (lo == size) size++;
        }
        return size;
    }

    static String lcs(String a, String b) {
        int m = a.length(), n = b.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1] + 1;
                else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
        StringBuilder sb = new StringBuilder();             // walk back to recover one LCS
        int i = m, j = n;
        while (i > 0 && j > 0) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) {
                sb.append(a.charAt(i - 1));
                i--;
                j--;
            } else if (dp[i - 1][j] >= dp[i][j - 1]) {
                i--;
            } else {
                j--;
            }
        }
        return sb.reverse().toString();
    }

    public static void main(String[] args) {
        int[] a = {10, 9, 2, 5, 3, 7, 101, 18};
        System.out.println("LIS O(n^2) = " + lisQuadratic(a) + ", O(n log n) = " + lisFast(a) + ", all equal = " + lisFast(new int[] {7, 7, 7}));
        String common = lcs("ABCBDAB", "BDCABA");
        System.out.println("LCS = " + common + " (length " + common.length() + "), lcs(abc, def) = [" + lcs("abc", "def") + "]");
    }
}
```

**Output:**

```text
LIS O(n^2) = 4, O(n log n) = 4, all equal = 1
LCS = BCBA (length 4), lcs(abc, def) = []
```

## Dry Run

LIS O(n²) on `[10, 9, 2, 5, 3, 7, 101, 18]`:

| i | a[i] | Smaller earlier elements (dp) | dp[i] |
|---|------|-------------------------------|-------|
| 0 | 10 | — | 1 |
| 1 | 9 | — | 1 |
| 2 | 2 | — | 1 |
| 3 | 5 | 2 (1) | 2 |
| 4 | 3 | 2 (1) | 2 |
| 5 | 7 | 2 (1), 5 (2), 3 (2) | 3 |
| 6 | 101 | all earlier; best 7 (3) | 4 |
| 7 | 18 | 10, 9, 2, 5, 3, 7 (3) | 4 |

## Complexity Analysis

| Algorithm | Time | Space |
|-----------|------|-------|
| LIS, all subsequences | O(2ⁿ × n) | O(n) |
| LIS DP | O(n²) | O(n) |
| LIS with tails + binary search | O(n log n) | O(n) |
| LCS | O(m × n) | O(m × n); O(min(m, n)) for the length only |

## Properties

- LIS: strictly increasing uses lower bound (`≥`); non-decreasing uses upper bound (`>`).
- LCS is symmetric: LCS(a, b) = LCS(b, a).
- LIS of a sequence = LCS of the sequence and its sorted distinct values (an O(n²) alternative).

## Variations

- **Number of LIS** — keep (length, count) per index.
- **Longest bitonic subsequence** — LIS from the left + LIS from the right − 1.
- **Russian doll envelopes / box stacking** — sort cleverly, then LIS.
- **Minimum deletions/insertions to turn a into b** — m + n − 2 × LCS.
- **Shortest common supersequence** — m + n − LCS.
- **Longest palindromic subsequence** = LCS(s, reverse(s)) — see [String DP](../string-dp/content.md).

## Comparison

| | Substring (contiguous) | Subsequence (gaps allowed) |
|---|------------------------|----------------------------|
| Longest common … | `dp[i][j]` = common **suffix** length, reset to 0 on mismatch | LCS: carry the max on mismatch |
| Count for length n | n(n + 1)/2 | 2ⁿ |

## Edge Cases

- Empty sequences (length 0).
- All equal elements (LIS = 1 for strictly increasing).
- Duplicates: decide strictly vs non-strictly increasing.

## Advantages

- Polynomial solutions to exponential search spaces; LCS table also gives the actual subsequence.

## Disadvantages

- O(m × n) memory for LCS reconstruction; O(n log n) LIS gives the length directly but needs extra arrays to recover the sequence.

## When to Use

- "Longest/shortest … that keeps order", "minimum edits/deletions to match", "longest chain/nesting".

## Common Mistakes

- Returning `dp[n − 1]` for LIS instead of the maximum over all i.
- Using 0-based `dp[i][j]` for LCS without empty-prefix row/column (index errors).
- Treating the `tails` array as the LIS itself.
- Mixing up subsequence and substring recurrences.

## Key Takeaways

- LIS: `dp[i]` ends at i, O(n²); tails + lower bound, O(n log n).
- LCS: match → diagonal + 1; mismatch → max of dropping either character; O(m × n).
- Many problems (edits, supersequences, palindromic subsequences, nesting) reduce to LIS or LCS.
