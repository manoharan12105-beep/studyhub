# Locking and Deadlocks

**Module:** Concurrency and MVCC · **Interview priority:** Core

## What Is It?

A **lock** reserves a resource — a row, a table, or an application-defined key — so that conflicting operations of other transactions wait until it is released (at commit or rollback). A **deadlock** happens when transactions wait for each other in a cycle, so none can proceed; PostgreSQL detects it and aborts one of them.

Thanks to MVCC, PostgreSQL needs far fewer locks than older designs: **readers never block writers, and writers never block readers**. Locks matter when two transactions **write** the same rows, when a transaction explicitly locks rows it read, and for schema changes.

## Why It Matters

- Lost updates, oversold stock, duplicate job processing and "the site froze during a migration" are locking problems.
- Interviewers ask about pessimistic vs optimistic locking, `SELECT … FOR UPDATE`, `SKIP LOCKED` job queues, how deadlocks happen and how to avoid them.
- Java backends meet these as JPA `@Lock(PESSIMISTIC_WRITE)`, `@Version` and `CannotAcquireLockException` ([Spring Boot: JPA Locking](../../../spring-boot/jpa-hibernate/jpa-locking/content.md)).

## Core Concept

### Row-level locks

Taken automatically by `UPDATE`/`DELETE`, or explicitly by `SELECT … FOR …`:

| Lock | Taken by | Blocks |
|------|----------|--------|
| `FOR UPDATE` | `SELECT … FOR UPDATE`, `DELETE`, `UPDATE` of key columns | All other row locks on the row |
| `FOR NO KEY UPDATE` | `UPDATE` of non-key columns, `SELECT … FOR NO KEY UPDATE` | `FOR UPDATE`, `FOR NO KEY UPDATE`, `FOR SHARE` |
| `FOR SHARE` | `SELECT … FOR SHARE` | Writers (`FOR UPDATE`, `FOR NO KEY UPDATE`) |
| `FOR KEY SHARE` | Foreign-key checks on the referenced row | `FOR UPDATE` only (deleting/re-keying the parent) |

Plain `SELECT` takes **no row locks**. Row locks are stored in the row itself (not in shared memory), so locking millions of rows is possible, but every locked row is written.

### Table-level locks

Every statement also takes a table-level lock mode. The main ones:

| Mode | Taken by | Conflicts with |
|------|----------|----------------|
| `ACCESS SHARE` | `SELECT` | `ACCESS EXCLUSIVE` only |
| `ROW SHARE` | `SELECT … FOR UPDATE/SHARE` | `EXCLUSIVE`, `ACCESS EXCLUSIVE` |
| `ROW EXCLUSIVE` | `INSERT`, `UPDATE`, `DELETE`, `MERGE` | `SHARE` and stronger |
| `SHARE UPDATE EXCLUSIVE` | `VACUUM`, `ANALYZE`, `CREATE INDEX CONCURRENTLY`, some `ALTER TABLE` | Itself and stronger |
| `SHARE` | `CREATE INDEX` (non-concurrent) | Writers (`ROW EXCLUSIVE`) |
| `ACCESS EXCLUSIVE` | Most `ALTER TABLE`, `DROP TABLE`, `TRUNCATE`, `VACUUM FULL`, `LOCK TABLE` | **Everything**, including `SELECT` |

### The lock queue: why a migration can freeze reads

Lock requests wait in a queue. If a long-running transaction holds `ACCESS SHARE` (even an idle one that once read the table), an `ALTER TABLE` waits for `ACCESS EXCLUSIVE` — and every new `SELECT` on that table queues **behind the ALTER**, because it conflicts with the waiting request. A harmless-looking migration can stop all traffic to a table. Protect migrations with `SET lock_timeout = '2s'` and retry.

### Pessimistic vs optimistic locking

