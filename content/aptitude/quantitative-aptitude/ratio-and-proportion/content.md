# Ratio and Proportion

## Concept

A **ratio** compares two quantities of the same kind by division: if a class has 12 boys and 18 girls, the ratio of boys to girls is 12 : 18 = 2 : 3. It says "for every 2 boys there are 3 girls" without telling you the actual numbers.

The key idea is the **unit (or "part") method**: a ratio a : b means the quantities are a**x** and b**x** for some common multiplier x. Most questions reduce to finding x.

A **proportion** says two ratios are equal: 2 : 3 = 8 : 12. Proportions let you scale a known relationship up or down.

Ratios are the backbone of [Problems on Ages](../problems-on-ages/content.md), [Mixtures and Alligation](../mixtures-and-alligation/content.md), [Time and Work](../time-and-work/content.md) and [Time, Speed and Distance](../time-speed-distance/content.md).

## Key Terms

| Term | Meaning | Example |
|------|---------|---------|
| Antecedent / consequent | First / second term of a ratio | In 2 : 3, 2 is the antecedent |
| Equivalent ratios | Same ratio after multiplying/dividing both terms by the same number | 2 : 3 = 10 : 15 |
| Compound ratio | Product of ratios: (a : b) and (c : d) → ac : bd | (2 : 3), (4 : 5) → 8 : 15 |
| Duplicate / triplicate ratio | a² : b² / a³ : b³ | 3 : 4 → 9 : 16 |
| Sub-duplicate / sub-triplicate ratio | √a : √b / ∛a : ∛b | 49 : 64 → 7 : 8 |
| Inverse (reciprocal) ratio | 1/a : 1/b = b : a | 2 : 3 → 3 : 2 |

## Rules

- Both quantities must be in the **same unit** before forming a ratio (50 paise : ₹2 = 50 : 200 = 1 : 4).
- **Order matters**: boys : girls = 2 : 3 is not girls : boys.
- A ratio has no unit — it is a pure number.
- Multiplying or dividing both terms by the same non-zero number does not change the ratio; **adding or subtracting the same number does**.
- Remove decimals and fractions by multiplying both terms: 0.75 : 1.25 = 75 : 125 = 3 : 5; 1/2 : 1/3 = 3 : 2 (multiply by 6).

## Formulas

### Dividing a quantity in a ratio

```text
Share of A = a / (a + b) × Total         (for a : b)
Share of A = a / (a + b + c) × Total     (for a : b : c)
```

- **Meaning:** the total has a + b equal parts; A gets a of them.
- **Use when:** money, people or items are shared in a ratio.
- **Example:** ₹1,200 in 3 : 5 → one part = 1200/8 = 150 → A = 450, B = 750.
- **Common mistake:** dividing the total by a instead of by (a + b).

### Combining ratios with a common term

```text
A : B = a : b and B : C = c : d   →   A : B : C = ac : bc : bd
```

- **Meaning:** make the shared term (B) the same in both ratios, then read off all three.
- **Why it works:** multiplying the first ratio by c and the second by b makes B = bc in both.
- **Example:** A : B = 2 : 3, B : C = 4 : 5 → B must be 12 in both → A : B : C = 8 : 12 : 15.
- **Common mistake:** writing 2 : 3 : 5 by joining the ratios without matching B.

### Proportion and the cross-product rule

```text
a : b = c : d   ⇔   a × d = b × c
```

- **Meaning:** in a proportion, product of extremes (a, d) = product of means (b, c).
- **Use when:** one term of a proportion is unknown.
- **Example:** 3 : 5 = 12 : x → 3x = 60 → x = 20.

### Mean, third and fourth proportional

```text
Mean proportional of a and b      = √(ab)        (a : x = x : b)
Third proportional to a and b     = b² / a       (a : b = b : x)
Fourth proportional to a, b, c    = bc / a       (a : b = c : x)
```

- **Meaning:** the missing term that completes each kind of proportion.
- **Example:** mean proportional of 9 and 16 = √144 = 12; third proportional to 4 and 6 = 36/4 = 9; fourth proportional to 4, 6, 10 = 60/4 = 15.
- **Common mistake:** confusing third proportional (b²/a) with mean proportional (√ab).

### Direct and inverse proportion

```text
Direct:  y = kx      → y₁ / x₁ = y₂ / x₂
Inverse: y = k / x   → x₁ × y₁ = x₂ × y₂
```

