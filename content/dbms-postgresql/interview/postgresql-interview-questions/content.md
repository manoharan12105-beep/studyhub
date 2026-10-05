# PostgreSQL Interview Questions

**Module:** Interview · **Interview priority:** Core

## What Is It?

A bank of PostgreSQL-specific interview questions: architecture, MVCC and vacuum, data types (`jsonb`, arrays, ranges, `timestamptz`), identity columns and sequences, `RETURNING`, `ON CONFLICT`, `DISTINCT ON`, extensions, roles, and operational topics such as connection pooling, replication and backups. The [questions](interview-questions.md) are what backend interviews ask once you mention PostgreSQL on your resume.

## Why It Matters

- PostgreSQL is the default relational database for many new backends; interviewers expect more than generic SQL.
- Knowing how MVCC, vacuum and the planner behave explains most PostgreSQL performance and locking problems.

## Core Concept

### Architecture in one paragraph

A **postmaster** process accepts connections and starts one backend **process per connection**. Backends share memory: **shared buffers** cache table and index pages. Changes are recorded in the **WAL** before data pages are written. Background processes include the checkpointer, background writer, WAL writer, **autovacuum** launcher and workers, and WAL senders for replication. Each row change creates a new **tuple version**; old versions are removed later by vacuum (MVCC).

### Coverage

| Area | Lessons |
|------|---------|
| Types and features | [Data Types](../../postgresql-data-types/postgresql-data-types/content.md), [JSONB and Arrays](../../postgresql-features/jsonb-and-arrays/content.md), [RETURNING and Upsert](../../postgresql-features/returning-and-upsert/content.md), [DISTINCT ON](../../postgresql-features/distinct-on/content.md) |
| Concurrency | [MVCC](../../concurrency-and-mvcc/postgresql-mvcc/content.md), [Isolation Levels](../../transactions/postgresql-isolation-levels/content.md) |
| Server-side code and security | [Functions and Procedures](../../functions-procedures-triggers/postgresql-functions-and-procedures/content.md), [Roles and Privileges](../../security-and-permissions/roles-and-privileges/content.md) |

## Revision

- Process per connection → use a pooler (PgBouncer, or the application pool) for many clients.
- MVCC: readers never block writers; updates create new versions; vacuum reclaims dead tuples and prevents XID wraparound.
- Default isolation: Read Committed; Repeatable Read is snapshot isolation; Serializable is SSI.
- Prefer `timestamptz`, `text`, `GENERATED … AS IDENTITY`, `jsonb` (not `json`).

## Quick Revision

PostgreSQL = process per connection + shared buffers + WAL + MVCC with vacuum. Know `jsonb`/GIN, `ON CONFLICT`, `RETURNING`, `DISTINCT ON`, identity columns, isolation levels, and why autovacuum matters.
