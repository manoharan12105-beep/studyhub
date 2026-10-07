# Block 1: OS Fundamentals

Block 1 of 5, about ten minutes. Read all five for a 50-minute revision, or only the blocks you need.

## 1. What an OS Is (2 min)

- OS = software between hardware and programs. **Resource manager** (CPU, memory, disk, devices) + **extended machine** (files, processes, sockets).
- Goals: convenience · efficiency · protection/security · ability to evolve.
- Jobs: process, memory, file, I/O, storage management · security · user interface.
- **Kernel** = privileged, always-resident core. Shell and GUI = user programs.
- The OS runs only when an **event** hands it control: system call, interrupt, exception.

## 2. Types (2 min)

```text
Batch            jobs in groups, no interaction
Multiprogramming switch on I/O wait        → CPU utilisation
Multitasking     switch on a timer too      → response time
Multiprocessing  2+ CPUs                    → parallelism
Real-time        deadlines: hard (airbag) vs soft (video)
```

Concurrency = interleaving (one core is enough). Parallelism = simultaneous (needs cores).

## 3. User Mode and Kernel Mode (2 min)

- Mode bit: **kernel** (all instructions, all memory) vs **user** (restricted).
- Privileged: I/O, interrupts on/off, timer, page tables.
- User → kernel only via **system call · interrupt · exception**; back via return-from-trap.
- Timer interrupt = the OS always gets the CPU back.
- Root ≠ kernel mode. Mode switch ≠ context switch.

## 4. Architecture (1 min)

- Monolithic: all in kernel mode, fast, fragile (Linux).
- Microkernel: IPC + scheduling + basic memory in kernel; drivers/FS in user mode; reliable, slower (QNX, MINIX).
- Modular: loadable modules, still kernel mode. Hybrid: Windows, macOS.

## 5. System Calls (3 min)

```text
app → library wrapper → number + args in registers → trap (syscall)
    → kernel: system-call table → handler → validate → work → return value
    → return-from-trap → app
```

- Parameters: registers · memory block · stack.
- Categories: process (`fork`, `exec`, `wait`, `exit`) · file (`open`, `read`, `write`, `close`) · device (`ioctl`) · info (`getpid`) · communication (`pipe`, `socket`) · protection (`chmod`).
- `fork()` → 0 in child, child PID in parent. n forks → **2ⁿ** processes.
- `exec()` replaces the program; `wait()` reaps → otherwise **zombie**.

**Quick check:** how many times does a program with three sequential `fork()` calls followed by `print` print?

<details>
<summary>Answer</summary>

2³ = **8** times.

</details>
