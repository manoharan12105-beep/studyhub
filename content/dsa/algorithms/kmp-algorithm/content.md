# KMP Algorithm

## Definition

The **Knuth–Morris–Pratt (KMP)** algorithm finds all occurrences of a pattern `p` (length m) in a text `t` (length n) in **O(n + m)** time. It first builds the **LPS array** (longest proper prefix that is also a suffix, also called the failure function): `lps[i]` = length of the longest proper prefix of `p[0…i]` that is also a suffix of `p[0…i]`. During the search, on a mismatch it uses `lps` to shift the pattern without ever moving backwards in the text.

## Why It Matters

- Guaranteed linear time, even on adversarial inputs where [naive matching](../naive-pattern-matching/content.md) is O(n × m).
- The LPS array itself solves many problems: shortest period of a string, longest palindromic prefix, counting prefix occurrences.
- A classic interview question: "implement `strStr()` in linear time" or "explain the failure function".

## Prerequisites

- [Naive Pattern Matching](../naive-pattern-matching/content.md)
- [Strings](../../data-structures/strings/content.md)

## Intuition

Suppose we matched `ABAB` and then the next character mismatches. The naive method shifts by one and re-reads text it has already seen. But we already **know** those text characters — they are `ABAB`, the pattern's own prefix. The suffix `AB` of what we matched is also a prefix of the pattern, so the pattern can be shifted to line up its prefix `AB` with that suffix, and comparison continues from the **same** text position with `j = 2`.

`lps[j − 1]` answers "after matching j characters, how many of them can I keep?" It depends only on the pattern, so it is computed once in O(m).

```text
text:     . . A B A B x . .
pattern:      A B A B C         mismatch at x after matching "ABAB"
lps("ABAB") = 2  ("AB" is both prefix and suffix)
shifted:          A B A B C     continue comparing x with p[2]
```

## How It Works

### Building the LPS array

`len` = length of the current longest prefix-suffix; `i` scans the pattern from 1.

1. `lps[0] = 0`, `len = 0`, `i = 1`.
2. If `p[i] == p[len]`: `len++`, `lps[i] = len`, `i++`.
3. Else if `len > 0`: fall back `len = lps[len − 1]` (try the next shorter prefix-suffix; do **not** advance `i`).
4. Else: `lps[i] = 0`, `i++`.

### Searching

`j` = number of pattern characters currently matched.

1. For each text index `i`: while `j > 0` and `t[i] != p[j]`, set `j = lps[j − 1]`.
2. If `t[i] == p[j]`, `j++`.
3. If `j == m`: report a match at `i − m + 1`, then `j = lps[m − 1]` to continue finding overlapping matches.

The text index `i` only moves forward.

## Visual Explanation

LPS for `p = "ABABCABAB"`:

```text
index :  0  1  2  3  4  5  6  7  8
p     :  A  B  A  B  C  A  B  A  B
lps   :  0  0  1  2  0  1  2  3  4

lps[3] = 2: "ABAB"      prefix "AB" = suffix "AB"
lps[4] = 0: "ABABC"     no prefix ends with C
lps[8] = 4: "ABABCABAB" prefix "ABAB" = suffix "ABAB"
```

## Pseudocode

```pseudocode
buildLps(p):
    lps[0] ← 0; len ← 0; i ← 1
    while i < m:
        if p[i] = p[len]: len ← len + 1; lps[i] ← len; i ← i + 1
        else if len > 0: len ← lps[len − 1]
        else: lps[i] ← 0; i ← i + 1
    return lps

kmpSearch(t, p):
    lps ← buildLps(p); j ← 0
    for i from 0 to n − 1:
        while j > 0 and t[i] ≠ p[j]: j ← lps[j − 1]
        if t[i] = p[j]: j ← j + 1
        if j = m: report i − m + 1; j ← lps[j − 1]
```

## Java Implementation

```java
import java.util.*;

public class Kmp {

    static int[] buildLps(String p) {
        int m = p.length();
        int[] lps = new int[m];
        int len = 0;
        for (int i = 1; i < m; ) {
            if (p.charAt(i) == p.charAt(len)) {
                lps[i++] = ++len;
            } else if (len > 0) {
                len = lps[len - 1];                 // try a shorter border; i stays
            } else {
                lps[i++] = 0;
            }
        }
        return lps;
    }

    static List<Integer> search(String text, String p) {
        List<Integer> result = new ArrayList<>();
        if (p.isEmpty()) return result;
        int[] lps = buildLps(p);
        int j = 0;                                  // characters of p matched so far
        for (int i = 0; i < text.length(); i++) {
            while (j > 0 && text.charAt(i) != p.charAt(j)) j = lps[j - 1];
            if (text.charAt(i) == p.charAt(j)) j++;
            if (j == p.length()) {
                result.add(i - j + 1);
                j = lps[j - 1];                     // keep going: allows overlapping matches
            }
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println("lps: " + Arrays.toString(buildLps("ABABCABAB")));
        System.out.println("matches: " + search("ABABDABACDABABCABAB", "ABABCABAB"));
        System.out.println("overlapping: " + search("aaaaa", "aa"));
        System.out.println("lps of aabaaab: " + Arrays.toString(buildLps("aabaaab")));
    }
}
```

