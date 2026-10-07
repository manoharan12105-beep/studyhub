# Semaphore — Practice

### P1. Initial value for mutual exclusion

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** binary semaphore

To use a semaphore as a lock for a critical section, it should be initialised to:

- A) 0
- B) 1
- C) The number of threads
- D) −1

<details>
<summary>Answer</summary>

**Answer:** B) 1

The first `wait` takes it to 0; others block until `signal`.

</details>

### P2. P and V

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** semaphore operations

The `V` operation on a semaphore:

- A) Decrements it and may block
- B) Increments it and may wake a waiting process
- C) Resets it to its initial value
- D) Deletes it

<details>
<summary>Answer</summary>

**Answer:** B) Increments it and may wake a waiting process

</details>

### P3. Final value

**Difficulty:** Easy · **Type:** Calculation · **Concepts:** counting semaphore

A counting semaphore is initialised to 7. 20 `wait` operations and 15 `signal` operations are performed, and all of them complete. What is the final value?

<details>
<summary>Answer</summary>

7 − 20 + 15 = **2**.

</details>

### P4. How many are blocked?

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** blocking implementation

A semaphore with value 3 uses the implementation where `wait` decrements and blocks if the result is negative. Eight processes call `wait`, and none has called `signal` yet. What is the value, and how many processes are blocked? Then two processes call `signal` — how many are still blocked?

<details>
<summary>Answer</summary>

3 − 8 = **−5**: three processes proceeded, **5 are blocked**. Each `signal` increments the value and wakes one: −5 → −3, waking 2. **3 remain blocked.**

</details>

### P5. Enforce an order

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** signalling with semaphores

Three threads print "A", "B" and "C". Using semaphores, make the output always "ABC" whatever order the threads start in.

<details>
<summary>Answer</summary>

Two semaphores initialised to 0: `ab` and `bc`.
- Thread 1: `print("A"); signal(ab)`
- Thread 2: `wait(ab); print("B"); signal(bc)`
- Thread 3: `wait(bc); print("C")`

B cannot print before A signals; C cannot print before B signals.

</details>

### P6. Bounded buffer state

**Difficulty:** Medium · **Type:** Calculation · **Concepts:** producer–consumer

A bounded buffer has 5 slots, with `empty = 5`, `full = 0`, `mutex = 1`. A producer adds 4 items, then a consumer removes 1 item. What are `empty` and `full` now? Can the producer add 3 more items without blocking?

<details>
<summary>Answer</summary>

After 4 adds: empty = 1, full = 4. After 1 removal: **empty = 2, full = 3**. The producer can add only 2 more; the third `wait(empty)` blocks until a consumer removes another item.

</details>

### P7. Spot the deadlock

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** semaphore order, deadlock

Two semaphores `S = 1` and `Q = 1`. Thread T1 runs `wait(S); wait(Q); … signal(Q); signal(S)`. Thread T2 runs `wait(Q); wait(S); … signal(S); signal(Q)`. Describe an interleaving that deadlocks and a fix.

<details>
<summary>Answer</summary>

T1 does `wait(S)` (S = 0); T2 does `wait(Q)` (Q = 0); T1 blocks on `wait(Q)`; T2 blocks on `wait(S)`. Each holds what the other needs — deadlock. Fix: both threads acquire in the same order (`wait(S)` then `wait(Q)`).

</details>
