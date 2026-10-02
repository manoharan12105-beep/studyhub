# Algebra

## Concept

Algebra replaces unknown quantities with letters so that word problems become equations. In aptitude tests, algebra appears in two ways:

1. **Directly** — solve an equation, find the roots of a quadratic, simplify using an identity, or find the range of x in an inequality.
2. **Indirectly** — almost every word problem (ages, mixtures, work, speed) ends with a linear or quadratic equation.

Two principles run through the whole topic:

- **Do the same thing to both sides.** An equation stays true if you add, subtract, multiply or divide both sides by the same quantity (not dividing by zero).
- **Identities save calculation.** Expressions like (a + b)² have fixed expansions; recognising them turns long arithmetic into a line or two.

## Linear Equations

### One variable

```text
ax + b = 0   →   x = −b / a     (a ≠ 0)
```

- **Meaning:** isolate x by undoing operations in reverse order.
- **Example:** 3x + 7 = 22 → 3x = 15 → x = 5.
- **Common mistake:** moving a term across the "=" without changing its sign.

### Two variables

Two equations are needed for two unknowns.

**Elimination:** multiply equations so one variable has equal coefficients, then add or subtract.

```text
x + y = 10
x − y = 4      add →  2x = 14 → x = 7, y = 3
```

**Substitution:** express one variable from one equation and substitute into the other.

```text
2x + 3y = 13,  3x − y = 3  →  y = 3x − 3
2x + 3(3x − 3) = 13 → 11x = 22 → x = 2, y = 3
```

### Number of solutions

For a₁x + b₁y = c₁ and a₂x + b₂y = c₂:

| Condition | Solutions | Graph |
|-----------|-----------|-------|
| a₁/a₂ ≠ b₁/b₂ | Exactly one | Lines intersect |
| a₁/a₂ = b₁/b₂ ≠ c₁/c₂ | None | Parallel lines |
| a₁/a₂ = b₁/b₂ = c₁/c₂ | Infinitely many | Same line |

### Symmetric equations shortcut

When the equations are mirror images (5p + 3n = 110 and 3p + 5n = 130), **add** them and **subtract** them:

- Add: 8(p + n) = 240 → p + n = 30.
- Subtract: 2(n − p) = 20 → n − p = 10.
- So n = 20, p = 10.

**Why it works:** adding and subtracting give the sum and difference of the unknowns directly, with no multiplying.

### Pattern: two-digit numbers

**Recognise it:** "the sum of the digits is …; reversing the digits increases the number by …".

**Approach:** a number with tens digit a and units digit b is 10a + b; reversed it is 10b + a. The difference is 9(b − a).

**Example:** digit sum 9, reversing adds 27 → b − a = 3 and a + b = 9 → a = 3, b = 6 → 36.

## Quadratic Equations

### Standard form and roots

```text
ax² + bx + c = 0   (a ≠ 0)
x = [−b ± √(b² − 4ac)] / 2a
```

- **Meaning:** a quadratic has at most two roots (values of x that make it zero).
- **Method 1 — factorisation:** split the middle term. x² − 5x + 6 = (x − 2)(x − 3) → x = 2 or 3.
- **Method 2 — formula:** works for every quadratic. 2x² − 7x + 3 = 0 → D = 49 − 24 = 25 → x = (7 ± 5)/4 = 3 or 1/2.
- **Common mistake:** sign errors with −b; dividing by a instead of 2a.

### Discriminant

```text
D = b² − 4ac
D > 0 → two distinct real roots   D = 0 → two equal roots   D < 0 → no real roots
```

- **Example:** x² + kx + 16 = 0 has equal roots when k² − 64 = 0 → k = ±8.

### Sum and product of roots

```text
Sum of roots = −b/a        Product of roots = c/a
Equation with roots α, β:  x² − (α + β)x + αβ = 0
```

- **Why it works:** a(x − α)(x − β) = a[x² − (α + β)x + αβ]; compare with ax² + bx + c.
- **Example:** roots 3 and −5 → sum −2, product −15 → x² + 2x − 15 = 0.
- **Common mistake:** forgetting the minus sign in the sum (−b/a).

### Pattern: comparing roots of two quadratics

**Recognise it:** "I. x² − 7x + 12 = 0, II. y² − 9y + 20 = 0. Find the relationship between x and y."

**Approach:** solve both. Compare every x with every y. If one relation (>, <, ≥, ≤, =) holds for **all** pairs, that is the answer; otherwise "relationship cannot be established".

**Example:** x ∈ {3, 4}, y ∈ {4, 5}. Every x ≤ every y (4 = 4 is possible) → x ≤ y.

> [!TIP]
> Quick sign rule: for x² + bx + c with c > 0, both roots have the sign opposite to b. x² − 7x + 12 → both positive.

