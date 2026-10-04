# Euclidean GCD

## Definition

The **greatest common divisor** gcd(a, b) is the largest integer that divides both a and b. The **Euclidean algorithm** computes it with the rule **gcd(a, b) = gcd(b, a mod b)**, stopping when the second argument is 0: gcd(a, 0) = a. It runs in **O(log min(a, b))** steps. The **extended Euclidean algorithm** also finds integers x, y with **a·x + b·y = gcd(a, b)**.

## Why It Matters

- Fractions in lowest terms, LCM, ratios, aspect ratios, step sizes on grids.
- Modular inverses (via extended Euclid) are needed for division under a modulus — see [Modular Arithmetic](../modular-arithmetic/content.md).
- A standard example of a fast algorithm whose speed needs a proof (the Fibonacci worst case).

## Prerequisites

- [Time Complexity](../../fundamentals/time-complexity/content.md)
- [Recursion](../recursion/content.md)

## Intuition

Any number that divides both a and b also divides `a − b`, and therefore `a − q·b = a mod b`. Conversely, a divisor of b and `a mod b` divides a. So the pairs (a, b) and (b, a mod b) have **exactly the same common divisors**, hence the same gcd. Replacing a by `a mod b` shrinks the numbers quickly while keeping the answer unchanged.

**LCM** follows: `lcm(a, b) = a / gcd(a, b) × b` (divide first to avoid overflow).

## How It Works

1. While b ≠ 0: `(a, b) ← (b, a mod b)`.
2. Return a.

### Extended Euclid

If `gcd(b, a mod b) = b·x₁ + (a mod b)·y₁` and `a mod b = a − ⌊a/b⌋·b`, then

`gcd = a·y₁ + b·(x₁ − ⌊a/b⌋·y₁)`, so `x = y₁`, `y = x₁ − ⌊a/b⌋·y₁`.

The base case gcd(a, 0) = a = a·1 + 0·0 gives (x, y) = (1, 0).

## Visual Explanation

```text
gcd(48, 18):
48 = 2·18 + 12    → gcd(18, 12)
18 = 1·12 + 6     → gcd(12, 6)
12 = 2·6  + 0     → gcd(6, 0) = 6

Geometric view: tile a 48 × 18 rectangle with the largest squares possible,
then repeat on the leftover rectangle. The last square size, 6, tiles everything.
```

## Pseudocode

```pseudocode
gcd(a, b):
    while b ≠ 0:
        (a, b) ← (b, a mod b)
    return a

extendedGcd(a, b):            // returns (g, x, y) with a·x + b·y = g
    if b = 0: return (a, 1, 0)
    (g, x1, y1) ← extendedGcd(b, a mod b)
    return (g, y1, x1 − ⌊a / b⌋ · y1)
```

## Java Implementation

```java
public class EuclideanGcd {

    static long gcd(long a, long b) {
        while (b != 0) {
            long t = a % b;
            a = b;
            b = t;
        }
        return Math.abs(a);                          // gcd is non-negative
    }

    static long lcm(long a, long b) {
        if (a == 0 || b == 0) return 0;
        return Math.abs(a / gcd(a, b) * b);          // divide first to limit overflow
    }

    // Returns {g, x, y} with a*x + b*y = g.
    static long[] extendedGcd(long a, long b) {
        if (b == 0) return new long[] {a, 1, 0};
        long[] r = extendedGcd(b, a % b);
        return new long[] {r[0], r[2], r[1] - (a / b) * r[2]};
    }

    static int steps(long a, long b) {
        int count = 0;
        while (b != 0) {
            long t = a % b;
            a = b;
            b = t;
            count++;
        }
        return count;
    }

    public static void main(String[] args) {
        System.out.println("gcd(48, 18) = " + gcd(48, 18) + ", lcm(4, 6) = " + lcm(4, 6) + ", gcd(17, 5) = " + gcd(17, 5) + ", gcd(0, 9) = " + gcd(0, 9));
        long[] e = extendedGcd(30, 12);
        System.out.println("30*(" + e[1] + ") + 12*(" + e[2] + ") = " + e[0]);
        System.out.println("steps for gcd(89, 55): " + steps(89, 55) + ", for gcd(1000000, 3): " + steps(1_000_000, 3));
    }
}
```

