# Prime Factorization

## Definition

**Prime factorisation** writes an integer n ≥ 2 as a product of primes, n = p₁^e₁ × p₂^e₂ × … × pₖ^eₖ. By the **fundamental theorem of arithmetic** this representation is unique (up to order). **Trial division** finds it by dividing out each candidate d = 2, 3, 4, … while d × d ≤ n, in **O(√n)** time; whatever remains above 1 is itself a prime.

## Why It Matters

- Number of divisors, sum of divisors, Euler's totient, gcd/lcm of many numbers, checking perfect squares — all follow from the exponents.
- Many interview and contest problems ("ugly numbers", "count divisors", "smallest number with k divisors") are factorisation in disguise.
- With a smallest-prime-factor table from the [sieve](../sieve-of-eratosthenes/content.md), each factorisation costs only O(log n).

## Prerequisites

- [Sieve of Eratosthenes](../sieve-of-eratosthenes/content.md)
- [Time Complexity](../../fundamentals/time-complexity/content.md)

## Intuition

Divide out the smallest factor repeatedly. When 2 no longer divides n, no multiple of 2 can either, so later composite candidates (4, 6, …) never divide n — only primes succeed, even though we try every d.

Why stop at √n? If the remaining n had two factors both greater than √n, their product would exceed n. So once d × d > n, the leftover n (if > 1) has no smaller factor and is prime.

## How It Works

### Trial division

1. For d = 2 while d × d ≤ n:
   1. While n mod d = 0: record d, n ← n / d.
   2. d ← d + 1 (or: 2, then odd numbers only).
2. If n > 1, record n (a prime factor larger than the original √n).

### Smallest prime factor (SPF) table

Sieve up to N storing `spf[x]` = smallest prime dividing x. Then factorise x ≤ N by repeatedly dividing by `spf[x]`: each division at least halves x, so O(log x) steps.

### Formulas from n = Π pᵢ^eᵢ

| Quantity | Formula |
|----------|---------|
| Number of divisors d(n) | Π (eᵢ + 1) |
| Sum of divisors σ(n) | Π (1 + pᵢ + pᵢ² + … + pᵢ^eᵢ) |
| Euler's totient φ(n) (count of 1 ≤ k ≤ n with gcd(k, n) = 1) | n × Π (1 − 1/pᵢ) |
| n is a perfect square | every eᵢ is even |

## Visual Explanation

```text
n = 360
d = 2: 360 → 180 → 90 → 45      (2 three times)
d = 3: 45 → 15 → 5              (3 twice)
d = 4: 4 × 4 = 16 > 5 → stop; leftover 5 > 1 is prime
360 = 2³ × 3² × 5

divisors: (3 + 1)(2 + 1)(1 + 1) = 24
```

## Pseudocode

```pseudocode
factorize(n):
    factors ← []
    d ← 2
    while d · d ≤ n:
        while n mod d = 0:
            append d; n ← n / d
        d ← d + 1
    if n > 1: append n
    return factors

factorizeWithSpf(x, spf):
    while x > 1:
        append spf[x]; x ← x / spf[x]
```

## Java Implementation

