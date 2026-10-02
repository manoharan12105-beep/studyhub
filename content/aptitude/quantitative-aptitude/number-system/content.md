# Number System

## Concept

The number system is the foundation of quantitative aptitude. Almost every arithmetic question — percentages, ratios, time and work — eventually reduces to working with factors, multiples, divisibility and remainders. Questions that test the number system directly ask things like "is this number divisible by 11?", "what is the remainder?", or "what is the last digit of 7⁹⁵?".

The single most useful idea in this topic is that **you rarely need the full number**. Divisibility depends on a few digits, remainders can be combined piece by piece, and the last digit of a huge power depends only on the last digit of the base. Learning *why* each rule works lets you apply it confidently instead of memorising dozens of tricks.

## Types of Numbers

### Classification

| Type | Definition | Examples |
|------|------------|----------|
| Natural numbers | Counting numbers: 1, 2, 3, … | 1, 25, 400 |
| Whole numbers | Natural numbers plus 0 | 0, 1, 2 |
| Integers | Whole numbers and their negatives | −3, 0, 7 |
| Rational numbers | Can be written as p/q with integers p, q and q ≠ 0 | 3/4, −2, 0.75, 0.333… |
| Irrational numbers | Cannot be written as p/q; decimals never end and never repeat | √2, π, √3 |
| Real numbers | All rational and irrational numbers | everything above |

Each set contains the one before it: Natural ⊂ Whole ⊂ Integers ⊂ Rational ⊂ Real.

> [!NOTE]
> A terminating decimal (0.75) or a repeating decimal (0.333…) is **rational**. Only non-terminating, non-repeating decimals are irrational.

### Even, odd, prime and composite

- **Even** numbers are divisible by 2; **odd** numbers are not.
- A **prime** number has exactly two factors: 1 and itself (2, 3, 5, 7, 11, …).
- A **composite** number has more than two factors (4, 6, 8, 9, …).
- **1 is neither prime nor composite** — it has only one factor.
- **2 is the only even prime.** Every other even number is divisible by 2, so it has at least three factors.
- **Co-prime** (relatively prime) numbers have HCF = 1, e.g. 8 and 15. They need not be prime themselves.

There are **25 primes below 100**: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97.

### Testing whether a number is prime

**Method:** divide the number by every prime up to its square root. If none divides it, it is prime.

**Why it works:** if n = a × b, then a and b cannot both be greater than √n (their product would exceed n). So any factor pair has one member ≤ √n — checking up to √n finds it.

**Example:** Is 187 prime? √187 ≈ 13.7, so test 2, 3, 5, 7, 11, 13. 187 ÷ 11 = 17 → 187 = 11 × 17, not prime.

### Even/odd behaviour

| Operation | Result |
|-----------|--------|
| even ± even, odd ± odd | even |
| even ± odd | odd |
| even × anything | even |
| odd × odd | odd |

Useful for elimination: the product of two consecutive integers is always even; the sum of two primes greater than 2 is always even.

## Divisibility Rules

### The rules

| Divisor | Rule | Example |
|---------|------|---------|
| 2 | Last digit is even | 3,458 ✓ |
| 3 | Sum of digits divisible by 3 | 4,152 → 12 ✓ |
| 4 | Last two digits divisible by 4 | 7,316 → 16 ✓ |
| 5 | Last digit 0 or 5 | 9,875 ✓ |
| 6 | Divisible by both 2 and 3 | 4,152 ✓ |
| 8 | Last three digits divisible by 8 | 51,128 → 128 ✓ |
| 9 | Sum of digits divisible by 9 | 72,936 → 27 ✓ |
| 10 | Last digit 0 | 4,560 ✓ |
| 11 | (Sum of digits at odd places) − (sum at even places) is 0 or a multiple of 11 | 9,163 → (3+1) − (6+9) = −11 ✓ |
| 12 | Divisible by both 3 and 4 | 1,716 ✓ |

### Why the rules work

- **2, 4, 8 (and 5, 10):** 10 is divisible by 2 and 5; 100 by 4; 1000 by 8. Every digit beyond the last one/two/three contributes a multiple of 10/100/1000, so only the tail decides.
- **3 and 9:** 10 leaves remainder 1 when divided by 9 (and by 3), so 100, 1000, … also leave remainder 1. A number like 4,152 = 4×1000 + 1×100 + 5×10 + 2 therefore leaves the same remainder as 4 + 1 + 5 + 2. The digit sum carries the remainder.
- **11:** 10 leaves remainder −1 (i.e. 10) when divided by 11, so 100 leaves +1, 1000 leaves −1, and so on. Digits alternately add and subtract — hence the alternating sum.

### Divisibility by 7

Double the last digit and subtract it from the rest; repeat until the number is small.

