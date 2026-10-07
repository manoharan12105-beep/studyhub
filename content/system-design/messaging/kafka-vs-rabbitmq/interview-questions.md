# Kafka vs RabbitMQ — Interview Questions

## Beginner

### Q1. What is the fundamental difference between Kafka and RabbitMQ?

**Style:** Comparison

<details>
<summary>Answer</summary>

Kafka is a distributed, partitioned, append-only log that retains records for a configured period; consumers track offsets and can re-read. RabbitMQ is a message broker that routes messages through exchanges into queues and deletes them once consumers acknowledge them. Kafka suits event streams and replay; RabbitMQ suits task distribution and flexible routing.

</details>

## Intermediate

### Q2. When would you choose Kafka?

**Style:** Scenario

<details>
<summary>Answer</summary>

When many independent consumers need the same high-volume event stream, when events must be retained and replayable (rebuilding a search index, onboarding a new service, recovering from a consumer bug), for change data capture, log and metrics pipelines, event sourcing and stream processing, and when per-key ordering at high throughput matters.

</details>

### Q3. When would you choose RabbitMQ?

**Style:** Scenario

<details>
<summary>Answer</summary>

For background job and task queues, complex routing (topic patterns, fanout, headers), per-message features like priorities, TTLs, dead-letter exchanges and delayed retries, request/reply messaging, and moderate throughput where operational simplicity and low per-message latency matter more than replay.

</details>

### Q4. How does Kafka achieve high throughput?

**Style:** How

<details>
<summary>Answer</summary>

Sequential appends to partition logs on disk (and reliance on the OS page cache), batching and compression of records, zero-copy transfer to consumers, and horizontal scaling by spreading partitions across brokers with consumers in groups reading partitions in parallel.

</details>

## Advanced

### Q5. Can Kafka be used as a job queue? What are the drawbacks?

**Style:** Trade-off

<details>
<summary>Answer</summary>

It can, but awkwardly: parallelism is capped by partitions; a slow or failing message blocks its partition (head-of-line blocking) because offsets advance sequentially; there are no per-message priorities, TTLs or delays, so retries need extra retry topics; and acknowledging individual messages out of order is not native. Dedicated queues (RabbitMQ, SQS) handle these job-queue needs more simply.

</details>

### Q6. A new analytics team needs all order events from the past 14 days. Which system makes this easy and why?

**Style:** Design

<details>
<summary>Answer</summary>

Kafka, if the topic's retention covers 14 days: the team creates a new consumer group and starts from the earliest offset (or a timestamp), replaying history without affecting existing consumers. With classic RabbitMQ queues, acknowledged messages are already deleted, so history would have to come from a database or archive.

</details>
