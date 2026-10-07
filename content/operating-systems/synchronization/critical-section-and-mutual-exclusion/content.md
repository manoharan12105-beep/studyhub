# Critical Section and Mutual Exclusion

**Module:** Synchronization · **Interview priority:** Core

## Concept

A **critical section** is the part of a program that accesses **shared resources** (variables, files, devices) and therefore must not be executed by more than one thread or process at the same time.

**Mutual exclusion** is the guarantee that when one thread is executing in its critical section, **no other thread** is executing in its critical section for the same resource.

The **critical-section problem** is to design a protocol — code before and after the critical section — that achieves this correctly.

```pseudocode
while true:
    entry section          // ask for permission (acquire)
        critical section   // use the shared resource
    exit section           // give permission back (release)
    remainder section      // everything else
```

## Why It Matters

A [race condition](../race-conditions/content.md) happens precisely because two threads are inside the critical section at once. Solve the critical-section problem and the race disappears. Interviewers expect the three requirements by name, and often Peterson's solution or test-and-set.

## How It Works

### The three requirements of a correct solution

1. **Mutual exclusion** — at most one process is in the critical section at a time.
2. **Progress** — if no one is in the critical section and some processes want to enter, only those processes take part in deciding who enters, and the decision cannot be postponed forever. (A process in its remainder section must not block others.)
3. **Bounded waiting** — after a process asks to enter, there is a limit on how many times others can enter before it does. (No starvation.)

A fourth practical goal: make **no assumptions about speed** or the number of CPUs.

### Software solution: Peterson's algorithm (two processes)

```pseudocode
shared: flag[0] = flag[1] = false    // flag[i]: process i wants to enter
        turn                         // whose turn it is to yield

process i (other = 1 − i):
    flag[i] = true                   // I want to enter
    turn = other                     // but you go first if you also want to
    while flag[other] and turn == other:
        wait                         // busy-wait
    // critical section
    flag[i] = false                  // I am done
    // remainder section
```

- **Mutual exclusion:** if both want to enter, `turn` can hold only one value, so only one passes the `while`.
- **Progress:** if the other does not want to enter (`flag[other]` false), I enter immediately.
- **Bounded waiting:** after I set `turn = other`, the other can enter at most once before I get in.

Peterson's algorithm is a teaching tool: on modern CPUs, instruction reordering breaks it unless memory barriers are added, so real systems use hardware instructions instead.

### Hardware support

- **Disabling interrupts** — on a single CPU, no preemption can happen inside the critical section. Not usable on multiprocessors (other cores keep running) and dangerous to give to user programs.
- **Test-and-set** — an atomic instruction that reads a lock word and sets it to true in one indivisible step:

```pseudocode
// TestAndSet(lock): atomically { old = lock; lock = true; return old }
acquire: while TestAndSet(lock):   // returns false only for the one thread that got it
             wait
release: lock = false
```

- **Compare-and-swap (CAS)** — atomically "if value == expected, set it to new". The basis of Java's `AtomicInteger` and lock-free data structures.

### Busy waiting vs blocking

- A **spinlock** busy-waits: the thread loops, burning CPU, until the lock is free. Good when the wait is shorter than a context switch, and only on multiprocessors.
- A **blocking lock** ([mutex](../mutex/content.md), [semaphore](../semaphore/content.md)) puts the waiting thread to sleep in a queue; the OS wakes it on release. Good for longer waits.

## Example

A bank transfer `withdraw(a, 100); deposit(b, 100)` updates two shared balances. The critical section is the code that reads and writes the balances. With mutual exclusion:

1. Thread T1 enters (acquires the lock), reads `a = 500`, writes `400`, updates `b`, leaves (releases).
2. Thread T2, which tried to enter at the same time, waits in the entry section and then sees `a = 400`.

Without it, both could read 500 and both write 400 — one withdrawal lost.

Keep critical sections **short**: only the shared-data access, not slow work such as network calls, or every other thread queues behind it.

## Important Points

- Critical section = code touching shared data; must run under mutual exclusion.
- Structure: entry section → critical section → exit section → remainder section.
- Requirements: **mutual exclusion, progress, bounded waiting** (no speed assumptions).
- Solutions: Peterson (software, two processes), disabling interrupts, test-and-set, compare-and-swap, mutexes, semaphores, monitors.
- Spinlocks busy-wait; mutexes and semaphores block.

## Common Confusion

> [!WARNING]
> **"Mutual exclusion alone makes a correct solution."** Strict alternation (`turn` only, no `flag`) guarantees mutual exclusion but violates **progress**: if one process does not want to enter, the other still has to wait for its turn forever.

- **Bounded waiting ≠ progress.** Progress says *someone* gets in; bounded waiting says *each* waiting process gets in within a limit.
- **Disabling interrupts does not work on multicore** systems.

## Interview Perspective

- *"What is a critical section?"* — shared-resource code, needs mutual exclusion.
- *"What are the requirements of a critical-section solution?"* — the three, with one-line meanings.
- *"Explain Peterson's solution."* — `flag` + `turn`, and why each requirement holds.
- *"What is test-and-set? What is a spinlock?"* — atomic hardware primitive; busy waiting.

## Quick Revision

- Entry → critical → exit → remainder.
- Mutual exclusion · progress · bounded waiting.
- Peterson: flag[i] = true; turn = other; wait while flag[other] && turn == other.
- Hardware: test-and-set, compare-and-swap. Spinlock busy-waits; mutex blocks.
