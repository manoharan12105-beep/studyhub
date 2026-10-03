# Algorithm Properties: Stable, In-Place, Adaptive, Online — Practice

### P1. Which sorting algorithm is stable?

**Difficulty:** Easy · **Pattern:** Stability

- A) Selection sort
- B) Heap sort
- C) Merge sort
- D) Quick sort (Lomuto partition)

<details>
<summary>Hint</summary>

Which one never moves an element past an equal element?

</details>

<details>
<summary>Answer</summary>

**Answer:** C) Merge sort

**Explanation:** The merge step takes from the left half on ties, preserving order. Selection, heap and quick sort swap elements across long distances and can reorder equal keys.

</details>

### P2. Which algorithm is online?

**Difficulty:** Easy · **Pattern:** Online algorithms

- A) Selection sort
- B) Insertion sort
- C) Heap sort (build heap then extract)
- D) Counting sort

<details>
<summary>Hint</summary>

Which one can accept the next element without having seen the rest?

</details>

<details>
<summary>Answer</summary>

**Answer:** B) Insertion sort

**Explanation:** Insertion sort maintains a sorted prefix and inserts each new element into it. The others need the whole input first (global minimum, whole heap, or full value counts).

</details>

### P3. Show with a 3-element example that selection sort is not stable.

**Difficulty:** Medium · **Pattern:** Stability counterexample

<details>
<summary>Hint</summary>

Put two equal keys before a smaller one.

</details>

<details>
<summary>Answer</summary>

**Answer:** Input `[2a, 2b, 1]` (the letters mark which 2 is which).

- Pass 1: the minimum is 1 at index 2; swap with index 0 → `[1, 2b, 2a]`.
- Pass 2: minimum of `[2b, 2a]` is 2b (first found); no swap.

Output `[1, 2b, 2a]` — 2b now comes before 2a, so the relative order of equal keys changed.

</details>

### P4. You need to sort 10⁷ integers known to be in the range 0–999. Which approach is fastest and why?

**Difficulty:** Medium · **Pattern:** Non-comparison sorting

- A) Merge sort, because it is O(n log n) in every case
- B) Quick sort, because it is fastest in practice
- C) Counting sort, because k = 1,000 is tiny compared with n
- D) Insertion sort, because the values are small

<details>
<summary>Hint</summary>

Compare n log n with n + k.

</details>

<details>
<summary>Answer</summary>

**Answer:** C) Counting sort

**Explanation:** O(n + k) = about 10⁷ + 10³ steps, versus n log₂ n ≈ 2.3 × 10⁸ comparisons. The Ω(n log n) lower bound only applies to comparison sorts.

</details>

### P5. Records must be ordered by city, and within each city by age. You may call a stable sort only once per key. In which order do you apply the two sorts, and why?

**Difficulty:** Hard · **Pattern:** Multi-key stable sorting

<details>
<summary>Hint</summary>

The last sort decides the primary order.

</details>

<details>
<summary>Answer</summary>

**Answer:** Sort by **age first**, then stable-sort by **city**.

**Explanation:** The final sort determines the primary grouping (city). Because it is stable, records with the same city keep the order produced by the previous sort — ascending age. This is exactly how LSD radix sort works: least significant key first, most significant last.

</details>

### P6. Explain why no comparison-based sort can have a worst case better than Ω(n log n).

**Difficulty:** Hard · **Pattern:** Lower bound

<details>
<summary>Hint</summary>

Count the possible orderings and what one comparison can tell you.

</details>

<details>
<summary>Answer</summary>

**Answer:** A comparison sort must identify which of the n! orderings the input is in. Each comparison has two outcomes, so after k comparisons it can distinguish at most 2ᵏ inputs (a binary decision tree of height k has at most 2ᵏ leaves). It needs 2ᵏ ≥ n!, so k ≥ log₂(n!). By Stirling's approximation, log₂(n!) ≈ n log₂ n − 1.44n, which is Ω(n log n).

</details>
