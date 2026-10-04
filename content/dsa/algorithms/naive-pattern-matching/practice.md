# Naive Pattern Matching — Practice

### P1. Find with a single-character wildcard

**Difficulty:** Easy · **Pattern:** Brute-force window comparison

The pattern may contain `?`, which matches any one character. Return all starting indices where the pattern matches the text.

**Constraints:** 1 ≤ m ≤ n ≤ 10³; lowercase letters and `?` (pattern only).

Example: text `"abcabd"`, pattern `"ab?"` → `[0, 3]`.

<details>
<summary>Hint</summary>

Only the comparison changes: a pattern character matches if it is `?` or equals the text character.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class WildcardFind {

    static List<Integer> find(String text, String pattern) {
        List<Integer> result = new ArrayList<>();
        int n = text.length(), m = pattern.length();
        for (int i = 0; i + m <= n; i++) {
            int j = 0;
            while (j < m && (pattern.charAt(j) == '?' || pattern.charAt(j) == text.charAt(i + j))) j++;
            if (j == m) result.add(i);
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(find("abcabd", "ab?") + " " + find("aaaa", "?a") + " " + find("abc", "d"));
    }
}
```

**Output:**

```text
[0, 3] [0, 1, 2] []
```

**Complexity:** O(n × m) time, O(1) extra space. KMP does not adapt directly to wildcards (the failure function assumes exact characters), so brute force is a reasonable answer at these sizes.

</details>

### P2. Is one string a rotation of another?

**Difficulty:** Easy · **Pattern:** Search in a doubled string

Return true if `goal` can be obtained by moving some prefix of `s` to its end.

**Constraints:** 1 ≤ length ≤ 100.

Example: `s = "abcde"`, `goal = "cdeab"` → `true`; `goal = "abced"` → `false`.

<details>
<summary>Hint</summary>

Every rotation of `s` appears as a substring of `s + s`.

</details>

<details>
<summary>Answer</summary>

**Approach:** Check equal lengths, then search for `goal` in `s + s`. With the naive search this is O(n²); with KMP it is O(n).

```java
public class RotationCheck {

    static boolean contains(String text, String p) {
        for (int i = 0; i + p.length() <= text.length(); i++) {
            int j = 0;
            while (j < p.length() && text.charAt(i + j) == p.charAt(j)) j++;
            if (j == p.length()) return true;
        }
        return false;
    }

    static boolean rotateString(String s, String goal) {
        return s.length() == goal.length() && contains(s + s, goal);
    }

    public static void main(String[] args) {
        System.out.println(rotateString("abcde", "cdeab") + " " + rotateString("abcde", "abced") + " " + rotateString("aa", "a"));
    }
}
```

**Output:**

```text
true false false
```

**Complexity:** O(n²) time with the naive search, O(n) space for `s + s`. The length check matters: `"a"` is inside `"aaaa"` but is not a rotation of `"aa"`.

</details>

### P3. Repeated string match

**Difficulty:** Medium · **Pattern:** Bound the search, then brute-force match

Return the minimum number of times `a` must be repeated so that `b` is a substring of the result, or −1 if impossible.

**Constraints:** 1 ≤ |a|, |b| ≤ 10⁴.

Example: `a = "abcd"`, `b = "cdabcdab"` → `3` (`"abcdabcdabcd"`).

<details>
<summary>Hint</summary>

Any occurrence of `b` starts inside the first copy of `a`. So repeat `a` until the length is at least |b|; if `b` is not found, one more copy is the last chance.

</details>

<details>
<summary>Answer</summary>

**Approach:** Let q = ⌈|b| / |a|⌉. If `b` occurs in `a` repeated q times, the answer is q; else try q + 1; else −1. More copies cannot help, because a match starting in the first copy ends within q + 1 copies.

```java
public class RepeatedStringMatch {

    static boolean contains(String text, String p) {
        for (int i = 0; i + p.length() <= text.length(); i++) {
            int j = 0;
            while (j < p.length() && text.charAt(i + j) == p.charAt(j)) j++;
            if (j == p.length()) return true;
        }
        return false;
    }

    static int repeatedStringMatch(String a, String b) {
        int q = (b.length() + a.length() - 1) / a.length();
        String repeated = a.repeat(q);
        if (contains(repeated, b)) return q;
        if (contains(repeated + a, b)) return q + 1;
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(repeatedStringMatch("abcd", "cdabcdab") + " " + repeatedStringMatch("a", "aa") + " " + repeatedStringMatch("abc", "wxyz"));
    }
}
```

**Output:**

```text
3 2 -1
```

**Complexity:** O((|a| + |b|) × |b|) time with the naive search; O(|a| + |b|) with KMP or Rabin–Karp. O(|a| + |b|) space.

</details>
