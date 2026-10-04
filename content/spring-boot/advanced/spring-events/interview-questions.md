# Spring Events — Interview Questions

## Beginner

### Q1. How do you publish and consume an event in Spring?

<details>
<summary>Answer</summary>

Inject `ApplicationEventPublisher` and call `publishEvent(new OrderPlacedEvent(...))` — any object can be an event. Consume it in a bean method annotated `@EventListener` whose parameter type matches the event.

</details>

### Q2. Are Spring events synchronous or asynchronous?

<details>
<summary>Answer</summary>

Synchronous by default: `publishEvent` invokes the listeners on the same thread and returns after they finish; listeners participate in the publisher's transaction and their exceptions propagate. Add `@Async` (with `@EnableAsync`) to a listener for asynchronous handling.

</details>

## Intermediate

### Q3. What is `@TransactionalEventListener` used for?

<details>
<summary>Answer</summary>

To run a listener at a phase of the publishing transaction — by default after commit — so side effects such as emails, notifications, cache eviction or message publishing happen only when the data is really committed. Other phases are `AFTER_ROLLBACK`, `AFTER_COMPLETION` and `BEFORE_COMMIT`.

</details>

### Q4. Name some built-in Spring Boot application events.

<details>
<summary>Answer</summary>

`ApplicationStartingEvent`, `ApplicationEnvironmentPreparedEvent`, `ApplicationPreparedEvent`, `ContextRefreshedEvent`, `ApplicationStartedEvent`, `ApplicationReadyEvent`, `AvailabilityChangeEvent`, `ApplicationFailedEvent`, `ContextClosedEvent`.

</details>

### Q5. How do events help break circular dependencies?

<details>
<summary>Answer</summary>

Instead of service B calling back into service A (A → B → A), B publishes an event that a listener in A's module handles. B depends only on the event type, so the dependency graph has one direction.

</details>

## Advanced

### Q6. A `@TransactionalEventListener` never fires. Why?

<details>
<summary>Answer</summary>

The event was published when no transaction was active (e.g. the publishing method is not `@Transactional`, or is called via self-invocation), so there is no phase to bind to; set `fallbackExecution = true` or publish within a transaction. Other causes: the transaction rolled back (for `AFTER_COMMIT`), or the listener bean is not registered.

</details>

### Q7. Why is `@TransactionalEventListener(AFTER_COMMIT)` not enough for guaranteed delivery?

<details>
<summary>Answer</summary>

It runs in memory after the commit; if the process crashes, is killed during deployment, or the listener fails (e.g. the broker is down), the event is lost while the data remains committed. For guaranteed delivery, write an outbox record in the same transaction and have a relay publish it to a broker with retries.

</details>
