# Message Queues — Interview Questions

## Beginner

### Q1. What is a message queue and why use one?

**Style:** Direct

<details>
<summary>Answer</summary>

A broker-managed buffer where producers put messages and consumers take them to process asynchronously. It reduces user-facing latency by deferring work, decouples services so they scale and fail independently, absorbs traffic bursts, retries failed processing, and lets consumers scale with the backlog.

</details>

### Q2. Which operations should be asynchronous after a purchase, and which synchronous?

**Style:** Scenario

<details>
<summary>Answer</summary>

Synchronous: payment authorisation and stock reservation, because the purchase outcome depends on them. Asynchronous: confirmation emails and SMS, warehouse notifications, loyalty points, analytics, recommendations — their delay or temporary failure should not affect the purchase.

</details>

### Q3. What is the difference between pull and push consumption?

**Style:** Comparison

<details>
<summary>Answer</summary>

In pull, consumers request messages when they have capacity, which naturally limits their load. In push, the broker delivers messages to consumers as they arrive, giving lower latency but requiring a prefetch or in-flight limit so a consumer is not overwhelmed.

</details>

## Intermediate

### Q4. How do acknowledgements work, and what happens if a consumer crashes?

**Style:** How

<details>
<summary>Answer</summary>

The broker keeps a delivered message until the consumer acknowledges it after processing. If the consumer crashes or its visibility timeout expires before acknowledging, the broker makes the message available again and redelivers it, possibly to another consumer. This prevents loss but can cause duplicates, so processing must be idempotent.

</details>

### Q5. When should you not use a message queue?

**Style:** Why not

<details>
<summary>Answer</summary>

When the caller needs the result immediately (login, a price check, executing a trade), when strict real-time latency rules out queueing delay, or when traffic is low and the added cost and operational complexity outweigh the benefits. A synchronous call is simpler there.

</details>

### Q6. What is a poison message?

**Style:** Direct

<details>
<summary>Answer</summary>

A message that causes processing to fail every time (malformed data, an unhandled case, a reference to deleted data). Without a limit it is redelivered forever, wasting resources and, in strictly ordered queues, blocking everything behind it. After a maximum number of attempts it should be moved to a dead-letter queue for inspection.

</details>

## Advanced

### Q7. Producers publish 5,000 messages/s, consumers process 3,000/s. What happens and what do you do?

**Style:** What happens if

<details>
<summary>Answer</summary>

The backlog grows by about 2,000 messages per second (7.2 million per hour), so processing delay keeps increasing and the broker may eventually run out of storage. Scale consumers (autoscale on queue depth or consumer lag), optimise processing (batching), and if the excess persists, apply backpressure or rate limits to producers or shed low-priority messages.

</details>

### Q8. How do you guarantee the email is sent if the order is saved, without a distributed transaction?

**Style:** Design

<details>
<summary>Answer</summary>

Use the transactional outbox: save the order and an "OrderPlaced" outbox row in the same database transaction; a relay publishes outbox rows to the queue with retries; the email consumer processes the event idempotently (deduplicating by event ID). The event is published if and only if the order committed, at least once.

</details>
