# Alphanumeric Series

## Concept

Alphanumeric questions mix **letters, numbers and symbols**. They come in two forms:

1. **Combined series** — each term pairs a letter with a number (A1, C3, E5 …). Each part follows its own rule, exactly like an [alphabet series](../alphabet-series/content.md) and a [number series](../number-series/content.md) running side by side.
2. **Arrangement questions** — a fixed row of mixed characters is given, and questions ask about positions ("7th to the right of the 5th from the left") or count elements that meet a condition ("how many numbers are immediately preceded by a letter?").

Arrangement questions test **careful, systematic counting** rather than pattern-finding. Most errors come from miscounting positions or misreading "preceded" and "followed".

## Rules

### Directions in a row

- **Left** and **right** are as you read the row: left is the start, right is the end.
- "X is **immediately preceded** by Y" → Y is directly to the **left** of X.
- "X is **immediately followed** by Y" → Y is directly to the **right** of X.

### Position arithmetic

For a row of N elements:

```text
k-th from the right  = (N − k + 1)-th from the left
m to the right of position p = position p + m
m to the left of position p  = position p − m
```

**Example:** in a row of 22, the 10th from the right is the 22 − 10 + 1 = 13th from the left.

## Solving Approach

### Combined series

1. Split each term into its letter part and number part.
2. Find the rule for each part separately.
3. Recombine.

### Arrangement questions

1. **Number the positions** above the row (1, 2, 3 …) once — it makes every position question pure arithmetic.
2. Classify each element: L (letter), N (number), S (symbol).
3. For counting questions, scan once from left to right checking the exact condition — e.g. for "number immediately preceded by a letter", look at each number and check only its left neighbour.
4. For "remove all symbols" questions, rewrite the shorter row before counting.

## Problem Patterns

### Pattern 1: Letter–number pairs

**Recognise it:** terms like A1, C3, E5.

**Example:** A1, C3, E5, G7, ? → letters +2 (I), numbers +2 (9) → I9.

### Pattern 2: Number–letter pairs with different rules

**Example:** Z1, X3, V6, T10, ? → letters −2 (R); numbers +2, +3, +4 → +5 (15) → R15.

### Pattern 3: Position from both ends

**Recognise it:** "Which element is 4th to the left of the 10th from the right?"

**Approach:** convert to a left position first, then add or subtract.

### Pattern 4: Neighbour conditions

**Recognise it:** "How many letters are immediately preceded by a number and immediately followed by a symbol?"

**Approach:** check every letter: its left neighbour must be a number **and** its right neighbour a symbol. The last element has no right neighbour.

### Pattern 5: Removing a category

**Recognise it:** "If all the symbols are removed, which element is 6th from the right?"

**Approach:** rewrite the row without that category, then count.

## Common Mistakes

- Confusing "preceded by" (left neighbour) with "followed by" (right neighbour).
- Counting the starting element as step one ("5th to the right of position 9" is position 14, not 13).
- Forgetting that the first element has no left neighbour and the last has no right neighbour.
- Answering from the original row after a "remove" instruction.

## Placement Tips

- Arrangement sets usually have 4–5 questions on one row; numbering the positions once pays off across all of them.
- For combined series, solve the easier part first (often the letters) to eliminate options.

## Key Takeaways

- Combined series: separate the letter and number parts; each has its own rule.
- k-th from the right = (N − k + 1)-th from the left.
- Preceded = left neighbour; followed = right neighbour.
- Number the positions before answering arrangement questions.
