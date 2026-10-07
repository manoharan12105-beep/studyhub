# Mutex vs Semaphore

**Module:** Synchronization · **Interview priority:** Core

## Concept

Both are synchronisation primitives that can make threads wait, but they answer different questions:

- A **[mutex](../mutex/content.md)** is a **locking** mechanism: "only one thread at a time may use this resource, and the thread that locked it must unlock it."
- A **[semaphore](../semaphore/content.md)** is a **signalling / counting** mechanism: "N units are available; take one or give one back — any thread may give one back."

Short version: **a mutex is owned; a semaphore is counted.**

## Why It Matters

"Difference between mutex and semaphore?" is one of the most frequently asked OS questions, and the common answer "a mutex is a binary semaphore" is the trap. The real difference is **ownership and purpose**, and it changes how you design code: protecting data vs coordinating threads.

## How It Works

### Ownership

- A mutex remembers its **owner**. Unlocking from another thread is an error (Java's `ReentrantLock.unlock()` throws `IllegalMonitorStateException`). Ownership enables **reentrancy**, **priority inheritance** (to fix priority inversion) and error detection.
- A semaphore has **no owner**. Thread A can `wait` and thread B can `signal`. This is exactly what signalling between threads needs ("B tells A the data is ready").

### Value range

- Mutex: locked or unlocked.
- Semaphore: 0 … N (counting) or 0/1 (binary).

### Binary semaphore vs mutex

A binary semaphore initialised to 1 *can* provide mutual exclusion, but:

| | Mutex | Binary semaphore |
|---|-------|------------------|
| Owner | Yes | No |
| Who can release | Only the owner | Any thread |
| Reentrant possible | Yes | No (a second `wait` by the same thread blocks it) |
| Priority inheritance | Possible | Not possible (no owner to boost) |
| Typical use | Protect a critical section | Signal an event between threads |

### Choosing

```text
Protect shared data so one thread at a time changes it?        → mutex
Allow up to N threads to use N identical resources?            → counting semaphore
Make thread B wait until thread A says "ready" (ordering)?     → semaphore initialised to 0
                                                                 (or a condition variable)
```

## Example

**Mutex scenario — printer queue data structure:** many threads add jobs to one linked list. Each add must finish before another starts, and the same thread that locks will unlock. → **Mutex.**

**Counting semaphore scenario — connection pool:** a server has 10 database connections. A request waits only if all 10 are in use. → **Semaphore initialised to 10.**

**Signalling scenario — interrupt handler and worker:** a device interrupt handler receives data and must wake a worker thread to process it. The handler never "locked" anything; it just announces an event. → **Semaphore initialised to 0**: worker `wait`s, handler `signal`s. A mutex cannot do this, because the handler is not the owner.

## Comparison

| Aspect | Mutex | Semaphore |
|--------|-------|-----------|
| Purpose | Locking: mutual exclusion | Signalling and counting resources |
| Value | Locked / unlocked | Integer 0 … N |
| Ownership | Yes — owner must unlock | No — any thread may signal |
| Threads allowed in at once | 1 | Up to N (counting) |
| Operations | lock / unlock | wait (P) / signal (V) |
| Reentrancy | Often supported | No |
| Priority inversion fix | Priority inheritance possible | Not directly |
| Java | `synchronized`, `ReentrantLock` | `java.util.concurrent.Semaphore` |
| Typical misuse | Unlocking from another thread | Using as a lock and forgetting to signal |

## Important Points

- Mutex = ownership + mutual exclusion. Semaphore = counter + signalling.
- A binary semaphore is **not** the same as a mutex: no owner, no reentrancy, no priority inheritance.
- Use a counting semaphore for "N resources"; a 0-initialised semaphore for "wait for an event".
- Both can cause deadlock if acquired in inconsistent order.

## Common Confusion

> [!WARNING]
> **"A mutex is just a binary semaphore."** They behave alike only in the simplest case. A mutex's owner rule catches bugs (another thread unlocking) and enables priority inheritance; a binary semaphore deliberately allows any thread to signal.

- **"Semaphores are faster/slower."** Speed is not the distinction; purpose is. Both are typically built on the same atomic instructions and wait queues.
- **"A semaphore with value 1 is always a lock."** Only if every thread does `wait` then `signal` on its own. One stray `signal` raises the value to 2 and lets two threads into the critical section.

## Interview Perspective

- *"Mutex vs semaphore?"* — lead with ownership and purpose, then value range, then examples.
- *"Is a binary semaphore the same as a mutex?"* — no: ownership, reentrancy, priority inheritance.
- *"Which would you use for a connection pool? For signalling from an interrupt handler?"* — counting semaphore; 0-initialised semaphore.

## Quick Revision

- Mutex: lock, owned, one at a time, owner unlocks.
- Semaphore: counter, not owned, N at a time, anyone signals.
- Binary semaphore ≠ mutex (no owner, no reentrancy, no priority inheritance).
- Data protection → mutex. N resources → counting semaphore. Event → semaphore(0).
