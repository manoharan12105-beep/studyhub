# Time Complexity — Practice

### P1. What is the time complexity of this code?

**Difficulty:** Easy · **Pattern:** Single loop

```java
for (int i = 0; i < n; i += 3) {
    count++;
}
```

- A) O(1)
- B) O(log n)
- C) O(n)
- D) O(n/3) — and this is different from O(n)

<details>
<summary>Hint</summary>

How many iterations run, and does a constant divisor matter?

</details>

<details>
<summary>Answer</summary>

**Answer:** C) O(n)

**Explanation:** The loop runs about n/3 times. The factor 1/3 is a constant and is dropped, so it is O(n). D is wrong because O(n/3) and O(n) are the same class.

</details>

### P2. What is the time complexity?

**Difficulty:** Easy · **Pattern:** Doubling loop

```java
for (int i = 1; i <= n; i *= 2) {
    count++;
}
```

- A) O(n)
- B) O(log n)
- C) O(√n)
- D) O(n log n)

<details>
<summary>Hint</summary>

Write down the values of i: 1, 2, 4, 8, …

</details>

<details>
<summary>Answer</summary>

**Answer:** B) O(log n)

**Explanation:** After k iterations i = 2ᵏ. The loop stops once 2ᵏ > n, so it runs ⌊log₂ n⌋ + 1 times.

</details>

### P3. What is the time complexity?

**Difficulty:** Easy · **Pattern:** Sequential blocks

```java
for (int i = 0; i < n; i++) {
    a++;
}
for (int i = 0; i < m; i++) {
    for (int j = 0; j < m; j++) {
        b++;
    }
}
```

- A) O(n²)
- B) O(n × m)
- C) O(n + m²)
- D) O(m²)

<details>
<summary>Hint</summary>

The blocks are independent and run one after the other. n and m are different inputs.

</details>

<details>
<summary>Answer</summary>

**Answer:** C) O(n + m²)

**Explanation:** Sequential blocks add. You cannot drop either term because n and m are independent — if n is much larger than m², the first loop dominates.

</details>

### P4. What is the time complexity?

**Difficulty:** Medium · **Pattern:** Triangular nested loop

```java
for (int i = 0; i < n; i++) {
    for (int j = 0; j < i; j++) {
        count++;
    }
}
```

- A) O(n)
- B) O(n log n)
- C) O(n²)
- D) O(n²/2), which is better than O(n²)

<details>
<summary>Hint</summary>

Add up how many times the inner loop runs for i = 0, 1, …, n − 1.

</details>

<details>
<summary>Answer</summary>

**Answer:** C) O(n²)

**Explanation:** 0 + 1 + … + (n − 1) = n(n − 1)/2. The ½ is a constant, so it is still O(n²).

</details>

### P5. What is the time complexity?

**Difficulty:** Medium · **Pattern:** Inner loop that depends on outer doubling

```java
for (int i = 1; i <= n; i *= 2) {
    for (int j = 0; j < i; j++) {
        count++;
    }
}
```

- A) O(log n)
- B) O(n)
- C) O(n log n)
- D) O(n²)

<details>
<summary>Hint</summary>

The inner loop runs 1, 2, 4, 8, … times. Sum the geometric series.

</details>

<details>
<summary>Answer</summary>

**Answer:** B) O(n)

**Explanation:** Total = 1 + 2 + 4 + … + 2ᵏ where 2ᵏ ≤ n. A geometric series with ratio 2 sums to less than twice its last term, so the total is < 2n → O(n). Multiplying "log n outer × n inner" would overestimate it.

</details>

### P6. What is the time complexity?

**Difficulty:** Medium · **Pattern:** Hidden library cost

```java
String result = "";
for (int i = 0; i < n; i++) {
    result += "a";
}
```

- A) O(n)
- B) O(n log n)
- C) O(n²)
- D) O(1)

<details>
<summary>Hint</summary>

Java strings are immutable. What does `+=` create each time?

</details>

<details>
<summary>Answer</summary>

**Answer:** C) O(n²)

**Explanation:** Each `+=` builds a new string and copies the current contents: 1 + 2 + … + n characters copied ≈ n²/2. Use `StringBuilder`, whose `append` is amortized O(1), to make it O(n). (Modern compilers optimise a single `a + b + c` expression, but not repeated `+=` across loop iterations.)

</details>

### P7. A while loop inside a for loop — what is the total complexity?

**Difficulty:** Hard · **Pattern:** Amortized pointer movement

```java
int j = 0;
for (int i = 0; i < n; i++) {
    while (j < n && arr[j] < arr[i] + k) {
        j++;
    }
    count += j - i;
}
```

- A) O(n²)
- B) O(n log n)
- C) O(n)
- D) O(n × k)

<details>
<summary>Hint</summary>

How many times can `j++` execute over the whole program, not per outer iteration?

</details>

<details>
<summary>Answer</summary>

**Answer:** C) O(n)

**Explanation:** `j` is never reset; it only moves forward from 0 to at most n. So the `while` body runs at most n times *in total*. The outer loop runs n times. Total O(n + n) = O(n). This is the core reasoning behind [Two Pointers](../../patterns/two-pointers/content.md) and [Sliding Window](../../patterns/sliding-window/content.md).

</details>

### P8. Constraints say n ≤ 2 × 10⁵. Your idea is O(n²). Will it likely pass a 1-second limit, and what complexity should you aim for?

**Difficulty:** Hard · **Pattern:** Constraints to complexity

<details>
<summary>Hint</summary>

Square n and compare with roughly 10⁸ simple operations per second.

</details>

<details>
<summary>Answer</summary>

**Answer:** No. (2 × 10⁵)² = 4 × 10¹⁰ operations — about 400 times the ~10⁸ budget. Aim for O(n log n) (≈ 3.5 × 10⁶) or O(n).

**Explanation:** n around 10⁵–10⁶ is the usual signal for sorting, binary search, heaps, or a linear pattern such as hashing, two pointers or prefix sums.

</details>
