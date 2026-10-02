# Alphabet Series

## Concept

An **alphabet series** is a sequence of letters (or letter groups) that follows a rule based on letter **positions** in the alphabet. Once each letter is converted to its position number, an alphabet series becomes a [number series](../number-series/content.md).

The main skill is converting letters to positions — and back — without counting on fingers.

## Key Terms

| Term | Meaning |
|------|---------|
| Forward position | A = 1, B = 2, …, Z = 26 |
| Reverse position | A = 26, B = 25, …, Z = 1; reverse = 27 − forward |
| Opposite letter | The letter at the same distance from the other end: A ↔ Z, B ↔ Y, M ↔ N (positions add up to 27) |
| Wrap-around | After Z, counting continues from A (Y + 2 = A) |

## Rules

### Positions to remember

```text
A  B  C  D  E  F  G  H  I  J  K  L  M
1  2  3  4  5  6  7  8  9  10 11 12 13
N  O  P  Q  R  S  T  U  V  W  X  Y  Z
14 15 16 17 18 19 20 21 22 23 24 25 26
```

**Memory aid — EJOTY:** E = 5, J = 10, O = 15, T = 20, Y = 25. Every letter is at most two steps from one of these anchors (R = T − 2 = 18).

### Opposite pairs

A–Z, B–Y, C–X, D–W, E–V, F–U, G–T, H–S, I–R, J–Q, K–P, L–O, M–N.

### Position from the right end

The k-th letter from the right is the (27 − k)-th from the left. The 7th from the right is the 20th from the left → T.

### Wrap-around

Positions beyond 26 wrap: subtract 26. Y (25) + 2 = 27 → 27 − 26 = 1 → A.

## Solving Approach

1. Convert each letter to its position number.
2. Find the rule as in a number series: constant gap, growing gaps, alternating terms.
3. For letter groups (ABD, DEG …), study each position in the group separately — first letters, second letters, third letters.
4. Convert the answer back to a letter, wrapping around if needed.

## Problem Patterns

### Pattern 1: Constant skip

**Recognise it:** letters move by the same number of steps.

**Example:** A, C, E, G, ? → +2 → I. Backwards: Z, X, V, T, ? → −2 → R.

### Pattern 2: Growing gaps

**Recognise it:** the gap increases by one each time.

**Example:** B, E, I, N, ? → 2, 5, 9, 14 → gaps +3, +4, +5 → +6 → 20 → T.

### Pattern 3: Letter pairs and groups

**Recognise it:** terms are groups of letters.

**Approach:** read the first letters as one series, the second letters as another, and so on.

**Example:** AZ, BY, CX, ? → first letters A, B, C (+1); second letters Z, Y, X (−1) → DW. (Each pair is also an opposite pair.)

**Example:** ABD, DEG, GHJ, ? → first letters A, D, G (+3) → J; each group is x, x + 1, x + 3 → JKM.

### Pattern 4: Alternating letters

**Recognise it:** odd and even positions follow different rules.

**Example:** A, Z, C, X, E, V, ? → odd positions A, C, E → G; even positions Z, X, V. The 7th term is in the odd series → G.

### Pattern 5: Position-based questions

**Recognise it:** "Which letter is 5th to the right of the 10th letter from the left?"

**Approach:** convert to arithmetic. "Right" in the normal alphabet means a higher position: 10 + 5 = 15 → O.

## Common Mistakes

- Off-by-one errors when counting gaps (from C to F is +3, not +4).
- Forgetting to wrap around after Z.
- Reading "left/right" for the reversed alphabet as if it were the normal order.
- Treating a letter group as one unit instead of tracking each position separately.

## Placement Tips

- Write the position numbers above the letters before looking for a rule.
- Learn EJOTY and the opposite pairs; they remove almost all counting.
- In "reverse alphabet" questions, rewrite the needed part of the reversed sequence before counting.

## Key Takeaways

- Convert letters to positions; an alphabet series is a number series in disguise.
- Reverse position = 27 − forward position; opposite letters add to 27.
- For groups, track each letter position separately; wrap around after Z.