**Output:**

```text
lps: [0, 0, 1, 2, 0, 1, 2, 3, 4]
matches: [10]
overlapping: [0, 1, 2, 3]
lps of aabaaab: [0, 1, 0, 1, 2, 2, 3]
```

## Dry Run

Search `p = "ABAC"` (lps = [0, 0, 1, 0]) in `t = "ABABAC"`:

| i | t[i] | j before | Action | j after |
|---|------|----------|--------|---------|
| 0 | A | 0 | match | 1 |
| 1 | B | 1 | match | 2 |
| 2 | A | 2 | match | 3 |
| 3 | B | 3 | B ≠ p[3]=C → j = lps[2] = 1; B = p[1] → match | 2 |
| 4 | A | 2 | match | 3 |
| 5 | C | 3 | match → j = 4 = m, report 5 − 4 + 1 = 2; j = lps[3] = 0 | 0 |

The text index never moved backwards; at i = 3 the pattern jumped from j = 3 to j = 1 using the border `"A"`.

## Complexity Analysis

| Phase | Time | Why |
|-------|------|-----|
| Build LPS | O(m) | `len` increases at most once per `i` step, so total decreases (fallbacks) ≤ total increases ≤ m |
| Search | O(n) | same argument: `j` increases at most n times, so the `while` fallbacks total at most n |
| Total | O(n + m) | worst, average and best case alike |

**Space:** O(m) for the LPS array.

The inner `while` loop looks quadratic, but it is **amortized** O(1) per character: each fallback strictly decreases `j`, and `j` can only have been increased once per text character ([Amortized Analysis](../../fundamentals/amortized-analysis/content.md)).

## Properties

- Deterministic linear worst case; no hashing, no false positives.
- The text is read strictly left to right, once — works on streams.
- `lps` is a property of the pattern alone; one pattern can be searched in many texts.

## Variations

- **Shortest period:** if `p` has length m and `k = m − lps[m − 1]` divides m, the string is `p[0…k−1]` repeated m / k times.
- **Longest palindromic prefix:** LPS of `s + '#' + reverse(s)`; its last value is the length of the longest palindromic prefix (used for "shortest palindrome by adding characters in front").
- **KMP automaton:** precompute the next state for every (state, character) for O(1) transitions.
- **Aho–Corasick** (awareness): KMP generalised to many patterns using a trie with failure links.

## Comparison

| | KMP | [Rabin–Karp](../rabin-karp/content.md) | [Z algorithm](../z-algorithm/content.md) |
|---|-----|------------|-------------|
| Worst case | O(n + m) | O(n × m) (many hash collisions) | O(n + m) |
| Extra space | O(m) | O(1) | O(n + m) on the concatenation |
| Multiple patterns | one at a time | easy for many patterns of equal length | one at a time |
| Key structure | failure function | rolling hash | Z-array |

## Edge Cases

- Empty pattern (return empty or match at 0 — decide explicitly; the code above returns no matches).
- Pattern longer than text: no matches; the loop still runs safely.
- All-equal characters (`"aaaa"`): lps = [0, 1, 2, 3]; overlapping matches.
- After a full match, reset `j = lps[m − 1]`, not 0, or overlapping matches are missed.

## Advantages

- Linear worst case with small constants; no collision risk.
- The LPS array is useful on its own (periods, borders, palindromic prefix).

## Disadvantages

- Harder to derive and to get right under pressure than naive or Rabin–Karp.
- On typical text, a simple scan is often just as fast in practice.

## When to Use

- Large or adversarial inputs where O(n × m) is too slow.
- Problems about borders, periods or repeated structure of a single string.

## Common Mistakes

- Advancing `i` after a fallback while building LPS (it must retry the same `i` with the shorter `len`).
- Falling back with `len = lps[len]` instead of `lps[len − 1]`.
- Resetting `j = 0` after a match instead of `lps[m − 1]`.
- Claiming the nested loop makes KMP O(n × m) — the amortized argument shows it is O(n).

## Key Takeaways

- `lps[i]` = longest proper prefix of `p[0…i]` that is also its suffix.
- On a mismatch, `j = lps[j − 1]`; the text index never goes back.
- O(n + m) time, O(m) space, by an amortized argument on `j`.
