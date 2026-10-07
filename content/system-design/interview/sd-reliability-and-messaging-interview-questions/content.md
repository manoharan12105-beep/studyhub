# Interview Questions: Reliability, Messaging and Operations

**Module:** Interview Preparation · **Interview priority:** Core

## What Is It?

A mixed [question bank](interview-questions.md) covering the Reliability, Messaging and Observability modules: failures and single points of failure, redundancy and failover, timeouts, retries and backoff, circuit breakers and bulkheads, idempotency, graceful degradation, disaster recovery, queues and pub/sub, delivery semantics, ordering, dead-letter queues, backpressure, Kafka and RabbitMQ, event-driven design, metrics, logs, traces, percentiles and alerting.

## Why It Matters

Senior-level design answers are judged by how the system behaves **when things go wrong**. Interviewers ask "what if this times out?", "what if the message is delivered twice?", "how would you know it's broken?" — these questions rehearse those answers.

## Core Concept

### The reliability checklist for any design

- Every network call: timeout, bounded retries with backoff and jitter, idempotency.
- Every dependency: circuit breaker, bulkhead, fallback, criticality class.
- Every async flow: at-least-once delivery, idempotent consumers, DLQ, lag monitoring, backpressure.
- Every data store: replication, failover, backups with tested restores, RPO/RTO.
- Every service: golden signals, structured logs with trace IDs, SLO-based alerts.

### Where to revise

[Reliability](../../reliability/failures-and-single-points-of-failure/content.md), [Messaging](../../messaging/message-queues/content.md) and [Observability](../../observability/observability-fundamentals/content.md) modules; the retry/circuit-breaker and message-queue simulations.

## Key Takeaways

- Assume every call can fail, hang or be duplicated, and design for it.
- Retries need idempotency; queues need idempotent consumers and DLQs.
- You cannot fix what you cannot see: measure golden signals and alert on user impact.
