# Mathematical Shortcuts

## Concept

Aptitude tests are timed, and much of the time goes into routine arithmetic: multiplying, squaring, dividing, simplifying. The shortcuts here are **not tricks to memorise blindly** — each one is ordinary algebra (usually an identity from [Algebra](../algebra/content.md)) applied to numbers with a convenient shape.

Use them in this order of priority:

1. **Avoid the calculation** — eliminate options using unit digits, digit sums, or rough size.
2. **Approximate** when the options are far apart.
3. **Calculate exactly with a shortcut** when the numbers have a friendly shape (near 100, ending in 5, symmetric around a round number).
4. **Fall back to normal long multiplication** when no shortcut fits — forcing a shortcut is slower than doing it directly.

## Rules

### Order of operations (BODMAS)

```text
B  Brackets — innermost first: ( ), then { }, then [ ]
O  Orders — powers and roots
DM Division and Multiplication — left to right, whichever comes first
AS Addition and Subtraction — left to right, whichever comes first
```

- **Example:** 18 ÷ 3 × 2 + 4² − (6 − 2) = 6 × 2 + 16 − 4 = 24.
- **Common mistake:** doing multiplication before division regardless of position. 18 ÷ 3 × 2 is (18 ÷ 3) × 2 = 12, not 18 ÷ 6 = 3.

## Numbers to Memorise

```text
Squares 11–30
11² = 121   12² = 144   13² = 169   14² = 196   15² = 225
16² = 256   17² = 289   18² = 324   19² = 361   20² = 400
21² = 441   22² = 484   23² = 529   24² = 576   25² = 625
26² = 676   27² = 729   28² = 784   29² = 841   30² = 900

Cubes 1–15
1³ = 1   2³ = 8   3³ = 27   4³ = 64   5³ = 125
6³ = 216   7³ = 343   8³ = 512   9³ = 729   10³ = 1,000
11³ = 1,331   12³ = 1,728   13³ = 2,197   14³ = 2,744   15³ = 3,375
```

Square roots: √2 ≈ 1.414, √3 ≈ 1.732, √5 ≈ 2.236.

## Shortcuts and Tricks

### Multiplying by 5, 25 and 125

- **Normal method:** long multiplication.
- **Why the shortcut works:** 5 = 10/2, 25 = 100/4, 125 = 1000/8. Multiplying by them is multiplying by a power of 10 and dividing by a small number.
- **Shortcut:** × 5 → × 10 ÷ 2; × 25 → × 100 ÷ 4; × 125 → × 1000 ÷ 8. Dividing works the other way: ÷ 25 → × 4 ÷ 100.
- **Demonstration:** 36 × 25 = 3,600/4 = 900. 4,375 ÷ 125 = 4,375 × 8/1000 = 35.
- **Useful when:** one factor is 5, 25, 50, 125 or 250.
- **Unsafe or unnecessary when:** the other number does not divide cleanly by 2/4/8 — you get a decimal; that is fine, but check the place value.

### Multiplying a two-digit number by 11

- **Normal method:** n × 10 + n.
- **Why the shortcut works:** ab × 11 = ab × 10 + ab. The tens digit of the answer receives a + b; the hundreds digit receives a (plus any carry).
- **Shortcut:** write the first digit, then the sum of the digits, then the last digit; carry if the sum is 10 or more.
- **Demonstration:** 72 × 11 → 7 | 7 + 2 | 2 = 792. 68 × 11 → 6 | 14 | 8 → carry 1 → 748.
- **Useful when:** multiplying two-digit numbers by 11 (or 110, 1.1).
- **Unsafe or unnecessary when:** you forget the carry; for three-digit numbers apply pairwise sums (abc × 11 = a | a+b | b+c | c) with carries.

### Squaring numbers ending in 5

- **Normal method:** multiply the number by itself.
- **Why the shortcut works:** (10n + 5)² = 100n² + 100n + 25 = 100 × n(n + 1) + 25.
- **Shortcut:** multiply the leading part n by (n + 1), then append 25.
- **Demonstration:** 65² → 6 × 7 = 42 → 4,225. 115² → 11 × 12 = 132 → 13,225.
- **Useful when:** the number ends in 5.
- **Unsafe or unnecessary when:** never unsafe; for other endings use the (a ± b)² method.

### Squaring with (a ± b)²

- **Normal method:** long multiplication.
- **Why the shortcut works:** (a + b)² = a² + 2ab + b² with a a round number.
- **Shortcut:** split into a round number and a small remainder.
- **Demonstration:** 63² = (60 + 3)² = 3,600 + 360 + 9 = 3,969. 97² = (100 − 3)² = 10,000 − 600 + 9 = 9,409.
- **Useful when:** the number is close to a multiple of 10 or 100.
- **Unsafe or unnecessary when:** the number is far from any round number (e.g. 47²: 2,500 − 300 + 9 = 2,209 still works, but check the sign carefully).

### Multiplying numbers near a base (100, 1000)

- **Normal method:** long multiplication.
- **Why the shortcut works:** (B − x)(B − y) = B(B − x − y) + xy. With B = 100 the first part is "(B − x − y) hundreds".
- **Shortcut:** write each number's difference from the base. Left part = one number minus the other's difference (cross-subtract). Right part = product of the differences, written with as many digits as the base has zeros.
- **Demonstration:** 97 × 96 → differences −3, −4 → 97 − 4 = 93 | 3 × 4 = 12 → 9,312. Above the base: 104 × 107 → 104 + 7 = 111 | 4 × 7 = 28 → 11,128. 999 × 999 → 998 | 001 → 998,001.
- **Useful when:** both numbers are close to the same power of 10.
- **Unsafe or unnecessary when:** the product of the differences has more digits than the base allows (carry the extra digit left), or one number is above and one below the base (the right part becomes negative — subtract it).

