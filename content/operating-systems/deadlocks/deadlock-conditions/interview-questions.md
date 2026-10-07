# Four Necessary Conditions for Deadlock — Interview Questions

## Beginner

### Q1. What are the four necessary conditions for a deadlock?

**Style:** Direct

<details>
<summary>Answer</summary>

1. **Mutual exclusion** — a resource can be held by only one process at a time.
2. **Hold and wait** — a process holds at least one resource while waiting for more.
3. **No preemption** — resources are released only voluntarily by the process holding them.
4. **Circular wait** — a closed chain of processes exists in which each waits for a resource held by the next.

All four must hold simultaneously for a deadlock to occur.

</details>

### Q2. Explain the four conditions using two threads and two locks.

**Style:** Scenario

<details>
<summary>Answer</summary>

T1 holds lock A and requests B; T2 holds B and requests A. Mutual exclusion: each lock has one holder. Hold and wait: each keeps its lock while waiting. No preemption: neither lock can be forcibly taken. Circular wait: T1 → T2 → T1. All four hold, so they deadlock.

</details>

## Intermediate

### Q3. If all four conditions hold, is the system necessarily deadlocked?

**Style:** Trap

<details>
<summary>Answer</summary>

No. The conditions are necessary, not sufficient. With multiple instances of a resource, a cycle of waits can be broken when a process outside the cycle releases an instance. Only when every resource involved has a single instance does a circular wait (with the other conditions) guarantee deadlock.

</details>

### Q4. Which condition is usually impossible to eliminate, and why?

**Style:** Why

<details>
<summary>Answer</summary>

Mutual exclusion. Many resources are inherently non-shareable — a mutex, a writable record, a printer in the middle of a job. Making them shareable would remove the very protection they provide. Some resources can be made shareable (read-only files) or virtualised (printer spooling), but not in general.

</details>

### Q5. Which condition is the most practical to break, and how?

**Style:** How

<details>
<summary>Answer</summary>

Circular wait. Assign every resource type (or lock) a number, and require every process to request resources only in increasing order. A cycle would need some process to hold a higher-numbered resource while waiting for a lower one, which the rule forbids. In code this is "always acquire locks in the same global order", for example by account id.

</details>

### Q6. Does circular wait imply hold and wait?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Yes: every process in the cycle holds a resource that the previous one wants while it waits for the next one, which is hold and wait. The conditions are still listed separately because each points to a different prevention technique — requesting everything at once breaks hold and wait even if processes do not follow an order.

</details>

## Advanced

### Q7. A thread uses `tryLock` with a timeout and releases its locks if it fails. Which condition does this break?

**Style:** Scenario

<details>
<summary>Answer</summary>

Hold and wait (and effectively the no-preemption condition voluntarily): the thread does not keep waiting indefinitely while holding resources; after the timeout it gives up what it holds and retries. Deadlock cannot persist, though without randomised back-off the threads can livelock by retrying in lockstep.

</details>

### Q8. "The CPU is preemptible, so the no-preemption condition never holds in a modern OS." Is that right?

**Style:** Trap

<details>
<summary>Answer</summary>

No. CPU preemption means the scheduler can take the processor away from a thread; it does not take away the thread's locks, open files or other resources. A preempted thread still holds its mutexes, so the no-preemption condition holds for them, and deadlock remains possible.

</details>
