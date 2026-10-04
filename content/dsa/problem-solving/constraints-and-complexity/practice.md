# Constraints and Complexity — Practice

### P1. Pick the target complexity

**Difficulty:** Easy · **Pattern:** Size → complexity table

For each constraint, state the largest complexity that comfortably passes a 1-second limit in Java and one technique it suggests:

1. n ≤ 12
2. n ≤ 18
3. n ≤ 300
4. n ≤ 3000
5. n ≤ 2 × 10⁵
6. n ≤ 10¹²

<details>
<summary>Hint</summary>

Evaluate each candidate complexity at the maximum n and compare with about 10⁸.

</details>

<details>
<summary>Answer</summary>

| Constraint | Target | Why | Suggests |
|------------|--------|-----|----------|
| n ≤ 12 | O(n! × n) | 12! ≈ 4.8 × 10⁸ is borderline; with pruning fine | permutations / backtracking |
| n ≤ 18 | O(2ⁿ × n) | 2¹⁸ × 18 ≈ 4.7 × 10⁶ | bitmask DP, subsets |
| n ≤ 300 | O(n³) | 2.7 × 10⁷ | interval DP, Floyd–Warshall |
| n ≤ 3000 | O(n²) | 9 × 10⁶ | 2D DP, all pairs |
| n ≤ 2 × 10⁵ | O(n log n) | ≈ 3.5 × 10⁶ | sorting, heap, binary search |
| n ≤ 10¹² | O(√n) or O(log n) | √10¹² = 10⁶ | trial division, binary search, math |

</details>

### P2. Will this pass?

**Difficulty:** Easy · **Pattern:** Multiply all size parameters

An array has n ≤ 10⁵ elements and there are q ≤ 10⁵ queries "sum of a[l … r]". A solution loops from l to r for each query. Will it pass? What should replace it?

<details>
<summary>Hint</summary>

Worst case: every query spans the whole array.

</details>

<details>
<summary>Answer</summary>

**No.** Worst case n × q = 10¹⁰ additions — about 100 seconds. Precompute prefix sums once in O(n); each query becomes `prefix[r + 1] − prefix[l]`, O(1). Total O(n + q) ≈ 2 × 10⁵ ([Prefix Sum](../../patterns/prefix-sum/content.md)). If values also change between queries, use a [Fenwick tree](../../data-structures/fenwick-tree/content.md): O((n + q) log n).

</details>

### P3. Spot the overflow

**Difficulty:** Medium · **Pattern:** Value ranges → data types

Constraints: n ≤ 10⁵, −10⁹ ≤ a[i] ≤ 10⁹. Which of these computations need `long` in Java?

1. The sum of all elements.
2. The difference a[i] − a[j].
3. The midpoint `(lo + hi) / 2` of two indices with lo, hi < 10⁵.
4. The product a[i] × a[j].
5. The count of pairs i < j.

<details>
<summary>Hint</summary>

`int` holds about ±2.1 × 10⁹.

</details>

<details>
<summary>Answer</summary>

| Computation | Range | Needs `long`? |
|-------------|-------|---------------|
| Sum of all | up to 10⁵ × 10⁹ = 10¹⁴ | **yes** |
| a[i] − a[j] | up to 2 × 10⁹ | **yes** (exceeds 2³¹ − 1 ≈ 2.147 × 10⁹) |
| (lo + hi) / 2 with indices < 10⁵ | < 2 × 10⁵ | no (but `lo + (hi − lo) / 2` is the safe habit for larger bounds) |
| a[i] × a[j] | up to 10¹⁸ | **yes** (fits in `long`, max ≈ 9.2 × 10¹⁸) |
| Pairs n(n − 1)/2 | ≈ 5 × 10⁹ | **yes** |

Cast **before** the operation: `(long) a[i] * a[j]`, not `(long) (a[i] * a[j])`.

</details>

### P4. Read the hidden hint

**Difficulty:** Medium · **Pattern:** Unusual constraints point to techniques

What does each constraint suggest?

1. "1 ≤ n ≤ 40, choose a subset with sum closest to target."
2. "1 ≤ n ≤ 10⁵, 1 ≤ a[i] ≤ 10⁶, count pairs with gcd > 1."
3. "The sum of n over all test cases does not exceed 2 × 10⁵."
4. "1 ≤ k ≤ 10, n ≤ 10⁵, choose k non-overlapping subarrays."

<details>
<summary>Hint</summary>

Look for a parameter that is unusually small, a value bound that allows indexing by value, or a global bound across test cases.

</details>

<details>
<summary>Answer</summary>

1. 2⁴⁰ ≈ 10¹² is too many subsets, but 2²⁰ ≈ 10⁶ is fine: **meet in the middle** — enumerate subset sums of each half, sort one list, binary search for the best partner.
2. Values ≤ 10⁶ allow a **sieve / smallest-prime-factor table** and counting by divisors (inclusion–exclusion over prime factors) instead of O(n²) gcd checks.
3. Each test case may be O(n log n) or O(n) relative to **its own** n; the total work is bounded by the global sum — do not allocate 2 × 10⁵-sized arrays per test case if there are 10⁴ cases (reset only what you used).
4. Small k with large n: **DP with k as a dimension**, O(n × k) ≈ 10⁶ states.

</details>
