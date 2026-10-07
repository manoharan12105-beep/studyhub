# Process vs Thread — Practice

### P1. Shared between threads

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** process vs thread

Which resource is shared by threads of the same process but **not** by two separate processes?

- A) The CPU
- B) The heap
- C) The hard disk
- D) The system clock

<details>
<summary>Answer</summary>

**Answer:** B) The heap

The CPU, disk and clock are shared by everyone through the OS; the heap belongs to one process and is shared only by its threads.

</details>

### P2. Cheaper to create

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** creation cost

Creating a thread is cheaper than creating a process mainly because a thread:

- A) Does not need a stack
- B) Does not need a new address space
- C) Runs in kernel mode
- D) Has no program counter

<details>
<summary>Answer</summary>

**Answer:** B) Does not need a new address space

A thread still needs its own stack and program counter.

</details>

### P3. Choose the model

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** design choice

For each, choose processes or threads and justify: (a) a PDF viewer that opens untrusted files from the Internet, (b) a game engine where physics, rendering and audio work on the same world data every frame.

<details>
<summary>Answer</summary>

(a) **Processes** — parse untrusted files in a separate, sandboxed process so an exploit or crash cannot reach the main application's memory. (b) **Threads** — the components share large, constantly changing data and need fast communication; isolation is less important than speed.

</details>

### P4. Crash impact

**Difficulty:** Medium · **Type:** Comparison · **Concepts:** isolation

Program A uses 4 worker processes; program B uses 4 worker threads in one process. In each, one worker dereferences an invalid pointer and causes a segmentation fault. What happens to the other three workers?

<details>
<summary>Answer</summary>

In A, only the faulting worker process dies; the other three keep running (and a supervisor can restart the failed one). In B, the segmentation fault terminates the whole process, so all four threads stop.

</details>
