# Mutex vs Semaphore — Interview Questions

## Beginner

### Q1. What is the difference between a mutex and a semaphore?

**Style:** Comparison

<details>
<summary>Answer</summary>

A mutex is a locking mechanism with ownership: one thread locks it, uses the resource, and the same thread unlocks it; only one thread can hold it. A semaphore is a counter used for signalling and for managing N identical resources: `wait` decrements, `signal` increments, it has no owner, and any thread may signal. Mutex → mutual exclusion; semaphore → counting and signalling.

</details>

### Q2. Is a binary semaphore the same as a mutex?

**Style:** Trap

<details>
<summary>Answer</summary>

No. Both have two states, but a binary semaphore has no owner: any thread can `signal` it, even one that never called `wait`. A mutex can be unlocked only by its owner, which allows reentrancy (the owner locking again), priority inheritance and detection of incorrect unlocks. A binary semaphore is suited to signalling; a mutex to protecting a critical section.

</details>

### Q3. When would you use a counting semaphore instead of a mutex?

**Style:** Scenario

<details>
<summary>Answer</summary>

When several identical resources may be used at the same time — a pool of 10 database connections, 3 printers, a limit of 50 concurrent downloads. Initialise the semaphore to the number of resources; each user `wait`s before taking one and `signal`s after returning it. A mutex would allow only one user at a time.

</details>

## Intermediate

### Q4. Why can't a mutex be used to signal an event from one thread to another?

**Style:** Why

<details>
<summary>Answer</summary>

Because only the owner may unlock a mutex. In signalling, the thread that waits and the thread that announces the event are different: the worker waits, the producer or interrupt handler signals. With a mutex, the signalling thread would have to unlock a mutex it does not own, which is an error. A semaphore initialised to 0 (or a condition variable) is the right tool.

</details>

### Q5. What happens if a thread calls signal on a binary semaphore used as a lock without having called wait?

**Style:** What happens if

<details>
<summary>Answer</summary>

The semaphore gains a permit nobody took. If a thread is inside the critical section (value 0), the stray `signal` sets it to 1 and a second thread can enter while the first is still there; if the section is free (value 1), a counting implementation goes to 2 and two threads can later enter together. Either way mutual exclusion is silently lost. A mutex would reject the unlock from a non-owner, catching the bug.

</details>

### Q6. How does ownership help solve priority inversion?

**Style:** How

<details>
<summary>Answer</summary>

When a high-priority thread blocks on a mutex, the OS knows which thread owns it and can temporarily raise the owner's priority to the waiter's (priority inheritance), so medium-priority threads cannot preempt it before it releases the lock. A semaphore has no owner, so the OS cannot know whose priority to raise.

</details>

## Advanced

### Q7. Choose mutex, counting semaphore or 0-initialised semaphore: (a) protecting a shared hash map, (b) limiting a scraper to 5 parallel connections, (c) waking a logger thread when a message is queued.

**Style:** Scenario

<details>
<summary>Answer</summary>

(a) **Mutex** — one thread at a time modifies the map, and the locking thread unlocks. (b) **Counting semaphore initialised to 5** — at most 5 permits in use. (c) **Semaphore initialised to 0** (incremented per message) — the producer signals, the logger waits; the producer never owned anything.

</details>

### Q8. Can mutexes and semaphores both cause deadlock?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Yes. Two threads acquiring two mutexes (or two binary semaphores) in opposite orders can deadlock; a producer holding a mutex while waiting on a full buffer's semaphore can deadlock with the consumer. Semaphores add another failure: a missing `signal` leaves waiters blocked forever. The cures are the same — consistent acquisition order, minimal holding, timeouts.

</details>
