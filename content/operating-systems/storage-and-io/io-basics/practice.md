# I/O Basics — Practice

### P1. Bulk transfer

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** DMA

Which technique moves a whole block of data between a disk and memory without the CPU copying each byte?

- A) Polling
- B) Interrupt-driven I/O
- C) DMA
- D) Spooling

<details>
<summary>Answer</summary>

**Answer:** C) DMA

</details>

### P2. Printer queue

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** spooling

Several users print at once, and their jobs are stored on disk and printed one after another. This is:

- A) Caching
- B) Spooling
- C) Buffering
- D) Paging

<details>
<summary>Answer</summary>

**Answer:** B) Spooling

</details>

### P3. Count the interrupts

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** interrupts vs DMA

A 2 MB file is read. With interrupt-driven I/O the device interrupts once per 4-byte word; with DMA it interrupts once per 4 KB block. How many interrupts does each approach generate? (1 MB = 2²⁰ bytes.)

<details>
<summary>Answer</summary>

2 MB = 2²¹ bytes. Per word: 2²¹ ÷ 4 = 2¹⁹ = **524,288 interrupts**. DMA: 2²¹ ÷ 2¹² = 2⁹ = **512 interrupts** — 1,024 times fewer.

</details>

### P4. Which I/O model?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** blocking, non-blocking, asynchronous

Match each to blocking, non-blocking or asynchronous I/O: (a) `read()` on a socket waits until data arrives; (b) `read()` on a non-blocking socket returns "no data yet" immediately; (c) the program submits a file read and later receives a completion event with the data.

<details>
<summary>Answer</summary>

(a) **Blocking.** (b) **Non-blocking.** (c) **Asynchronous.**

</details>
