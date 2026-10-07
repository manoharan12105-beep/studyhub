# Race Conditions — Practice

### P1. Necessary ingredient

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** race condition conditions

Which situation **cannot** cause a race condition?

- A) Two threads incrementing a shared counter
- B) Two threads reading an immutable shared list
- C) Two processes appending to the same file without locking
- D) Two threads updating the same bank balance

<details>
<summary>Answer</summary>

**Answer:** B) Two threads reading an immutable shared list

With no writes there is nothing to lose or corrupt.

</details>

### P2. Not atomic

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** atomicity

`balance = balance - amount;` executed by two threads at once can lose a withdrawal because:

- A) Subtraction is slow
- B) It is a read, a subtract and a write that can interleave
- C) Java does not allow subtraction on shared fields
- D) The compiler removes one of the statements

<details>
<summary>Answer</summary>

**Answer:** B) It is a read, a subtract and a write that can interleave

</details>

### P3. Possible results

**Difficulty:** Medium · **Type:** Output · **Concepts:** interleaving

`x` starts at 10. Thread A executes `x = x + 5`; thread B executes `x = x * 2`. Each statement is a load, a compute and a store. List every possible final value of `x`.

<details>
<summary>Answer</summary>

- A then B: (10 + 5) × 2 = **30**.
- B then A: 10 × 2 + 5 = **25**.
- Both load 10, A stores last: **15**.
- Both load 10, B stores last: **20**.

Four results: 15, 20, 25, 30 — only 25 and 30 match a serial order.

</details>

### P4. Find the race

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** check-then-act

A ticket service runs this method on many threads. Explain how two customers can buy the same last ticket, and give one fix.

```java
if (ticketsLeft > 0) {
    ticketsLeft--;
    issueTicket(customer);
}
```

<details>
<summary>Answer</summary>

With `ticketsLeft = 1`, both threads can pass the check before either decrements; both then decrement (to 0 and −1, or both to 0 with a lost update) and both issue a ticket. Fix: make the check and the decrement one atomic step — put the block in a `synchronized` method or under a lock, or use an atomic compare-and-set loop, or let the database do it with `UPDATE … SET left = left - 1 WHERE left > 0` and check the affected row count.

</details>

### P5. Range of the result

**Difficulty:** Hard · **Type:** Output · **Concepts:** lost updates

Two threads each execute `count++` exactly 3 times on a shared `count = 0`, with no synchronisation. Assuming each increment is load, add, store, what are the minimum and maximum possible final values?

<details>
<summary>Answer</summary>

**Maximum 6** (no overlaps). **Minimum 2**, not 3: thread A loads 0; thread B runs its first two increments (count = 2); A stores 1; B loads 1 for its third increment; A runs its remaining two increments (count = 3); B stores 2. Final value 2. A schedule can make almost all updates disappear.

</details>
