# Time Complexity

## Definition

**Time complexity** describes how the number of basic operations an algorithm performs grows as the input size **n** grows. It ignores machine speed and constant factors and keeps only the growth rate, written in Big-O notation such as O(n) or O(n log n).

## Why It Matters

Running time in seconds depends on the computer, the language and the input. Growth rate does not. If one algorithm is O(n) and another O(n²), the first wins for every large enough input on every machine. Interviewers expect you to state the complexity of your solution and justify it line by line.

## Core Concept

### Input size

**n** is whatever measures the size of the input:

| Input | Usual n |
|-------|---------|
| Array or string | its length |
| Matrix | rows × columns (or state both: r and c) |
| Graph | vertices V and edges E — keep both |
| A single number N | sometimes N itself, sometimes its number of digits (log N) |

When there are two independent inputs, keep two variables: comparing two strings of lengths m and n is O(m × n), not O(n²).

### Counting operations

Count how many times the most frequently executed line runs, as a function of n.

```java
int sum = 0;                         // runs 1 time
for (int i = 0; i < n; i++) {        // loop body runs n times
    sum += arr[i];                   // runs n times
}
```

Total ≈ n + constant → **O(n)**.

Rules for simplifying:

1. **Drop constants:** 3n + 5 → O(n). Constants depend on the machine, not the algorithm.
2. **Keep the dominant term:** n² + 100n + 1000 → O(n²). For large n the largest term overwhelms the rest.
3. **Sequential blocks add:** an O(n) loop followed by an O(n²) loop is O(n + n²) = O(n²).
4. **Nested blocks multiply:** a loop of n containing a loop of m is O(n × m).

### Common loop shapes

```java
// O(n): one pass
for (int i = 0; i < n; i++) { /* O(1) work */ }

// O(n²): every pair (i, j)
for (int i = 0; i < n; i++) {
    for (int j = 0; j < n; j++) { /* O(1) work */ }
}

// Still O(n²): j starts at i, total = n + (n-1) + ... + 1 = n(n+1)/2
for (int i = 0; i < n; i++) {
    for (int j = i; j < n; j++) { /* O(1) work */ }
}

// O(log n): i doubles, so it reaches n after about log₂ n steps
for (int i = 1; i < n; i *= 2) { /* O(1) work */ }

// O(n log n): n outer iterations × log n inner iterations
for (int i = 0; i < n; i++) {
    for (int j = 1; j < n; j *= 2) { /* O(1) work */ }
}

// O(√n): stops when i * i exceeds n
for (int i = 1; (long) i * i <= n; i++) { /* O(1) work */ }
```

> [!IMPORTANT]
> Why halving or doubling gives log n: after k steps the value is 2ᵏ. The loop ends when 2ᵏ ≥ n, i.e. k ≥ log₂ n. Any algorithm that cuts the problem by a constant fraction each step (binary search, balanced-tree descent) is logarithmic.

### Growth classes

| Complexity | Name | n = 10 | n = 1,000 | n = 10⁶ | Typical source |
|------------|------|--------|-----------|---------|----------------|
| O(1) | constant | 1 | 1 | 1 | array index, hash lookup (average) |
| O(log n) | logarithmic | ≈ 3 | ≈ 10 | ≈ 20 | binary search |
| O(√n) | square root | ≈ 3 | ≈ 32 | 1,000 | trial-division prime check |
| O(n) | linear | 10 | 1,000 | 10⁶ | single pass |
| O(n log n) | linearithmic | ≈ 33 | ≈ 10⁴ | ≈ 2 × 10⁷ | merge sort, heap sort |
| O(n²) | quadratic | 100 | 10⁶ | 10¹² | all pairs |
| O(n³) | cubic | 1,000 | 10⁹ | 10¹⁸ | all triples, Floyd–Warshall |
| O(2ⁿ) | exponential | 1,024 | ≈ 10³⁰¹ | — | all subsets |
| O(n!) | factorial | 3.6 × 10⁶ | — | — | all permutations |

### Constraints → expected complexity

A Java program typically performs roughly 10⁸ simple operations per second (an order-of-magnitude rule of thumb; real speed varies). Comparing that budget with n tells you which complexities are realistic:

