# Banker's Algorithm — Practice

## Set 1: One System, Four Processes

All problems in this file use the same system. Three resource types A, B, C with totals A = 5, B = 4, C = 3.

| Process | Allocation (A B C) | Max (A B C) |
|---------|--------------------|-------------|
| P0 | 0 1 1 | 2 2 3 |
| P1 | 1 0 0 | 2 1 1 |
| P2 | 1 1 0 | 3 2 2 |
| P3 | 2 0 1 | 3 2 2 |

### P1. Need formula

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** Need matrix

In the Banker's algorithm, Need is computed as:

- A) Max + Allocation
- B) Max − Allocation
- C) Available − Allocation
- D) Allocation − Max

<details>
<summary>Answer</summary>

**Answer:** B) Max − Allocation

</details>

### P2. Available and Need

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** Available, Need

Compute the Available vector and the Need matrix.

<details>
<summary>Answer</summary>

Allocated totals = (0+1+1+2, 1+0+1+0, 1+0+0+1) = (4, 2, 2). **Available = (5, 4, 3) − (4, 2, 2) = (1, 2, 1).**

Need: P0 (2, 1, 2), P1 (1, 1, 1), P2 (2, 1, 2), P3 (1, 2, 1).

</details>

### P3. Safety check

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** safety algorithm

Is the system in a safe state? Show the Work vector after each process finishes.

<details>
<summary>Answer</summary>

Work = (1, 2, 1).
- P0 (2,1,2): A 2 > 1 → no.
- P1 (1,1,1) ≤ (1,2,1) → yes; Work = (1,2,1) + (1,0,0) = **(2, 2, 1)**.
- P2 (2,1,2): C 2 > 1 → no.
- P3 (1,2,1) ≤ (2,2,1) → yes; Work = + (2,0,1) = **(4, 2, 2)**.
- P0 (2,1,2) ≤ (4,2,2) → yes; Work = + (0,1,1) = **(4, 3, 3)**.
- P2 (2,1,2) ≤ (4,3,3) → yes; Work = + (1,1,0) = **(5, 4, 3)**.

**Safe**, sequence **⟨P1, P3, P0, P2⟩**; final Work equals the totals.

</details>

### P4. Grant P1's request?

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** resource-request algorithm

From the original state, P1 requests (1, 0, 1). Can it be granted immediately?

<details>
<summary>Answer</summary>

(1,0,1) ≤ Need (1,1,1) ✓ and ≤ Available (1,2,1) ✓. Pretend: Available (0, 2, 0), P1 Allocation (2, 0, 1), Need (0, 1, 0).
Safety: P0 no; P1 (0,1,0) ≤ (0,2,0) → Work (2, 2, 1); P2 no; P3 (1,2,1) → Work (4, 2, 2); P0 → (4, 3, 3); P2 → (5, 4, 3). **Safe → grant** (sequence ⟨P1, P3, P0, P2⟩).

</details>

### P5. Grant P0's request?

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** unsafe request

From the original state, P0 requests (1, 0, 0). Can it be granted immediately?

<details>
<summary>Answer</summary>

(1,0,0) ≤ Need (2,1,2) ✓ and ≤ Available (1,2,1) ✓. Pretend: Available (0, 2, 1); P0 Need (1, 1, 2). Every process now needs at least one A, and no A is free: P0 (1,1,2), P1 (1,1,1), P2 (2,1,2), P3 (1,2,1). **Unsafe → P0 must wait**, even though one A is free.

</details>

### P6. Three requests, three outcomes

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** request checks

From the original state, decide each request independently: (a) P2 requests (2, 0, 0); (b) P3 requests (0, 3, 0); (c) P3 requests (0, 1, 1).

<details>
<summary>Answer</summary>

(a) Request ≤ Need (2,1,2) ✓, but A = 2 > Available A = 1 → **P2 waits** (resources not available).
(b) B = 3 > Need B = 2 → **error**: P3 exceeds its declared maximum.
(c) ≤ Need (1,2,1) ✓, ≤ Available (1,2,1) ✓. Pretend: Available (1, 1, 0), P3 Allocation (2, 1, 2), Need (1, 1, 0). Safety: P0 no; P1 (1,1,1) no (C); P2 no; P3 (1,1,0) ≤ (1,1,0) → Work (3, 2, 2); P0 → (3, 3, 3); P1 → (4, 3, 3); P2 → (5, 4, 3). **Safe → grant.**

</details>

### P7. Several sequences

**Difficulty:** Hard · **Type:** Conceptual · **Concepts:** safe sequences

Is ⟨P3, P1, P0, P2⟩ also a safe sequence for the original state? What does this tell you about checking a student's answer?

<details>
<summary>Answer</summary>

Work (1,2,1): P3 needs (1,2,1) ≤ (1,2,1) → Work (3, 2, 2); P1 (1,1,1) → (4, 2, 2); P0 (2,1,2) → (4, 3, 3); P2 (2,1,2) → (5, 4, 3). **Yes, it is safe.** A state can have many safe sequences; an answer is correct if every step of *its* sequence satisfies Need ≤ Work, even if it differs from the textbook's.

</details>
