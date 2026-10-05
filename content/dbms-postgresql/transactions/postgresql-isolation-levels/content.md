# Isolation Levels in PostgreSQL

**Module:** Transactions · **Interview priority:** Core

## What Is It?

The **isolation level** of a transaction decides how much it is affected by other transactions running at the same time. The SQL standard defines four levels by the **anomalies** (read phenomena) each one must prevent; PostgreSQL implements them with MVCC snapshots, and its actual behaviour is **stronger** than the standard's minimum at two levels.

| Level | PostgreSQL behaviour in one line |
|-------|-----------------------------------|
| `READ UNCOMMITTED` | Treated exactly as `READ COMMITTED` |
| `READ COMMITTED` (default) | Each **statement** sees data committed before it started |
| `REPEATABLE READ` | The whole **transaction** sees one snapshot, taken at its first statement |
| `SERIALIZABLE` | Snapshot + detection of dangerous read/write patterns; result equals some serial order, or a transaction is aborted |

## Why It Matters

- Concurrency bugs — lost updates, double bookings, negative balances, invariants broken by two "correct" transactions — appear only under load and are hard to reproduce.
- Interviewers ask for the four levels and their anomalies, and PostgreSQL-specific follow-ups: "does PostgreSQL allow dirty reads?", "are phantoms possible in REPEATABLE READ?", "what is write skew?".
- Choosing a higher level is not free: the application must be ready to **retry** transactions that PostgreSQL aborts.

## Core Concept

### The anomalies

| Anomaly | What happens |
|---------|--------------|
| **Dirty read** | T1 reads a change T2 has not committed (and T2 may roll back) |
| **Non-repeatable read** | T1 reads a row twice and gets different values, because T2 updated and committed in between |
| **Phantom read** | T1 runs the same query twice and gets a different **set** of rows, because T2 inserted/deleted matching rows |
| **Lost update** | T1 and T2 read the same value, both compute a new one and write it; one write silently overwrites the other |
| **Write skew** | T1 and T2 read overlapping data, each updates a **different** row based on what it read; each is valid alone, together they break a rule |
| **Serialization anomaly** | The combined result could not have happened in any one-at-a-time order of the transactions |

### Standard minimum vs PostgreSQL

| Level | Dirty read | Non-repeatable read | Phantom read | Lost update* | Write skew / serialization anomaly |
|-------|-----------|---------------------|--------------|--------------|------------------------------------|
| Read uncommitted (standard) | Allowed | Allowed | Allowed | Possible | Possible |
| Read uncommitted (**PostgreSQL**) | **Not possible** | Possible | Possible | Possible | Possible |
| Read committed | Not possible | Possible | Possible | Possible | Possible |
| Repeatable read (standard) | Not possible | Not possible | Allowed | — | Possible |
| Repeatable read (**PostgreSQL**) | Not possible | Not possible | **Not possible** | **Prevented (error)** | Possible |
| Serializable | Not possible | Not possible | Not possible | Prevented | **Prevented (error)** |

\* Lost update of the read-then-write kind, where the application computes the new value. Single statements like `SET balance = balance - 100` never lose updates at any level (see below).

### How each level works in PostgreSQL

**READ COMMITTED** — a new snapshot for every statement. Two `SELECT`s in one transaction can see different data. When an `UPDATE`/`DELETE` finds a row that a concurrent transaction is changing, it **waits** for that transaction; if it commits, the statement re-checks its `WHERE` condition against the **new** row version and applies its change to it. That is why `UPDATE … SET x = x - 1` is safe in READ COMMITTED.

**REPEATABLE READ** — one snapshot for the whole transaction (taken at its first statement). Reads are stable and phantom-free. If the transaction tries to update or delete a row that a concurrent transaction changed and committed after the snapshot, it fails with *could not serialize access due to concurrent update* — the lost update is turned into an error.

**SERIALIZABLE** — repeatable read plus **Serializable Snapshot Isolation (SSI)**: PostgreSQL tracks which data each transaction read (predicate locks, shown as `SIReadLock`, which never block) and detects read/write dependency cycles that could produce a non-serial result. One transaction is aborted with *could not serialize access due to read/write dependencies among transactions*. No blocking is added; the price is aborts, which the client must retry.

### Retry is part of the contract

At `REPEATABLE READ` and `SERIALIZABLE`, errors with **SQLSTATE `40001`** (serialization_failure) and `40P01` (deadlock_detected) mean "run the whole transaction again". Application code must wrap such transactions in a retry loop (a few attempts with a short backoff). The transaction must be retried from the beginning, including its reads.

```java
// Illustrative fragment: retrying a serializable transaction with JDBC
for (int attempt = 1; ; attempt++) {
    try {
        conn.setAutoCommit(false);
        conn.setTransactionIsolation(Connection.TRANSACTION_SERIALIZABLE);
        doWork(conn);                       // all reads and writes of the transaction
        conn.commit();
        break;
    } catch (SQLException e) {
        conn.rollback();
        boolean retryable = "40001".equals(e.getSQLState()) || "40P01".equals(e.getSQLState());
        if (!retryable || attempt == 5) throw e;
    }
}
```