**Example:** 672 → 67 − 2×2 = 63, and 63 = 7 × 9, so 672 is divisible by 7.

For 7, 13 and other primes it is often faster to divide directly. Use the rule only when the number is long.

### Composite divisors: use co-prime factors

To test divisibility by a composite number, split it into **co-prime** factors and test each.

- 12 = 3 × 4 ✓ (co-prime) — **not** 2 × 6 (both even; 18 is divisible by 2 and 6 but not 12).
- 24 = 3 × 8, 36 = 4 × 9, 45 = 5 × 9, 72 = 8 × 9, 88 = 8 × 11.

### Pattern: find the missing digit

**Recognise it:** "If 5x72 is divisible by 9, find x" or "smallest digit that makes … divisible by 11".

**Approach:**

1. Write the rule as an equation in the missing digit.
2. Remember x is a single digit (0–9).
3. Pick the value that satisfies the rule (smallest/largest as asked).

**Example:** 5x72 divisible by 9 → 5 + x + 7 + 2 = 14 + x must be 18 → x = 4.

## Factors and Multiples

### Basics

- A **factor** (divisor) of n divides n exactly: factors of 12 are 1, 2, 3, 4, 6, 12.
- A **multiple** of n is n × k for an integer k: multiples of 12 are 12, 24, 36, …
- Every number is a factor and a multiple of itself.

### Prime factorisation

Every integer greater than 1 can be written as a product of primes in exactly one way:
360 = 2³ × 3² × 5.

Most factor questions are solved from this form.

### Number of factors

```text
If n = pᵃ × qᵇ × rᶜ  (p, q, r distinct primes)
Number of factors = (a + 1)(b + 1)(c + 1)
```

- **Meaning:** counts every divisor of n, including 1 and n.
- **Variables:** p, q, r are the distinct prime factors; a, b, c are their powers.
- **Why it works:** a factor can contain p⁰, p¹, …, pᵃ — that is (a + 1) choices — and independently (b + 1) choices for q and (c + 1) for r. Multiply the choices.
- **Use when:** counting divisors, odd/even divisors, or perfect-square divisors.
- **Example:** 360 = 2³ × 3² × 5¹ → (3+1)(2+1)(1+1) = 24 factors.
- **Common mistake:** adding the powers instead of multiplying (a+1)(b+1)…, or forgetting a prime whose power is 1.

### Sum of factors

```text
Sum of factors = [(pᵃ⁺¹ − 1)/(p − 1)] × [(qᵇ⁺¹ − 1)/(q − 1)] × …
```

- **Meaning:** adds every divisor of n.
- **Why it works:** expanding (1 + p + … + pᵃ)(1 + q + … + qᵇ) produces every factor exactly once; each bracket is a geometric series.
- **Example:** 360 → (2⁴ − 1)/1 × (3³ − 1)/2 × (5² − 1)/4 = 15 × 13 × 6 = 1170.
- **Common mistake:** using the power a instead of a + 1 in the numerator.

### Odd and even factors

- **Odd factors:** ignore the power of 2. For 360, odd factors come from 3² × 5 → (2+1)(1+1) = 6.
- **Even factors:** total − odd = 24 − 6 = 18.

### Perfect squares

A number has an **odd** number of factors **if and only if** it is a perfect square. Factors normally come in pairs (a, n/a); only for a perfect square does one pair collapse into a single factor (√n × √n).

### Trailing zeros in n!

```text
Trailing zeros in n! = ⌊n/5⌋ + ⌊n/25⌋ + ⌊n/125⌋ + …
```

- **Meaning:** number of zeros at the end of n! (n factorial). ⌊ ⌋ means "drop the decimal part".
- **Why it works:** each trailing zero needs a factor 10 = 2 × 5. Factors of 2 are plentiful, so the count of 5s decides. Multiples of 25 contribute an extra 5, multiples of 125 another, and so on.
- **Example:** 100! → 20 + 4 = 24 trailing zeros.
- **Common mistake:** stopping at ⌊n/5⌋ and missing the extra 5s from 25, 125, ….

## HCF and LCM

### Definitions

- **HCF** (Highest Common Factor, also GCD): the largest number that divides all the given numbers.
- **LCM** (Least Common Multiple): the smallest number that all the given numbers divide.

### Prime factorisation method

- **HCF** = product of common primes with the **lowest** powers.
- **LCM** = product of all primes with the **highest** powers.

**Example:** 36 = 2² × 3², 84 = 2² × 3 × 7.
HCF = 2² × 3 = 12. LCM = 2² × 3² × 7 = 252.

### Division (Euclid's) method for HCF

Divide the larger number by the smaller, then divide the previous divisor by the remainder, until the remainder is 0. The last divisor is the HCF.

