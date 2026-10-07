# Distributed Transactions, Sagas and the Outbox

**Module:** Consistency and Coordination · **Interview priority:** Frequently asked

## What Is It?

Inside one database, a transaction makes several changes all-or-nothing. When a business operation spans **several services or databases** — create the order, charge the card, reserve stock — no single database transaction covers it. Three tools address this:

- **Two-phase commit (2PC):** a coordinator asks every participant to *prepare*, and commits only if all vote yes. A true distributed ACID transaction.
- **Saga:** a sequence of **local** transactions, one per service; if a later step fails, earlier steps are undone by **compensating actions**.
- **Transactional outbox:** a pattern that makes "update my database **and** publish an event" reliable, which sagas and event-driven systems depend on.

## Why It Exists

Microservices each own their data ([Monolith vs Microservices](../../foundations/monolith-vs-microservices/content.md)), so a checkout touches several databases over the network. Networks fail between steps; services crash mid-operation. Without a plan you get orders that are paid but never shipped, or stock reserved forever.

## How It Works

### Two-phase commit and why it is avoided

```text
Phase 1  Coordinator → all participants: PREPARE   (each locks its rows, votes YES/NO)
Phase 2  all YES → COMMIT to all;   any NO → ABORT to all
```

It gives atomicity, but:

- **Blocking:** prepared participants hold locks until they hear the outcome; if the coordinator dies after PREPARE, they wait (possibly a long time).
- **Latency:** at least two round trips to every participant, with locks held throughout.
- **Availability:** every participant must be up — availability is the product of all of them.
- Many modern stores and message brokers do not support the XA protocol at all.

2PC is used inside some databases and distributed SQL systems, but rarely across independently owned microservices.

### Sagas

A saga splits the operation into local transactions, each with a compensation:

| Step | Local transaction | Compensation if a later step fails |
|------|-------------------|------------------------------------|
| 1 | Order service: create order `PENDING` | Mark order `CANCELLED` |
| 2 | Payment service: charge card | Refund the charge |
| 3 | Inventory service: reserve items | Release the reservation |
| 4 | Order service: mark `CONFIRMED` | — |

If step 3 fails (out of stock), the saga runs compensations in reverse: refund (2), cancel (1).

Two styles of coordination:

- **Choreography:** each service listens for events and reacts ("OrderCreated" → payment charges and emits "PaymentSucceeded" → inventory reserves …). No central coordinator; harder to follow as steps grow.
- **Orchestration:** a saga orchestrator (a workflow engine or service) tells each service what to do next and tracks state. Easier to see and change the flow; the orchestrator must itself be reliable.

Saga realities:

- **No isolation:** other requests can see intermediate states (an order `PENDING`, a charge later refunded). Design states and UIs for it.
- **Compensations are business actions,** not rollbacks: an email already sent cannot be unsent; you send a correction.
- **Every step and compensation must be idempotent and retryable,** because messages are delivered at least once ([Delivery Semantics](../../messaging/delivery-semantics/content.md)).

### The dual-write problem and the transactional outbox

A service must update its database **and** publish an event. Doing both directly is a **dual write**: if the database commits and the publish fails (or the reverse), the system is inconsistent.

```text
Outbox pattern
BEGIN;
  INSERT INTO orders (...) VALUES (...);
  INSERT INTO outbox (id, type, payload) VALUES (..., 'OrderCreated', '{...}');
COMMIT;                                   ← both or neither, in ONE local transaction
Relay process: read unsent outbox rows → publish to the broker → mark sent
```

The event is stored atomically with the business change; a relay (polling the table, or **change data capture** reading the database log) publishes it, retrying until the broker acknowledges. Publishing is at-least-once, so consumers deduplicate by event ID.

**Think about it:** in a choreographed checkout saga, the payment service charges the card but crashes before emitting "PaymentSucceeded". What prevents the order from being stuck forever?

<details>
<summary>Answer</summary>

The payment service should write the charge and the "PaymentSucceeded" event in one local transaction using the outbox, so the relay publishes the event after the service restarts. In addition, the saga needs timeouts: an order still `PENDING` after N minutes is checked against the payment service (and compensated or completed). Idempotency keys ensure that a retried charge does not charge twice.

</details>

## Comparison

| | 2PC | Saga |
|---|-----|------|
| Atomicity | Yes (all-or-nothing) | Eventually, via compensations |
| Isolation | Yes (locks) | No — intermediate states are visible |
| Latency | High; locks held across the network | Each step commits locally and quickly |
| Failure of coordinator / participant | Blocks | Retries and compensations continue |
| Fits | Tightly coupled resources, inside one database system | Microservices and long-running business processes |

## Common Traps

> [!WARNING]
> **Common trap:** "Write to the database, then publish to Kafka" in the same method. A crash between the two loses the event or publishes an event for a rolled-back change. Use the outbox or change data capture.

## Interview Follow-up

- *"How do you keep order, payment and inventory consistent across services?"* A saga (orchestrated for clarity) with compensations, idempotent steps, the outbox for reliable events, and timeouts for stuck states.

## Key Takeaways

- Cross-service operations cannot use one local transaction.
- 2PC gives atomicity but blocks, adds latency and lowers availability — rarely used across microservices.
- Sagas chain local transactions with compensations; accept visible intermediate states and make steps idempotent.
- The transactional outbox makes "update data and publish event" atomic; consumers deduplicate.
