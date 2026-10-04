# Z Algorithm

## Definition

For a string `s` of length n, the **Z-array** stores at each index i (i ≥ 1) the length of the longest substring starting at i that is also a **prefix** of `s`: `Z[i] = max k such that s[0…k−1] = s[i…i+k−1]`. `Z[0]` is usually set to 0 (or n). The **Z algorithm** computes the whole array in **O(n)**. Pattern matching follows: build the Z-array of `p + '$' + t`; every index where `Z[i] = m` is a match.

## Why It Matters

- Linear-time pattern matching that many find easier to reason about than [KMP](../kmp-algorithm/content.md).
- The Z-array directly answers "how much of the prefix matches here?", useful for periods, string compression, and counting distinct substrings incrementally.
- It is a good example of reusing previously computed information through a window (the **Z-box**).

## Prerequisites

- [Naive Pattern Matching](../naive-pattern-matching/content.md)
- [Strings](../../data-structures/strings/content.md)

## Intuition

Computing each `Z[i]` by direct comparison is O(n²). The trick: keep the **Z-box** `[l, r)` — the interval with the largest `r` found so far such that `s[l…r−1]` equals a prefix of `s`.

If i lies inside the box, then `s[i…r−1]` is a copy of `s[i−l … r−l−1]`, which starts at index `i − l` of the prefix. So `Z[i]` is at least `min(Z[i − l], r − i)` without comparing anything. Only characters **beyond r** need to be compared, and each comparison that succeeds pushes r further right. Since r only grows up to n, the total work is linear.

## How It Works

1. `l = r = 0` (empty box). For i from 1 to n − 1:
   1. If `i < r`: `Z[i] = min(r − i, Z[i − l])` (reuse the mirror value, capped by the box end).
   2. While `i + Z[i] < n` and `s[Z[i]] == s[i + Z[i]]`: `Z[i]++` (extend by direct comparison).
   3. If `i + Z[i] > r`: `l = i`, `r = i + Z[i]` (new box reaching further right).

### Pattern matching

Build `s = p + '$' + t`, where `$` occurs in neither string; then `Z[i] ≤ m` everywhere, and `Z[i] = m` at i means `p` occurs in `t` at `i − m − 1`.

## Visual Explanation

```text
index :  0  1  2  3  4  5  6
s     :  a  a  b  x  a  a  b
Z     :  0  1  0  0  3  1  0

Z[4] = 3: "aab" at 4 equals the prefix "aab"; box becomes [4, 7)
Z[5]:   i = 5 is inside the box; mirror index 5 − 4 = 1, Z[1] = 1, cap r − i = 2 → Z[5] = 1
        then compare s[1]='a' with s[6]='b' → stop. Z[5] = 1 with one comparison.
```

## Pseudocode

```pseudocode
zArray(s):
    Z[0] ← 0; l ← 0; r ← 0
    for i from 1 to n − 1:
        if i < r: Z[i] ← min(r − i, Z[i − l]) else Z[i] ← 0
        while i + Z[i] < n and s[Z[i]] = s[i + Z[i]]: Z[i] ← Z[i] + 1
        if i + Z[i] > r: l ← i; r ← i + Z[i]
    return Z
```

## Java Implementation

```java
import java.util.*;

public class ZAlgorithm {

    static int[] zArray(String s) {
        int n = s.length();
        int[] z = new int[n];
        for (int i = 1, l = 0, r = 0; i < n; i++) {
            if (i < r) z[i] = Math.min(r - i, z[i - l]);           // reuse the mirror inside the Z-box
            while (i + z[i] < n && s.charAt(z[i]) == s.charAt(i + z[i])) z[i]++;
            if (i + z[i] > r) {                                     // box reaches further right
                l = i;
                r = i + z[i];
            }
        }
        return z;
    }

    static List<Integer> search(String text, String p) {
        List<Integer> result = new ArrayList<>();
        int m = p.length();
        if (m == 0) return result;
        int[] z = zArray(p + '\u0000' + text);                     // separator absent from both strings
        for (int i = m + 1; i < z.length; i++) {
            if (z[i] == m) result.add(i - m - 1);
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println("Z(aabxaab) = " + Arrays.toString(zArray("aabxaab")));
        System.out.println("Z(aaaaa)   = " + Arrays.toString(zArray("aaaaa")));
        System.out.println("matches: " + search("abacabadabacaba", "aba"));
    }
}
```

