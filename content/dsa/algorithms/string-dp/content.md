# String DP (Edit Distance, Palindromes, Word Break)

## Definition

**String DP** uses states over **prefixes** or **substrings** of strings: `dp[i][j]` for prefixes of two strings (edit distance), `dp[i][j]` for the substring `s[i..j]` (palindromes), or `dp[i]` for the prefix of length i (word break). Typical costs are O(m × n) or O(n²).

## Why It Matters

Spell checkers, DNA alignment, diff tools, autocorrect and tokenisers all rely on these DPs. In interviews, **edit distance**, **longest palindromic subsequence** and **word break** are the canonical string DP questions, and their recurrences reappear in many variants (minimum insertions, distinct subsequences, regex/wildcard matching).

## Prerequisites

- [Subsequence DP](../subsequence-dp/content.md) — prefix-pair tables (LCS).
- [Strings](../../data-structures/strings/content.md)

## Intuition

All three look at the **ends** of the current pieces:

- **Edit distance:** if the last characters match, no work is needed for them; otherwise the last operation was an insert, delete or replace — try all three.
- **Palindromic subsequence of s[i..j]:** if the two end characters match, they wrap a palindrome of the inside; otherwise drop one end.
- **Word break:** the prefix of length i can be split if some dictionary word is its **last piece** and the part before it can be split.

## How It Works

### Edit distance (Levenshtein)

Minimum insertions, deletions and substitutions turning a into b.

1. `dp[i][j]` = edit distance between `a[0..i−1]` and `b[0..j−1]`.
2. Base: `dp[i][0] = i` (delete everything), `dp[0][j] = j` (insert everything).
3. If `a[i−1] == b[j−1]`: `dp[i][j] = dp[i−1][j−1]`.
   Else: `dp[i][j] = 1 + min(dp[i−1][j] (delete), dp[i][j−1] (insert), dp[i−1][j−1] (replace))`.

### Longest palindromic subsequence (LPS)

1. `dp[i][j]` = LPS length within `s[i..j]`.
2. Base: `dp[i][i] = 1`.
3. If `s[i] == s[j]`: `dp[i][j] = dp[i+1][j−1] + 2`; else `max(dp[i+1][j], dp[i][j−1])`.
4. Fill by **increasing length** (or i from n − 1 down to 0, j from i + 1 up), because `dp[i][j]` needs shorter ranges. Answer `dp[0][n−1]`. (Equivalently LCS(s, reverse(s)).)

### Palindromic substrings

`isPal[i][j] = s[i] == s[j] && (j − i < 2 || isPal[i+1][j−1])` — O(n²) table answering "is s[i..j] a palindrome?" in O(1), reused by partition DP. (For just the longest palindromic substring, expanding around centres is simpler — see [Strings](../../data-structures/strings/content.md) practice.)

### Word break

1. `dp[i]` = can the prefix of length i be segmented into dictionary words?
2. `dp[0] = true`.
3. `dp[i] = true` if some j < i has `dp[j]` true and `s[j..i−1]` in the dictionary (limit j to the maximum word length for speed).

## Visual Explanation

```text
Edit distance "horse" → "ros" = 3

          ""  r  o  s
     ""    0  1  2  3
     h     1  1  2  3
     o     2  2  1  2
     r     3  2  2  2
     s     4  3  3  2
     e     5  4  4  3

horse → rorse (replace h→r) → rose (delete r) → ros (delete e)
```

## Pseudocode

```pseudocode
editDistance(a, b):
    for i from 0 to m: dp[i][0] ← i
    for j from 0 to n: dp[0][j] ← j
    for i from 1 to m:
        for j from 1 to n:
            if a[i−1] = b[j−1]: dp[i][j] ← dp[i−1][j−1]
            else: dp[i][j] ← 1 + min(dp[i−1][j], dp[i][j−1], dp[i−1][j−1])
    return dp[m][n]
```

## Java Implementation

