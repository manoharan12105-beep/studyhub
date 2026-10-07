# Mutex — Interview Questions

## Beginner

### Q1. What is a mutex?

**Style:** Direct

<details>
<summary>Answer</summary>

A mutual-exclusion lock used to protect a critical section. A thread calls `lock` before accessing shared data and `unlock` afterwards. If another thread holds the mutex, `lock` blocks until it is released. Only one thread can hold it at a time, and only the thread that locked it can unlock it.

</details>

### Q2. What happens when a thread tries to lock a mutex that is already held by another thread?

**Style:** What happens internally

<details>
<summary>Answer</summary>

The thread is blocked: it is placed in the mutex's wait queue and put to sleep (state Waiting), using no CPU. When the owner unlocks, one waiting thread is woken, becomes the new owner and continues into the critical section. Some implementations spin for a short time before sleeping, in case the lock is released quickly.

</details>

### Q3. What is the difference between a mutex and a spinlock?

**Style:** Comparison

<details>
<summary>Answer</summary>

A waiting thread on a **mutex** sleeps and is woken on release — no CPU wasted, but two context switches. A waiting thread on a **spinlock** loops checking the lock — no context switches, but CPU is burned while waiting. Spinlocks suit very short critical sections on multiprocessors (common inside kernels); mutexes suit everything else.

</details>

## Intermediate

### Q4. What is a reentrant mutex?

**Style:** Direct

<details>
<summary>Answer</summary>

A mutex that the owning thread can lock again without blocking. It keeps an owner and a hold count: each lock by the owner increments the count, each unlock decrements it, and the mutex is released when the count reaches zero. Java's `synchronized` and `ReentrantLock` are reentrant, which lets a synchronized method call another synchronized method on the same object.

</details>

### Q5. What happens if a thread locks a non-reentrant mutex twice?

**Style:** Trap

<details>
<summary>Answer</summary>

It deadlocks with itself. The second `lock` sees the mutex held (by itself) and blocks waiting for it to be released — but the only thread that could release it is the one now blocked. Some mutex types instead return an error (error-checking mutexes in POSIX).

</details>

### Q6. Why should `unlock()` be in a `finally` block in Java?

**Style:** Why

<details>
<summary>Answer</summary>

If the critical section throws an exception and `unlock()` is skipped, the lock stays held forever; every other thread that needs it blocks permanently. `finally` guarantees release on every exit path. (`synchronized` blocks release automatically, which is one reason they are simpler.)

</details>

### Q7. Does a thread that only reads shared data need the mutex?

**Style:** Trap

<details>
<summary>Answer</summary>

Yes, if other threads write it. Without the lock, the reader may see a partially updated object (for example a balance updated but the transaction list not yet), and in Java there is no guarantee it sees the latest value at all. If reads dominate, use a read-write lock (`ReentrantReadWriteLock`) so readers can share while writers are exclusive.

</details>

## Advanced

### Q8. Two threads each need mutexes A and B. How can this deadlock, and how do you prevent it?

**Style:** Scenario

<details>
<summary>Answer</summary>

T1 locks A then waits for B; T2 locks B then waits for A. Each holds what the other needs, so both wait forever. Prevent it by having every thread acquire locks in the same global order (always A before B), by acquiring all needed locks at once, or by using `tryLock` with a timeout and backing off (releasing what you hold) on failure.

</details>

### Q9. How is a mutex implemented on a multiprocessor?

**Style:** How

<details>
<summary>Answer</summary>

On top of an atomic hardware instruction such as compare-and-swap. The fast path is a CAS from "unlocked" to "locked by me" entirely in user space. If the CAS fails, the thread may spin briefly, then asks the kernel to put it to sleep on a wait queue associated with the lock (on Linux, a futex). Unlock does an atomic release and, only if there are waiters, a system call to wake one. Uncontended locking therefore needs no system call at all.

</details>
