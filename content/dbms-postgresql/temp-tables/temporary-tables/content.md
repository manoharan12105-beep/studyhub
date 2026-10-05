# Temporary Tables

**Module:** Temporary Tables · **Interview priority:** Awareness

## What Is It?

A **temporary table** is a table that exists only for the current **session** (connection) — or only for the current transaction — and is visible only to that session. It is dropped automatically when the session ends.

```sql
-- Illustrative
CREATE TEMP TABLE import_staging (sku text, qty int);
-- load, clean and use it with several statements …
-- gone when the connection closes
```

## Why It Matters

- Multi-step processing (imports, reports, data fixes) often needs an intermediate result that is reused by several statements, indexed or analyzed — more than a CTE (one statement) can offer.
- Temporary tables have behaviours that surprise people: they shadow permanent tables of the same name, they are not analyzed by autovacuum, they are not crash-safe, and they interact badly with connection pools.

## Core Concept

### Properties

| Property | Temporary table |
|----------|-----------------|
| Visible to | Only the creating session |
| Lifetime | Until session end (default), or transaction end with `ON COMMIT DROP` |
| Schema | A per-session schema `pg_temp_N`, searched **first** for table names |
| WAL logging | Not written to the WAL → faster writes, not replicated, lost on crash (it disappears with the session anyway) |
| Memory | Cached in session-local `temp_buffers` (default 8 MB), not shared buffers |
| Autovacuum / autoanalyze | **Not** processed — run `ANALYZE` yourself after filling it |
| Indexes, constraints | Supported (indexes on temp tables are temporary too) |
| Foreign keys | A temp table can reference only other temp tables |

### ON COMMIT behaviour

| Clause | At the end of each transaction |
|--------|-------------------------------|
| `ON COMMIT PRESERVE ROWS` (default) | Keep rows |
| `ON COMMIT DELETE ROWS` | Empty the table (structure stays) |
| `ON COMMIT DROP` | Drop the table (only within a transaction block) |

### Name shadowing

Because `pg_temp` comes first in the search path, `CREATE TEMP TABLE customers (…)` makes every unqualified `customers` in that session refer to the temp table, hiding `public.customers`. Use distinct names (or qualify `public.customers`).

### Temp table vs CTE vs unlogged table vs materialized view

| | Temp table | CTE | Unlogged table | Materialized view |
|---|---|---|---|---|
| Scope | One session | One statement | All sessions | All sessions |
| Survives | Until session end | Statement end | Until dropped (emptied after a crash) | Until dropped |
| Indexes / `ANALYZE` | Yes (manual `ANALYZE`) | No | Yes | Yes |
| WAL | No | — | No | Yes |
| Typical use | Multi-step session work | Readable single query | Fast shared scratch/cache data | Shared precomputed results |

### Connection pools

Application servers reuse database connections. A temp table created by one request stays in the pooled connection and can be seen (or collide) in the next request that gets the same connection; with PgBouncer in **transaction pooling** mode, consecutive statements may even run on different server connections, so session-level temp tables break. Prefer `ON COMMIT DROP` inside one transaction, or a CTE, in pooled applications.

### Costs

Each `CREATE TEMP TABLE` writes catalog entries (and their removal later). Creating thousands of temp tables per minute bloats the system catalogs; reuse one table per session (`ON COMMIT DELETE ROWS`) or use CTEs/arrays for small data.

## Syntax

```sql
-- Illustrative
CREATE TEMP[ORARY] TABLE name (columns …) [ON COMMIT {PRESERVE ROWS | DELETE ROWS | DROP}];
CREATE TEMP TABLE name AS query;
CREATE UNLOGGED TABLE name (…);
DISCARD TEMP;          -- drop all temp tables of the session
```

## Examples

Each example below runs in a single session.

### Create, fill, analyze, use

```sql
CREATE TEMP TABLE big_spenders AS
SELECT o.customer_id, sum(oi.quantity * oi.unit_price) AS spent
FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
WHERE o.status <> 'CANCELLED'
GROUP BY o.customer_id
HAVING sum(oi.quantity * oi.unit_price) > 5000;
ANALYZE big_spenders;

SELECT c.name, b.spent
FROM big_spenders b JOIN customers c ON c.customer_id = b.customer_id
ORDER BY b.spent DESC;
```

**Output:**

```text
  name  |  spent
--------+----------
 Anil   | 70000.00
 Bhavna | 18950.00
(2 rows)
```

### It lives in the session's temporary schema

```sql
CREATE TEMP TABLE scratch (x int);
SELECT n.nspname LIKE 'pg_temp_%' AS in_temp_schema, c.relpersistence
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname = 'scratch';
```

**Output:**

```text
 in_temp_schema | relpersistence
----------------+----------------
 t              | t
(1 row)
```

`relpersistence`: `t` = temporary, `u` = unlogged, `p` = permanent.

