# Z Algorithm — Practice

### P1. Shortest repeating block

**Difficulty:** Easy · **Pattern:** Period from the Z-array

Return the length of the shortest string `b` such that `s` equals `b` repeated a whole number of times (return n if no shorter block exists).

**Constraints:** 1 ≤ n ≤ 10⁵.

Example: `"abcabcabc"` → `3`; `"abcab"` → `5`; `"zzzz"` → `1`.

<details>
<summary>Hint</summary>

Block length k works if `s` shifted by k equals itself (`k + Z[k] = n`) and k divides n. Take the smallest such k.

</details>

<details>
<summary>Answer</summary>

```java
public class ShortestBlock {

    static int[] zArray(String s) {
        int n = s.length();
        int[] z = new int[n];
        for (int i = 1, l = 0, r = 0; i < n; i++) {
            if (i < r) z[i] = Math.min(r - i, z[i - l]);
            while (i + z[i] < n && s.charAt(z[i]) == s.charAt(i + z[i])) z[i]++;
            if (i + z[i] > r) { l = i; r = i + z[i]; }
        }
        return z;
    }

    static int shortestBlock(String s) {
        int n = s.length();
        int[] z = zArray(s);
        for (int k = 1; k < n; k++) {
            if (n % k == 0 && k + z[k] == n) return k;
        }
        return n;
    }

    public static void main(String[] args) {
        System.out.println(shortestBlock("abcabcabc") + " " + shortestBlock("abcab") + " " + shortestBlock("zzzz") + " " + shortestBlock("x"));
    }
}
```

**Output:**

```text
3 5 1 1
```

**Complexity:** O(n) time and space. For `"abcab"`, k = 3 has `k + Z[k] = n` (Z[3] = 2) but 3 does not divide 5, so the answer is 5.

</details>

### P2. Sum of prefix-match scores

**Difficulty:** Medium · **Pattern:** Z-array sum

For each suffix of `s`, its score is the length of the longest common prefix of that suffix and `s`. Return the sum of all scores (the full string's score is n).

**Constraints:** 1 ≤ n ≤ 10⁵.

Example: `"babab"` → `9` (scores 5, 0, 3, 0, 1); `"azbazbzaz"` → `14`.

<details>
<summary>Hint</summary>

The score of the suffix starting at i is exactly `Z[i]` (and n for i = 0). Comparing each suffix directly is O(n²).

</details>

<details>
<summary>Answer</summary>

```java
public class SumOfScores {

    static long sumScores(String s) {
        int n = s.length();
        int[] z = new int[n];
        long total = n;                                     // suffix 0 is s itself
        for (int i = 1, l = 0, r = 0; i < n; i++) {
            if (i < r) z[i] = Math.min(r - i, z[i - l]);
            while (i + z[i] < n && s.charAt(z[i]) == s.charAt(i + z[i])) z[i]++;
            if (i + z[i] > r) { l = i; r = i + z[i]; }
            total += z[i];
        }
        return total;
    }

    public static void main(String[] args) {
        System.out.println(sumScores("babab") + " " + sumScores("azbazbzaz"));
    }
}
```

**Output:**

```text
9 14
```

**Complexity:** O(n) time and space. Use `long`: for `"aaa…a"` the sum is n(n + 1)/2 ≈ 5 × 10⁹, beyond `int`.

</details>

### P3. Prefix that is also a suffix and appears in the middle

**Difficulty:** Hard · **Pattern:** Z-array with a running maximum

Find the longest string `t` that is a prefix of `s`, a suffix of `s`, and also occurs somewhere else inside `s` (neither as that prefix nor as that suffix). Return `""` if none.

**Constraints:** 1 ≤ n ≤ 10⁶.

Example: `"fixprefixsuffix"` → `"fix"`; `"abcdabc"` → `""`.

<details>
<summary>Hint</summary>

A suffix starting at i is also a prefix exactly when `i + Z[i] = n`; its length is L = n − i. It occurs in the middle if some j with 1 ≤ j < i has `Z[j] ≥ L`. Scan i left to right keeping the maximum Z seen so far; the first valid i gives the longest L.

</details>

<details>
<summary>Answer</summary>

**Approach:** Smaller i means a longer candidate, so return at the first i that satisfies both conditions. An occurrence at j < i with `Z[j] ≥ L` starts after index 0 (not the prefix) and before i (not the suffix).

```java
public class PrefixSuffixMiddle {

    static String find(String s) {
        int n = s.length();
        int[] z = new int[n];
        int maxSoFar = 0;                                   // max Z[j] for 1 ≤ j < i
        for (int i = 1, l = 0, r = 0; i < n; i++) {
            if (i < r) z[i] = Math.min(r - i, z[i - l]);
            while (i + z[i] < n && s.charAt(z[i]) == s.charAt(i + z[i])) z[i]++;
            if (i + z[i] > r) { l = i; r = i + z[i]; }
        }
        for (int i = 1; i < n; i++) {
            if (i + z[i] == n && maxSoFar >= n - i) return s.substring(i);
            maxSoFar = Math.max(maxSoFar, z[i]);
        }
        return "";
    }

    public static void main(String[] args) {
        System.out.println("[" + find("fixprefixsuffix") + "] [" + find("abcdabc") + "] [" + find("aaaa") + "]");
    }
}
```

**Output:**

```text
[fix] [] [aa]
```

**Complexity:** O(n) time and space. For `"aaaa"`: `"aaa"` is a prefix and suffix but has no third occurrence; `"aa"` occurs at index 1 as well.

</details>
