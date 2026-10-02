# Ranking and Order

## Concept

Ranking questions give a person's position from one or both ends of a row (or a rank from the top and bottom of a class) and ask for the total, a position from the other end, or the number of people between two persons. Order (comparison) questions give statements like "A is taller than B" and ask who is tallest, shortest, or in a given place.

The one formula behind most ranking questions comes from counting the person **twice** — once from each end:

```text
Total = Position from left + Position from right − 1
```

## Formulas

### Total from two positions

```text
Total = L + R − 1
```

- **Meaning:** counting from both ends includes the person in both counts, so subtract one.
- **Variables:** L = position from the left (or top), R = position from the right (or bottom).
- **Example:** 12th from the left and 9th from the right → 12 + 9 − 1 = 20.
- **Common mistake:** writing L + R (forgetting the double count) or L + R + 1.

### Position from the other end

```text
Position from right = Total − Position from left + 1
```

- **Example:** 15th from the top in a class of 40 → 40 − 15 + 1 = 26th from the bottom.

### Number of people between two persons

```text
If both positions are measured from the same end (p < q):  Between = q − p − 1
```

- **Example:** in a row of 30, A is 10th from the left and B is 15th from the right. B is 30 − 15 + 1 = 16th from the left. Between = 16 − 10 − 1 = 5.
- **Common mistake:** subtracting positions measured from different ends.

### Overlapping positions

If L + R > Total + 1, the two persons have **crossed**: B is to the left of A. Convert both to positions from the same end and subtract.

**Example:** in a row of 14, A is 7th from the left and B is 10th from the right → B is 5th from the left → B is left of A with 7 − 5 − 1 = 1 person between them.

## Solving Approach

### Ranking

1. Convert every given position to the same end.
2. Use Total = L + R − 1, or Between = q − p − 1.
3. If positions are swapped (interchanged), a person's new position equals the other person's old position.
4. For "minimum number of people" questions, test both arrangements (A before B and B before A) and take the smaller total.

### Order (comparisons)

1. Turn every statement into "greater than" form: "A is shorter than B" → B > A.
2. Chain the statements into a single line: T > R > P > Q > S.
3. If some pair is never compared, the order may not be fully determined — answer only what is certain.

## Problem Patterns

### Pattern 1: Total from two positions

**Example:** see the formula above.

### Pattern 2: Interchanging positions

**Recognise it:** "A and B interchange their positions; now A is 15th from the left."

**Approach:** A's new position = B's old position. Combine it with B's old position from the other end.

**Example:** A is 8th from the left and B is 12th from the right. After swapping, A is 15th from the left → B's old position was 15th from the left and 12th from the right → total = 15 + 12 − 1 = 26.

### Pattern 3: Minimum number in a queue

**Recognise it:** "There are 4 people between A and B. What is the minimum number of people?"

**Approach:** consider B behind A and B ahead of A; compute the total for each; the smaller valid total is the answer.

**Example:** A is 10th from the front, B is 12th from the back, 4 people between them. If B is behind A: B is 15th from the front → total 15 + 12 − 1 = 26. If B is ahead of A: B is 5th from the front → total 5 + 12 − 1 = 16. Minimum = 16.

### Pattern 4: Ranks with excluded students

**Recognise it:** ranks "among those who passed", with some failed or absent.

**Approach:** the rank formula gives only the ranked group; add the excluded students afterwards.

**Example:** 7th from the top and 26th from the bottom among those who passed → 32 passed; with 6 failed and 2 absent, the class has 40.

### Pattern 5: Comparison chains

**Example:** P is taller than Q but shorter than R; S is shorter than Q; T is taller than R → T > R > P > Q > S. Tallest T; second shortest Q.

## Common Mistakes

- Forgetting the −1 in L + R − 1.
- Subtracting a left-position from a right-position directly.
- Missing the overlapping case in "minimum number" questions.
- Applying the rank formula to the whole class when ranks are among a subgroup.
- Assuming an order between two people who were never compared.

## Placement Tips

- Draw a quick line with the given positions marked; it exposes overlaps immediately.
- Convert all positions to "from the left" before any subtraction.
- In comparison questions, write the chain once and answer every sub-question from it.

## Key Takeaways

- Total = L + R − 1; other-end position = Total − L + 1.
- Between = difference of same-end positions − 1.
- After a swap, a person takes the other's old position.
- For minimum totals, try both relative orders.
