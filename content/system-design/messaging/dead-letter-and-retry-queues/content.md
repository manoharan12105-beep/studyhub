# Dead-Letter and Retry Queues

**Module:** Messaging and Event-Driven Systems · **Interview priority:** Frequently asked

## What Is It?

- A **retry queue** holds messages whose processing failed, so they can be tried again **after a delay**, without blocking the main queue.
- A **dead-letter queue (DLQ)** holds messages that failed **too many times** (or are invalid, or expired), parked for inspection and possible reprocessing instead of being retried forever or silently dropped.

```text
main queue ──► consumer ── success ──► ack
                  │ failure
                  ▼
        retry queue (wait 10 s) ──► back to consumer ── fails again ──► retry (wait 1 min) ──►
                  … after N attempts ──► dead-letter queue ──► alert, inspect, fix, redrive
```

## Why It Exists

Failures come in two kinds:

- **Transient:** a dependency was briefly down, a timeout, a lock conflict. Retrying later usually succeeds.
- **Permanent (poison messages):** malformed JSON, an unknown type, a reference to a deleted record, a bug triggered by this input. Retrying never helps.

Without limits, a poison message is redelivered forever — wasting resources and, in ordered queues, blocking everything behind it. Without a DLQ, giving up means losing the message silently.

## How It Works

### Retry with delays

Immediate redelivery hammers a struggling dependency. Delayed retries apply [exponential backoff](../../reliability/timeouts-retries-and-backoff/content.md) to messaging:

- **Delay queues / visibility timeouts:** SQS lets a message reappear after a set time; increase it per attempt.
- **Tiered retry topics:** `orders-retry-10s`, `orders-retry-1m`, `orders-retry-10m`, then the DLQ (a common Kafka pattern, since Kafka has no per-message delay).
- **Track the attempt count** in a message header or the broker's receive count.

Classify errors in the consumer: send transient errors to retry; send obviously permanent ones (validation failures) **straight to the DLQ** — retrying them only adds delay.

### The dead-letter queue

- Configure the broker's **max receive count** (SQS redrive policy, RabbitMQ dead-letter exchange) or route explicitly from the consumer.
- Keep the original message **plus context**: error message, stack trace reference, attempt count, timestamps, consumer version.
- **Alert** when messages arrive in the DLQ — a growing DLQ is an incident, not a storage location.
- After fixing the bug or data, **redrive**: move messages back to the main queue for reprocessing (idempotent consumers make this safe).
- Set retention long enough to investigate (days), and decide what happens to messages nobody fixes.

**Think about it:** a consumer fails on 2 % of messages because one product has a null price, and the broker redelivers immediately and forever. What are the consequences, and how should it be configured?

<details>
<summary>Answer</summary>

Those messages loop forever, consuming consumer capacity (2 % of messages each retried endlessly grows to dominate the work), filling logs, and — in an ordered queue — blocking later messages. Configure a max receive count (say 5) with increasing delays and a DLQ; classify the null-price error as permanent and dead-letter it immediately; alert on DLQ arrivals; fix the data and redrive.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** a DLQ that nobody monitors. Messages pile up for weeks and represent lost orders, emails or payments. Alert on DLQ depth and age, and own the redrive process.

- **Retries that break ordering:** moving one message to a retry queue while later messages for the same key continue reorders them ([Ordering](../message-ordering-and-consumer-groups/content.md)).

## Interview Follow-up

- *"What happens to a message that keeps failing?"* After a bounded number of delayed retries it moves to a DLQ with error context; an alert fires; engineers fix the cause and redrive; consumers are idempotent so reprocessing is safe.

## Key Takeaways

- Retry queues delay retries for transient failures without blocking the main flow; use increasing delays.
- Poison messages must not retry forever: cap attempts and move them to a dead-letter queue.
- Send permanent errors straight to the DLQ; keep error context; alert on DLQ growth; redrive after fixes.
- Watch ordering when retrying keyed messages.
