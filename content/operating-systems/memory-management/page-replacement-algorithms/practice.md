# Page Replacement: FIFO, LRU and Optimal — Practice

### P1. Minimum faults

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** Optimal

Which algorithm gives the minimum possible number of page faults?

- A) FIFO
- B) LRU
- C) Optimal
- D) Second chance

<details>
<summary>Answer</summary>

**Answer:** C) Optimal

</details>

### P2. Belady's anomaly

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** Belady's anomaly

Belady's anomaly can occur with:

- A) LRU
- B) Optimal
- C) FIFO
- D) All of them

<details>
<summary>Answer</summary>

**Answer:** C) FIFO

</details>

### P3. Short string

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** FIFO, LRU

Reference string `1 2 3 1 4 2`, 3 frames, initially empty. Count the faults under FIFO and LRU.

<details>
<summary>Answer</summary>

**FIFO — 4 faults:** 1 F, 2 F, 3 F, 1 H, 4 F (evict 1, loaded first), 2 H.
**LRU — 5 faults:** 1 F, 2 F, 3 F, 1 H (1 becomes most recent), 4 F (evict 2, used longest ago), 2 F (evict 3).

On this string FIFO wins, because the hit on 1 saved page 1 under LRU at the expense of page 2.

</details>

### P4. Three algorithms

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** FIFO, LRU, Optimal

Reference string `5 0 1 0 2 0 3 5 2 3`, 3 frames. Count the faults for FIFO, LRU and Optimal.

<details>
<summary>Answer</summary>

- **FIFO: 6.** 5 F, 0 F, 1 F, 0 H, 2 F (evict 5), 0 H, 3 F (evict 0), 5 F (evict 1), 2 H, 3 H.
- **LRU: 7.** 5 F, 0 F, 1 F, 0 H, 2 F (evict 5), 0 H, 3 F (evict 1), 5 F (evict 2), 2 F (evict 0), 3 H.
- **Optimal: 5.** 5 F, 0 F, 1 F, 0 H, 2 F (evict 1, never used again), 0 H, 3 F (evict 0, never used again), 5 H, 2 H, 3 H.

</details>

### P5. FIFO beats LRU

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** FIFO vs LRU

Reference string `1 2 3 2 4 1 3 2 4 1`, 3 frames. Count faults under FIFO, LRU and Optimal.

<details>
<summary>Answer</summary>

- **FIFO: 6.** Faults at 1, 2, 3, 4 (evict 1), 1 (evict 2), 2 (evict 3); hits at 2, 3, 4, 1.
- **LRU: 9.** Only the second reference (2) hits; at 4 evict 1, at 1 evict 3, at 3 evict 2, at 2 evict 4, at 4 evict 1, at 1 evict 3.
- **Optimal: 5.** At 4 evict 2 (next used latest); 1 and 3 hit; at 2 evict 3 (never used again); 4 and 1 hit.

</details>

### P6. Four frames

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** FIFO, LRU, Optimal with 4 frames

Reference string `0 1 2 3 0 1 4 0 1 2 3 4`, 4 frames. Count faults for each algorithm.

<details>
<summary>Answer</summary>

- **FIFO: 10.** Hits only at the second 0 and 1; from 4 onward every reference faults (victims 0, 1, 2, 3, 4, 0).
- **LRU: 8.** At 4 evict 2; 0 and 1 hit; at 2 evict 3, at 3 evict 4, at 4 evict 0.
- **Optimal: 6.** At 4 evict 3 (next used latest); 0, 1, 2 hit; at 3 evict 0 (never used again); 4 hits.

</details>

### P7. Demonstrate the anomaly

**Difficulty:** Hard · **Type:** Calculation · **Concepts:** Belady's anomaly

Reference string `0 1 2 3 0 1 4 0 1 2 3 4`. Count FIFO faults with 3 frames and compare with the 4-frame result from P6. What do you conclude?

<details>
<summary>Answer</summary>

3 frames: 0 F, 1 F, 2 F, 3 F (evict 0), 0 F (evict 1), 1 F (evict 2), 4 F (evict 3), 0 H, 1 H, 2 F (evict 0), 3 F (evict 1), 4 H → **9 faults**. With 4 frames FIFO had **10**. More frames, more faults: **Belady's anomaly** (this is the classic 1 2 3 4 1 2 5 … string with relabelled pages).

</details>
