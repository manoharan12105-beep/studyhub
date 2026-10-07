# Virtual Memory — Interview Questions

## Beginner

### Q1. What is virtual memory?

**Style:** Direct

<details>
<summary>Answer</summary>

A memory-management technique that gives each process its own large virtual address space, independent of the size of physical RAM. Only the pages a process is currently using are kept in RAM; the rest are on disk and are loaded on demand. Address translation by the MMU and page tables makes this transparent to the program.

</details>

### Q2. What are the advantages of virtual memory?

**Style:** Direct

<details>
<summary>Answer</summary>

Programs can be larger than physical memory; more processes fit in memory, raising CPU utilisation; less I/O is needed to load or swap programs; each process is isolated in its own address space; libraries and memory can be shared efficiently; and process creation is cheaper through copy-on-write.

</details>

### Q3. What is demand paging?

**Style:** Direct

<details>
<summary>Answer</summary>

Loading a page into memory only when it is first accessed, instead of loading the whole program at start. Page-table entries have a valid–invalid bit; touching an invalid (non-resident) page causes a page fault, the OS loads the page from disk and restarts the instruction. Pure demand paging starts a process with no pages in memory at all.

</details>

## Intermediate

### Q4. Why does virtual memory work in practice, given that disk is so slow?

**Style:** Why

<details>
<summary>Answer</summary>

Because of **locality of reference**: in any short period a program accesses a small set of pages — the current functions and data. Once that working set is in memory, almost all accesses hit RAM, and page faults are rare. If the working sets of all processes do not fit in RAM, faults become frequent and performance collapses (thrashing).

</details>

### Q5. What is the difference between virtual memory and physical memory?

**Style:** Comparison

<details>
<summary>Answer</summary>

Virtual memory is the address space each process sees — private, possibly larger than RAM, backed by RAM plus disk. Physical memory is the actual RAM installed, shared by all processes and divided into frames. The MMU maps virtual addresses to physical addresses; parts of virtual memory may not be in physical memory at a given moment.

</details>

### Q6. What is copy-on-write?

**Style:** Direct

<details>
<summary>Answer</summary>

An optimisation in which, after `fork()`, parent and child share the same physical pages, marked read-only. Only when one of them writes to a page does the OS copy that page, giving the writer its own copy. Since a child often calls `exec()` right away, most pages are never copied, making `fork()` fast and memory-efficient.

</details>

## Advanced

### Q7. Is virtual memory the same as swap space?

**Style:** Trap

<details>
<summary>Answer</summary>

No. Swap space is one backing store on disk, used for anonymous pages (heap, stack) evicted from RAM. Virtual memory is the whole abstraction — virtual address spaces, page tables, demand paging, protection. Code and memory-mapped file pages are backed by their files, not swap, and a system with no swap configured still uses virtual memory.

</details>

### Q8. A 64-bit process reports 20 GB of virtual memory on a machine with 8 GB of RAM. Is something wrong?

**Style:** Scenario

<details>
<summary>Answer</summary>

Not necessarily. Virtual size counts every reserved range — mapped libraries, reserved heap regions (a JVM reserves its maximum heap up front), thread stacks, memory-mapped files — most of which may never be touched and so never occupy RAM. What matters for memory pressure is the **resident set size** (pages actually in RAM) and the system's page-fault and swap activity.

</details>
