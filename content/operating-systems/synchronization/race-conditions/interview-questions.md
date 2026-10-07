# Race Conditions — Interview Questions

## Beginner

### Q1. What is a race condition?

**Style:** Direct

<details>
<summary>Answer</summary>

A situation where several threads or processes access shared data concurrently, at least one modifies it, and the result depends on the order in which their operations interleave. Different runs can give different results, some of them wrong. Example: two threads incrementing a shared counter can lose updates.

</details>

### Q2. Why is `count++` not thread-safe?

**Style:** Why

<details>
<summary>Answer</summary>

It is three machine steps: load `count` into a register, add 1, store it back. If two threads both load the same old value before either stores, both store old + 1, and one increment is lost. A context switch or another core can interleave between any of the steps.

</details>

### Q3. How can race conditions be prevented?

**Style:** How

<details>
<summary>Answer</summary>

Make the access to shared data mutually exclusive or atomic: locks (mutex, `synchronized`, `ReentrantLock`), semaphores, atomic variables (`AtomicInteger`, compare-and-swap), or database transactions and constraints. Alternatively remove the sharing: thread-local data, immutable objects, or message passing instead of shared state.

</details>

## Intermediate

### Q4. Can a race condition occur on a single-core CPU?

**Style:** Trap

<details>
<summary>Answer</summary>

Yes. With preemptive scheduling, a timer interrupt can switch threads between the load and the store of `count++`, producing the same lost update as on two cores. Multiple cores make races more frequent, not possible for the first time.

</details>

### Q5. Does declaring the counter `volatile` in Java fix the race on `count++`?

**Style:** Trap

<details>
<summary>Answer</summary>

No. `volatile` guarantees that every read sees the latest written value and that writes are visible to other threads, but `count++` is still a separate read and write. Two threads can still read the same value and both write value + 1. Use `AtomicInteger.incrementAndGet()` or a lock.

</details>

### Q6. What is a check-then-act race? Give an example.

**Style:** Scenario

<details>
<summary>Answer</summary>

A race in which a thread checks a condition and then acts on it, but another thread changes the state in between. Example: two users see "1 seat left", both check `seats > 0`, and both book it — the flight is overbooked. Other examples: lazy singleton creation, `if (!map.containsKey(k)) map.put(k, v)`, "create the file if it does not exist". Fix it by making the check and the act one atomic operation (a lock, `putIfAbsent`, a conditional database update or a unique constraint).

</details>

### Q7. Two threads each run `count++` once on a shared `count = 0`. What final values are possible?

**Style:** Output/prediction

<details>
<summary>Answer</summary>

**1 or 2.** If the increments do not overlap, the result is 2. If both load 0 before either stores, both store 1, and the result is 1. It cannot be 0 (each thread stores at least 1) or more than 2.

</details>

## Advanced

### Q8. Why do race conditions often disappear when you add logging or run a debugger?

**Style:** Debugging

<details>
<summary>Answer</summary>

Logging and debuggers change timing: printing slows the thread down and often takes an internal lock, so the interleaving that caused the bug becomes unlikely. Such timing-dependent bugs are called heisenbugs. They are found with stress tests, thread-sanitising tools, code review of shared state, and by reasoning about which data is shared without synchronisation.

</details>

### Q9. What is the difference between a data race and a race condition?

**Style:** Comparison

<details>
<summary>Answer</summary>

A **data race** is a memory-level event: two threads access the same memory location concurrently, at least one writes, and there is no synchronisation ordering them. A **race condition** is a correctness problem: the program's result depends on timing. Most data races cause race conditions, but a program with no data races can still have a race condition — for example check-then-act on a `ConcurrentHashMap`, where each call is thread-safe but the pair is not atomic.

</details>
