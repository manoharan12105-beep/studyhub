# Paging — Practice

### P1. Same size

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** pages and frames

In paging, the size of a page is:

- A) Larger than a frame
- B) Smaller than a frame
- C) Equal to the size of a frame
- D) Variable per process

<details>
<summary>Answer</summary>

**Answer:** C) Equal to the size of a frame

</details>

### P2. What paging removes

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** fragmentation

Paging eliminates:

- A) Internal fragmentation
- B) External fragmentation
- C) Page faults
- D) The need for an MMU

<details>
<summary>Answer</summary>

**Answer:** B) External fragmentation

</details>

### P3. Translate two addresses

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** address translation

Page size 512 bytes. Page table: page 0 → frame 3, page 1 → frame 6, page 2 → frame 0, page 3 → frame 9. Translate logical addresses 600 and 1300.

<details>
<summary>Answer</summary>

- 600: p = 1, d = 600 − 512 = 88 → frame 6 → 6 × 512 + 88 = **3160**.
- 1300: p = 2, d = 1300 − 1024 = 276 → frame 0 → 0 × 512 + 276 = **276**.

</details>

### P4. Count the bits

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** address bits

A process's logical address space is 64 KB, the page size is 2 KB and physical memory is 32 KB. How many bits are in the logical address, the page number, the offset and the physical address? How many pages and frames are there?

<details>
<summary>Answer</summary>

Logical: 64 KB = 2¹⁶ → **16 bits**. Offset: 2 KB = 2¹¹ → **11 bits**. Page number: 16 − 11 = **5 bits** → **32 pages**. Physical: 32 KB = 2¹⁵ → **15 bits**; frame number 15 − 11 = 4 bits → **16 frames**.

</details>

### P5. Hexadecimal translation

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** bit splitting

16-bit logical addresses, 4 KB pages. Logical address `0x2A3C`; page 2 is in frame 5. What is the physical address in hexadecimal?

<details>
<summary>Answer</summary>

4 KB = 2¹² → the low 12 bits (3 hex digits) are the offset. `0x2A3C` → page `0x2`, offset `0xA3C`. Frame 5 → physical **`0x5A3C`** — just replace the page digit with the frame digit.

</details>

### P6. Effective access time

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** TLB, EAT

Memory access takes 100 ns and a TLB lookup 20 ns. Compute the EAT for hit ratios of 80 % and 98 %.

<details>
<summary>Answer</summary>

Hit = 120 ns; miss = 220 ns.
80 %: 0.8 × 120 + 0.2 × 220 = 96 + 44 = **140 ns**.
98 %: 0.98 × 120 + 0.02 × 220 = 117.6 + 4.4 = **122 ns**.

</details>

### P7. Page-table size

**Difficulty:** Hard · **Type:** Calculation · **Concepts:** page-table size, multi-level paging

A system has 36-bit logical addresses, 8 KB pages and 4-byte page-table entries. How large is a single-level page table? A process uses only 64 MB of its address space — roughly how many entries does it actually need?

<details>
<summary>Answer</summary>

8 KB = 2¹³ → page number = 36 − 13 = 23 bits → 2²³ entries × 4 B = 2²⁵ B = **32 MB** per process. 64 MB ÷ 8 KB = 2²⁶ ÷ 2¹³ = 2¹³ = **8,192 entries** (32 KB of entries) are actually used — the motivation for multi-level page tables.

</details>
