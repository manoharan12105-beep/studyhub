# Program vs Process — Interview Questions

## Beginner

### Q1. What is the difference between a program and a process?

**Style:** Comparison

<details>
<summary>Answer</summary>

A program is a passive set of instructions stored in a file on disk. A process is a program in execution — an active entity with its own address space (code, data, heap, stack), a program counter, registers, open files and an OS-managed state. A program has no state and uses no resources; a process does. One program can be run as many processes at once.

</details>

### Q2. What are the sections of a process in memory?

**Style:** Direct

<details>
<summary>Answer</summary>

**Text** (the program's machine code, usually read-only), **data** (global and static variables — initialised data and BSS), **heap** (dynamically allocated memory, grows upward), and **stack** (function call frames: local variables, parameters, return addresses, grows downward).

</details>

### Q3. Can one program have several processes?

**Style:** Direct

<details>
<summary>Answer</summary>

Yes. Each execution creates a separate process: three open terminal windows run the same shell program as three processes with different PIDs, separate memory and independent states. The OS may share the read-only code pages between them to save memory, but their data, heap and stack are separate.

</details>

## Intermediate

### Q4. What is a zombie process?

**Style:** Direct

<details>
<summary>Answer</summary>

A process that has finished executing but still has an entry in the process table, because its parent has not yet read its exit status with `wait()`. It uses no CPU or memory beyond that entry, but too many zombies can exhaust process IDs. It disappears when the parent waits for it, or when the parent dies and PID 1 adopts and reaps it.

</details>

### Q5. What is an orphan process, and how is it different from a zombie?

**Style:** Comparison

<details>
<summary>Answer</summary>

An orphan is a process that is **still running** after its parent has terminated; the OS re-parents it to PID 1 (`init`/`systemd`), which will reap it when it exits. A zombie is a process that has **already terminated** but has not been reaped by its parent. Orphan: alive, parent gone. Zombie: dead, entry not yet removed.

</details>

### Q6. Why does the stack grow down and the heap grow up?

**Style:** Why

<details>
<summary>Answer</summary>

Placing them at opposite ends of the free region lets both grow into the same gap without fixing a size for either in advance; the process runs out of memory only when they meet (or hit a limit). The direction is a convention of the architecture and OS (downward stacks are standard on x86 and ARM), not a law.

</details>

## Advanced

### Q7. A static variable is changed in one running instance of a Java program. Does a second running instance see the change?

**Style:** Trap

<details>
<summary>Answer</summary>

No. Each run is a separate process (a separate JVM) with its own address space, so each has its own copy of every static variable. Processes share data only through explicit mechanisms — files, sockets, pipes, shared memory. (Threads inside one JVM do share static variables.)

</details>
