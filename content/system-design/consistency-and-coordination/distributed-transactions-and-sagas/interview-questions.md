# Distributed Transactions, Sagas and the Outbox — Interview Questions

## Beginner

### Q1. Why can't microservices simply use one database transaction for a checkout?

**Style:** Why

<details>
<summary>Answer</summary>

Each service owns its own database, and a single database transaction can only cover changes in one database. The checkout spans the order, payment and inventory services' stores across the network, so atomicity must come from a distributed protocol (2PC) or from a saga with compensations.

</details>

## Intermediate

### Q2. What is two-phase commit and why is it avoided across microservices?

**Style:** Trade-off

<details>
<summary>Answer</summary>

A coordinator asks all participants to prepare (lock and vote), then commits if all vote yes or aborts otherwise. It is avoided because prepared participants block while holding locks if the coordinator fails, it adds multiple round trips with locks held, every participant must be available (lowering overall availability), and many databases and brokers used by microservices don't support it.

</details>

### Q3. What is a saga?

**Style:** Direct

<details>
<summary>Answer</summary>

A way to implement a multi-service operation as a sequence of local transactions, each committing in one service. If a step fails, previously completed steps are undone by compensating transactions (refund, cancel, release). It gives eventual atomicity without distributed locks, but no isolation.

</details>

### Q4. Choreography vs orchestration in sagas?

**Style:** Comparison

<details>
<summary>Answer</summary>

Choreography: services react to each other's events with no central controller — loosely coupled, but the overall flow is implicit and hard to trace as it grows. Orchestration: a central orchestrator issues commands and tracks the saga's state — the flow is explicit and easier to monitor and change, at the cost of a coordinating component that must be reliable.

</details>

### Q5. What is the dual-write problem?

**Style:** Direct

<details>
<summary>Answer</summary>

Writing to two systems (for example the database and a message broker) without a shared transaction: if one write succeeds and the other fails or the process crashes between them, the systems disagree — an event published for a change that was rolled back, or a committed change whose event is never sent.

</details>

## Advanced

### Q6. Explain the transactional outbox pattern.

**Style:** How

<details>
<summary>Answer</summary>

In the same local transaction as the business change, insert the event into an outbox table. A separate relay reads unpublished outbox rows (by polling or by change data capture from the database log), publishes them to the broker, and marks them sent, retrying on failure. Events are therefore published if and only if the change committed, at least once; consumers deduplicate using the event ID.

</details>

### Q7. What isolation problems do sagas have and how do you handle them?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Intermediate states are visible: other transactions can read a `PENDING` order or a reservation that will be released, and concurrent sagas can interfere (lost updates, reads of data that will be compensated). Countermeasures: explicit state machines with pending states shown to users, semantic locks (flags marking records in use by a saga), ordering steps so risky or irreversible ones come last, re-validating values at commit time, and idempotent, commutative updates.

</details>

### Q8. A compensation itself fails (the refund API is down). What do you do?

**Style:** What happens if

<details>
<summary>Answer</summary>

Compensations must be retried until they succeed: persist the saga state, retry with backoff, make the compensation idempotent (refund keyed by the payment ID), and alert or route to manual handling after repeated failures (a dead-letter queue or operations workflow). A compensation cannot simply be abandoned, or the system stays inconsistent.

</details>
