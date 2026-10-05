# Query Optimization in Practice

**Module:** Query Optimization · **Interview priority:** Core

## What Is It?

**Query optimization** is the work of making a slow query (or a whole workload) faster: measure where time goes, find the cause — usually too much data read, a missing or unusable index, a bad estimate, or too many round trips — and fix it with an index, a rewrite, fresh statistics or a design change. This topic is a toolbox of the patterns that solve most real problems, each shown as a before/after plan.

## Why It Matters

- "How would you optimize a slow query?" is asked in almost every backend interview; a structured answer (measure → explain → fix → verify) stands out.
- Most production database incidents are a handful of patterns: unindexed foreign keys, functions on indexed columns, deep `OFFSET` pagination, N+1 queries from ORMs, huge unbatched updates.

## Core Concept

### A workflow

1. **Find** the queries that matter — total time, not just the slowest single run: `pg_stat_statements` (calls, total and mean time, rows), the slow-query log (`log_min_duration_statement`), `auto_explain`.
2. **Explain** the query with realistic parameters: `EXPLAIN (ANALYZE, BUFFERS)` ([EXPLAIN and Query Plans](../explain-and-query-plans/content.md)).
3. **Locate** the expensive node: most time, most rows read vs returned, disk sorts, big loop counts, estimate errors.
4. **Fix** the cause (table below).
5. **Verify** with `EXPLAIN ANALYZE` again and watch the workload metrics; consider the write-side cost of any new index.

### Symptoms and fixes

| Symptom in the plan | Typical cause | Fix |
|---------------------|---------------|-----|
| Seq Scan with large `Rows Removed by Filter` | No suitable index | Add an index (composite / partial / expression) |
| Index exists but Seq Scan on the column | Function, cast or leading `%` on the column | Make the predicate sargable, or index the expression |
| Nested loop with huge `loops` | Row underestimate | `ANALYZE`, extended statistics, better predicates |
| `Sort Method: external merge` | Sort larger than `work_mem` | Index providing the order, fewer columns, more `work_mem` |
| Hash join with `Batches` > 1 | Hash table larger than memory | More `work_mem`, reduce input |
| Index Scan reading 100,010 rows to return 10 | Deep `OFFSET` | Keyset pagination |
| SubPlan with large `loops` | Correlated scalar subquery | Join to aggregate / window function / index the correlation |
| Many identical short queries | N+1 access pattern | One query with a join or `= ANY(array)` |
| Fast plan, slow response | Too many rows/columns sent, locks, network | Select fewer columns, paginate, check waits |

### Writing sargable predicates

A predicate is **sargable** when the indexed column stands alone on one side of the comparison:

| Not sargable | Sargable |
|--------------|----------|
| `WHERE date_trunc('month', created_at) = '2026-03-01'` | `WHERE created_at >= '2026-03-01' AND created_at < '2026-04-01'` |
| `WHERE amount * 1.18 > 1000` | `WHERE amount > 1000 / 1.18` |
| `WHERE lower(email) = …` | Expression index on `lower(email)`, or `citext` |
| `WHERE user_id::text = '42'` | `WHERE user_id = 42` |
| `WHERE coalesce(deleted_at, 'infinity') > now()` | `WHERE deleted_at IS NULL OR deleted_at > now()` (or a partial index) |

### Pagination

- `ORDER BY id LIMIT 20 OFFSET 100000` must produce and discard 100,000 rows — every page is slower than the previous one.
- **Keyset (seek) pagination** remembers the last row seen: `WHERE id > :last_id ORDER BY id LIMIT 20` (or `WHERE (created_at, id) < (:ts, :id) ORDER BY created_at DESC, id DESC` with a matching composite index). Constant time per page; cannot jump to an arbitrary page number.

### The N+1 problem

An application (often an ORM with lazy loading) runs 1 query for a list, then 1 query **per item** for related data: 1 + N round trips. Fixes: a join, one query with `WHERE id = ANY(?)` for all related ids, or the ORM's fetch join / batch fetching (`JOIN FETCH`, `@BatchSize`, entity graphs in JPA).

### Other practical levers

