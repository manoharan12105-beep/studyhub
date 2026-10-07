# Event-Driven Architecture — Interview Questions

## Beginner

### Q1. What is event-driven architecture?

**Style:** Direct

<details>
<summary>Answer</summary>

An architecture in which services communicate by publishing events — records of things that happened — to a broker, and other services subscribe and react, rather than calling each other synchronously. Producers do not know their consumers, which decouples services in time, availability and deployment.

</details>

### Q2. What is the difference between an event and a command?

**Style:** Comparison

<details>
<summary>Answer</summary>

An event states a fact that already happened (`OrderPlaced`), is broadcast to any interested consumers and cannot be rejected. A command requests an action (`ChargeCard`), is addressed to a specific handler, and can be accepted or rejected.

</details>

## Intermediate

### Q3. What are the benefits and costs of event-driven architecture?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Benefits: loose coupling (add consumers without touching producers), resilience (consumers can be down and catch up), independent scaling, natural audit streams and easy integration of analytics and search. Costs: eventual consistency between services, harder debugging and tracing of flows, duplicate and out-of-order handling, schema evolution of events, and more infrastructure.

</details>

### Q4. Choreography vs orchestration?

**Style:** Comparison

<details>
<summary>Answer</summary>

Choreography: services react to each other's events with no central coordinator — highly decoupled, but the overall process is implicit, hard to visualise, and changes may touch many services. Orchestration: a central orchestrator sends commands and tracks state — the process is explicit and easier to monitor and modify, but the orchestrator is an additional critical component.

</details>

### Q5. What is event-carried state transfer?

**Style:** Direct

<details>
<summary>Answer</summary>

Events that include the data consumers need (for example the full order with items and address) rather than just an ID, so consumers maintain their own local copies and never call back to the producer. It increases decoupling and resilience at the cost of larger events and duplicated, eventually consistent data.

</details>

## Advanced

### Q6. What is event sourcing, and when is it worth it?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Storing every state change as an immutable event and deriving current state by replaying events (with periodic snapshots), instead of storing only the latest state. It gives a full audit trail, time travel and the ability to build new read models from history. It is worth it for domains needing auditability and complex state transitions (ledgers, order workflows); it adds complexity in event schema evolution, rebuilding projections and querying, so it is overkill for simple CRUD.

</details>

### Q7. How do you debug a business flow that spans eight services communicating by events?

**Style:** Debugging

<details>
<summary>Answer</summary>

Propagate a correlation (trace) ID in every event's metadata and in logs; use distributed tracing that links producer and consumer spans; build dashboards of consumer lag and DLQ arrivals per service; keep the event history (a log-based broker or an audit store) to see what was published when; and for complex processes, consider an orchestrator that records state explicitly.

</details>
