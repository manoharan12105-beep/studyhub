# Circular Dependencies — Practice

### P1. Which fails?

**Difficulty:** Easy · **Type:** MCQ

In a Spring Boot 3 application with default settings, which cycle prevents startup?

- A) Only constructor-injection cycles
- B) Only field-injection cycles
- C) Both constructor and field-injection cycles
- D) Neither; Spring resolves both

<details>
<summary>Answer</summary>

**Answer:** C) Both constructor and field-injection cycles

**Explanation:** Constructor cycles are never resolvable; Boot 2.6+ also prohibits field/setter cycles by default.

</details>

### P2. The quick "fix"

**Difficulty:** Medium · **Type:** Scenario

A developer converts both services in a constructor cycle to field injection and sets `spring.main.allow-circular-references=true`. The app starts. What do you say in code review?

<details>
<summary>Answer</summary>

It hides a design problem and gives up immutability and fail-fast startup. Early references can also break with proxies ("injected in its raw version" errors). Remove the cycle: decide which service orchestrates, extract a shared component, or use an event for the reverse direction.

</details>

### P3. Find the cycle

**Difficulty:** Medium · **Type:** Debugging

`UserService → NotificationService → TemplateService → UserService`. Each uses constructor injection. Which exception appears, and where would you break the cycle?

<details>
<summary>Answer</summary>

`BeanCurrentlyInCreationException` (Boot prints the three-bean cycle diagram). `TemplateService` most likely needs only some user data (name, locale): pass that data as method arguments from `NotificationService` instead of injecting `UserService`, or have it depend on a small `UserLookup` interface that does not depend on notifications.

</details>

### P4. Event-based decoupling

**Difficulty:** Hard · **Type:** Design

Payment confirmations arrive by webhook in `PaymentService`, which must mark orders as paid, while `OrderService` calls `PaymentService` at checkout. Sketch the event-based design.

<details>
<summary>Answer</summary>

`OrderService → PaymentService` stays. `PaymentService` publishes `PaymentConfirmedEvent(orderId, paymentRef)` via `ApplicationEventPublisher`. An `OrderPaymentListener` in the order module handles the event with `@EventListener` (or `@TransactionalEventListener(phase = AFTER_COMMIT)` if it must only react to committed payments) and calls `OrderService.markPaid`. `PaymentService` knows only the event type, not the order module.

</details>
