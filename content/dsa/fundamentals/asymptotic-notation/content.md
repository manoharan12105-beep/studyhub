# Asymptotic Notation

## Definition

**Asymptotic notation** describes how a function — usually an algorithm's running time T(n) — grows as n becomes large. **Big-O** gives an upper bound, **Big-Omega (Ω)** a lower bound, and **Big-Theta (Θ)** a tight bound (both at once). **Best, average and worst case** are a separate idea: they say *which inputs* you are analysing.

## Why It Matters

"Quick sort is O(n log n)" is a common interview answer — and it is wrong as stated, because its worst case is Θ(n²). Precise language about bounds and cases is how you show you understand an algorithm rather than remember a slogan.

## Core Concept

### Big-O — upper bound

T(n) = O(g(n)) means: there are constants c > 0 and n₀ such that T(n) ≤ c × g(n) for every n ≥ n₀.

In words: beyond some input size, T grows **no faster** than g, up to a constant factor.

Example: T(n) = 3n + 10. Take c = 4 and n₀ = 10: for n ≥ 10, 3n + 10 ≤ 4n. So T(n) = O(n).

Big-O is an upper bound, so 3n + 10 is also O(n²) — true, but not useful. When people say "the complexity is O(n)" they mean the tightest bound they can state.

### Big-Omega — lower bound

T(n) = Ω(g(n)) means: there are constants c > 0 and n₀ such that T(n) ≥ c × g(n) for every n ≥ n₀.

In words: T grows **at least as fast** as g. Example: any algorithm that must read all n input elements is Ω(n). Comparison-based sorting is Ω(n log n) in the worst case — no comparison sort can do better (see [Algorithm Properties](../algorithm-properties/content.md)).

### Big-Theta — tight bound

T(n) = Θ(g(n)) means T(n) is both O(g(n)) and Ω(g(n)): it grows **exactly as fast** as g, up to constants.

Example: 3n + 10 = Θ(n). Merge sort is Θ(n log n) in every case.

```text
     c₂·g(n)  ─────────────────────────  upper curve
     T(n)     ~~~~~~~~~~~~~~~~~~~~~~~~~  stays between them after n₀
     c₁·g(n)  ─────────────────────────  lower curve
              |
              n₀ ──────────────────────▶ n

  T(n) = Θ(g(n))  ⇔  c₁·g(n) ≤ T(n) ≤ c₂·g(n) for all n ≥ n₀
```

| Notation | Meaning | Analogy |
|----------|---------|---------|
| O(g) | grows no faster than g | ≤ |
| Ω(g) | grows no slower than g | ≥ |
| Θ(g) | grows like g | = |

> [!NOTE]
> Little-o and little-omega (strict versions of O and Ω) exist but almost never appear in interviews.

### Best, average and worst case

These describe **which input** of size n you analyse:

| Case | Meaning | Linear search for x in n elements |
|------|---------|-----------------------------------|
| Best | the cheapest input of size n | x is the first element → 1 comparison |
| Worst | the most expensive input of size n | x is last or absent → n comparisons |
| Average | expected cost over a stated distribution of inputs | x equally likely at each position → (n + 1)/2 comparisons |

Each case is a function of n, and each can be described with O, Ω or Θ. For linear search:

- Best case: Θ(1).
- Worst case: Θ(n).
- Average case (x present, uniform position): Θ(n).

So "case" and "bound" are independent axes. "Best case = Ω, worst case = O" is a **common misconception**: you can give an upper bound on the best case and a lower bound on the worst case.

> [!IMPORTANT]
> When an interviewer asks "what is the complexity?", give the **worst case** unless asked otherwise, and mention the average case when it differs meaningfully (hash maps, quick sort).

### Why the worst case is the default

- It is a **guarantee**: the algorithm never does worse.
- The average case needs an assumption about input distribution that may not hold (sorted input is common in practice and is the worst case for naive quick sort).
- The best case is rarely informative — almost every algorithm is fast on some lucky input.

### Examples worth knowing precisely

| Algorithm | Best | Average | Worst |
|-----------|------|---------|-------|
| Linear search | Θ(1) | Θ(n) | Θ(n) |
| Binary search | Θ(1) | Θ(log n) | Θ(log n) |
| Insertion sort | Θ(n) (already sorted) | Θ(n²) | Θ(n²) |
| Merge sort | Θ(n log n) | Θ(n log n) | Θ(n log n) |
| Quick sort (fixed pivot) | Θ(n log n) | Θ(n log n) | Θ(n²) |
| `HashMap.get` | Θ(1) | Θ(1) expected | O(n), or O(log n) with Java 8+ treeified buckets |

## Comparison

| Statement | True? | Why |
|-----------|-------|-----|
| 5n² + n = O(n²) | Yes | dominant term n² |
| 5n² + n = O(n³) | Yes, but loose | O is only an upper bound |
| 5n² + n = Θ(n³) | No | it does not grow as fast as n³ |
| n log n = O(n²) | Yes | log n < n for large n |
| 2ⁿ⁺¹ = O(2ⁿ) | Yes | 2ⁿ⁺¹ = 2 × 2ⁿ, a constant factor |
| 2²ⁿ = O(2ⁿ) | No | 2²ⁿ = (2ⁿ)², not a constant factor |
| log₂ n = Θ(log₁₀ n) | Yes | they differ by the constant log₂ 10 |

## Java Example

Counting comparisons for linear search on the best, average and worst inputs of the same size:

```java
public class CasesDemo {

    static int comparisons;

    static int linearSearch(int[] arr, int target) {
        for (int i = 0; i < arr.length; i++) {
            comparisons++;
            if (arr[i] == target) {
                return i;
            }
        }
        return -1;
    }

    public static void main(String[] args) {
        int n = 1000;
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) {
            arr[i] = i;
        }

        comparisons = 0;
        linearSearch(arr, 0);
        System.out.println("best (first element): " + comparisons);

        comparisons = 0;
        linearSearch(arr, -5);
        System.out.println("worst (absent): " + comparisons);

        long total = 0;
        for (int target = 0; target < n; target++) {   // every position equally likely
            comparisons = 0;
            linearSearch(arr, target);
            total += comparisons;
        }
        System.out.println("average (present): " + (double) total / n);
    }
}
```

**Output:**

```text
best (first element): 1
worst (absent): 1000
average (present): 500.5
```

The average 500.5 = (n + 1)/2 — still Θ(n), only half the worst case.

## Common Misconceptions

- **"Big-O means worst case."** Big-O is a bound; worst case is an input. You can write "best case is O(1)".
- **"O(n) is always faster than O(n²)."** Only for large enough n. Constants matter for small inputs.
- **"O(2n) is different from O(n)."** Constants are dropped: O(2n) = O(n).
- **"Quick sort is O(n log n)."** Its average is; its worst case is O(n²).
- **"Θ is the average case."** Θ is a tight bound and can describe any case.

## Key Takeaways

- O = upper bound, Ω = lower bound, Θ = tight bound (both).
- Best/average/worst choose the input; O/Ω/Θ describe growth. They are independent.
- Default to the worst case; mention average when it differs (hashing, quick sort).
- Constants and log bases do not change the class; exponents and powers inside exponentials do.
