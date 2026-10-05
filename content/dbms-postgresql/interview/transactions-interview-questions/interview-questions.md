# Transactions Interview Questions — Interview Questions

## Beginner

### Q1. Explain ACID with a bank-transfer example.

<details>
<summary>Answer</summary>

Transfer 1000 from account 1 to account 2:

- **Atomicity** — the debit and the credit both happen or neither does; a crash between them leaves no half-transfer.
- **Consistency** — constraints such as `balance >= 0` hold before and after; a transfer that would overdraw is rejected.
- **Isolation** — a concurrent report never sees the money missing from both accounts or present in both.
- **Durability** — once `COMMIT` returns, the transfer survives a crash (its WAL is on disk).

</details>

### Q2. What happens to a transaction in PostgreSQL after an error?

<details>
<summary>Answer</summary>

The transaction enters an **aborted** state: every further command fails with `current transaction is aborted, commands ignored until end of transaction block` until you `ROLLBACK` (a `COMMIT` also just rolls back). To recover from an expected error inside a transaction, use a `SAVEPOINT` and `ROLLBACK TO SAVEPOINT`.

```sql
BEGIN;
INSERT INTO accounts VALUES (4, 'Karan', 100);
SAVEPOINT before_risky;
INSERT INTO accounts VALUES (5, 'Divya', -50);
ROLLBACK TO SAVEPOINT before_risky;
INSERT INTO accounts VALUES (5, 'Divya', 50);
COMMIT;
SELECT account_id, holder, balance FROM accounts WHERE account_id >= 4 ORDER BY account_id;
```

**Output:**

```text
ERROR:  new row for relation "accounts" violates check constraint "accounts_balance_check"
DETAIL:  Failing row contains (5, Divya, -50.00).
 account_id | holder | balance
------------+--------+---------
          4 | Karan  |  100.00
          5 | Divya  |   50.00
(2 rows)
```

</details>

### Q3. What does `SET TRANSACTION READ ONLY` do?

<details>
<summary>Answer</summary>

It makes the current transaction reject writes to permanent tables. Combined with `SERIALIZABLE, DEFERRABLE`, it lets a long report run on a safe snapshot without risking serialization failures. Spring's `@Transactional(readOnly = true)` sets it, and some setups use it to route queries to replicas.

</details>

### Q4. What is a dirty read, and can it happen in PostgreSQL?

<details>
<summary>Answer</summary>

Reading another transaction's uncommitted changes. It cannot happen in PostgreSQL at any isolation level: MVCC shows each statement or transaction only committed data (plus its own changes). `READ UNCOMMITTED` is accepted but behaves as `READ COMMITTED`.

</details>

## Intermediate

### Q5. Two users decrement the same stock count at the same time. How do you avoid losing one decrement?

<details>
<summary>Answer</summary>

The bug is read-modify-write: both read 10 and both write 9. Fixes, from simplest:

1. **Atomic update** — `UPDATE products SET stock = stock - 1 WHERE id = $1 AND stock > 0`. The row lock serialises the writers, and the second sees the first's result; 0 rows updated means out of stock.
2. **Pessimistic lock** — `SELECT stock … FOR UPDATE`, then update.
3. **Optimistic lock** — a `version` column: `UPDATE … SET …, version = version + 1 WHERE id = $1 AND version = $2`; 0 rows updated means retry (JPA `@Version`).
4. **Repeatable Read or Serializable** — the second writer gets SQLSTATE `40001` and retries.

</details>

### Q6. What does `SELECT … FOR UPDATE` do, and what are `NOWAIT` and `SKIP LOCKED`?

<details>
<summary>Answer</summary>

It reads rows and locks them against concurrent updates, deletes and other `FOR UPDATE` locks until the transaction ends. Plain readers are not blocked (MVCC).

- `NOWAIT` fails immediately instead of waiting for a locked row.
- `SKIP LOCKED` skips locked rows. It is the basis of database job queues: each worker runs `SELECT … FROM jobs WHERE status = 'NEW' ORDER BY id LIMIT 10 FOR UPDATE SKIP LOCKED` and gets different jobs.
- Weaker modes: `FOR NO KEY UPDATE`, `FOR SHARE` and `FOR KEY SHARE` (used by foreign-key checks).

