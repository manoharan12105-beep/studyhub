# Dead-Letter and Retry Queues — Interview Questions

## Beginner

### Q1. What is a dead-letter queue?

**Style:** Direct

<details>
<summary>Answer</summary>

A separate queue where messages are moved after they fail processing a maximum number of times (or are invalid or expired), so they stop being retried, do not block other messages and are not lost; engineers can inspect them, fix the cause and reprocess them.

</details>

## Intermediate

### Q2. Why use delayed retry queues instead of immediate redelivery?

**Style:** Why

<details>
<summary>Answer</summary>

Most transient failures (a dependency restart, throttling, lock contention) need time to clear. Immediate redelivery fails again and adds load to a struggling dependency, possibly causing a retry storm. Delays with exponential backoff give the dependency room to recover and keep the main queue flowing.

</details>

### Q3. How do you distinguish errors that should be retried from those that should go straight to the DLQ?

**Style:** How

<details>
<summary>Answer</summary>

Classify exceptions in the consumer: transient errors (timeouts, connection errors, 503, throttling, deadlocks) go to retry with backoff; permanent errors (schema or validation failures, unknown message types, references that will never exist, business-rule violations) go directly to the DLQ with context, because retrying cannot succeed.

</details>

### Q4. What information should accompany a message in the DLQ?

**Style:** Direct

<details>
<summary>Answer</summary>

The original payload and headers unchanged, plus the error type and message (or a trace ID linking to logs), the number of attempts, first and last failure timestamps, the source queue or topic and partition/offset, and the consumer version — enough to diagnose and redrive safely.

</details>

## Advanced

### Q5. How would you implement delayed retries with Kafka, which has no per-message delay?

**Style:** Design

<details>
<summary>Answer</summary>

Use tiered retry topics (for example retry-10s, retry-1m, retry-10m) each consumed by a consumer that waits until the message's due time before processing; on failure the message moves to the next tier, and after the last tier to a DLQ topic. Track attempts in headers. Be aware this sacrifices per-key ordering unless later messages for the same key are also held.

</details>

### Q6. After a bug fix you redrive 50,000 DLQ messages. What could go wrong?

**Style:** What happens if

<details>
<summary>Answer</summary>

A sudden burst could overload consumers and downstream services (redrive at a controlled rate); messages may be stale or superseded by newer events (check versions before applying); some may have been partially processed before failing (consumers must be idempotent); and messages failing for a different reason will land back in the DLQ (monitor during redrive).

</details>
