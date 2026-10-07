# Context Switching — Interview Questions

## Beginner

### Q1. What is a context switch?

**Style:** Direct

<details>
<summary>Answer</summary>

The operation in which the kernel stops running one process or thread and starts running another: it saves the current one's CPU state (program counter, registers, stack pointer, flags) into its PCB and restores the next one's state from its PCB, switching the memory map if the new one belongs to a different process. It lets one CPU be shared among many processes.

</details>

### Q2. When does a context switch occur?

**Style:** Direct

<details>
<summary>Answer</summary>

When the running process's time slice expires (timer interrupt), when a higher-priority process becomes ready (preemption), when the running process blocks (I/O, lock, `sleep`), when it terminates, or when it voluntarily yields the CPU.

</details>

### Q3. Why is context switching considered overhead?

**Style:** Why

<details>
<summary>Answer</summary>

During the switch the CPU executes only kernel bookkeeping — saving and loading state, running the scheduler, changing page tables — and no application makes progress. Afterwards, the new process runs with caches and the TLB filled with the previous process's data, so it is slower until they warm up. Frequent switches can waste a significant share of CPU time.

</details>

## Intermediate

### Q4. Explain the steps of a context switch.

**Style:** How

<details>
<summary>Answer</summary>

1. An interrupt or system call enters the kernel; the running process's registers are saved.
2. The kernel stores the process's context in its PCB and sets its state to Ready (preempted) or Waiting (blocked), placing the PCB on the right queue.
3. The scheduler selects the next process from the ready queue.
4. The kernel switches to the new process's address space (page-table base register; TLB flush or ASID change).
5. It loads the new process's context from its PCB and marks it Running.
6. It returns to user mode, resuming the new process at its saved program counter.

</details>

### Q5. Why is a thread context switch cheaper than a process context switch?

**Style:** Comparison

<details>
<summary>Answer</summary>

Threads of one process share the address space, so switching between them needs no page-table change and no TLB flush, and shared data may still be in the caches. Only the per-thread registers, program counter and stack pointer are swapped. A process switch also changes the memory map, invalidating TLB entries and cache locality.

</details>

### Q6. What is the difference between a context switch and a mode switch?

**Style:** Trap

<details>
<summary>Answer</summary>

A mode switch changes the CPU privilege level (user ↔ kernel) for the same process — every system call and interrupt does this. A context switch changes which process or thread runs. Context switches happen inside the kernel, so they involve mode switches, but a system call that returns to the same process involves no context switch.

</details>

### Q7. With a 0.1 ms switch cost, what fraction of CPU time is overhead for time slices of 4 ms and 0.5 ms?

**Style:** Calculation

<details>
<summary>Answer</summary>

Overhead = switch ÷ (slice + switch). 4 ms: 0.1 ÷ 4.1 ≈ **2.4 %**. 0.5 ms: 0.1 ÷ 0.6 ≈ **16.7 %**. Shorter slices improve responsiveness but spend far more time switching.

</details>

## Advanced

### Q8. What are the indirect costs of a context switch?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Loss of locality: CPU caches, the TLB and branch predictors were warmed by the previous process. The new process suffers cache misses and TLB misses (page-table walks) until its working set is reloaded. These indirect costs are often larger than the direct cost of saving and loading registers, which is why schedulers try to keep a process on the same core (CPU affinity).

</details>

### Q9. A web server creates one process per request and spends most CPU time in the kernel. What might you suggest?

**Style:** Scenario

<details>
<summary>Answer</summary>

Process creation and process context switches are expensive. Use a pool of pre-created threads (or processes) that are reused, or an event-driven design with a few threads and non-blocking I/O. Both reduce creations and context switches. Keeping the number of runnable threads close to the number of cores also limits needless switching.

</details>
