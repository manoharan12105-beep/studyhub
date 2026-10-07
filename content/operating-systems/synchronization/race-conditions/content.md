# Race Conditions

**Module:** Synchronization · **Interview priority:** Core

## Concept

A **race condition** occurs when two or more threads (or processes) access **shared data** concurrently, at least one of them **writes**, and the final result depends on the **unpredictable order** in which their instructions interleave. The program is correct in some runs and wrong in others.

## Why It Matters

Race conditions are among the hardest bugs to find: they disappear when you add a print statement, pass every test on a laptop, and corrupt bank balances or counters under production load. Everything else in this module — critical sections, mutexes, semaphores — exists to prevent them.

## How It Works

### Why `count++` is not one step

At the machine level, `count++` is three separate steps:

```text
1. LOAD   register ← count      (read)
2. ADD    register ← register + 1
3. STORE  count ← register      (write)
```

A context switch (or another core) can run between any two steps.

### A lost update, step by step

`count` starts at 5. Threads T1 and T2 both execute `count++`:

| Step | T1 | T2 | count in memory |
|------|----|----|-----------------|
| 1 | LOAD → reg = 5 | | 5 |
| 2 | | LOAD → reg = 5 | 5 |
| 3 | ADD → reg = 6 | | 5 |
| 4 | | ADD → reg = 6 | 5 |
| 5 | STORE → 6 | | 6 |
| 6 | | STORE → 6 | **6** |

Two increments ran, but `count` is 6, not 7 — one update was **lost**. With the order T1-all-steps then T2-all-steps, the result would be 7. The outcome depends on timing: that is the race.

### Conditions for a race

1. **Shared** data (heap objects, globals, a shared file or database row).
2. **Concurrent** access by two or more threads or processes.
3. At least one **write**.
4. **No synchronisation** forcing an order.

Remove any one condition and the race disappears: make data thread-local, make it immutable (read-only), or protect it with a lock or an atomic operation.

### Check-then-act races

Not only arithmetic. A **check-then-act** sequence is racy if another thread can change the state between the check and the act:

```java
if (!map.containsKey(key)) {       // check
    map.put(key, createValue());   // act — another thread may have inserted the key in between
}
```

Examples: two users booking the last seat, two threads creating the same singleton, "if file does not exist, create it". The fix is to make check and act a single atomic step (`map.putIfAbsent`, a lock, or a database constraint).

## Example

Two threads each increment a shared counter 100,000 times.

```java
public class RaceConditionDemo {

    static int count = 0;                              // shared by both threads

    public static void main(String[] args) throws InterruptedException {
        Runnable work = () -> {
            for (int i = 0; i < 100_000; i++) {
                count++;                               // read, add 1, write back: not atomic
            }
        };
        Thread first = new Thread(work);
        Thread second = new Thread(work);
        first.start();
        second.start();
        first.join();
        second.join();
        System.out.println("Expected 200000, got " + count);
    }
}
```

**Output (varies):**

```text
Expected 200000, got 145086
```

Five runs on a 12-core machine printed 145086, 114372, 126248, 150970 and 127317 — a different wrong answer every time. Making the increment atomic fixes it:

```java
import java.util.concurrent.atomic.AtomicInteger;

public class AtomicCounterDemo {

    static final AtomicInteger count = new AtomicInteger();

    public static void main(String[] args) throws InterruptedException {
        Runnable work = () -> {
            for (int i = 0; i < 100_000; i++) {
                count.incrementAndGet();               // one atomic read-modify-write (compare-and-swap)
            }
        };
        Thread first = new Thread(work);
        Thread second = new Thread(work);
        first.start();
        second.start();
        first.join();
        second.join();
        System.out.println("Expected 200000, got " + count.get());
    }
}
```

**Output:**

```text
Expected 200000, got 200000
```

A `synchronized` block or a `ReentrantLock` around `count++` also fixes it — see [Mutex](../mutex/content.md).

## Important Points

- Race condition = result depends on the timing of concurrent accesses to shared data with at least one write.
- `count++`, `x = x + y` and check-then-act sequences are not atomic.
- Races are **non-deterministic**: testing may not reveal them.
- Prevent them by removing sharing, making data immutable, or enforcing mutual exclusion (locks) or atomicity (atomic variables).
- The code section that touches the shared data is the **critical section**.

## Common Confusion

> [!WARNING]
> **"It works on my machine, so there is no race."** A race may need a context switch at exactly the wrong instruction. It can stay hidden for months and appear under load, on more cores, or after a JVM update.

- **`volatile` does not fix `count++`.** It makes each read and write visible to other threads, but the read-add-write sequence is still three steps.
- **Race condition vs data race:** a *data race* is the specific case of unsynchronised concurrent access with a write (a memory-model term); a *race condition* is any timing-dependent bug, including check-then-act on properly synchronised individual operations.
- **Single core is not safe.** A timer interrupt between LOAD and STORE is enough.

## Interview Perspective

- *"What is a race condition? Give an example."* — the `count++` interleaving table.
- *"Why is `count++` not thread-safe?"* — load, add, store.
- *"How do you prevent race conditions?"* — mutual exclusion (mutex, `synchronized`), atomic operations, immutability, confinement.
- *"Can a race happen on a single-core CPU?"* — yes, through preemption.

## Quick Revision

- Shared data + concurrent access + a write + no synchronisation = race.
- `count++` = load, add, store → lost updates.
- Check-then-act is a race too (booking the last seat).
- Fix: lock, atomic operation, immutability, or no sharing.
