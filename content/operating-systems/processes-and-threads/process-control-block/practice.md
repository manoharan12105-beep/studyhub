# Process Control Block (PCB) — Practice

### P1. Not in the PCB

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** PCB fields

Which item is **not** stored in a PCB?

- A) Program counter
- B) Process state
- C) The source code of the program
- D) List of open files

<details>
<summary>Answer</summary>

**Answer:** C) The source code of the program

The PCB holds information about the process; the code itself is in the process's address space (and the source code is not involved at all).

</details>

### P2. Linux name

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** PCB in practice

In the Linux kernel, the PCB is represented by:

- A) `struct inode`
- B) `struct task_struct`
- C) `struct page`
- D) `struct file`

<details>
<summary>Answer</summary>

**Answer:** B) `struct task_struct`

</details>

### P3. Resume correctly

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** CPU context

A process is preempted in the middle of a loop with `i = 41` in a register. Which PCB fields must be saved and restored so it continues with `i = 41` at the correct instruction?

<details>
<summary>Answer</summary>

The **program counter** (next instruction), the **general-purpose registers** (including the one holding `i`), the **stack pointer** and the **status flags**. Memory contents do not need saving because the process's address space stays intact; the PCB's page-table pointer makes it accessible again.

</details>