```text
84 ÷ 36 → remainder 12
36 ÷ 12 → remainder 0     → HCF = 12
```

**Why it works:** any common divisor of a and b also divides a − kb (the remainder), so the HCF never changes as the numbers shrink.

### HCF × LCM = product (two numbers only)

```text
HCF(a, b) × LCM(a, b) = a × b
```

- **Meaning:** for any two numbers, the product of their HCF and LCM equals their product.
- **Use when:** given three of the four values (a, b, HCF, LCM), find the fourth.
- **Example:** 12 × 252 = 3024 = 36 × 84 ✓.
- **Common mistake:** applying it to three or more numbers — it does **not** hold in general (e.g. 2, 4, 8: HCF 2 × LCM 8 = 16, but 2 × 4 × 8 = 64).

### HCF and LCM of fractions

```text
HCF of fractions = HCF of numerators / LCM of denominators
LCM of fractions = LCM of numerators / HCF of denominators
```

Reduce each fraction to lowest terms first.
**Example:** fractions 2/3 and 4/9 → HCF = HCF(2, 4)/LCM(3, 9) = 2/9; LCM = LCM(2, 4)/HCF(3, 9) = 4/3.

### Remainder-based HCF and LCM patterns

| Question says | Answer |
|---------------|--------|
| Largest number dividing a, b, c exactly | HCF(a, b, c) |
| Largest number dividing a, b, c leaving the **same** remainder | HCF of the differences (b − a, c − b, c − a) |
| Largest number dividing a and b leaving remainders r₁ and r₂ | HCF(a − r₁, b − r₂) |
| Smallest number divisible by x, y, z | LCM(x, y, z) |
| Smallest number that leaves remainder r when divided by x, y, z | LCM(x, y, z) + r |
| Smallest number that leaves remainders where (divisor − remainder) = k for every divisor | LCM(x, y, z) − k |
| Events repeating every x, y, z minutes happen together again after | LCM(x, y, z) |

**Why "HCF of differences" works:** if a = dq₁ + r and b = dq₂ + r, then b − a = d(q₂ − q₁). The common remainder cancels, so d divides every difference.

**Why "LCM − k" works:** dividing 59 by 4, 5, 6 gives remainders 3, 4, 5 — each one less than the divisor. So 59 + 1 = 60 is divisible by all three: the number is LCM − 1.

## Remainders

### The division relation

```text
Dividend = Divisor × Quotient + Remainder,   0 ≤ Remainder < Divisor
```

**Example:** 47 = 5 × 9 + 2, so 47 ÷ 5 leaves remainder 2.

### Remainder of a sum or product

The remainder of a sum (or product) equals the remainder of the sum (or product) of the individual remainders.

```text
(17 × 23) ÷ 5 → remainders 2 and 3 → 2 × 3 = 6 → 6 ÷ 5 → remainder 1
```

Check: 17 × 23 = 391 = 5 × 78 + 1 ✓.

**Why it works:** 17 = 5k + 2 and 23 = 5m + 3. Multiplying, every term except 2 × 3 contains a factor of 5.

### Negative remainders

A remainder can be written as a negative number when that is smaller to work with: 98 leaves remainder −2 when divided by 100.

**Example:** (98 × 99) ÷ 100 → (−2) × (−1) = 2. Check: 9702 → remainder 2 ✓.

If the final answer is negative, add the divisor: a result of −3 when dividing by 7 means remainder 4.

### Remainders of powers: find the cycle

Remainders of aⁿ repeat in a cycle. Find where the cycle returns to 1, then reduce the power.

**Example:** 2¹⁰⁰ ÷ 7. Since 2³ = 8 leaves remainder 1, 2⁹⁹ = (2³)³³ leaves 1, so 2¹⁰⁰ = 2⁹⁹ × 2 leaves 2.

### Fermat's little theorem

```text
If p is prime and p does not divide a:  aᵖ⁻¹ leaves remainder 1 when divided by p
```

- **Use when:** the divisor is a prime and the power is large.
- **Example:** 3¹⁰⁰ ÷ 7 → 3⁶ leaves 1; 100 = 6 × 16 + 4, so the answer is the remainder of 3⁴ = 81 ÷ 7 = 4.
- **Common mistake:** using it when the divisor is not prime, or when p divides a.

### Useful special cases

```text
(x + 1)ⁿ ÷ x  → remainder 1
(x − 1)ⁿ ÷ x  → remainder 1 if n is even, x − 1 if n is odd
```

**Example:** 17²⁰⁰ ÷ 16 → 17 = 16 + 1 → remainder 1.

### Divisibility of aⁿ ± bⁿ

| Expression | Always divisible by |
|------------|---------------------|
| aⁿ − bⁿ | a − b (any n) |
| aⁿ − bⁿ | a + b when n is even |
| aⁿ + bⁿ | a + b when n is odd |

