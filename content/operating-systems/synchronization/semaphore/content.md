# Semaphore

**Module:** Synchronization · **Interview priority:** Core

## Concept

A **semaphore** is an integer variable, shared between threads or processes, that is accessed only through two **atomic** operations (introduced by Edsger Dijkstra):

```pseudocode
wait(S):            // also called P(S), down, acquire
    while S <= 0:
        block       // wait until a unit is available
    S = S - 1

signal(S):          // also called V(S), up, release
    S = S + 1       // and wake one waiting process, if any
```

The value counts **available units** of a resource. `wait` takes one (blocking if none are left); `signal` returns one.

Two kinds:

- **Counting semaphore** — any non-negative initial value N; lets up to N threads proceed at once (N printers, N database connections).
- **Binary semaphore** — values 0 and 1 only; used for mutual exclusion or for signalling one event.

## Why It Matters

A mutex answers "only one at a time". Semaphores answer more: "at most N at a time", and "wait until someone else tells you to proceed" (**signalling/ordering** between threads). They are the classic building block for the producer–consumer, readers–writers and dining-philosophers problems — staple interview questions.

## How It Works

### Blocking implementation

Busy-waiting in `wait` wastes CPU, so the OS implements semaphores with a **queue** of sleeping processes:

```pseudocode
semaphore { value; queue }

wait(S):
    S.value = S.value - 1
    if S.value < 0:
        add this process to S.queue and block

signal(S):
    S.value = S.value + 1
    if S.value <= 0:
        remove a process P from S.queue and wake P
```

In this version the value may go **negative**: a value of −k means **k processes are waiting**. Both operations must be atomic (the kernel protects them with a short spinlock or by disabling interrupts).

### Three classic uses

| Use | Initial value | Pattern |
|-----|---------------|---------|
| Mutual exclusion | 1 | `wait(m)` → critical section → `signal(m)` |
| Limit concurrency to N | N | `wait(s)` → use one of N resources → `signal(s)` |
| Ordering / signalling | 0 | Thread A: `S1; signal(s)`. Thread B: `wait(s); S2` → S2 always runs after S1 |

### Producer–consumer (bounded buffer)

A buffer of N slots; producers add items, consumers remove them.

```pseudocode
mutex = 1     // protects the buffer itself
empty = N     // number of free slots
full  = 0     // number of filled slots

producer:                       consumer:
    produce item                    wait(full)    // wait for an item
    wait(empty)   // free slot?     wait(mutex)
    wait(mutex)                     remove item from buffer
    add item to buffer              signal(mutex)
    signal(mutex)                   signal(empty) // one more free slot
    signal(full)  // one more item  consume item
```

> [!WARNING]
> **Order matters.** If the producer does `wait(mutex)` **before** `wait(empty)` and the buffer is full, it sleeps while holding `mutex`; the consumer can never enter to make space — **deadlock**. Always wait on the counting semaphore first, then the mutex.

### Readers–writers and dining philosophers (awareness)

- **Readers–writers:** many readers may read together, but a writer needs exclusive access. A `rw_mutex` (binary) guards writing; a `read_count` protected by its own mutex lets the first reader lock writers out and the last reader let them in. The simple solution can starve writers.
- **Dining philosophers:** five philosophers, five forks, each needs both neighbouring forks. If everyone picks up the left fork first, all wait for the right one — deadlock. Fixes: pick up forks in a global order (lowest number first), allow at most four at the table (a semaphore initialised to 4), or pick up both forks only when both are free.

## Example

Ten worker threads share three database connections, guarded by a counting semaphore with 3 permits:

```java
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicInteger;

public class SemaphoreDemo {

    public static void main(String[] args) throws InterruptedException {
        Semaphore permits = new Semaphore(3);               // 3 connections available
        AtomicInteger inUse = new AtomicInteger();
        AtomicInteger maxInUse = new AtomicInteger();

        Thread[] workers = new Thread[10];
        for (int i = 0; i < workers.length; i++) {
            workers[i] = new Thread(() -> {
                try {
                    permits.acquire();                      // wait(S): blocks when all 3 are taken
                    try {
                        int now = inUse.incrementAndGet();
                        maxInUse.accumulateAndGet(now, Math::max);
                        Thread.sleep(20);                   // use the connection
                        inUse.decrementAndGet();
                    } finally {
                        permits.release();                  // signal(S)
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            });
            workers[i].start();
        }
        for (Thread worker : workers) {
            worker.join();
        }
        System.out.println("Workers finished: " + workers.length);
        System.out.println("Never more than 3 at once: " + (maxInUse.get() <= 3));
        System.out.println("Permits available at the end: " + permits.availablePermits());
    }
}
```

**Output:**

```text
Workers finished: 10
Never more than 3 at once: true
Permits available at the end: 3
```

### Value calculation

A counting semaphore starts at 10. Then 6 `wait` and 4 `signal` operations complete. Final value = 10 − 6 + 4 = **8**. (If more `wait`s than available units arrive, the extra callers block; in the blocking implementation the value goes negative by the number of blocked callers.)

## Important Points

- Semaphore = integer + atomic `wait` (P, decrement, maybe block) and `signal` (V, increment, maybe wake).
- Counting (0…N) limits concurrency; binary (0/1) gives mutual exclusion or signalling.
- Initial value 1 → mutex-like; N → N resources; 0 → "wait for an event".
- Blocking implementation: negative value = number of waiting processes.
- Producer–consumer: `empty = N`, `full = 0`, `mutex = 1`; wait on the counter before the mutex.

## Common Confusion

> [!WARNING]
> **"A semaphore records ownership."** It does not. Any thread may call `signal`, even one that never called `wait`. That is what makes semaphores good for signalling — and what makes them easy to misuse as locks.

- **`wait` does not mean "sleep for a while".** It decrements and blocks only if no unit is available.
- **Missing `signal` = lost permit.** If a thread forgets to release, the pool shrinks permanently; with an initial value of 1, everyone else blocks forever.

## Interview Perspective

- *"What is a semaphore? Explain wait and signal."* — definitions, atomicity, blocking.
- *"Counting vs binary semaphore?"* — range and typical use.
- *"Solve producer–consumer with semaphores."* — three semaphores and the order of `wait`s.
- *"S = 10; 6 P and 4 V operations — final value?"* — 8.
- Follow-up: [Mutex vs Semaphore](../mutex-vs-semaphore/content.md).

## Quick Revision

- wait/P: S−−, block if none. signal/V: S++, wake one.
- Counting: N resources. Binary: 0/1. Init 0: ordering.
- Producer–consumer: empty = N, full = 0, mutex = 1; wait(empty/full) before wait(mutex).
- No ownership; negative value = waiters (blocking version).
