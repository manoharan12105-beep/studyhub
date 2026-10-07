# Process Control Block (PCB)

**Module:** Processes and Threads · **Interview priority:** Frequently asked

## Concept

The **Process Control Block (PCB)**, also called a task control block, is the kernel data structure that represents one process. Everything the OS knows about a process is in its PCB. The collection of all PCBs is the **process table**.

On Linux the PCB is `struct task_struct`; on Windows it is the `EPROCESS` structure (with `ETHREAD` for each thread).

## Why It Matters

A process is not running most of the time. When the OS takes the CPU away, it must remember exactly where the process was so it can continue later as if nothing happened. The PCB is where that information lives — and it is what the scheduler moves between queues.

## How It Works

### What a PCB contains

| Field group | Contents |
|-------------|----------|
| **Identification** | Process ID (PID), parent PID, user and group IDs |
| **Process state** | New, Ready, Running, Waiting, Terminated |
| **CPU context** | Program counter, stack pointer, general-purpose registers, status flags — saved when the process stops running |
| **Scheduling information** | Priority, pointers into scheduling queues, time used, time-slice remaining |
| **Memory-management information** | Page-table base (or base/limit registers, segment tables), memory limits |
| **Accounting information** | CPU time used, start time, resource limits |
| **I/O status information** | Open files (file-descriptor table), devices allocated, pending I/O |
| **Links** | Parent, children, signal handlers and pending signals |

### How the OS uses it

- **Creation:** `fork`/`CreateProcess` allocates and fills a new PCB.
- **Scheduling:** queues (ready queue, device queues) are lists of PCB pointers; a state change moves the PCB between lists.
- **Context switch:** the outgoing process's CPU context is saved into its PCB; the incoming process's context is loaded from its PCB. See [Context Switching](../context-switching/content.md).
- **Termination:** resources listed in the PCB are released; the PCB stays (zombie) until the parent collects the exit status, then it is freed.

### Threads and the PCB

With multithreading, per-thread data (program counter, registers, stack pointer, thread state) moves into a **thread control block (TCB)**, while the PCB keeps what all threads share: address space, open files, PID. Linux uses one `task_struct` per thread, and threads of one process share the memory and file structures it points to.

## Example

Process 4310 (`java App`) is preempted while executing:

```text
 PCB of process 4310
 ─────────────────────────────────────────────
 PID 4310         PPID 4102        UID 1000
 State            Ready  (was Running)
 PC               0x00007f3a1c2041b8   ← next instruction
 SP, registers    saved values
 Priority         20 (normal)
 Page-table base  physical address of its page table
 Open files       0 stdin, 1 stdout, 2 stderr, 3 data.csv
 CPU time used    1.84 s
```

When it is dispatched again, the kernel loads PC, SP and registers from this PCB, switches to its page table, and the process continues with the very next instruction. The values here are illustrative.

## Important Points

- PCB = the kernel's record of one process; process table = all PCBs.
- Key fields: PID, state, program counter and registers, scheduling data, memory-management data, open files, accounting.
- The PCB lives in **kernel memory**; user processes cannot read or modify it directly.
- Context switch = save context to old PCB, load context from new PCB.
- Threads have their own TCBs (PC, registers, stack); the PCB holds shared resources.

## Common Confusion

> [!WARNING]
> **"The PCB stores the process's code and data."** No. It stores *information about* the process — including pointers to its page tables — but the code, data, heap and stack live in the process's address space.

- **The PCB is not freed at exit immediately** on UNIX: it remains until the parent reaps the zombie.

## Interview Perspective

- *"What is a PCB and what does it contain?"* — list 6–8 fields grouped as above.
- *"Why is the program counter saved in the PCB?"* — so the process resumes at the exact next instruction.
- *"Where is the PCB stored?"* — kernel memory, protected from user processes.
- Often asked together with context switching.

## Quick Revision

- PCB = kernel data structure per process (Linux `task_struct`).
- Contains: PID, state, PC, registers, priority, memory info, open files, accounting.
- Used by queues and by the context switch (save/load).
- Kept in kernel space; TCB holds per-thread state.
