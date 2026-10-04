# Singleton — Practice

### P1. Required ingredient

**Difficulty:** Easy · **Type:** MCQ

Which element is essential to stop other classes from creating extra instances of a classic singleton?

- A) A `static` method
- B) A `private` constructor
- C) A `final` class
- D) A `volatile` field

<details>
<summary>Answer</summary>

**Answer:** B) A `private` constructor

**Explanation:** Without it, any class can call `new`. The others help with access, extension or thread safety.

</details>

### P2. Spot the bug

**Difficulty:** Medium · **Type:** Code analysis

```java
class Cache {
    private static Cache instance;

    private Cache() { }

    static Cache getInstance() {
        if (instance == null) {
            synchronized (Cache.class) {
                instance = new Cache();
            }
        }
        return instance;
    }
}
```

<details>
<summary>Answer</summary>

**Answer:** Two threads can both pass the outer `null` check, then each enters the lock in turn and creates its own instance — there is no second check inside the lock. Also, without `volatile`, a thread may see a partially constructed instance.

**Fix:** add the inner `if (instance == null)` check inside `synchronized` and declare the field `private static volatile Cache instance;` — or use the holder idiom.

</details>

### P3. Write the holder idiom

**Difficulty:** Medium · **Type:** Coding

Write a lazily created, thread-safe singleton `RateCard` using the holder idiom.

<details>
<summary>Answer</summary>

```java
final class RateCard {
    private RateCard() {
        // load rates
    }

    private static final class Holder {
        static final RateCard INSTANCE = new RateCard();
    }

    static RateCard getInstance() {
        return Holder.INSTANCE;
    }
}
```

**Explanation:** `Holder` is initialised only when `getInstance()` first accesses it, and class initialisation is guaranteed by the JVM to happen once, safely.

</details>

### P4. Redesign for testability

**Difficulty:** Hard · **Type:** Design

`PriceService` calls `ExchangeRates.getInstance().rate("USD")` (a singleton that calls a remote API). Tests are slow and flaky. Redesign without losing the "one shared exchange-rate client" property.

<details>
<summary>Answer</summary>

**Answer:** Introduce `interface ExchangeRateSource { BigDecimal rate(String currency); }`, have the existing client implement it, and inject an `ExchangeRateSource` into `PriceService`'s constructor. Create the single client once in the composition root (or as a Spring singleton bean) and pass it to everyone who needs it.

**Why:** there is still one instance in production, but nothing reaches it globally, so tests can pass a stub with fixed rates.

</details>