- **Meaning:** direct — both rise together (cost and quantity). Inverse — one rises as the other falls (workers and days, speed and time).
- **Example:** 12 workers take 18 days; 27 workers take 12 × 18 / 27 = 8 days.
- **Common mistake:** using direct proportion for workers and days.

## Solving Approach

1. Convert the ratio into parts: a : b → ax and bx.
2. Translate each condition of the question into an equation in x.
3. Solve for x, then compute what is asked.
4. Check by substituting back into the original ratio.

## Shortcuts and Tricks

### Ratio of values vs ratio of counts (coins)

- **Normal method:** let the counts be ax, bx, cx, write the total value equation and solve.
- **Why the shortcut works:** value = count × denomination, so the ratio of values is (a × d₁) : (b × d₂) : (c × d₃). The total value can then be divided directly.
- **Shortcut:** convert the count ratio into a value ratio, split the total value, then divide each value by its denomination.
- **Demonstration:** ₹1, 50 p and 25 p coins in count ratio 5 : 6 : 8 with total ₹210. Value ratio = 5 : 3 : 2 → ₹105, ₹63, ₹42 → counts 105, 126, 168.
- **Useful when:** coins, notes or tickets of different values.
- **Unsafe or unnecessary when:** the ratio given is already of values — then no conversion is needed.

### Plug in the options for "added/subtracted" ratio questions

- **Normal method:** set up (a + k)/(b + k) = c/d and solve.
- **Why the shortcut works:** the answer must make the new ratio exact, and usually only one option does.
- **Shortcut:** add each option to both numbers and check whether the result reduces to the target ratio.
- **Demonstration:** what added to 7 and 11 gives 3 : 4? Option 5 → 12 : 16 = 3 : 4 ✓.
- **Useful when:** options are small integers.
- **Unsafe or unnecessary when:** options include "none of these" or are not integers.

## Problem Patterns

### Pattern 1: Change in a ratio

**Recognise it:** "The ratio is a : b. If k is added to (or joins) one or both, the ratio becomes c : d."

**Approach:** write the quantities as ax and bx, apply the change, set up the cross product, solve for x.

**Example:** boys : girls = 7 : 5. After 8 more girls join, it becomes 7 : 6. 7x/(5x + 8) = 7/6 → 42x = 35x + 56 → x = 8 → 56 boys.

### Pattern 2: Income, expenditure and savings

**Recognise it:** incomes in one ratio, expenditures in another, savings given.

**Approach:** incomes ax, bx; expenditures cy, dy; savings = income − expenditure gives two equations in x and y.

**Example:** incomes 4 : 3, expenditures 3 : 2, both save ₹6,000. 4x − 3y = 6000 and 3x − 2y = 6000 → x = y = 6000 → incomes ₹24,000 and ₹18,000.

### Pattern 3: Sum of pairs

**Recognise it:** (a + b) : (b + c) : (c + a) given with a + b + c.

**Approach:** add the three pair sums — each variable appears twice, so the total of the ratio parts equals 2(a + b + c).

**Example:** (a + b) : (b + c) : (c + a) = 6 : 7 : 8 and a + b + c = 14. Then 21k = 28 → k = 4/3 → a + b = 8 → c = 14 − 8 = 6.

### Pattern 4: Expression in a ratio

**Recognise it:** "If x : y = 3 : 4, find (4x + 5y) : (5x − 2y)."

**Approach:** substitute x = 3, y = 4 (the common multiplier cancels).

**Example:** (12 + 20) : (15 − 8) = 32 : 7.

## Common Mistakes

- Forming ratios with different units.
- Joining ratios without equalising the common term.
- Thinking that adding the same number to both terms keeps the ratio.
- Mixing up count ratio and value ratio in coin questions.
- Using direct proportion where the relationship is inverse.

## Placement Tips

- Always try the parts method first (ax, bx); it turns word problems into one-variable equations.
- For "find the number" questions, check that the answer is a multiple of the ratio's sum — options that are not can be eliminated.
- In multi-ratio questions, find the LCM of the common term to combine quickly.

## Key Takeaways

- a : b means quantities ax and bx; find x.
- Share of A = a/(a + b) × total.
- Combine ratios by equalising the common term.
- a : b = c : d ⇔ ad = bc; mean proportional √(ab), third b²/a, fourth bc/a.
- Direct proportion: y/x constant; inverse proportion: xy constant.
