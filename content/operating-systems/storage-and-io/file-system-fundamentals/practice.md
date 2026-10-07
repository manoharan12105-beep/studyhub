# File System Fundamentals — Practice

### P1. External fragmentation

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** allocation methods

Which allocation method suffers from external fragmentation?

- A) Linked
- B) Indexed
- C) Contiguous
- D) FAT

<details>
<summary>Answer</summary>

**Answer:** C) Contiguous

</details>

### P2. Not in the inode

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** inode

Which of these is **not** stored in a UNIX inode?

- A) File size
- B) Owner and permissions
- C) File name
- D) Pointers to data blocks

<details>
<summary>Answer</summary>

**Answer:** C) File name

The name is in the directory entry.

</details>

### P3. Bitmap size

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** free-space bitmap

A 512 GB disk uses 4 KB blocks. How large is the free-space bitmap?

<details>
<summary>Answer</summary>

Blocks = 2³⁹ ÷ 2¹² = 2²⁷. One bit each → 2²⁷ bits = 2²⁴ bytes = **16 MB**.

</details>

### P4. Choose the method

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** allocation trade-offs

For each, which allocation method fits best? (a) A read-only DVD image written once and read sequentially; (b) a log file that keeps growing; (c) a database file read at random positions.

<details>
<summary>Answer</summary>

(a) **Contiguous** — size is known, never grows, sequential reads are fastest. (b) **Linked** or **indexed** — blocks can be added anywhere without moving the file. (c) **Indexed** (or contiguous extents) — any block can be reached directly; linked would follow long chains.

</details>
