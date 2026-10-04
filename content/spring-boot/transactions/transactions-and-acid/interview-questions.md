# Transactions and ACID — Interview Questions

## Beginner

### Q1. What is a transaction?

<details>
<summary>Answer</summary>

A sequence of database operations executed as a single unit of work: either all of them take effect (commit) or none of them do (rollback). It keeps data valid when a multi-step operation fails halfway.

</details>

### Q2. Explain ACID.

<details>
<summary>Answer</summary>

Atomicity — all or nothing. Consistency — a transaction takes the database from one valid state to another, respecting constraints and business rules. Isolation — concurrent transactions do not interfere beyond what the isolation level allows. Durability — committed changes survive crashes (write-ahead logging).

</details>

### Q3. What does `@Transactional` do?

<details>
<summary>Answer</summary>

It makes Spring run the method inside a transaction: a proxy begins (or joins) a transaction before the method, commits when it returns normally, and rolls back when it throws a `RuntimeException` or `Error`. Propagation, isolation, timeout, read-only and rollback rules are configurable through its attributes.

</details>

## Intermediate

### Q4. Where should transaction boundaries be placed and why?

<details>
<summary>Answer</summary>

On service-layer methods that represent one business use case, so all repository calls of the use case commit or roll back together. Not on controllers (they would hold connections during web work) and not only on repositories (several repository calls would commit separately). Keep them short and free of remote calls.

</details>

### Q5. What happens with multiple repository calls in a method without `@Transactional`?

<details>
<summary>Answer</summary>

Each Spring Data repository call runs in its own transaction (repository methods are transactional by default) and commits immediately. If the third call fails, the first two stay committed — the operation is not atomic. Also, entities become detached between calls.

</details>

### Q6. Does a rollback undo an email that was sent inside the transaction?

<details>
<summary>Answer</summary>

No. Rollback affects only transactional resources such as the database connection. Emails, HTTP calls, files and in-memory changes are not undone. Trigger such side effects after commit — `@TransactionalEventListener(phase = AFTER_COMMIT)` or a `TransactionSynchronization` — or use an outbox table written in the same transaction.

</details>

## Advanced

### Q7. Why should you avoid calling a payment gateway inside a database transaction?

<details>
<summary>Answer</summary>

The transaction holds a database connection (and possibly row locks) for the whole network call, risking pool exhaustion and lock contention when the gateway is slow. And if the transaction later rolls back, the charge is not reversed, leaving inconsistent state. Prefer a state machine: reserve/record "payment pending" in one transaction, call the gateway outside it with an idempotency key, then record the result in a second transaction (with compensation such as releasing stock on failure).

</details>

### Q8. What is the transactional outbox pattern?

<details>
<summary>Answer</summary>

To publish an event reliably together with a database change, the service writes the business data and an "outbox" row describing the event in the same transaction. A separate process (poller or change-data-capture) reads committed outbox rows and publishes them to the message broker, retrying until acknowledged. It avoids the dual-write problem where the database commits but the message send fails (or vice versa).

</details>
