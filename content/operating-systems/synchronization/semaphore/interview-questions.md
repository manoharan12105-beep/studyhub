# Semaphore — Interview Questions

## Beginner

### Q1. What is a semaphore?

**Style:** Direct

<details>
<summary>Answer</summary>

A synchronisation variable holding a non-negative integer (in the textbook definition) that is accessed only through two atomic operations: `wait` (P) decrements it and blocks the caller if no unit is available, and `signal` (V) increments it and wakes a waiting caller. Its value represents how many units of a resource are available. It is used for mutual exclusion, limiting concurrency and ordering between threads.

</details>

### Q2. What is the difference between a counting and a binary semaphore?

**Style:** Comparison

<details>
<summary>Answer</summary>

A **counting** semaphore can take any non-negative value and is initialised to the number of identical resources (for example 5 printers), allowing up to that many threads to proceed. A **binary** semaphore takes only 0 or 1 and is used for mutual exclusion (initial value 1) or for signalling a single event (initial value 0).

</details>

### Q3. What do wait (P) and signal (V) do?

**Style:** Direct

<details>
<summary>Answer</summary>

`wait(S)`: if S > 0, decrement it and continue; otherwise block until S becomes positive, then decrement. `signal(S)`: increment S and, if processes are blocked on S, wake one of them. Both must execute atomically, or the semaphore itself would have a race condition.

</details>

## Intermediate

### Q4. A semaphore is initialised to 10. Then 6 wait and 4 signal operations complete. What is its value?

**Style:** Calculation

<details>
<summary>Answer</summary>

10 − 6 + 4 = **8**. Each completed `wait` subtracts 1 and each `signal` adds 1.

</details>

### Q5. In the blocking implementation, what does a negative semaphore value mean?

**Style:** Direct

<details>
<summary>Answer</summary>

In the implementation where `wait` decrements first and then blocks if the value is negative, a value of −k means k processes are blocked in the semaphore's queue. Example: S = 2 and five processes call `wait`: two proceed, three block, and S = −3.

</details>

### Q6. How do you solve the producer–consumer problem with semaphores?

**Style:** How

<details>
<summary>Answer</summary>

Use three semaphores: `empty = N` (free slots), `full = 0` (filled slots) and `mutex = 1` (buffer access). Producer: `wait(empty); wait(mutex); add item; signal(mutex); signal(full)`. Consumer: `wait(full); wait(mutex); remove item; signal(mutex); signal(empty)`. `empty` stops producers when the buffer is full, `full` stops consumers when it is empty, and `mutex` prevents simultaneous buffer updates.

</details>

### Q7. In producer–consumer, what happens if the producer calls wait(mutex) before wait(empty)?

**Style:** Trap

<details>
<summary>Answer</summary>

Deadlock when the buffer is full: the producer acquires `mutex`, then blocks on `empty` while still holding `mutex`. The consumer, which would free a slot, blocks on `wait(mutex)`. Each waits for the other forever. Always wait on the counting semaphore first and take the mutex only around the buffer operation.

</details>

### Q8. How can a semaphore enforce that statement S2 in thread B runs only after statement S1 in thread A?

**Style:** How

<details>
<summary>Answer</summary>

Use a semaphore `s` initialised to **0**. Thread A: `S1; signal(s)`. Thread B: `wait(s); S2`. If B reaches `wait` first, it blocks because the value is 0; A's `signal` releases it. If A signals first, the value becomes 1 and B passes straight through. Either way S2 follows S1.

</details>

## Advanced

### Q9. What is the dining philosophers problem and how can deadlock be avoided?

**Style:** Scenario

<details>
<summary>Answer</summary>

Five philosophers sit around a table with one fork between each pair; to eat, a philosopher needs both adjacent forks (each a binary semaphore). If all pick up their left fork at once, each waits forever for the right one — circular wait, deadlock. Fixes: acquire forks in a global order (lower-numbered fork first, so one philosopher reaches for the right fork first); allow at most four philosophers to try at once (a counting semaphore of 4); or pick up both forks atomically only when both are free.

</details>

### Q10. Why can the simple readers–writers solution starve writers?

**Style:** Why

<details>
<summary>Answer</summary>

In the readers-preference solution, the first reader locks out writers and the last reader lets them back in. If new readers keep arriving before the current readers finish, the reader count never drops to zero, so a waiting writer never gets access. Writer-preference or fair (queue-ordered) read-write locks fix this, at the cost of making readers wait when a writer is queued.

</details>