```java
import java.util.*;

public class StringDp {

    static int editDistance(String a, String b) {
        int m = a.length(), n = b.length();
        int[][] dp = new int[m + 1][n + 1];
        for (int i = 0; i <= m; i++) dp[i][0] = i;          // delete all of a's prefix
        for (int j = 0; j <= n; j++) dp[0][j] = j;          // insert all of b's prefix
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] = 1 + Math.min(dp[i - 1][j - 1],                 // replace
                                   Math.min(dp[i - 1][j], dp[i][j - 1]));      // delete, insert
                }
            }
        }
        return dp[m][n];
    }

    static int longestPalindromicSubsequence(String s) {
        int n = s.length();
        int[][] dp = new int[n][n];
        for (int i = n - 1; i >= 0; i--) {                  // shorter ranges (larger i) first
            dp[i][i] = 1;
            for (int j = i + 1; j < n; j++) {
                if (s.charAt(i) == s.charAt(j)) dp[i][j] = dp[i + 1][j - 1] + 2;
                else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
            }
        }
        return dp[0][n - 1];
    }

    static boolean wordBreak(String s, List<String> words) {
        Set<String> dict = new HashSet<>(words);
        int maxLen = 0;
        for (String w : words) maxLen = Math.max(maxLen, w.length());
        boolean[] dp = new boolean[s.length() + 1];
        dp[0] = true;                                        // empty prefix
        for (int i = 1; i <= s.length(); i++) {
            for (int j = Math.max(0, i - maxLen); j < i && !dp[i]; j++) {
                dp[i] = dp[j] && dict.contains(s.substring(j, i));   // last word is s[j..i)
            }
        }
        return dp[s.length()];
    }

    public static void main(String[] args) {
        System.out.println("edit(horse, ros) = " + editDistance("horse", "ros") + ", edit(intention, execution) = " + editDistance("intention", "execution") + ", edit(, abc) = " + editDistance("", "abc"));
        System.out.println("LPS(bbbab) = " + longestPalindromicSubsequence("bbbab") + ", LPS(cbbd) = " + longestPalindromicSubsequence("cbbd"));
        System.out.println("wordBreak(applepenapple) = " + wordBreak("applepenapple", List.of("apple", "pen"))
                + ", wordBreak(catsandog) = " + wordBreak("catsandog", List.of("cats", "dog", "sand", "and", "cat")));
    }
}
```

**Output:**

```text
edit(horse, ros) = 3, edit(intention, execution) = 5, edit(, abc) = 3
LPS(bbbab) = 4, LPS(cbbd) = 2
wordBreak(applepenapple) = true, wordBreak(catsandog) = false
```

## Dry Run

Word break "applepenapple" with {apple, pen} (maxLen 5):

| i | Prefix | Found split (j) | dp[i] |
|---|--------|-----------------|-------|
| 0 | "" | — | true |
| 5 | "apple" | j = 0, "apple" | true |
| 8 | "applepen" | j = 5, "pen" | true |
| 13 | "applepenapple" | j = 8, "apple" | true |

All other dp[i] are false (no dictionary word ends there with a true prefix).

## Complexity Analysis

| Problem | Time | Space |
|---------|------|-------|
| Edit distance | O(m × n) | O(m × n), O(min(m, n)) with two rows |
| Longest palindromic subsequence | O(n²) | O(n²), O(n) with two rows |
| Palindrome table | O(n²) | O(n²) |
| Word break | O(n × L × L) with max word length L (substring + hashing cost L) | O(n) |

## Properties

- Prefix states (`dp[i][j]` over a[0..i), b[0..j)) fill row by row; substring states (`dp[i][j]` over s[i..j]) fill by increasing length.
- Row/column 0 for empty prefixes removes special cases.

## Variations

- **Minimum insertions (or deletions) to make a palindrome** = n − LPS.
- **Distinct subsequences** (count ways b appears as a subsequence of a).
- **Wildcard / regular-expression matching** — `dp[i][j]` over prefixes with `*` cases.
- **Word break II** — list all segmentations (DP + backtracking).
- **Interleaving strings** — `dp[i][j]` = can a[0..i) and b[0..j) interleave into c[0..i+j).

## Comparison

| Problem | State | Fill order |
|---------|-------|-----------|
| Edit distance, LCS, distinct subsequences, wildcard | two prefixes `dp[i][j]` | i, j increasing |
| LPS, palindrome checks, interval problems | substring `dp[i][j]` | increasing length |
| Word break, decode ways | one prefix `dp[i]` | i increasing |

## Edge Cases

- Empty strings (distance = other length; empty string is always segmentable).
- Single characters; all characters identical.
- Very long strings with O(n²) memory — compress rows when only the value is needed.

## Advantages

- Systematic recurrences for problems with exponential naive search.

## Disadvantages

- O(n²) or O(m × n) memory if paths must be recovered.

## When to Use

- "Minimum operations to transform", "longest palindromic …", "can the string be split into dictionary words", "count matches of a pattern".

## Common Mistakes

- Mixing up which neighbour means insert vs delete (it does not change the answer, but explanations go wrong).
- Filling substring tables row by row from the top (the inside range is not ready yet).
- Word break without the empty-prefix base case.
- Calling `substring` in the innermost loop without bounding by the maximum word length.

## Key Takeaways

- Edit distance: match → diagonal; else 1 + min(insert, delete, replace).
- LPS: ends equal → inside + 2; else drop an end; fill by increasing length.
- Word break: `dp[i]` = some dictionary word ends at i after a breakable prefix.
