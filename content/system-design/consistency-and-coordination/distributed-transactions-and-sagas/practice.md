# Distributed Transactions, Sagas and the Outbox — Practice

### P1. Compensation

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** saga

In a saga, what undoes a completed step when a later step fails?

- A) A database rollback across all services
- B) A compensating transaction such as a refund
- C) Restarting the services
- D) Deleting the message queue

<details>
<summary>Answer</summary>

**Answer:** B) A compensating transaction such as a refund

</details>

### P2. Order the compensations

**Difficulty:** Medium · **Type:** Output · **Concepts:** saga flow

Saga steps: (1) create order, (2) charge card, (3) reserve stock, (4) book courier. Step 4 fails. Which compensations run, in which order?

<details>
<summary>Answer</summary>

Reverse order of completed steps: release stock (3), refund the card (2), cancel the order (1).

</details>

### P3. Fix the dual write

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** outbox

Code: `orderRepository.save(order); kafka.send("OrderCreated", order);`. Sometimes orders exist with no event; sometimes events reference orders that do not exist. Explain and fix.

<details>
<summary>Answer</summary>

Two independent writes: a crash after the save loses the event; a send before a later rollback publishes an event for a non-existent order. Save the order and an `OrderCreated` row in an outbox table in one database transaction; a relay publishes outbox rows to Kafka and marks them sent; consumers deduplicate by event ID.

</details>

### P4. 2PC or saga

**Difficulty:** Hard · **Type:** Trade-off · **Concepts:** choosing a mechanism

A travel booking books a flight, a hotel and a car through three external partner APIs. Can you use 2PC? What do you use instead?

<details>
<summary>Answer</summary>

No: external partners will not participate in your 2PC protocol or hold locks for you, and their latency would block everything. Use an orchestrated saga: book each item (with idempotency keys), and on failure cancel the earlier bookings via the partners' cancellation APIs; order steps so the hardest-to-cancel booking comes last, and handle failed cancellations with retries and manual follow-up.

</details>
