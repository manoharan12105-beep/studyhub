# Threads and Multithreading

**Module:** Processes and Threads · **Interview priority:** Core

## Concept

A **thread** is the smallest unit of execution the OS schedules: a single sequence of instructions with its own **program counter, registers and stack**. A process contains one or more threads. All threads of a process share its **address space** (code, global data, heap) and its **resources** (open files, sockets).

**Multithreading** means one process runs several threads, so it can do several things concurrently — and, on a multi-core CPU, truly in parallel.

```text
 Process
 ┌──────────────────────────────────────────────────┐
 │ shared: code · global data · heap · open files    │
 │                                                  │
 │  Thread 1          Thread 2          Thread 3    │
 │  PC, registers     PC, registers     PC, regs    │
 │  stack             stack             stack       │
 └──────────────────────────────────────────────────┘
```

## Why It Matters

Processes are heavy: creating one copies or sets up an entire address space, and processes communicate only through the OS. Threads are **lightweight**: creating one needs only a stack and a control block, switching between them keeps the same memory map, and they communicate through shared memory directly. That makes threads the natural way to keep a program responsive and to use several cores.

## How It Works

### Benefits of multithreading

1. **Responsiveness** — a GUI thread keeps reacting to clicks while a worker thread loads a file.
2. **Resource sharing** — threads share memory without any special IPC setup.
3. **Economy** — creating and switching threads is cheaper than creating and switching processes.
4. **Scalability** — threads of one process can run on different cores simultaneously.

The price: shared data needs **synchronisation**; otherwise [race conditions](../../synchronization/race-conditions/content.md) corrupt it. One thread's crash (for example a segmentation fault) usually kills the whole process.

### User-level vs kernel-level threads

| Aspect | User-level threads | Kernel-level threads |
|--------|-------------------|----------------------|
| Managed by | A thread library in user space | The OS kernel |
| Kernel aware of them? | No — sees one process | Yes — schedules each thread |
| Create/switch cost | Very cheap (no system call) | More expensive (kernel involvement) |
| One thread blocks on I/O | The whole process blocks (if mapped to one kernel thread) | Only that thread blocks |
| Use several cores | No (if mapped to one kernel thread) | Yes |
| Examples | Early "green threads" in Java, coroutines | Linux threads (NPTL), Windows threads, Java platform threads |

### Multithreading models (user threads → kernel threads)

- **Many-to-one:** many user threads on one kernel thread. Cheap, but one blocking call blocks all, and no parallelism.
- **One-to-one:** each user thread is a kernel thread. True parallelism and independent blocking; creating many threads costs kernel resources. Used by Linux, Windows and Java platform threads.
- **Many-to-many:** many user threads multiplexed over a smaller or equal number of kernel threads. Combines cheap threads with parallelism; harder to implement. Java 21 **virtual threads** follow this idea: many virtual threads are scheduled by the JVM onto a few carrier (kernel) threads.

## Example

Two threads of one Java process sum halves of the same array. Both read the shared `numbers` array and write into the shared `partial` array — no copying, no IPC — and `join()` makes `main` wait for both.

```java
public class ThreadSumDemo {

    static long sum(int[] values, int from, int to) {
        long total = 0;
        for (int i = from; i < to; i++) {
            total += values[i];
        }
        return total;
    }

    public static void main(String[] args) throws InterruptedException {
        int[] numbers = new int[1_000];
        for (int i = 0; i < numbers.length; i++) {
            numbers[i] = i + 1;                       // 1, 2, …, 1000
        }
        long[] partial = new long[2];                 // each thread writes only its own slot

        Thread first = new Thread(() -> partial[0] = sum(numbers, 0, 500));
        Thread second = new Thread(() -> partial[1] = sum(numbers, 500, 1_000));
        first.start();                                // both now run concurrently
        second.start();
        first.join();                                 // wait for both before reading results
        second.join();

        System.out.println("first half  = " + partial[0]);
        System.out.println("second half = " + partial[1]);
        System.out.println("total       = " + (partial[0] + partial[1]));
    }
}
```

**Output:**

```text
first half  = 125250
second half = 375250
total       = 500500
```

The threads never write the same variable, so no lock is needed. If both added into one shared `total`, the result could be wrong — that is the race condition the Synchronization module solves.

## Important Points

- Thread = PC + registers + stack; shares code, data, heap and files with its process's other threads.
- Benefits: responsiveness, sharing, economy, scalability.
- User-level threads are cheap but invisible to the kernel; kernel-level threads can block independently and run in parallel.
- Models: many-to-one, one-to-one (Linux, Windows, Java platform threads), many-to-many (Java virtual threads follow this idea).
- Shared memory makes communication easy and synchronisation necessary.

## Common Confusion

> [!WARNING]
> **"Threads have their own heap."** No — threads share the process heap. Each thread has its own **stack** (and registers). Objects created by one thread are visible to all threads that hold a reference.

- **"More threads always means faster."** Beyond the number of cores (for CPU-bound work), extra threads add context switches and contention.
- **"A thread crash only kills that thread."** A fatal error in native code, such as a segmentation fault, kills the whole process. (In Java, an uncaught exception ends only its thread, but `System.exit` or a JVM crash ends all.)

## Interview Perspective

- *"What is a thread? What do threads share and not share?"* — shared: code, data, heap, files. Private: PC, registers, stack, thread state.
- *"User-level vs kernel-level threads?"* — who manages them, blocking, parallelism.
- *"Explain multithreading models."* — many-to-one, one-to-one, many-to-many, with an example of each.
- Leads into [Process vs Thread](../process-vs-thread/content.md).

## Quick Revision

- Thread: own PC, registers, stack; shares code, data, heap, files.
- Benefits: responsiveness, sharing, economy, scalability. Cost: synchronisation.
- User threads: cheap, kernel-blind. Kernel threads: independent blocking, multi-core.
- Models: M:1, 1:1 (Linux/Windows/Java), M:N.
