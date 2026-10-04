# Bean Scopes — Practice

### P1. Default scope

**Difficulty:** Easy · **Type:** MCQ

A class annotated only with `@Service` is injected into five controllers. How many instances exist?

- A) Five
- B) One
- C) One per request
- D) One per thread

<details>
<summary>Answer</summary>

**Answer:** B) One

**Explanation:** The default scope is singleton: one instance per container, shared by all injection points.

</details>

### P2. Shared state bug

**Difficulty:** Medium · **Type:** Code analysis

```java
@Service
class DiscountService {
    private String currentUser;

    BigDecimal discountFor(String user, BigDecimal amount) {
        this.currentUser = user;
        return lookupRate().multiply(amount);
    }

    private BigDecimal lookupRate() {
        return currentUser.startsWith("vip") ? new BigDecimal("0.20") : new BigDecimal("0.05");
    }
}
```

Under load, normal users occasionally receive VIP discounts. Why? Fix it.

<details>
<summary>Answer</summary>

`DiscountService` is a singleton shared by all request threads. Thread A sets `currentUser = "vip1"`, thread B overwrites it, and A then reads B's value (or vice versa) — a race condition. Remove the field: pass `user` as a parameter to `lookupRate(user)`. Keep singleton services stateless.

</details>

### P3. Prototype in singleton

**Difficulty:** Medium · **Type:** Behavior

A prototype bean `Counter` (with an `int count` field and `increment()` returning `++count`) is constructor-injected into a singleton `Tracker`. `tracker.track()` calls `counter.increment()`. What do three calls return?

<details>
<summary>Answer</summary>

`1, 2, 3`. The prototype was injected once, so `Tracker` keeps the same `Counter` instance. With `ObjectProvider<Counter>` and `getObject()` per call, each call would return `1`.

</details>

### P4. Choose the scope

**Difficulty:** Medium · **Type:** Scenario

Choose a scope for: (a) `JwtService` that signs tokens with a fixed key; (b) an object holding the tenant id resolved from the current request's header; (c) a non-thread-safe `XmlParser` used occasionally by a singleton.

<details>
<summary>Answer</summary>

(a) singleton — stateless after construction. (b) request scope (with a scoped proxy, which `@RequestScope` adds by default). (c) prototype, obtained through `ObjectProvider<XmlParser>` each time it is needed.

</details>
