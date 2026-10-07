# Event-Driven Architecture

**Module:** Messaging and Event-Driven Systems · **Interview priority:** Frequently asked

> [!NOTE]
> **Advanced topic.** Builds on [Queues vs Pub/Sub](../queues-vs-pub-sub/content.md) and [Distributed Transactions and Sagas](../../consistency-and-coordination/distributed-transactions-and-sagas/content.md).

## What Is It?

In an **event-driven architecture (EDA)**, services communicate by publishing **events** — facts about something that already happened ("OrderPlaced", "PaymentFailed", "UserMoved") — and other services **react** to the events they care about, instead of calling each other directly.

```text
Request-driven:   Order service ──calls──► Payment ──calls──► Inventory ──calls──► Email
Event-driven:     Order service ──"OrderPlaced"──► broker ──► Payment, Inventory, Email, Analytics (each reacts)
```

## Why It Exists

Synchronous call chains couple services tightly: the caller must know every callee, waits for each, and fails if any is down ([availability multiplies down](../../foundations/sla-slo-sli-and-availability/content.md)). Events let a producer announce a fact once; any number of consumers react independently, at their own pace, and new consumers can be added without changing the producer.

## How It Works

### Events vs commands

| | Event | Command |
|---|-------|---------|
| Meaning | Something **happened** (past tense): `OrderPlaced` | Please **do** something: `ChargeCard` |
| Sender knows the receivers? | No — anyone may react | Yes — addressed to one handler |
| Can be rejected? | No; it is a fact | Yes |
| Typical channel | Pub/sub topic | Point-to-point queue or direct call |

### Event styles

- **Event notification:** a thin event ("Order 77 changed"); consumers call back for details. Simple, but creates callbacks to the producer.
- **Event-carried state transfer:** the event contains the data consumers need (items, amounts, address), so they keep their own copies and never call back. More decoupled; larger events and duplicated data.
- **Event sourcing (awareness):** the events **are** the source of truth — an account's state is rebuilt by replaying `Deposited`/`Withdrawn` events. Full audit history and replay, at the cost of complexity (schema evolution of events, snapshots, rebuilding read models). Often paired with **CQRS** — separate models for writes and for reads.

### Choreography vs orchestration

- **Choreography:** each service reacts to events and emits new ones; there is no central controller. Very decoupled; the end-to-end flow is implicit and hard to follow or change.
- **Orchestration:** a coordinator tells services what to do (commands) and listens for results. The flow is explicit; the orchestrator is a central piece to run reliably.

Many systems choreograph broadcasts (notifications, analytics) and orchestrate multi-step business processes (checkout sagas).

### What you must handle

- **Eventual consistency:** consumers update after the producer; the UI must tolerate "processing" states ([Consistency Models](../../consistency-and-coordination/consistency-models/content.md)).
- **Reliable publishing:** the transactional outbox, so an event is published if and only if the change committed.
- **Duplicates and ordering:** at-least-once delivery and per-key ordering ([Delivery Semantics](../delivery-semantics/content.md)).
- **Schema evolution:** events are contracts — add fields compatibly, version when breaking, use a schema registry.
- **Observability:** following one business flow across many asynchronous hops needs correlation IDs and [tracing](../../observability/distributed-tracing/content.md).

**Think about it:** a product team wants to add "send a coupon when a user places their 10th order". In a request-driven design, the order service would have to call a new coupon service. How does it work in an event-driven design?

<details>
<summary>Answer</summary>

The new coupon service subscribes to the existing `OrderPlaced` events, keeps its own count of orders per user, and issues a coupon on the 10th. The order service does not change at all — that independence is the main benefit of events (with idempotent handling so a redelivered event does not count twice).

</details>

## When Not to Use

When the caller needs an immediate answer (authorisation, price quotes), for simple CRUD systems with one service, or when the team lacks tooling to trace and debug asynchronous flows. Events add eventual consistency and operational complexity that small systems don't need.

## Common Traps

> [!WARNING]
> **Common trap:** "commands disguised as events" — publishing `SendEmailNow` to a topic expecting exactly one specific service to act. That hides a direct dependency inside the broker. Use a command queue for commands and events for facts.

## Interview Follow-up

- *"How would you keep the search index and analytics in sync with orders?"* Publish order events reliably (outbox or CDC); the search indexer and analytics pipeline consume them independently and idempotently; accept seconds of lag.

## Key Takeaways

- Services publish events (facts) and others react, decoupling producers from consumers.
- Events are past-tense facts for anyone; commands are requests to one handler.
- Styles: notification, event-carried state transfer, event sourcing (with CQRS).
- Choreography is decoupled but implicit; orchestration is explicit but central.
- Plan for eventual consistency, reliable publishing, duplicates, ordering, schema evolution and tracing.
