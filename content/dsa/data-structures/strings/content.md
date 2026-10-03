# Strings

## Definition

A **string** is a sequence of characters. In Java, `String` is an **immutable** object backed by an array of characters (internally bytes); once created, its contents never change. Text that must change efficiently is built with a mutable `StringBuilder`.

## Why It Matters

String problems are among the most common interview questions: palindromes, anagrams, substrings, parsing and transformation. They test array skills (indices, two pointers, sliding windows), counting with arrays or maps, and awareness of Java-specific costs — immutability turns innocent-looking code into O(n²).

## Core Concept

### Immutability and its cost

Every "modification" of a `String` creates a new object:

```java
String s = "abc";
s.toUpperCase();          // returns "ABC"; s is still "abc"
s = s + "d";              // builds a NEW string "abcd" and reassigns s
```

Consequences:

- `s + t` costs O(len(s) + len(t)).
- Building a string of length n with `+=` in a loop costs O(n²).
- `substring(i, j)` copies j − i characters (since Java 7u6).
- Strings are safe to share and to use as `HashMap` keys (their hash never changes, and it is cached).

### `==` vs `equals`

`==` compares references; `equals` compares characters. String literals are interned (stored once in the string pool), so `"hi" == "hi"` is `true`, but strings built at run time are new objects. **Always use `equals`** (or `equalsIgnoreCase`, `compareTo`).

### Characters are numbers

A `char` is a 16-bit unsigned integer (a UTF-16 code unit), so arithmetic works:

| Expression | Value | Use |
|------------|-------|-----|
| `c - 'a'` | 0 for 'a' … 25 for 'z' | index into `int[26]` |
| `c - '0'` | digit value of '0'…'9' | parse digits |
| `(char) ('a' + 2)` | `'c'` | build characters |
| `Character.isLetterOrDigit(c)` | true/false | filter |
| `Character.toLowerCase(c)` | lower case | case-insensitive compare |

> [!NOTE]
> Characters outside the Basic Multilingual Plane (many emoji) take **two** `char`s (a surrogate pair). Interview problems almost always use ASCII; say so if you assume it.

### `StringBuilder`

A resizable character array. `append` is O(1) amortized; `insert(0, x)` and `deleteCharAt(0)` are O(n) (shifting); `reverse()` is O(n); `toString()` copies, O(n).

```java
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 5; i++) {
    sb.append(i).append(',');
}
sb.setLength(sb.length() - 1);    // drop the trailing comma
String result = sb.toString();    // "0,1,2,3,4"
```

`StringBuffer` is the synchronized (slower) legacy version — not needed in single-threaded code.

### Substring vs subsequence vs subarray

| Term | Definition | Count for length n | Example from "abc" |
|------|-----------|--------------------|-------------------|
| Substring | contiguous characters | n(n + 1)/2 (non-empty) | "ab", "bc" |
| Subsequence | characters in order, gaps allowed | 2ⁿ (including empty) | "ac" |
| Prefix / suffix | substring starting at 0 / ending at n − 1 | n + 1 each (with empty) | "ab" / "bc" |

These counts explain brute-force costs: checking all substrings is O(n²) choices (O(n³) if each check is O(n)); all subsequences is O(2ⁿ).

## Visual Explanation

```text
s =      "r a c e c a r"
index:    0 1 2 3 4 5 6
          ↑           ↑       two pointers move inward while s[left] == s[right]
            ↑       ↑
              ↑   ↑
                ↑             left == right → palindrome
```

## Operations

### Frequency counting

Count each character once, then compare counts. For lowercase letters use `int[26]`; for ASCII `int[128]`; for anything else a `HashMap<Character, Integer>`.

```java
static int[] letterCounts(String s) {
    int[] counts = new int[26];
    for (int i = 0; i < s.length(); i++) {
        counts[s.charAt(i) - 'a']++;
    }
    return counts;
}
```

**Time:** O(n) · **Space:** O(1) (26 is a constant)

### Palindrome check

A **palindrome** reads the same forwards and backwards. Compare characters from both ends moving inward; for "ignore case and punctuation" variants, skip non-alphanumeric characters.

```java
static boolean isPalindromeIgnoringPunctuation(String s) {
    int left = 0, right = s.length() - 1;
    while (left < right) {
        if (!Character.isLetterOrDigit(s.charAt(left))) {
            left++;
        } else if (!Character.isLetterOrDigit(s.charAt(right))) {
            right--;
        } else {
            if (Character.toLowerCase(s.charAt(left)) != Character.toLowerCase(s.charAt(right))) {
                return false;
            }
            left++;
            right--;
        }
    }
    return true;
}
```

**Time:** O(n) · **Space:** O(1)

### Anagram check

Two strings are **anagrams** if one is a rearrangement of the other (same characters, same counts).

| Method | Time | Space |
|--------|------|-------|
| Sort both, compare | O(n log n) | O(n) for the char arrays |
| Count array: +1 for s, −1 for t, all zero? | O(n) | O(1) for a fixed alphabet |

### Substring search

`s.indexOf(t)` and `s.contains(t)` find a substring; the JDK uses a simple scan with worst case O(n × m). Linear-time algorithms are [KMP](../../algorithms/kmp-algorithm/content.md), [Rabin–Karp](../../algorithms/rabin-karp/content.md) (expected) and the [Z algorithm](../../algorithms/z-algorithm/content.md).

### Subsequence check

