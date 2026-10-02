# Percentages

## Concept

A **percentage** is a fraction with denominator 100. "Per cent" means "per hundred", so 35% means 35 out of every 100, or 35/100 = 0.35.

Percentages let us compare changes on a common scale. A ₹10 rise means a lot on a ₹20 item and very little on a ₹2,000 item; as percentages (50% vs 0.5%) the difference is obvious.

The idea that solves most percentage questions: **every percentage is a percentage _of something_** — the **base**. Most mistakes come from using the wrong base. "A is 25% more than B" uses B as the base; "B is 20% less than A" uses A.

Percentages are also the language of later topics: profit and loss, interest, data interpretation and mixtures all use the same tools.

## Key Terms

| Term | Meaning |
|------|---------|
| Base | The value the percentage is taken of (the "100%" value) |
| Percentage change | Change expressed as a percentage of the original value |
| Percentage point | Simple difference between two percentages (from 10% to 12% is 2 percentage points, but a 20% increase) |
| Multiplying factor | The number you multiply by to apply a change: +20% → × 1.2, −15% → × 0.85 |

## Formulas

### Percentage of a number

```text
x% of y = (x / 100) × y
```

- **Meaning:** the part of y that x% represents.
- **Variables:** x = percentage, y = the base.
- **Use when:** "find 35% of 240".
- **Example:** 35% of 240 = 0.35 × 240 = 84.
- **Common mistake:** dividing by x instead of 100.

> [!TIP]
> x% of y = y% of x, because both equal xy/100. 16% of 25 is hard; 25% of 16 = 4 is easy.

### What percent is A of B?

```text
(A / B) × 100
```

- **Meaning:** expresses A as a percentage of the base B.
- **Use when:** "40 is what percent of 250?" → (40/250) × 100 = 16%.
- **Common mistake:** putting the wrong number in the denominator. The number after "of" is the base.

### Percentage change

```text
% change = (New − Old) / Old × 100
```

- **Meaning:** how much a value grew (+) or shrank (−) relative to where it **started**.
- **Variables:** Old = original value (the base), New = final value.
- **Use when:** prices, salaries, populations, marks change.
- **Example:** 80 → 92: (92 − 80)/80 × 100 = 15% increase.
- **Common mistake:** dividing by the new value.

### "More than" and "less than"

```text
A is r% more than B   →  A = B × (100 + r)/100
Then B is less than A by  r / (100 + r) × 100 %
```

- **Meaning:** the two percentages differ because the bases differ (B for the first, A for the second).
- **Why it works:** the difference is the same amount (rB/100), but measured against A = B(100 + r)/100 it becomes r/(100 + r) of A.
- **Example:** A is 25% more than B → B is less than A by 25/125 × 100 = 20%.
- **Mirror rule:** if A is r% **less** than B, then B is more than A by r/(100 − r) × 100 %.
- **Common mistake:** assuming "25% more" reverses to "25% less".

### Successive percentage change

```text
Net change = a + b + (a × b)/100   %
```

- **Meaning:** combined effect of a change of a% followed by b% (use negative values for decreases).
- **Variables:** a, b = the two percentage changes with sign.
- **Why it works:** (1 + a/100)(1 + b/100) = 1 + (a + b)/100 + ab/10000. The last term is the "change on the change".
- **Example:** +20% then −20% → 20 − 20 + (20 × −20)/100 = −4% (a 4% net loss, not 0).
- **For three changes:** apply the formula to the first two, then combine the result with the third.
- **Common mistake:** adding the percentages directly.

### Population growth and depreciation

```text
Growth:        Pₙ = P × (1 + r/100)ⁿ
Depreciation:  Pₙ = P × (1 − r/100)ⁿ
```

- **Meaning:** a value that changes by r% every year, each year on the **new** value.
- **Variables:** P = present value, r = rate per year, n = number of years.
- **Use when:** population, machine value, bacteria count — any repeated percentage change.
- **Example:** a machine worth ₹1,25,000 depreciating 20% a year is worth 125000 × 0.8³ = ₹64,000 after 3 years.
- **Different rates each year:** multiply the factors: P × (1 + r₁/100)(1 + r₂/100)…
- **Common mistake:** using simple multiplication (r × n%) instead of compounding.

### Expenditure = price × consumption

```text
If price rises by r%, to keep expenditure unchanged
consumption must fall by  r / (100 + r) × 100 %
If price falls by r%, consumption can rise by  r / (100 − r) × 100 %
```

- **Why it works:** expenditure = price × quantity. If price becomes (100 + r)/100 times, quantity must become 100/(100 + r) times to keep the product fixed — a fall of r/(100 + r).
- **Example:** sugar price +25% → consumption −25/125 = −20%.
- **Common mistake:** reducing consumption by the same 25%.

## Shortcuts and Tricks

### Fraction equivalents

- **Normal method:** divide by 100 and multiply.
- **Why the shortcut works:** many percentages are simple fractions; multiplying by a fraction is often a single mental step.
- **Shortcut:** memorise this table.

| % | Fraction | % | Fraction |
|---|----------|---|----------|
| 50 | 1/2 | 12.5 | 1/8 |
| 33.33 | 1/3 | 11.11 | 1/9 |
| 25 | 1/4 | 10 | 1/10 |
| 20 | 1/5 | 9.09 | 1/11 |
| 16.67 | 1/6 | 8.33 | 1/12 |
| 14.29 | 1/7 | 6.25 | 1/16 |
| 66.67 | 2/3 | 37.5 | 3/8 |
| 83.33 | 5/6 | 62.5 | 5/8 |

