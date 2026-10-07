# Virtual Memory — Practice

### P1. The key idea

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** virtual memory

Virtual memory allows:

- A) A process to execute without a CPU
- B) A process's address space to be larger than physical memory
- C) The disk to run faster than RAM
- D) Programs to skip address translation

<details>
<summary>Answer</summary>

**Answer:** B) A process's address space to be larger than physical memory

</details>

### P2. Valid–invalid bit

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** demand paging

In demand paging, accessing a page whose valid–invalid bit is "invalid" (but which belongs to the process) causes:

- A) A context switch only
- B) A page fault
- C) A deadlock
- D) Program termination always

<details>
<summary>Answer</summary>

**Answer:** B) A page fault

The OS loads the page and restarts the instruction. Only an access outside the process's address space terminates it.

</details>

### P3. Why fork is cheap

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** copy-on-write

A 2 GB process calls `fork()`, and the child immediately calls `exec()` to run `ls`. Roughly how much memory is copied with copy-on-write, and why?

<details>
<summary>Answer</summary>

Almost none of the 2 GB. After `fork()`, the child shares all the parent's pages read-only; `exec()` then replaces the child's address space before it writes to most of them, so only the few pages written in between (for example a stack page) are ever copied. The page tables still have to be set up, which is why huge processes still pay something for `fork()`.

</details>

### P4. Locality

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** locality of reference

Give one example each of temporal and spatial locality, and explain why they make demand paging effective.

<details>
<summary>Answer</summary>

**Temporal:** a loop counter and the loop's code are used again and again. **Spatial:** iterating through an array touches consecutive addresses on the same page. Because accesses cluster in time and space, a small set of resident pages serves almost all accesses, so page faults stay rare.

</details>
