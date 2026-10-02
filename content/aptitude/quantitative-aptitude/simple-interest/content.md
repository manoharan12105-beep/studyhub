# Simple Interest

## Concept

When you borrow money, you pay extra for using it — the **interest**. Under **simple interest** (SI), interest is calculated only on the original amount borrowed (the **principal**). The interest for every year is the same, no matter how long the loan runs.

If you borrow ₹1,000 at 10% per year simple interest, you owe ₹100 of interest each year: ₹100 after one year, ₹200 after two, ₹300 after three. The growth is a straight line.

This makes simple interest a direct application of [percentages](../percentages/content.md): each year adds R% of P. Compare it with [Compound Interest](../compound-interest/content.md), where each year's interest also earns interest.

## Key Terms

| Term | Meaning |
|------|---------|
| Principal (P) | The amount borrowed or invested |
| Rate (R) | Interest per ₹100 per year (% per annum) |
| Time (T) | Duration, normally in years |
| Simple interest (SI) | Interest on the principal only |
| Amount (A) | Principal + interest; the total repaid |

## Formulas

### Simple interest

```text
SI = (P × R × T) / 100
```

- **Meaning:** R% of P, for each of T years.
- **Variables:** P = principal (₹), R = rate % per year, T = time in years.
- **Use when:** interest is "simple" or not said to compound.
- **Example:** ₹5,000 at 8% for 3 years → 5000 × 8 × 3 / 100 = ₹1,200.
- **Common mistake:** time in months not converted to years (9 months = 3/4 year).

### Amount

```text
A = P + SI = P × (1 + RT/100)
```

- **Meaning:** total due at the end.
- **Example:** P = ₹6,000, 10% for 3 years → A = 6000 × 1.3 = ₹7,800.
- **Common mistake:** using the amount in place of SI in the SI formula.

### Rearranged forms

```text
P = 100 × SI / (R × T)      R = 100 × SI / (P × T)      T = 100 × SI / (P × R)
```

- **Use when:** any one of P, R, T is unknown.
- **Example:** ₹4,000 becomes ₹4,960 in 3 years → SI = 960 → R = 100 × 960 / (4000 × 3) = 8%.

### Sum becoming k times itself

```text
R × T = 100 × (k − 1)
```

- **Meaning:** to grow to k times, total interest must be (k − 1) × P, i.e. (k − 1) × 100 % of P.
- **Why it works:** SI = (k − 1)P = PRT/100 → RT = 100(k − 1).
- **Example:** a sum doubles (k = 2) in 8 years → R = 100/8 = 12.5%. It triples (k = 3) at the same rate in 200/12.5 = 16 years.
- **Common mistake:** assuming "triples" takes 3/2 times as long as "doubles" — it takes twice as long, because the interest needed is 2P vs P.

### Interest from two amounts

```text
SI for (T₂ − T₁) years = A₂ − A₁
```

- **Meaning:** when the amounts after T₁ and T₂ years are given, their difference is pure interest.
- **Example:** ₹9,800 after 5 years and ₹12,005 after 8 years → 3 years' SI = 2,205 → 1 year = 735 → P = 9,800 − 5 × 735 = 6,125 → R = 735/6125 × 100 = 12%.

## Shortcuts and Tricks

### Rate-years when the rate changes

- **Normal method:** compute interest separately for each period and add.
- **Why the shortcut works:** SI is linear, so P × (R₁T₁ + R₂T₂ + …)/100 gives the same total.
- **Shortcut:** add the "rate × years" products, then use SI = P × (sum)/100.
- **Demonstration:** 8% for 2 years, 10% for 3 years, 12% for 2 years on ₹5,000 → 16 + 30 + 24 = 70 → SI = 5000 × 70/100 = ₹3,500.
- **Useful when:** rates change over time, or you need P from the total interest.
- **Unsafe or unnecessary when:** interest compounds — then the rates multiply, not add.

### Alligation for a sum split at two rates

- **Normal method:** let x be lent at R₁ and (P − x) at R₂; solve the interest equation.
- **Why the shortcut works:** the overall rate is a weighted average of R₁ and R₂, weighted by the amounts.
- **Shortcut:** overall rate = total interest × 100 / (P × T); alligate R₁ and R₂ around it.
- **Demonstration:** ₹10,000 split at 8% and 10% earns ₹920 in a year → overall 9.2% → (10 − 9.2) : (9.2 − 8) = 0.8 : 1.2 = 2 : 3 → ₹4,000 at 8%, ₹6,000 at 10%.
- **Useful when:** one sum is divided between two rates.
- **Unsafe or unnecessary when:** the two parts are lent for different times — weight by P × T, or use the equation.

## Problem Patterns

### Pattern 1: Find P, R or T

**Recognise it:** three of P, R, T, SI/A are given.

**Approach:** rearrange SI = PRT/100. If A is given, find SI = A − P first.

**Example:** ₹2,500 earns ₹600 in 4 years → R = 600 × 100 / (2500 × 4) = 6%.

### Pattern 2: Two amounts at two times

**Recognise it:** "amounts to ₹A₁ in T₁ years and ₹A₂ in T₂ years".

**Approach:** yearly SI = (A₂ − A₁)/(T₂ − T₁); P = A₁ − T₁ × yearly SI.

**Example:** ₹6,000 in 2 years, ₹7,500 in 5 years → yearly SI = 500 → P = 5,000, R = 10%.

### Pattern 3: Change in rate

**Recognise it:** "had the rate been x% higher, the interest would be ₹d more".

**Approach:** extra interest = P × x × T / 100 → solve for P.

**Example:** 2% higher for 3 years gives ₹360 more → P × 6/100 = 360 → P = ₹6,000.

### Pattern 4: Rate equals time

**Recognise it:** "the rate is numerically equal to the time".

**Approach:** SI = P × R²/100 → solve R² = 100 × SI/P.

**Example:** SI = 4/9 of P → R² = 400/9 → R = 20/3 = 6⅔ % (and T = 6⅔ years).

## Common Mistakes

- Using months or days without converting to years.
- Substituting the amount for the interest.
- Assuming time scales linearly with the multiple ("triples in 1.5× the doubling time").
- Adding rates for different periods without multiplying each by its time.

## Placement Tips

- SI questions are among the fastest marks — write SI = PRT/100 and substitute.
- If no principal is given, take P = 100: then SI equals R × T directly.
- Check which value the question wants: SI, amount, or principal; options usually include all three.

## Key Takeaways

- SI = PRT/100; A = P + SI.
- Interest is the same every year — growth is linear.
- Sum becomes k times: RT = 100(k − 1).
- Difference of amounts = interest for the difference in time.
- Changing rates: add R × T products.
