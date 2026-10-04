# Liskov Substitution Principle — Practice

### P1. Which override is safe?

**Difficulty:** Easy · **Type:** MCQ

Base: `int discountPercent(int orderValue)` — "accepts any value ≥ 0, returns 0–50". Which subtype implementation respects LSP?

- A) Throws for `orderValue < 500`
- B) Returns 0–30 for every value ≥ 0
- C) Returns up to 80 for large orders
- D) Returns −10 for returning customers

<details>
<summary>Answer</summary>

**Answer:** B

**Explanation:** Returning 0–30 is within the promised 0–50 range (a stronger postcondition is fine). A strengthens the precondition; C and D break the postcondition.

</details>

### P2. Predict the failure

**Difficulty:** Medium · **Type:** Output-based

```java
import java.util.ArrayList;
import java.util.List;

public class LspOutput {

    static class Cache {
        protected final List<String> items = new ArrayList<>();

        void put(String item) {
            items.add(item);
        }

        int size() {
            return items.size();
        }
    }

    static class LimitedCache extends Cache {
        @Override
        void put(String item) {
            if (items.size() < 2) {
                items.add(item);
            }
        }
    }

    static void fill(Cache cache) {
        cache.put("a");
        cache.put("b");
        cache.put("c");
        System.out.println(cache.getClass().getSimpleName() + " size " + cache.size() + " (caller expects 3)");
    }

    public static void main(String[] args) {
        fill(new Cache());
        fill(new LimitedCache());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
Cache size 3 (caller expects 3)
LimitedCache size 2 (caller expects 3)
```

**Explanation:** `LimitedCache.put` silently weakens the postcondition "after `put`, the item is in the cache". If limited capacity is a real concept, it belongs in the base contract (`put` returns `boolean`, or the cache documents an eviction policy).

</details>

### P3. Redesign the hierarchy

**Difficulty:** Medium · **Type:** Design

`class Document { void open(); void edit(String text); void save(); }` and `class ReadOnlyDocument extends Document` that throws on `edit` and `save`. Redesign it.

<details>
<summary>Answer</summary>

**Answer:** Split by capability: `interface ReadableDocument { void open(); String content(); }` and `interface EditableDocument extends ReadableDocument { void edit(String text); void save(); }`. `ReadOnlyDocument` implements only `ReadableDocument`; normal documents implement `EditableDocument`. Editors accept `EditableDocument`, viewers accept `ReadableDocument`.

**Explanation:** No type promises an operation it cannot perform, so every substitution the compiler allows is safe.

</details>

### P4. Contract test

**Difficulty:** Hard · **Type:** Scenario

You have three implementations of `interface RateLimiter { boolean tryAcquire(String clientId); }` (in-memory, Redis-backed, no-op for local development). How would you use LSP thinking to test them, and is the no-op limiter a violation?

<details>
<summary>Answer</summary>

**Answer:** Write the contract first — e.g. "after N successful acquisitions within the window, further calls return false until the window passes" — and implement it as one abstract test suite parameterised by a factory; run it for every implementation. The no-op limiter (always `true`) fails that contract, so it **is** an LSP violation if callers rely on limiting.

**Options:** weaken the documented contract so "may allow more requests" is permitted (then callers cannot rely on limits), or keep the no-op out of the production type hierarchy (configure a real limiter with a very high limit for local development instead).

</details>
