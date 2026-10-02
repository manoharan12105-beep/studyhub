# Coding-Decoding

## Concept

In coding-decoding, a word, number or sentence is converted into a code by a hidden rule. You are shown one or more examples of the code and must apply the same rule to a new word (coding) or recover the original from a code (decoding).

The rule is almost always one of a few operations on **letter positions** (A = 1 … Z = 26), so fluency with [alphabet positions](../alphabet-series/content.md#positions-to-remember) is essential. Sentence-coding questions are different: they are solved by **comparing which code words appear together**.

## Rules

### Common letter-coding rules

| Rule | Example |
|------|---------|
| Shift every letter by +k or −k | CAT → DBU (+1) |
| Shift by a changing amount (+1, +2, +3 …) | FRIEND → HUMJTK (+2, +3, +4, +5, +6, +7) |
| Alternate shifts (+1, −1, +1 …) | PRINCE → QQJMDD |
| Reverse the word | PAPER → REPAP |
| Reverse, then shift | MONKEY → YEKNOM → XDJMNL (−1) |
| Replace each letter by its opposite (A ↔ Z) | GOOD → TLLW |
| Letter → fixed digit (substitution) | D = 7, E = 3, L = 5 … |

### Number coding

The code is a number calculated from letter positions — a sum, a product, or the positions written side by side.

**Example:** if CAB = 6 (3 + 1 + 2), then BED = 2 + 5 + 4 = 11.

### Sentence (word) coding

Each word has a code word, but codes appear in jumbled order. Compare sentences: **a word common to two sentences has the code common to the same two sentences**.

## Solving Approach

1. Write positions under the original word and the code.
2. Compute the difference letter by letter. Look for: constant shift, changing shift, alternating shift.
3. If the differences look random, check whether the code is the **reverse** of the word (or reversed and shifted), or uses opposite letters.
4. For digit codes, match each letter to its digit across examples; a letter must keep the same digit everywhere.
5. Apply the rule to the new word and recheck one letter.

## Problem Patterns

### Pattern 1: Constant shift

**Example:** MANGO → OCPIQ (+2). Then APPLE → CRRNG.

### Pattern 2: Opposite letters

**Example:** GOOD → TLLW (G ↔ T, O ↔ L, D ↔ W). Then BAD → YZW.

### Pattern 3: Reverse and shift

**Example:** MONKEY → XDJMNL. Reversed: YEKNOM; then each letter −1 → XDJMNL. Then TIGER → REGIT → QDFHS.

### Pattern 4: Letter-to-digit substitution

**Example:** DELHI = 73541 and CALCUTTA = 82589662. From these: D = 7, E = 3, L = 5, H = 4, I = 1, C = 8, A = 2, U = 9, T = 6 (L = 5 in both — consistent). CALICUT = 8 2 5 1 8 9 6 = 8251896.

### Pattern 5: Sentence coding

**Example:**

- "sky is blue" → "ta na pa"
- "blue and green" → "na ka ra"
- "green is good" → "ra ta la"

blue is in sentences 1 and 2 → common code **na**. green is in 2 and 3 → **ra**. is is in 1 and 3 → **ta**. Remaining: sky = pa, and = ka, good = la.

## Common Mistakes

- Miscounting shifts, especially across the Z → A wrap-around.
- Assuming one rule from the first letter without checking the rest.
- In substitution codes, ignoring a letter that appears with two different digits (that signals a positional rule, not substitution).
- In sentence coding, assigning a code from a single sentence when the word appears in only one sentence — it may be undeterminable.

## Placement Tips

- Check two letters before trusting a rule; check all letters if options are close.
- Use the options: often only one option has the correct first and last letters.
- For sentence coding, build a quick word → code table as you compare pairs.

## Key Takeaways

- Convert to positions and compute differences; most codes are shifts, reversals or opposites.
- Opposite letters add to 27.
- In substitution codes, every letter keeps one digit.
- In sentence coding, common words ↔ common codes.
