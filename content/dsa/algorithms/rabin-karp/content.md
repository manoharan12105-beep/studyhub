# Rabin–Karp Algorithm

## Definition

The **Rabin–Karp** algorithm finds a pattern `p` (length m) in a text `t` (length n) by comparing **hashes**. It computes the hash of `p` and of every length-m window of `t`, updating the window hash in O(1) with a **rolling hash** as the window slides. Only when the hashes are equal does it compare the characters. Expected time O(n + m); worst case O(n × m) if many windows collide.

## Why It Matters

- The **rolling hash** is a reusable tool: duplicate substrings, longest repeated substring (with binary search), comparing substrings in O(1), 2D pattern matching.
- It searches for **many patterns of the same length** at once: put their hashes in a set and check each window against the set.
- Interviews use it to test understanding of hashing, modular arithmetic and collisions.

## Prerequisites

- [Naive Pattern Matching](../naive-pattern-matching/content.md)
- [Hashing](../../data-structures/hashing/content.md)
- [Modular Arithmetic](../modular-arithmetic/content.md) — computing with `% MOD` to keep numbers small.

## Intuition

Treat a string as a number written in base B: `"abc"` ↦ a·B² + b·B + c (using character codes). Two equal strings have equal numbers. Sliding the window one step is like shifting digits in a decimal number:

```text
window "314" in base 10 → 314
slide to "141":  (314 − 3·100) · 10 + 1 = 141
```

Remove the leading digit, shift, append the new digit — O(1) instead of re-reading m characters. The numbers get huge, so everything is taken **modulo** a large prime M. Different strings can then share a hash (a **collision**), so a hash match is only a candidate and must be confirmed character by character.

## How It Works

Let B be the base (e.g. 31 or 256), M a large prime (e.g. 1 000 000 007), and `high = B^(m−1) mod M`.

1. Compute `hp = hash(p)` and `ht = hash(t[0…m−1])` with Horner's rule: `h = (h·B + c) mod M`.
2. For each window start `i` from 0 to n − m:
   1. If `ht == hp`, compare `t[i…i+m−1]` with `p`; report a match if equal.
   2. If `i < n − m`, roll: `ht = ((ht − t[i]·high) · B + t[i+m]) mod M`, adding M if the result is negative.

## Visual Explanation

Digits with B = 10, M = 13 (the classic textbook example):

```text
pattern 31415 → 31415 mod 13 = 7

text  2 3 5 9 0 2 3 1 4 1 5 2 6 7 3 9 9 2 1
                  └───────┘               window at 6: 31415 mod 13 = 7 → compare → real match
                                └───────┘ window at 12: 67399 mod 13 = 7 → compare → spurious hit
other windows have a different remainder and are skipped without comparing characters
```

## Pseudocode

```pseudocode
rabinKarp(t, p, B, M):
    high ← B^(m−1) mod M
    hp ← 0; ht ← 0
    for k from 0 to m − 1:
        hp ← (hp·B + p[k]) mod M
        ht ← (ht·B + t[k]) mod M
    for i from 0 to n − m:
        if hp = ht and t[i … i+m−1] = p: report i
        if i < n − m:
            ht ← ((ht − t[i]·high)·B + t[i+m]) mod M     // keep non-negative
```

## Java Implementation

```java
import java.util.*;

public class RabinKarp {

    // Returns the match positions; hash matches that fail verification are counted in spurious[0].
    static List<Integer> search(String t, String p, long base, long mod, int[] spurious) {
        List<Integer> result = new ArrayList<>();
        int n = t.length(), m = p.length();
        if (m == 0 || m > n) return result;
        long high = 1;
        for (int k = 0; k < m - 1; k++) high = high * base % mod;    // base^(m-1) mod M
        long hp = 0, ht = 0;
        for (int k = 0; k < m; k++) {
            hp = (hp * base + p.charAt(k)) % mod;
            ht = (ht * base + t.charAt(k)) % mod;
        }
        for (int i = 0; i + m <= n; i++) {
            if (hp == ht) {
                if (t.regionMatches(i, p, 0, m)) result.add(i);       // confirm: hashes can collide
                else spurious[0]++;
            }
            if (i + m < n) {
                ht = (ht - t.charAt(i) * high % mod + mod) % mod;       // remove the leading char
                ht = (ht * base + t.charAt(i + m)) % mod;               // shift and add the new char
            }
        }
        return result;
    }

    public static void main(String[] args) {
        int[] spurious = new int[1];
        // Digits as characters; base 10 and a tiny modulus to provoke collisions.
        String digits = "2359023141526739921";
        StringBuilder t = new StringBuilder();
        for (char c : digits.toCharArray()) t.append((char) (c - '0'));   // char codes 0..9
        String p = "" + (char) 3 + (char) 1 + (char) 4 + (char) 1 + (char) 5;
        System.out.println("mod 13 matches: " + search(t.toString(), p, 10, 13, spurious) + ", spurious hits: " + spurious[0]);

        spurious[0] = 0;
        System.out.println("mod 1e9+7 matches: " + search("abracadabra", "abra", 256, 1_000_000_007L, spurious) + ", spurious hits: " + spurious[0]);
    }
}
```

