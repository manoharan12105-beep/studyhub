# Idempotency — Interview Questions

## Beginner

### Q1. What does idempotent mean?

**Style:** Direct

<details>
<summary>Answer</summary>

An operation is idempotent if applying it multiple times has the same effect as applying it once. Setting a value, replacing a resource with PUT, or deleting an item are idempotent; incrementing a counter or creating a new order with POST are not.

</details>

### Q2. Why is idempotency essential in distributed systems?

**Style:** Why

<details>
<summary>Answer</summary>

Because failures are ambiguous and retries are unavoidable: a timed-out request may have succeeded with only the response lost, and message queues usually deliver at least once. Retrying or redelivering a non-idempotent operation duplicates its effect — double charges, duplicate orders. Idempotency makes retries and duplicates harmless.

</details>

## Intermediate

### Q3. How do idempotency keys work?

**Style:** How

<details>
<summary>Answer</summary>

The client generates a unique key per logical operation and sends it (for example in an `Idempotency-Key` header) with the request and every retry. The server atomically records the key with the operation's result; when the same key arrives again, it returns the stored result instead of executing again. Keys expire after a retention period.

</details>

### Q4. How do you make a message consumer idempotent?

**Style:** How

<details>
<summary>Answer</summary>

Record each processed message ID (or a natural business key) with a unique constraint in the same transaction as the consumer's state changes, and skip messages already recorded; or design the processing as set-style, conditional updates (`WHERE status = 'PENDING'`) that do nothing the second time.

</details>

### Q5. Is DELETE idempotent if the second call returns 404?

**Style:** Trap

<details>
<summary>Answer</summary>

Yes. Idempotency concerns the effect on server state, not the response: after one or many DELETEs the resource is gone. The response can differ (204 then 404) without breaking idempotency.

</details>

## Advanced

### Q6. Two retries with the same idempotency key arrive at two servers at the same moment. How do you prevent a double charge?

**Style:** Design

<details>
<summary>Answer</summary>

Make claiming the key atomic: insert the key into a shared table with a unique constraint (or use a conditional put) before or within the transaction that performs the charge. Only one insert succeeds; the other sees the conflict and either waits for and returns the stored result or responds that the request is in progress (409). Never use a non-atomic "check, then insert".

</details>

### Q7. What should happen if a client reuses an idempotency key with a different request body?

**Style:** Trap

<details>
<summary>Answer</summary>

Reject it (for example 422 or 409): a key identifies one logical operation, so a different payload means a client bug. Servers store a hash of the original request alongside the key and compare it on reuse, rather than silently returning the old result for a different request.

</details>
