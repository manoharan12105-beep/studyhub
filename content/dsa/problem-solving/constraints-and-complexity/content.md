# Constraints and Complexity

## Definition

**Reading constraints** means using the limits in a problem statement — input size n, value ranges, number of queries, time and memory limits — to work out which time and space complexities can pass **before** designing an algorithm. The basic rule of thumb: a Java program performs roughly **10⁸ simple operations per second** (a rough figure; the true rate depends on the operations, memory access patterns and the judge), so the dominant term of your complexity, evaluated at the maximum n, should stay around 10⁸ or below for a typical 1–2 second limit.

## Why It Matters

- It tells you the **target complexity** immediately: n ≤ 10⁵ almost always rules out O(n²) and points to O(n log n) or O(n).
- It hints at the **technique**: n ≤ 20 suggests bitmasks/backtracking, n ≤ 500 suggests O(n³) DP, values ≤ 10⁶ suggest counting arrays or a sieve.
- It prevents bugs: value ranges warn about `int` overflow; recursion depth warns about stack overflow; memory limits rule out huge tables.

## Core Concept

Plug the maximum input size into the complexity and compare with ~10⁸:

| Max n | Largest comfortable complexity | Typical techniques |
|-------|-------------------------------|--------------------|
| ≤ 10–11 | O(n!) , O(n! × n) | permutations, brute-force search |
| ≤ 20–25 | O(2ⁿ × n) | subsets, bitmask DP, meet in the middle (n ≤ 40 → 2^(n/2)) |
| ≤ 100–500 | O(n³) | Floyd–Warshall, interval DP, triple loops |
| ≤ 2000–5000 | O(n²) | 2D DP over two strings, all pairs |
| ≤ 10⁵–10⁶ | O(n log n) or O(n) | sorting, heaps, binary search, two pointers, prefix sums, hashing |
| ≤ 10⁷–10⁸ | O(n), small constant | single pass, sieve, counting |
| ≥ 10⁹ (n is a value, not a length) | O(log n) or O(√n) | binary search on the answer, math, fast exponentiation, trial division |

These ranges overlap on purpose: constants matter. An O(n²) loop with a trivial body may pass at n = 10⁴ (10⁸ steps); an O(n log n) solution with heavy object allocation may struggle at 10⁶.

## How It Works

### 1. Find every size parameter

Look for n (length), m (second length or edges), q (queries), k, value bounds (max |a[i]|), and the sum of lengths across test cases ("Σn ≤ 2 × 10⁵").

### 2. Combine them

- Two inputs: O(n × m) with n, m ≤ 10⁵ is 10¹⁰ — too slow; O(n + m) or O((n + m) log) is fine.
- Queries: q queries each costing O(n) is O(n × q); with both 10⁵ that is 10¹⁰ — precompute (prefix sums, sparse table) or use a tree structure for O(log n) per query.
- Graphs: V ≤ 10⁵, E ≤ 2 × 10⁵ → O((V + E) log V) Dijkstra ≈ 4 × 10⁶ — fine; O(V × E) Bellman–Ford ≈ 2 × 10¹⁰ — not fine.

### 3. Read the value ranges

| Constraint | Consequence |
|------------|-------------|
| values up to 10⁹, n up to 10⁵ | sums up to 10¹⁴ → use `long` |
| products of two values up to 10⁹ | up to 10¹⁸ → `long` (just fits; 9.2 × 10¹⁸ is the limit) |
| "answer modulo 10⁹ + 7" | the true answer is huge → reduce at every step ([Modular Arithmetic](../../algorithms/modular-arithmetic/content.md)) |
| values in [0, 10⁶] | counting array or sieve indexed by value is possible |
| values up to 10⁹ but n ≤ 10⁵ | coordinate compression before indexing by value |
| values can be negative | sliding windows on sums may break; use prefix sums + hashing |

### 4. Check memory

A 256 MB limit holds about 6 × 10⁷ `int`s (4 bytes each) or 3 × 10⁷ `long`s — in practice less, because of JVM overhead. A `boolean[10⁸]` is 100 MB. `Integer` objects in collections cost about 16 bytes each plus references: a `HashMap<Integer, Integer>` with 10⁶ entries uses tens of MB. 2D DP tables of 10⁴ × 10⁴ = 10⁸ cells do not fit — use rolling rows.

### 5. Check recursion depth