- **Demonstration:** 37.5% of 640 = 3/8 × 640 = 240.
- **Useful when:** the percentage matches a table entry, or the base is a multiple of the denominator.
- **Unsafe or unnecessary when:** the percentage is "ugly" (e.g. 37%) — use 1% and 10% building blocks instead.

### Building from 10% and 1%

- **Normal method:** multiply by the percentage and divide by 100.
- **Why the shortcut works:** 10% is the number with the decimal moved one place left; 1% two places. Any percentage is a sum of these pieces.
- **Shortcut:** 37% = 3 × 10% + 7 × 1%.
- **Demonstration:** 37% of 850 → 10% = 85, 1% = 8.5 → 3 × 85 + 7 × 8.5 = 255 + 59.5 = 314.5.
- **Useful when:** mental calculation without a fraction match.
- **Unsafe or unnecessary when:** the percentage is a table fraction — the fraction route is faster.

### Multiplying factors

- **Normal method:** find the change, then add or subtract it.
- **Why the shortcut works:** "increase by 15%" means "new = 115% of old" = old × 1.15. One multiplication instead of two steps, and chains of changes become a product.
- **Shortcut:** +r% → × (1 + r/100); −r% → × (1 − r/100). To reverse a change, divide by the factor.
- **Demonstration:** after a 20% increase a number is 360. Original = 360 / 1.2 = 300 (not 360 × 0.8 = 288).
- **Useful when:** successive changes, reverse problems ("after the increase it became …").
- **Unsafe or unnecessary when:** you only need the size of one change — the direct formula is equally quick.

## Problem Patterns

### Pattern 1: Reverse percentage

**Recognise it:** "After an increase/decrease of r%, the value is X. Find the original."

**Approach:**

1. Write the factor (1 ± r/100).
2. Original = X ÷ factor.

**Example:** after a 20% discount the price is ₹640. Original = 640 / 0.8 = ₹800.

### Pattern 2: Comparing two quantities

**Recognise it:** "A is what percent more/less than B?"

**Approach:**

1. Identify the base — the quantity after "than".
2. % = (A − B)/B × 100.

**Example:** A = 60, B = 48. A is (12/48) × 100 = 25% more than B; B is (12/60) × 100 = 20% less than A.

### Pattern 3: Successive and chained changes

**Recognise it:** two or more percentage changes applied one after another (salary cut then raise, length and breadth changing, three-year population).

**Approach:** use the net-change formula or multiply factors.

**Example:** length +10%, breadth +20% → area change = 10 + 20 + 200/100 = 32% increase.

### Pattern 4: Elections and votes

**Recognise it:** candidates' vote shares, a winning margin, and possibly invalid votes or non-voters.

**Approach:**

1. Take valid votes as 100 (or x).
2. Margin as a percentage of valid votes = winner% − loser%.
3. Margin% × valid votes = margin in votes → solve.
4. Convert back to total votes if some were invalid.

**Example:** winner gets 58% of valid votes and wins by 1,440. Margin = 58 − 42 = 16% of valid votes → valid votes = 1440 / 0.16 = 9,000.

### Pattern 5: Pass marks

**Recognise it:** "scores x% and fails by a marks; another scores y% and gets b marks more than the pass mark."

**Approach:** the pass mark is the same in both statements, so x% of M + a = y% of M − b. Solve for the maximum marks M.

**Example:** 30% and fails by 15; 40% and passes by 35 → 10% of M = 50 → M = 500, pass mark = 150 + 15 = 165.

### Pattern 6: Income, expenditure and savings

**Recognise it:** income = expenditure + savings, with percentage changes to some of them.

**Approach:** take convenient numbers (income = 100), apply each change, and recompute the unknown part.

**Example:** income 100, expenditure 75, savings 25. Income +20% → 120, expenditure +10% → 82.5, savings = 37.5 → savings rose by 12.5/25 = 50%.

## Common Mistakes

- Using the wrong base — always ask "percent **of what**?"
- Adding successive changes (+20% then −20% is −4%, not 0).
- Reversing a percentage change with the same percentage (undoing a 20% cut needs a 25% raise).
- Confusing percentage points with percentage change.
- Applying simple multiplication instead of compounding for repeated yearly changes.
- In election questions, forgetting to convert valid votes back to total votes.

## Placement Tips

- Assume a convenient base of 100 whenever the question has no actual numbers.
- Learn the fraction table — it speeds up profit/loss, interest and DI as well.
- In "find the original" questions, eliminate the option you get by subtracting the percentage from the final value: it is the trap answer.
- For DI, estimate first (round to 10% and 1% pieces), then pick the closest option.

## Key Takeaways

- A percentage is a fraction of 100, always taken of a base; the number after "of" or "than" is the base.
- % change = (New − Old)/Old × 100.
- r% more ↔ r/(100 + r) × 100 % less; r% less ↔ r/(100 − r) × 100 % more.
- Successive changes: a + b + ab/100; repeated changes: multiply factors (1 ± r/100)ⁿ.
- Price × consumption = expenditure: price +r% needs consumption −r/(100 + r) × 100 % to keep spending fixed.