- **Select only needed columns** — enables index-only scans and sends less data.
- **Batch writes** — multi-row `INSERT`, JDBC `addBatch()`, or `COPY` for bulk loads; large `UPDATE`/`DELETE` in batches of a few thousand rows to limit lock time, WAL bursts and bloat.
- **Avoid exact `count(*)` on huge tables** for UI counters; use `pg_class.reltuples` estimates or capped counts.
- **Keep statistics fresh** after bulk changes (`ANALYZE`).
- **Use the right isolation and short transactions** to avoid lock waits ([Locking and Deadlocks](../../concurrency-and-mvcc/locking-and-deadlocks/content.md)).
- **Server settings** (awareness): `shared_buffers` (~25% of RAM), `effective_cache_size`, `work_mem` (per sort/hash node!), `random_page_cost` (≈1.1 on SSDs), `max_connections` with a pooler (PgBouncer) in front.

## Syntax

```sql
-- Illustrative
CREATE EXTENSION pg_stat_statements;          -- needs shared_preload_libraries
SELECT query, calls, round(total_exec_time) AS total_ms, round(mean_exec_time, 2) AS mean_ms, rows
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;

SET log_min_duration_statement = '500ms';      -- log slow statements
```

## Examples

The examples use the same 5,000 users and 200,000 events as the EXPLAIN topic, **without** an index on `events.user_id` at the start.

```sql
CREATE TABLE users (user_id int PRIMARY KEY, name text NOT NULL, email text NOT NULL);
INSERT INTO users SELECT g, 'user' || g, 'User' || g || '@Mail.com' FROM generate_series(0, 4999) AS g;

CREATE TABLE events (
    event_id   bigint PRIMARY KEY,
    user_id    int  NOT NULL REFERENCES users,
    kind       text NOT NULL,
    created_at timestamptz NOT NULL,
    amount     numeric(10,2) NOT NULL
);
INSERT INTO events
SELECT g, g % 5000, (ARRAY['view', 'click', 'buy'])[g % 3 + 1],
       TIMESTAMPTZ '2026-01-01 00:00+00' + g * INTERVAL '1 minute', g % 1000
FROM generate_series(1, 200000) AS g;

ALTER TABLE users  SET (parallel_workers = 0);
ALTER TABLE events SET (parallel_workers = 0);
VACUUM ANALYZE users;
VACUUM ANALYZE events;
```

### 1. The unindexed foreign key

```sql
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT e.event_id, e.amount
FROM users u JOIN events e ON e.user_id = u.user_id
WHERE u.email = 'User42@Mail.com';
```

**Output:**

```text
                         QUERY PLAN
------------------------------------------------------------
 Hash Join (actual rows=40.00 loops=1)
   Hash Cond: (e.user_id = u.user_id)
   ->  Seq Scan on events e (actual rows=200000.00 loops=1)
   ->  Hash (actual rows=1.00 loops=1)
         Buckets: 1024  Batches: 1  Memory Usage: 9kB
         ->  Seq Scan on users u (actual rows=1.00 loops=1)
               Filter: (email = 'User42@Mail.com'::text)
               Rows Removed by Filter: 4999
(8 rows)
```

To find one user's 40 events, all 200,000 events were read. Index the foreign key:

```sql
CREATE INDEX events_user_id_idx ON events (user_id);

EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT e.event_id, e.amount
FROM users u JOIN events e ON e.user_id = u.user_id
WHERE u.email = 'User42@Mail.com';
```

**Output:**

```text
                                   QUERY PLAN
---------------------------------------------------------------------------------
 Nested Loop (actual rows=40.00 loops=1)
   ->  Seq Scan on users u (actual rows=1.00 loops=1)
         Filter: (email = 'User42@Mail.com'::text)
         Rows Removed by Filter: 4999
   ->  Bitmap Heap Scan on events e (actual rows=40.00 loops=1)
         Recheck Cond: (u.user_id = user_id)
         Heap Blocks: exact=40
         ->  Bitmap Index Scan on events_user_id_idx (actual rows=40.00 loops=1)
               Index Cond: (user_id = u.user_id)
               Index Searches: 1
(10 rows)
```

`users.email` is still read sequentially (5,000 rows); a unique index on `email` (it is a natural key) would complete the fix.