**Example:** 7⁵ + 3⁵ is odd power → divisible by 7 + 3 = 10.

### Pattern: same number, two divisors

**Recognise it:** "A number divided by 296 leaves remainder 75. What is the remainder when it is divided by 37?"

**Approach:** works only when the second divisor divides the first. Here 296 = 37 × 8, so N = 296k + 75 and 296k is divisible by 37. The answer is 75 ÷ 37 → remainder 1.

> [!WARNING]
> If the second divisor does **not** divide the first (e.g. first 296, second 30), the remainder cannot be determined from this information.

## Unit Digit / Last Digit

### Concept

The unit (last) digit of a sum or product depends **only** on the unit digits of the numbers involved. 4,327 × 89 ends in the same digit as 7 × 9 = 63 → 3.

### Power cycles

The unit digits of powers repeat with a cycle of length 1, 2 or 4:

| Last digit of base | Cycle of unit digits | Cycle length |
|--------------------|----------------------|--------------|
| 0, 1, 5, 6 | stays the same | 1 |
| 4 | 4, 6 | 2 |
| 9 | 9, 1 | 2 |
| 2 | 2, 4, 8, 6 | 4 |
| 3 | 3, 9, 7, 1 | 4 |
| 7 | 7, 9, 3, 1 | 4 |
| 8 | 8, 4, 2, 6 | 4 |

Since every cycle length divides 4, one method works for all: **divide the power by 4 and use the remainder.**

### Unit digit of a power

```text
Unit digit of aⁿ: find r = n mod 4.
r = 1, 2, 3 → take the 1st, 2nd, 3rd term of the cycle
r = 0       → take the 4th term (the last one)
```

- **Example:** 7⁹⁵ → 95 mod 4 = 3 → third term of (7, 9, 3, 1) → **3**.
- **Example:** 2¹⁰⁰ → 100 mod 4 = 0 → fourth term of (2, 4, 8, 6) → **6**.
- **Common mistake:** when r = 0, using the first term or the base's own digit. r = 0 means the cycle completed, so use the last term.

> [!TIP]
> For 4 and 9 you can use odd/even directly: 4^odd ends in 4, 4^even in 6; 9^odd ends in 9, 9^even in 1.

### Products and sums of powers

Find each unit digit separately, then combine:

**Example:** 23⁴⁵ × 47²². 3⁴⁵ → 45 mod 4 = 1 → 3. 7²² → 22 mod 4 = 2 → 9. 3 × 9 = 27 → **7**.

For a **difference**, if the result goes negative, add 10: units 3 − 7 → 13 − 7 = 6 (when the first number is larger overall).

### Factorials

n! ends in 0 for every n ≥ 5 (it contains 2 × 5). So
1! + 2! + 3! + … + 100! has the same unit digit as 1 + 2 + 6 + 24 = 33 → **3**.

## Common Mistakes

- Calling 1 a prime, or forgetting that 2 is prime.
- Testing divisibility by a composite using non-co-prime factors (12 as 2 × 6).
- Applying HCF × LCM = product to three numbers.
- Using a remainder ≥ the divisor; or leaving a negative remainder as the final answer.
- In unit-digit questions, mishandling n mod 4 = 0 (it means the 4th term).
- Counting trailing zeros with only ⌊n/5⌋.
- Mixing up the two remainder patterns: same remainder → HCF of **differences**; given remainders r₁, r₂ → HCF(a − r₁, b − r₂).

## Placement Tips

- Divisibility rules eliminate options in many topics, not only this one. Before calculating, check which options are even possible.
- For "largest/greatest number that divides…" think HCF; for "smallest/least number that is divisible / events coinciding" think LCM.
- Remainder questions with huge powers are almost always cycle or Fermat questions — never expand the power.
- Unit-digit questions are quick marks: they take under 30 seconds once the cycles are known.
- When stuck between options, substitute small numbers to test a property (e.g. check a remainder rule with 2³ instead of 2¹⁰⁰).

## Key Takeaways

- Natural ⊂ Whole ⊂ Integers ⊂ Rational ⊂ Real; 1 is neither prime nor composite; 2 is the only even prime.
- Divisibility rules work because powers of 10 leave fixed remainders; for composites, test co-prime factors.
- From n = pᵃqᵇrᶜ: factors = (a+1)(b+1)(c+1); perfect squares have an odd number of factors.
- HCF = lowest powers of common primes; LCM = highest powers of all primes; HCF × LCM = product for two numbers only.
- Remainders can be combined by adding/multiplying remainders; use cycles, negative remainders and Fermat for powers.
- Unit digit of aⁿ: cycle of the base's last digit, indexed by n mod 4 (0 → 4th term).
