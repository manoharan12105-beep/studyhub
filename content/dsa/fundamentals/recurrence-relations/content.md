# Recurrence Relations and the Master Theorem

## Definition

A **recurrence relation** expresses the running time of a recursive algorithm in terms of its running time on smaller inputs — for example T(n) = 2T(n/2) + n for merge sort. **Solving** the recurrence gives a closed-form complexity such as O(n log n). The **Master Theorem** solves the common divide-and-conquer form T(n) = aT(n/b) + f(n) directly.

## Why It Matters

Loops can be counted directly, but recursion cannot: the cost of a call depends on the cost of the calls it makes. Writing the recurrence is how you justify "merge sort is O(n log n)" or "naive Fibonacci is exponential" instead of reciting it.

## Core Concept

### Writing a recurrence

For a recursive function, write:

```text
T(n) = (number of recursive calls) × T(size of each call) + (work done outside the calls)
T(base size) = constant
```

| Code shape | Recurrence |
|------------|------------|
| One call on n − 1, O(1) extra work (factorial, sum of list) | T(n) = T(n − 1) + O(1) |
| One call on n/2, O(1) extra work (binary search) | T(n) = T(n/2) + O(1) |
| Two calls on n/2, O(n) merge (merge sort) | T(n) = 2T(n/2) + O(n) |
| Two calls on n − 1 and n − 2 (naive Fibonacci) | T(n) = T(n − 1) + T(n − 2) + O(1) |
| Two calls on n − 1 (all subsets by include/exclude) | T(n) = 2T(n − 1) + O(1) |
| One call on n − 1, O(n) extra work (selection sort, recursive) | T(n) = T(n − 1) + O(n) |

### Method 1: Recursion tree

Draw the calls level by level, total the work per level, then sum the levels.

Merge sort, T(n) = 2T(n/2) + n:

```text
level 0:              n                      → n
level 1:        n/2        n/2               → n
level 2:     n/4  n/4   n/4  n/4             → n
  ...                                         ...
level k:   2ᵏ subproblems of size n/2ᵏ       → n
leaves:    n subproblems of size 1           → n

number of levels = log₂ n + 1, each costs n  → total ≈ n log₂ n = O(n log n)
```

Naive Fibonacci, T(n) = T(n − 1) + T(n − 2) + 1: every call branches into two, and the tree is about n levels deep, so the number of calls grows exponentially — about φⁿ with φ ≈ 1.618 (upper bound O(2ⁿ)).

### Method 2: Substitution / unrolling

Expand the recurrence until a pattern appears.

```text
T(n) = T(n − 1) + n
     = T(n − 2) + (n − 1) + n
     = T(n − 3) + (n − 2) + (n − 1) + n
     ...
     = T(0) + 1 + 2 + ... + n
     = O(1) + n(n + 1)/2  →  O(n²)
```

```text
T(n) = T(n/2) + 1
     = T(n/4) + 1 + 1
     = T(n/2ᵏ) + k           stop when n/2ᵏ = 1, i.e. k = log₂ n
     = O(log n)
```

### Method 3: Master Theorem (interview level)

For T(n) = a·T(n/b) + f(n) with a ≥ 1, b > 1, compare f(n) with **n^(log_b a)** — the total work done at the leaves of the recursion tree:

| Case | Condition | Result | Intuition |
|------|-----------|--------|-----------|
| 1 | f(n) grows slower than n^(log_b a) (by a polynomial factor) | T(n) = Θ(n^(log_b a)) | the leaves dominate |
| 2 | f(n) = Θ(n^(log_b a)) | T(n) = Θ(n^(log_b a) × log n) | every level costs the same; multiply by the number of levels |
| 3 | f(n) grows faster than n^(log_b a) (by a polynomial factor, plus a regularity condition that holds for normal polynomial f) | T(n) = Θ(f(n)) | the root dominates |

Worked examples:

