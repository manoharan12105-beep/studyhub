# Context Switching

**Module:** Processes and Threads · **Interview priority:** Core

## Concept

A **context switch** is the kernel taking the CPU away from one process (or thread) and giving it to another: it **saves** the current one's CPU state (its *context*) and **restores** the next one's saved state. The context is the program counter, stack pointer, registers, flags and — for a different process — the memory map.

Context switching is what makes multitasking possible: one CPU appears to run many programs at once by switching between them many times per second.

## Why It Matters

Context switches are **pure overhead**: while switching, the CPU does no useful work for any application. Too few switches make the system unresponsive; too many waste CPU time. Scheduling decisions (time-slice length, preemption) are largely about this trade-off.

## How It Works

### When a context switch happens

- **Preemption** — the timer interrupt says the time slice is over, or a higher-priority process becomes ready.
- **Blocking** — the running process waits for I/O, a lock, a message or `sleep()`.
- **Termination** — the running process exits.
- **Yield** — the process gives up the CPU voluntarily.

### Steps

```text
 Process A running (user mode)
      │  timer interrupt / system call that blocks
      ▼
 ① CPU enters kernel mode; A's registers saved on its kernel stack
 ② Kernel copies A's context into A's PCB; A's state → Ready or Waiting;
    A's PCB moves to the ready queue or a device queue
 ③ Scheduler chooses process B from the ready queue
 ④ Kernel switches the memory map to B's page table (flushing or tagging the TLB)
 ⑤ Kernel loads B's context from B's PCB; B's state → Running
 ⑥ Return to user mode: B continues at its saved program counter
```

### Why it costs time

- **Direct cost:** saving and loading registers, running the scheduler, switching page tables — on the order of **microseconds** on modern hardware.
- **Indirect cost (often larger):** after the switch, the CPU caches and the **TLB** hold A's data, not B's. B runs slowly at first while caches refill ("cold caches").

### Process switch vs thread switch

Switching between two **threads of the same process** keeps the same address space: no page-table switch and no TLB flush, and shared data may still be in the cache. It is therefore **cheaper** than switching between two processes. See [Process vs Thread](../process-vs-thread/content.md).

### Context switch vs mode switch

A system call or interrupt is a **mode switch** (user ↔ kernel) and does not by itself change the running process. A context switch changes *who* runs. Every context switch happens in kernel mode, but most mode switches are not context switches.

## Example

Round Robin with a 4 ms time slice and a 0.1 ms context-switch cost: every 4.1 ms of CPU time, 0.1 ms is overhead — about **2.4 %**. With a 0.5 ms slice, the overhead becomes 0.1 / 0.6 ≈ **16.7 %**. A smaller quantum improves responsiveness but burns more CPU on switching.

```text
 overhead fraction = switch time ÷ (time slice + switch time)
   4 ms slice:   0.1 ÷ 4.1 ≈ 2.4 %
   0.5 ms slice: 0.1 ÷ 0.6 ≈ 16.7 %
```

## Important Points

- Context switch = save old context to its PCB, load new context from its PCB.
- Triggers: time-slice expiry, higher-priority arrival, blocking, exit, yield.
- Overhead: direct (registers, scheduler, page table) + indirect (cold caches, TLB).
- Thread switches within a process are cheaper than process switches.
- Shorter time slices → more switches → more overhead.

## Common Confusion

> [!WARNING]
> **"Context switch and mode switch are the same."** A mode switch changes the privilege level for the same process. A context switch changes the process or thread that runs.

- **"Context switching makes programs run in parallel."** It interleaves them on one CPU (concurrency). Parallelism needs several cores.
- **"A context switch saves the process's memory."** Memory stays in place; only the CPU state and the pointer to the page table change.

## Interview Perspective

- *"What is a context switch? What happens during one?"* — steps above, mention the PCB.
- *"Why is it overhead?"* — no useful work, cache and TLB effects.
- *"Thread vs process context switch — which is faster and why?"* — threads share the address space.
- *"How does the time quantum affect context switching?"* — see [Round Robin](../../cpu-scheduling/round-robin-scheduling/content.md).

## Quick Revision

- Save context (PC, registers, SP, flags) → PCB; load next → run.
- Triggers: timer, higher priority, block, exit, yield.
- Pure overhead: microseconds + cache/TLB warm-up.
- Thread switch < process switch (same address space). Mode switch ≠ context switch.
