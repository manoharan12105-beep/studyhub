# OS Architecture Basics — Interview Questions

## Beginner

### Q1. What is a monolithic kernel?

**Style:** Direct

<details>
<summary>Answer</summary>

A kernel in which all OS services — process scheduling, memory management, file systems, device drivers and networking — run together in kernel mode in one address space and call each other directly as functions. It is fast but a bug in any part can crash the whole system. Linux and traditional UNIX are monolithic.

</details>

### Q2. What is a microkernel?

**Style:** Direct

<details>
<summary>Answer</summary>

A kernel that keeps only the minimum in kernel mode — inter-process communication, basic scheduling and basic memory management — and runs file systems, device drivers and network stacks as user-mode server processes that communicate by message passing. Examples: QNX, MINIX 3, seL4.

</details>

## Intermediate

### Q3. Compare monolithic and microkernel architectures.

**Style:** Comparison

<details>
<summary>Answer</summary>

| | Monolithic | Microkernel |
|---|---|---|
| Kernel-mode code | All services | IPC, scheduling, basic memory |
| Communication | Function calls | Messages |
| Speed | Faster | Slower (extra messages and mode switches) |
| Fault isolation | Weak | Strong — a failed service restarts |
| Size | Large | Small, easier to verify |

Monolithic favours performance; microkernels favour reliability and security.

</details>

### Q4. Is Linux a monolithic kernel or a microkernel? What about Windows?

**Style:** Trap

<details>
<summary>Answer</summary>

Linux is a **monolithic** kernel that is **modular**: drivers and file systems can be loaded and unloaded at run time as kernel modules, but they run in kernel mode. Windows (the NT family) is usually described as a **hybrid** kernel: largely monolithic for performance, with a microkernel-inspired structure. macOS's XNU is also hybrid (Mach + BSD).

</details>

### Q5. What is the layered approach, and what is its main disadvantage?

**Style:** Direct

<details>
<summary>Answer</summary>

The OS is split into layers, each using only the services of the layer directly below it (hardware at the bottom, user interface at the top). This makes design and debugging simple — each layer can be tested on top of a verified lower layer. Disadvantages: it is hard to order the layers because real components depend on each other in both directions, and each request passes through many layers, which adds overhead.

</details>

## Advanced

### Q6. Why are microkernels common in automotive and medical systems?

**Style:** Scenario

<details>
<summary>Answer</summary>

These systems value reliability and safety above raw throughput. With drivers and services in user mode, a fault in one component cannot corrupt the kernel; it can be detected and restarted while the rest keeps running. The small kernel is also easier to certify — seL4 even has a formal proof of correctness. The cost of extra IPC is acceptable for these workloads.

</details>

### Q7. Do loadable kernel modules make a kernel more fault-tolerant?

**Style:** Trap

<details>
<summary>Answer</summary>

No. Modules make the kernel more **flexible** — drivers load only when needed and can be updated without rebuilding the kernel — but once loaded they run in kernel mode in the kernel's address space. A buggy module can still crash the system. Fault isolation requires running the service in user mode, as microkernels do.

</details>
