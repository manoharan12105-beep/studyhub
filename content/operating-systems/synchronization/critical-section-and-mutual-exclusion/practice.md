# Critical Section and Mutual Exclusion — Practice

### P1. Which requirement?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** critical-section requirements

"A process that requests entry will get in after a bounded number of other entries" is the requirement of:

- A) Mutual exclusion
- B) Progress
- C) Bounded waiting
- D) Atomicity

<details>
<summary>Answer</summary>

**Answer:** C) Bounded waiting

</details>

### P2. Section names

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** critical-section structure

The code a process runs to request permission to enter its critical section is the:

- A) Remainder section
- B) Entry section
- C) Exit section
- D) Kernel section

<details>
<summary>Answer</summary>

**Answer:** B) Entry section

</details>

### P3. Which requirement fails?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** progress

Two processes share `turn`. P0 enters only when `turn == 0` and sets `turn = 1` on exit; P1 does the opposite. P1 finishes its work and terminates while `turn == 1`. What happens to P0, and which requirement is violated?

<details>
<summary>Answer</summary>

P0 waits forever, because only P1 could set `turn` back to 0. **Progress** is violated: the critical section is free, yet a process that is not even trying to enter decides that P0 cannot enter.

</details>

### P4. Spin or sleep?

**Difficulty:** Medium · **Type:** Comparison · **Concepts:** spinlock vs blocking lock

For each case, choose a spinlock or a blocking mutex: (a) a kernel updating a 3-word structure on a 64-core server; (b) a Java service holding a lock while it writes a 2 MB file to disk; (c) any lock on a single-core embedded device.

<details>
<summary>Answer</summary>

(a) **Spinlock** — the critical section is far shorter than a context switch, and other cores make progress. (b) **Blocking mutex** — the wait is long; spinning would waste a core for milliseconds. (c) **Blocking** (or disable interrupts in the kernel) — on one CPU, a spinning thread prevents the lock holder from running, so it only wastes its time slice.

</details>

### P5. Peterson trace

**Difficulty:** Hard · **Type:** Output · **Concepts:** Peterson's algorithm

P0 executes `flag[0] = true; turn = 1;` and is then preempted. P1 executes `flag[1] = true; turn = 0;` and reaches its `while` check. Who enters the critical section first, and why?

<details>
<summary>Answer</summary>

**P0.** P1 checks `flag[0] && turn == 0` — both true (P1 itself just set `turn = 0`), so P1 waits. When P0 resumes, it checks `flag[1] && turn == 1` — `turn` is 0, so the condition is false and P0 enters. The process that wrote `turn` **last** gives way.

</details>
