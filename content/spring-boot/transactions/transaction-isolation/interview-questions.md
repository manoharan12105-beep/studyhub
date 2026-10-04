# Isolation Levels and Read Anomalies — Interview Questions

## Beginner

### Q1. What are the transaction isolation levels?

<details>
<summary>Answer</summary>

READ UNCOMMITTED (allows dirty reads), READ COMMITTED (prevents dirty reads), REPEATABLE READ (also prevents non-repeatable reads) and SERIALIZABLE (prevents all read anomalies, including phantoms). Spring exposes them through `@Transactional(isolation = …)`, plus `DEFAULT` for the database default.

</details>

### Q2. Explain dirty read, non-repeatable read and phantom read.

<details>
<summary>Answer</summary>

A dirty read sees another transaction's uncommitted changes. A non-repeatable read gets different values when reading the same row twice because another transaction committed an update in between. A phantom read gets a different set of rows when re-running the same query because another transaction committed matching inserts or deletes.

</details>

### Q3. What isolation level does Spring use by default?

<details>
<summary>Answer</summary>

`Isolation.DEFAULT`, meaning the database's default: READ COMMITTED for PostgreSQL, Oracle and SQL Server, REPEATABLE READ for MySQL InnoDB.

</details>

## Intermediate

### Q4. Why not always use SERIALIZABLE?

<details>
<summary>Answer</summary>

It reduces concurrency: conflicting transactions block or are aborted with serialization failures that the application must retry, and throughput drops under contention. Most operations are correct at READ COMMITTED with targeted protection (optimistic locking, atomic updates, constraints) for the few invariants that need it.

</details>

### Q5. Does REPEATABLE READ prevent lost updates?

<details>
<summary>Answer</summary>

It depends on the database. PostgreSQL's REPEATABLE READ aborts the second of two concurrent updates of the same row (serialization error), effectively preventing the lost update but requiring a retry. MySQL InnoDB's REPEATABLE READ does not prevent a lost update in a plain read-modify-write without locking reads. Portable protection is `@Version`, `SELECT … FOR UPDATE` or atomic updates.

</details>

### Q6. Can an inner `@Transactional(isolation = SERIALIZABLE)` method change the isolation of the caller's transaction?

<details>
<summary>Answer</summary>

No. Isolation is applied when a physical transaction starts. An inner method with REQUIRED joins the existing transaction at its existing level (Spring can be configured to validate and reject incompatible definitions with `validateExistingTransaction`). Put the isolation on the method that starts the transaction or use REQUIRES_NEW.

</details>

## Advanced

### Q7. What is write skew and which isolation level prevents it?

<details>
<summary>Answer</summary>

Two transactions read an overlapping set of rows, each checks a rule ("at least one doctor on call") and then updates a different row, so neither conflicts directly but together they break the rule. Snapshot-based REPEATABLE READ does not prevent it; SERIALIZABLE (or explicit locking of the rows the rule depends on, or a constraint) does.

</details>

### Q8. How should an application handle serialization failures?

<details>
<summary>Answer</summary>

Treat them as transient: roll back and retry the whole transaction a limited number of times with a short randomised backoff, from outside the transactional boundary. Spring translates them into exceptions such as `CannotSerializeTransactionException`/`PessimisticLockingFailureException`, which retry logic (e.g. `@Retryable` on the calling method) can target.

</details>
