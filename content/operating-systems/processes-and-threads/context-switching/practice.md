# Context Switching — Practice

### P1. What is saved?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** context

During a context switch, the outgoing process's context is saved in:

- A) The ready queue
- B) Its Process Control Block
- C) The hard disk
- D) The CPU cache

<details>
<summary>Answer</summary>

**Answer:** B) Its Process Control Block

</details>

### P2. Not a trigger

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** context switch triggers

Which event does **not** by itself cause a context switch?

- A) The time slice expires and other processes are ready
- B) The running process blocks on a disk read
- C) The running process calls `getpid()`
- D) The running process exits

<details>
<summary>Answer</summary>

**Answer:** C) The running process calls `getpid()`

`getpid()` is a system call that returns at once: a mode switch, not a context switch.

</details>

### P3. Overhead calculation

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** switch overhead

A context switch takes 0.2 ms. What percentage of CPU time is spent switching with a time slice of 9.8 ms? With 1.8 ms?

<details>
<summary>Answer</summary>

9.8 ms: 0.2 ÷ (9.8 + 0.2) = 0.2 ÷ 10 = **2 %**. 1.8 ms: 0.2 ÷ (1.8 + 0.2) = 0.2 ÷ 2 = **10 %**.

</details>

### P4. Cheaper switch

**Difficulty:** Medium · **Type:** Comparison · **Concepts:** thread vs process switch

Switching between two threads of the same process is usually faster than switching between two processes. Give two reasons.

<details>
<summary>Answer</summary>

1. No address-space change: the page-table base stays the same, so there is no TLB flush.
2. Shared data and code may still be in the CPU caches, so the new thread runs at full speed sooner.

</details>
