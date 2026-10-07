# Threads and Multithreading — Practice

### P1. Private to a thread

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** thread resources

Which of these is private to each thread?

- A) Heap
- B) Global variables
- C) Stack
- D) Open files

<details>
<summary>Answer</summary>

**Answer:** C) Stack

Heap, globals and open files are shared by all threads of the process.

</details>

### P2. Blocking under many-to-one

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** multithreading models

In the many-to-one model, when one user thread makes a blocking system call:

- A) Only that thread blocks
- B) The entire process blocks
- C) The kernel creates a new kernel thread
- D) The other threads move to another core

<details>
<summary>Answer</summary>

**Answer:** B) The entire process blocks

All user threads share one kernel thread, which is now blocked.

</details>

### P3. Shared or not?

**Difficulty:** Medium · **Type:** Output · **Concepts:** shared heap, private stack

Two threads run `work()`. `count` is a static field (heap/shared); `local` is a local variable. After both finish, could `count` be 2? Could `local` ever be seen as 2 by either thread?

```java
static int count = 0;

static void work() {
    int local = 0;
    local++;
    count++;
}
```

<details>
<summary>Answer</summary>

`count` is shared, so it ends at 2 if the increments do not overlap (it can also end at 1 if they race — see Race Conditions). `local` lives on each thread's own stack; each thread sees only its own copy, which is always 1.

</details>

### P4. How many threads?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** threads vs cores

A CPU-bound image filter runs on a 4-core machine. Going from 1 to 4 threads makes it about 3.6× faster; going to 32 threads makes it slightly slower than with 4. Explain both results.

<details>
<summary>Answer</summary>

Up to 4 threads, each core runs one thread in parallel; the speed-up is a bit below 4 because of some sequential work and coordination. Beyond 4, threads compete for the same 4 cores, adding context switches and cache contention without more parallel hardware, so performance drops slightly.

</details>