**Output:**

```text
gcd(48, 18) = 6, lcm(4, 6) = 12, gcd(17, 5) = 1, gcd(0, 9) = 9
30*(1) + 12*(-2) = 6
steps for gcd(89, 55): 9, for gcd(1000000, 3): 2
```

Consecutive Fibonacci numbers (89, 55) are the worst case: each step reduces the pair by only one Fibonacci index.

## Dry Run

Extended Euclid on (30, 12):

| Call | a | b | ⌊a/b⌋ | Returned (g, x, y) | Check |
|------|---|---|-------|--------------------|-------|
| 3 (base) | 6 | 0 | — | (6, 1, 0) | 6·1 + 0·0 = 6 |
| 2 | 12 | 6 | 2 | (6, 0, 1 − 2·0) = (6, 0, 1) | 12·0 + 6·1 = 6 |
| 1 | 30 | 12 | 2 | (6, 1, 0 − 2·1) = (6, 1, −2) | 30·1 + 12·(−2) = 6 |

## Complexity Analysis

| Algorithm | Time | Space |
|-----------|------|-------|
| Euclid (iterative) | O(log min(a, b)) | O(1) |
| Extended Euclid (recursive) | O(log min(a, b)) | O(log min(a, b)) stack |
| Subtraction-only version | O(max(a, b)) worst (e.g. gcd(10⁹, 1)) | O(1) |

**Why logarithmic:** after two steps the larger number at least halves. If b ≤ a/2, then `a mod b < b ≤ a/2`; if b > a/2, then `a mod b = a − b < a/2`. Halving every two steps gives at most about 2·log₂(a) steps. Lamé's theorem sharpens this: the worst case is consecutive Fibonacci numbers.

## Properties

- gcd(a, 0) = |a|; gcd(a, b) = gcd(b, a) = gcd(|a|, |b|).
- gcd(a, b) × lcm(a, b) = |a × b|.
- **Bézout's identity:** integers x, y with a·x + b·y = gcd(a, b) always exist (extended Euclid finds them).
- a·x + b·y = c has integer solutions **iff** gcd(a, b) divides c.
- gcd(a₁, …, aₙ) = gcd(gcd(a₁, a₂), a₃, …) — fold over a list.

## Variations

- **GCD of an array:** fold `gcd` left to right; stop early if it reaches 1.
- **Modular inverse:** if gcd(a, m) = 1, extended Euclid gives a·x ≡ 1 (mod m), so x mod m is the inverse.
- **Binary GCD (Stein's algorithm):** uses shifts and subtraction instead of `%`.
- **Linear Diophantine equations:** scale the Bézout coefficients by c / g.

## Comparison

| Method | Time |
|--------|------|
| Try every d from min(a, b) down to 1 | O(min(a, b)) |
| Prime factorisation of both, take common powers | O(√a + √b) |
| Euclid | O(log min(a, b)) |

## Edge Cases

- gcd(0, 0) is conventionally 0.
- Negative inputs: Java's `%` keeps the sign of the dividend, so return `Math.abs(a)`.
- LCM overflow: compute `a / gcd × b`, and use `long`.

## Advantages

- Very fast, tiny code, exact integer arithmetic.

## Disadvantages

- Extended version is easy to get wrong (sign and order of x, y).

## When to Use

- Any problem with fractions, ratios, divisibility, cycles of lengths (LCM), modular inverses with a non-prime modulus.

## Common Mistakes

- Computing `a * b / gcd` (overflows before dividing).
- Writing the recursion as `gcd(a % b, b)` (wrong argument order, may not terminate).
- Swapping x and y when returning from extended Euclid.

## Key Takeaways

- gcd(a, b) = gcd(b, a mod b); stop at b = 0.
- O(log min(a, b)) because the larger value halves every two steps.
- lcm = a / gcd × b; extended Euclid gives Bézout coefficients and modular inverses.
