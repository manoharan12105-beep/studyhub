# String DP — Practice

### P1. Minimum insertions to make a palindrome

**Difficulty:** Medium · **Pattern:** n − longest palindromic subsequence

Return the minimum number of characters to insert (anywhere) to make a string a palindrome.

**Constraints:** 1 ≤ n ≤ 500.

Example: `"mbadm"` → `2` ("mbdadbm"); `"leetcode"` → `5`.

<details>
<summary>Hint</summary>

Characters already forming the longest palindromic subsequence can stay; every other character needs a mirrored partner inserted.

</details>

<details>
<summary>Answer</summary>

```java
public class MinInsertionsPalindrome {

    static int minInsertions(String s) {
        int n = s.length();
        int[] dp = new int[n];                             // dp[j] = LPS of s[i..j] for the current i
        for (int i = n - 1; i >= 0; i--) {
            int diagonal = 0;                              // holds the previous row's dp[j-1] (= dp[i+1][j-1])
            dp[i] = 1;
            for (int j = i + 1; j < n; j++) {
                int saved = dp[j];                         // dp[i+1][j], needed as next diagonal
                dp[j] = s.charAt(i) == s.charAt(j) ? diagonal + 2 : Math.max(dp[j], dp[j - 1]);
                diagonal = saved;
            }
        }
        return n - dp[n - 1];
    }

    public static void main(String[] args) {
        System.out.println(minInsertions("mbadm") + " " + minInsertions("leetcode") + " " + minInsertions("zzazz"));
    }
}
```

**Output:**

```text
2 5 0
```

**Complexity:** O(n²) time, O(n) space (one row plus a saved diagonal).

</details>

### P2. Longest common substring

**Difficulty:** Medium · **Pattern:** Common suffix length, reset on mismatch

Return the length of the longest **contiguous** substring common to both strings.

**Constraints:** 1 ≤ lengths ≤ 1000.

Example: `"abcdxyz"`, `"xyzabcd"` → `4` ("abcd").

<details>
<summary>Hint</summary>

Unlike LCS, a mismatch breaks contiguity: `dp[i][j]` = length of the common suffix of a[0..i) and b[0..j), and 0 on a mismatch. Track the maximum.

</details>

<details>
<summary>Answer</summary>

```java
public class LongestCommonSubstring {

    static int longest(String a, String b) {
        int[][] dp = new int[a.length() + 1][b.length() + 1];
        int best = 0;
        for (int i = 1; i <= a.length(); i++) {
            for (int j = 1; j <= b.length(); j++) {
                if (a.charAt(i - 1) == b.charAt(j - 1)) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                    best = Math.max(best, dp[i][j]);
                }                                        // else stays 0: contiguity broken
            }
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(longest("abcdxyz", "xyzabcd") + " " + longest("zxabcdezy", "yzabcdezx") + " " + longest("abc", "def"));
    }
}
```

**Output:**

```text
4 6 0
```

**Complexity:** O(m × n) time and space (two rows suffice).

</details>

### P3. Distinct subsequences

**Difficulty:** Hard · **Pattern:** Counting over two prefixes

Count the number of distinct ways string t appears as a subsequence of string s (different index choices count separately).

**Constraints:** 1 ≤ lengths ≤ 1000; the answer fits in a 32-bit signed integer.

Example: s = `"rabbbit"`, t = `"rabbit"` → `3`.

<details>
<summary>Hint</summary>

`dp[i][j]` = ways t[0..j) appears in s[0..i). Skipping s[i−1] always contributes `dp[i−1][j]`; if s[i−1] == t[j−1], using it adds `dp[i−1][j−1]`. Base: `dp[i][0] = 1`.

</details>

<details>
<summary>Answer</summary>

```java
public class DistinctSubsequences {

    static int numDistinct(String s, String t) {
        long[] dp = new long[t.length() + 1];             // one row over j; iterate j downwards
        dp[0] = 1;                                         // empty t: one way
        for (int i = 1; i <= s.length(); i++) {
            for (int j = Math.min(i, t.length()); j >= 1; j--) {
                if (s.charAt(i - 1) == t.charAt(j - 1)) dp[j] += dp[j - 1];   // dp[j-1] still from row i-1
            }
        }
        return (int) dp[t.length()];
    }

    public static void main(String[] args) {
        System.out.println(numDistinct("rabbbit", "rabbit") + " " + numDistinct("babgbag", "bag") + " " + numDistinct("abc", "abcd"));
    }
}
```

**Output:**

```text
3 5 0
```

**Complexity:** O(m × n) time, O(n) space. The downward j loop plays the same role as in 0/1 knapsack — each character of s is used at most once per match.

</details>

### P4. Wildcard matching

**Difficulty:** Hard · **Pattern:** Prefix DP with a multi-length wildcard

Pattern characters: `?` matches any single character; `*` matches any sequence (including empty). Does the pattern match the **entire** string?

**Constraints:** 0 ≤ lengths ≤ 2000.

Example: `"adceb"`, `"*a*b"` → `true`; `"cb"`, `"?a"` → `false`.

<details>
<summary>Hint</summary>

`dp[i][j]` = does s[0..i) match p[0..j)? For `*`: either it matches nothing (`dp[i][j−1]`) or it absorbs one more character of s (`dp[i−1][j]`).

</details>

<details>
<summary>Answer</summary>

```java
public class WildcardMatching {

    static boolean isMatch(String s, String p) {
        int m = s.length(), n = p.length();
        boolean[][] dp = new boolean[m + 1][n + 1];
        dp[0][0] = true;
        for (int j = 1; j <= n && p.charAt(j - 1) == '*'; j++) dp[0][j] = true;   // leading *s match ""
        for (int i = 1; i <= m; i++) {
            for (int j = 1; j <= n; j++) {
                char pc = p.charAt(j - 1);
                if (pc == '*') {
                    dp[i][j] = dp[i][j - 1] || dp[i - 1][j];       // empty, or one more character
                } else if (pc == '?' || pc == s.charAt(i - 1)) {
                    dp[i][j] = dp[i - 1][j - 1];
                }
            }
        }
        return dp[m][n];
    }

    public static void main(String[] args) {
        System.out.println(isMatch("adceb", "*a*b") + " " + isMatch("cb", "?a") + " " + isMatch("aa", "*") + " " + isMatch("acdcb", "a*c?b"));
    }
}
```

**Output:**

```text
true false true false
```

**Complexity:** O(m × n) time and space.

</details>