**Output:**

```text
Z(aabxaab) = [0, 1, 0, 0, 3, 1, 0]
Z(aaaaa)   = [0, 4, 3, 2, 1]
matches: [0, 4, 8, 12]
```

The code uses the character `'\u0000'` as the separator so it cannot clash with printable input; in explanations it is written `$`.

## Dry Run

Z-array of `s = "aabaab"`:

| i | Inside box [l, r)? | Initial Z[i] | Comparisons | Z[i] | New box |
|---|--------------------|--------------|-------------|------|---------|
| 1 | no (box empty) | 0 | s[0]=a = s[1]=a ✓, s[1]=a ≠ s[2]=b | 1 | [1, 2) |
| 2 | no (2 ≥ r = 2) | 0 | s[0]=a ≠ s[2]=b | 0 | — |
| 3 | no | 0 | a=a ✓, a=a ✓, b=b ✓, end of string | 3 | [3, 6) |
| 4 | yes, mirror 4 − 3 = 1 | min(6 − 4, Z[1] = 1) = 1 | s[1]=a ≠ s[5]=b | 1 | — |
| 5 | yes, mirror 2 | min(1, Z[2] = 0) = 0 | s[0]=a ≠ s[5]=b | 0 | — |

Result `Z = [0, 1, 0, 3, 1, 0]`.

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| Best / Average / Worst | O(n) | each successful comparison increases r, which never decreases and is at most n; each i has at most one failed comparison |
| Pattern matching | O(n + m) | Z-array of a string of length n + m + 1 |

**Space:** O(n) for the Z-array (O(n + m) for matching, on the concatenation).

## Properties

- `Z[i]` depends only on the string; no preprocessing of a separate pattern.
- `Z` and KMP's LPS array carry the same information in different forms (each can be converted to the other in O(n)).
- The separator must not appear in either string, otherwise matches can extend across it and `Z[i]` can exceed m.

## Variations

- **Period detection:** the smallest i with `i + Z[i] = n` and `n % i == 0` is the shortest period.
- **Count prefix occurrences:** how many times each prefix occurs — from the Z-array counts.
- **String compression check:** whether `s` is a repetition of a shorter block.
- **Matching without a separator:** compute Z of `p` and a "Z-like" array for `t` against `p` (more code, same complexity).

## Comparison

| | Z algorithm | [KMP](../kmp-algorithm/content.md) |
|---|-------------|-----|
| Array meaning | longest prefix match **starting** at i | longest border **ending** at i |
| Matching | Z of `p$t`, look for m | stream the text through LPS |
| Space for matching | O(n + m) | O(m) |
| Streaming text | no (needs the concatenation) | yes |
| Ease of derivation | often considered simpler | fallback chain is subtler |

## Edge Cases

- `Z[0]` convention: 0 or n — be consistent and skip index 0 in loops.
- All characters equal: `Z[i] = n − i`; still linear because of the box.
- Empty pattern, pattern longer than text.
- Choosing a separator that cannot occur in the input.

## Advantages

- O(n) worst case, short code, easy to explain with the Z-box picture.

## Disadvantages

- Matching needs memory for the concatenated string and its Z-array.
- Not suitable for streaming text.

## When to Use

- Single-pattern matching when memory for `p + $ + t` is fine.
- Questions about prefix matches at every position: periods, borders, prefix counts.

## Common Mistakes

- Forgetting the cap `r − i` when copying the mirror value (overestimates `Z[i]`).
- Updating the box even when `i + Z[i] ≤ r`.
- Using a separator character that appears in the input.

## Key Takeaways

- `Z[i]` = longest prefix of `s` starting at i.
- Inside the Z-box, start from `min(r − i, Z[i − l])`; compare only beyond r.
- Matching: Z of `p + $ + t`, report where `Z[i] = m`. O(n + m) time and space.
