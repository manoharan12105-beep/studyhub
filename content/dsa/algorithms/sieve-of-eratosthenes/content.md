# Sieve of Eratosthenes

## Definition

The **Sieve of Eratosthenes** finds every prime number up to n. It starts with all numbers 2 … n marked as candidate primes; for each prime p (taken in increasing order) it crosses out the multiples p², p² + p, p² + 2p, … as composite. Numbers left unmarked are prime. Time **O(n log log n)**, space **O(n)**.

## Why It Matters

- Answering "is x prime?" for many x ≤ n in O(1) each after one O(n log log n) pass, instead of O(√x) trial division per query.
- Counting primes, listing primes for factorisation, prime-gap and Goldbach-style problems.
- The smallest-prime-factor variant enables O(log x) factorisation — see [Prime Factorization](../prime-factorization/content.md).

## Prerequisites

- [Time Complexity](../../fundamentals/time-complexity/content.md)
- [Arrays](../../data-structures/arrays/content.md)

## Intuition

A composite number has a prime factor ≤ its square root. So if every multiple of every prime p ≤ √n is crossed out, every composite ≤ n is crossed out, and only primes remain.

Why start at p²? Any smaller multiple k·p with k < p has a smaller prime factor (a factor of k), so it was already crossed out when that smaller prime was processed.

## How It Works

1. Create `isComposite[0 … n]`, all false. Mark 0 and 1 as not prime.
2. For p from 2 while p × p ≤ n:
   1. If p is not marked composite, it is prime: mark `p², p² + p, …, ≤ n` as composite.
3. Every unmarked i in 2 … n is prime.

## Visual Explanation

```text
n = 30 (x = crossed out, shown when first crossed)

p = 2: cross 4 6 8 10 12 14 16 18 20 22 24 26 28 30
p = 3: cross 9 15 21 27            (6, 12, 18, 24, 30 already crossed)
p = 5: cross 25                    (10, 15, 20, 30 already crossed)
p = 6: 6 × 6 = 36 > 30 → stop

primes: 2 3 5 7 11 13 17 19 23 29
```

## Pseudocode

```pseudocode
sieve(n):
    composite[0 … n] ← false
    for p from 2 while p · p ≤ n:
        if not composite[p]:
            for multiple from p · p to n step p:
                composite[multiple] ← true
    return [i for i in 2 … n if not composite[i]]
```

## Java Implementation

```java
import java.util.*;

public class SieveOfEratosthenes {

    static boolean[] sieve(int n) {
        boolean[] isPrime = new boolean[n + 1];
        Arrays.fill(isPrime, true);
        isPrime[0] = false;
        if (n >= 1) isPrime[1] = false;
        for (int p = 2; (long) p * p <= n; p++) {             // long avoids overflow of p * p
            if (!isPrime[p]) continue;
            for (int multiple = p * p; multiple <= n; multiple += p) {
                isPrime[multiple] = false;                    // smaller multiples were crossed by smaller primes
            }
        }
        return isPrime;
    }

    public static void main(String[] args) {
        boolean[] isPrime = sieve(50);
        List<Integer> primes = new ArrayList<>();
        for (int i = 2; i <= 50; i++) if (isPrime[i]) primes.add(i);
        System.out.println("primes up to 50: " + primes);

        boolean[] big = sieve(1_000_000);
        int count = 0;
        for (boolean b : big) if (b) count++;
        System.out.println("primes up to 10^6: " + count);
        System.out.println("is 999983 prime? " + big[999_983] + ", is 999999 prime? " + big[999_999]);
    }
}
```

**Output:**

```text
primes up to 50: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]
primes up to 10^6: 78498
is 999983 prime? true, is 999999 prime? false
```

## Dry Run

n = 20:

| p | Prime? | Crossed out (new) |
|---|--------|-------------------|
| 2 | yes | 4, 6, 8, 10, 12, 14, 16, 18, 20 |
| 3 | yes | 9, 15 (12 and 18 were already crossed) |
| 4 | no (crossed) | skip |
| 5 | 5 × 5 = 25 > 20 | loop ends |

Unmarked: 2, 3, 5, 7, 11, 13, 17, 19.

## Complexity Analysis

| Measure | Value | Why |
|---------|-------|-----|
| Time | O(n log log n) | prime p crosses about n / p numbers; Σ over primes p ≤ n of n / p = n × Σ 1/p ≈ n ln ln n |
| Space | O(n) | one flag per number (`boolean[]` uses a byte each; `BitSet` uses a bit) |
| Query "is x prime?" after sieving | O(1) | array lookup |

log log n grows extremely slowly (about 3 for n = 10⁹), so the sieve behaves almost linearly.

## Properties

- Deterministic and exact for all numbers up to n.
- Each composite is crossed once per distinct prime factor ≤ √n (so some are crossed several times — this is the log log n factor).
- Memory, not time, is usually the limit: n = 10⁸ needs 100 MB as `boolean[]`, about 12.5 MB as bits.

## Variations

- **Smallest prime factor (SPF) sieve:** store the first prime that crosses each number; factorise any x ≤ n in O(log x).
- **Linear sieve:** crosses each composite exactly once using its smallest prime factor, O(n).
- **Segmented sieve:** primes in a range [L, R] with R up to ~10¹² and R − L ≤ ~10⁶, using primes up to √R.
- **Odd-only sieve:** skip even numbers to halve memory and time.

## Comparison

| Method | Cost for all numbers ≤ n | Single query |
|--------|--------------------------|--------------|
| Trial division per number | O(n √n) | O(√x) |
| Sieve of Eratosthenes | O(n log log n) | O(1) after sieving |
| Linear sieve | O(n) | O(1) after sieving |

## Edge Cases

- n < 2: no primes; make sure 0 and 1 are never reported.
- `p * p` overflow for large n — compare as `long`.
- Range queries on large values (10¹²) need a segmented sieve; a full array is impossible.

## Advantages

- Simple and very fast in practice; many queries become O(1).

## Disadvantages

- O(n) memory; not usable when n is huge but only one number must be tested (use trial division or a probabilistic test).

## When to Use

- Many primality queries with a known bound; counting or listing primes up to n ≤ ~10⁷–10⁸.

## Common Mistakes

- Starting the inner loop at 2p (correct but slower) or at p (wrongly crosses out p itself).
- Looping p up to n with `p * p` computed in `int` (overflow).
- Marking 1 as prime.

## Key Takeaways

- Cross out multiples of each prime from p², for p ≤ √n.
- O(n log log n) time, O(n) space, O(1) queries afterwards.
- SPF sieve → fast factorisation; segmented sieve → large ranges.