| Algorithm | Recurrence | a, b, n^(log_b a) | f(n) | Case | Result |
|-----------|-----------|-------------------|------|------|--------|
| Binary search | T(n/2) + 1 | 1, 2, n⁰ = 1 | 1 | 2 | Θ(log n) |
| Merge sort | 2T(n/2) + n | 2, 2, n | n | 2 | Θ(n log n) |
| Tree traversal (balanced) | 2T(n/2) + 1 | 2, 2, n | 1 | 1 | Θ(n) |
| Karatsuba multiplication | 3T(n/2) + n | 3, 2, n^1.585 | n | 1 | Θ(n^1.585) |
| Strassen | 7T(n/2) + n² | 7, 2, n^2.807 | n² | 1 | Θ(n^2.807) |
| Some D&C with heavy combine | 2T(n/2) + n² | 2, 2, n | n² | 3 | Θ(n²) |

> [!WARNING]
> The Master Theorem only applies when the subproblems have **equal size n/b**. It does **not** apply to T(n) = T(n − 1) + … (subtract, not divide) or to unequal splits such as T(n) = T(n/3) + T(2n/3) + n. Use unrolling or a recursion tree for those.

### Recurrences for common subtract-and-conquer shapes

| Recurrence | Result | Example |
|------------|--------|---------|
| T(n) = T(n − 1) + 1 | O(n) | recursive sum, linked-list traversal |
| T(n) = T(n − 1) + n | O(n²) | recursive selection/insertion sort |
| T(n) = 2T(n − 1) + 1 | O(2ⁿ) | Tower of Hanoi, subsets |
| T(n) = T(n − 1) + T(n − 2) + 1 | O(φⁿ) ⊆ O(2ⁿ) | naive Fibonacci |
| T(n) = n × T(n − 1) | O(n!) | generating all permutations |

### Space of recursion

Space is the **maximum depth** of the recursion tree × space per frame, not the number of calls. Naive Fibonacci makes O(φⁿ) calls but only O(n) are on the stack at once → O(n) space. See [Space Complexity](../space-complexity/content.md).

## Java Example

Counting calls confirms what the recurrences predict:

```java
public class RecurrenceDemo {

    static long calls;

    // T(n) = T(n-1) + T(n-2) + 1  → exponential number of calls
    static long fib(int n) {
        calls++;
        if (n < 2) {
            return n;
        }
        return fib(n - 1) + fib(n - 2);
    }

    // T(n) = 2T(n/2) + n  → about n log n units of work
    static long work;

    static void mergeSortShape(int n) {
        if (n <= 1) {
            return;
        }
        mergeSortShape(n / 2);
        mergeSortShape(n - n / 2);
        work += n;                       // the linear merge step
    }

    public static void main(String[] args) {
        for (int n : new int[] {10, 20, 30}) {
            calls = 0;
            fib(n);
            System.out.println("fib(" + n + ") calls=" + calls);
        }
        for (int n : new int[] {1024, 1 << 20}) {
            work = 0;
            mergeSortShape(n);
            int log2 = 31 - Integer.numberOfLeadingZeros(n);
            System.out.println("n=" + n + " work=" + work + " n*log2(n)=" + (long) n * log2);
        }
    }
}
```

**Output:**

```text
fib(10) calls=177
fib(20) calls=21891
fib(30) calls=2692537
n=1024 work=10240 n*log2(n)=10240
n=1048576 work=20971520 n*log2(n)=20971520
```

Each +10 in n multiplies Fibonacci's calls by about 123 (≈ φ¹⁰), while the merge-sort shape matches n log₂ n exactly for powers of two.

## Common Misconceptions

- **"Two recursive calls means O(2ⁿ)."** Only when each call shrinks n by a constant (n − 1). Two calls on n/2 give O(n) or O(n log n) depending on the extra work.
- **"Count calls to get space."** Space is the maximum depth, not the number of calls.
- **"The Master Theorem solves every recurrence."** Not subtract-and-conquer or unequal splits.
- **Forgetting the work outside the calls**, such as copying subarrays (adds O(n) per level).

## Key Takeaways

- Recurrence = calls × T(smaller size) + work outside the calls.
- Recursion tree: sum work per level × number of levels.
- Master Theorem for aT(n/b) + f(n): compare f(n) with n^(log_b a) — leaves, every level, or root dominates.
- T(n − 1) + O(1) → O(n); T(n − 1) + O(n) → O(n²); 2T(n − 1) + O(1) → O(2ⁿ); 2T(n/2) + O(n) → O(n log n).