Java's default thread stack handles roughly 10⁴–10⁵ frames depending on frame size. Recursive DFS on a path-shaped graph with 10⁵ nodes can throw `StackOverflowError` — use an explicit stack.

## Visual Explanation

Operations at the maximum n (≈ 10⁸ per second is the budget):

```text
n = 10⁵:   O(n)       = 10⁵        ✓
           O(n log n) ≈ 1.7 × 10⁶  ✓
           O(n √n)    ≈ 3.2 × 10⁷  ✓ (usually)
           O(n²)      = 10¹⁰       ✗ (about 100 seconds)

n = 20:    O(2ⁿ × n)  ≈ 2.1 × 10⁷  ✓
           O(n!)      ≈ 2.4 × 10¹⁸ ✗
```

## Comparison

| Situation | Average vs worst case matters? |
|-----------|-------------------------------|
| Hash maps on random data | average O(1) is fine in practice |
| Adversarial tests (contests, "anti-hash" inputs) | worst case can bite: quick sort on sorted input, hashing with predictable keys |
| Amortized structures (dynamic arrays, union-find) | judge totals over all operations — amortized bounds are what count |

Complexity notation is defined in [Asymptotic Notation](../../fundamentals/asymptotic-notation/content.md) and [Time Complexity](../../fundamentals/time-complexity/content.md); costs of common operations are collected in the [Complexity Reference](../../fundamentals/complexity-reference/content.md).

## Real-World Examples

| Statement says | Read it as |
|----------------|------------|
| "1 ≤ n ≤ 10⁵, 1 ≤ a[i] ≤ 10⁹, find the longest subarray with sum ≤ k" | O(n) or O(n log n); positive values → sliding window; sums need `long` |
| "1 ≤ n ≤ 15, assign tasks to workers minimising cost" | 2¹⁵ × 15 ≈ 5 × 10⁵ — bitmask DP |
| "1 ≤ n ≤ 10⁹, find the smallest x with f(x) ≥ target" | cannot iterate; binary search on x |
| "two strings of length ≤ 1000" | O(n × m) = 10⁶ DP table |
| "n ≤ 10⁵ points, q ≤ 10⁵ range-sum queries with updates" | O(log n) per operation — Fenwick or segment tree |
| "n ≤ 400 cities, all-pairs shortest paths" | O(n³) = 6.4 × 10⁷ — Floyd–Warshall |

## Java Example

A small calculator that evaluates common growth functions at a given n, to check a design against the ~10⁸ budget:

```java
public class ComplexityBudget {

    static String verdict(double ops) {
        return ops <= 1e8 ? "ok" : ops <= 1e9 ? "risky" : "too slow";
    }

    static void report(long n) {
        double log = Math.log(n) / Math.log(2);
        System.out.printf("n = %,d%n", n);
        System.out.printf("  n log n = %.1e  %s%n", n * log, verdict(n * log));
        System.out.printf("  n^2     = %.1e  %s%n", (double) n * n, verdict((double) n * n));
        System.out.printf("  n^3     = %.1e  %s%n", Math.pow(n, 3), verdict(Math.pow(n, 3)));
    }

    public static void main(String[] args) {
        java.util.Locale.setDefault(java.util.Locale.ROOT);
        report(100_000);
        report(400);
    }
}
```

**Output:**

```text
n = 100,000
  n log n = 1.7e+06  ok
  n^2     = 1.0e+10  too slow
  n^3     = 1.0e+15  too slow
n = 400
  n log n = 3.5e+03  ok
  n^2     = 1.6e+05  ok
  n^3     = 6.4e+07  ok
```

## Common Misconceptions

- **"Big-O ignores constants, so constants never matter."** At the boundary (10⁸–10⁹ operations), constants and memory access patterns decide pass or fail.
- **"O(n log n) always beats O(n²)."** For tiny n, the simpler quadratic code may be faster; asymptotics describe growth.
- **"The constraint on values does not affect complexity."** Value ranges decide `int` vs `long`, whether counting arrays are possible, and the number of binary-search steps (log of the value range).
- **"Average-case O(1) hash operations are guaranteed."** They are expected, not worst-case.

## Key Takeaways

- Budget ≈ 10⁸ simple operations per second in Java; plug the maximum sizes into your complexity.
- n ≤ 20 → exponential; ≤ 500 → n³; ≤ 5000 → n²; ≤ 10⁶ → n log n; huge values → log n or √n.
- Read value ranges (overflow, counting arrays), query counts (precompute), memory (table sizes) and recursion depth.
