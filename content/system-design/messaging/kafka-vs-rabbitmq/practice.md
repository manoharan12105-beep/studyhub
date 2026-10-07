# Kafka vs RabbitMQ — Practice

### P1. Replay

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** retention

Which system lets a new consumer re-read last week's events by default?

- A) Classic RabbitMQ queues
- B) Kafka (within the topic's retention period)
- C) Both, always
- D) Neither

<details>
<summary>Answer</summary>

**Answer:** B) Kafka (within the topic's retention period)

</details>

### P2. Pick one

**Difficulty:** Medium · **Type:** Comparison · **Concepts:** choosing a broker

Kafka (K) or RabbitMQ (R)? (a) clickstream of 500k events/s feeding analytics and ML, (b) sending password-reset emails with priority for VIP users, (c) streaming database changes to a search index, (d) routing messages to services by patterns like `invoice.*.eu`.

<details>
<summary>Answer</summary>

(a) K, (b) R, (c) K, (d) R.

</details>

### P3. Explain the choice

**Difficulty:** Medium · **Type:** Trade-off · **Concepts:** interview reasoning

Write a two-sentence justification for using Kafka in a ride-hailing app's trip-event pipeline.

<details>
<summary>Answer</summary>

"Trip events are a high-volume stream that several independent services — billing, analytics, fraud detection and driver payouts — must each consume, and we want to replay history when we add or fix a consumer. Partitioning by trip ID keeps each trip's events in order while spreading load across partitions."

</details>
