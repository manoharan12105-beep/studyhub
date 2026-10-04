# Circular Dependencies — Interview Questions

## Beginner

### Q1. What is a circular dependency in Spring?

<details>
<summary>Answer</summary>

Two or more beans that depend on each other directly or indirectly (A needs B, B needs A), so the container cannot fully create one before the other. With constructor injection it always fails at startup with `BeanCurrentlyInCreationException`.

</details>

### Q2. How do you fix a circular dependency?

<details>
<summary>Answer</summary>

Preferably by redesign: move the responsibility that creates the back-reference, extract a third bean that both use, or replace one direction with an application event. Technical workarounds are `@Lazy` on one injection point or `ObjectProvider<T>`, which defer resolution; enabling `spring.main.allow-circular-references` is a last resort.

</details>

## Intermediate

### Q3. Why can Spring resolve some field-injection cycles but never constructor-injection cycles?

<details>
<summary>Answer</summary>

With field injection, Spring can instantiate A first (no-arg constructor) and expose an early reference to the unfinished object, then create B and inject that reference, then finish A. With constructor injection, A's constructor needs a finished B and vice versa; no object exists to expose early.

</details>

### Q4. What changed in Spring Boot 2.6 regarding circular references?

<details>
<summary>Answer</summary>

Boot set `spring.main.allow-circular-references=false` by default, so even field/setter cycles that Spring Framework could resolve now fail at startup with a cycle diagram. The intent is to force teams to remove cycles. The property can be set to `true` temporarily during upgrades.

</details>

### Q5. How does `@Lazy` break a cycle?

<details>
<summary>Answer</summary>

On an injection point, `@Lazy` makes Spring inject a proxy instead of the real bean. Creating the consumer no longer requires the target bean, so the cycle is broken at startup. The proxy resolves the real bean on its first method call.

</details>

## Advanced

### Q6. Explain Spring's three-level singleton cache.

<details>
<summary>Answer</summary>

`singletonObjects` holds fully initialised singletons. `singletonFactories` holds, for each bean in creation, an `ObjectFactory` that can produce an early reference — through `getEarlyBeanReference`, which lets post-processors return an early proxy. `earlySingletonObjects` caches early references once produced, so every consumer gets the same one. When B needs A during A's creation, Spring takes A's factory, creates the early reference, moves it to the early cache and injects it.

</details>

### Q7. What is the "injected in its raw version" error?

<details>
<summary>Answer</summary>

In a field-injection cycle, B received an early reference to A. If a post-processor later wraps A in a proxy that differs from that early reference (for example an `@Async` proxy, which is not created through the early-reference path), B would hold the raw object while everyone else gets the proxy. Spring detects this and fails with "Bean with name 'a' has been injected into other beans [b] in its raw version as part of a circular reference, but has eventually been wrapped." Removing the cycle is the fix.

</details>

### Q8. `OrderService` and `PaymentService` call each other. Propose a design without a cycle.

<details>
<summary>Answer</summary>

Make one an orchestrator. `OrderService.checkout()` calls `paymentService.charge(order)` and then updates the order status itself, so `PaymentService` no longer needs `OrderService`. If payment confirmation arrives asynchronously (webhook), `PaymentService` publishes `PaymentCompletedEvent` and an order-module listener marks the order paid. Dependencies then point in one direction: order → payment.

</details>
