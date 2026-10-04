# Microservices Awareness for Spring Boot Developers — Practice

### P1. Shared database

**Difficulty:** Easy · **Type:** MCQ

Two services read and write the same `orders` table. Which principle is violated?

- A) Stateless services
- B) Database per service
- C) API versioning
- D) Idempotency

<details>
<summary>Answer</summary>

**Answer:** B) Database per service

</details>

### P2. Saga design

**Difficulty:** Hard · **Type:** Design

Order placement spans order-service, payment-service and inventory-service. Payment succeeds but inventory reservation fails. Describe a saga.

<details>
<summary>Answer</summary>

Order-service creates the order as `PENDING` and publishes `OrderCreated` (outbox). Payment-service charges and publishes `PaymentCompleted`. Inventory-service tries to reserve and publishes `InventoryReservationFailed`. Compensations: payment-service refunds on that event, order-service marks the order `CANCELLED` and notifies the customer. Every handler is idempotent because events may be redelivered.

</details>
