# Transactions and ACID — Practice

### P1. Which property?

**Difficulty:** Easy · **Type:** MCQ

After a commit, the server loses power; on restart, the committed order is still there. Which ACID property is this?

- A) Atomicity
- B) Consistency
- C) Isolation
- D) Durability

<details>
<summary>Answer</summary>

**Answer:** D) Durability

**Explanation:** Committed changes survive crashes.

</details>

### P2. Partial order

**Difficulty:** Medium · **Type:** Debugging

```java
public void placeOrder(OrderRequest r) {             // no @Transactional
    orderRepository.save(order);
    stockRepository.decrement(r.productId(), r.quantity());
    paymentRepository.save(payment);                  // throws
}
```

After the failure, the order exists and stock is reduced. Explain and fix.

<details>
<summary>Answer</summary>

Each repository call committed in its own transaction. Annotate `placeOrder` with `@Transactional` (on a Spring bean, called through the proxy) so all three writes commit or roll back together.

</details>

### P3. Side effects

**Difficulty:** Medium · **Type:** Design

An order service sends a confirmation SMS inside `@Transactional placeOrder()`. Sometimes customers get an SMS for an order that was rolled back. Redesign it.

<details>
<summary>Answer</summary>

Publish an `OrderPlacedEvent` inside the transaction and send the SMS from a `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)` (optionally `@Async`), or write an outbox row and let a separate process send it. The SMS then goes out only for committed orders.

</details>
