# Isolation Levels in PostgreSQL — Interview Questions

## Beginner

### Q1. What are the four SQL isolation levels?

<details>
<summary>Answer</summary>

`READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ` and `SERIALIZABLE`, in increasing strength. The standard defines them by which anomalies they must prevent: dirty reads (prevented from READ COMMITTED up), non-repeatable reads (from REPEATABLE READ up), phantoms and all serialization anomalies (SERIALIZABLE). PostgreSQL's default is READ COMMITTED.

</details>

### Q2. What are dirty reads, non-repeatable reads and phantom reads?

<details>
<summary>Answer</summary>

Dirty read: reading another transaction's uncommitted change. Non-repeatable read: reading the same row twice in one transaction and getting different values because another transaction committed an update in between. Phantom read: re-running a query and getting a different set of rows because another transaction inserted or deleted matching rows.

</details>

### Q3. Does PostgreSQL allow dirty reads?

<details>
<summary>Answer</summary>

No, at no level. `READ UNCOMMITTED` is accepted but behaves exactly like `READ COMMITTED`, because MVCC always shows only committed row versions (or the transaction's own changes).

</details>

## Intermediate

### Q4. How does READ COMMITTED differ from REPEATABLE READ in PostgreSQL?

<details>
<summary>Answer</summary>

READ COMMITTED takes a new snapshot for each statement, so later statements see data committed meanwhile; an `UPDATE` that meets a row being changed concurrently waits and then applies itself to the committed new version. REPEATABLE READ takes one snapshot for the whole transaction, so all reads are consistent and phantom-free; if it tries to modify a row that another transaction changed and committed after the snapshot, it fails with "could not serialize access due to concurrent update" and must be retried.

</details>

### Q5. Are phantom reads possible in PostgreSQL's REPEATABLE READ?

<details>
<summary>Answer</summary>

No. The SQL standard allows phantoms at REPEATABLE READ, but PostgreSQL implements it as snapshot isolation: the transaction sees only rows committed before its snapshot, so newly inserted matching rows never appear. Write skew is still possible at this level.

</details>

### Q6. What is a lost update and how do you prevent it?

<details>
<summary>Answer</summary>

Two transactions read the same value, each computes a new value in the application and writes it; the second write overwrites the first, losing it. Prevent it by: computing in SQL (`SET qty = qty - 1`, which re-reads the latest committed row), locking on read (`SELECT … FOR UPDATE`), optimistic concurrency (a `version` column checked in the `WHERE`, e.g. JPA `@Version`), or REPEATABLE READ/SERIALIZABLE, where the second writer gets a serialization error.

</details>

### Q7. What is write skew? Give an example.

<details>
<summary>Answer</summary>

Two transactions read an overlapping set of rows, each makes a decision based on it and updates a **different** row, so no write conflict is detected, yet together they violate a rule. Example: "at least one doctor on duty" — both on-duty doctors check that two are on duty and each takes themselves off; result: none on duty. Snapshot isolation (PostgreSQL REPEATABLE READ) allows it; SERIALIZABLE detects it and aborts one transaction; in READ COMMITTED it can be prevented by locking the checked rows with `SELECT … FOR UPDATE`.

</details>

## Advanced

### Q8. How does PostgreSQL implement SERIALIZABLE?

<details>
<summary>Answer</summary>

With Serializable Snapshot Isolation (SSI): each transaction runs on a snapshot (like REPEATABLE READ), and PostgreSQL additionally records what it read using non-blocking predicate locks (`SIReadLock`). It tracks read/write dependencies between concurrent transactions and, when it finds a pattern ("dangerous structure", a pivot with incoming and outgoing rw-conflicts) that could produce a non-serializable result, aborts one transaction with SQLSTATE 40001. It adds no blocking; it can produce false positives, so clients must retry.

</details>

### Q9. What must application code do when using REPEATABLE READ or SERIALIZABLE?

<details>
<summary>Answer</summary>

Catch serialization failures (SQLSTATE `40001`) and deadlocks (`40P01`), roll back, and re-run the entire transaction — including its reads, because decisions were based on an outdated snapshot — with a bounded number of attempts and backoff. Keep these transactions short to reduce conflicts, and declare read-only transactions `READ ONLY` (a serializable read-only transaction can use `DEFERRABLE` to avoid aborts).

</details>

### Q10. Which isolation level would you choose for a banking transfer service on PostgreSQL?

<details>
<summary>Answer</summary>

READ COMMITTED is sufficient if each transfer uses atomic updates with constraints (`UPDATE accounts SET balance = balance - :amt WHERE id = :from AND balance >= :amt`, checking the row count, plus `CHECK (balance >= 0)`) and locks accounts in a consistent order (e.g. lower id first) to avoid deadlocks. If rules span several rows and are decided by reading (daily limits across accounts), use SERIALIZABLE with a retry loop, or explicit `FOR UPDATE` locks on the rows the rule depends on.

</details>
