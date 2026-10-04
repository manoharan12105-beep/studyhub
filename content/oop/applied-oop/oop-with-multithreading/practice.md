# OOP with Multithreading — Practice

### P1. Thread-safe or not?

**Difficulty:** Easy · **Type:** MCQ

Which is thread-safe to share between threads without extra locking?

- A) `ArrayList`
- B) `StringBuilder`
- C) `String`
- D) `HashMap`

<details>
<summary>Answer</summary>

**Answer:** C) `String`

**Explanation:** `String` is immutable. The others are mutable and not synchronised.

</details>

### P2. Find the leak in thread safety

**Difficulty:** Medium · **Type:** Code analysis

```java
import java.util.ArrayList;
import java.util.List;

class EventLog {
    private final List<String> events = new ArrayList<>();

    synchronized void add(String event) {
        events.add(event);
    }

    synchronized List<String> events() {
        return events;
    }
}
```

Both methods are synchronised. Why is the class still not thread-safe?

<details>
<summary>Answer</summary>

**Answer:** `events()` returns the internal list. Callers then iterate or modify it **outside** the lock while another thread calls `add`, causing `ConcurrentModificationException` or corrupted state.

**Fix:** return a snapshot inside the lock — `return List.copyOf(events);` — so no reference to the guarded list escapes.

</details>

### P3. Make it atomic

**Difficulty:** Medium · **Type:** Coding

```java
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

class VisitCounter {
    private final Map<String, Integer> visits = new ConcurrentHashMap<>();

    void record(String page) {
        Integer current = visits.get(page);
        visits.put(page, current == null ? 1 : current + 1);
    }
}
```

Fix `record` so that concurrent visits are never lost.

<details>
<summary>Answer</summary>

```java
void record(String page) {
    visits.merge(page, 1, Integer::sum);     // one atomic read-modify-write per key
}
```

**Explanation:** `get` then `put` is a check-then-act sequence; two threads can read the same count. `merge` (or `compute`) performs the update atomically inside the map.

</details>

### P4. Design review

**Difficulty:** Hard · **Type:** Design

A `TicketCounter` has `int available` and `List<String> sold`, with the invariant `available + sold.size() == capacity`. One developer proposes making `available` an `AtomicInteger` and `sold` a `CopyOnWriteArrayList`. Is that enough? What would you do?

<details>
<summary>Answer</summary>

**Answer:** No. Each field is individually thread-safe, but selling a ticket must decrement `available` **and** add to `sold` together; between the two steps another thread can observe or modify a state where the invariant does not hold, and two threads can both see `available == 1` and both sell.

**Design:** keep both fields as plain private fields guarded by one private lock, and expose a single method `Optional<String> sell(String buyer)` that checks availability, decrements and records the sale inside the lock. Return copies from any read method.

</details>
