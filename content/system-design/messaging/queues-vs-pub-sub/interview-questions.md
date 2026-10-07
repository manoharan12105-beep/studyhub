# Point-to-Point Queues vs Publish-Subscribe — Interview Questions

## Beginner

### Q1. What is the difference between a message queue and pub/sub?

**Style:** Comparison

<details>
<summary>Answer</summary>

In a point-to-point queue each message is consumed by exactly one consumer among those sharing the queue — used to distribute work. In publish-subscribe each message published to a topic is delivered to every subscriber — used to broadcast events to multiple independent services.

</details>

## Intermediate

### Q2. What is the fan-out pattern?

**Style:** How

<details>
<summary>Answer</summary>

Publishing an event to a topic that delivers a copy into one queue per subscribing service; each service's instances consume from their own queue as competing consumers. Every service receives every event, and within each service the event is processed once. Examples: SNS to multiple SQS queues, a RabbitMQ fanout exchange, or one Kafka consumer group per service.

</details>

### Q3. Why does pub/sub reduce coupling?

**Style:** Why

<details>
<summary>Answer</summary>

The producer only publishes "what happened" to a topic and does not know or call its consumers. New consumers subscribe without any change to the producer, and a slow or failed consumer does not affect the producer or other consumers.

</details>

## Advanced

### Q4. A notification is sent multiple times to each user after scaling the notification service to 4 instances. What went wrong?

**Style:** Debugging

<details>
<summary>Answer</summary>

Each instance created its own subscription to the topic, so every instance received every event — pub/sub semantics across instances instead of competing consumers. The instances should share one subscription (one queue, or one Kafka consumer group ID) so each event goes to one instance; consumers should also deduplicate because delivery is at least once.

</details>

### Q5. How does message retention differ between traditional queues and log-based systems, and why does it matter?

**Style:** Comparison

<details>
<summary>Answer</summary>

Traditional queues delete messages once acknowledged, so a message is gone after processing and new consumers only see future messages. Log-based systems (Kafka) retain messages for a configured period regardless of consumption, and each consumer group tracks its own position — enabling replay for new subscribers, recovery after consumer bugs, and multiple independent readers of the same history.

</details>