Is t a subsequence of s? Walk through s with a pointer into t; advance the t-pointer whenever characters match. O(len(s)).

### Common manipulation techniques

| Task | Technique |
|------|-----------|
| Reverse a string | `new StringBuilder(s).reverse().toString()`, or two pointers on `char[]` |
| Modify characters in place | `char[] a = s.toCharArray(); … new String(a)` |
| Split into words | `s.trim().split("\\s+")` — regex, handles multiple spaces |
| Join | `String.join(" ", words)` |
| Compare lexicographically | `a.compareTo(b)` (negative, zero, positive) |
| Integer ↔ string | `Integer.parseInt(s)`, `String.valueOf(n)`, `Integer.toString(n, 2)` |
| Canonical form | sorted characters or a count signature (grouping anagrams) |

## Full Java Implementation

```java
import java.util.*;

public class StringToolkit {

    static boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) {
            return false;
        }
        int[] counts = new int[26];
        for (int i = 0; i < s.length(); i++) {
            counts[s.charAt(i) - 'a']++;
            counts[t.charAt(i) - 'a']--;
        }
        for (int c : counts) {
            if (c != 0) {
                return false;
            }
        }
        return true;
    }

    static boolean isSubsequence(String t, String s) {
        int j = 0;                                   // next character of t to match
        for (int i = 0; i < s.length() && j < t.length(); i++) {
            if (s.charAt(i) == t.charAt(j)) {
                j++;
            }
        }
        return j == t.length();
    }

    static String reverseWords(String sentence) {
        String[] words = sentence.trim().split("\\s+");
        Collections.reverse(Arrays.asList(words));   // asList is a view, so this reverses the array
        return String.join(" ", words);
    }

    static Map<Character, Integer> charFrequency(String s) {
        Map<Character, Integer> freq = new TreeMap<>();   // sorted for readable output
        for (char c : s.toCharArray()) {
            freq.merge(c, 1, Integer::sum);
        }
        return freq;
    }

    public static void main(String[] args) {
        System.out.println(isAnagram("listen", "silent") + " " + isAnagram("rat", "car"));
        System.out.println(isSubsequence("ace", "abcde") + " " + isSubsequence("aec", "abcde"));
        System.out.println("[" + reverseWords("  the sky   is blue ") + "]");
        System.out.println(charFrequency("Mississippi"));

        String a = "hello";
        String b = new String("hello");
        System.out.println((a == b) + " " + a.equals(b));
    }
}
```

**Output:**

```text
true false
true false
[blue is sky the]
{M=1, i=4, p=2, s=4}
false true
```

## Dry Run

`isSubsequence("ace", "abcde")`:

| i | s[i] | t[j] | match? | j after |
|---|------|------|--------|---------|
| 0 | a | a | yes | 1 |
| 1 | b | c | no | 1 |
| 2 | c | c | yes | 2 |
| 3 | d | e | no | 2 |
| 4 | e | e | yes | 3 = len(t) → true |

## Complexity Summary

| Operation | Time | Space |
|-----------|------|-------|
| `charAt`, `length` | O(1) | O(1) |
| Concatenation `s + t` | O(len s + len t) | new string |
| `substring(i, j)` | O(j − i) | copy |
| `equals`, `compareTo` | O(min length) worst | O(1) |
| `indexOf` / `contains` (JDK) | O(n × m) worst | O(1) |
| `StringBuilder.append` | O(1) amortized | — |
| `StringBuilder.insert(0, …)`, `deleteCharAt(0)` | O(n) | — |
| Frequency count (fixed alphabet) | O(n) | O(1) |
| Palindrome / anagram / subsequence check | O(n) | O(1) |

## Advantages

- Immutability makes strings thread-safe and reliable hash keys.
- Rich library: search, split, join, compare, case conversion.

## Disadvantages

- Every modification allocates a new string; repeated concatenation is O(n²).
- `substring` and `split` allocate copies.

## Comparison

| | `String` | `StringBuilder` | `char[]` |
|---|----------|-----------------|----------|
| Mutable | no | yes | yes |
| Append | O(n) (new string) | O(1) amortized | fixed size |
| Hash key | yes | no (identity equality) | no (identity equality) |
| Best for | storing, comparing, map keys | building output | in-place character edits |

## Java Collections Equivalent

- `String`, `StringBuilder`, `Character` utilities.
- `String.join`, `String.valueOf`, `s.chars()` (stream of code units).
- `HashMap<Character, Integer>` for frequencies over large alphabets.

## Real-World Applications

- Search boxes, autocomplete, spell checkers.
- Parsing input formats (CSV, JSON, logs).
- DNA sequence analysis (substrings, subsequences).
- Plagiarism detection and diff tools (longest common subsequence).

## Common Mistakes

- Comparing strings with `==`.
- `+=` in loops instead of `StringBuilder`.
- `s.split(" ")` on text with multiple spaces (produces empty strings) — use `"\\s+"` after `trim()`.
- Forgetting that `toUpperCase()` returns a new string.
- `c - 'a'` on uppercase or non-letter characters → negative index.
- Treating "substring" and "subsequence" as the same thing.

## Key Takeaways

- `String` is immutable: concatenation and `substring` copy; use `StringBuilder` to build.
- Compare with `equals`; characters are numbers (`c - 'a'`).
- Fixed-alphabet counting with `int[26]` / `int[128]` is O(n) time, O(1) space.
- Substrings: n(n + 1)/2; subsequences: 2ⁿ — this decides brute-force cost.
