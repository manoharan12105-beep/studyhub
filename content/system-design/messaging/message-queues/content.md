# Message Queues

**Module:** Messaging and Event-Driven Systems · **Interview priority:** Core

## What Is It?

A **message queue** is a buffer between programs: **producers** (publishers) put messages in, **consumers** (subscribers, workers) take them out and process them, and the **broker** — RabbitMQ, Amazon SQS, Kafka, ActiveMQ — stores messages safely in between.

```text
Order service ──"send receipt for order 77"──►  [ msg 4 | msg 3 | msg 2 | msg 1 ]  ──► Email worker 1
 (producer)                                            message queue (broker)         ──► Email worker 2
                                                              │ failed repeatedly
                                                              ▼
                                                     dead-letter queue
```

## Why It Exists

When someone buys a product, **updating inventory must be synchronous** — the last item must show as sold out immediately and the purchase must fail if stock is gone. But **sending the email, notifying the warehouse and updating analytics** can happen a few seconds later. If the order service called each of those directly, it would wait for all of them and fail whenever any of them failed. A queue lets it hand off the work and move on.

Benefits:

- **Lower latency** for the user: the request returns once the message is safely queued.
- **Decoupling:** producer and consumer deploy, scale and fail independently; the producer does not even need to know who consumes.
- **Buffering:** bursts are absorbed and processed at the consumers' pace (load levelling).
- **Reliability:** the broker stores, delivers, redelivers on failure and parks poison messages.
- **Scaling:** add consumers to process faster; scale them on queue depth.
- **Deferred work:** scheduled jobs, nightly reports, delayed retries.

**Golden rule:** if you can fire a request and not need its answer now, it can be asynchronous — emails, SMS, push notifications, OTP delivery, broadcasts, thumbnails, analytics.

## How It Works

### Acknowledgements and redelivery

A consumer receives a message, processes it, then **acknowledges** it; only then does the broker delete it. If the consumer crashes before acknowledging, the broker redelivers the message (after a visibility timeout in SQS, or when the connection drops in RabbitMQ). This is why most queues give **at-least-once** delivery and consumers must be **idempotent** ([Delivery Semantics](../delivery-semantics/content.md)).

### Pull vs push

- **Pull:** consumers ask the broker for messages when they have capacity (SQS, Kafka). Natural flow control.
- **Push:** the broker sends messages to consumers (RabbitMQ with a prefetch limit). Lower latency; needs a cap on unacknowledged messages per consumer so consumers are not overwhelmed.

### Ordering options

- **FIFO / strict order:** messages are processed in order. If message 3 keeps failing, everything behind it waits — strict ordering trades throughput and resilience.
- **Unordered (best effort):** failed messages are retried or moved aside while others continue. Higher throughput.
- **Priority queues:** higher-priority messages are delivered first regardless of arrival.
- **Per-key ordering** — the practical middle ground — is covered in [Ordering and Consumer Groups](../message-ordering-and-consumer-groups/content.md).

### Problems the queue must handle

- **Poison messages:** a malformed message that fails every time and would be retried forever → after N attempts, move it to a **dead-letter queue** ([Dead-Letter Queues](../dead-letter-and-retry-queues/content.md)).
- **Duplicates:** redelivery after a crash means a message may be processed twice → idempotent consumers.
- **Growing backlog:** consumers slower than producers → scale consumers or apply [backpressure](../backpressure/content.md).

**Think about it:** after placing an order, which steps go through a queue: charging the card, decrementing stock, sending the confirmation email, notifying the warehouse, recalculating the bestseller list?

<details>
<summary>Answer</summary>

Charging the card and decrementing stock stay **synchronous** (the user needs the outcome, and the order depends on them). The confirmation email, warehouse notification and bestseller update go through a queue — the order succeeds even if those services are slow or down, and they catch up later.

</details>

## When Not to Use

- **The caller needs the answer immediately** — a login, a price quote, a stock-trade execution: use a synchronous call.
- **Low traffic and simple systems** — a queue is another component to run, monitor and pay for.
- **Strict real-time** requirements where queueing delay is unacceptable.

## Common Traps

> [!WARNING]
> **Common trap:** "With a queue, each message is processed exactly once." Most queues deliver at least once; crashes and timeouts cause redelivery. Consumers must handle duplicates.

## Interview Follow-up

- *"Why not call the email service directly from the order service?"* The order request would wait for email delivery and fail when the email service fails; a queue decouples them, absorbs bursts and retries failures, while the order returns immediately.

## Key Takeaways

- Producers put messages in, consumers process them, the broker stores and redelivers.
- Queues give low latency, decoupling, buffering, reliability and independent scaling for work that can happen later.
- Messages are deleted only after acknowledgement, so delivery is usually at least once — consumers must be idempotent.
- Handle poison messages with dead-letter queues and backlogs with scaling or backpressure; don't use queues where an immediate answer is needed.