```java
import java.util.*;

public class PrimeFactorization {

    // Returns prime → exponent, in increasing prime order.
    static Map<Long, Integer> factorize(long n) {
        Map<Long, Integer> factors = new TreeMap<>();
        for (long d = 2; d * d <= n; d++) {
            while (n % d == 0) {
                factors.merge(d, 1, Integer::sum);
                n /= d;
            }
        }
        if (n > 1) factors.merge(n, 1, Integer::sum);    // leftover prime > √(original n)
        return factors;
    }

    static int[] smallestPrimeFactors(int limit) {
        int[] spf = new int[limit + 1];
        for (int i = 2; i <= limit; i++) {
            if (spf[i] != 0) continue;                   // already has a smaller prime factor
            for (int m = i; m <= limit; m += i) {
                if (spf[m] == 0) spf[m] = i;
            }
        }
        return spf;
    }

    static List<Integer> factorizeWithSpf(int x, int[] spf) {
        List<Integer> result = new ArrayList<>();
        while (x > 1) {
            result.add(spf[x]);
            x /= spf[x];                                 // at least halves x
        }
        return result;
    }

    public static void main(String[] args) {
        Map<Long, Integer> f = factorize(360);
        long divisors = 1, sigma = 1, phi = 360;
        for (Map.Entry<Long, Integer> e : f.entrySet()) {
            long p = e.getKey();
            int k = e.getValue();
            divisors *= k + 1;
            long term = 1, power = 1;
            for (int i = 0; i < k; i++) {
                power *= p;
                term += power;
            }
            sigma *= term;
            phi = phi / p * (p - 1);
        }
        System.out.println("360 = " + f + ", divisors = " + divisors + ", sum of divisors = " + sigma + ", phi = " + phi);
        System.out.println("600851475143 = " + factorize(600_851_475_143L));
        System.out.println("97 = " + factorize(97));
        int[] spf = smallestPrimeFactors(100);
        System.out.println("84 via SPF: " + factorizeWithSpf(84, spf));
    }
}
```

**Output:**

```text
360 = {2=3, 3=2, 5=1}, divisors = 24, sum of divisors = 1170, phi = 96
600851475143 = {71=1, 839=1, 1471=1, 6857=1}
97 = {97=1}
84 via SPF: [2, 2, 3, 7]
```

## Dry Run

Trial division of n = 84:

| d | n before | Divides? | Recorded | n after |
|---|----------|----------|----------|---------|
| 2 | 84 | yes, twice | 2, 2 | 21 |
| 3 | 21 | yes, once | 3 | 7 |
| 4 | 7 | 4 × 4 = 16 > 7 → stop | — | 7 |
| — | 7 > 1 | leftover prime | 7 | 1 |

84 = 2² × 3 × 7; divisors (2 + 1)(1 + 1)(1 + 1) = 12.

## Complexity Analysis

| Method | Time | Space |
|--------|------|-------|
| Trial division (one n) | O(√n) worst (n prime); faster when n has small factors | O(log n) for the factors |
| Build SPF table up to N | O(N log log N) | O(N) |
| Factorise x ≤ N with SPF | O(log x) | O(log x) |

A number n has at most log₂ n prime factors counted with multiplicity, since each is ≥ 2.

## Properties

- The factorisation is unique (fundamental theorem of arithmetic).
- At most one prime factor of n exceeds √n.
- gcd and lcm: take the minimum / maximum exponent of each prime.

## Variations

- **Divisor enumeration:** loop i from 1 to √n; i and n / i are paired divisors — O(√n).
- **Pollard's rho** (awareness): randomized factorisation of 64-bit numbers far faster than √n.
- **Legendre's formula:** exponent of prime p in n! = ⌊n/p⌋ + ⌊n/p²⌋ + … (e.g. trailing zeros of n! = exponent of 5).

## Comparison

| Situation | Best method |
|-----------|-------------|
| One number up to 10¹² | trial division (√ ≈ 10⁶ steps) |
| Many numbers up to 10⁷ | SPF sieve, then O(log x) each |
| One number up to 10¹⁸ | Pollard's rho + Miller–Rabin (advanced) |

## Edge Cases

- n = 1 has no prime factors (empty product).
- n prime: the loop runs to √n and the leftover is n itself.
- `d * d` overflow for n near `Long.MAX_VALUE` — compare `d <= n / d` instead.

## Advantages

- Short, exact, and fast enough for n ≤ 10¹² with trial division.

## Disadvantages

- O(√n) per number is too slow for many large queries without a sieve, and hopeless for 10¹⁸ without advanced methods.

## When to Use

- Anything involving divisors, totients, perfect powers, or prime exponents.

## Common Mistakes

- Forgetting the leftover prime when n > 1 after the loop.
- Looping d up to n instead of √n (O(n)).
- Using `int` for d × d with n near 2³¹.

## Key Takeaways

- Divide out d = 2, 3, … while d² ≤ n; the leftover > 1 is prime. O(√n).
- SPF sieve → O(log x) factorisation for many queries.
- Divisor count Π(e + 1), divisor sum and φ come straight from the exponents.
