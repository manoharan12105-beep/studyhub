# Transactions Cheat Sheet

ACID, isolation, locking, MVCC and the patterns that prevent concurrency bugs in PostgreSQL.

## Commands

```sql
-- Illustrative
BEGIN;                                   -- or START TRANSACTION
BEGIN ISOLATION LEVEL REPEATABLE READ;
SET TRANSACTION READ ONLY;
SAVEPOINT s1;  ROLLBACK TO SAVEPOINT s1;  RELEASE SAVEPOINT s1;
COMMIT;  ROLLBACK;
SELECT … FOR UPDATE [NOWAIT | SKIP LOCKED];
LOCK TABLE t IN SHARE ROW EXCLUSIVE MODE;
```

## ACID

| Property | Meaning | PostgreSQL mechanism |
|----------|---------|----------------------|
| Atomicity | All or nothing | Transaction status in commit log; MVCC hides aborted rows |
| Consistency | Constraints hold | Constraints, triggers (deferred at commit) |
| Isolation | No interference | MVCC snapshots, row locks, SSI |
| Durability | Committed = permanent | WAL flushed at commit |

## Isolation Levels in PostgreSQL

| Level | Snapshot | Prevents | On conflict |
|-------|----------|----------|-------------|
| Read Committed (default) | Per statement | Dirty reads | Re-checks the updated row, continues |
| Repeatable Read | Per transaction | + non-repeatable reads, phantoms | `40001` serialization failure |
| Serializable | Per transaction + SSI | + write skew | `40001` |

`READ UNCOMMITTED` behaves as Read Committed. Repeatable Read and Serializable require application **retries**.

## Anomalies

| Anomaly | Example |
|---------|---------|
| Dirty read | Seeing uncommitted data (impossible in PostgreSQL) |
| Non-repeatable read | Same row read twice, different values |
| Phantom | Same range query, new rows |
| Lost update | Two read-modify-write cycles; one overwrites the other |
| Write skew | Two transactions check an invariant, write different rows, break it |

## Preventing Lost Updates

1. Atomic `UPDATE t SET qty = qty - 1 WHERE id = $1 AND qty > 0`.
2. `SELECT … FOR UPDATE`, then update.
3. Optimistic locking: `WHERE id = $1 AND version = $2`, `version = version + 1`.
4. Repeatable Read / Serializable + retry.

## Locks

- Row locks: `FOR UPDATE` > `FOR NO KEY UPDATE` > `FOR SHARE` > `FOR KEY SHARE` (FK checks).
- Table locks: from `ACCESS SHARE` (`SELECT`) to `ACCESS EXCLUSIVE` (`DROP`, most `ALTER TABLE`, `VACUUM FULL`).
- DDL waiting for a lock queues everything behind it → set `lock_timeout` for migrations.
- **Deadlock**: cycle of waits; detected after `deadlock_timeout`; one victim gets `40P01`. Prevent with a consistent lock order.

## MVCC

- `INSERT` creates a version (`xmin`); `DELETE` sets `xmax`; `UPDATE` = both.
- Snapshot decides visibility; readers don't block writers and vice versa.
- Dead versions → `VACUUM`; long transactions → bloat.

## Practical Rules

- Keep transactions short; no user waits or remote calls inside.
- One business operation per transaction.
- Retry on `40001` and `40P01` (whole transaction, limited attempts, backoff).
- Watch `idle in transaction` sessions; set `idle_in_transaction_session_timeout`.
- Use constraints for invariants; they work under any concurrency.
