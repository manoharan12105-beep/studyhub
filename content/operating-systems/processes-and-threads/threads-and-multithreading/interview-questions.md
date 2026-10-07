# Threads and Multithreading — Interview Questions

## Beginner

### Q1. What is a thread?

**Style:** Direct

<details>
<summary>Answer</summary>

A thread is the basic unit of CPU execution within a process — an independent sequence of instructions with its own program counter, registers and stack. Threads of the same process share its code, global data, heap and open files. It is often called a lightweight process.

</details>

### Q2. What do threads of the same process share, and what is private to each?

**Style:** Direct

<details>
<summary>Answer</summary>

**Shared:** code (text), global and static data, the heap, open files and sockets, the process ID, and signal handlers.
**Private:** thread ID, program counter, registers, stack (with local variables), thread state and scheduling priority, and thread-local storage.

</details>

### Q3. What are the benefits of multithreading?

**Style:** Direct

<details>
<summary>Answer</summary>

Responsiveness (one thread handles the UI while others work), resource sharing (threads share memory without IPC), economy (creating and switching threads is cheaper than processes), and scalability (threads run in parallel on multiple cores).

</details>

## Intermediate

### Q4. What is the difference between user-level and kernel-level threads?

**Style:** Comparison

<details>
<summary>Answer</summary>

User-level threads are managed by a library in user space; the kernel sees only the process. They are very cheap to create and switch, but if they map to a single kernel thread, one blocking system call blocks them all and they cannot use multiple cores. Kernel-level threads are managed and scheduled by the OS; each can block independently and run on its own core, but creation and switching involve the kernel and cost more.

</details>

### Q5. Explain the many-to-one, one-to-one and many-to-many models.

**Style:** Direct

<details>
<summary>Answer</summary>

- **Many-to-one:** many user threads on one kernel thread — cheap, but no parallelism and one blocking call blocks all.
- **One-to-one:** each user thread has its own kernel thread — true parallelism, independent blocking; limited by kernel resources. Used by Linux, Windows and Java platform threads.
- **Many-to-many:** many user threads multiplexed over a pool of kernel threads — cheap threads with parallelism, more complex. Java 21 virtual threads apply this idea (virtual threads on carrier threads).

</details>

### Q6. If one thread of a process blocks on I/O, do the other threads block too?

**Style:** Trap

<details>
<summary>Answer</summary>

With kernel-level threads (one-to-one, as in Linux, Windows and Java platform threads): no — only that thread waits; the scheduler runs the others. With pure user-level threads on a many-to-one model: yes — the kernel sees one thread, so a blocking system call blocks the whole process.

</details>

### Q7. Do threads have separate stacks? Separate heaps?

**Style:** Trap

<details>
<summary>Answer</summary>

Each thread has its **own stack**, because each has its own chain of method calls and local variables. The **heap is shared** by all threads of the process; an object created by one thread is visible to any thread holding a reference to it. This is why shared heap data needs synchronisation, while local variables are thread-safe by default.

</details>

## Advanced

### Q8. Does adding more threads always make a program faster?

**Style:** Scenario

<details>
<summary>Answer</summary>

No. For CPU-bound work, speed-up stops at about the number of cores; more threads only add context switches, cache contention and memory for stacks. Shared data adds lock contention, and the sequential part of the work limits speed-up (Amdahl's law). For I/O-bound work more threads can help, because threads that wait leave the CPU to others — up to the point where switching and memory costs dominate.

</details>

### Q9. What are Java virtual threads, in OS terms?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Lightweight threads (Java 21) scheduled by the JVM, not the OS. Many virtual threads are mounted onto a small pool of platform (kernel) threads called carriers — a many-to-many style mapping. When a virtual thread blocks on supported I/O, the JVM unmounts it and runs another on the same carrier, so a server can have millions of mostly waiting virtual threads without millions of kernel threads.

</details>
