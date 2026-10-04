# Modular Arithmetic

## Definition

**Modular arithmetic** works with remainders: `a mod m` is the remainder of a divided by m, a value in 0 … m − 1. Two numbers are **congruent modulo m** (a ≡ b (mod m)) if they leave the same remainder. Addition, subtraction and multiplication can be reduced mod m at every step without changing the final remainder. Division is replaced by multiplication with a **modular inverse**, which exists only when gcd(b, m) = 1.

## Why It Matters

- Counting problems produce astronomically large answers ("number of paths", "number of subsets"), so problems ask for the answer **modulo 10⁹ + 7**. You must keep every intermediate value small without breaking correctness.
- Hashing ([Rabin–Karp](../rabin-karp/content.md)), cyclic indexing (circular buffers, days of the week), and cryptography all rely on it.
- Interviewers check the details: negative remainders in Java, overflow, and why division needs an inverse.

## Prerequisites

- [Euclidean GCD](../euclidean-gcd/content.md) — extended Euclid gives inverses.
- [Fast Exponentiation](../fast-exponentiation/content.md) — computing aᵉ mod m in O(log e).

## Intuition

On a 12-hour clock, 9 + 5 lands on 2: you only care where you end up, not how many full turns you made. Because full turns do not affect the final position, you can drop them at any time — after each addition or multiplication — and the end position is the same. That is why `(a × b) mod m = ((a mod m) × (b mod m)) mod m`.

Division is different: "half of 2 o'clock" could be 1 or 7. Dividing by b is only well-defined when b has an inverse — a number b⁻¹ with b × b⁻¹ ≡ 1 (mod m).

## How It Works

### Rules

| Operation | Safe form |
|-----------|-----------|
| Addition | `(a + b) % m` with a, b already in [0, m) |
| Subtraction | `((a − b) % m + m) % m` — Java's `%` can be negative |
| Multiplication | `(a * b) % m` computed in `long` (a, b < m ≈ 10⁹ → product < 10¹⁸) |
| Power | binary exponentiation, reducing after every multiply |
| Division a / b | `a × inverse(b) % m`, only if gcd(b, m) = 1 |

### Negative numbers in Java

`%` takes the sign of the dividend: `−7 % 3 == −1`. Use `Math.floorMod(−7, 3) == 2`, or add m and reduce again.

### Modular inverse

- **m prime** (like 10⁹ + 7): by **Fermat's little theorem**, b^(m−1) ≡ 1, so b⁻¹ = b^(m−2) mod m — computed with [fast exponentiation](../fast-exponentiation/content.md).
- **m not prime:** extended Euclid solves b·x + m·y = 1; then b⁻¹ = x mod m. If gcd(b, m) ≠ 1, no inverse exists.

### Binomial coefficients mod a prime

Precompute `fact[i] = i! mod p` and `invFact[i]`; then C(n, r) = fact[n] × invFact[r] × invFact[n − r] mod p, O(1) per query after O(n) preprocessing.

## Visual Explanation

```text
m = 7

  3 + 6 = 9  ≡ 2         (9 = 1·7 + 2)
  3 − 6 = −3 ≡ 4         Java: −3 % 7 = −3 → add 7 → 4
  3 × 6 = 18 ≡ 4
  inverse of 3: 3 × 5 = 15 ≡ 1  → 3⁻¹ = 5
  6 / 3 ≡ 6 × 5 = 30 ≡ 2  ✓ (6 / 3 = 2)
```

## Pseudocode

```pseudocode
modPow(base, exp, m):
    result ← 1; base ← base mod m
    while exp > 0:
        if exp is odd: result ← result · base mod m
        base ← base · base mod m
        exp ← exp div 2
    return result

modInverse(b, p):      // p prime, b not divisible by p
    return modPow(b, p − 2, p)
```

## Java Implementation

```java
public class ModularArithmetic {

    static final long MOD = 1_000_000_007L;

    static long modPow(long base, long exp, long m) {
        long result = 1;
        base %= m;
        while (exp > 0) {
            if ((exp & 1) == 1) result = result * base % m;    // reduce after every multiply
            base = base * base % m;
            exp >>= 1;
        }
        return result;
    }

    static long inverse(long b) { return modPow(b, MOD - 2, MOD); }   // Fermat: MOD is prime

    static long[] fact, invFact;

    static void precompute(int n) {
        fact = new long[n + 1];
        invFact = new long[n + 1];
        fact[0] = 1;
        for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i % MOD;
        invFact[n] = inverse(fact[n]);
        for (int i = n; i > 0; i--) invFact[i - 1] = invFact[i] * i % MOD;   // one inverse, then walk down
    }

    static long nCr(int n, int r) {
        if (r < 0 || r > n) return 0;
        return fact[n] * invFact[r] % MOD * invFact[n - r] % MOD;
    }

    public static void main(String[] args) {
        System.out.println("-7 % 3 = " + (-7 % 3) + ", floorMod(-7, 3) = " + Math.floorMod(-7, 3) + ", (3 - 5) mod 7 = " + ((3 - 5) % 7 + 7) % 7);
        System.out.println("int overflow: 100000 * 100000 = " + (100000 * 100000) + ", as long: " + (100000L * 100000));
        System.out.println("(MOD-1)*(MOD-1) mod MOD = " + (MOD - 1) * (MOD - 1) % MOD);
        System.out.println("2^10 mod 1000 = " + modPow(2, 10, 1000) + ", 3^200 mod 13 = " + modPow(3, 200, 13));
        System.out.println("inverse of 3 = " + inverse(3) + ", check: " + 3 * inverse(3) % MOD);
        precompute(1000);
        System.out.println("C(10, 3) = " + nCr(10, 3) + ", C(1000, 500) mod p = " + nCr(1000, 500));
    }
}
```

