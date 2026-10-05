# Backend Developer Database Questions

**Module:** Interview · **Interview priority:** Core

## What Is It?

A bank of database questions asked to backend (Java/Spring) developers: talking to PostgreSQL from application code (JDBC, connection pools, transactions, ORMs), schema migrations, safe production changes, idempotency, pagination, soft deletes, multi-tenancy, caching and read replicas. The [questions](interview-questions.md) focus on decisions and failure modes rather than syntax.

## Why It Matters

- Backend interviews probe how your code behaves under concurrency, failure and growth, and the database is where most of that shows.
- Many production incidents are database-adjacent: exhausted connection pools, lock-taking migrations, N+1 queries, double-processing.

## Core Concept

### The application–database boundary

| Concern | Practice |
|---------|----------|
| Connections | A pool (HikariCP) sized to the database, not to the thread count |
| Statements | `PreparedStatement` with bound parameters, never string concatenation |
| Transactions | Short; one business operation; no remote calls inside |
| Errors | Map SQLSTATEs: `23505` unique, `23503` FK, `40001` serialization, `40P01` deadlock → retry where safe |
| Schema | Versioned migrations (Flyway/Liquibase), backward-compatible steps |
| Reads at scale | Indexes, keyset pagination, caching, replicas with known lag |

### Coverage

| Area | Lessons |
|------|---------|
| Transactions | [Transactions](../../transactions/database-transactions/content.md), [Locking and Deadlocks](../../concurrency-and-mvcc/locking-and-deadlocks/content.md) |
| Security | [Roles, Privileges and RLS](../../security-and-permissions/roles-and-privileges/content.md) |
| Upserts | [RETURNING and Upsert](../../postgresql-features/returning-and-upsert/content.md) |

## Revision

- Pool connections; bind parameters; keep transactions short.
- Constraints are the last line of defence against races (unique, FK, check, exclusion).
- Migrations: expand → migrate data → contract; `CREATE INDEX CONCURRENTLY`; `lock_timeout`.
- Idempotency keys + `ON CONFLICT` for safe retries; outbox for reliable events.

## Quick Revision

Pool, bind, keep transactions short, let constraints guard invariants, retry `40001`/`40P01`, and change schemas in backward-compatible steps.
