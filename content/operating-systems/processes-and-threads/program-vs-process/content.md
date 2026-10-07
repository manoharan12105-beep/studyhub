# Program vs Process

**Module:** Processes and Threads · **Interview priority:** Core

## Concept

- A **program** is a **passive** entity: a file of instructions and data stored on disk (`/usr/bin/java`, `notepad.exe`, `App.class`).
- A **process** is a **program in execution**: an **active** entity with its own memory, a program counter saying which instruction is next, CPU registers, open files and a state managed by the OS.

One program can become many processes: open three terminal windows and the same shell program runs as three independent processes, each with its own PID and memory.

## Why It Matters

The OS does not schedule or protect "programs"; it manages **processes**. Everything in this module — states, the PCB, context switches, scheduling — is about processes. Getting the distinction right is usually the first question in an OS interview.

## How It Works

### What a process contains

```text
 high addresses ┌───────────────────────┐
                │ Stack                 │  function calls: local variables,
                │   ↓ grows down        │  parameters, return addresses
                │                       │
                │   ↑ grows up          │
                │ Heap                  │  dynamic memory: new / malloc
                ├───────────────────────┤
                │ Data (globals/static) │  initialised and uninitialised (BSS)
                ├───────────────────────┤
                │ Text (code)           │  machine instructions, read-only
 low addresses  └───────────────────────┘
```

Besides this **address space**, the OS keeps for each process: a PID, the program counter and registers (saved when it is not running), its state, scheduling information, open files, and resource limits — all in its [Process Control Block](../process-control-block/content.md).

### From program to process

1. A running process asks the OS to start a program (`fork` + `exec`, or `CreateProcess`).
2. The OS creates a PCB, allocates an address space, and loads the program's code and data from the file.
3. It sets up the stack (with command-line arguments) and an empty heap.
4. The new process enters the **ready** state and waits to be scheduled.
5. When it finishes, it calls `exit`; the OS frees its memory and files and passes the exit status to the parent.

### Process creation and termination vocabulary

- **Parent / child:** the creating process is the parent; processes form a tree (on Linux, rooted at PID 1).
- **Zombie:** a child that has exited but whose parent has not yet collected its exit status (`wait`).
- **Orphan:** a child whose parent exited first; it is adopted by PID 1, which reaps it later.

## Example

`java App` run twice in two terminals:

| | Process 1 | Process 2 |
|---|-----------|-----------|
| Program file | `java` + `App.class` | the same files |
| PID | 4310 | 4388 |
| Heap contents | its own objects | its own objects |
| Program counter | wherever process 1 is | wherever process 2 is |
| Crash affects | only process 1 | only process 2 |

Same program, two processes, completely separate memory. A static variable changed in one is unchanged in the other.

## Comparison

| Aspect | Program | Process |
|--------|---------|---------|
| Nature | Passive: a file | Active: execution in progress |
| Lives in | Disk (secondary storage) | Memory, with CPU state |
| Lifetime | Until deleted | From creation to termination |
| Resources | None (just bytes) | CPU time, memory, open files, I/O devices |
| State | None | New, ready, running, waiting, terminated |
| Count | One file | Many processes can run the same program |

## Important Points

- Program = passive instructions on disk; process = active program in execution.
- A process has text, data, heap and stack, plus a PCB with PID, PC, registers, state and resources.
- Many processes can run one program; each has its own address space.
- Zombie = finished, not yet reaped; orphan = parent died, adopted by PID 1.

## Common Confusion

> [!WARNING]
> **"A process is a program loaded in memory."** Loaded code alone is not enough: a process also has execution state — program counter, registers, stack — and OS-managed resources. Two processes can share the same code pages in memory and still be two processes.

- **Heap vs stack:** local variables and call frames are on the stack; objects created with `new` are on the heap. In Java every object is on the heap; references in methods are on the stack.
- **Process vs thread:** a process can contain several threads that share its address space — see [Process vs Thread](../process-vs-thread/content.md).

## Interview Perspective

- *"Program vs process?"* — passive vs active, disk vs memory, one program many processes.
- *"What does a process's memory look like?"* — text, data, heap, stack; which grows which way.
- *"Zombie vs orphan?"* — a common follow-up.

## Quick Revision

- Program: passive file. Process: program in execution with PC, registers, memory, resources.
- Memory layout: text, data, heap ↑, stack ↓.
- One program → many processes, each isolated.
- Zombie: exited, not reaped. Orphan: parent gone, adopted by PID 1.
