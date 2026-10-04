# Spring Proxies: JDK Dynamic Proxies and CGLIB — Practice

### P1. Can it be proxied?

**Difficulty:** Easy · **Type:** MCQ

In a Spring Boot app (CGLIB proxies), which method can a `@Transactional` interceptor intercept?

- A) `private void save()`
- B) `public final void save()`
- C) `public void save()` called from another bean
- D) `public void save()` called via `this.save()` from the same class

<details>
<summary>Answer</summary>

**Answer:** C) `public void save()` called from another bean

</details>

### P2. Wrong type

**Difficulty:** Medium · **Type:** Debugging

With `spring.aop.proxy-target-class=false`, injecting `PaymentServiceImpl` (which implements `PaymentService` and has `@Transactional`) fails with "Bean named 'paymentServiceImpl' is expected to be of type 'PaymentServiceImpl' but was actually of type 'jdk.proxy2.$Proxy…'". Explain two fixes.

<details>
<summary>Answer</summary>

A JDK dynamic proxy implements only the `PaymentService` interface, so it is not a `PaymentServiceImpl`. Inject the interface type (preferred), or re-enable class-based proxies (`proxy-target-class=true`, Spring Boot's default).

</details>

### P3. Explain the output

**Difficulty:** Medium · **Type:** Behavior

In the lesson's demo, why did `greetTwice` print "[proxy] before" only once?

<details>
<summary>Answer</summary>

The proxy intercepted the external call to `greetTwice`; inside the target, `greet` was called on `this` (the target), not on the proxy, so those calls bypassed the invocation handler.

</details>
