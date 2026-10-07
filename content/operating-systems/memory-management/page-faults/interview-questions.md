# Page Fault — Interview Questions

## Beginner

### Q1. What is a page fault?

**Style:** Direct

<details>
<summary>Answer</summary>

An exception raised by the MMU when a process accesses a page of its address space that is not currently in physical memory (the page-table entry's valid bit is off). The OS handles it by loading the page from disk into a frame, updating the page table and restarting the instruction.

</details>

### Q2. What happens when a page fault occurs?

**Style:** What happens internally

<details>
<summary>Answer</summary>

1. The hardware traps to the OS.
2. The OS checks the address is legal; if not, the process is terminated.
3. It finds a free frame, or chooses a victim with page replacement (writing it to disk if dirty).
4. It schedules a disk read of the page; the process blocks while other processes run.
5. When the read completes, it updates the page table (frame number, valid bit).
6. The process becomes ready and, when scheduled, restarts the faulting instruction.

</details>

### Q3. Is a page fault an error?

**Style:** Trap

<details>
<summary>Answer</summary>

No. On a valid address it is a normal part of demand paging, handled transparently. It is an error only if the address is not part of the process (or violates protection), in which case the OS sends a segmentation-fault signal and usually terminates the process.

</details>

## Intermediate

### Q4. What is the difference between a page fault and a TLB miss?

**Style:** Comparison

<details>
<summary>Answer</summary>

A **TLB miss** means the translation is not in the TLB; the page is in memory, and the MMU (or OS) reads the page table, caches the translation and continues — nanoseconds. A **page fault** means the page itself is not in memory; the OS must fetch it from disk — microseconds to milliseconds. Every page fault starts with a TLB miss, but most TLB misses are not page faults.

</details>

### Q5. Memory access takes 100 ns and servicing a page fault takes 8 ms. If one access in 1,000 faults, what is the effective access time?

**Style:** Calculation

<details>
<summary>Answer</summary>

EAT = (1 − p) × 100 + p × 8,000,000 with p = 0.001: 99.9 + 8,000 = **8,099.9 ns ≈ 8.1 µs**, roughly 81 times slower than memory without faults.

</details>

### Q6. In the same system, what fault rate keeps the slowdown below 10 %?

**Style:** Calculation

<details>
<summary>Answer</summary>

Need EAT < 110 ns: 100 + p × (8,000,000 − 100) < 110 → p < 10 ÷ 7,999,900 ≈ **1.25 × 10⁻⁶**, i.e. fewer than one fault per about 800,000 memory accesses.

</details>

### Q7. What are minor and major page faults?

**Style:** Comparison

<details>
<summary>Answer</summary>

A **major** fault requires reading the page from disk (swap or a file). A **minor** fault occurs when the page is already in physical memory — for example in the page cache or shared by another process — so the kernel only has to map it into the page table, with no disk I/O. Linux reports both counts per process (`ps -o min_flt,maj_flt`).

</details>

## Advanced

### Q8. Why must the CPU be able to restart an instruction after a page fault?

**Style:** Why

<details>
<summary>Answer</summary>

A fault can occur in the middle of an instruction — while fetching it, or while reading or writing one of its operands. After the OS loads the page, the instruction must run again as if nothing happened. If a partially executed instruction had already changed registers or memory (for example a block move that overlaps itself), simply re-running it would give wrong results, so the hardware must either undo partial effects or check that all pages are present before modifying anything.

</details>

### Q9. A process's page-fault count rises sharply and the system becomes very slow, while CPU utilisation drops. What is happening?

**Style:** Scenario

<details>
<summary>Answer</summary>

Thrashing: the processes' working sets no longer fit in RAM, so pages are evicted and faulted back in continuously. Processes spend their time waiting for the disk, so CPU utilisation falls. Remedies: reduce the degree of multiprogramming (suspend or kill processes), add RAM, or fix the program's memory access pattern.

</details>
