# Transactions Interview Questions

**Module:** Interview · **Interview priority:** Core

## What Is It?

A bank of interview questions on transactions and concurrency: ACID, commit and rollback, savepoints, isolation levels and their anomalies, MVCC, row and table locks, `SELECT … FOR UPDATE`, deadlocks, optimistic versus pessimistic locking, and retry logic. The [questions](interview-questions.md) are typical of backend rounds, where money transfers and inventory updates are the standard scenarios.

## Why It Matters

- Concurrency bugs (lost updates, double booking, overselling) are among the costliest production bugs, and interviewers know it.
- Backend frameworks (`@Transactional` in Spring) hide transactions; interviewers check that you know what the database actually does.

## Core Concept

### Anomalies and isolation in PostgreSQL

| Anomaly | Read Committed (default) | Repeatable Read | Serializable |
|---------|--------------------------|-----------------|--------------|
| Dirty read | Prevented | Prevented | Prevented |
| Non-repeatable read | Possible | Prevented | Prevented |
| Phantom read | Possible | Prevented (snapshot) | Prevented |
| Lost update (read-modify-write) | Possible | Error `40001` on conflict | Error `40001` |
| Write skew | Possible | Possible | Prevented (SSI, error `40001`) |

PostgreSQL treats Read Uncommitted as Read Committed.

### Coverage

| Area | Lessons |
|------|---------|
| Basics | [Transactions](../../transactions/database-transactions/content.md), [Isolation Levels](../../transactions/postgresql-isolation-levels/content.md) |
| Concurrency | [Locking and Deadlocks](../../concurrency-and-mvcc/locking-and-deadlocks/content.md), [MVCC](../../concurrency-and-mvcc/postgresql-mvcc/content.md) |

## Revision

- ACID: atomic (all or nothing), consistent (constraints hold), isolated (concurrency control), durable (WAL).
- Read-modify-write needs `UPDATE … SET x = x - 1`, `SELECT … FOR UPDATE`, a version column, or a higher isolation level with retries.
- Deadlock = cycle of lock waits; PostgreSQL aborts one transaction; prevent with a consistent lock order.
- Keep transactions short; never wait for a user or remote call inside one.

## Quick Revision

ACID via WAL and MVCC; Read Committed by default; lost updates need atomic updates, row locks or optimistic versions; serialization failures (`40001`) and deadlocks (`40P01`) must be retried.
