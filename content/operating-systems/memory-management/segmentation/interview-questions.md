# Segmentation — Interview Questions

## Beginner

### Q1. What is segmentation?

**Style:** Direct

<details>
<summary>Answer</summary>

A memory-management scheme that divides a process's address space into variable-size logical segments — code, data, stack, heap and so on. A logical address is ⟨segment number, offset⟩, and a per-process segment table stores each segment's base address and limit (length).

</details>

### Q2. What is the difference between paging and segmentation?

**Style:** Comparison

<details>
<summary>Answer</summary>

Paging splits memory into fixed-size pages invisible to the programmer; segmentation splits it into variable-size segments that match the program's logical structure. Paging suffers internal fragmentation, segmentation external fragmentation. Paging's table maps page → frame; segmentation's maps segment → base and limit. Segmentation makes protection and sharing per logical unit natural; paging makes allocation simple.

</details>

## Intermediate

### Q3. How is a logical address translated in segmentation?

**Style:** How

<details>
<summary>Answer</summary>

Take segment number s and offset d. If s is beyond the segment-table length, trap. Read base and limit from the segment table. If d ≥ limit, trap (segmentation fault). Otherwise, physical address = base + d.

</details>

### Q4. Segment 2 has base 3500 and limit 800; segment 1 has base 5000 and limit 300. Translate ⟨2, 450⟩ and ⟨1, 320⟩.

**Style:** Calculation

<details>
<summary>Answer</summary>

⟨2, 450⟩: 450 < 800 → 3500 + 450 = **3950**. ⟨1, 320⟩: 320 ≥ 300 → **trap** (addressing error), no physical address.

</details>

### Q5. Why does segmentation cause external fragmentation but not internal fragmentation?

**Style:** Why

<details>
<summary>Answer</summary>

Each segment is allocated exactly as many bytes as it needs, so nothing is wasted inside it — no internal fragmentation. But segments have different sizes, so as they are allocated and freed, physical memory becomes a patchwork of variable-size holes, some too small for any new segment — external fragmentation.

</details>

### Q6. Why are protection and sharing easier with segmentation?

**Style:** Why

<details>
<summary>Answer</summary>

Segments correspond to meaningful units, so one set of protection bits applies to a whole unit: the code segment read-and-execute, the data segment read-and-write. Sharing a library means pointing two segment-table entries to the same base. With paging, a logical unit spans many pages (and a page may contain parts of two units), so protection must be set page by page.

</details>

## Advanced

### Q7. What is segmentation with paging, and why combine them?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Each segment is divided into pages, and the segment-table entry points to that segment's page table instead of a contiguous base. The program keeps the logical view and per-segment protection of segmentation, while physical allocation uses fixed-size frames, removing external fragmentation. IA-32 (32-bit x86) worked this way; x86-64 in 64-bit mode uses a flat model where paging does the real work.

</details>

### Q8. Why do we still get "segmentation faults" on systems that hardly use segmentation?

**Style:** Trap

<details>
<summary>Answer</summary>

The name is historical. On modern Linux on x86-64, a "segmentation fault" (SIGSEGV) is raised when a process accesses an address that is not mapped in its page tables, or violates a page's protection (writing to read-only memory, executing non-executable memory). The term survives from systems where segment-limit checks caught such errors.

</details>
