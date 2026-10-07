# Delivery Semantics — Interview Questions

## Beginner

### Q1. Explain at-most-once, at-least-once and exactly-once delivery.

**Style:** Comparison

<details>
<summary>Answer</summary>

At-most-once: a message is processed zero or one times — it can be lost but never duplicated (acknowledge before processing). At-least-once: processed one or more times — never lost but possibly duplicated (acknowledge after processing). Exactly-once: the effect happens once — in practice achieved as at-least-once delivery plus deduplication or transactions within a defined boundary.

</details>

### Q2. Which delivery guarantee do most message queues provide by default?

**Style:** Direct

<details>
<summary>Answer</summary>

At-least-once: messages are removed only after acknowledgement and redelivered if a consumer fails or a visibility timeout expires, so consumers must be prepared for duplicates.

</details>

## Intermediate

### Q3. How does the order of acknowledging and processing determine the guarantee?

**Style:** How

<details>
<summary>Answer</summary>

Acknowledge first, then process: a crash after the ack loses the message (at-most-once). Process first, then acknowledge: a crash after processing but before the ack causes redelivery and a second processing (at-least-once). Making the processing result and the acknowledgement/offset commit atomic (one transaction) yields exactly-once effect.

</details>

### Q4. When is at-most-once acceptable?

**Style:** Scenario

<details>
<summary>Answer</summary>

When individual messages are cheap to lose and duplicates or extra latency are worse: high-volume metrics or telemetry samples, debug logs, live location or sensor updates that are superseded seconds later, and some real-time game state.

</details>

## Advanced

### Q5. Why is true exactly-once delivery impossible in general, and what do systems offer instead?

**Style:** Why

<details>
<summary>Answer</summary>

Because a sender cannot distinguish a lost message from a lost acknowledgement over an unreliable network, it must either resend (risking duplicates) or not (risking loss). Systems offer exactly-once processing within a boundary: idempotent producers and transactions inside a broker (Kafka), consumers that commit results and offsets atomically, and idempotent handlers that deduplicate by message ID. Effects outside that boundary (emails, external APIs) need their own idempotency.

</details>

### Q6. Design a consumer that credits wallets exactly once even though messages may be redelivered.

**Style:** Design

<details>
<summary>Answer</summary>

In one database transaction, insert the message (or transaction) ID into a processed-messages table with a unique constraint and apply the wallet credit; commit, then acknowledge. A redelivered message violates the unique constraint, so the transaction is skipped and the message is simply acknowledged. Alternatively, model credits as ledger rows keyed by transaction ID and derive the balance from them.

</details>
