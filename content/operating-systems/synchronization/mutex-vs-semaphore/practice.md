# Mutex vs Semaphore — Practice

### P1. Ownership

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** ownership

Which primitive has an owner that must release it?

- A) Counting semaphore
- B) Binary semaphore
- C) Mutex
- D) All of them

<details>
<summary>Answer</summary>

**Answer:** C) Mutex

</details>

### P2. Five printers

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** counting semaphore

An office has 5 identical printers shared by 40 employees' print jobs. Which primitive best controls access?

- A) A mutex
- B) A counting semaphore initialised to 5
- C) A binary semaphore initialised to 0
- D) A spinlock

<details>
<summary>Answer</summary>

**Answer:** B) A counting semaphore initialised to 5

</details>

### P3. Which tool?

**Difficulty:** Medium · **Type:** Comparison · **Concepts:** choosing a primitive

For each, say mutex or semaphore and why: (a) a thread must wait until a download thread says "file ready"; (b) two threads update one linked list; (c) at most 3 threads may call a rate-limited API at once.

<details>
<summary>Answer</summary>

(a) **Semaphore initialised to 0** — signalling between different threads. (b) **Mutex** — mutual exclusion on shared data, owner releases. (c) **Counting semaphore initialised to 3** — up to 3 concurrent holders.

</details>

### P4. The stray signal

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** binary semaphore misuse

A team protects a critical section with a counting semaphore `s = 1` (`wait(s)` … `signal(s)`). A bug in an error handler calls `signal(s)` once more. What can go wrong, and what would a mutex have done?

<details>
<summary>Answer</summary>

The value rises to 2, so two threads can be inside the critical section at the same time and corrupt the shared data — silently. A mutex would reject the unlock from a thread that does not own it (Java's `ReentrantLock` throws `IllegalMonitorStateException`), exposing the bug immediately.

</details>