**Output:**

```text
-7 % 3 = -1, floorMod(-7, 3) = 2, (3 - 5) mod 7 = 5
int overflow: 100000 * 100000 = 1410065408, as long: 10000000000
(MOD-1)*(MOD-1) mod MOD = 1
2^10 mod 1000 = 24, 3^200 mod 13 = 9
inverse of 3 = 333333336, check: 1
C(10, 3) = 120, C(1000, 500) mod p = 159835829
```

## Dry Run

C(5, 2) mod 7 using inverses (5! = 120 ≡ 1, 2! = 2, 3! = 6):

| Step | Value |
|------|-------|
| fact[5] mod 7 | 120 mod 7 = 1 |
| inverse of 2! = 2 | 2 × 4 = 8 ≡ 1 → 4 |
| inverse of 3! = 6 | 6 × 6 = 36 ≡ 1 → 6 |
| C(5, 2) | 1 × 4 × 6 = 24 ≡ 3 |
| Check | C(5, 2) = 10 ≡ 3 (mod 7) ✓ |

## Complexity Analysis

| Operation | Time |
|-----------|------|
| +, −, × mod m | O(1) |
| modPow(a, e, m) | O(log e) |
| Inverse via Fermat | O(log m) |
| Inverse via extended Euclid | O(log m) |
| Factorial tables up to n | O(n) time and space (plus one O(log p) inverse) |
| nCr query afterwards | O(1) |

## Properties

- (a + b) mod m, (a − b) mod m, (a × b) mod m can all be reduced at every step.
- a⁻¹ mod m exists iff gcd(a, m) = 1; with a prime modulus every non-multiple of p has one.
- Fermat: a^(p−1) ≡ 1 (mod p) for prime p and p ∤ a.
- 10⁹ + 7 is prime and fits in `int`, and the product of two residues fits in `long` — that is why it is the standard modulus.

## Variations

- **Euler's theorem:** a^φ(m) ≡ 1 (mod m) when gcd(a, m) = 1 (generalises Fermat).
- **Chinese remainder theorem** (awareness): combine congruences mod pairwise coprime moduli into one.
- **Lucas' theorem** (awareness): C(n, r) mod a small prime p when n ≥ p.
- **Modular multiplication of 64-bit values:** needs `Math.multiplyHigh` or `BigInteger`, since the product overflows `long`.

## Comparison

| Need | Prime modulus | Composite modulus |
|------|---------------|-------------------|
| Inverse | Fermat: a^(p−2) | extended Euclid (only if gcd = 1) |
| nCr | factorial tables | Pascal's triangle O(n²), or prime-power techniques |

## Edge Cases

- Negative intermediate values after subtraction — always normalise.
- Taking `% MOD` only at the end (overflow happens long before).
- Inverse of 0 or of a multiple of the modulus does not exist.
- `int` products: cast to `long` **before** multiplying (`(long) a * b`), not after.

## Advantages

- Keeps arithmetic exact and bounded no matter how big the true answer is.

## Disadvantages

- Comparisons (`<`, `max`) become meaningless on residues — you cannot take the maximum of values mod p.
- Division requires an inverse and fails for non-coprime values.

## When to Use

- "Return the answer modulo 10⁹ + 7"; hashing; cyclic structures; any count that would overflow.

## Common Mistakes

- `(a - b) % m` producing a negative value.
- `a * b % m` with `int` a, b — overflow before the `%`.
- Dividing residues directly (`fact[n] / fact[r]`) instead of multiplying by inverses.
- Comparing or maximising values after reducing them mod p.

## Key Takeaways

- Reduce after every +, −, × ; fix negatives with `+ m` or `Math.floorMod`.
- Use `long` for products of two residues below ~2 × 10⁹.
- Division = multiply by the inverse: a^(p−2) for prime p, extended Euclid otherwise.
