# Fast Exponentiation

## Definition

**Fast exponentiation** (binary exponentiation, exponentiation by squaring) computes aᵉ with **O(log e)** multiplications instead of e − 1. It uses the binary digits of e: aᵉ = (a²)^(e/2) when e is even, and a × aᵉ⁻¹ when e is odd. It works for anything with an associative multiplication — integers mod m, matrices, permutations.

## Why It Matters

- Modular powers with huge exponents (10¹⁸) — needed for modular inverses via Fermat ([Modular Arithmetic](../modular-arithmetic/content.md)), hashing and cryptography (RSA).
- **Matrix exponentiation** computes the n-th term of a linear recurrence (Fibonacci, tiling counts) in O(k³ log n) — n can be 10¹⁸.
- "Implement `pow(x, n)`" is a common interview question that tests recursion, edge cases (negative n, `Integer.MIN_VALUE`) and complexity reasoning.

## Prerequisites

- [Recursion](../recursion/content.md)
- [Divide and Conquer](../divide-and-conquer/content.md)
- [Bit Manipulation](../bit-manipulation/content.md) — reading bits of e with `e & 1` and `e >> 1`.

## Intuition

To compute 3¹³, multiplying 3 by itself 12 times is slow. Instead, square repeatedly: 3¹, 3², 3⁴, 3⁸ — each is the square of the previous. Since 13 = 8 + 4 + 1 (binary 1101), 3¹³ = 3⁸ × 3⁴ × 3¹. That is 3 squarings and 2 extra multiplications instead of 12.

Each step halves the exponent, so there are about log₂ e steps.

## How It Works

### Recursive

- pow(a, 0) = 1.
- If e is even: h = pow(a, e / 2); return h × h.
- If e is odd: return a × pow(a, e − 1) (or h × h × a with h = pow(a, e / 2)).

Compute `h` once — calling `pow(a, e/2)` twice makes it O(e) again.

### Iterative (right-to-left binary)

1. `result = 1`.
2. While e > 0: if the lowest bit of e is 1, `result ×= a`; then `a ×= a`; `e >>= 1`.

### Matrix exponentiation

For Fibonacci, `[F(n+1), F(n)]ᵀ = M × [F(n), F(n−1)]ᵀ` with M = [[1, 1], [1, 0]]. Then Mⁿ = [[F(n+1), F(n)], [F(n), F(n−1)]]. Raise M to the n-th power with the same squaring loop, multiplying 2 × 2 matrices: O(log n). In general, a recurrence of order k uses a k × k matrix: O(k³ log n).

## Visual Explanation

```text
3^13, 13 = 1101₂ (read bits from the right)

bit   a (current square)   result
1     3                    1 × 3 = 3
0     9                    3            (bit 0: skip)
1     81                   3 × 81 = 243
1     6561                 243 × 6561 = 1594323

squarings: 3, multiplications into result: 3 → about 2·log₂ e operations
```

## Pseudocode

```pseudocode
power(a, e):                 // iterative, e ≥ 0
    result ← 1
    while e > 0:
        if e is odd: result ← result · a
        a ← a · a
        e ← e div 2
    return result

powerRecursive(a, e):
    if e = 0: return 1
    h ← powerRecursive(a, e div 2)
    if e is even: return h · h
    return h · h · a
```

## Java Implementation

```java
public class FastExponentiation {

    static final long MOD = 1_000_000_007L;

    static long power(long a, long e) {                 // no modulus: caller keeps it small
        long result = 1;
        while (e > 0) {
            if ((e & 1) == 1) result *= a;
            a *= a;
            e >>= 1;
        }
        return result;
    }

    static long powerRecursive(long a, long e) {
        if (e == 0) return 1;
        long h = powerRecursive(a, e / 2);              // computed once
        return (e % 2 == 0) ? h * h : h * h * a;
    }

    static long modPow(long a, long e, long m) {
        long result = 1;
        a %= m;
        while (e > 0) {
            if ((e & 1) == 1) result = result * a % m;
            a = a * a % m;
            e >>= 1;
        }
        return result;
    }

    static long[][] multiply(long[][] x, long[][] y, long m) {
        int k = x.length;
        long[][] z = new long[k][k];
        for (int i = 0; i < k; i++)
            for (int t = 0; t < k; t++)
                for (int j = 0; j < k; j++) z[i][j] = (z[i][j] + x[i][t] * y[t][j]) % m;
        return z;
    }

    static long fibonacci(long n, long m) {             // F(0) = 0, F(1) = 1
        long[][] result = {{1, 0}, {0, 1}};             // identity matrix
        long[][] base = {{1, 1}, {1, 0}};
        while (n > 0) {
            if ((n & 1) == 1) result = multiply(result, base, m);
            base = multiply(base, base, m);
            n >>= 1;
        }
        return result[0][1];                            // Mⁿ = [[F(n+1), F(n)], [F(n), F(n−1)]]
    }

    public static void main(String[] args) {
        System.out.println("3^13 = " + power(3, 13) + " = " + powerRecursive(3, 13) + ", 2^62 = " + power(2, 62));
        System.out.println("2^(10^18) mod p = " + modPow(2, 1_000_000_000_000_000_000L, MOD));
        System.out.println("F(10) = " + fibonacci(10, Long.MAX_VALUE) + ", F(1000) mod p = " + fibonacci(1000, MOD));
    }
}
```

