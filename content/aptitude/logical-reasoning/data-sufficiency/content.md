# Data Sufficiency

## Concept

A data-sufficiency question asks a question and gives two statements. You do **not** have to find the answer — only decide **whether the statements give enough information to find it**, and which statements are needed.

Answer options are standard:

| Option | Meaning |
|--------|---------|
| A | Statement I alone is sufficient, but statement II alone is not |
| B | Statement II alone is sufficient, but statement I alone is not |
| C | Each statement alone is sufficient |
| D | Both statements together are sufficient, but neither alone is |
| E | Both statements together are not sufficient |

"Sufficient" means the information leads to **exactly one** answer. For a yes/no question, a definite "yes" or a definite "no" both count as sufficient; "sometimes yes, sometimes no" does not.

## Rules

- Judge each statement **alone** first — forget the other one completely.
- Only if neither alone is sufficient, combine them.
- Use only the information given plus standard facts (definitions, formulas). Do not assume that numbers are integers or positive unless the question says so.
- Stop calculating once you know an answer is unique — the value itself is not needed.

### Decision flow

```text
I alone sufficient?   II alone sufficient?   →  Answer
      yes                   no                 →  A
      no                    yes                →  B
      yes                   yes                →  C
      no                    no   → together sufficient?  yes → D,  no → E
```

## Solving Approach

1. Work out what is needed to answer the question (e.g. "one equation in x", "the train's length and one crossing time").
2. Test statement I alone; then statement II alone.
3. If neither works alone, test them together.
4. For yes/no questions, try to find one case giving "yes" and one giving "no"; if you can, the information is insufficient.

## Problem Patterns

### Pattern 1: Equations

One linear equation fixes one unknown; two independent equations fix two. Equations that are multiples of each other add nothing (x − y = 2 and 3x − 3y = 6 are the same information).

### Pattern 2: Squares and signs

x² = 16 gives x = 4 or −4 — not unique. Combine with a sign condition (x > 0) to make it unique.

### Pattern 3: Divisibility and parity

"Divisible by 6" needs divisibility by both 2 and 3. "n² is even" alone is enough to show n is even.

### Pattern 4: Reasoning data

Blood relations, rankings and arrangements: check whether the combined clues fix the relation or order uniquely.

**Example:** "How many students are in the class?" I. Ravi is 10th from the top. II. Ravi is 21st from the bottom. Together: 10 + 21 − 1 = 30 → D.

### Pattern 5: Arithmetic word problems

Speed, profit, interest: list the unknowns and count the independent pieces of information. For a train's speed, a pole crossing alone has two unknowns (length, speed); adding a platform crossing gives the second equation.

## Common Mistakes

- Using statement I's information while judging statement II alone.
- Choosing "together" when one statement alone was already enough.
- Assuming x is positive or an integer when the question doesn't say so.
- Treating two statements that say the same thing as two pieces of information.
- Calculating the full answer — wasted time.

## Placement Tips

- Write the "needed information" before reading the statements.
- For yes/no questions, test easy numbers (0, 1, −1, fractions) to break sufficiency.
- Memorise the A–E key so you never misread the options under time pressure.

## Key Takeaways

- Sufficient = exactly one answer (a definite yes or no also counts).
- Test I alone, II alone, then together.
- Duplicate information is not new information; squares hide signs.
