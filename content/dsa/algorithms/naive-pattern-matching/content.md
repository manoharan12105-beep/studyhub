# Naive Pattern Matching

## Definition

**Pattern matching** (string searching) finds every position where a **pattern** `p` of length m occurs inside a **text** `t` of length n. The **naive** (brute-force) algorithm tries every starting position `i` from 0 to n − m and compares `p` with `t[i … i+m−1]` character by character, stopping at the first mismatch. Worst case O(n × m), extra space O(1).

## Why It Matters

- It is the baseline every faster algorithm ([KMP](../kmp-algorithm/content.md), [Rabin–Karp](../rabin-karp/content.md), [Z algorithm](../z-algorithm/content.md)) improves on — you must be able to explain exactly **what work it repeats**.
- On ordinary text it is fast in practice (mismatches usually happen at the first or second character), which is why library methods such as `String.indexOf` use a direct scan.
- Interviewers often accept it for "implement `strStr()`" and then ask for the worst case and how to beat it.

## Prerequisites

- [Strings](../../data-structures/strings/content.md)
- [Time Complexity](../../fundamentals/time-complexity/content.md)

## Intuition

Slide the pattern along the text like a stencil. At each position, compare left to right; if every character matches, report the position; otherwise move the stencil **one** step right and start comparing again from the pattern's first character.

The weakness: after a partial match of k characters, the algorithm forgets everything it learned about those k text characters and re-reads most of them at the next shift.

## How It Works

1. For each start `i` from 0 to n − m:
   1. Set `j = 0`.
   2. While `j < m` and `t[i + j] == p[j]`, increment `j`.
   3. If `j == m`, record `i` as a match.
2. Return the recorded positions.

The loop bound is `i ≤ n − m`: a start beyond that leaves fewer than m text characters.

## Visual Explanation

```text
text    = A A B A A C A A B A A
pattern = A A B A A

i = 0:  A A B A A          all 5 match  → match at 0
i = 1:    A A B A A        t[1]=A p[0]=A, t[2]=B p[1]=A ✗
i = 2:      A A B A A      t[2]=B p[0]=A ✗
i = 3:        A A B A A    A A ✓, t[5]=C p[2]=B ✗
i = 4:          A A B A A  t[4]=A ✓, t[5]=C p[1]=A ✗
i = 5:            A ...    t[5]=C ✗
i = 6:              A A B A A   all 5 match → match at 6
```

## Pseudocode

```pseudocode
naiveSearch(t, p):
    n ← length(t); m ← length(p); result ← []
    for i from 0 to n − m:
        j ← 0
        while j < m and t[i + j] = p[j]:
            j ← j + 1
        if j = m: append i to result
    return result
```

## Java Implementation

```java
import java.util.*;

public class NaivePatternMatching {

    static List<Integer> search(String text, String pattern) {
        List<Integer> result = new ArrayList<>();
        int n = text.length(), m = pattern.length();
        for (int i = 0; i + m <= n; i++) {                // i ≤ n − m
            int j = 0;
            while (j < m && text.charAt(i + j) == pattern.charAt(j)) j++;
            if (j == m) result.add(i);                     // full match
        }
        return result;
    }

    // Counts character comparisons to show the worst case.
    static long comparisons(String text, String pattern) {
        long count = 0;
        int n = text.length(), m = pattern.length();
        for (int i = 0; i + m <= n; i++) {
            for (int j = 0; j < m; j++) {
                count++;
                if (text.charAt(i + j) != pattern.charAt(j)) break;
            }
        }
        return count;
    }

    public static void main(String[] args) {
        System.out.println(search("AABAACAABAA", "AABAA"));
        System.out.println(search("aaaaa", "aa"));           // overlapping matches
        System.out.println(search("abc", "abcd"));           // pattern longer than text
        String worstText = "a".repeat(20), worstPattern = "a".repeat(4) + "b";
        System.out.println("worst case comparisons: " + comparisons(worstText, worstPattern));
    }
}
```

**Output:**

```text
[0, 6]
[0, 1, 2, 3]
[]
worst case comparisons: 80
```

The worst case: 16 starts × 5 comparisons each = 80, i.e. (n − m + 1) × m.

## Dry Run

Text `"ABABC"`, pattern `"ABC"` (n = 5, m = 3, starts 0…2):

| i | Comparisons | Result |
|---|-------------|--------|
| 0 | A=A, B=B, A≠C | mismatch at j = 2 |
| 1 | B≠A | mismatch at j = 0 |
| 2 | A=A, B=B, C=C | match at 2 |

At i = 1 the algorithm re-reads `t[1] = B`, which it had already seen at i = 0 — this re-reading is what KMP eliminates.

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| Best | O(n) | every start mismatches at the first character (or O(m) if the match is at 0 and only the first is wanted) |
| Average (random text, large alphabet) | O(n) | expected comparisons per start are below 2 |
| Worst | O((n − m + 1) × m) = O(n × m) | e.g. text `aaaa…a`, pattern `aaa…ab`: each start matches m − 1 characters before failing |

**Space:** O(1) extra (plus the output list).

## Properties

- No preprocessing of the pattern or text.
- Finds overlapping occurrences (each start is checked independently).
- Online in the text only in a limited way: it needs m characters of look-ahead and may move backwards in the text.

## Variations

- **First occurrence only** (`indexOf`, `strStr`) — return at the first full match.
- **Count occurrences** — count instead of collecting.
- **Matching with wildcards** (`?` matches any one character) — a small change in the comparison; still O(n × m).

## Comparison

| Algorithm | Preprocessing | Matching (worst) | Extra space | Main idea |
|-----------|---------------|------------------|-------------|-----------|
| Naive | none | O(n × m) | O(1) | try every start |
| [KMP](../kmp-algorithm/content.md) | O(m) | O(n) | O(m) | never move backwards in the text |
| [Rabin–Karp](../rabin-karp/content.md) | O(m) | O(n) expected, O(n × m) worst | O(1) | compare rolling hashes first |
| [Z algorithm](../z-algorithm/content.md) | — | O(n + m) | O(n + m) | Z-array of `p + '$' + t` |

## Edge Cases

- Empty pattern: by convention it matches at index 0 (`"abc".indexOf("")` is 0); decide and document.
- Pattern longer than text: no starts, empty result — the `i + m <= n` bound handles it.
- Overlapping matches (`"aa"` in `"aaaa"`).
- Case sensitivity and Unicode surrogate pairs (`charAt` works on UTF-16 code units).

## Advantages

- Trivial to write correctly; no extra memory.
- Fast on typical text; good when patterns are short or searched once.

## Disadvantages

- O(n × m) on repetitive inputs (DNA, logs with long runs, adversarial input).
- Re-reads text characters it has already matched.

## When to Use

- Short patterns, small inputs, or one-off searches where clarity matters.
- As the first answer in an interview, followed by the worst case and an optimisation.

## Common Mistakes

- Loop bound `i < n − m` (misses a match at the very end) or `i < n` (index out of bounds).
- Using `substring(i, i + m).equals(p)` in the loop and calling it O(n): each call copies m characters, so it is still O(n × m) time and allocates memory.
- Skipping ahead by m after a match, which misses overlapping matches.

## Key Takeaways

- Try every start, compare left to right, stop at the first mismatch.
- Worst case O(n × m) on repetitive inputs; typical text is close to O(n).
- Its wasted work — re-reading matched characters — is exactly what KMP, Rabin–Karp and Z remove.
