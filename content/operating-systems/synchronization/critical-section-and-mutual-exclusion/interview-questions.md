# Critical Section and Mutual Exclusion — Interview Questions

## Beginner

### Q1. What is a critical section?

**Style:** Direct

<details>
<summary>Answer</summary>

A segment of code in which a thread or process accesses shared resources — shared variables, data structures, files or devices — that must not be accessed by another thread at the same time. Executing critical sections concurrently leads to race conditions.

</details>

### Q2. What is mutual exclusion?

**Style:** Direct

<details>
<summary>Answer</summary>

The property that if one process is executing in its critical section, no other process can execute in its critical section for the same shared resource. It is enforced with locks, semaphores, monitors or atomic hardware instructions.

</details>

### Q3. What are the three requirements for a solution to the critical-section problem?

**Style:** Direct

<details>
<summary>Answer</summary>

1. **Mutual exclusion:** only one process at a time in the critical section.
2. **Progress:** if the critical section is free and processes want to enter, the choice is made among them without indefinite postponement; processes not trying to enter cannot block others.
3. **Bounded waiting:** a limit exists on how many times other processes may enter after a process has requested entry, so no process waits forever.

</details>

## Intermediate

### Q4. Explain Peterson's solution.

**Style:** How

<details>
<summary>Answer</summary>

For two processes, with shared `flag[2]` and `turn`. To enter, process i sets `flag[i] = true` (I want to enter) and `turn = j` (you may go first), then waits while `flag[j] && turn == j`. On exit it sets `flag[i] = false`. Mutual exclusion holds because `turn` can favour only one process; progress holds because a process that does not want to enter has its flag false; bounded waiting holds because after yielding the turn, a process waits for at most one entry by the other.

</details>

### Q5. Why does strict alternation fail as a critical-section solution?

**Style:** Why

<details>
<summary>Answer</summary>

Strict alternation uses only `turn`: process 0 enters when `turn == 0` and sets `turn = 1` on exit, and vice versa. It guarantees mutual exclusion but violates **progress**: if process 1 does not want to enter again, process 0 cannot enter a second time, because it must wait for `turn` to come back. A process outside its critical section is blocking another.

</details>

### Q6. What is a test-and-set instruction and how is it used to build a lock?

**Style:** How

<details>
<summary>Answer</summary>

An atomic hardware instruction that returns the old value of a memory word and sets it to true, in one indivisible step. Lock: `while (TestAndSet(lock)) ;` spins until the old value was false — exactly one thread sees false and enters. Unlock: `lock = false`. Because the read and write cannot be separated, two threads cannot both acquire the lock. This simple version provides mutual exclusion but not bounded waiting.

</details>

### Q7. Why can't user programs simply disable interrupts to protect a critical section?

**Style:** Why

<details>
<summary>Answer</summary>

Disabling interrupts is a privileged instruction — a user program that could do it could monopolise the CPU forever. And on a multiprocessor it does not work: disabling interrupts on one core does not stop threads on other cores from entering the critical section. The kernel itself uses it only for very short sections on the local CPU.

</details>

## Advanced

### Q8. What is a spinlock? When is busy waiting acceptable?

**Style:** Trade-off

<details>
<summary>Answer</summary>

A lock where a waiting thread repeatedly checks the lock in a loop instead of sleeping. It wastes CPU while waiting, but avoids the cost of two context switches (sleep and wake). It is acceptable on multiprocessors when critical sections are very short — shorter than a context switch — such as in kernel code. On a single CPU spinning is pointless: the lock holder cannot run while you spin.

</details>

### Q9. Does Peterson's algorithm work on modern multicore processors?

**Style:** Trap

<details>
<summary>Answer</summary>

Not as written. Modern CPUs and compilers may reorder memory operations — for example the read of `flag[j]` can effectively happen before the write of `flag[i]` becomes visible — so both processes can enter. It works only with memory barriers (fences) or sequentially consistent atomics. That is why real locks are built from atomic hardware instructions such as compare-and-swap.

</details>