**Output:**

```text
mod 13 matches: [6], spurious hits: 1
mod 1e9+7 matches: [0, 7], spurious hits: 0
```

With M = 13 the window `67399` collides with the pattern; with a large prime, collisions are rare.

## Dry Run

Text `"abcab"`, pattern `"ab"`, B = 10, M = 101, using codes a = 1, b = 2, c = 3 for readability (`high` = 10):

| i | Window | Hash | Equal to hp = 12? | Action |
|---|--------|------|-------------------|--------|
| 0 | ab | 1·10 + 2 = 12 | yes | compare → match at 0 |
| 1 | bc | (12 − 1·10)·10 + 3 = 23 | no | skip |
| 2 | ca | (23 − 2·10)·10 + 1 = 31 | no | skip |
| 3 | ab | (31 − 3·10)·10 + 2 = 12 | yes | compare → match at 3 |

Each roll is O(1): subtract the leaving character's contribution, multiply by B, add the entering character.

## Complexity Analysis

| Case | Time | Why |
|------|------|-----|
| Best / Expected | O(n + m) | O(m) to hash, O(1) per roll, few collisions with a large random-like prime M |
| Worst | O(n × m) | every window collides (e.g. a tiny M, or `"aaaa…"` text with pattern `"aa…a"` where every window is a true match and is verified) |

**Space:** O(1) extra (O(k) for a set of k pattern hashes in the multi-pattern version).

Expected number of spurious hits ≈ (n − m + 1) / M for a well-behaved hash, which is essentially zero for M ≈ 10⁹ and n ≤ 10⁶.

## Properties

- Correct regardless of collisions, as long as every hash match is verified (a **Las Vegas** algorithm: always right, running time is random-like).
- Skipping verification makes it a **Monte Carlo** algorithm: fast, but may report false matches.
- Window hashes give O(1) substring comparison after O(n) prefix-hash preprocessing.

## Variations

- **Prefix hashes:** `H[i] = hash(t[0…i−1])`; then `hash(t[l…r−1]) = (H[r] − H[l]·B^(r−l)) mod M` — any substring hash in O(1).
- **Double hashing:** two different (B, M) pairs; a collision must happen in both, probability ≈ 1/(M₁M₂).
- **Multiple patterns of equal length:** a `HashSet` of pattern hashes.
- **Longest duplicate substring:** binary search on the length + rolling-hash set per length, O(n log n) expected.
- **2D matching:** hash rows, then roll over columns.

## Comparison

| | Rabin–Karp | [KMP](../kmp-algorithm/content.md) | [Naive](../naive-pattern-matching/content.md) |
|---|-----------|-----|-------|
| Worst case | O(n × m) | O(n + m) | O(n × m) |
| Expected | O(n + m) | O(n + m) | close to O(n) on typical text |
| Many patterns (same length) | natural | one at a time | one at a time |
| Substring equality queries | O(1) after prefix hashes | not applicable | O(length) |

## Edge Cases

- Negative values after subtraction: add M before taking `% M`.
- Overflow: with M ≈ 10⁹, a product of two reduced values is below about 10¹⁸, which fits in `long` (max ≈ 9.2 × 10¹⁸); keep each factor reduced mod M before multiplying.
- Pattern longer than text, empty pattern.
- Many true matches (`"aaaa"` / `"aa"`): verification costs O(m) each — inherent, since every match must be checked.

## Advantages

- Simple rolling update; extends naturally to many patterns and 2D.
- Rolling/prefix hashes answer substring-equality questions quickly.

## Disadvantages

- Worst case is still O(n × m); a poor or predictable modulus can be attacked.
- Needs care with modular arithmetic (negatives, overflow).

## When to Use

- Many patterns of the same length; duplicate or repeated substring problems; substring comparisons inside binary search.
- When KMP's failure function is not needed and expected linear time is acceptable.

## Common Mistakes

- Trusting a hash match without verifying (false positives).
- Forgetting `+ mod` after the subtraction, producing negative hashes that never match.
- Recomputing `B^(m−1)` inside the loop.
- Using a small modulus or `int` arithmetic that overflows silently.

## Key Takeaways

- Hash the pattern, roll the window hash in O(1), verify on hash equality.
- Expected O(n + m), worst O(n × m); collisions are the price of hashing.
- The rolling/prefix hash is the real takeaway: O(1) substring comparison.
