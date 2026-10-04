# Proxy — Practice

### P1. Which proxy?

**Difficulty:** Easy · **Type:** MCQ

An image viewer shows a grey placeholder and loads the high-resolution image from disk only when the user scrolls to it. Which kind of proxy is this?

- A) Protection proxy
- B) Remote proxy
- C) Virtual proxy
- D) Caching proxy

<details>
<summary>Answer</summary>

**Answer:** C) Virtual proxy

**Explanation:** It defers creating an expensive object until it is needed.

</details>

### P2. Write a caching proxy

**Difficulty:** Medium · **Type:** Coding

Given `interface PincodeLookup { String district(String pincode); }` with a slow real implementation, write `CachingPincodeLookup`.

<details>
<summary>Answer</summary>

```java
import java.util.HashMap;
import java.util.Map;

interface PincodeLookup {
    String district(String pincode);
}

class CachingPincodeLookup implements PincodeLookup {
    private final PincodeLookup real;
    private final Map<String, String> cache = new HashMap<>();

    CachingPincodeLookup(PincodeLookup real) {
        this.real = real;
    }

    @Override
    public String district(String pincode) {
        return cache.computeIfAbsent(pincode, real::district);
    }
}
```

**Explanation:** Same interface, controls whether the real lookup is called. For concurrent use, use a `ConcurrentHashMap` and consider size limits/expiry.

</details>

### P3. Self-invocation trap

**Difficulty:** Hard · **Type:** Scenario

In a Spring service, `placeOrder()` (not annotated) calls `this.saveOrder()`, which is annotated `@Transactional`. The team finds no transaction is started. Why, and how would you fix it?

<details>
<summary>Answer</summary>

**Answer:** Spring applies `@Transactional` through a proxy around the bean. External calls go through the proxy, but `this.saveOrder()` is a direct call on the target object, bypassing the proxy, so no transaction logic runs.

**Fixes:** annotate the public entry method that external callers use; move `saveOrder` into a separate bean and call it through its injected (proxied) reference; or, less preferably, obtain the proxy explicitly.

</details>
