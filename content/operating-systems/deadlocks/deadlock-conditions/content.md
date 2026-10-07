# Four Necessary Conditions for Deadlock

**Module:** Deadlocks · **Interview priority:** Core

## Concept

A deadlock can occur only if **all four** of these conditions hold **at the same time** (the Coffman conditions, 1971):

1. **Mutual exclusion** — at least one resource is non-shareable: only one process can use it at a time.
2. **Hold and wait** — a process holds at least one resource while waiting to acquire others.
3. **No preemption** — a resource cannot be taken away from a process; it is released only voluntarily.
4. **Circular wait** — there is a cycle of processes P0 → P1 → … → Pn → P0, where each waits for a resource held by the next.

## Why It Matters

The conditions are **necessary**: if even one is missing, deadlock is impossible. That turns deadlock prevention into a checklist — break any one condition — and it is the single most asked deadlock question.

## How It Works

### Each condition in the two-lock example

T1 holds lock A and wants B; T2 holds B and wants A.

| Condition | Present in the example because… |
|-----------|----------------------------------|
| Mutual exclusion | A lock can be held by only one thread |
| Hold and wait | T1 keeps A while waiting for B (and T2 keeps B) |
| No preemption | Nobody can force T1 to give up A |
| Circular wait | T1 waits for T2, and T2 waits for T1 |

### Necessary, not sufficient

All four can hold without a deadlock **yet**: the cycle may be about to form, or (with several instances of a resource) a process outside the cycle may release an instance. In the single-instance case, a circular wait with the other three conditions **is** a deadlock.

Circular wait in fact implies hold and wait (each process in the cycle holds something while waiting), but listing the four separately is useful because each one suggests its own prevention technique.

### Breaking each condition (preview)

| Condition | Break it by | Cost |
|-----------|-------------|------|
| Mutual exclusion | Making resources shareable (read-only files, spooling a printer) | Impossible for most resources (locks, writable data) |
| Hold and wait | Requesting all resources at once, or releasing everything before requesting more | Low utilisation; possible starvation |
| No preemption | Taking resources away from a waiting process (it restarts later) | Only for resources whose state can be saved (CPU, memory) |
| Circular wait | Numbering resource types and always requesting in increasing order | Must know and follow the order |

Details in [Deadlock Prevention](../deadlock-prevention/content.md).

## Example

Dining philosophers with five forks:

- **Mutual exclusion:** a fork is used by one philosopher at a time.
- **Hold and wait:** each holds the left fork while waiting for the right.
- **No preemption:** nobody snatches a fork from a neighbour's hand.
- **Circular wait:** philosopher 0 waits for 1's fork, 1 for 2's, … 4 for 0's.

All four hold → deadlock. Make philosopher 4 pick up the right fork first (a different order) and the circular wait cannot form.

## Important Points

- Deadlock requires **all four**: mutual exclusion, hold and wait, no preemption, circular wait.
- Remove any one → deadlock is impossible (that is prevention).
- The conditions are necessary, not sufficient (with multi-instance resources).
- Breaking **circular wait** with a global lock order is the most practical technique.

## Common Confusion

> [!WARNING]
> **"If all four conditions hold, the system is deadlocked."** They are necessary conditions. A deadlock requires them, but their presence alone (especially with multiple resource instances) does not guarantee one.

- **Mutual exclusion is usually unavoidable.** A mutex exists *to* be exclusive, so prevention usually targets the other three conditions.
- **"No preemption" is about resources, not CPU scheduling.** A process can be preempted from the CPU and still hold its locks.

## Interview Perspective

- *"What are the necessary conditions for deadlock?"* — name all four, one line each, with the two-lock example.
- *"Which condition is easiest to break in practice?"* — circular wait, by lock ordering.
- *"Why can't we just remove mutual exclusion?"* — many resources are inherently non-shareable.

## Quick Revision

- Mutual exclusion · Hold and wait · No preemption · Circular wait.
- All four needed; break one → no deadlock.
- Necessary, not sufficient.
- Practical fix: global ordering of resources (breaks circular wait).
