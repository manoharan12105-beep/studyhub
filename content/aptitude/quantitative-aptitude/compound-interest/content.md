# Compound Interest

## Concept

Under **compound interest** (CI), the interest earned in each period is added to the principal, and the next period's interest is calculated on this larger amount. Interest earns interest.

Compare ₹1,000 at 10% for 3 years:

| Year | Simple interest (on ₹1,000 each year) | Compound interest (on the running amount) |
|------|---------------------------------------|-------------------------------------------|
| 1 | 100 → amount 1,100 | 100 → amount 1,100 |
| 2 | 100 → amount 1,200 | 110 → amount 1,210 |
| 3 | 100 → amount 1,300 | 121 → amount 1,331 |

The first year is identical. After that, CI pulls ahead because each year's interest includes interest on the previous interest. Compound growth is the same as **successive percentage increases** (see [Percentages](../percentages/content.md)): multiply by (1 + R/100) once per period.

## Key Terms

| Term | Meaning |
|------|---------|
| Compounding period | How often interest is added: yearly, half-yearly, quarterly |
| Amount (A) | Principal plus all interest at the end |
| Compound interest (CI) | A − P |
| Effective rate | The single annual rate that produces the same growth |

## Formulas

### Amount and compound interest

```text
A  = P × (1 + R/100)ⁿ
CI = A − P
```

- **Meaning:** the principal is multiplied by the growth factor (1 + R/100) once for each of n periods.
- **Variables:** P = principal, R = rate per period (%), n = number of periods.
- **Use when:** interest is compounded.
- **Example:** ₹10,000 at 10% for 2 years → 10,000 × 1.21 = ₹12,100 → CI = ₹2,100.
- **Common mistake:** reporting A when CI is asked, or computing P × R × n (that is SI).

### Half-yearly and quarterly compounding

```text
Half-yearly:  A = P × (1 + (R/2)/100)²ⁿ
Quarterly:    A = P × (1 + (R/4)/100)⁴ⁿ
```

- **Meaning:** the annual rate is split across periods, and the number of periods increases.
- **Example:** ₹8,000 at 10% per annum compounded half-yearly for 1 year → 5% for 2 periods → 8,000 × 1.05² = ₹8,820.
- **Common mistake:** changing the rate but not the number of periods (or vice versa).

### Different rates in different years

```text
A = P × (1 + R₁/100) × (1 + R₂/100) × (1 + R₃/100) …
```

- **Example:** ₹20,000 at 10% in year 1 and 12% in year 2 → 20,000 × 1.10 × 1.12 = ₹24,640.

### Fractional years (annual compounding)

```text
For n + f years (0 < f < 1):  A = P × (1 + R/100)ⁿ × (1 + fR/100)
```

- **Meaning:** whole years compound; the fractional part earns simple interest on the amount at that point.
- **Example:** ₹10,000 at 10% for 2½ years → 10,000 × 1.21 × 1.05 = ₹12,705.
- **Common mistake:** raising to the power 2.5.

### Difference between CI and SI

```text
2 years:  CI − SI = P × (R/100)²
3 years:  CI − SI = P × (R/100)² × (3 + R/100)
```

- **Meaning:** the extra earned only because of interest-on-interest.
- **Why the 2-year result works:** the only difference is the second year's interest on the first year's interest: (P × R/100) × R/100.
- **Example:** P = ₹10,000, R = 10%, 3 years → 10,000 × 0.01 × 3.1 = ₹310 (CI 3,310 vs SI 3,000).
- **Common mistake:** using the 2-year formula for 3 years.

### Equal annual instalments

```text
Loan P repaid in n equal annual instalments x at R% CI:
P = x/(1 + r) + x/(1 + r)² + … + x/(1 + r)ⁿ,   where r = R/100
```

- **Meaning:** each instalment pays off the present value of its share of the loan.
- **Example:** ₹2,100 at 10% in 2 instalments → x/1.1 + x/1.21 = 2,100 → x × 2.1/1.21 = 2,100 → x = ₹1,210.
- **Common mistake:** dividing the final amount 2,100 × 1.21 equally between the instalments.

