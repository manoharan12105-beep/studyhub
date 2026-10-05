# Locking and Deadlocks — Interview Questions

## Beginner

### Q1. Do readers block writers in PostgreSQL?

<details>
<summary>Answer</summary>

No. Thanks to MVCC, a `SELECT` reads a snapshot of committed row versions and takes no row locks, so it never blocks an `UPDATE` and is never blocked by one. Writers block only other writers (or explicit lockers) on the same rows. The exception is `ACCESS EXCLUSIVE` table locks (most `ALTER TABLE`, `DROP`, `TRUNCATE`), which conflict even with `SELECT`.

</details>

### Q2. What does SELECT … FOR UPDATE do?

<details>
<summary>Answer</summary>

It reads rows and locks them as if they were about to be updated, until the transaction ends. Other transactions that try to update, delete or lock those rows wait; plain reads continue. It is used for read-decide-write logic in one transaction (check stock, then decrement) to prevent lost updates.

</details>

### Q3. What is a deadlock?

<details>
<summary>Answer</summary>

A cycle of transactions each waiting for a lock held by the next, so none can proceed — e.g. T1 holds row A and wants row B while T2 holds row B and wants row A. PostgreSQL's deadlock detector (run after `deadlock_timeout`, default 1 second of waiting) breaks it by aborting one transaction with "deadlock detected" (SQLSTATE 40P01).

</details>

## Intermediate

### Q4. How do you prevent deadlocks?

<details>
<summary>Answer</summary>

Acquire locks in a consistent global order (e.g. always lock the lower account id first, or `SELECT … ORDER BY id FOR UPDATE` before updating several rows), keep transactions short, avoid user interaction or remote calls while holding locks, and touch rows in the same order in all code paths. Since they cannot be fully eliminated, catch `40P01` and retry the transaction.

</details>

### Q5. Optimistic vs pessimistic locking — when to use which?

<details>
<summary>Answer</summary>

Pessimistic: lock on read (`SELECT … FOR UPDATE`, JPA `PESSIMISTIC_WRITE`); others wait. Good when conflicts are frequent and transactions are short. Optimistic: no lock; each row carries a version, and the update includes `WHERE version = :readVersion` — zero rows updated means someone else changed it (JPA `@Version`, `OptimisticLockException`). Good when conflicts are rare or there is long "think time" between reading and saving (edit forms), where holding a lock would be unacceptable.

</details>

### Q6. What is SKIP LOCKED used for?

<details>
<summary>Answer</summary>

Building job queues on a table: `SELECT … FROM jobs WHERE status = 'NEW' ORDER BY id LIMIT 10 FOR UPDATE SKIP LOCKED` lets many workers each claim a different batch without waiting for each other — rows locked by another worker are simply skipped. It deliberately returns an inconsistent view, so it is not suitable for general queries.

</details>

### Q7. What is the difference between NOWAIT and lock_timeout?

<details>
<summary>Answer</summary>

`NOWAIT` (on `SELECT … FOR UPDATE` or `LOCK TABLE`) fails immediately if the lock is not available. `lock_timeout` is a setting that makes any statement give up after waiting the given time for a lock ("canceling statement due to lock timeout"). `statement_timeout` limits total execution time regardless of the cause.

</details>

## Advanced

### Q8. Why can an ALTER TABLE make a whole application hang?

<details>
<summary>Answer</summary>

Most `ALTER TABLE` forms need `ACCESS EXCLUSIVE`. If any transaction holds even `ACCESS SHARE` on the table (a long report, an idle-in-transaction session), the `ALTER` waits — and every later query on that table, including plain `SELECT`s, queues behind the waiting `ALTER` because it conflicts with it. Mitigations: `SET lock_timeout` (a few seconds) and retry, run migrations at quiet times, kill idle-in-transaction sessions, and prefer non-blocking forms (`CREATE INDEX CONCURRENTLY`, adding constraints `NOT VALID` then `VALIDATE`).

</details>

### Q9. How do you find what is blocking a query?

<details>
<summary>Answer</summary>

```sql
-- Illustrative
SELECT pid, pg_blocking_pids(pid) AS blocked_by, wait_event_type, wait_event,
       state, now() - xact_start AS xact_age, left(query, 60)
FROM pg_stat_activity
WHERE cardinality(pg_blocking_pids(pid)) > 0;
```

Then inspect the blocking pids in `pg_stat_activity` (often an idle-in-transaction session) and, if necessary, `pg_cancel_backend(pid)` or `pg_terminate_backend(pid)`. `pg_locks` shows the individual locks; `log_lock_waits` records long waits in the server log.

</details>

### Q10. What are advisory locks?

<details>
<summary>Answer</summary>

Locks on application-chosen integer keys, with no table attached: `pg_advisory_lock(key)` (session-level, re-entrant, released by `pg_advisory_unlock` or disconnect), `pg_advisory_xact_lock(key)` (released at transaction end) and `pg_try_…` variants that return a boolean instead of waiting. Uses: ensure only one application instance runs a scheduled job, serialize work per tenant or per external resource. Care is needed with connection pools, since session-level locks stay with the pooled connection.

</details>