### Choosing a level

| Situation | Level |
|-----------|-------|
| Typical OLTP: single-statement updates, `SELECT … FOR UPDATE` where needed | `READ COMMITTED` (default) |
| Reports or exports that need a consistent view across several queries | `REPEATABLE READ` (often `READ ONLY`) |
| Business rules that span several rows and are checked by reading (on-call rotas, balances across accounts, uniqueness that no index can express) | `SERIALIZABLE` with retries — or explicit locks/constraints in `READ COMMITTED` |

Setting the level: `BEGIN ISOLATION LEVEL …`, `SET TRANSACTION ISOLATION LEVEL …` (as the first statement of the transaction), the session/database default `default_transaction_isolation`, or JDBC `conn.setTransactionIsolation(…)` / Spring `@Transactional(isolation = …)` ([Spring Boot: Transaction Isolation](../../../spring-boot/transactions/transaction-isolation/content.md)).

## Syntax

```sql
-- Illustrative
BEGIN ISOLATION LEVEL REPEATABLE READ [READ ONLY];
START TRANSACTION ISOLATION LEVEL SERIALIZABLE;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;           -- first statement inside BEGIN
SET default_transaction_isolation = 'repeatable read';  -- session default
SHOW transaction_isolation;
```

## Examples

The concurrent examples below need two sessions, so they are shown as timelines. Each was run on PostgreSQL 18 with two `psql` sessions against the sample database (`accounts.balance` of account 1 starts at 10000).

### Checking and setting the level

```sql
SHOW default_transaction_isolation;
```

**Output:**

```text
 default_transaction_isolation
-------------------------------
 read committed
(1 row)
```

```sql
BEGIN ISOLATION LEVEL REPEATABLE READ;
SHOW transaction_isolation;
COMMIT;
```

**Output:**

```text
 transaction_isolation
-----------------------
 repeatable read
(1 row)
```

```sql
BEGIN;
SELECT 1;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
COMMIT;
```

**Output:**

```text
 ?column?
----------
        1
(1 row)

ERROR:  SET TRANSACTION ISOLATION LEVEL must be called before any query
```

The level is fixed once the transaction has run its first query.

### READ UNCOMMITTED does not read uncommitted data

```text
Session A                                         Session B
BEGIN;
UPDATE accounts SET balance = 0
WHERE account_id = 1;            -- not committed
                                                  BEGIN ISOLATION LEVEL READ UNCOMMITTED;
                                                  SELECT balance FROM accounts WHERE account_id = 1;
                                                   balance
                                                  ----------
                                                   10000.00        ← committed value, no dirty read
ROLLBACK;
```

### READ COMMITTED: non-repeatable read

```text
Session A                                         Session B
BEGIN;
SELECT balance FROM accounts WHERE account_id = 1;
 10000.00
                                                  UPDATE accounts SET balance = balance - 1000
                                                  WHERE account_id = 1;    -- autocommit
SELECT balance FROM accounts WHERE account_id = 1;
 9000.00                     ← same transaction, different value
COMMIT;
```

### REPEATABLE READ: stable reads, no phantoms, conflict error

```text
Session A                                         Session B
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT balance FROM accounts WHERE account_id = 1;
 10000.00
SELECT count(*) FROM employees WHERE dept_id = 30;
 2
                                                  UPDATE accounts SET balance = balance - 1000
                                                  WHERE account_id = 1;
                                                  INSERT INTO employees (emp_id, name, dept_id, manager_id, salary, hire_date)
                                                  VALUES (13, 'Tara', 30, 8, 50000, '2026-03-01');
SELECT balance FROM accounts WHERE account_id = 1;
 10000.00                    ← still the snapshot value
SELECT count(*) FROM employees WHERE dept_id = 30;
 2                           ← no phantom row
UPDATE accounts SET balance = balance + 500 WHERE account_id = 1;
ERROR:  could not serialize access due to concurrent update
ROLLBACK;                    ← retry the whole transaction
```

### Lost update with application-computed values (READ COMMITTED)

Both sessions read the balance, compute the new value in the application and write it back:

```text
Session A                                         Session B
BEGIN;
SELECT balance … → 10000.00
                                                  BEGIN;
                                                  SELECT balance … → 10000.00
                                                  UPDATE accounts SET balance = 8000.00   -- withdrew 2000
                                                  WHERE account_id = 1;
                                                  COMMIT;
UPDATE accounts SET balance = 9000.00             -- withdrew 1000
WHERE account_id = 1;
COMMIT;

Final balance: 9000.00 — B's withdrawal of 2000 is lost (should be 7000.00)
```

