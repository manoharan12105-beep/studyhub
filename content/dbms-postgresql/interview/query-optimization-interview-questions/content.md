# Query Optimization Interview Questions

**Module:** Interview · **Interview priority:** Frequently asked

## What Is It?

A bank of interview questions on making queries fast in PostgreSQL: reading `EXPLAIN` and `EXPLAIN ANALYZE`, the cost-based planner and statistics, scan and join methods, common anti-patterns (N+1 queries, `SELECT *`, functions on indexed columns, `OFFSET` paging), and a systematic tuning process. The [questions](interview-questions.md) mirror the "this endpoint is slow, what do you do?" round.

## Why It Matters

- Interviewers want a **process**, not a list of tricks: measure, find the expensive node, fix the cause, verify.
- Most slow queries come from a handful of causes: missing or unusable indexes, bad estimates, fan-out joins, and too much data returned.

## Core Concept

### Tuning process

1. **Find** the slow queries: `pg_stat_statements` (total time, mean time, calls), slow-query logging (`log_min_duration_statement`).
2. **Measure** one: `EXPLAIN (ANALYZE, BUFFERS)` with realistic parameters.
3. **Locate** the node where time goes; compare estimated with actual rows.
4. **Fix** the cause: index, rewrite, statistics, schema, configuration (in that order of preference).
5. **Verify** with the same measurement, and watch write and side effects.

### Coverage

| Area | Lessons |
|------|---------|
| Plans | [EXPLAIN and Query Plans](../../query-optimization/explain-and-query-plans/content.md) |
| Practice | [Query Optimization Practice](../../query-optimization/query-optimization-practice/content.md) |
| Indexes | [Index Fundamentals](../../indexing/index-fundamentals/content.md) |

## Revision

- Scans: Seq, Index, Index Only, Bitmap Heap/Index. Joins: Nested Loop, Hash, Merge.
- Bad row estimates → `ANALYZE`, extended statistics, avoid opaque expressions.
- Sargable predicates: compare the raw column with constants or ranges.
- Return less: select needed columns, paginate with keysets, aggregate in the database.

## Quick Revision

Measure with `pg_stat_statements` and `EXPLAIN (ANALYZE, BUFFERS)`, find the expensive node and the misestimate, fix with an index, a rewrite or statistics, and verify.
