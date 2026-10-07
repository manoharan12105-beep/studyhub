# Process vs Thread — Interview Questions

## Beginner

### Q1. What is the difference between a process and a thread?

**Style:** Comparison

<details>
<summary>Answer</summary>

A process is a program in execution with its own address space and resources; it is isolated from other processes. A thread is a unit of execution inside a process; threads of a process share its code, data, heap and open files but each has its own program counter, registers and stack. Threads are cheaper to create and switch and communicate through shared memory; processes are isolated and communicate through IPC.

</details>

### Q2. Why is a thread called a lightweight process?

**Style:** Why

<details>
<summary>Answer</summary>

Because it can execute independently like a process but needs far fewer resources: creating a thread does not create a new address space or page tables — only a stack and a thread control block. Switching between threads of the same process also avoids changing the memory map, so it is faster.

</details>

### Q3. How do processes communicate compared with threads?

**Style:** Comparison

<details>
<summary>Answer</summary>

Processes have separate address spaces, so they use inter-process communication provided by the OS: pipes, message queues, sockets, signals, or explicitly created shared-memory segments. Threads share the process's memory, so they communicate by reading and writing shared variables directly — which requires synchronisation (locks, semaphores) to avoid race conditions.

</details>

## Intermediate

### Q4. When would you choose multiple processes over multiple threads?

**Style:** Scenario

<details>
<summary>Answer</summary>

When isolation matters more than sharing speed: running untrusted or crash-prone code (browser tabs, plugins), separating privileges (a privileged process and an unprivileged worker), surviving crashes (a supervisor restarts a failed worker process), or running components written in different languages. Threads suit tightly cooperating tasks that share large data, such as request handlers sharing a cache.

</details>

### Q5. If one thread in a process crashes, what happens to the others?

**Style:** Trap

<details>
<summary>Answer</summary>

A fatal crash — a segmentation fault or other unhandled hardware exception in native code — terminates the **whole process**, including all its threads, because they share one address space. In Java, an uncaught exception terminates only the thread that threw it; the JVM keeps running other threads. But a JVM crash or `System.exit()` ends every thread.

</details>

### Q6. Which is faster to context switch — two threads of the same process or two processes? Why?

**Style:** Why

<details>
<summary>Answer</summary>

Two threads of the same process. They share the address space, so the kernel swaps only registers, program counter and stack pointer; the page table, TLB contents and much of the cache remain valid. A process switch also changes the page table and usually flushes or invalidates TLB entries, after which the new process suffers cache and TLB misses.

</details>

### Q7. Do threads of the same process have the same PID?

**Style:** Trap

<details>
<summary>Answer</summary>

Yes, in the POSIX sense: `getpid()` returns the same process ID in every thread, and each thread has its own thread ID. On Linux each thread is a separate kernel task with its own task ID (visible with `gettid()` or `ps -L`), grouped under the process's thread-group ID, which is the PID.

</details>

## Advanced

### Q8. Why does Chrome use a process per site but threads inside each process?

**Style:** Scenario

<details>
<summary>Answer</summary>

Processes give isolation: a crash or a security exploit in one site's renderer cannot read or corrupt another site's memory, and the sandbox can restrict each process's privileges. Within a renderer, the parser, JavaScript engine, compositor and network tasks must share the page's data at high speed, so they are threads. The design uses each mechanism for what it does best, at the cost of extra memory for separate processes.

</details>

### Q9. A server handles each request in a new process (fork per request). It is slow under load. What changes would you suggest and what is the trade-off?

**Style:** Design

<details>
<summary>Answer</summary>

Process creation and process context switches are expensive. Switch to a **thread pool** (reuse a fixed set of threads), or a **pre-forked process pool**, or an event-driven model. A thread pool is fastest and shares caches easily, but loses isolation — a memory-corruption bug can take down the whole server and shared data needs synchronisation. A pre-forked pool keeps isolation and avoids creation cost per request.

</details>
