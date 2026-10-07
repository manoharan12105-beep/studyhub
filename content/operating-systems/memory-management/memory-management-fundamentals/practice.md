# Memory Management Fundamentals — Practice

### P1. Who translates?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** MMU

Logical addresses are translated into physical addresses by:

- A) The compiler
- B) The Memory Management Unit
- C) The disk controller
- D) The shell

<details>
<summary>Answer</summary>

**Answer:** B) The Memory Management Unit

</details>

### P2. Fragmentation type

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** internal fragmentation

A process needs 9 KB and is given three 4 KB pages (12 KB). The 3 KB unused inside the last page is:

- A) External fragmentation
- B) Internal fragmentation
- C) Thrashing
- D) A page fault

<details>
<summary>Answer</summary>

**Answer:** B) Internal fragmentation

</details>

### P3. Base and limit

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** relocation, protection

Base = 25000, limit = 8000. Translate logical addresses 0, 7999 and 8000.

<details>
<summary>Answer</summary>

0 → **25000**. 7999 → **32999**. 8000 is not < 8000 → **trap** (addressing error).

</details>

### P4. Fit the processes

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** first, best, worst fit

Free holes in order: 200, 350, 120, 400 KB. Processes arrive: 180, 300, 100, 330 KB. Allocate with first fit, best fit and worst fit. Which strategy fails?

<details>
<summary>Answer</summary>

- **First fit:** 180 → 200 (20 left); 300 → 350 (50 left); 100 → 120 (20 left); 330 → 400 (70 left). All placed.
- **Best fit:** same choices here (each first fitting hole is also the smallest that fits) — all placed.
- **Worst fit:** 180 → 400 (220 left); 300 → 350 (50 left); 100 → 220 (120 left); 330 → largest hole is 200 → **must wait**.

Worst fit fails: it used up the only hole big enough for the 330 KB process.

</details>

### P5. Enough but not usable

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** external fragmentation, compaction

Memory has free holes of 60, 40, 80 and 50 KB scattered between processes. A 150 KB process arrives. Can it be loaded with contiguous allocation? Give two remedies.

<details>
<summary>Answer</summary>

Total free = 230 KB, but the largest hole is 80 KB, so **no** — external fragmentation. Remedies: **compaction** (slide processes together to form one 230 KB hole) or **paging** (load the process into non-contiguous frames).

</details>