Fixes: compute in SQL (`SET balance = balance - 1000`), lock the row when reading (`SELECT … FOR UPDATE`), use optimistic version checks, or use `REPEATABLE READ` (A's update would then fail with a serialization error instead of overwriting).

### Atomic updates are safe in READ COMMITTED

```text
Session A                                         Session B
BEGIN;
UPDATE accounts SET balance = balance - 1000
WHERE account_id = 1 RETURNING balance;
 9000.00
                                                  UPDATE accounts SET balance = balance - 2000
                                                  WHERE account_id = 1 RETURNING balance;
                                                  -- waits for A's row lock …
COMMIT;
                                                  -- … then re-reads the committed row
                                                   7000.00
```

B waited about two seconds for A, then applied its change to A's committed version. Final balance 7000.00 — nothing lost.

### Write skew: REPEATABLE READ allows it, SERIALIZABLE prevents it

Rule: at least one doctor must stay on duty. Each doctor's transaction checks the rule, then takes themselves off duty.

```sql
CREATE TABLE on_call (doctor text PRIMARY KEY, on_duty boolean NOT NULL);
INSERT INTO on_call VALUES ('Dr. Rao', true), ('Dr. Iyer', true);
SELECT count(*) AS on_duty FROM on_call WHERE on_duty;
```

**Output:**

```text
 on_duty
---------
       2
(1 row)
```

Under `REPEATABLE READ`:

```text
Session A                                         Session B
BEGIN ISOLATION LEVEL REPEATABLE READ;            BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT count(*) … WHERE on_duty;  → 2             SELECT count(*) … WHERE on_duty;  → 2
                                                  UPDATE on_call SET on_duty = false
                                                  WHERE doctor = 'Dr. Iyer';
UPDATE on_call SET on_duty = false
WHERE doctor = 'Dr. Rao';
COMMIT;                                           COMMIT;

Final: Dr. Iyer f, Dr. Rao f   ← nobody on duty; the rule is broken
```

Each transaction updated a different row, so there was no write conflict — yet the combined result is impossible in any serial order. Under `SERIALIZABLE`, the same steps give:

```text
Session A: COMMIT;   → COMMIT
Session B: COMMIT;   → ERROR:  could not serialize access due to read/write dependencies among transactions
                       DETAIL:  Reason code: Canceled on identification as a pivot, during commit attempt.
                       HINT:  The transaction might succeed if retried.

Final: Dr. Iyer t, Dr. Rao f   ← rule preserved; B retries, sees 1 on duty and refuses
```

Alternatives in `READ COMMITTED`: lock the rows being checked (`SELECT … FROM on_call WHERE on_duty FOR UPDATE`), or lock a shared parent row (the shift) before checking.

## Comparison

### READ COMMITTED vs REPEATABLE READ vs SERIALIZABLE in PostgreSQL

| | Read committed | Repeatable read | Serializable |
|---|---|---|---|
| Snapshot | Per statement | Per transaction | Per transaction |
| Concurrent update of the same row | Waits, then applies to the new version | Waits, then **error** if the other committed | Same as repeatable read |
| Phantoms | Possible | Not possible | Not possible |
| Write skew | Possible | Possible | Detected → error |
| Extra blocking | — | — | None (SIRead locks do not block) |
| Needs retry logic | Rarely (deadlocks) | Yes (40001) | Yes (40001) |
| Default | Yes | | |

## Common Mistakes

- Saying PostgreSQL's `READ UNCOMMITTED` allows dirty reads.
- Saying `REPEATABLE READ` in PostgreSQL allows phantoms (the standard allows them; PostgreSQL does not).
- Raising the isolation level without adding a retry loop for `40001` errors.
- Read-modify-write in application code under `READ COMMITTED` (lost updates).
- Thinking `SERIALIZABLE` makes transactions run one at a time — it runs them concurrently and aborts one if needed.
- Calling `SET TRANSACTION ISOLATION LEVEL` after the transaction's first query.
- Long `REPEATABLE READ` reports holding back vacuum cleanup.

## Revision

- Anomalies: dirty read, non-repeatable read, phantom, lost update, write skew, serialization anomaly.
- PostgreSQL: READ UNCOMMITTED = READ COMMITTED (no dirty reads); default READ COMMITTED uses a snapshot per statement; REPEATABLE READ one snapshot per transaction, no phantoms, concurrent-update error; SERIALIZABLE = SSI, aborts dangerous patterns.
- `UPDATE … SET x = x - n` is safe at every level; read-then-write in the application is not.
- Write skew needs SERIALIZABLE or explicit locking.
- SQLSTATE 40001 / 40P01 → retry the whole transaction.

## Quick Revision

PostgreSQL never allows dirty reads; READ COMMITTED (the default) snapshots each statement, REPEATABLE READ snapshots the whole transaction with no phantoms, and SERIALIZABLE also aborts write skew. Above READ COMMITTED, be ready to retry on SQLSTATE 40001.
