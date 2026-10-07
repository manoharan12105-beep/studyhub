# User Mode vs Kernel Mode — Interview Questions

## Beginner

### Q1. What is the difference between user mode and kernel mode?

**Style:** Comparison

<details>
<summary>Answer</summary>

They are two CPU privilege levels set by a hardware mode bit. In **kernel mode** code can execute every instruction (including privileged ones such as I/O and interrupt control) and access all memory; the kernel and drivers run here. In **user mode** code can execute only non-privileged instructions and access only its own address space; applications run here and must ask the kernel for privileged work through system calls.

</details>

### Q2. Why does an OS need dual-mode operation?

**Style:** Why

<details>
<summary>Answer</summary>

For protection. If applications could execute privileged instructions, any program could disable interrupts and monopolise the CPU, overwrite other programs' memory, or access devices directly. Dual mode lets the hardware block these instructions in user mode, so all sensitive operations pass through kernel code that checks permissions.

</details>

### Q3. What are privileged instructions? Give examples.

**Style:** Direct

<details>
<summary>Answer</summary>

Instructions that can run only in kernel mode; executing one in user mode causes an exception. Examples: enabling or disabling interrupts, setting the timer, direct I/O instructions, loading memory-management registers (page-table base), halting the CPU, and switching to kernel mode directly.

</details>

## Intermediate

### Q4. How does control move from user mode to kernel mode and back?

**Style:** How

<details>
<summary>Answer</summary>

User → kernel happens only through hardware-defined entry points: a **system call** (trap instruction), a hardware **interrupt**, or an **exception** (fault). The CPU saves the program's state, sets the mode bit to kernel and jumps to a handler address the kernel registered in advance (the interrupt/trap table). Kernel → user uses a return-from-trap instruction that restores the saved state and sets the mode bit back to user.

</details>

### Q5. Is a system call the same as a context switch?

**Style:** Trap

<details>
<summary>Answer</summary>

No. A system call causes a **mode switch** (user → kernel → user) within the same process. A **context switch** replaces the running process or thread with another. A call like `getpid()` returns without any context switch; a `read()` that must wait for disk blocks the process, and then the scheduler performs a context switch to run something else.

</details>

### Q6. Does a program running as root execute in kernel mode?

**Style:** Trap

<details>
<summary>Answer</summary>

No. Root (or Administrator) is a user identity that passes more permission checks. A root process still runs in user mode, still cannot execute privileged instructions directly, and still uses system calls. Only kernel code (and kernel-mode drivers) runs in kernel mode.

</details>

### Q7. What happens if a user program executes a privileged instruction?

**Style:** What happens internally

<details>
<summary>Answer</summary>

The CPU detects that the instruction is not allowed at the current privilege level and raises an exception (for example a general-protection fault on x86). Control transfers to the kernel's exception handler, which typically terminates the program (on Linux, by sending it a signal such as SIGSEGV or SIGILL). The instruction never takes effect.

</details>

## Advanced

### Q8. Why can a buggy device driver crash the whole system but a buggy application cannot?

**Style:** Scenario

<details>
<summary>Answer</summary>

Most drivers run in kernel mode inside the kernel's address space. A bad pointer there can overwrite kernel data structures, and there is no higher level to contain the fault, so the kernel panics (Linux) or shows a stop error (Windows). An application's fault stays inside its own address space; the kernel catches the exception and kills only that process. Microkernels move drivers to user mode precisely to contain such failures.

</details>

### Q9. How does the OS regain control from a program that runs an infinite loop?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Before starting a user program, the kernel programs a hardware **timer** to interrupt after a time slice. Setting the timer is privileged, so the program cannot disable it. When the timer fires, the CPU switches to kernel mode and the scheduler can preempt the looping program and run another.

</details>