**Output:**

```text
3^13 = 1594323 = 1594323, 2^62 = 4611686018427387904
2^(10^18) mod p = 719476260
F(10) = 55, F(1000) mod p = 517691607
```

`fibonacci(10, Long.MAX_VALUE)` uses a modulus larger than any intermediate value, so it returns the exact F(10).

## Dry Run

`modPow(2, 10, 1000)`, 10 = 1010₂:

| e (binary) | Lowest bit | result | a (after squaring) |
|------------|------------|--------|--------------------|
| 1010 | 0 | 1 | 4 |
| 101 | 1 | 1 × 4 = 4 | 16 |
| 10 | 0 | 4 | 256 |
| 1 | 1 | 4 × 256 = 1024 mod 1000 = 24 | 65536 mod 1000 = 536 |
| 0 | — | **24** | — |

2¹⁰ = 1024 ≡ 24 (mod 1000) ✓.

## Complexity Analysis

| Algorithm | Time | Space |
|-----------|------|-------|
| Naive repeated multiplication | O(e) multiplications | O(1) |
| Iterative binary exponentiation | O(log e) multiplications | O(1) |
| Recursive binary exponentiation | O(log e) | O(log e) stack |
| Matrix exponentiation (k × k) | O(k³ log n) | O(k²) |

**Recurrence:** T(e) = T(e/2) + O(1) → O(log e) ([Recurrence Relations](../../fundamentals/recurrence-relations/content.md)). Calling `pow(a, e/2)` twice gives T(e) = 2T(e/2) + O(1) = O(e) — no better than the naive loop.

## Properties

- Needs only associativity of multiplication (not commutativity) — matrices qualify.
- Number of multiplications ≈ log₂ e squarings + (number of 1-bits of e).
- With a modulus, every intermediate value stays below m², so it fits in `long` for m ≤ ~3 × 10⁹.

## Variations

- **pow(x, n) for doubles with negative n:** compute pow(1/x, −n); handle `n = Integer.MIN_VALUE` with `long`.
- **Matrix exponentiation for linear recurrences:** tribonacci, number of tilings, counting paths of exactly k steps in a graph (adjacency matrix to the k-th power).
- **Modular inverse:** a^(p−2) mod p.
- **Exponentiation of permutations:** apply a permutation k times in O(n log k).

## Comparison

| Task | Naive | Fast exponentiation |
|------|-------|---------------------|
| 2^(10¹⁸) mod p | 10¹⁸ multiplications (impossible) | ~60 squarings |
| F(10¹⁸) mod p | O(n) DP (impossible) | O(8 × 60) with 2 × 2 matrices |
| `Math.pow(double, double)` | — | floating point; inexact for large integers, no modulus |

## Edge Cases

- e = 0 → 1 (including 0⁰ = 1 by convention in most problems).
- Negative exponent with doubles; `−Integer.MIN_VALUE` overflows `int`.
- Overflow without a modulus (e.g. 3⁴⁰ exceeds `long`).
- Base larger than the modulus or negative — reduce with `% m` (and normalise negatives) first.

## Advantages

- Exponential speed-up (e → log e); tiny code; generalises to any associative operation.

## Disadvantages

- Without a modulus, results overflow quickly — it speeds up the count of multiplications, not the size of the numbers.

## When to Use

- Large exponents, modular powers, inverses mod a prime, and n-th terms of linear recurrences with huge n.

## Common Mistakes

- Recomputing the half power twice (back to O(e)).
- Forgetting `% m` after **every** multiplication (overflow).
- Using `int` for the exponent loop with negative n (`n = −n` overflows for `Integer.MIN_VALUE`).
- Using `Math.pow` for exact integer results.

## Key Takeaways

- aᵉ: square the base, halve the exponent, multiply into the result when the bit is 1. O(log e).
- With a modulus, reduce after every multiply.
- Matrix exponentiation turns linear recurrences into O(k³ log n).
