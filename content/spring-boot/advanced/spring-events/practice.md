# Spring Events — Practice

### P1. Default behaviour

**Difficulty:** Easy · **Type:** MCQ

A listener annotated only with `@EventListener` throws an exception. What happens to the `@Transactional` method that published the event?

- A) Nothing; listeners are isolated
- B) The exception propagates to the publisher and (if unhandled) rolls back its transaction
- C) The event is retried
- D) The listener is disabled

<details>
<summary>Answer</summary>

**Answer:** B) The exception propagates to the publisher and (if unhandled) rolls back its transaction

</details>

### P2. Choose the listener

**Difficulty:** Medium · **Type:** Design

After an order is placed: (a) update an in-transaction audit table; (b) send an SMS; (c) recompute recommendations (slow). Which listener types do you use?

<details>
<summary>Answer</summary>

(a) `@EventListener` (or `@TransactionalEventListener(phase = BEFORE_COMMIT)`) — same transaction. (b) `@TransactionalEventListener(phase = AFTER_COMMIT)`, optionally `@Async`. (c) `@Async @TransactionalEventListener(AFTER_COMMIT)` so it runs in the background only for committed orders (or a message queue if it must be reliable).

</details>
