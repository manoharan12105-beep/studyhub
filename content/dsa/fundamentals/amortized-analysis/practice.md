# Amortized Analysis — Practice

### P1. Why is appending to an `ArrayList` described as O(1) amortized rather than O(1) worst case?

**Difficulty:** Easy · **Pattern:** Dynamic array

- A) Because the hash function is usually good
- B) Because an occasional append triggers an O(n) resize, but resizes are rare enough that n appends cost O(n) in total
- C) Because the input is assumed to be random
- D) Because Java caches small integers

<details>
<summary>Hint</summary>

What happens when the internal array is full?

</details>

<details>
<summary>Answer</summary>

**Answer:** B) An occasional append triggers an O(n) resize, but resizes are rare enough that n appends cost O(n) in total

**Explanation:** Resizing copies all elements (O(n)) but happens only when capacity is exhausted, and capacity grows by a constant factor, so total copying over n appends is O(n). No randomness is assumed (C), and hashing (A) is unrelated.

</details>

### P2. A dynamic array grows by adding 100 slots each time it is full. What is the total cost of n appends?

**Difficulty:** Medium · **Pattern:** Growth strategy

- A) O(n)
- B) O(n log n)
- C) O(n²)
- D) O(n × 100)

<details>
<summary>Hint</summary>

Resizes happen at sizes 100, 200, 300, … Sum the copies.

</details>

<details>
<summary>Answer</summary>

**Answer:** C) O(n²)

**Explanation:** There are n/100 resizes, copying 100, 200, …, n elements: about 100 × (1 + 2 + … + n/100) ≈ n²/200 → O(n²), i.e. O(n) amortized per append. Only multiplicative growth gives O(1) amortized.

</details>

### P3. In a two-stack queue, `poll` sometimes moves every element from one stack to the other. What is the amortized cost of `poll` over any sequence of n `offer` and `poll` operations?

**Difficulty:** Medium · **Pattern:** Each element moves once

- A) O(1)
- B) O(log n)
- C) O(n)
- D) O(n²)

<details>
<summary>Hint</summary>

Follow one element: how many times can it be pushed or popped in total?

</details>

<details>
<summary>Answer</summary>

**Answer:** A) O(1)

**Explanation:** Each element is pushed onto the inbox once, moved to the outbox once, and popped from the outbox once — at most 4 stack operations over its lifetime. Total work for n operations is O(n), so O(1) amortized each, even though one `poll` can be O(n).

</details>

### P4. This code finds, for each element, the next greater element to its right. Prove its total time is O(n).

**Difficulty:** Hard · **Pattern:** Monotonic stack amortization

```java
static int[] nextGreater(int[] arr) {
    int[] result = new int[arr.length];
    java.util.Arrays.fill(result, -1);
    java.util.Deque<Integer> stack = new java.util.ArrayDeque<>();   // indices
    for (int i = 0; i < arr.length; i++) {
        while (!stack.isEmpty() && arr[stack.peek()] < arr[i]) {
            result[stack.pop()] = arr[i];
        }
        stack.push(i);
    }
    return result;
}
```

<details>
<summary>Hint</summary>

Count pushes and pops over the whole run instead of per iteration.

</details>

<details>
<summary>Answer</summary>

**Answer:** Every index is pushed exactly once (n pushes). An index can be popped at most once after being pushed, so there are at most n pops across *all* iterations of the outer loop. The `while` condition is checked at most n (pops) + n (one failing check per outer iteration) times. Total O(n), even though a single iteration may pop many indices. See [Monotonic Stack](../../patterns/monotonic-stack/content.md).

</details>

### P5. `HashMap.put` is "O(1) average and amortized". Explain what each word covers.

**Difficulty:** Hard · **Pattern:** Average vs amortized

<details>
<summary>Hint</summary>

There are two different sources of expensive operations.

</details>

<details>
<summary>Answer</summary>

**Answer:**

- **Average** covers **collisions**: a `put` scans its bucket, and bucket length is O(1) only if the hash function spreads keys evenly. Adversarial or poor hashes can make one bucket long (O(n), or O(log n) once Java 8+ converts a long bucket to a tree).
- **Amortized** covers **resizing**: when size exceeds capacity × 0.75, the table doubles and every entry is redistributed (O(n)). Doubling makes this O(1) per `put` over a sequence.

The first is a probabilistic assumption about keys; the second is a guarantee about sequences.

</details>
