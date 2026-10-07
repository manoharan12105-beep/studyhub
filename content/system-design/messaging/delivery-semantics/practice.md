# Delivery Semantics — Practice

### P1. Name the semantics

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** ack ordering

A consumer acknowledges each message as soon as it receives it, then processes it. Which semantics does it provide?

- A) At-least-once
- B) At-most-once
- C) Exactly-once
- D) None

<details>
<summary>Answer</summary>

**Answer:** B) At-most-once

A crash after the ack loses the message.

</details>

### P2. Choose the guarantee

**Difficulty:** Medium · **Type:** Design · **Concepts:** choosing semantics

Choose a delivery approach: (a) GPS pings from delivery drivers every 2 s, (b) order-placed events for invoicing, (c) a wallet top-up event.

<details>
<summary>Answer</summary>

(a) At-most-once (a lost ping is replaced 2 s later). (b) At-least-once with an idempotent consumer keyed by order ID. (c) At-least-once with transactional deduplication — an exactly-once effect.

</details>

### P3. Duplicate effect

**Difficulty:** Medium · **Type:** Failure · **Concepts:** at-least-once duplicates

A consumer runs `UPDATE stats SET views = views + 1` per message and acknowledges afterwards. Sometimes view counts are slightly too high. Explain and fix.

<details>
<summary>Answer</summary>

At-least-once redelivery after crashes or timeouts processes some messages twice, and the increment is not idempotent. Fix: deduplicate by message ID in the same transaction as the update, or accept approximate counts if business allows (and reconcile from raw events).

</details>
