# OOP with Multithreading

> [!NOTE]
> This topic covers **object design** for concurrent programs — how encapsulation, immutability and composition decide whether a class is thread-safe. It is not a full concurrency course (executors, the memory model in depth, and concurrent algorithms are separate subjects).

## Definition

A class is **thread-safe** if its objects behave correctly when used by several threads at the same time, without callers needing extra synchronisation. Thread safety is a property of **class design**: it depends on what state the object has, who can reach that state, and how every access to it is coordinated.

## Why It Matters

- Web servers, Spring services and background workers run many threads that share objects (singletons, caches, counters, connection pools).
- A class that is correct single-threaded can lose updates, read half-updated state or deadlock under concurrency — bugs that appear rarely and are hard to reproduce.
- Interview questions: "Is `ArrayList` thread-safe?", "How do you make a class thread-safe?", "Why are immutable objects thread-safe?", "What is a race condition?"

## Objects and Threads

- Each thread has its own **stack**: local variables and parameters are **never shared** between threads (thread confinement for free).
- All threads share the **heap**: any object reachable by two threads is **shared state**.
- A thread runs code; an object holds state. Several threads may run methods of the **same** object at the same time.

```text
 Thread A stack: local ref ──┐
                             ├──▶  Counter object on the heap  (count = 41)
 Thread B stack: local ref ──┘     both threads call increment() concurrently
```

## Shared Mutable State

Problems need all three: the state is **shared**, it is **mutable**, and access is **not coordinated**. Remove any one and the problem disappears:

| Remove | How | Example |
|--------|-----|---------|
| Sharing | Keep the object confined to one thread | A `StringBuilder` used only inside one method |
| Mutability | Make the object immutable | `String`, records with immutable components |
| Lack of coordination | Synchronise all access | `synchronized` methods, atomics, concurrent collections |

### A race condition

```java
class UnsafeCounter {
    private int count;

    void increment() {
        count++;              // read → add 1 → write: three steps, not atomic
    }

    int get() {
        return count;
    }
}
```

Two threads can interleave the three steps:

| Time | Thread A | Thread B | `count` in memory |
|------|----------|----------|-------------------|
| 1 | reads 41 | | 41 |
| 2 | | reads 41 | 41 |
| 3 | writes 42 | | 42 |
| 4 | | writes 42 | 42 — one increment lost |

This is a **race condition**: the result depends on timing. With two threads each incrementing 10,000 times, the final count is often less than 20,000 and varies between runs.

## Encapsulation and Concurrency

Encapsulation is what makes thread safety **possible**: if every access to a field goes through the class's methods, the class can coordinate those accesses. If a field is public, or a getter leaks a mutable internal object, outside code can touch the state without any lock, and no amount of synchronisation inside the class helps.

```java
import java.util.concurrent.atomic.AtomicInteger;

public class ThreadSafeCounters {

    // Option 1: intrinsic lock on a private object
    static class SynchronizedCounter {
        private final Object lock = new Object();     // private: no outside code can lock on it
        private int count;

        void increment() {
            synchronized (lock) {
                count++;
            }
        }

        int get() {
            synchronized (lock) {                     // reads need the lock too (visibility)
                return count;
            }
        }
    }

    // Option 2: delegate to a thread-safe component
    static class AtomicCounter {
        private final AtomicInteger count = new AtomicInteger();

        void increment() {
            count.incrementAndGet();                  // atomic read-modify-write
        }

        int get() {
            return count.get();
        }
    }

    public static void main(String[] args) throws InterruptedException {
        SynchronizedCounter s = new SynchronizedCounter();
        AtomicCounter a = new AtomicCounter();

        Runnable work = () -> {
            for (int i = 0; i < 10_000; i++) {
                s.increment();
                a.increment();
            }
        };
        Thread t1 = new Thread(work);
        Thread t2 = new Thread(work);
        t1.start();
        t2.start();
        t1.join();                                    // wait for both threads to finish
        t2.join();

        System.out.println(s.get() + " " + a.get());
    }
}
```

**Output:**

```text
20000 20000
```

Rules for encapsulating state in concurrent classes:

- Keep all shared mutable fields `private`.
- Guard **every** read and write of a field with the **same** lock (document which lock guards which field).
- Do not return references to mutable internals; return copies or immutable snapshots.
- Prefer a **private lock object** over `synchronized` methods (which lock on `this`): outside code can also lock on `this` and interfere.

## Compound Actions Belong Inside the Class

Even if each method is thread-safe, a **sequence** of calls from outside is not:

```java
// Caller code — broken even if 'stock' is a ConcurrentHashMap
if (!stock.containsKey(sku)) {          // check
    stock.put(sku, 0);                   // then act: another thread may have inserted in between
}
```

Fix by moving the compound action into one atomic method of the object that owns the state — `stock.putIfAbsent(sku, 0)`, `stock.merge(sku, 1, Integer::sum)`, `computeIfAbsent` — or, in your own classes, into a single synchronised method (`inventory.reserve(sku, qty)`). This is **Tell, Don't Ask** applied to concurrency: tell the object what to do, do not query its state and decide outside.

## Immutable Objects