| | Pessimistic | Optimistic |
|---|---|---|
| Idea | Lock what you read, others wait | Don't lock; detect conflicting changes at write time |
| SQL | `SELECT … FOR UPDATE`, then `UPDATE` | `UPDATE … SET …, version = version + 1 WHERE id = ? AND version = ?` — 0 rows ⇒ conflict |
| Conflict outcome | Waiting | Retry or report to the user |
| Good when | Conflicts are frequent; short transactions | Conflicts are rare; long user "think time" between read and write |
| JPA | `@Lock(LockModeType.PESSIMISTIC_WRITE)` | `@Version` field |

### Not waiting: NOWAIT, SKIP LOCKED, lock_timeout

- `FOR UPDATE NOWAIT` — fail immediately with *could not obtain lock on row* instead of waiting.
- `FOR UPDATE SKIP LOCKED` — silently skip rows locked by others. The standard building block for **job queues**: each worker locks a different batch of rows.
- `SET lock_timeout = '…'` — give up any lock wait after a time (*canceling statement due to lock timeout*). `statement_timeout` limits total statement time.

### Deadlocks

```text
T1: locks row A ────────────▶ wants row B (held by T2) ─┐
T2: locks row B ────────────▶ wants row A (held by T1) ─┘  cycle → deadlock
```

- PostgreSQL checks for a cycle after a lock wait has lasted `deadlock_timeout` (default 1 s), then aborts one transaction with SQLSTATE **`40P01`** *deadlock detected*. The other proceeds.
- Prevention: acquire locks in a **consistent order** (e.g. lower `account_id` first, or `ORDER BY id … FOR UPDATE` before updating several rows), keep transactions short, update in sets rather than row by row from different code paths.
- Handling: deadlocks can never be ruled out completely; treat `40P01` like a serialization failure and retry the transaction.

### Advisory locks

Application-defined locks on a number (or two): `pg_advisory_lock(key)` / `pg_advisory_unlock(key)` (session-level), `pg_advisory_xact_lock(key)` (released at transaction end), `pg_try_advisory_lock(key)` (non-blocking). Used for "only one instance runs this scheduled job", or serializing work per customer without a row to lock.

### Observing locks

- `pg_stat_activity` — what each session is doing; `wait_event_type = 'Lock'` means waiting for a lock.
- `pg_blocking_pids(pid)` — which sessions block a given session.
- `pg_locks` — every lock held or awaited.
- `log_lock_waits = on` logs waits longer than `deadlock_timeout`.

## Syntax

```sql
-- Illustrative
SELECT … FOR UPDATE | FOR NO KEY UPDATE | FOR SHARE | FOR KEY SHARE [OF table] [NOWAIT | SKIP LOCKED];
LOCK TABLE t IN ACCESS EXCLUSIVE MODE [NOWAIT];
SET lock_timeout = '2s';
SELECT pg_advisory_xact_lock(42);
SELECT pid, pg_blocking_pids(pid), wait_event_type, query FROM pg_stat_activity;
```

## Examples

The concurrent examples were run with two (or three) `psql` sessions on PostgreSQL 18 and are shown as timelines.

### Locks a transaction holds

```sql
BEGIN;
SELECT account_id FROM accounts WHERE account_id = 1 FOR UPDATE;
SELECT relation::regclass AS relation, mode, granted
FROM pg_locks
WHERE pid = pg_backend_pid() AND locktype = 'relation'
ORDER BY relation::regclass::text, mode;
COMMIT;
```

**Output:**

```text
 account_id
------------
          1
(1 row)

   relation    |      mode       | granted
---------------+-----------------+---------
 accounts      | RowShareLock    | t
 accounts_pkey | RowShareLock    | t
 pg_locks      | AccessShareLock | t
(3 rows)
```

`FOR UPDATE` took `RowShareLock` on the table and on the primary-key index it used; the `AccessShareLock` on `pg_locks` comes from the query reading the lock view. The row lock itself is stored in the row, not listed per row here.

### Readers are not blocked; FOR UPDATE waits; NOWAIT and lock_timeout give up

