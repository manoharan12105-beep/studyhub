# OS Architecture Basics

**Module:** OS Fundamentals · **Interview priority:** Frequently asked

## Concept

**OS architecture** (kernel structure) is how the kernel's parts — scheduler, memory manager, file systems, drivers, networking — are organised, and which of them run in kernel mode. The interview-level designs are **monolithic**, **layered**, **microkernel**, **modular** and **hybrid** kernels.

## Why It Matters

The structure decides three trade-offs: **performance** (how cheaply parts talk to each other), **reliability** (whether one buggy part crashes everything) and **maintainability** (how easily parts are changed or added). Every real kernel is a compromise between them.

## How It Works

### Monolithic kernel

All OS services — scheduling, memory management, file systems, drivers, networking — run together in **one large program in kernel mode**, calling each other as ordinary functions.

- **Fast:** a file system calling a driver is a function call.
- **Risky:** a bug in any driver can crash the whole kernel; the code base is huge.
- Examples: traditional UNIX, Linux (monolithic, but modular — see below), MS-DOS (no protection at all).

### Layered approach

The OS is divided into layers; layer *n* uses only the services of layer *n − 1*. Hardware is layer 0, the user interface the top.

- **Easy to design and debug** layer by layer.
- **Slow and hard to define:** a request passes through many layers, and real dependencies do not stack neatly (the memory manager needs the disk driver, which needs memory).

### Microkernel

Only the essentials stay in kernel mode: **IPC (message passing), basic scheduling and basic memory management**. File systems, drivers and networking run as **user-mode servers** that communicate by messages.

- **Reliable and secure:** a crashing driver is a user process that can be restarted.
- **Extensible:** add a service without changing the kernel.
- **Slower:** a file read becomes several messages and mode switches.
- Examples: MINIX 3, QNX, seL4; Mach (inside macOS's XNU).

### Modular kernel (loadable modules)

A core kernel plus **modules loaded and unloaded at run time** — drivers, file systems. Modules still run in kernel mode, so performance stays monolithic while flexibility improves. Linux works this way (`lsmod`, `modprobe`).

### Hybrid kernel

A practical mix: a mostly monolithic kernel for speed, with some microkernel ideas (message-based subsystems, some services in user mode).

- Examples: Windows NT family (Windows 10/11), macOS XNU (Mach microkernel + BSD in one kernel space).

```text
 Monolithic                  Microkernel
 ┌──────────────────────┐    ┌──────┐ ┌──────┐ ┌──────┐   user mode
 │ apps                 │    │ apps │ │ file │ │driver│
 ├──────────────────────┤    │      │ │server│ │server│
 │ FS │ net │ drivers   │    └──┬───┘ └──┬───┘ └──┬───┘
 │ scheduler │ memory   │       └──── messages ───┘
 │   (all kernel mode)  │    ┌──────────────────────┐   kernel mode
 └──────────────────────┘    │ IPC, scheduling, VM  │
                             └──────────────────────┘
```

## Example

A USB driver has a null-pointer bug.

- **Monolithic (Linux):** the bug runs in kernel mode and can cause a kernel panic — the whole system stops.
- **Microkernel (QNX):** the driver is a user process; it crashes, the kernel notices, and a supervisor restarts the driver while everything else keeps running. This is why microkernels are popular in cars and medical devices.

The price: on the microkernel, every USB transfer costs extra messages and mode switches.

## Comparison

| Aspect | Monolithic | Microkernel | Hybrid |
|--------|-----------|-------------|--------|
| In kernel mode | Everything | IPC, basic scheduling, basic memory | Most services |
| Communication | Function calls | Message passing | Mostly function calls |
| Performance | Highest | Lower (messages, switches) | High |
| Fault isolation | Poor — one bug can crash all | Good — services restart | Medium |
| Kernel size | Large | Small | Large |
| Examples | Linux, classic UNIX | MINIX 3, QNX, seL4 | Windows NT, macOS XNU |

## Important Points

- Monolithic = fast, one address space, weak isolation.
- Microkernel = minimal kernel, services in user space, strong isolation, IPC overhead.
- Linux is monolithic **and** modular; Windows and macOS are hybrid.
- Loadable modules still run in kernel mode — modularity is not isolation.

## Common Confusion

> [!WARNING]
> **"Linux is a microkernel because it has loadable modules."** No. Modules are loaded *into* the kernel and run in kernel mode. A microkernel runs services *outside* the kernel, in user mode.

- **"Microkernels are always slow."** Early ones were; modern designs (L4, seL4, QNX) made IPC fast. The overhead is real but often acceptable when reliability matters more.

## Interview Perspective

- *"Monolithic vs microkernel?"* — what runs in kernel mode, function calls vs messages, speed vs isolation, one example each.
- *"Which is Linux / Windows?"* — Linux: monolithic, modular. Windows: hybrid.
- *"Why would a car or medical device use a microkernel?"* — fault isolation and restartable services.

## Quick Revision

- Monolithic: everything in kernel mode; fast; one bug can crash all (Linux).
- Microkernel: IPC + scheduling + memory in kernel; rest in user mode; reliable, slower (QNX, MINIX).
- Layered: each layer uses the one below; clean but slow.
- Modular: load drivers at run time, still kernel mode. Hybrid: Windows, macOS.
