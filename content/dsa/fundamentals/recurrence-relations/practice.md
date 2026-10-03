# Recurrence Relations and the Master Theorem — Practice

### P1. Solve T(n) = T(n − 1) + 1, T(0) = 1.

**Difficulty:** Easy · **Pattern:** Unrolling

- A) O(1)
- B) O(log n)
- C) O(n)
- D) O(n²)

<details>
<summary>Hint</summary>

Each step removes 1 from n and adds 1 unit of work.

</details>

<details>
<summary>Answer</summary>

**Answer:** C) O(n)

**Explanation:** Unrolling gives T(n) = T(0) + n = n + 1.

</details>

### P2. Use the Master Theorem on T(n) = 4T(n/2) + n.

**Difficulty:** Easy · **Pattern:** Master Theorem case 1

- A) Θ(n)
- B) Θ(n log n)
- C) Θ(n²)
- D) Θ(n² log n)

<details>
<summary>Hint</summary>

Compute n^(log_b a) with a = 4, b = 2.

</details>

<details>
<summary>Answer</summary>

**Answer:** C) Θ(n²)

**Explanation:** n^(log₂ 4) = n². f(n) = n grows polynomially slower, so the leaves dominate: Θ(n²).

</details>

### P3. Write the recurrence and solve it for this method.

**Difficulty:** Medium · **Pattern:** Write the recurrence

```java
static int countDown(int[] arr, int lo, int hi) {
    if (lo >= hi) {
        return 0;
    }
    int mid = (lo + hi) / 2;
    int total = 0;
    for (int i = lo; i < hi; i++) {
        total += arr[i];
    }
    return total + countDown(arr, lo, mid) + countDown(arr, mid + 1, hi);
}
```

<details>
<summary>Hint</summary>

Two recursive calls on halves, plus a loop over the current range.

</details>

<details>
<summary>Answer</summary>

**Answer:** T(n) = 2T(n/2) + O(n) → **O(n log n)**.

**Explanation:** Master Theorem case 2 (a = 2, b = 2, n^(log₂ 2) = n = f(n)). Each recursion level sums ranges that together cover at most n elements, and there are about log₂ n levels.

</details>

### P4. Why can't the Master Theorem be applied to T(n) = 2T(n − 1) + 1? Solve it another way.

**Difficulty:** Medium · **Pattern:** Subtract-and-conquer

<details>
<summary>Hint</summary>

Look at the form required: aT(n/b) + f(n). Then unroll.

</details>

<details>
<summary>Answer</summary>

**Answer:** The subproblem is n − 1, not n/b, so the theorem does not apply.

Unrolling: T(n) = 2T(n − 1) + 1 = 4T(n − 2) + 2 + 1 = … = 2ⁿ T(0) + (2ⁿ − 1) → **O(2ⁿ)**. This is the Tower of Hanoi recurrence and the cost of generating all subsets.

</details>

### P5. Merge sort is implemented by copying each half into new arrays before recursing (`Arrays.copyOfRange`). Does this change the time complexity? What about space?

**Difficulty:** Hard · **Pattern:** Hidden work in recursion

<details>
<summary>Hint</summary>

The copy is O(n) per call — the same order as the merge.

</details>

<details>
<summary>Answer</summary>

**Answer:** Time stays O(n log n); space rises but stays O(n) at any moment.

**Explanation:** The recurrence becomes T(n) = 2T(n/2) + O(n) (copy) + O(n) (merge) = 2T(n/2) + O(n), still case 2. For space, copies along one root-to-leaf path are alive together: n/2 + n/4 + … < n, so peak auxiliary memory is O(n), although the total memory *allocated* over the whole run is O(n log n), which adds garbage-collection work.

</details>

### P6. Using the Master Theorem, which recurrence gives Θ(n²)?

**Difficulty:** Hard · **Pattern:** Master Theorem — all cases

- A) T(n) = 2T(n/2) + n
- B) T(n) = 2T(n/2) + n²
- C) T(n) = 8T(n/2) + n²
- D) T(n) = T(n/2) + n

<details>
<summary>Hint</summary>

Compute n^(log_b a) for each and compare it with f(n).

</details>

<details>
<summary>Answer</summary>

**Answer:** B) T(n) = 2T(n/2) + n²

**Explanation:**

- A: n^(log₂2) = n = f(n) → case 2 → Θ(n log n).
- B: n^(log₂2) = n, f = n² is polynomially larger → case 3 → Θ(n²).
- C: n^(log₂8) = n³, f = n² smaller → case 1 → Θ(n³).
- D: n^(log₂1) = 1, f = n larger → case 3 → Θ(n).

</details>