```text
Session A                                         Session B
BEGIN;
SELECT account_id, balance FROM accounts
WHERE account_id = 1 FOR UPDATE;
                                                  SELECT balance FROM accounts WHERE account_id = 1;
                                                   10000.00                 ← plain read: no waiting

                                                  SELECT account_id FROM accounts
                                                  WHERE account_id = 1 FOR UPDATE NOWAIT;
                                                  ERROR:  could not obtain lock on row in relation "accounts"

                                                  SET lock_timeout = '1s';
                                                  UPDATE accounts SET balance = 1 WHERE account_id = 1;
                                                  ERROR:  canceling statement due to lock timeout
COMMIT;
```

### A deadlock

```text
Session A                                         Session B
BEGIN;                                            BEGIN;
UPDATE accounts SET balance = balance - 100
WHERE account_id = 1;            -- locks row 1
                                                  UPDATE accounts SET balance = balance - 200
                                                  WHERE account_id = 2;      -- locks row 2
UPDATE accounts SET balance = balance + 100
WHERE account_id = 2;            -- waits for B
                                                  UPDATE accounts SET balance = balance + 200
                                                  WHERE account_id = 1;      -- waits for A: cycle
ERROR:  deadlock detected
DETAIL:  Process 23408 waits for ShareLock on transaction 7463; blocked by process 6216.
Process 6216 waits for ShareLock on transaction 7462; blocked by process 23408.
HINT:  See server log for query details.
                                                  UPDATE 1                   ← proceeds after A is aborted
COMMIT;  → ROLLBACK                               COMMIT;

Final: account 1 = 10200.00, account 2 = 4800.00 (only B's transfer happened)
```

Waiting on another transaction's row lock appears as a `ShareLock` on its **transaction id**. Had both sessions updated the lower account id first, B would simply have waited for A — no deadlock.

### SKIP LOCKED job queue

```sql
CREATE TABLE jobs (job_id int PRIMARY KEY, payload text, status text NOT NULL DEFAULT 'NEW');
INSERT INTO jobs (job_id, payload) SELECT g, 'job ' || g FROM generate_series(1, 5) AS g;

-- a worker's claim step (in its own transaction)
BEGIN;
SELECT job_id FROM jobs WHERE status = 'NEW' ORDER BY job_id LIMIT 2 FOR UPDATE SKIP LOCKED;
UPDATE jobs SET status = 'DONE' WHERE job_id IN (1, 2);
COMMIT;

SELECT job_id, status FROM jobs ORDER BY job_id;
```

**Output:**

```text
 job_id
--------
      1
      2
(2 rows)

 job_id | status
--------+--------
      1 | DONE
      2 | DONE
      3 | NEW
      4 | NEW
      5 | NEW
(5 rows)
```

With two workers claiming at the same time:

```text
Worker A                                          Worker B
BEGIN;
SELECT job_id … LIMIT 2 FOR UPDATE SKIP LOCKED;
 1, 2
                                                  BEGIN;
                                                  SELECT job_id … LIMIT 2 FOR UPDATE SKIP LOCKED;
                                                   3, 4                     ← skips A's rows, no waiting
                                                  COMMIT;
                                                  SELECT job_id … LIMIT 2 FOR UPDATE;   -- no SKIP LOCKED
                                                  -- waits until A commits, then gets 1, 2
COMMIT;
```

In a real worker, the claimed jobs are processed and marked `DONE` in the same transaction (or marked `RUNNING` and committed quickly if processing is long).

### Optimistic locking with a version column

```sql
ALTER TABLE products ADD COLUMN version int NOT NULL DEFAULT 1;

-- both users loaded product 2 at version 1; the first save succeeds
UPDATE products SET price = 520.00, version = version + 1
WHERE product_id = 2 AND version = 1
RETURNING product_id, price, version;
```

**Output:**

```text
 product_id | price  | version
------------+--------+---------
          2 | 520.00 |       2
(1 row)
```

```sql
-- the second user's save still says version = 1: no row matches
UPDATE products SET price = 480.00, version = version + 1
WHERE product_id = 2 AND version = 1
RETURNING product_id, price, version;
```

**Output:**

```text
 product_id | price | version
------------+-------+---------
(0 rows)
```

