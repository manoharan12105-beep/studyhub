# Backtracking Pattern — Practice

### P1. Letter case permutations

**Difficulty:** Easy · **Pattern:** Two choices per letter

Return every string obtainable by changing each letter of `s` to lowercase or uppercase (digits stay).

**Constraints:** 1 ≤ |s| ≤ 12; letters and digits.

Example: `"a1b2"` → `["a1b2", "a1B2", "A1b2", "A1B2"]`.

<details>
<summary>Hint</summary>

Walk the characters left to right. A digit has one choice; a letter has two. Modify a `char[]` in place and undo after each branch.

</details>

<details>
<summary>Answer</summary>

```java
import java.util.*;

public class LetterCasePermutation {

    static List<String> letterCasePermutation(String s) {
        List<String> out = new ArrayList<>();
        backtrack(s.toCharArray(), 0, out);
        return out;
    }

    static void backtrack(char[] chars, int i, List<String> out) {
        if (i == chars.length) {
            out.add(new String(chars));
            return;
        }
        if (Character.isLetter(chars[i])) {
            char original = chars[i];
            chars[i] = Character.toLowerCase(original);
            backtrack(chars, i + 1, out);
            chars[i] = Character.toUpperCase(original);
            backtrack(chars, i + 1, out);
            chars[i] = original;                       // undo
        } else {
            backtrack(chars, i + 1, out);
        }
    }

    public static void main(String[] args) {
        System.out.println(letterCasePermutation("a1b2") + " " + letterCasePermutation("3z4"));
    }
}
```

**Output:**

```text
[a1b2, a1B2, A1b2, A1B2] [3z4, 3Z4]
```

**Complexity:** O(2ᴸ × n) time for L letters (each output costs O(n) to build), O(n) recursion depth.

</details>

### P2. All palindrome partitions

**Difficulty:** Medium · **Pattern:** Choose the next cut, validate the piece

Return every way to split `s` into pieces that are all palindromes.

**Constraints:** 1 ≤ |s| ≤ 16.

Example: `"aab"` → `[[a, a, b], [aa, b]]`.

<details>
<summary>Hint</summary>

From position `start`, try every end `e`; if `s[start … e]` is a palindrome, take it and recurse from e + 1. Precomputing `isPal[i][j]` with DP makes each check O(1).

</details>

<details>
<summary>Answer</summary>

**Approach:** The minimum number of cuts is a DP problem ([Partition and Interval DP](../../algorithms/partition-and-interval-dp/content.md)); listing every partition needs backtracking because the output itself can be exponential.

```java
import java.util.*;

public class PalindromePartitions {

    static List<List<String>> partition(String s) {
        int n = s.length();
        boolean[][] pal = new boolean[n][n];
        for (int i = n - 1; i >= 0; i--)
            for (int j = i; j < n; j++)
                pal[i][j] = s.charAt(i) == s.charAt(j) && (j - i < 2 || pal[i + 1][j - 1]);
        List<List<String>> out = new ArrayList<>();
        backtrack(s, 0, pal, new ArrayList<>(), out);
        return out;
    }

    static void backtrack(String s, int start, boolean[][] pal, List<String> path, List<List<String>> out) {
        if (start == s.length()) {
            out.add(new ArrayList<>(path));
            return;
        }
        for (int end = start; end < s.length(); end++) {
            if (!pal[start][end]) continue;            // prune: piece must be a palindrome
            path.add(s.substring(start, end + 1));
            backtrack(s, end + 1, pal, path, out);
            path.remove(path.size() - 1);
        }
    }

    public static void main(String[] args) {
        System.out.println(partition("aab") + " " + partition("a") + " " + partition("abba"));
    }
}
```

**Output:**

```text
[[a, a, b], [aa, b]] [[a]] [[a, b, b, a], [a, bb, a], [abba]]
```

**Complexity:** O(n × 2ⁿ) time in the worst case (`"aaaa…"` has 2ⁿ⁻¹ partitions), O(n²) for the table.

</details>

### P3. Insert operators to reach a target

**Difficulty:** Hard · **Pattern:** Backtracking with running value and last operand

Insert `+`, `-` or `*` between the digits of `num` (or leave digits joined into multi-digit numbers) so that the expression evaluates to `target`. Return all such expressions. Numbers may not have leading zeros.

**Constraints:** 1 ≤ |num| ≤ 10; −2³¹ ≤ target ≤ 2³¹ − 1.

Example: `"123"`, 6 → `["1+2+3", "1*2*3"]`; `"105"`, 5 → `["1*0+5", "10-5"]`.

<details>
<summary>Hint</summary>

Carry the value so far and the **last operand** added. Multiplication binds tighter: for `*x`, undo the last operand and replace it with `last × x`: `value − last + last × x`.

</details>

<details>
<summary>Answer</summary>

**Approach:** At each position choose the next number (1 to the remaining digits, no leading zero) and an operator. Use `long` to avoid overflow on intermediate values.

```java
import java.util.*;

public class ExpressionAddOperators {

    static List<String> addOperators(String num, int target) {
        List<String> out = new ArrayList<>();
        backtrack(num, target, 0, 0, 0, new StringBuilder(), out);
        return out;
    }

    static void backtrack(String num, long target, int pos, long value, long last, StringBuilder expr, List<String> out) {
        if (pos == num.length()) {
            if (value == target) out.add(expr.toString());
            return;
        }
        int lengthBefore = expr.length();
        for (int end = pos; end < num.length(); end++) {
            if (end > pos && num.charAt(pos) == '0') break;            // no leading zeros
            long x = Long.parseLong(num.substring(pos, end + 1));
            if (pos == 0) {
                expr.append(x);
                backtrack(num, target, end + 1, x, x, expr, out);
            } else {
                expr.append('+').append(x);
                backtrack(num, target, end + 1, value + x, x, expr, out);
                expr.setLength(lengthBefore);
                expr.append('-').append(x);
                backtrack(num, target, end + 1, value - x, -x, expr, out);
                expr.setLength(lengthBefore);
                expr.append('*').append(x);
                backtrack(num, target, end + 1, value - last + last * x, last * x, expr, out);
            }
            expr.setLength(lengthBefore);                              // undo
        }
    }

    public static void main(String[] args) {
        System.out.println(addOperators("123", 6) + " " + addOperators("105", 5) + " " + addOperators("232", 8) + " " + addOperators("3456237490", 9191));
    }
}
```

**Output:**

```text
[1+2+3, 1*2*3] [1*0+5, 10-5] [2+3*2, 2*3+2] []
```

**Complexity:** O(4ⁿ × n) time in the worst case (between each pair of digits: +, −, ×, or join), O(n) recursion depth.

</details>
