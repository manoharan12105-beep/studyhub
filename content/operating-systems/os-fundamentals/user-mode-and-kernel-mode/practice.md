# User Mode vs Kernel Mode — Practice

### P1. Spot the privileged instruction

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** privileged instructions

Which instruction should be privileged?

- A) Add two registers
- B) Read a value from the program's own stack
- C) Disable interrupts
- D) Call a function in the same program

<details>
<summary>Answer</summary>

**Answer:** C) Disable interrupts

A user program that could disable interrupts could stop the timer and keep the CPU forever.

</details>

### P2. Ways into the kernel

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** mode switch

Which event does **not** switch the CPU from user mode to kernel mode?

- A) A system call
- B) A timer interrupt
- C) A page fault
- D) A call to a method in the same Java class

<details>
<summary>Answer</summary>

**Answer:** D) A call to a method in the same Java class

An ordinary function call stays in user mode. System calls, interrupts and exceptions (a page fault is an exception) enter the kernel.

</details>

### P3. Count the switches

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** mode switch vs context switch

A process calls `getpid()` (which returns immediately) and then `read()` on a file whose data is not in memory, so the read must wait for the disk. Which call is likely to cause a context switch, and why?

<details>
<summary>Answer</summary>

`getpid()` causes a mode switch into the kernel and back, with no context switch. `read()` blocks the process while the disk works, so the scheduler switches to another ready process — a context switch. When the disk interrupt arrives, the process becomes ready and later runs again.

</details>

### P4. Root and modes

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** privilege vs mode

An administrator runs a program with `sudo`. The program executes the x86 `cli` (clear interrupt flag) instruction directly. What happens?

<details>
<summary>Answer</summary>

The program still runs in user mode (ring 3), so `cli` raises a general-protection exception and the kernel terminates the program. `sudo` changes the user identity checked by system calls; it does not change the CPU mode.

</details>
