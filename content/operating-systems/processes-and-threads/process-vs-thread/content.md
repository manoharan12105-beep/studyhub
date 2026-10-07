# Process vs Thread

**Module:** Processes and Threads · **Interview priority:** Core

## Concept

- A **process** is a program in execution with its **own address space** and resources. It is the OS's unit of **resource ownership and isolation**.
- A **thread** is a path of execution **inside** a process, with its own program counter, registers and stack, sharing the process's memory and resources. It is the OS's unit of **scheduling**.

Every process has at least one thread. "Process vs thread" is really "separate memory vs shared memory".

## Why It Matters

Choosing between processes and threads is a design trade-off you will be asked about in almost every OS or backend interview: **isolation and safety** (processes) against **speed and easy sharing** (threads). Browsers, web servers, databases and the JVM all make this choice deliberately.

## How It Works

### Memory picture

```text
 Two processes                         One process, two threads
 ┌──────────────┐ ┌──────────────┐     ┌───────────────────────────────┐
 │ code         │ │ code         │     │ code · data · heap · files     │
 │ data, heap   │ │ data, heap   │     │   (shared by both threads)     │
 │ files        │ │ files        │     │                               │
 │ stack        │ │ stack        │     │  stack T1        stack T2      │
 └──────────────┘ └──────────────┘     └───────────────────────────────┘
  separate address spaces;              one address space;
  talk via IPC (pipes, sockets)         talk via shared variables
```

### Creation, switching and communication

- **Creation:** a new process needs a new address space, page tables and PCB; a new thread needs only a stack and a TCB. Thread creation is typically many times cheaper.
- **Context switch:** process → process changes the page table and loses TLB/cache contents; thread → thread in the same process does not. See [Context Switching](../context-switching/content.md).
- **Communication:** processes need **IPC** (pipes, message queues, sockets, shared-memory segments) set up through the kernel; threads simply read and write the same variables — and must synchronise.
- **Failure:** a crash in one process does not affect another; a fatal crash in one thread (for example a segmentation fault) takes down the whole process.

## Example

**Chrome** runs each site in its own **renderer process**: a crash or exploit in one tab cannot read or kill the others — isolation wins. **Inside** each renderer, **threads** handle parsing, JavaScript and painting, because they need to share the page's data quickly — speed wins.

A Java web server such as Tomcat uses **one process (the JVM) with many threads**, one per request or a pool: requests share caches and connection pools cheaply. Running a separate JVM per request would be isolated but far too slow.

## Comparison

| Aspect | Process | Thread |
|--------|---------|--------|
| Definition | Program in execution | Unit of execution within a process |
| Address space | Own, separate | Shared with the process's other threads |
| Shares with peers | Nothing by default | Code, data, heap, open files |
| Private | Everything | Program counter, registers, stack |
| Creation cost | High (address space, page tables) | Low (stack + TCB) |
| Context switch | Slower (page table, TLB flush) | Faster (same address space) |
| Communication | IPC through the kernel | Shared memory directly |
| Isolation | Strong: one crash does not affect others | Weak: one fatal crash kills all threads |
| Synchronisation need | Only for explicitly shared resources | High: all shared data |
| Example | Each Chrome tab's renderer | Tomcat request-handling threads |

## Important Points

- Process = unit of **resource ownership**; thread = unit of **scheduling**.
- Threads share code, data, heap and files; each has its own PC, registers and stack.
- Threads are cheaper to create, switch and communicate; processes are safer.
- Use processes for isolation (security, fault tolerance); threads for speed and sharing.

## Common Confusion

> [!WARNING]
> **"Threads are always better because they are faster."** They trade away isolation. A memory-corruption bug in one thread can damage data used by every other thread, and a fatal crash ends the whole process. That is why browsers isolate sites in processes.

- **"Processes cannot share memory."** They can, but only explicitly (shared-memory segments, memory-mapped files) through the OS.
- **"Each thread has its own PID."** In POSIX terms, threads share the process's PID and have separate thread IDs. (Linux gives each thread a kernel task ID; `getpid()` still returns the same PID for all threads of a process.)

## Interview Perspective

- *"Difference between process and thread?"* — answer with the table's top rows: address space, what is shared, cost, communication, isolation.
- *"When would you use multiple processes instead of threads?"* — isolation, security, crash containment, different privileges.
- *"Why are threads called lightweight processes?"* — no new address space; cheaper creation and switching.
- *"What happens to other threads if one thread crashes?"* — a fatal crash ends the process.

## Quick Revision

- Process: own memory, isolated, heavy. Thread: shared memory, light.
- Threads share code/data/heap/files; private PC, registers, stack.
- Process switch costlier (page table, TLB). Threads talk via memory; processes via IPC.
- Isolation → processes. Speed and sharing → threads.
