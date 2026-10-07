# User Mode vs Kernel Mode

**Module:** OS Fundamentals · **Interview priority:** Core

## Concept

The CPU runs code in at least two **modes**, recorded by a **mode bit** in hardware:

- **Kernel mode** (supervisor or privileged mode): the code can execute every instruction and access all memory and devices. The OS kernel runs here.
- **User mode**: the code can execute only ordinary instructions and access only its own memory. Applications run here.

Memory is split the same way: **kernel space** holds the kernel's code and data and is accessible only in kernel mode; **user space** holds application processes.

## Why It Matters

If every program could disable interrupts, write to the disk controller or read any memory, one buggy or malicious program could crash the machine or steal data. **Dual-mode operation** lets the hardware enforce protection: dangerous **privileged instructions** run only in kernel mode, so applications must ask the kernel to do them — and the kernel checks every request.

## How It Works

### Privileged instructions

Instructions that only kernel mode may execute. If user-mode code tries one, the CPU raises an exception and the kernel usually terminates the program.

| Privileged (kernel mode only) | Not privileged (allowed in user mode) |
|-------------------------------|---------------------------------------|
| Disable/enable interrupts | Arithmetic and logic |
| Set the timer | Read the clock (on most CPUs) |
| Direct I/O device access | Load/store to the process's own memory |
| Change page tables / memory-management registers | Function calls, jumps |
| Switch to kernel mode directly | Issue a system call (trap) instruction |

### How the CPU switches modes

```text
   User mode                       Kernel mode
   ─────────                       ───────────
   program runs ──system call────▶ kernel handles the request
                ──interrupt──────▶ kernel handles the device/timer
                ──exception──────▶ kernel handles the fault
   program resumes ◀── return-from-trap (mode bit back to user)
```

1. **User → kernel** only through controlled entry points: a **system call** (a trap instruction such as `syscall` on x86-64), a hardware **interrupt** (timer, disk, network), or an **exception** (page fault, divide by zero, illegal instruction). The hardware sets the mode bit to kernel and jumps to a handler chosen by the kernel — the program cannot pick an arbitrary kernel address.
2. **Kernel → user** with a special return instruction that restores the program's registers and sets the mode bit back to user.

On x86 these modes are **protection rings**: ring 0 = kernel, ring 3 = user (rings 1 and 2 are rarely used).

### Mode switch vs context switch

- A **mode switch** changes the privilege level for the *same* process (user → kernel → user). A system call such as `getpid()` causes two mode switches and usually no context switch.
- A **context switch** changes *which process or thread* runs. It always happens in kernel mode, so it involves mode switches, but most mode switches are not context switches. See [Context Switching](../../processes-and-threads/context-switching/content.md).

## Example

A Java program calls `Files.readString(path)`:

1. In user mode, the JVM and the C library prepare the request and execute the `syscall` instruction for `read()`.
2. The CPU switches to kernel mode and jumps to the kernel's system-call handler.
3. The kernel checks that the file descriptor is valid and that the buffer address belongs to the process, reads the data (from the page cache or disk) and copies it into the process's buffer.
4. The kernel executes the return instruction; the CPU is back in user mode and the program continues with the data.

If the program instead tried to execute the instruction that disables interrupts, the CPU would raise a general-protection exception and the kernel would kill it.

## Comparison

| Aspect | User mode | Kernel mode |
|--------|-----------|-------------|
| Who runs here | Applications, libraries, shells | OS kernel, device drivers |
| Instructions | Non-privileged only | All, including privileged |
| Memory access | Own address space only | All memory |
| A crash affects | That process only | The whole system (kernel panic / blue screen) |
| Entered by | Return from the kernel | System call, interrupt, exception |
| Mode bit (conventional) | 1 | 0 |

## Important Points

- Dual-mode operation is **hardware-enforced** protection; the OS relies on it.
- Programs enter the kernel only through **system calls, interrupts and exceptions** — controlled gates.
- Privileged instructions in user mode cause an exception, not silent execution.
- A **timer interrupt** returns control to the kernel even if a user program loops forever.
- Mode switch ≠ context switch.

## Common Confusion

> [!WARNING]
> **"Kernel mode means the root/administrator user."** No. Root is a *user identity* with more permissions; root's programs still run in **user mode** and still use system calls. Kernel mode is a CPU state that only kernel code uses.

- **"Every system call is a context switch."** A system call is a mode switch. A context switch happens only if the call blocks (for example waiting for disk) or the scheduler picks another process.
- **"Device drivers run in user mode."** Most drivers in Linux and Windows run in kernel mode, which is why a buggy driver can crash the whole system.

## Interview Perspective

- *"What is the difference between user mode and kernel mode?"* — privilege of instructions and memory, who runs there, and how one moves between them.
- *"Why do we need two modes?"* — protection: hardware stops applications from executing dangerous instructions directly.
- *"How does a program get into kernel mode?"* — system call (trap), interrupt, exception. Never by jumping there.
- Follow-up: *"Is a system call a context switch?"* — no, a mode switch.

## Quick Revision

- Mode bit: kernel (privileged) vs user (restricted).
- Privileged: I/O, interrupts on/off, timer, page tables.
- User → kernel: system call, interrupt, exception. Kernel → user: return-from-trap.
- Root ≠ kernel mode. Mode switch ≠ context switch.