Immutable objects are **always** thread-safe: no thread can change them, so there is nothing to coordinate. Their `final` fields are also guaranteed to be visible correctly to every thread after construction (if `this` did not escape the constructor). Design shared configuration, messages and value objects as immutable, and when state must change, **replace** an immutable snapshot through a single atomic reference:

```java
import java.util.concurrent.atomic.AtomicReference;

final class PriceList {
    private final AtomicReference<java.util.Map<String, Long>> prices =
            new AtomicReference<>(java.util.Map.of());

    long priceOf(String sku) {
        return prices.get().getOrDefault(sku, 0L);       // readers see one consistent snapshot
    }

    void replaceAll(java.util.Map<String, Long> newPrices) {
        prices.set(java.util.Map.copyOf(newPrices));     // writers swap the whole immutable map
    }
}
```

See [Immutability](../../java-oop/immutability/content.md).

## Strategies for Thread-Safe Classes

| Strategy | How | Good for |
|----------|-----|----------|
| **Thread confinement** | Each thread uses its own instance (locals, per-request objects) | Builders, parsers, request-scoped objects |
| **Immutability** | `final` fields, no mutators | Values, configuration, events |
| **Synchronisation** | `synchronized` blocks, `ReentrantLock` | Small objects with invariants across several fields |
| **Delegation to thread-safe components** | `AtomicInteger`, `ConcurrentHashMap`, `CopyOnWriteArrayList`, `BlockingQueue` | Counters, caches, registries, producer-consumer |
| **`volatile`** | Guarantees visibility of single reads/writes, not atomic compound updates | Flags such as `running = false` |

## Composition and Thread Safety

Composing thread-safe parts does not automatically produce a thread-safe whole. If an **invariant involves several parts**, each part's own locking is not enough:

```java
import java.util.concurrent.atomic.AtomicInteger;

class NumberRange {                                       // invariant: lower <= upper
    private final AtomicInteger lower = new AtomicInteger(0);
    private final AtomicInteger upper = new AtomicInteger(10);

    void setLower(int value) {                            // each set is atomic, but check-then-set is not:
        if (value > upper.get()) {                        // two threads calling setLower(8) and setUpper(5)
            throw new IllegalArgumentException();         // can both pass their checks → lower 8, upper 5
        }
        lower.set(value);
    }

    void setUpper(int value) {
        if (value < lower.get()) {
            throw new IllegalArgumentException();
        }
        upper.set(value);
    }
}
```

Fix: guard both fields with **one** lock (or keep them in one immutable object swapped atomically). Rule: **the class that owns an invariant must own the lock that protects it.**

Composition still helps thread safety when the composed object **fully encapsulates** a thread-safe component and adds no cross-component invariants — the outer class simply delegates (`AtomicCounter` above).

## Designing Concurrent Objects

1. **Decide and document** the thread-safety policy: immutable, thread-safe, conditionally thread-safe, or not thread-safe (`ArrayList`, `HashMap`, `StringBuilder` are not).
2. **Minimise shared mutable state**; prefer immutable values and confinement.
3. **Encapsulate** all mutable state and the locks that guard it (private lock objects).
4. **Keep critical sections short**; do not call unknown ("alien") methods — listeners, callbacks, overridable methods — while holding a lock (risk of deadlock).
5. **Acquire multiple locks in a fixed global order** (for example by account id in a transfer) to avoid deadlock.
6. **Do not let `this` escape** during construction: do not start threads or register listeners in a constructor.
7. **Prefer high-level utilities** (`java.util.concurrent`) over `wait`/`notify`.

### Deadlock in object design

```text
 transfer(a, b): lock a → lock b         Thread 1: transfer(acct1, acct2) holds acct1, waits for acct2
 transfer(b, a): lock b → lock a         Thread 2: transfer(acct2, acct1) holds acct2, waits for acct1 → deadlock
```

Fix: always lock the account with the smaller id first, regardless of transfer direction.

## Real-World Examples

- Spring beans are singletons by default: a service with a mutable field (`private Order currentOrder;`) is shared by all request threads — a classic production bug. Keep services stateless.
- `ConcurrentHashMap.computeIfAbsent` builds per-key caches safely.
- Immutable configuration objects refreshed by swapping an `AtomicReference`.
- `java.util.Collections.synchronizedList` wraps a list with a lock (a decorator), but iteration still needs manual locking.

## Common Misconceptions

- **"`synchronized` methods make a class fully thread-safe."** Compound actions across calls, leaked internals and multi-object invariants still break.
- **"`volatile` makes `count++` atomic."** It only guarantees visibility.
- **"Thread-safe parts make a thread-safe whole."** Not when an invariant spans several parts.
- **"Reads don't need synchronisation."** Without it (or `volatile`/`final`), a thread may see stale values.
- **"Immutable objects need locks when shared."** They do not.

## Key Takeaways

- Thread safety is a design property: shared + mutable + uncoordinated = bugs.
- Encapsulation lets a class coordinate all access; leaking state defeats it.
- Prefer, in order: confinement, immutability, delegation to concurrent utilities, then explicit locking.
- Put compound actions inside the owning class; the owner of an invariant owns its lock.
- Keep locks private, critical sections short, lock order fixed, and never let `this` escape a constructor.
