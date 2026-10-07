# What Is an Operating System? — Practice

### P1. Which is not an OS responsibility?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** OS functions

- A) Scheduling processes on the CPU
- B) Allocating memory to processes
- C) Compiling Java source code to bytecode
- D) Managing files and directories

<details>
<summary>Answer</summary>

**Answer:** C) Compiling Java source code to bytecode

Compiling is done by a user program (`javac`). The OS runs the compiler as a process, but compiling is not an OS function.

</details>

### P2. Kernel or not?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** kernel vs OS

Which of these runs in user mode, not as part of the kernel?

- A) The CPU scheduler
- B) The page-fault handler
- C) The Bash shell
- D) The disk device driver

<details>
<summary>Answer</summary>

**Answer:** C) The Bash shell

The shell is an ordinary program that asks the kernel for services through system calls.

</details>

### P3. Name the responsibilities

**Difficulty:** Easy · **Type:** Scenario · **Concepts:** OS functions

A user plugs in a USB drive, copies a file from it to the desktop, and the copy continues while they browse the web. Name four OS responsibilities involved.

<details>
<summary>Answer</summary>

Device management (USB driver, interrupts), file management (reading and creating files, directories, permissions), memory management (buffers for the copy, memory for both programs), and process management (scheduling the copy and the browser so both make progress). Storage management (finding free blocks on the destination disk) is a fifth.

</details>

### P4. Why does the CPU not sit idle?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** efficiency goal

A program spends 90 % of its time waiting for disk reads. How does the OS keep the CPU useful, and which goal does this serve?

<details>
<summary>Answer</summary>

When the program issues a disk read, the OS blocks it and schedules another ready process on the CPU. When the disk finishes, an interrupt makes the first program ready again. This **multiprogramming** serves the **efficiency** goal: CPU and disk work in parallel instead of the CPU waiting.

</details>
