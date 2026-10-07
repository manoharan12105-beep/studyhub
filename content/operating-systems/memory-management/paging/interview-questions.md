# Paging — Interview Questions

## Beginner

### Q1. What is paging?

**Style:** Direct

<details>
<summary>Answer</summary>

A memory-management scheme that divides a process's logical memory into fixed-size pages and physical memory into frames of the same size. Pages are loaded into any free frames, and a per-process page table maps page numbers to frame numbers. It allows non-contiguous allocation and eliminates external fragmentation.

</details>

### Q2. What is the difference between a page and a frame?

**Style:** Comparison

<details>
<summary>Answer</summary>

A page is a fixed-size block of a process's **logical** address space; a frame is a block of **physical** memory of the same size. The page table says which frame currently holds each page. The number of pages depends on the process's address space; the number of frames on the size of RAM.

</details>

### Q3. What is a page table?

**Style:** Direct

<details>
<summary>Answer</summary>

A per-process data structure, maintained by the OS and used by the MMU, that maps each page number to the frame holding it. Each entry also has control bits: valid/invalid, protection (read/write/execute), dirty (modified) and referenced. The page-table base register points to the current process's table and is switched on every context switch.

</details>

## Intermediate

### Q4. How is a logical address translated to a physical address under paging?

**Style:** How

<details>
<summary>Answer</summary>

Split the logical address into a page number p (high bits) and an offset d (low bits): p = address ÷ page size, d = address mod page size. Look up the frame f = page_table[p] (trap if the entry is invalid). Physical address = f × page size + d. The offset is unchanged because pages and frames are the same size.

</details>

### Q5. Page size 1 KB; page 2 is in frame 7. What is the physical address of logical address 3000?

**Style:** Calculation

<details>
<summary>Answer</summary>

p = 3000 ÷ 1024 = 2, d = 3000 − 2048 = 952. Physical = 7 × 1024 + 952 = **8120**.

</details>

### Q6. What is a TLB, and why is it needed?

**Style:** Why

<details>
<summary>Answer</summary>

Without it, every memory access needs two memory accesses: one to read the page-table entry and one for the data. The translation look-aside buffer is a small, fast associative cache in the MMU holding recent page-to-frame translations. On a hit the frame is found almost instantly; on a miss the page table is read and the translation cached. Because programs have locality, hit ratios are typically very high.

</details>

### Q7. TLB lookup 10 ns, memory access 80 ns, TLB hit ratio 90 %. What is the effective access time?

**Style:** Calculation

<details>
<summary>Answer</summary>

Hit: 10 + 80 = 90 ns. Miss: 10 + 80 (page table) + 80 (data) = 170 ns.
EAT = 0.9 × 90 + 0.1 × 170 = 81 + 17 = **98 ns**.

</details>

### Q8. Does paging suffer from fragmentation?

**Style:** Trap

<details>
<summary>Answer</summary>

It has no **external** fragmentation, because any free frame can hold any page. It does have **internal** fragmentation: a process's last page is usually only partly used — on average half a page per process. A 10,000-byte process with 4096-byte pages needs 3 pages (12,288 bytes) and wastes 2,288 bytes.

</details>

## Advanced

### Q9. With 32-bit logical addresses, 4 KB pages and 4-byte page-table entries, how big is a single-level page table? How do OSes avoid this cost?

**Style:** Calculation

<details>
<summary>Answer</summary>

Offset = 12 bits, page number = 20 bits → 2²⁰ entries × 4 bytes = **4 MB per process**, even if the process uses only a little memory. OSes use **multi-level paging**: the page table is itself paged, and only the second-level tables for regions actually in use are allocated (x86-64 uses four or five levels). Hashed and inverted page tables are alternatives.

</details>

### Q10. What are the trade-offs of a larger page size?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Larger pages mean fewer page-table entries, a smaller page table, more memory covered by each TLB entry (fewer TLB misses) and more efficient disk transfers. But they increase internal fragmentation and may load data that is never used. That is why systems use 4 KB by default and offer huge pages (2 MB, 1 GB on x86-64) for workloads such as databases with large, densely used memory.

</details>
