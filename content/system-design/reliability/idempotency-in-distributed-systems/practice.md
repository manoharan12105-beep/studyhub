# Idempotency — Practice

### P1. Idempotent or not

**Difficulty:** Easy · **Type:** Comparison · **Concepts:** idempotent operations

Idempotent (I) or not (N)? (a) `UPDATE users SET plan = 'pro' WHERE id = 5`, (b) `UPDATE accounts SET balance = balance + 100 WHERE id = 5`, (c) `DELETE FROM carts WHERE user_id = 5`, (d) `INSERT INTO orders (...)` with an auto-generated ID.

<details>
<summary>Answer</summary>

(a) I, (b) N, (c) I, (d) N (each run creates a new order).

</details>

### P2. Who makes the key?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** idempotency keys

Who should generate the idempotency key for a payment request, and when?

- A) The server, when it receives the request
- B) The client, once per logical payment, before the first attempt, reused on retries
- C) The client, a new key on every retry
- D) The database, as an auto-increment

<details>
<summary>Answer</summary>

**Answer:** B) The client, once per logical payment, before the first attempt, reused on retries

</details>

### P3. Make it idempotent

**Difficulty:** Medium · **Type:** Design · **Concepts:** idempotent design

A consumer handles `PointsEarned{orderId: 91, points: 50}` by running `points = points + 50`. Duplicates cause extra points. Redesign.

<details>
<summary>Answer</summary>

Store a ledger row per earning event: `points_ledger(order_id UNIQUE, user_id, points)`. Insert the row and update the user's total in one transaction; a duplicate message fails the unique constraint and is skipped. The total can also be recomputed from the ledger.

</details>

### P4. Ambiguous timeout

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** retries

An order service calls a payment provider; the call times out after 10 s. List the possible states of the payment and a safe next step.

<details>
<summary>Answer</summary>

The request may not have reached the provider, may still be processing, or may have completed with the response lost. Safe next step: retry with the same idempotency key (the provider returns the original result if it completed), or query the payment status by that key before deciding; mark the order `PAYMENT_PENDING` meanwhile, never "failed".

</details>
