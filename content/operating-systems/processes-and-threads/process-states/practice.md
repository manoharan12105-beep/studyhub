# Process States — Practice

### P1. After the disk interrupt

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** state transitions

A process blocked on a disk read is notified that the read has completed. It moves to:

- A) Running
- B) Ready
- C) New
- D) Terminated

<details>
<summary>Answer</summary>

**Answer:** B) Ready

It must wait for the scheduler to dispatch it.

</details>

### P2. Which transition is impossible?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** state diagram

- A) Running → Waiting
- B) Waiting → Ready
- C) Ready → Waiting
- D) Running → Ready

<details>
<summary>Answer</summary>

**Answer:** C) Ready → Waiting

A process blocks by making a request, which needs it to be running.

</details>

### P3. Name the trigger

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** state transitions

For each event, give the transition: (a) the time slice expires, (b) the process calls `sleep(100)`, (c) the scheduler picks the process, (d) the process divides by zero and is killed.

<details>
<summary>Answer</summary>

(a) Running → Ready. (b) Running → Waiting. (c) Ready → Running. (d) Running → Terminated.

</details>

### P4. Count the states

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** states on multiple CPUs

A dual-core machine has 7 processes: 2 are executing, 3 are waiting for network data, 2 could run but no core is free. How many are Running, Ready and Waiting? If one network reply arrives, what changes?

<details>
<summary>Answer</summary>

Running 2, Ready 2, Waiting 3. When a reply arrives, one Waiting process moves to Ready: Running 2, Ready 3, Waiting 2. It does not run until a core is given to it.

</details>

### P5. Suspended

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** suspended states

A process is Blocked-Suspended (swapped out while waiting for a disk read). The disk read completes. List the states it passes through before it executes again.

<details>
<summary>Answer</summary>

Blocked-Suspended → **Ready-Suspended** (event done, still on disk) → **Ready** (swapped back into memory) → **Running** (dispatched).

</details>