Zero rows updated means "someone changed this product since you loaded it" — the application reloads and asks the user, or retries. JPA's `@Version` generates exactly this `WHERE version = ?` check and throws `OptimisticLockException` on 0 rows.

### A migration stuck behind a long transaction

```text
Session A (long report)          Session B (migration)              Session C (web request)
BEGIN;
SELECT count(*) FROM accounts;
-- …keeps the transaction open
                                 ALTER TABLE accounts
                                 ADD COLUMN note text;
                                 -- waits for ACCESS EXCLUSIVE
                                                                    SELECT count(*) FROM accounts;
                                                                    -- waits too: queued behind B
COMMIT;
                                 ALTER TABLE  (done)
                                                                    3   (done, ~3 s later)
```

`pg_stat_activity` during the wait showed session B with `wait_event_type = Lock` and `pg_blocking_pids = {A}`. With `SET lock_timeout = '2s'` before the `ALTER`, the migration would have failed fast (and could be retried) instead of blocking every reader.

### Advisory lock: single runner

```sql
SELECT pg_try_advisory_lock(1001) AS first_try,
       pg_try_advisory_lock(1001) AS same_session_again;
SELECT pg_advisory_unlock(1001), pg_advisory_unlock(1001);
```

**Output:**

```text
 first_try | same_session_again
-----------+--------------------
 t         | t
(1 row)

 pg_advisory_unlock | pg_advisory_unlock
--------------------+--------------------
 t                  | t
(1 row)
```

Session-level advisory locks are re-entrant within the same session (each lock needs its own unlock); another session's `pg_try_advisory_lock(1001)` would have returned `false` while they were held.

## Comparison

### Ways to handle a contended row

| Approach | Behaviour on conflict | Typical use |
|----------|-----------------------|-------------|
| Atomic `UPDATE … SET x = x - 1` | Waits, then applies to the latest version | Counters, balances |
| `SELECT … FOR UPDATE` | Waits | Read-decide-write in one short transaction |
| `FOR UPDATE NOWAIT` | Error immediately | Interactive actions ("someone else is editing") |
| `FOR UPDATE SKIP LOCKED` | Skips the row | Job/queue workers |
| Optimistic version check | 0 rows → retry/report | Long edit sessions, low conflict rates |
| `SERIALIZABLE` | Abort + retry | Multi-row rules |

## Common Mistakes

- Believing `SELECT` blocks writers (or that writers block readers) in PostgreSQL.
- Read-then-write without `FOR UPDATE` or a version check — lost updates.
- Updating several rows in different orders in different code paths — deadlocks.
- Not retrying on `40P01` deadlock errors.
- Running DDL on busy tables without `lock_timeout`; leaving transactions idle-in-transaction.
- Using `SKIP LOCKED` for anything except queue-like work (it silently ignores rows — it is not a general concurrency fix).
- Holding row locks while calling external services.

## Revision

- MVCC: readers and writers do not block each other; writers block writers on the same row.
- Row locks: `FOR UPDATE` > `FOR NO KEY UPDATE` > `FOR SHARE` > `FOR KEY SHARE`; table modes from `ACCESS SHARE` to `ACCESS EXCLUSIVE` (blocks even `SELECT`).
- Lock queue: a waiting `ACCESS EXCLUSIVE` blocks later readers — use `lock_timeout` for DDL.
- Pessimistic (`FOR UPDATE`) vs optimistic (`version` column); `NOWAIT`, `SKIP LOCKED`, `lock_timeout`.
- Deadlock: cycle detected after `deadlock_timeout`, one transaction gets `40P01`; prevent with consistent lock order, handle with retry.
- Observe: `pg_stat_activity`, `pg_blocking_pids`, `pg_locks`; advisory locks for app-level mutual exclusion.

## Quick Revision

In PostgreSQL only writers block writers; lock rows you will change with FOR UPDATE (or use a version column), use NOWAIT, SKIP LOCKED and lock_timeout to avoid waiting, take locks in a consistent order to prevent deadlocks, and retry on 40P01.
