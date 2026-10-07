# Kafka vs RabbitMQ

**Module:** Messaging and Event-Driven Systems · **Interview priority:** Frequently asked

## What Is It?

The two most common open-source messaging systems, built on different models:

- **Apache Kafka** is a **distributed, partitioned, replicated log**. Producers append records to topic partitions; records are **retained** for a configured time (or forever) whether or not anyone read them; consumers track their own **offset** (position) and can re-read.
- **RabbitMQ** is a **message broker** implementing AMQP: producers publish to **exchanges**, which **route** messages to **queues** by rules; consumers receive messages, acknowledge them, and the broker **deletes** acknowledged messages.

## Why It Exists

Interviewers ask "Kafka or RabbitMQ?" to see whether you understand the difference between a **stream of events to be kept and replayed** and **tasks to be routed and completed** — not to hear a brand name.

## How It Works

### Kafka's model

```text
topic "orders"   P0: [0][1][2][3][4][5] ← append          consumer group "billing"   offset P0 = 4
                 P1: [0][1][2][3]                           consumer group "analytics" offset P0 = 1
                 P2: [0][1][2][3][4]     retained 7 days    (each group reads at its own pace)
```

- Throughput comes from sequential disk appends, batching and partitions spread across brokers; replication (leader + followers per partition) gives durability.
- Order within a partition; consumer groups for parallelism ([Ordering and Consumer Groups](../message-ordering-and-consumer-groups/content.md)).
- Replay: a new service can read history from the beginning; a buggy consumer can rewind its offset after a fix.
- Well suited to **event streaming**: activity tracking, change data capture, log and metrics pipelines, event sourcing, feeding analytics and search indexes, stream processing (Kafka Streams, Flink).

### RabbitMQ's model

```text
producer ─► exchange ──(routing key "order.paid")──► queue "billing"   ─► consumers (ack → deleted)
            (direct / topic /                    └─► queue "email"     ─► consumers
             fanout / headers)
```

- **Flexible routing:** direct (exact key), topic (wildcards like `order.*`), fanout (to all bound queues), headers.
- Per-message features: acknowledgements, priorities, TTLs, dead-letter exchanges, delayed delivery (via plugin), request/reply.
- Push delivery with a prefetch limit; low latency for individual messages.
- Well suited to **task queues and work distribution**: background jobs, complex routing between services, RPC-style messaging, per-message retry handling.

## Comparison

| Aspect | Kafka | RabbitMQ |
|--------|-------|----------|
| Core model | Partitioned, replicated append-only log | Broker with exchanges routing to queues |
| After consumption | Messages stay until retention expires | Acknowledged messages are deleted |
| Replay | Yes, by resetting offsets | Not for classic queues (once acknowledged, gone); RabbitMQ Streams (3.9+) add a log-style, replayable queue type |
| Consumption | Pull; consumer tracks offsets | Push with prefetch (pull also possible) |
| Ordering | Per partition | Per queue (with one consumer); weakened by competing consumers and requeues |
| Routing | Topic + key → partition | Rich: direct, topic patterns, fanout, headers |
| Throughput | Very high (millions of messages/s per cluster) | High (tens of thousands per queue; scaled with more queues/nodes) |
| Per-message features | Minimal (no priorities, no per-message delay) | Priorities, TTL, DLX, delays, RPC |
| Typical uses | Event streaming, logs, CDC, analytics pipelines, event sourcing | Task queues, job processing, flexible service-to-service messaging |

Managed alternatives fill the same roles: Amazon SQS/SNS (simple queues and fan-out), Google Pub/Sub, Amazon Kinesis and Azure Event Hubs (Kafka-like streams).

**Think about it:** a team needs (a) every order event to feed billing, search indexing and a new fraud model that must be trained on the last 30 days of events, and (b) a pool of workers to generate PDF invoices with retries and priorities. Which system for each?

<details>
<summary>Answer</summary>

(a) **Kafka**: several consumer groups read the same stream independently, and the fraud team can replay 30 days of retained events. (b) **RabbitMQ** (or SQS): a work queue with acknowledgements, priorities, dead-lettering and per-message retry is exactly its strength.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** "Kafka is just a faster RabbitMQ." They solve different problems: a durable, replayable event log versus a routing broker for tasks. Choosing Kafka for a simple job queue adds operational weight; choosing RabbitMQ for event replay is not possible.

## Interview Follow-up

- *"Why Kafka in your design?"* Because multiple independent consumers need the same events, we need replay and high throughput, and per-key ordering by partition fits our entities — not because it is popular.

## Key Takeaways

- Kafka: a replicated, partitioned log; retention and replay; consumer groups; very high throughput; per-partition order.
- RabbitMQ: a broker with exchanges and queues; flexible routing; per-message acks, priorities, TTLs and dead-lettering; messages deleted after ack.
- Event streams and replay → Kafka. Task queues and routing → RabbitMQ (or SQS).
