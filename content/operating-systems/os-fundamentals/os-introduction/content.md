# What Is an Operating System?

**Module:** OS Fundamentals · **Interview priority:** Frequently asked

## Concept

An **operating system (OS)** is the software layer between the hardware and the programs you run. It manages the computer's resources — CPU time, memory, storage and devices — and gives programs a simple, safe way to use them.

Two views describe the same job:

- **Resource manager:** many programs want the CPU, memory and disk at the same time. The OS decides who gets what, when, and for how long.
- **Extended machine (abstraction):** instead of programming disk controllers and memory chips directly, a program asks the OS to "open a file", "create a process" or "allocate memory".

```text
   ┌─────────────────────────────────────────┐
   │ Applications: browser, editor, JVM, DB  │
   ├─────────────────────────────────────────┤
   │ System programs: shell, utilities       │
   ├─────────────────────────────────────────┤
   │ Operating system (kernel)               │  ← manages and protects
   ├─────────────────────────────────────────┤
   │ Hardware: CPU, RAM, disk, NIC, keyboard │
   └─────────────────────────────────────────┘
```

## Why It Matters

Without an OS, every program would need its own code for every disk, keyboard and network card, and nothing would stop one program from overwriting another's memory. The OS exists to provide:

- **Convenience** — programs use files, processes and sockets instead of raw hardware.
- **Efficiency** — the CPU is not left idle while one program waits for the disk; another program runs.
- **Protection and isolation** — a bug in one program cannot crash the whole machine or read another user's data.
- **Ability to evolve** — new hardware needs a new driver, not new applications.

## How It Works

### Goals of an OS

| Goal | Meaning | Example |
|------|---------|---------|
| Convenience | Easy to use for users and programmers | Double-click to open a file; `open()` instead of disk sectors |
| Efficiency | Keep CPU, memory and devices busy and fairly shared | Run another process while one waits for I/O |
| Reliability and protection | One failure does not spread | A crashed app does not take down the OS |
| Security | Only authorised users and programs access resources | File permissions, login, memory isolation |
| Ability to evolve | Change hardware or features without rewriting apps | Install a new printer driver |

Desktop systems lean towards convenience; servers towards throughput and reliability; embedded systems towards small size and predictable timing.

### Responsibilities (the OS's jobs)

| Responsibility | What the OS does |
|----------------|------------------|
| **Process management** | Create and terminate processes, schedule them on the CPU, let them communicate and synchronise |
| **Memory management** | Track which memory is used by whom, allocate and free it, provide virtual memory |
| **File management** | Files and directories, naming, permissions, mapping files to disk blocks |
| **Device (I/O) management** | Drivers, buffering, scheduling disk requests, handling interrupts |
| **Storage management** | Free-space management and disk scheduling |
| **Protection and security** | User and kernel modes, access control, authentication |
| **User interface** | A command-line shell or a graphical interface (provided by system programs on top of the kernel) |

### Kernel vs operating system

The **kernel** is the core of the OS that is always in memory and runs in privileged (kernel) mode: scheduling, memory management, drivers, system calls. The **operating system** in the wider sense also includes system programs — shell, file manager, utilities, libraries. In interviews, "the OS does X" usually means "the kernel does X".

## Example

You open a text editor, type, and press **Save**:

1. The shell or desktop asks the OS to **create a process** for the editor; the OS loads the program into **memory** and **schedules** it on the CPU.
2. Each key press raises a hardware **interrupt**; the keyboard **driver** reads it and the OS delivers the character to the editor.
3. **Save** makes the editor call `write()` — a **system call**. The OS checks **permissions**, finds free **disk blocks**, and asks the disk driver to store the data.
4. While the disk works, the OS runs **other processes** instead of letting the CPU wait.

Every responsibility in the table above appears in this one ordinary action.

## Important Points

- The OS is both a **resource manager** and an **abstraction layer** over hardware.
- Main responsibilities: process, memory, file, I/O, storage, protection/security, user interface.
- The kernel is the always-resident, privileged core; the shell and GUI are programs on top of it.
- The OS is **event-driven**: it runs when a system call, interrupt or exception gives it control, then returns to a user program.

## Common Confusion

> [!WARNING]
> **"The OS is the GUI."** The desktop and the shell are user interfaces — ordinary programs. Linux servers run without any GUI; the kernel is still doing all the OS work.

- **Firmware (BIOS/UEFI) is not the OS.** Firmware starts the machine and loads a bootloader; the bootloader loads the kernel.
- **The OS is not always "running" as a separate program.** It is code that runs when an event (interrupt, system call, fault) hands it control.

## Interview Perspective

- *"What is an operating system?"* — One sentence: software that manages hardware resources and provides services and abstractions to programs. Then name two or three responsibilities.
- *"What are the main functions of an OS?"* — Process, memory, file, device management, security, user interface.
- Follow-ups go to [Kernel vs User Space](../user-mode-and-kernel-mode/content.md) and [System Calls](../system-calls/content.md).

## Quick Revision

- OS = resource manager + extended machine between hardware and programs.
- Goals: convenience, efficiency, protection, security, ability to evolve.
- Jobs: processes, memory, files, I/O, storage, security, UI.
- Kernel = privileged core; shell/GUI = programs on top.