### Difference of squares for symmetric pairs

- **Normal method:** long multiplication.
- **Why the shortcut works:** (a − b)(a + b) = a² − b².
- **Shortcut:** if two numbers sit equally either side of a round number a, the product is a² − b².
- **Demonstration:** 47 × 53 = 50² − 3² = 2,491. 62 × 58 = 3,600 − 4 = 3,596. Also 45² − 35² = (45 + 35)(45 − 35) = 800.
- **Useful when:** the numbers have a round midpoint.
- **Unsafe or unnecessary when:** the midpoint is not round or not an integer.

### Square roots of perfect squares

- **Normal method:** prime factorisation or long division.
- **Why the shortcut works:** the last digit of a square fixes the last digit of its root (…1 → 1 or 9; …4 → 2 or 8; …9 → 3 or 7; …6 → 4 or 6; …5 → 5; …0 → 0), and the leading digits fix the tens digit.
- **Shortcut:**
  1. Last digit → two candidates for the root's last digit.
  2. Drop the last two digits; find the largest square ≤ the rest → tens digit.
  3. Choose between the candidates by comparing with (tens digit)5².
- **Demonstration:** √5,329 → ends in 9 → root ends in 3 or 7. 53 lies between 7² = 49 and 8² = 64 → 7_. 75² = 5,625 > 5,329 → lower candidate → 73.
- **Useful when:** the number is a perfect square (as in most option-based questions).
- **Unsafe or unnecessary when:** the number is not a perfect square — the method gives a wrong exact answer; estimate instead.

### Digit-sum (casting out nines) check

- **Normal method:** redo the calculation.
- **Why the shortcut works:** every number leaves the same remainder when divided by 9 as its digit sum (see [Number System](../number-system/content.md#why-the-rules-work)). Remainders multiply and add like the numbers themselves.
- **Shortcut:** reduce each number to a single digit by repeated digit sums (9 counts as 0), do the operation on those digits, and compare with the digit sum of the claimed answer.
- **Demonstration:** 236 × 57: 2 + 3 + 6 = 11 → 2; 5 + 7 = 12 → 3; 2 × 3 = 6. Option 13,462 → 16 → 7 ✗ (rejected). Option 13,452 → 15 → 6 ✓ (consistent).
- **Useful when:** eliminating options in multiplication, addition and squaring questions.
- **Unsafe or unnecessary when:** relying on it to **confirm** an answer — it cannot detect swapped digits (13,452 and 13,542 have the same digit sum). Combine it with a unit-digit check or estimate.

### Approximation

- **Normal method:** exact calculation.
- **Why the shortcut works:** when options differ by more than the rounding error, an estimate picks the same option.
- **Shortcut:** round each number to a friendly value; push one up and another down to balance errors.
- **Demonstration:** 39.97% of 601.2 + 14.98 × 7.99 ≈ 0.4 × 600 + 15 × 8 = 240 + 120 = 360.
- **Useful when:** questions say "approximately" or options are well separated.
- **Unsafe or unnecessary when:** options are within a few percent of each other.

## Problem Patterns

### Pattern 1: Simplification

**Recognise it:** a long expression with brackets, division, powers and percentages.

**Approach:** apply BODMAS strictly; convert percentages and fractions to friendly forms first.

**Example:** 64 ÷ 8 × 4 − 3 × (5 − 2)² = 8 × 4 − 3 × 9 = 32 − 27 = 5.

### Pattern 2: Choose the exact product

**Recognise it:** options are close numbers; a product is asked.

**Approach:** unit digit → digit sum → estimate. Usually two checks leave one option.

**Example:** 347 × 29. Unit digit 7 × 9 → 3 (rules out options ending in other digits). Digit sum 5 × 2 = 10 → 1 (rules out options with a different digit sum).

### Pattern 3: Approximate value

**Recognise it:** "What approximate value should come in place of the question mark?"

**Approach:** round decimals to the nearest whole number or friendly fraction, simplify, pick the nearest option.

## Common Mistakes

- Doing multiplication before division when division comes first from the left.
- Forgetting carries in the × 11 trick or in base multiplication.
- Writing the right part with too few digits in base multiplication (97 × 98 → 95 | 06, not 95 | 6).
- Trusting a digit-sum match as proof of correctness.
- Approximating when options are close.

## Placement Tips

- Learn squares to 30 and cubes to 15 — they appear inside many other questions.
- Before calculating, glance at the options: different unit digits or sizes often settle the answer.
- Practise each shortcut on 5–10 numbers until it is faster than long multiplication; otherwise it will slow you down in the test.

## Key Takeaways

- Shortcuts are algebraic identities applied to friendly numbers — know why each works.
- ×25 = ×100 ÷ 4; ×125 = ×1000 ÷ 8; ab × 11 = a | a + b | b.
- n5² = n(n + 1) followed by 25; (B − x)(B − y) = (B − x − y) | xy.
- Symmetric pairs: (a − b)(a + b) = a² − b².
- Digit sums reject wrong answers but never prove a right one; combine with unit digits and estimation.
