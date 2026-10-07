# Important Comparisons

The comparisons interviewers ask for most, side by side.

## HLD vs LLD

| | HLD | LLD |
|---|-----|-----|
| Unit | Services, stores, network paths | Classes, methods, data structures |
| Questions | Where does data live? What scales? What fails? | Is it correct? Easy to change? |
| Artefact | Architecture diagram | Class diagram, code |

## Vertical vs Horizontal Scaling

| | Vertical | Horizontal |
|---|----------|------------|
| How | Bigger machine | More machines |
| Limit | Largest machine | Practically none |
| Failure | Single point of failure | Survives instance loss |
| Needs | Nothing | Load balancer, stateless servers, shared data |

## Monolith vs Modular Monolith vs Microservices

| | Monolith | Modular monolith | Microservices |
|---|----------|------------------|---------------|
| Deployables | 1 | 1 | Many |
| Calls | In-process | In-process via module APIs | Network |
| Data | Shared | Schema per module | Database per service |
| Scaling | Whole app | Whole app | Per service |
| Ops effort | Low | Low | High |

## Stateless vs Stateful

| | Stateless | Stateful |
|---|-----------|----------|
| State lives | External stores, tokens | Server memory/disk |
| Load balancing | Any server | Must route to the owner |
| Crash loses | In-flight requests | Sessions/data |

## SQL vs NoSQL

| | Relational | NoSQL (family-dependent) |
|---|-----------|--------------------------|
| Model | Tables, joins | Key-value, document, wide-column, graph |
| Schema | Fixed | Flexible |
| Transactions | Multi-row ACID | Usually per key/document/partition |
| Write scaling | One primary until sharded | Built-in partitioning |
| Strength | Integrity, ad-hoc queries | Specific access patterns at scale |

## Cache-Aside vs Read-Through vs Write-Through vs Write-Around vs Write-Back

| | Who loads on miss | Write path | Risk |
|---|-------------------|------------|------|
| Cache-aside | Application | DB, then delete key | Stale window, stampedes |
| Read-through | Cache layer | (pairs with a write strategy) | Same, centralised |
| Write-through | — | Cache + DB synchronously | Slower writes, pollution |
| Write-around | — | DB only | Miss after write |
| Write-back | — | Cache now, DB later | Lost unflushed writes |

## CDN vs Application Cache

| | CDN | Redis/Memcached |
|---|-----|-----------------|
| Where | Edge, near users | Data centre, near app |
| Saves | Distance, origin bandwidth | Queries, computation |
| Caches | HTTP responses (mostly public) | Any data |
| Controlled by | HTTP headers, purge | Application code |

## L4 vs L7 Load Balancer

| | L4 | L7 |
|---|----|----|
| Sees | IPs, ports | HTTP method, path, headers |
| Balances | Connections | Requests |
| TLS | Passes through | Terminates |
| Routing by path | No | Yes |
| Overhead | Lowest | Higher |

## Sync vs Async Replication

| | Synchronous | Asynchronous |
|---|-------------|--------------|
| Ack after | Replicas confirm | Primary commits |
| Latency | Higher | Lower |
| Loss on failover | None | Recent writes possible |
| Replica slow/down | Writes slow/block | Writes unaffected |

## Replication vs Sharding

| | Replication | Sharding |
|---|-------------|----------|
| Each node holds | All data | Part of the data |
| Scales | Reads, availability | Size, writes |
| New problems | Lag, failover | Keys, cross-shard queries, resharding |

## Strong vs Eventual Consistency

| | Strong | Eventual |
|---|--------|----------|
| Reads return | Latest write | Possibly stale |
| Cost | Coordination latency; unavailability in partitions | Anomalies to design around |
| Use | Money, stock, locks, identity | Feeds, counts, caches, search |

## Queue vs Pub/Sub

| | Point-to-point queue | Pub/sub |
|---|----------------------|---------|
| Each message to | One consumer | Every subscriber |
| Purpose | Distribute work | Broadcast events |

## Kafka vs RabbitMQ

| | Kafka | RabbitMQ |
|---|-------|----------|
| Model | Partitioned, replicated log | Broker: exchanges → queues |
| After consumption | Retained (replayable) | Deleted on ack (classic queues) |
| Ordering | Per partition | Per queue |
| Best for | Event streams, CDC, analytics | Task queues, routing, per-message features |

## REST vs GraphQL vs gRPC (vs SOAP)

| | REST | GraphQL | gRPC | SOAP |
|---|------|---------|------|------|
| Format | JSON | JSON | Protobuf (binary) | XML |
| Endpoints | Many | One | Service methods | One per service |
| Caching | Excellent | Hard | Hard | Poor |
| Best for | Public APIs | Flexible front ends | Internal, low latency | Legacy enterprise |

## Polling vs Long Polling vs SSE vs WebSockets

| | Direction | Cost | Use |
|---|-----------|------|-----|
| Short polling | Client pulls | Many empty requests | Rare updates |
| Long polling | Server answers when ready | Held requests | Fallback |
| SSE | Server → client | Open connection | Notifications, live feeds |
| WebSockets | Both ways | Open connection, stateful | Chat, games |

## At-Most-Once vs At-Least-Once vs Exactly-Once

| | Lost? | Duplicated? | How |
|---|-------|-------------|-----|
| At-most-once | Possible | Never | Ack before processing |
| At-least-once | Never | Possible | Ack after processing |
| Exactly-once (effect) | Never | Effect once | At-least-once + idempotency/transactions |

## Active-Passive vs Active-Active

| | Active-passive | Active-active |
|---|----------------|---------------|
| Normal | One serves | All serve |
| Failure | Promote standby | Others absorb |
| Fits | Stateful primaries | Stateless tiers |

## RPO vs RTO

| | RPO | RTO |
|---|-----|-----|
| Measures | Data loss (time) | Downtime |
| Improved by | Continuous log archiving, sync replication | Standbys, automation, runbooks |

## Timeout vs Retry vs Circuit Breaker vs Bulkhead

| | Prevents | Effect on load |
|---|----------|----------------|
| Timeout | Waiting forever | Frees resources |
| Retry | Transient failures surfacing | Adds load |
| Circuit breaker | Hammering a broken dependency | Removes load |
| Bulkhead | One dependency starving others | Caps load |

## P50 vs P95 vs P99 (vs Average)

| | Describes | Use |
|---|-----------|-----|
| Average | Sum ÷ count (outlier-sensitive) | Capacity maths |
| P50 | Typical request | User experience |
| P95 | Slow-ish requests | SLOs |
| P99 | The tail | SLOs, heavy users, fan-out |

## 2PC vs Saga

| | 2PC | Saga |
|---|-----|------|
| Atomicity | Immediate | Eventual (compensations) |
| Isolation | Yes | No |
| Failure | Blocks | Retries/compensates |
| Fits | Inside one database system | Microservices |