### 2. A non-sargable date filter

```sql
CREATE INDEX events_created_idx ON events (created_at);
SET TIME ZONE 'UTC';

EXPLAIN (COSTS OFF)
SELECT count(*) FROM events WHERE created_at::date = '2026-03-01';
```

**Output:**

```text
                        QUERY PLAN
-----------------------------------------------------------
 Aggregate
   ->  Seq Scan on events
         Filter: ((created_at)::date = '2026-03-01'::date)
(3 rows)
```

```sql
SET TIME ZONE 'UTC';
EXPLAIN (COSTS OFF)
SELECT count(*) FROM events
WHERE created_at >= '2026-03-01' AND created_at < '2026-03-02';
```

**Output:**

```text
                                                                           QUERY PLAN
----------------------------------------------------------------------------------------------------------------------------------------------------------------
 Aggregate
   ->  Index Only Scan using events_created_idx on events
         Index Cond: ((created_at >= '2026-03-01 00:00:00+00'::timestamp with time zone) AND (created_at < '2026-03-02 00:00:00+00'::timestamp with time zone))
(3 rows)
```

The cast hides the column from the index; the half-open range uses it (index-only, since only the indexed column is needed).

### 3. OFFSET vs keyset pagination

Page 10,001 of 10 events per page:

```sql
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT event_id, amount FROM events ORDER BY event_id LIMIT 10 OFFSET 100000;
```

**Output:**

```text
                                  QUERY PLAN
------------------------------------------------------------------------------
 Limit (actual rows=10.00 loops=1)
   ->  Index Scan using events_pkey on events (actual rows=100010.00 loops=1)
         Index Searches: 1
(3 rows)
```

```sql
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT event_id, amount FROM events WHERE event_id > 100000 ORDER BY event_id LIMIT 10;
```

**Output:**

```text
                                QUERY PLAN
--------------------------------------------------------------------------
 Limit (actual rows=10.00 loops=1)
   ->  Index Scan using events_pkey on events (actual rows=10.00 loops=1)
         Index Cond: (event_id > 100000)
         Index Searches: 1
(4 rows)
```

`OFFSET` walked 100,010 index entries and fetched their rows to return 10; the keyset query started at the right place and read 10.

### 4. OR across values vs IN

```sql
EXPLAIN (COSTS OFF)
SELECT count(*) FROM events WHERE user_id = 1 OR user_id = 2 OR user_id = 3;
```

**Output:**

```text
                         QUERY PLAN
------------------------------------------------------------
 Aggregate
   ->  Index Only Scan using events_user_id_idx on events
         Index Cond: (user_id = ANY ('{1,2,3}'::integer[]))
(3 rows)
```

```sql
EXPLAIN (COSTS OFF)
SELECT count(*) FROM events WHERE user_id IN (1, 2, 3);
```

**Output:**

```text
                         QUERY PLAN
------------------------------------------------------------
 Aggregate
   ->  Index Only Scan using events_user_id_idx on events
         Index Cond: (user_id = ANY ('{1,2,3}'::integer[]))
(3 rows)
```

On PostgreSQL 18 both plans are identical: the planner rewrote the `OR` chain on one column into `= ANY`. PostgreSQL 17 and older plan the `OR` form as a `BitmapOr` of three index scans. `IN (…)` / `= ANY(array)` is the clearer, version-independent way to write it — and the form to use for a list of ids passed from the application.

### 5. The N+1 pattern and its fix

An ORM loading 3 users and then each user's event count issues four queries:

```sql
SELECT user_id, name FROM users WHERE user_id IN (10, 11, 12) ORDER BY user_id;
SELECT count(*) FROM events WHERE user_id = 10;
SELECT count(*) FROM events WHERE user_id = 11;
SELECT count(*) FROM events WHERE user_id = 12;
```

**Output:**

```text
 user_id |  name
---------+--------
      10 | user10
      11 | user11
      12 | user12
(3 rows)

 count
-------
    40
(1 row)

 count
-------
    40
(1 row)

 count
-------
    40
(1 row)
```

One round trip instead of N + 1:

