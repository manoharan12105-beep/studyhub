# Delivery Semantics: At-Most-Once, At-Least-Once, Exactly-Once

**Module:** Messaging and Event-Driven Systems · **Interview priority:** Core

## What Is It?

**Delivery semantics** describe how many times a message may be processed when things fail:

- **At-most-once:** each message is processed **zero or one** times. Nothing is duplicated; messages can be **lost**.
- **At-least-once:** each message is processed **one or more** times. Nothing is lost; messages can be **duplicated**.
- **Exactly-once:** each message's effect happens **once**. Achievable only within limits, and in practice means **effectively once**: at-least-once delivery plus deduplication or transactions.

## Why It Exists

A consumer does two things — **process** the message and **acknowledge** it — and it can crash between them. Whichever it does first decides what a crash costs.

## How It Works

### The acknowledgement order decides

```text
At-most-once:   receive → ACK → process        crash after ACK, before processing → message LOST
At-least-once:  receive → process → ACK        crash after processing, before ACK → message REDELIVERED → processed twice
```

Producers face the same choice: a producer that does not retry a failed send may lose messages; a producer that retries after a lost acknowledgement may publish duplicates.

| Semantics | Lost? | Duplicated? | Use when |
|-----------|-------|-------------|----------|
| At-most-once | Possible | Never | Losing some data is acceptable: metrics samples, logs at very high volume, live location pings superseded seconds later |
| At-least-once | Never (with durable storage) | Possible | The default for business events — combined with idempotent consumers |
| Exactly-once (effective) | Never | Effect applied once | Payments, counters, financial ledgers, stream aggregations |

### Why "exactly-once delivery" is not what it sounds like

Over an unreliable network, a sender cannot know whether a lost acknowledgement means the message was not received or the reply was lost — so it must either risk loss (not resend) or risk duplication (resend). No protocol avoids both for arbitrary side effects such as sending an email or charging a card. What systems actually provide is **exactly-once processing (effect)** within a boundary:

1. **Idempotent consumers:** deduplicate by message ID, or design the effect to be idempotent ([Idempotency](../../reliability/idempotency-in-distributed-systems/content.md)).
2. **Transactional processing:** store the consumer's result **and** its position (offset) or a processed-message record in the **same transaction**, so either both happen or neither.
3. **Broker transactions:** Kafka's idempotent producers and transactions make "read from topic A, write to topic B, commit offsets" atomic — exactly-once **within Kafka**. Side effects outside Kafka (an email, an external API) still need idempotency.

```text
Idempotent consumer (at-least-once delivery → exactly-once effect)
BEGIN;
  INSERT INTO processed(message_id) VALUES ('m-9183');      -- duplicate? unique violation → skip
  UPDATE wallets SET balance = balance + 500 WHERE user_id = 7;
COMMIT;
ACK the message
```

**Think about it:** a consumer sends a confirmation email and then acknowledges. It crashes after sending but before the ACK. With at-least-once delivery, what does the user experience, and how could you prevent it?

<details>
<summary>Answer</summary>

The message is redelivered and the user gets **two emails**. Prevent it by recording "email sent for order 77" (keyed by the message or order ID) before or atomically with sending, and checking it first — or by using an email provider that accepts an idempotency key. Some duplicates in non-critical notifications may simply be accepted.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** "Our broker guarantees exactly-once, so consumers don't need to handle duplicates." Broker guarantees cover the broker's own boundary; any external side effect still needs idempotency.

## Interview Follow-up

- *"Which delivery guarantee would you choose for payment events?"* At-least-once with idempotent consumers (and transactional offset/result storage), giving an exactly-once effect; never at-most-once.

## Key Takeaways

- At-most-once: ack before processing — may lose, never duplicates.
- At-least-once: ack after processing — never loses, may duplicate. The usual default.
- Exactly-once is really exactly-once **effect**: at-least-once plus idempotency or transactions.
- External side effects always need idempotency, whatever the broker promises.
