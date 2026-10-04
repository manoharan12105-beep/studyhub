# KMP Algorithm — Practice

### P1. First occurrence in linear time

**Difficulty:** Easy · **Pattern:** KMP search, stop at the first match

Return the index of the first occurrence of `needle` in `haystack`, or −1. Must be O(n + m) in the worst case.

**Constraints:** 1 ≤ n, m ≤ 10⁴.

Example: `haystack = "sadbutsad"`, `needle = "sad"` → `0`; `"leetcode"`, `"leeto"` → `-1`.

<details>
<summary>Hint</summary>

Build the LPS array of `needle` and run the KMP search loop; return as soon as `j == m`.

</details>

<details>
<summary>Answer</summary>

```java
public class StrStrKmp {

    static int strStr(String haystack, String needle) {
        int m = needle.length();
        int[] lps = new int[m];
        for (int i = 1, len = 0; i < m; ) {
            if (needle.charAt(i) == needle.charAt(len)) lps[i++] = ++len;
            else if (len > 0) len = lps[len - 1];
            else lps[i++] = 0;
        }
        for (int i = 0, j = 0; i < haystack.length(); i++) {
            while (j > 0 && haystack.charAt(i) != needle.charAt(j)) j = lps[j - 1];
            if (haystack.charAt(i) == needle.charAt(j)) j++;
            if (j == m) return i - m + 1;
        }
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(strStr("sadbutsad", "sad") + " " + strStr("leetcode", "leeto") + " " + strStr("mississippi", "issip"));
    }
}
```

**Output:**

```text
0 -1 4
```

**Complexity:** O(n + m) time, O(m) space.

</details>

### P2. Repeated substring pattern

**Difficulty:** Easy · **Pattern:** Period from the last LPS value

Return true if `s` can be built by repeating one of its proper substrings several times.

**Constraints:** 1 ≤ n ≤ 10⁴.

Example: `"abab"` → `true`; `"aba"` → `false`; `"abcabcabcabc"` → `true`.

<details>
<summary>Hint</summary>

The shortest period is `k = n − lps[n − 1]`. The string is a repetition exactly when `lps[n − 1] > 0` and `k` divides n.

</details>

<details>
<summary>Answer</summary>

**Approach:** The longest border (prefix = suffix) of length L means `s` is unchanged when shifted by n − L; if that shift divides n, the shifted copies tile the string.

```java
public class RepeatedSubstring {

    static boolean repeatedSubstringPattern(String s) {
        int n = s.length();
        int[] lps = new int[n];
        for (int i = 1, len = 0; i < n; ) {
            if (s.charAt(i) == s.charAt(len)) lps[i++] = ++len;
            else if (len > 0) len = lps[len - 1];
            else lps[i++] = 0;
        }
        int border = lps[n - 1];
        return border > 0 && n % (n - border) == 0;
    }

    public static void main(String[] args) {
        System.out.println(repeatedSubstringPattern("abab") + " " + repeatedSubstringPattern("aba") + " "
                + repeatedSubstringPattern("abcabcabcabc") + " " + repeatedSubstringPattern("abaababaab"));
    }
}
```

**Output:**

```text
true false true true
```

**Complexity:** O(n) time, O(n) space. `"abaababaab"` = `"abaab"` × 2: lps[9] = 5, period 5 divides 10.

</details>

### P3. Shortest palindrome by adding characters in front

**Difficulty:** Hard · **Pattern:** LPS of `s + '#' + reverse(s)`

Add the fewest characters to the **front** of `s` to make it a palindrome; return the result.

**Constraints:** 0 ≤ n ≤ 5 × 10⁴.

Example: `"aacecaaa"` → `"aaacecaaa"`; `"abcd"` → `"dcbabcd"`.

<details>
<summary>Hint</summary>

Only the longest palindromic **prefix** of `s` can stay in place; the rest is reversed and prepended. That prefix is a prefix of `s` that equals a suffix of `reverse(s)` — exactly what the LPS array of `s + '#' + reverse(s)` measures. The `#` stops a border from crossing the middle.

</details>

<details>
<summary>Answer</summary>

**Approach:** Let L = last LPS value of `s + "#" + reverse(s)`. Then `s[0…L−1]` is the longest palindromic prefix; prepend the reverse of `s[L…]`. Checking each prefix for palindromicity would be O(n²).

```java
public class ShortestPalindrome {

    static String shortestPalindrome(String s) {
        String rev = new StringBuilder(s).reverse().toString();
        String t = s + "#" + rev;
        int[] lps = new int[t.length()];
        for (int i = 1, len = 0; i < t.length(); ) {
            if (t.charAt(i) == t.charAt(len)) lps[i++] = ++len;
            else if (len > 0) len = lps[len - 1];
            else lps[i++] = 0;
        }
        int keep = lps[t.length() - 1];                  // longest palindromic prefix
        return new StringBuilder(s.substring(keep)).reverse() + s;
    }

    public static void main(String[] args) {
        System.out.println(shortestPalindrome("aacecaaa") + " " + shortestPalindrome("abcd") + " [" + shortestPalindrome("") + "]");
    }
}
```

**Output:**

```text
aaacecaaa dcbabcd []
```

**Complexity:** O(n) time, O(n) space.

</details>
