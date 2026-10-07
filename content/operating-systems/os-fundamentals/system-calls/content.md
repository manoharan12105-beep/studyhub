# System Calls

**Module:** OS Fundamentals · **Interview priority:** Core

## Concept

A **system call** is the programming interface through which a user program asks the kernel for a service it cannot perform itself in user mode — reading a file, creating a process, allocating memory, sending network data. It is the only controlled doorway from user mode into kernel mode for requests.

Programs rarely make system calls directly. They call a library or language API (`printf`, `FileInputStream.read`, `new ProcessBuilder(...).start()`), and the library makes the system call (`write`, `read`, `fork`/`execve` or `CreateProcess`).

## Why It Matters

Hardware resources are protected by [kernel mode](../user-mode-and-kernel-mode/content.md). Without system calls, a user program could not touch a file or the network at all; with unrestricted access, it could damage everything. System calls give **controlled access**: the kernel validates every argument and permission before acting.

## How It Works

### Steps of a system call

```text
 user mode   app calls read(fd, buf, 100)            ① library wrapper
             wrapper puts the syscall number and
             arguments in registers                   ②
             executes the trap instruction (syscall) ③ ──┐
 ─────────────────────────────────────────────────────────┼─ mode switch
 kernel mode CPU saves user state, jumps to handler   ④ ◀─┘
             handler looks up the number in the
             system-call table → sys_read()           ⑤
             checks fd, buffer address, permissions;
             does the work (may block for I/O)        ⑥
             puts the result in a register, returns   ⑦ ──┐
 ─────────────────────────────────────────────────────────┼─ mode switch
 user mode   wrapper returns bytes read (or −1/error) ⑧ ◀─┘
```

Each system call has a **number**; the kernel's **system-call table** maps numbers to handler functions. The program cannot jump into the kernel anywhere else.

### Passing parameters

1. **In registers** — fastest; used for most calls on modern CPUs.
2. **In a block (table) in memory** — the address of the block goes in a register; used when there are many parameters.
3. **On the stack** — pushed by the program, read by the kernel.

### Types of system calls

| Category | Purpose | UNIX/Linux examples | Windows examples |
|----------|---------|---------------------|------------------|
| Process control | Create, run, end, wait for processes | `fork`, `execve`, `exit`, `wait` | `CreateProcess`, `ExitProcess`, `WaitForSingleObject` |
| File management | Create, open, read, write, close files | `open`, `read`, `write`, `close` | `CreateFile`, `ReadFile`, `WriteFile` |
| Device management | Request, release, control devices | `ioctl`, `read`, `write` | `DeviceIoControl` |
| Information maintenance | Get/set time, process or system data | `getpid`, `time`, `uname` | `GetCurrentProcessId`, `GetSystemTime` |
| Communication | Pipes, shared memory, sockets, messages | `pipe`, `shmget`, `socket`, `send` | `CreatePipe`, `MapViewOfFile` |
| Protection | Permissions and ownership | `chmod`, `chown`, `umask` | `SetFileSecurity` |

### fork, exec and wait (UNIX process creation)

- `fork()` creates a **child process** that is a copy of the parent. It returns **twice**: `0` in the child, and the **child's PID** in the parent (or `−1` on failure).
- `exec()` (for example `execve`) **replaces** the calling process's program with a new one; on success it never returns.
- `wait()` makes the parent wait until a child exits and collects its exit status (otherwise the child stays a **zombie**).

A shell running `ls` does exactly this: `fork()`, the child calls `exec("ls")`, the parent calls `wait()`.

## Example

Predict how many times "hello" is printed:

```pseudocode
fork()
fork()
fork()
print("hello")
```

Each `fork()` doubles the number of processes: 1 → 2 → 4 → 8. All eight processes reach `print`, so **"hello" is printed 8 times**. In general, *n* sequential `fork()` calls create 2ⁿ processes (2ⁿ − 1 of them new children).

A Java view of the same idea: `ProcessBuilder.start()` in the JVM ends up in the OS's process-creation calls (`fork`/`posix_spawn` + `execve` on Linux, `CreateProcess` on Windows), and `Process.waitFor()` corresponds to waiting for the child's exit status.

## Comparison

| | Library function | System call |
|---|------------------|-------------|
| Runs in | User mode | Kernel mode (handler) |
| Cost | Ordinary function call | Mode switch + checks (much more expensive) |
| Example | `printf`, `strlen`, `Math.max` | `write`, `read`, `fork` |
| Relationship | May call zero, one or many system calls | Called by libraries or directly |

`strlen` never enters the kernel; `printf` buffers text and eventually calls `write`.

## Important Points

- System call = controlled request from user mode into kernel mode.
- Path: library wrapper → registers → trap → system-call table → handler → return.
- Six categories: process control, file, device, information, communication, protection.
- `fork` returns 0 to the child and the child's PID to the parent; `exec` replaces the program; `wait` reaps the child.
- System calls are expensive compared with function calls — libraries buffer I/O to make fewer of them.

## Common Confusion

> [!WARNING]
> **"`printf` is a system call."** It is a C library function. It formats text into a buffer and calls the `write` system call when the buffer is flushed — possibly once for many `printf` calls.

- **"`fork` creates a new program."** It duplicates the current one. `exec` loads a different program.
- **"A system call always blocks."** Only some do (a `read` waiting for disk or network). Many return immediately (`getpid`).

## Interview Perspective

- *"What is a system call? Walk through what happens."* — trap, mode switch, table lookup, validation, return.
- *"Types of system calls with examples?"* — the six categories.
- *"How many times does this print?"* — 2ⁿ for n sequential forks; watch for `if (fork() == 0)` conditions.
- *"System call vs library call?"* — mode, cost, `printf` vs `write`.

## Quick Revision

- System call: user program → kernel service, via trap; validated by kernel.
- Parameters: registers, memory block, stack.
- Categories: process, file, device, info, communication, protection.
- fork → 0 in child, PID in parent; exec replaces; wait reaps. n forks → 2ⁿ processes.
