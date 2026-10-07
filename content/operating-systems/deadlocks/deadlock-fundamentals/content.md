# What Is Deadlock?

**Module:** Deadlocks · **Interview priority:** Core

## Concept

A **deadlock** is a situation in which a set of processes (or threads) are **all blocked**, each **waiting for a resource held by another process in the same set**. None of them can proceed, release what it holds, or be woken — they wait forever unless something outside intervenes.

Resources can be locks, semaphores, files, printers, memory or database rows. A process uses a resource in three steps: **request** (wait if unavailable) → **use** → **release**.

## Why It Matters

Deadlocks freeze parts of real systems: two database transactions lock rows in opposite orders, two threads take two mutexes in opposite orders, a producer holds a lock while waiting for buffer space. Interviews cover the definition, the [four necessary conditions](../deadlock-conditions/content.md), the resource-allocation graph and the four ways of handling deadlock.

## How It Works

### The smallest deadlock

```text
 Thread T1                        Thread T2
 lock(A)          ✓               lock(B)          ✓
 lock(B)   ← waits for T2         lock(A)   ← waits for T1
```

T1 holds A and wants B; T2 holds B and wants A. Each waits for the other. Neither will ever release.

```java
// Run concurrently by two threads, these two methods can deadlock.
private final Object accountA = new Object();
private final Object accountB = new Object();

void transferAtoB() {
    synchronized (accountA) {
        synchronized (accountB) { /* move money */ }
    }
}

void transferBtoA() {
    synchronized (accountB) {          // opposite order
        synchronized (accountA) { /* move money */ }
    }
}
```

### Resource-allocation graph (RAG)

A directed graph that shows who holds and who wants what:

- **Process node** (circle) and **resource node** (square, with one dot per instance).
- **Request edge** P → R: process P is waiting for resource R.
- **Assignment edge** R → P: an instance of R is held by P.

```text
      ┌────┐  holds   ┌────┐  wants   ┌────┐
      │ R1 │ ───────▶ │ P1 │ ───────▶ │ R2 │
      └────┘          └────┘          └────┘
        ▲                               │ holds
        │ wants       ┌────┐            │
        └──────────── │ P2 │ ◀──────────┘
                      └────┘
   Cycle: P1 → R2 → P2 → R1 → P1
```

Reading the graph:

- **No cycle → no deadlock.**
- **Cycle and every resource has a single instance → deadlock.**
- **Cycle with multi-instance resources → deadlock is possible but not certain:** another process holding an instance may finish and release it, breaking the cycle.

### Four ways to handle deadlock

| Strategy | Idea | Example |
|----------|------|---------|
| **Prevention** | Design so one of the four necessary conditions can never hold | Always lock in a fixed global order |
| **Avoidance** | Check each request; grant only if the system stays in a safe state | [Banker's algorithm](../bankers-algorithm/content.md) |
| **Detection and recovery** | Let deadlocks happen, detect cycles, then break them | Databases abort one transaction |
| **Ignore it** ("ostrich algorithm") | Assume deadlocks are rare; let the user or admin restart | Most general-purpose OSes for application locks |

## Example

Narrow-bridge traffic: cars from both sides drive onto a one-lane bridge and meet in the middle. Each car holds part of the bridge and needs the part the other holds. No one can move forward; the jam clears only if one car backs up (preemption/rollback).

In a database: transaction T1 updates row 1 then row 2; transaction T2 updates row 2 then row 1. PostgreSQL detects the wait cycle and aborts one transaction with `ERROR: deadlock detected`, letting the other commit — detection and recovery.

## Comparison

| | Deadlock | Starvation | Livelock |
|---|----------|------------|----------|
| State of processes | Blocked, waiting on each other | Ready/waiting, repeatedly passed over | Running, but making no progress |
| Cause | Circular wait on resources | Unfair scheduling or allocation policy | Processes keep reacting to each other |
| Ends by itself? | Never | Possibly, if load changes | Possibly, by chance |
| Example | Two threads, two locks, opposite order | Low-priority process under constant high-priority load | Two people in a corridor stepping aside the same way again and again |
| Fix | Prevention, avoidance, detection | Aging, fair queues | Random back-off |

## Important Points

- Deadlock = a set of processes each waiting for a resource held by another in the set.
- Resource use: request → use → release.
- RAG: cycle is necessary for deadlock; sufficient only when each resource has one instance.
- Handling: prevention, avoidance, detection and recovery, or ignore.
- Deadlock ≠ starvation ≠ livelock.

## Common Confusion

> [!WARNING]
> **"A cycle in the resource-allocation graph always means deadlock."** Only when every resource in the cycle has exactly one instance. With several instances, a process outside the cycle may release an instance and break it.

- **"Deadlock is just a slow system."** A deadlocked set never makes progress by itself; waiting longer does not help.
- **Deadlock vs starvation:** in starvation the process could run; in deadlock it cannot.

## Interview Perspective

- *"What is a deadlock? Give an example."* — two threads, two locks, opposite order.
- *"What is a resource-allocation graph? Does a cycle imply deadlock?"* — single vs multiple instances.
- *"Deadlock vs starvation vs livelock?"* — the comparison table.
- *"How do operating systems handle deadlock?"* — four strategies; most OSes ignore it for application resources.

## Quick Revision

- Deadlock: circular waiting, nobody can proceed.
- RAG: P → R request, R → P assignment; cycle + single instances = deadlock.
- Handle: prevent, avoid (Banker's), detect and recover, or ignore.
- Starvation: could run, never chosen. Livelock: active but no progress.
