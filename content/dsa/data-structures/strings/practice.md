# Strings — Practice

### P1. First unique character

**Difficulty:** Easy · **Pattern:** Frequency counting

Return the index of the first character that appears exactly once in a lowercase string, or `-1`.

**Constraints:** 1 ≤ n ≤ 10⁵, letters 'a'–'z'.

Example: `"leetcode"` → `0`; `"loveleetcode"` → `2`; `"aabb"` → `-1`.

<details>
<summary>Hint</summary>

Two passes: count, then find the first index whose count is 1.

</details>

<details>
<summary>Answer</summary>

```java
public class FirstUniqueChar {

    static int firstUnique(String s) {
        int[] counts = new int[26];
        for (int i = 0; i < s.length(); i++) {
            counts[s.charAt(i) - 'a']++;
        }
        for (int i = 0; i < s.length(); i++) {
            if (counts[s.charAt(i) - 'a'] == 1) {
                return i;
            }
        }
        return -1;
    }

    public static void main(String[] args) {
        System.out.println(firstUnique("leetcode") + " " + firstUnique("loveleetcode") + " " + firstUnique("aabb"));
    }
}
```

**Output:**

```text
0 2 -1
```

**Complexity:** O(n) time, O(1) space.

</details>

### P2. Run-length compression

**Difficulty:** Easy · **Pattern:** Group consecutive runs with StringBuilder

Compress runs of repeated characters as character + count: `"aaabccdddd"` → `"a3b1c2d4"`. If the result is not shorter than the input, return the input unchanged.

**Constraints:** 1 ≤ n ≤ 10⁵.

<details>
<summary>Hint</summary>

Use an index `i` for the start of a run and advance `j` while `s[j] == s[i]`.

</details>

<details>
<summary>Answer</summary>

```java
public class RunLength {

    static String compress(String s) {
        StringBuilder sb = new StringBuilder();
        int i = 0;
        while (i < s.length()) {
            int j = i;
            while (j < s.length() && s.charAt(j) == s.charAt(i)) {
                j++;
            }
            sb.append(s.charAt(i)).append(j - i);
            i = j;                                  // next run starts where this one ended
        }
        return sb.length() < s.length() ? sb.toString() : s;
    }

    public static void main(String[] args) {
        System.out.println(compress("aaabccdddd"));
        System.out.println(compress("abc"));
    }
}
```

**Output:**

```text
a3b1c2d4
abc
```

**Complexity:** O(n) time — each character is visited once by `j`. O(n) space for the builder.

</details>

### P3. Valid palindrome with one deletion

**Difficulty:** Medium · **Pattern:** Two pointers with one branch

Return `true` if the string can become a palindrome by deleting **at most one** character.

**Constraints:** 1 ≤ n ≤ 10⁵.

Example: `"abca"` → `true` (delete 'b' or 'c'); `"abc"` → `false`.

<details>
<summary>Hint</summary>

Move inward while ends match. At the first mismatch, try skipping the left character or the right one, and check the rest is a palindrome.

</details>

<details>
<summary>Answer</summary>

**Approach:** Brute force deletes each character and checks (O(n²)). At the first mismatch, any valid deletion must remove one of the two mismatched characters, so only two checks are needed.

```java
public class PalindromeOneDeletion {

    static boolean validPalindrome(String s) {
        int left = 0, right = s.length() - 1;
        while (left < right) {
            if (s.charAt(left) != s.charAt(right)) {
                return isPalindrome(s, left + 1, right) || isPalindrome(s, left, right - 1);
            }
            left++;
            right--;
        }
        return true;
    }

    static boolean isPalindrome(String s, int left, int right) {
        while (left < right) {
            if (s.charAt(left++) != s.charAt(right--)) {
                return false;
            }
        }
        return true;
    }

    public static void main(String[] args) {
        System.out.println(validPalindrome("abca") + " " + validPalindrome("abc") + " " + validPalindrome("deeee"));
    }
}
```

**Output:**

```text
true false true
```

**Complexity:** O(n) time, O(1) space.

</details>

### P4. String to integer with overflow handling

**Difficulty:** Medium · **Pattern:** Careful parsing

Parse a string into an `int`: skip leading spaces, read an optional '+' or '−', then read digits until a non-digit. Clamp the result to the `int` range on overflow. Return 0 if no digits are read.

**Constraints:** 0 ≤ n ≤ 200.

Example: `"   -42abc"` → `-42`; `"9999999999"` → `2147483647`; `"words 12"` → `0`.

<details>
<summary>Hint</summary>

Accumulate in a `long`, or check before multiplying by 10 whether the result would exceed `Integer.MAX_VALUE`.

</details>

<details>
<summary>Answer</summary>

```java
public class ParseInt {

    static int parse(String s) {
        int i = 0, n = s.length();
        while (i < n && s.charAt(i) == ' ') {
            i++;
        }
        int sign = 1;
        if (i < n && (s.charAt(i) == '+' || s.charAt(i) == '-')) {
            sign = s.charAt(i) == '-' ? -1 : 1;
            i++;
        }
        long value = 0;
        while (i < n && Character.isDigit(s.charAt(i))) {
            value = value * 10 + (s.charAt(i) - '0');
            if (sign * value > Integer.MAX_VALUE) return Integer.MAX_VALUE;   // clamp early,
            if (sign * value < Integer.MIN_VALUE) return Integer.MIN_VALUE;   // before long overflows
            i++;
        }
        return (int) (sign * value);
    }

    public static void main(String[] args) {
        System.out.println(parse("   -42abc"));
        System.out.println(parse("9999999999"));
        System.out.println(parse("-91283472332"));
        System.out.println(parse("words 12"));
    }
}
```

**Output:**

```text
-42
2147483647
-2147483648
0
```

**Complexity:** O(n) time, O(1) space.

</details>

### P5. Longest palindromic substring

**Difficulty:** Hard · **Pattern:** Expand around centre

Return the longest substring that is a palindrome (any one if there are ties).

**Constraints:** 1 ≤ n ≤ 1000.

Example: `"babad"` → `"bab"` (or `"aba"`); `"cbbd"` → `"bb"`.

<details>
<summary>Hint</summary>

Every palindrome has a centre: a character (odd length) or a gap between two characters (even length). There are 2n − 1 centres.

</details>

<details>
<summary>Answer</summary>

**Approach:** Brute force checks all O(n²) substrings in O(n) each — O(n³). Expanding from each of the 2n − 1 centres while the ends match finds the longest palindrome around that centre in O(n), total O(n²) with O(1) space. (Manacher's algorithm does it in O(n), rarely expected in interviews.)

```java
public class LongestPalindromicSubstring {

    static String longest(String s) {
        int bestStart = 0, bestLength = 0;
        for (int centre = 0; centre < s.length(); centre++) {
            int odd = expand(s, centre, centre);         // centre on a character
            int even = expand(s, centre, centre + 1);    // centre between two characters
            int length = Math.max(odd, even);
            if (length > bestLength) {
                bestLength = length;
                bestStart = centre - (length - 1) / 2;
            }
        }
        return s.substring(bestStart, bestStart + bestLength);
    }

    // Returns the length of the longest palindrome centred at (left, right).
    static int expand(String s, int left, int right) {
        while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
            left--;
            right++;
        }
        return right - left - 1;
    }

    public static void main(String[] args) {
        System.out.println(longest("babad") + " " + longest("cbbd") + " " + longest("forgeeksskeegfor"));
    }
}
```

**Output:**

```text
bab bb geeksskeeg
```

**Complexity:** O(n²) time, O(1) extra space.

</details>
