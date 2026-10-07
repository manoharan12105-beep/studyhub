# Disk Scheduling — Practice

### P1. Elevator algorithm

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** SCAN

Which algorithm is called the elevator algorithm?

- A) FCFS
- B) SSTF
- C) SCAN
- D) C-LOOK

<details>
<summary>Answer</summary>

**Answer:** C) SCAN

</details>

### P2. Starvation risk

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** SSTF

Which algorithm may starve requests for far-away cylinders?

- A) FCFS
- B) SSTF
- C) C-SCAN
- D) LOOK

<details>
<summary>Answer</summary>

**Answer:** B) SSTF

</details>

### P3. FCFS and SSTF

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** head movement

Cylinders 0–199, head at 35, queue 70, 10, 55, 90, 20. Compute total head movement for FCFS and SSTF.

<details>
<summary>Answer</summary>

**FCFS:** 35 → 70 → 10 → 55 → 90 → 20 = 35 + 60 + 45 + 35 + 70 = **245**.
**SSTF:** 35 → 20 → 10 → 55 → 70 → 90 = 15 + 10 + 45 + 15 + 20 = **105**.

</details>

### P4. LOOK and C-LOOK

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** LOOK, C-LOOK

Same queue and head (35), moving towards higher cylinders. Compute LOOK and C-LOOK totals (count C-LOOK's return jump).

<details>
<summary>Answer</summary>

**LOOK:** 35 → 55 → 70 → 90 → 20 → 10 = 20 + 15 + 20 + 70 + 10 = **135**.
**C-LOOK:** 35 → 55 → 70 → 90 → 10 → 20 = 20 + 15 + 20 + 80 + 10 = **145** (65 if the 80-cylinder return jump is not counted).

</details>

### P5. SCAN goes to the end

**Difficulty:** Hard · **Type:** Calculation · **Concepts:** SCAN vs LOOK

Same queue and head (35), moving up, cylinders 0–199. Compute SCAN and explain why it moves much more than LOOK here.

<details>
<summary>Answer</summary>

**SCAN:** 35 → 55 → 70 → 90 → 199 → 20 → 10 = 20 + 15 + 20 + 109 + 179 + 10 = **353**. SCAN travels from 90 to the disk end (199) and back although no request lies above 90 — 218 extra cylinders compared with LOOK (135).

</details>
