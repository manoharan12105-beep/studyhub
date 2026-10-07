# Deadlock Prevention — Practice

### P1. Ordering resources

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** circular wait

Requiring processes to request resources in increasing numerical order prevents deadlock by eliminating:

- A) Mutual exclusion
- B) Hold and wait
- C) No preemption
- D) Circular wait

<details>
<summary>Answer</summary>

**Answer:** D) Circular wait

</details>

### P2. Spooling

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** mutual exclusion

Print spooling helps prevent deadlocks involving the printer because it removes:

- A) Mutual exclusion on the printer for user processes
- B) Circular wait
- C) Preemption
- D) The need for a printer driver

<details>
<summary>Answer</summary>

**Answer:** A) Mutual exclusion on the printer for user processes

Processes write jobs to disk; only the spooler daemon uses the printer.

</details>

### P3. Will this order deadlock?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** resource ordering

Resources are numbered: disk = 1, printer = 2, scanner = 3. Process A requests disk then scanner. Process B requests printer then disk. Does B follow the ordering rule? What could happen if it does not?

<details>
<summary>Answer</summary>

B breaks the rule: it holds the printer (2) and requests the disk (1), a lower number. If some process C holds the disk while waiting for the printer, C and B form a circular wait and deadlock. B must request the disk before the printer.

</details>

### P4. Cost of all-at-once

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** hold and wait

A video-export job needs the GPU for 2 minutes at the start and the network uploader for 1 minute at the end of a 30-minute run. Under "request everything at the start", how long is the uploader held but unused, and what is the cost?

<details>
<summary>Answer</summary>

The uploader is held from minute 0 to minute 30 but used only in the last minute — **29 minutes idle** — and the GPU, if also held for the whole run, is idle for 28 minutes. Other jobs that need either resource wait the whole time: low utilisation and possible starvation. That is the price of breaking hold and wait this way.

</details>

### P5. Fix the transfer

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** lock ordering, deadlock

A three-account rebalance locks accounts in the order the user lists them: `rebalance(c, a, b)`. Another thread calls `rebalance(b, c, a)`. Explain the deadlock risk and fix it.

<details>
<summary>Answer</summary>

Different threads can lock the same accounts in different orders (c → a → b vs b → c → a); for instance one holds c and waits for b while the other holds b and waits for c — a circular wait. Fix: sort the accounts by id and always lock in sorted order (a, b, c) regardless of how they were listed.

</details>