### Only the creating session sees it

Run with two `psql` sessions on PostgreSQL 18:

```text
Session A                                         Session B
CREATE TEMP TABLE cart (item text);
INSERT INTO cart VALUES ('book');
                                                  SELECT * FROM cart;
                                                  ERROR:  relation "cart" does not exist
                                                  CREATE TEMP TABLE cart (item text);   -- its own, separate table
                                                  SELECT count(*) FROM cart;   → 0
SELECT * FROM cart;   → book
```

### Shadowing a permanent table

```sql
CREATE TEMP TABLE customers (note text);
SELECT count(*) AS temp_rows FROM customers;
SELECT count(*) AS real_rows FROM public.customers;
DROP TABLE customers;                      -- drops the TEMP table, the first match
SELECT count(*) AS visible_again FROM customers;
```

**Output:**

```text
 temp_rows
-----------
         0
(1 row)

 real_rows
-----------
         6
(1 row)

 visible_again
---------------
             6
(1 row)
```

### ON COMMIT DROP and DELETE ROWS

```sql
BEGIN;
CREATE TEMP TABLE batch_ids (id int) ON COMMIT DROP;
INSERT INTO batch_ids VALUES (101), (102);
SELECT count(*) AS inside_transaction FROM batch_ids;
COMMIT;
SELECT to_regclass('batch_ids') AS after_commit;
```

**Output:**

```text
 inside_transaction
--------------------
                  2
(1 row)

 after_commit
--------------
 NULL
(1 row)
```

```sql
CREATE TEMP TABLE work_queue (id int) ON COMMIT DELETE ROWS;
BEGIN;
INSERT INTO work_queue VALUES (1), (2), (3);
SELECT count(*) AS during FROM work_queue;
COMMIT;
SELECT count(*) AS after FROM work_queue;
```

**Output:**

```text
 during
--------
      3
(1 row)

 after
-------
     0
(1 row)
```

### Forgetting ANALYZE

Autovacuum never analyzes temp tables, so the planner guesses:

```sql
CREATE TEMP TABLE ids AS SELECT g AS id FROM generate_series(1, 20000) AS g;

EXPLAIN SELECT * FROM ids WHERE id = 5;
ANALYZE ids;
EXPLAIN SELECT * FROM ids WHERE id = 5;
```

**Output:**

```text
                      QUERY PLAN
-------------------------------------------------------
 Seq Scan on ids  (cost=0.00..536.00 rows=163 width=4)
   Filter: (id = 5)
(2 rows)

                     QUERY PLAN
-----------------------------------------------------
 Seq Scan on ids  (cost=0.00..378.00 rows=1 width=4)
   Filter: (id = 5)
(2 rows)
```

Before `ANALYZE` the planner expected over a hundred rows; afterwards it knows ids are unique and expects one. On joins, such misestimates lead to poor plans — always `ANALYZE` a temp table after filling it and before using it in complex queries.

### Unlogged table: shared but not crash-safe

```sql
CREATE UNLOGGED TABLE session_cache (key text PRIMARY KEY, value jsonb);
SELECT relpersistence FROM pg_class WHERE relname = 'session_cache';
```

**Output:**

```text
 relpersistence
----------------
 u
(1 row)
```

Unlike a temp table, an unlogged table is visible to all sessions and persists — but after a crash it is truncated, and it is not replicated to standbys.

## Comparison

### Choosing intermediate storage

| Need | Use |
|------|-----|
| Name a step inside one query | CTE |
| Reuse an intermediate result in several statements of one session; index or analyze it | Temp table |
| Same, but inside one transaction in a pooled app | Temp table `ON COMMIT DROP` |
| Fast, shared, re-creatable data (caches, staging for bulk loads) | Unlogged table |
| Precomputed shared results | Materialized view |

## Common Mistakes

- Giving a temp table the same name as a real table and then modifying "the table".
- Not running `ANALYZE` on a filled temp table.
- Session-level temp tables with transaction-mode connection pooling.
- Creating temp tables at high frequency (catalog bloat) where a CTE or array would do.
- Expecting a temp table to be visible to another connection, a background job or a replica.
- Using unlogged tables for data that must survive a crash.

## Revision

- Temp table: private to the session, dropped at session end (or `ON COMMIT DELETE ROWS` / `DROP`).
- Lives in `pg_temp_N`, searched first → shadows permanent tables of the same name.
- No WAL, local buffers, no autovacuum/autoanalyze — `ANALYZE` it yourself.
- Pools: prefer `ON COMMIT DROP` within a transaction, or CTEs.
- Unlogged tables: shared, fast, not crash-safe, not replicated.

## Quick Revision

A temporary table is private to one session and disappears at its end (or at commit with ON COMMIT DROP or DELETE ROWS). It shadows permanent tables of the same name, skips the WAL and is never auto-analyzed — ANALYZE it yourself and be careful with connection pools.
