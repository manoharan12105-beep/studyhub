# Transactions and ACID — Interview Questions

## Beginner

### Q1. What is a transaction?

<details>
<summary>Answer</summary>

A unit of work made of one or more operations that the database executes all-or-nothing: either every change is committed or none is. Example: a transfer debits one account and credits another; if the credit fails, the debit must not persist. In SQL: `BEGIN; … COMMIT;` or `ROLLBACK;`.

</details>

### Q2. Explain the ACID properties.

<details>
<summary>Answer</summary>

**Atomicity** — all or nothing. **Consistency** — a transaction moves the database from one valid state to another, respecting all constraints. **Isolation** — concurrent transactions do not see each other's intermediate states (to a degree set by the isolation level). **Durability** — committed changes survive crashes. In PostgreSQL: atomicity via MVCC (aborted transactions' row versions are never visible), consistency via constraints, isolation via snapshots and locks, durability via the write-ahead log flushed at commit.

</details>

### Q3. What is the difference between COMMIT and ROLLBACK?

<details>
<summary>Answer</summary>

`COMMIT` ends the transaction and makes its changes permanent and visible to other sessions. `ROLLBACK` ends it and discards all its changes. In PostgreSQL, issuing `COMMIT` on a transaction that has already failed performs a rollback.

</details>

### Q4. What is a savepoint?

<details>
<summary>Answer</summary>

A named marker inside a transaction (`SAVEPOINT sp`). `ROLLBACK TO SAVEPOINT sp` undoes only the changes made after it and leaves the transaction active, so the work before it can still be committed. Useful for optional steps and for recovering from an error inside a long transaction; ORMs use savepoints for nested transactions.

</details>

## Intermediate

### Q5. What happens in PostgreSQL when a statement fails inside a transaction?

<details>
<summary>Answer</summary>

The whole transaction enters the failed state: every following command returns "current transaction is aborted, commands ignored until end of transaction block" until the client issues `ROLLBACK` (or `ROLLBACK TO SAVEPOINT` for a savepoint taken before the error). This differs from some databases that roll back only the failed statement. Clients that want to continue after an expected error must use savepoints.

</details>

### Q6. What is autocommit?

<details>
<summary>Answer</summary>

A mode in which every statement is its own transaction, committed automatically when it succeeds. PostgreSQL behaves this way outside `BEGIN … COMMIT`, and JDBC connections start with `autoCommit = true`. Multi-statement operations need autocommit off (`conn.setAutoCommit(false)`) or an explicit `BEGIN`, otherwise a failure halfway leaves earlier statements committed.

</details>

### Q7. How does PostgreSQL guarantee durability?

<details>
<summary>Answer</summary>

Changes are first written to the write-ahead log (WAL); at commit, the WAL records up to the commit record are flushed to durable storage (`fsync`) before success is reported. Data files can be written later; after a crash, PostgreSQL replays the WAL from the last checkpoint to restore committed changes. `synchronous_commit = off` trades a small window of possible loss of recent commits (not corruption) for speed; replicas with synchronous replication extend durability to another server.

</details>

### Q8. Can DDL be rolled back in PostgreSQL?

<details>
<summary>Answer</summary>

Yes, most DDL is transactional: `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`, index creation and more can be rolled back, which makes migrations safe to run in one transaction. Exceptions refuse to run inside a transaction block: `CREATE INDEX CONCURRENTLY`, `VACUUM`, `CREATE DATABASE`, `ALTER SYSTEM` and a few others. (MySQL and Oracle implicitly commit around most DDL.)

</details>

## Advanced

### Q9. Why are long-running transactions harmful in PostgreSQL?

<details>
<summary>Answer</summary>

They hold row and table locks, blocking other writers and DDL; their snapshot prevents `VACUUM` from removing dead row versions created after it started, causing table and index bloat across the whole database; they increase conflict and deadlock chances; and an idle-in-transaction connection wastes a pool slot. Keep transactions short, never wait for user input inside one, and set `idle_in_transaction_session_timeout`.

</details>

### Q10. What is a deferred constraint and when is it needed?

<details>
<summary>Answer</summary>

A constraint declared `DEFERRABLE` can be checked at commit instead of after each statement (`SET CONSTRAINTS … DEFERRED`, or `INITIALLY DEFERRED`). It is needed when intermediate states are temporarily invalid: inserting two rows that reference each other, swapping unique values between rows, or reordering positions. Only `UNIQUE`, `PRIMARY KEY`, `REFERENCES` and `EXCLUDE` constraints can be deferrable; `NOT NULL` and `CHECK` are always immediate.

</details>

### Q11. How do you handle transactions in JDBC?

<details>
<summary>Answer</summary>

`conn.setAutoCommit(false)`, execute the statements, then `conn.commit()`; on `SQLException`, `conn.rollback()`; finally restore `setAutoCommit(true)` before returning the connection to a pool. Savepoints: `conn.setSavepoint()` and `conn.rollback(savepoint)`. Isolation: `conn.setTransactionIsolation(Connection.TRANSACTION_REPEATABLE_READ)`. Spring's `@Transactional` automates this around a method call.

</details>
