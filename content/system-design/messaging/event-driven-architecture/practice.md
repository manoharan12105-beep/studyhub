# Event-Driven Architecture — Practice

### P1. Event or command?

**Difficulty:** Easy · **Type:** Comparison · **Concepts:** events vs commands

Event (E) or command (C)? (a) `PaymentCaptured`, (b) `ReserveStock`, (c) `UserEmailChanged`, (d) `GenerateInvoice`.

<details>
<summary>Answer</summary>

(a) E, (b) C, (c) E, (d) C.

</details>

### P2. Adding a consumer

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** decoupling

A new loyalty service must react to every completed order. In an event-driven design, what changes in the order service?

- A) It must call the loyalty service's API
- B) Nothing; the loyalty service subscribes to the existing order events
- C) It must create a new database table
- D) It must switch to a monolith

<details>
<summary>Answer</summary>

**Answer:** B) Nothing; the loyalty service subscribes to the existing order events

</details>

### P3. Handle the gap

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** eventual consistency

After checkout, the order page reads from an order-history service that is updated by events and lags by about 2 seconds. Users sometimes don't see their new order. Give two fixes.

<details>
<summary>Answer</summary>

(1) Return the created order in the checkout response and show it directly (or read the user's own recent order from the order service — read-your-writes). (2) Show a "processing" placeholder and refresh when the event-driven view catches up. Also monitor lag.

</details>