</details>

### Q7. Describe Read Committed vs Repeatable Read in PostgreSQL.

<details>
<summary>Answer</summary>

- **Read Committed**: each **statement** sees a fresh snapshot of committed data. Two identical `SELECT`s in one transaction can return different results. When an `UPDATE` finds a row changed by a concurrent committed transaction, it re-checks its `WHERE` on the new version and continues.
- **Repeatable Read**: the whole **transaction** sees one snapshot taken at its first query, so no non-repeatable reads or phantoms. If it tries to update a row that a concurrent transaction changed after the snapshot, it fails with `could not serialize access due to concurrent update` (SQLSTATE `40001`) and must be retried.

</details>

### Q8. What is a deadlock, and how does PostgreSQL handle it?

<details>
<summary>Answer</summary>

Two (or more) transactions each hold a lock the other needs: T1 locks account 1 and waits for 2; T2 locks 2 and waits for 1. After `deadlock_timeout` (1 s by default), PostgreSQL checks for a cycle and aborts one transaction with `deadlock detected` (SQLSTATE `40P01`); the other proceeds.

Prevent it by:

- acquiring locks in a consistent order (for example, update accounts in ascending id order);
- keeping transactions short;
- locking everything needed up front.

Applications should retry the aborted transaction.

</details>

### Q9. Optimistic or pessimistic locking — which do you choose?

<details>
<summary>Answer</summary>

- **Optimistic** (version column, retry on conflict): no locks held while the user thinks, and it scales with low contention. Conflicts surface as failed updates. Good for web forms and long "edit" flows.
- **Pessimistic** (`FOR UPDATE`): conflicts wait instead of failing. Good for short, high-contention critical sections (seat booking, counters) where retries would be frequent.

Never hold a pessimistic lock across user think time or remote calls.

</details>

## Advanced

### Q10. What is write skew? Show how Serializable prevents it.

<details>
<summary>Answer</summary>

Two transactions read an overlapping set, make **disjoint** writes based on what they read, and together break an invariant that each one checked. Example: "at least one doctor on call". Alice and Bob both see two doctors on call, and each takes themselves off; both commit, and nobody is on call. No row was written by both, so Repeatable Read does not detect it.

**Serializable** (Serializable Snapshot Isolation) tracks read/write dependencies and aborts one transaction with SQLSTATE `40001` when the outcome could not happen in any serial order. Alternatives: lock the rows read (`FOR UPDATE`), or model the invariant as a constraint.

</details>

### Q11. Why must applications retry transactions, and how should retries be written?

<details>
<summary>Answer</summary>

Under Repeatable Read and Serializable, conflicts surface as serialization failures (`40001`); deadlocks abort a victim (`40P01`) at any level. These errors are expected, not bugs. A retry loop must:

- re-run the **whole** transaction, re-reading data, not just the failed statement;
- limit attempts and add a small randomised backoff;
- never retry non-idempotent external side effects (emails, payments) that ran inside the attempt — keep them outside the transaction or use an outbox table.

</details>

### Q12. How does MVCC let readers and writers avoid blocking each other?

<details>
<summary>Answer</summary>

Each row version carries `xmin` (the creating transaction) and `xmax` (the deleting or locking transaction). An `UPDATE` writes a new version and sets `xmax` on the old one instead of overwriting in place. A reader uses its snapshot (which transactions were committed when it started) to choose the visible version, so it never waits for writers, and writers never wait for readers. Writers still block writers on the same row. The cost: dead versions accumulate and must be vacuumed.

</details>

### Q13. A long-running transaction is open for 3 hours. What problems can it cause?

<details>
<summary>Answer</summary>

- Vacuum cannot remove dead tuples newer than its snapshot, so tables and indexes **bloat** across the whole database.
- Locks it holds block DDL (`ALTER TABLE` waits, and queues every later query behind it) and conflicting writes.
- Freezing is held back (XID wraparound risk on busy systems).
- On a hot standby, conflicts with replication may cancel queries or delay replay.

Find it in `pg_stat_activity` (`xact_start`, `state = 'idle in transaction'`). Prevent it with `idle_in_transaction_session_timeout`, `statement_timeout`, and by keeping transactions short.

</details>
