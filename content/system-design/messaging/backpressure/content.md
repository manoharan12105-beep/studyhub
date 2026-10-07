# Backpressure

**Module:** Messaging and Event-Driven Systems · **Interview priority:** Frequently asked

> [!NOTE]
> **Advanced topic.** Builds on [Message Queues](../message-queues/content.md) and [Capacity Planning](../../scaling-and-distribution/capacity-planning-and-bottlenecks/content.md).

## What Is It?

**Backpressure** is a signal travelling **upstream**, from a component that cannot keep up to the components feeding it: "slow down". It is how a pipeline matches the producers' rate to what the slowest stage can actually handle, instead of letting work pile up somewhere until something breaks.

```text
producer (5,000/s) ──► queue ──► consumer (3,000/s)
                         ▲            │
                         └─ "full / slow down" (backpressure)
```

## Why It Exists

When producers are faster than consumers, the difference accumulates. A queue absorbs short bursts — that is its job — but under **sustained** overload it only delays the failure: the backlog grows without bound, latency rises from seconds to hours, memory or disk runs out, and messages expire before they are processed. Something must give; backpressure makes the choice deliberate.

## How It Works

### Detect it

- **Queue depth** and **consumer lag** (how far consumers are behind the newest message) growing steadily.
- **Age of the oldest message** rising.
- Consumer CPU or downstream latency saturated.

### Respond to it — four options

| Option | How | Trade-off |
|--------|-----|-----------|
| **Scale consumers** | Autoscale on queue depth or lag; batch work | Limited by partitions and downstream capacity (the database may be the real limit) |
| **Bounded queues + block or reject** | Fixed-size buffers; when full, the producer blocks or gets an error (429/503) | Pushes the problem upstream — to a place that can decide (the client can retry later) |
| **Slow the producers** | Pull-based consumption, credit/window flow control, rate limits on producers | Producers need a way to wait or shed themselves |
| **Shed or sample** | Drop low-priority or superseded messages (old location updates, debug logs), keep critical ones | Data loss, by design |

The worst option is the implicit one: **unbounded buffers everywhere**, so nothing pushes back until a process runs out of memory.

### Backpressure in practice

- **TCP** has it built in: a receiver advertises its window; a sender cannot outrun it ([Flow Control](../../../computer-networks/flow-and-congestion-control/tcp-flow-control/content.md)).
- **Pull-based brokers** (Kafka, SQS) let consumers fetch only what they can handle; the backlog stays in the durable broker, not in consumer memory.
- **Reactive streams** (Project Reactor, RxJava, Akka Streams) propagate demand: a subscriber requests N items and the publisher sends no more.
- **Thread pools with bounded queues** and a rejection policy (caller-runs, or reject) stop a service from accepting more work than it can finish.
- **At the edge**, backpressure becomes [load shedding and rate limiting](../../reliability/graceful-degradation-and-load-shedding/content.md): reject early with 429/503 and `Retry-After`.

**Think about it:** an analytics consumer writes events to a database that handles 2,000 inserts/s. Events arrive at 6,000/s during the evening peak. Adding consumers does not help. Why, and what are your options?

<details>
<summary>Answer</summary>

The database, not the consumer count, is the bottleneck — more consumers only increase contention. Options: batch inserts (one insert of 500 rows instead of 500 inserts — often a huge gain), let the backlog build in the durable broker during the peak and drain it afterwards (if delay is acceptable), aggregate or sample events before writing, or scale the database tier (a write-optimised store, partitioning).

</details>

## Common Traps

> [!WARNING]
> **Common trap:** "Just make the queue bigger." A bigger queue only postpones the failure under sustained overload, while latency grows. Fix the rate mismatch: scale, batch, slow producers, or shed.

## Interview Follow-up

- *"What happens when consumers can't keep up?"* Lag grows; autoscale consumers on lag, batch writes, use bounded buffers so producers are slowed or rejected, and shed low-priority data — choosing based on whether delay or loss is acceptable.

## Key Takeaways

- Backpressure is the "slow down" signal from a slow stage to its producers.
- Queues absorb bursts but not sustained overload; unbounded buffers turn overload into memory exhaustion and huge latency.
- Respond by scaling consumers (if the bottleneck is theirs), bounding buffers, slowing producers, or shedding low-value work.
- Monitor queue depth, consumer lag and oldest-message age.
