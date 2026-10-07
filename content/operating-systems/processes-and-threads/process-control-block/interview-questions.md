# Process Control Block (PCB) — Interview Questions

## Beginner

### Q1. What is a Process Control Block?

**Style:** Direct

<details>
<summary>Answer</summary>

A data structure in the kernel that stores all information about one process: its identity (PID), state, saved CPU context (program counter, registers), scheduling information, memory-management information, open files and accounting data. The OS uses it to manage, schedule and resume the process. All PCBs together form the process table.

</details>

### Q2. What information does a PCB contain?

**Style:** Direct

<details>
<summary>Answer</summary>

- Process ID, parent ID, user ID
- Process state
- Program counter and CPU registers
- Scheduling information: priority, queue pointers
- Memory-management information: page-table base or base/limit registers
- Accounting: CPU time used, limits
- I/O status: open files, allocated devices

</details>

## Intermediate

### Q3. Why must the program counter be saved in the PCB?

**Style:** Why

<details>
<summary>Answer</summary>

When a process loses the CPU, the program counter holds the address of its next instruction. Saving it (with the other registers) in the PCB lets the OS restore it when the process is dispatched again, so execution continues exactly where it stopped. Without it, the process could not be resumed correctly.

</details>

### Q4. Where is the PCB stored, and why there?

**Style:** Why

<details>
<summary>Answer</summary>

In kernel memory (kernel space). If a process could modify its own PCB, it could raise its priority, change its user ID or point its page table at another process's memory. Keeping PCBs in protected kernel memory means only the OS can change them.

</details>

### Q5. How is the PCB used during a context switch?

**Style:** How

<details>
<summary>Answer</summary>

The kernel saves the outgoing process's CPU context — program counter, stack pointer, registers, flags — into its PCB and updates its state (Ready or Waiting). It then loads the incoming process's saved context from that process's PCB, switches the memory map to its page table, sets its state to Running, and returns to user mode at the restored program counter.

</details>

## Advanced

### Q6. What is the difference between a PCB and a TCB?

**Style:** Comparison

<details>
<summary>Answer</summary>

A PCB describes a process and holds the resources shared by its threads: address space (page tables), open files, PID, credentials. A thread control block (TCB) describes one thread and holds what is private to it: program counter, registers, stack pointer, thread state and scheduling data. A process with three threads has one PCB and three TCBs. (Linux represents both with `task_struct`, sharing the memory and file structures between threads of a process.)

</details>

### Q7. Does the PCB disappear as soon as a process terminates?

**Style:** Trap

<details>
<summary>Answer</summary>

Not on UNIX-like systems. Memory and open files are released at exit, but a minimal PCB entry stays as a zombie, holding the PID and exit status until the parent calls `wait()`. Only then is the entry freed and the PID reusable.

</details>