## Algebraic Identities

### Core identities

```text
(a + b)² = a² + 2ab + b²
(a − b)² = a² − 2ab + b²
a² − b²  = (a + b)(a − b)
(a + b)³ = a³ + b³ + 3ab(a + b)
(a − b)³ = a³ − b³ − 3ab(a − b)
a³ + b³  = (a + b)(a² − ab + b²)
a³ − b³  = (a − b)(a² + ab + b²)
```

### Derived forms

```text
a² + b² = (a + b)² − 2ab = (a − b)² + 2ab
(a + b)² − (a − b)² = 4ab
a³ + b³ = (a + b)³ − 3ab(a + b)
```

- **Use when:** a + b and ab are given and you need a² + b² or a³ + b³.
- **Example:** a + b = 7, ab = 12 → a² + b² = 49 − 24 = 25; a³ + b³ = 343 − 3 × 12 × 7 = 91.

### Three-variable identity

```text
a³ + b³ + c³ − 3abc = (a + b + c)(a² + b² + c² − ab − bc − ca)
If a + b + c = 0, then a³ + b³ + c³ = 3abc
```

- **Example:** a = 1, b = 2, c = −3 (sum 0) → 1 + 8 − 27 = −18 = 3 × 1 × 2 × (−3) ✓.

### x + 1/x forms

```text
If x + 1/x = k:   x² + 1/x² = k² − 2     x³ + 1/x³ = k³ − 3k
```

- **Why it works:** square or cube x + 1/x; the cross terms are 2 × x × 1/x = 2 and 3 × x × 1/x × (x + 1/x) = 3k.
- **Example:** x + 1/x = 3 → x² + 1/x² = 7; x³ + 1/x³ = 27 − 9 = 18.

### Mental arithmetic with identities

- 102² = (100 + 2)² = 10,000 + 400 + 4 = 10,404.
- 997² = (1000 − 3)² = 1,000,000 − 6,000 + 9 = 994,009.
- 98 × 102 = 100² − 2² = 9,996.

## Inequalities

### Rules

| Operation on both sides | Inequality sign |
|-------------------------|-----------------|
| Add or subtract any number | Unchanged |
| Multiply or divide by a **positive** number | Unchanged |
| Multiply or divide by a **negative** number | **Reversed** |

- **Example:** 3 − 2x > 7 → −2x > 4 → divide by −2 and flip → x < −2.
- **Common mistake:** forgetting to flip the sign, or multiplying by a variable whose sign is unknown.

### Compound inequalities

Apply the same operation to all three parts:
−3 ≤ 2x + 1 < 7 → −4 ≤ 2x < 6 → −2 ≤ x < 3.

### Quadratic inequalities

```text
For a < b:
(x − a)(x − b) < 0   →   a < x < b          (between the roots)
(x − a)(x − b) > 0   →   x < a  or  x > b   (outside the roots)
```

- **Why it works:** the product is negative only when the two factors have opposite signs, which happens between the roots.
- **Example:** x² − 5x + 6 < 0 → (x − 2)(x − 3) < 0 → 2 < x < 3.
- **Example:** x² − x − 12 > 0 → (x − 4)(x + 3) > 0 → x < −3 or x > 4.

### Absolute value

```text
|x| < a  →  −a < x < a          |x| > a  →  x < −a  or  x > a      (a > 0)
```

- **Example:** |x − 3| ≤ 2 → −2 ≤ x − 3 ≤ 2 → 1 ≤ x ≤ 5.

### AM ≥ GM (positive numbers)

```text
(a + b)/2 ≥ √(ab),  equality when a = b
```

- **Use when:** finding a minimum value. For x > 0, x + 1/x ≥ 2, with the minimum 2 at x = 1.

## Common Mistakes

- Changing sides without changing signs.
- Writing (a + b)² = a² + b².
- Sum of roots as b/a instead of −b/a.
- Not flipping an inequality after multiplying or dividing by a negative.
- In root-comparison questions, choosing ">" when some pair is equal (the answer is then "≥").

## Placement Tips

- Substitute options into equations — often faster than solving.
- For quadratics with integer coefficients, try factorising before using the formula.
- Use identities for any square, cube or product of numbers near a round number.
- For inequalities, test a value from your answer range back in the original to confirm the direction.

## Key Takeaways

- Linear: isolate the variable; two unknowns need two independent equations.
- Quadratic: x = [−b ± √D]/2a; D decides the nature of roots; sum −b/a, product c/a.
- Identities: (a ± b)², a² − b², (a ± b)³, a³ ± b³; a + b + c = 0 ⇒ a³ + b³ + c³ = 3abc.
- Inequalities: flip the sign when multiplying/dividing by a negative; between the roots for "< 0", outside for "> 0".
