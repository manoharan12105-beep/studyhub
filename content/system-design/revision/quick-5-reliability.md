# Block 5: Reliability and Operations

Block 5 of 6, about ten minutes.

## 1. Surviving Failure (4 min)

- Hardware faults are random → redundancy. Software and human faults are correlated → canaries, automation, rollback.
- Find SPOFs on every path (LB, primary DB, region, DNS, config, deploys).
- Active-passive (stateful) vs active-active (stateless); spread across zones; keep spare capacity; test failover.
- Every call: **timeout** from the latency budget. Retry only transient errors of idempotent operations, capped, **exponential backoff + jitter**, in one layer only (retries multiply).
- **Circuit breaker** (closed → open → half-open) stops calls to a broken dependency; **bulkhead** caps resources per dependency; **fallback** serves something cheap.
- **Idempotency keys** (client-generated, stored atomically) make retries of payments and orders safe.
- Degrade gracefully (turn off optional features, serve stale) and **shed load early** (503/429) — unbounded queues collapse.
- DR: **RPO** = data loss, **RTO** = downtime. Point-in-time backups, 3-2-1, immutable copies, restore tests. Backup-restore → pilot light → warm standby → active-active.

## 2. Messaging (3 min)

- Queues: decouple, buffer, retry async work. Ack after processing → **at-least-once** → idempotent consumers. Poison messages → **DLQ** + alert + redrive.
- Queue = one consumer per message; pub/sub = every subscriber; fan-out to per-service queues/consumer groups.
- Order is per partition (key); partitions cap consumer parallelism.
- Backpressure: scale consumers, bound queues, slow producers, shed low-value data.
- Kafka = replayable partitioned log (streams, CDC); RabbitMQ = routing broker (tasks, priorities, DLX).
- Events (facts) vs commands; choreography vs orchestration; outbox for reliable publishing.

## 3. Observability (3 min)

- Metrics (what, how much) · logs (exact events; structured, with trace IDs) · traces (which hop).
- Percentiles, not averages: P50 typical, P95/P99 tail; never average percentiles; fan-out makes the tail common.
- Golden signals: latency, traffic, errors, saturation. RED for services, USE for resources.
- Page on user-facing symptoms and SLO burn; tickets for causes; runbooks; blameless reviews.