## Shortcuts and Tricks

### Effective rate over several years

- **Normal method:** compute the amount, then the interest.
- **Why the shortcut works:** compounding is successive percentage change, so two years at R% is R + R + R²/100.
- **Shortcut:** 2 years at 10% → 21%; at 20% → 44%; 3 years at 10% → 33.1%.
- **Demonstration:** CI on ₹5,000 at 10% for 2 years = 21% of 5,000 = ₹1,050.
- **Useful when:** 2- or 3-year questions with friendly rates.
- **Unsafe or unnecessary when:** rates or periods are awkward — use the factor directly.

### Growth multiples

- **Normal method:** solve (1 + R/100)ⁿ = k for R, then apply again.
- **Why the shortcut works:** if the factor for n years is k, the factor for mn years is kᵐ.
- **Shortcut:** doubles in 5 years → 4 times in 10, 8 times in 15.
- **Demonstration:** triples in 4 years → 9 times in 8 years, 27 times in 12 years.
- **Useful when:** "becomes k times" questions under CI.
- **Unsafe or unnecessary when:** interest is simple — then growth is linear, not multiplicative.

### Rate from consecutive amounts

- **Normal method:** solve two equations in P and R.
- **Why the shortcut works:** the amount at year n + 1 is the amount at year n times (1 + R/100).
- **Shortcut:** R = (A₂ − A₁)/A₁ × 100 for consecutive years.
- **Demonstration:** ₹8,820 after 2 years, ₹9,261 after 3 → R = 441/8,820 × 100 = 5% → P = 8,820/1.05² = ₹8,000.
- **Useful when:** amounts at consecutive periods are given.
- **Unsafe or unnecessary when:** the years are not consecutive — use the ratio A₂/A₁ = (1 + R/100)^(gap).

## Problem Patterns

### Pattern 1: Find CI or amount

**Recognise it:** P, R, n given.

**Approach:** multiply P by the growth factors; subtract P if CI is asked.

**Example:** ₹5,000 at 10% for 2 years → 6,050 → CI ₹1,050.

### Pattern 2: CI − SI given

**Recognise it:** difference between CI and SI for 2 or 3 years.

**Approach:** use the difference formulas to solve for P or R.

**Example:** difference ₹50 for 2 years at 10% → P × 0.01 = 50 → P = ₹5,000.

### Pattern 3: CI and SI both given

**Recognise it:** "CI for 2 years is ₹832, SI for 2 years is ₹800".

**Approach:** one year's SI = 800/2 = 400. The extra 32 is interest on the first year's 400 → R = 32/400 × 100 = 8% → P = 400/0.08 = ₹5,000.

### Pattern 4: Instalments

**Recognise it:** loan repaid in equal annual instalments.

**Approach:** sum of the discounted instalments = loan.

**Example:** see the formula above.

## Common Mistakes

- Treating CI like SI (multiplying rate by time).
- Not adjusting both rate and periods for half-yearly/quarterly compounding.
- Using the 2-year CI − SI formula for 3 years.
- Raising to a fractional power for part-years under annual compounding.
- Answering with the amount instead of the interest.

## Placement Tips

- Memorise 1.1² = 1.21, 1.1³ = 1.331, 1.05² = 1.1025, 1.05³ = 1.157625, 1.2² = 1.44, 1.2³ = 1.728 — most questions use these.
- If the amount is given and rates are standard, test which option makes P × factor exact.
- CI is always ≥ SI for the same P, R and n (equal for 1 year with annual compounding) — eliminate options that break this.

## Key Takeaways

- A = P(1 + R/100)ⁿ; CI = A − P.
- Half-yearly: R/2 and 2n periods; quarterly: R/4 and 4n periods.
- CI − SI = P(R/100)² for 2 years; P(R/100)²(3 + R/100) for 3 years.
- Growth multiples: k times in n years → kᵐ times in mn years.
- Consecutive amounts: R = (A₂ − A₁)/A₁ × 100.
