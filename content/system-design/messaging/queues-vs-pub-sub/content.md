# Point-to-Point Queues vs Publish-Subscribe

**Module:** Messaging and Event-Driven Systems · **Interview priority:** Core

## What Is It?

Two messaging models:

- **Point-to-point (work queue):** each message is processed by **exactly one** of the consumers. Several consumers share the work — like checkout lanes serving one line of customers.
- **Publish-subscribe (pub/sub):** each message is delivered to **every subscriber**. A publisher sends to a **topic**; each subscribing service gets its own copy — like a newsletter delivered to every subscriber.

```text
Point-to-point                         Publish-subscribe
              ┌► worker 1 (msg 1, 3)                     ┌► email service      (gets msg 1, 2, 3)
producer ─► Q ┤                        publisher ─► topic ┼► analytics service  (gets msg 1, 2, 3)
              └► worker 2 (msg 2)                         └► search indexer     (gets msg 1, 2, 3)
```

## Why It Exists

They answer different questions. "Who will do this job?" — one worker, so the job is done once (resize this image, send this email). "Who needs to know this happened?" — possibly many services, each reacting in its own way (an order was placed: email, analytics, inventory, fraud detection).

## How It Works

### Combining both: fan-out to queues

The common production pattern gives each subscribing service its **own queue** subscribed to the topic, then lets that service's workers share the queue:

```text
              ┌► queue: email      ─► email workers ×3      (each message handled once by email)
"OrderPlaced" ┼► queue: analytics  ─► analytics workers ×2
   topic      └► queue: warehouse  ─► warehouse workers ×4
```

Every service receives every event (pub/sub), and within a service each event is handled once (point-to-point). Examples: SNS topic → SQS queues; a RabbitMQ fanout exchange → one queue per service; Kafka topics with one **consumer group** per service ([Consumer Groups](../message-ordering-and-consumer-groups/content.md)).

### Adding a new consumer

With pub/sub, adding a "loyalty points" service needs no change to the order service — it just subscribes. With point-to-point only, the producer would have to send a separate message to each new consumer, coupling it to all of them.

### Message retention

Classic queues delete a message once it is acknowledged. Log-based brokers (Kafka) keep messages for a retention period whether consumed or not, so new subscribers can **replay** history and a buggy consumer can reprocess after a fix ([Kafka vs RabbitMQ](../kafka-vs-rabbitmq/content.md)).

**Think about it:** a "UserSignedUp" event must trigger a welcome email, a CRM update and a fraud check. The email service runs 5 instances. How should messaging be arranged so each user gets exactly one welcome email?

<details>
<summary>Answer</summary>

Publish "UserSignedUp" to a topic; give the email, CRM and fraud services one subscription (queue or consumer group) each. The 5 email instances consume from the email queue as competing consumers, so each event is processed by one of them — plus idempotency by user ID, since delivery is at least once.

</details>

## Comparison

| | Point-to-point queue | Publish-subscribe |
|---|----------------------|-------------------|
| Each message goes to | One consumer | Every subscriber |
| Purpose | Distribute work | Broadcast events |
| Adding a consumer | Shares the existing work | Gets its own copy of all events |
| Producer knows consumers? | Effectively, one logical consumer | No |
| Example | Image-resize jobs | "OrderPlaced" to email, analytics, inventory |

## Common Traps

> [!WARNING]
> **Common trap:** subscribing every instance of a service directly to a topic. Each instance then receives every message, so the welcome email is sent five times. Instances of one service must share a subscription (queue or consumer group).

## Interview Follow-up

- *"When would you use pub/sub instead of a queue?"* When several independent services must react to the same event, and you want to add more later without touching the producer.

## Key Takeaways

- Point-to-point: each message processed once by one of many workers — for distributing work.
- Pub/sub: each message delivered to every subscriber — for broadcasting events.
- Fan-out to per-service queues (or consumer groups) combines them: every service gets every event, each event processed once per service.
- Log-based brokers retain messages for replay.
