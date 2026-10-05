# Indexing Interview Questions

**Module:** Interview · **Interview priority:** Core

## What Is It?

A bank of interview questions on indexes: how B-tree indexes work, when the planner uses them, composite-index column order, covering, partial and expression indexes, GIN/GiST/BRIN/hash, the cost of indexes on writes, and diagnosing unused indexes. The [questions](interview-questions.md) are typical of "why is this query slow?" rounds.

## Why It Matters

- "Add an index" is the most common performance answer, and interviewers check whether you know when it does **not** help.
- Composite-index order and selectivity questions come up in almost every backend interview.

## Core Concept

### What an index is

A separate, ordered structure (for B-tree: a balanced tree of keys pointing to row locations, the TIDs) that finds rows without scanning the whole table. It speeds up `=`, ranges, `ORDER BY`, joins and uniqueness checks. The costs are extra storage, slower writes and maintenance.

| Index | Good for |
|-------|----------|
| B-tree (default) | `=`, `<`, `>`, `BETWEEN`, `ORDER BY`, prefix `LIKE 'abc%'` (with suitable collation/opclass) |
| Hash | `=` only |
| GIN | `jsonb`, arrays, full-text, trigrams (`pg_trgm`) |
| GiST | Ranges, geometry, nearest neighbour, exclusion constraints |
| BRIN | Huge, naturally ordered tables (time-series appends) |

### Coverage

| Area | Lessons |
|------|---------|
| Indexes | [Index Fundamentals](../../indexing/index-fundamentals/content.md), [Advanced Indexes](../../indexing/advanced-indexes/content.md) |
| Plans | [EXPLAIN and Query Plans](../../query-optimization/explain-and-query-plans/content.md) |

## Revision

- Composite `(a, b)` serves `a`, `a + b`, `a + range on b`, `ORDER BY a, b`; not `b` alone (except via a rare skip scan in PostgreSQL 18).
- Equality columns first, then the range/sort column.
- Functions on the column defeat a plain index → expression index.
- Low selectivity or small tables → sequential scan is correct.

## Quick Revision

B-tree for most things; equality columns first; expression indexes for functions; partial indexes for subsets; `INCLUDE` for index-only scans; every index slows writes — verify with `EXPLAIN (ANALYZE)` and `pg_stat_user_indexes`.