| Largest n | Complexity that usually fits in ~1 second |
|-----------|-------------------------------------------|
| ≤ 10–12 | O(n!) , O(n × 2ⁿ) |
| ≤ 20–25 | O(2ⁿ) |
| ≤ 500 | O(n³) |
| ≤ 5,000 | O(n²) |
| ≤ 10⁶ | O(n log n) |
| ≤ 10⁸ | O(n), and lighter constant factors |
| larger | O(log n) or O(1) — math formula or binary search |

These are heuristics, not laws. The full method is in [Constraints and Complexity](../../problem-solving/constraints-and-complexity/content.md).

### Hidden costs in Java

Library calls are not free. Count them:

| Call | Cost |
|------|------|
| `s.substring(i, j)` | O(j − i) — it copies characters |
| `s1 + s2` on strings | O(len1 + len2) — a new string |
| `list.contains(x)` on `ArrayList` | O(n) — linear scan |
| `list.remove(0)` on `ArrayList` | O(n) — shifts elements |
| `Arrays.sort(arr)` | O(n log n) |
| `map.get(k)` on `HashMap` | O(1) average, O(log n) worst for a treeified bucket |
| `treeMap.get(k)` | O(log n) |

Building a string with `+=` inside a loop is a classic hidden O(n²); `StringBuilder.append` is amortized O(1) per character.

## How It Works

Analysing any piece of code:

1. Identify n (and m, V, E… if there are several inputs).
2. Find the loops and recursive calls.
3. For each loop, count iterations as a function of n — watch how the loop variable changes (`+1` → linear, `*2` → logarithmic).
4. Multiply for nesting, add for sequence.
5. Add the cost of library calls inside loops.
6. Keep the dominant term and drop constants.
7. For recursion, write a recurrence — see [Recurrence Relations](../recurrence-relations/content.md).

## Java Example

Two algorithms for the same question — "does the array contain two values that sum to the target?" — with operation counters to show growth:

```java
import java.util.*;

public class GrowthDemo {

    static long ops;

    // Brute force: check every pair -> about n²/2 checks.
    static boolean pairSumQuadratic(int[] arr, int target) {
        for (int i = 0; i < arr.length; i++) {
            for (int j = i + 1; j < arr.length; j++) {
                ops++;
                if (arr[i] + arr[j] == target) {
                    return true;
                }
            }
        }
        return false;
    }

    // Hash set: one pass, each step does an O(1) average lookup -> about n steps.
    static boolean pairSumLinear(int[] arr, int target) {
        Set<Integer> seen = new HashSet<>();
        for (int value : arr) {
            ops++;
            if (seen.contains(target - value)) {
                return true;
            }
            seen.add(value);
        }
        return false;
    }

    public static void main(String[] args) {
        for (int n : new int[] {10, 100, 1000}) {
            int[] arr = new int[n];
            for (int i = 0; i < n; i++) {
                arr[i] = 2 * i;          // all even, so an odd target is never found (worst case)
            }
            ops = 0;
            pairSumQuadratic(arr, -1);
            long quadratic = ops;
            ops = 0;
            pairSumLinear(arr, -1);
            System.out.println("n=" + n + " quadratic=" + quadratic + " linear=" + ops);
        }
    }
}
```

**Output:**

```text
n=10 quadratic=45 linear=10
n=100 quadratic=4950 linear=100
n=1000 quadratic=499500 linear=1000
```

Multiplying n by 10 multiplies the quadratic count by about 100 and the linear count by 10 — exactly what O(n²) and O(n) predict.

## Common Misconceptions

- **"Two nested loops always mean O(n²)."** Only if both run about n times. A `while` loop whose pointer moves forward only, across all outer iterations, adds O(n) in total (two pointers, sliding window).
- **"O(1) means fast."** It means "does not grow with n". A constant of 10⁹ is still O(1).
- **"O(log n) has a base."** log₂ n and log₁₀ n differ by a constant factor, so Big-O ignores the base.
- **"Big-O is the exact running time."** It is an upper bound on growth. For small n an O(n²) algorithm with tiny constants (insertion sort) can beat an O(n log n) one.
- **Forgetting library costs:** `substring`, `contains` on a list or string concatenation inside a loop.

## Key Takeaways

- Time complexity = growth of operation count with n; drop constants and lower-order terms.
- Sequential → add; nested → multiply; halving/doubling → log n.
- Keep separate variables for independent inputs (m × n, V + E).
- Use constraints with the ~10⁸ operations/second heuristic to predict the complexity the problem expects.
- Library calls inside loops count.
