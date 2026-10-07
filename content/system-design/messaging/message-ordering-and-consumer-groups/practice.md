# Message Ordering, Partitions and Consumer Groups — Practice

### P1. Idle consumers

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** partitions and parallelism

A topic has 5 partitions. A consumer group has 8 consumers. How many consumers actively process messages?

- A) 8
- B) 5
- C) 1
- D) 40

<details>
<summary>Answer</summary>

**Answer:** B) 5

Each partition is assigned to one consumer in the group; 3 are idle.

</details>

### P2. Pick the key

**Difficulty:** Medium · **Type:** Design · **Concepts:** message keys

Choose a key: (a) shipment status updates that must be applied in order per shipment, (b) page-view events for aggregate analytics, (c) edits to collaborative documents.

<details>
<summary>Answer</summary>

(a) `shipment_id`, (b) no key or a random key (spread load; order doesn't matter), (c) `document_id`.

</details>

### P3. Ordering bug

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** retries and ordering

Order events are keyed by `order_id`. A consumer sends failed messages to a retry topic and continues. Sometimes "shipped" is applied before "paid". Explain and fix.

<details>
<summary>Answer</summary>

When "paid" failed and went to the retry topic, the consumer continued and processed "shipped" for the same order first — the retry reordered events. Fixes: retry in place for that key (block that order's later events until "paid" succeeds), park subsequent events for keys that have a pending retry, or make handlers tolerant of out-of-order events using state checks or version numbers.

</details>
