# Page Fault — Practice

### P1. When it occurs

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** page fault

A page fault occurs when:

- A) The TLB is full
- B) A process accesses a page that is not in physical memory
- C) A process divides by zero
- D) The CPU switches to kernel mode

<details>
<summary>Answer</summary>

**Answer:** B) A process accesses a page that is not in physical memory

</details>

### P2. State during service

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** page-fault handling

While the disk reads the missing page, the faulting process is:

- A) Running
- B) Ready
- C) Waiting (blocked)
- D) Terminated

<details>
<summary>Answer</summary>

**Answer:** C) Waiting (blocked)

The CPU runs other processes meanwhile.

</details>

### P3. Count the faults

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** demand paging, locality

Pages are 4 KB. Under pure demand paging, a program reads every byte of a 20 KB array once, from start to end, and has enough frames. How many page faults does the array cause? How many if it reads it twice?

<details>
<summary>Answer</summary>

20 KB ÷ 4 KB = **5 faults** (one per page). Reading it a second time causes **no** additional faults, since the pages are still resident — still **5** in total.

</details>

### P4. Order the steps

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** page-fault handling

Put in order: (a) restart the instruction, (b) trap to the OS, (c) read the page from disk into a frame, (d) update the page table, (e) check that the reference is valid, (f) find a free frame.

<details>
<summary>Answer</summary>

**b → e → f → c → d → a.**

</details>

### P5. Effective access time

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** EAT with page faults

Memory access 200 ns; page-fault service 5 ms; fault rate 1 in 10,000 accesses. What is the EAT?

<details>
<summary>Answer</summary>

p = 0.0001. EAT = 0.9999 × 200 + 0.0001 × 5,000,000 = 199.98 + 500 = **699.98 ns** — about 3.5 times slower than without faults.

</details>

### P6. Maximum fault rate

**Difficulty:** Hard · **Type:** Calculation · **Concepts:** acceptable fault rate

Memory access 200 ns; page-fault service 5 ms. What is the largest fault rate that keeps the EAT under 220 ns?

<details>
<summary>Answer</summary>

200 + p × (5,000,000 − 200) < 220 → p < 20 ÷ 4,999,800 ≈ **4 × 10⁻⁶** — fewer than about one fault per 250,000 accesses.

</details>