```sql
SELECT u.user_id, u.name, count(e.event_id) AS events
FROM users u
LEFT JOIN events e ON e.user_id = u.user_id
WHERE u.user_id = ANY (ARRAY[10, 11, 12])
GROUP BY u.user_id
ORDER BY u.user_id;
```

**Output:**

```text
 user_id |  name  | events
---------+--------+--------
      10 | user10 |     40
      11 | user11 |     40
      12 | user12 |     40
(3 rows)
```

With 100 users per page, the N+1 version makes 101 round trips; each is fast, but network latency and per-query overhead add up.

### 6. Exact count vs estimate

```sql
SELECT count(*) AS exact FROM events;
SELECT reltuples::bigint AS estimate FROM pg_class WHERE relname = 'events';
```

**Output:**

```text
 exact
--------
 200000
(1 row)

 estimate
----------
   200000
(1 row)
```

The estimate is free (maintained by `VACUUM`/`ANALYZE`) and good enough for "about 200,000 results"; the exact count must scan.

### 7. Large updates in batches

Updating millions of rows in one statement holds locks on all of them until commit, generates a burst of WAL and doubles the table's size with dead tuples at once. Batching by key range keeps each transaction short:

```sql
ALTER TABLE events ADD COLUMN amount_cents bigint;

UPDATE events SET amount_cents = amount * 100 WHERE event_id BETWEEN 1 AND 50000      AND amount_cents IS NULL;
UPDATE events SET amount_cents = amount * 100 WHERE event_id BETWEEN 50001 AND 100000 AND amount_cents IS NULL;
-- … continue per range (driven by a loop in a script or a procedure that COMMITs per batch)

SELECT count(*) FILTER (WHERE amount_cents IS NOT NULL) AS done,
       count(*) FILTER (WHERE amount_cents IS NULL)     AS remaining
FROM events;
```

**Output:**

```text
  done  | remaining
--------+-----------
 100000 |    100000
(1 row)
```

Each batch commits independently (autocommit), so locks are released quickly and vacuum can recycle space between batches. A procedure with `COMMIT` inside a loop automates this ([Functions and Procedures](../../functions-procedures-triggers/postgresql-functions-and-procedures/content.md)).

## Comparison

### Optimization levers by effort

| Lever | Effort | Typical gain | Cost |
|-------|--------|--------------|------|
| `ANALYZE` / extended statistics | Minutes | Fixes bad plans | None |
| Sargable rewrite | Minutes | 10–1000× | None |
| Add the right index | Minutes | 10–10000× | Write overhead, space |
| Keyset pagination | Hours | Constant-time pages | No random page jumps |
| Remove N+1 | Hours | Fewer round trips | Code changes |
| Denormalize / summary table / materialized view | Days | Large for reports | Consistency maintenance |
| Partitioning | Days | Pruning, easy archiving | Complexity |
| Hardware / settings | Varies | Broad | Money; tuning risk |

## Common Mistakes

- Optimizing without measuring, or measuring on tiny development data.
- Adding an index for every slow query without checking whether an existing one can be extended or reused.
- Functions on indexed columns in `WHERE`; mismatched types in comparisons and joins.
- Deep `OFFSET` pagination on large tables.
- N+1 queries hidden behind ORM lazy loading.
- `SELECT *` everywhere, preventing index-only scans and sending unused data.
- One giant `UPDATE`/`DELETE` on a busy table.
- Raising `work_mem` globally to fix one query (it applies per node, per query, per connection).

## Revision

- Workflow: find (`pg_stat_statements`) → explain (`EXPLAIN ANALYZE, BUFFERS`) → locate the costly node → fix → verify.
- Index foreign keys; keep predicates sargable; select only needed columns.
- Keyset pagination instead of deep `OFFSET`.
- Kill N+1 with joins or `= ANY(array)`.
- Estimates (`reltuples`) instead of exact counts for UI; `ANALYZE` after bulk changes.
- Batch large writes; keep transactions short.

## Quick Revision

Measure first, then read the plan to find the costly node. The usual fixes are indexing foreign keys, making predicates sargable, keyset pagination instead of OFFSET, replacing N+1 queries with one join, selecting only needed columns, refreshing statistics and batching big writes.
