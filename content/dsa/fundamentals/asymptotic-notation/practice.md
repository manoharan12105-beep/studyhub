# Asymptotic Notation — Practice

### P1. Which statement is true for T(n) = 4n² + 3n + 7?

**Difficulty:** Easy · **Pattern:** Dominant term

- A) T(n) = Θ(n)
- B) T(n) = Θ(n²)
- C) T(n) = Θ(n³)
- D) T(n) = Ω(n³)

<details>
<summary>Hint</summary>

Keep the dominant term, drop the constant.

</details>

<details>
<summary>Answer</summary>

**Answer:** B) T(n) = Θ(n²)

**Explanation:** n² dominates 3n + 7, and the factor 4 is dropped. It is also O(n³) (a loose upper bound), but not Θ(n³) or Ω(n³).

</details>

### P2. Linear search runs in Θ(1) time in its best case. Which case is that?

**Difficulty:** Easy · **Pattern:** Best/worst case

- A) The target is the last element
- B) The target is absent
- C) The target is the first element
- D) The array is sorted

<details>
<summary>Hint</summary>

The best case is the cheapest input of a given size.

</details>

<details>
<summary>Answer</summary>

**Answer:** C) The target is the first element

**Explanation:** One comparison finds it. Sortedness does not help plain linear search.

</details>

### P3. Is 2ⁿ⁺³ = O(2ⁿ)? Is 3ⁿ = O(2ⁿ)?

**Difficulty:** Medium · **Pattern:** Exponential bounds

- A) Yes; yes
- B) Yes; no
- C) No; yes
- D) No; no

<details>
<summary>Hint</summary>

Rewrite 2ⁿ⁺³ and 3ⁿ/2ⁿ.

</details>

<details>
<summary>Answer</summary>

**Answer:** B) Yes; no

**Explanation:** 2ⁿ⁺³ = 8 × 2ⁿ — a constant factor. But 3ⁿ / 2ⁿ = (1.5)ⁿ grows without bound, so no constant c makes 3ⁿ ≤ c × 2ⁿ.

</details>

### P4. A candidate says: "Quick sort is O(n log n), so it is always faster than insertion sort." Identify two problems with the statement.

**Difficulty:** Medium · **Pattern:** Precise claims

<details>
<summary>Hint</summary>

Think about quick sort's worst case and about insertion sort on special inputs.

</details>

<details>
<summary>Answer</summary>

**Answer:**

1. Quick sort's **worst case** is Θ(n²) (e.g. a sorted array with a first- or last-element pivot). O(n log n) is its average case.
2. Insertion sort is Θ(n) on already-sorted or nearly-sorted input and has tiny constants, so it beats quick sort on such inputs and on very small arrays. Java's own sort implementations switch to insertion sort for small subarrays for exactly this reason.

</details>

### P5. Prove from the definition that 5n + 20 = O(n) by giving valid constants c and n₀.

**Difficulty:** Medium · **Pattern:** Definition of Big-O

<details>
<summary>Hint</summary>

Find c so that 5n + 20 ≤ c × n once n is large enough.

</details>

<details>
<summary>Answer</summary>

**Answer:** c = 6, n₀ = 20 works.

**Explanation:** For n ≥ 20, 20 ≤ n, so 5n + 20 ≤ 5n + n = 6n. Many other pairs work too (c = 25, n₀ = 1, since 5n + 20 ≤ 5n + 20n for n ≥ 1).

</details>

### P6. Which statement is correct?

**Difficulty:** Hard · **Pattern:** Bounds vs cases

- A) The best case must be expressed with Ω and the worst case with O.
- B) Insertion sort's worst case is Ω(n²).
- C) If an algorithm is O(n²) in the worst case, it cannot be O(n) in the best case.
- D) Θ notation can only describe the average case.

<details>
<summary>Hint</summary>

Bounds (O, Ω, Θ) and cases (best/average/worst) are independent.

</details>

<details>
<summary>Answer</summary>

**Answer:** B) Insertion sort's worst case is Ω(n²).

**Explanation:** On reverse-sorted input insertion sort makes n(n − 1)/2 comparisons, so its worst case is Θ(n²), hence also Ω(n²). A and D confuse bounds with cases; C is false — insertion sort itself is O(n²) worst and Θ(n) best.

</details>
