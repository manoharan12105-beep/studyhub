# Index Fundamentals (B-tree)

**Module:** Indexing · **Interview priority:** Core

## What Is It?

An **index** is a separate data structure that lets PostgreSQL find rows by the values of some columns without reading the whole table — like the index at the back of a book. The default and most common kind is the **B-tree**, which keeps keys **sorted** and supports equality, ranges, sorting and prefix searches.

```sql
-- Illustrative
CREATE INDEX events_user_idx ON events (user_id);
SELECT * FROM events WHERE user_id = 42;   -- can now find 40 rows among 200,000 without a full scan
```

An index is purely a performance structure: it never changes query results (except `UNIQUE` indexes, which also enforce a constraint).

## Why It Matters

- The difference between a 2 ms and a 2 s query is usually an index — or a query written so that an index cannot be used.
- Interview questions: how a B-tree works, clustered vs non-clustered, composite index column order, why an index is not used, the cost of too many indexes, index-only scans.
- Every index slows down writes and takes space, so choosing indexes is a trade-off, not "index every column".

## Core Concept

### B-tree structure

```text
                       [ 2500 | 5000 ]                 root page
                      /       |       \
        [ 800 | 1600 ]   [ 3300 | 4100 ]   [ … ]       internal pages
        /     |    \
   [1 2 … 799] [800 … 1599] [1600 … 2499]  …           leaf pages: sorted keys + row pointers (ctid),
        ⇄            ⇄              ⇄                  linked left ⇄ right for range scans
```

- Lookup: descend from the root to one leaf — **O(log n)** page reads (3–4 levels even for hundreds of millions of rows).
- Range scan: find the first key, then walk the leaf chain in order.
- Leaf entries store the key and the row's physical address (`ctid`); the row itself is in the table (**heap**).

### Scan types PostgreSQL chooses between

| Scan | How it works | Chosen when |
|------|--------------|-------------|
| **Seq Scan** | Read every page of the table | Many rows match, the table is small, or no usable index |
| **Index Scan** | Walk the index, fetch each matching row from the heap | Few matching rows, or rows needed in index order (`ORDER BY … LIMIT`) |
| **Bitmap Index Scan + Bitmap Heap Scan** | Collect matching row addresses into a bitmap, then read heap pages in physical order (each page once) | A moderate number of rows scattered over the table, or combining several indexes (`AND`/`OR`) |
| **Index Only Scan** | Answer from the index alone, visiting the heap only for pages not marked all-visible | All needed columns are in the index and the table is well vacuumed |

The **planner** picks by estimated cost, using table statistics (`ANALYZE`). The key quantity is **selectivity** — the fraction of rows that match. An index pays off when few rows match; for a large fraction, reading the table sequentially is cheaper than many random heap fetches.

### Composite (multi-column) indexes

An index on `(a, b)` is sorted by `a`, then by `b` within equal `a` values — like a phone book sorted by surname, then first name.

| Query | Use of `(a, b)` |
|-------|-----------------|
| `WHERE a = ?` | Efficient (leading column) |
| `WHERE a = ? AND b = ?` / `AND b > ?` | Efficient — both columns bound |
| `WHERE a = ? ORDER BY b` | Efficient — rows come out sorted by `b` |
| `WHERE b = ?` | Classically **not usable** (leading column missing). PostgreSQL 18 can use a **skip scan** when `a` has few distinct values — one index descent per value of `a` |
| `WHERE a > ? AND b = ?` | Uses `a` for the range; `b` is checked within it |

Column order rule of thumb: columns compared with **equality first**, then the **range or sort** column. Among equality columns, put the ones queried on their own first.

### When an index cannot be used

- A function or expression on the column: `WHERE lower(email) = …`, `WHERE created_at::date = …`, `WHERE amount + 0 = …`. Fix: rewrite the condition, or create an **expression index** on exactly that expression.
- Type mismatch forcing a cast of the column: `WHERE user_id::text = '42'`.
- Leading wildcard: `LIKE '%gmail.com'` (a B-tree supports `LIKE 'abc%'` only with the `C` collation or a `text_pattern_ops` index; `pg_trgm` helps for `%…%`).
- Low selectivity: the planner correctly prefers a sequential scan.
- Missing or stale statistics: run `ANALYZE`.

### Indexes PostgreSQL creates for you — and the ones it does not

- `PRIMARY KEY` and `UNIQUE` constraints create unique B-tree indexes.
- **Foreign keys do not**: index the referencing column yourself (`orders.customer_id`), or joins and parent deletes/updates scan the child table.

### The cost of an index

- Every `INSERT` adds entries to every index; `UPDATE`s that change an indexed column (or are not HOT) add entries too; dead entries need vacuuming.
- Space: indexes can be as large as the table.
- More indexes → more planning choices, more WAL, slower bulk loads.
- Check usage with `pg_stat_user_indexes.idx_scan` and drop indexes that are never used (except those enforcing constraints).

### Clustered vs non-clustered

PostgreSQL tables are **heaps**: rows are not stored in index order, and every index is "non-clustered" (secondary). `CLUSTER table USING index` physically reorders the table **once**, but later writes do not maintain that order. (In SQL Server and MySQL InnoDB, the clustered index *is* the table, ordered by the primary key.)

### Creating indexes on live tables

`CREATE INDEX` blocks writes to the table (`SHARE` lock) for its duration. `CREATE INDEX CONCURRENTLY` builds without blocking writes (slower, cannot run in a transaction block; if it fails it leaves an `INVALID` index to drop). `REINDEX CONCURRENTLY` rebuilds a bloated index online.

## Syntax

```sql
-- Illustrative
CREATE [UNIQUE] INDEX [CONCURRENTLY] name ON table [USING btree] (col [ASC|DESC] [NULLS FIRST|LAST], …);
CREATE INDEX name ON table ((lower(email)));          -- expression index
DROP INDEX [CONCURRENTLY] name;
REINDEX INDEX CONCURRENTLY name;
SELECT indexrelname, idx_scan FROM pg_stat_user_indexes;
```

## Examples

The examples use a 200,000-row table. `parallel_workers = 0` keeps the plans free of parallel nodes so they are easier to read.

```sql
CREATE TABLE events (
    event_id   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    int     NOT NULL,
    kind       text    NOT NULL,
    event_date date    NOT NULL,
    amount     numeric(10,2) NOT NULL
);
INSERT INTO events (user_id, kind, event_date, amount)
SELECT g % 5000,
       (ARRAY['view', 'click', 'buy'])[g % 3 + 1],
       DATE '2026-01-01' + g / 1440,
       g % 1000
FROM generate_series(1, 200000) AS g;
ALTER TABLE events SET (parallel_workers = 0);
VACUUM ANALYZE events;

SELECT count(*) AS rows, pg_size_pretty(pg_relation_size('events')) AS table_size FROM events;
```

**Output:**

```text
  rows  | table_size
--------+------------
 200000 | 11 MB
(1 row)
```

Each `user_id` occurs 40 times, spread evenly over the table; each date has 1,440 rows stored next to each other; each `kind` is a third of the rows.

### Without an index: sequential scan

```sql
EXPLAIN (COSTS OFF)
SELECT * FROM events WHERE user_id = 42;
```

**Output:**

```text
        QUERY PLAN
--------------------------
 Seq Scan on events
   Filter: (user_id = 42)
(2 rows)
```

### With an index

```sql
CREATE INDEX events_user_idx ON events (user_id);

EXPLAIN (COSTS OFF)
SELECT * FROM events WHERE user_id = 42;
```

**Output:**

```text
                 QUERY PLAN
--------------------------------------------
 Bitmap Heap Scan on events
   Recheck Cond: (user_id = 42)
   ->  Bitmap Index Scan on events_user_idx
         Index Cond: (user_id = 42)
(4 rows)
```

The 40 matching rows are on 40 different pages, so PostgreSQL collects their addresses in a bitmap first and then reads each page once in physical order.

### Primary-key lookup: index scan

```sql
EXPLAIN (COSTS OFF)
SELECT * FROM events WHERE event_id = 12345;
```

**Output:**

```text
               QUERY PLAN
----------------------------------------
 Index Scan using events_pkey on events
   Index Cond: (event_id = 12345)
(2 rows)
```

### Index-only scan

When the query needs only indexed columns, the heap can be skipped:

```sql
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT user_id FROM events WHERE user_id = 42;
```

**Output:**

```text
                                 QUERY PLAN
-----------------------------------------------------------------------------
 Index Only Scan using events_user_idx on events (actual rows=40.00 loops=1)
   Index Cond: (user_id = 42)
   Heap Fetches: 0
   Index Searches: 1
(4 rows)
```

`Heap Fetches: 0`: thanks to `VACUUM`, every page is marked all-visible in the visibility map, so no row had to be checked in the table. (`Index Searches` is reported from PostgreSQL 18.)

### Low selectivity: the index is ignored, correctly

```sql
EXPLAIN (COSTS OFF)
SELECT * FROM events WHERE user_id > 100;
```

**Output:**

```text
        QUERY PLAN
---------------------------
 Seq Scan on events
   Filter: (user_id > 100)
(2 rows)
```

About 98% of the rows match. Reading the table sequentially beats 196,000 index lookups, so the planner ignores `events_user_idx`. Where the crossover lies depends on how the matching rows are spread over pages; with rows scattered evenly, PostgreSQL may still prefer a bitmap scan for a fraction as large as a third. Indexes on low-cardinality columns (status, gender, booleans) rarely help on their own — a partial index is usually better ([Advanced Indexes](../advanced-indexes/content.md)).

### ORDER BY … LIMIT uses index order

```sql
EXPLAIN (COSTS OFF)
SELECT * FROM events ORDER BY event_id DESC LIMIT 5;
```

**Output:**

```text
                      QUERY PLAN
-------------------------------------------------------
 Limit
   ->  Index Scan Backward using events_pkey on events
(2 rows)
```

No sort: the primary-key index is read backwards and the scan stops after five rows.

### Composite index: equality first, then range or sort

```sql
CREATE INDEX events_user_date_idx ON events (user_id, event_date);

EXPLAIN (COSTS OFF)
SELECT * FROM events WHERE user_id = 42 ORDER BY event_date DESC LIMIT 3;
```

**Output:**

```text
                           QUERY PLAN
----------------------------------------------------------------
 Limit
   ->  Index Scan Backward using events_user_date_idx on events
         Index Cond: (user_id = 42)
(3 rows)
```

Within `user_id = 42`, entries are already sorted by `event_date`, so the latest three come straight from the index.

### Leading column missing

```sql
EXPLAIN (COSTS OFF)
SELECT * FROM events WHERE event_date = '2026-03-01';
```

**Output:**

```text
                 QUERY PLAN
---------------------------------------------
 Seq Scan on events
   Filter: (event_date = '2026-03-01'::date)
(2 rows)
```

`(user_id, event_date)` is sorted by `user_id` first, with 5,000 distinct values; using it for `event_date` alone would mean 5,000 separate descents, so the planner scans the table. With a leading column of only three values, PostgreSQL 18's skip scan makes the index usable:

```sql
CREATE INDEX events_kind_date_idx ON events (kind, event_date);

EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT * FROM events WHERE event_date = '2026-03-01';
```

**Output:**

```text
                                  QUERY PLAN
-------------------------------------------------------------------------------
 Bitmap Heap Scan on events (actual rows=1440.00 loops=1)
   Recheck Cond: (event_date = '2026-03-01'::date)
   Heap Blocks: exact=12
   ->  Bitmap Index Scan on events_kind_date_idx (actual rows=1440.00 loops=1)
         Index Cond: (event_date = '2026-03-01'::date)
         Index Searches: 7
(6 rows)
```

`Index Searches` shows several descents — one per `kind` value, plus a few to find the boundaries. Before PostgreSQL 18 this index could not be used for the query.

### A function on the column

```sql
EXPLAIN (COSTS OFF)
SELECT * FROM events WHERE user_id::text = '42';
```

**Output:**

```text
                QUERY PLAN
------------------------------------------
 Seq Scan on events
   Filter: ((user_id)::text = '42'::text)
(2 rows)
```

The cast hides `user_id` from the index. Comparing like with like (`WHERE user_id = 42`) restores the index plan. When the expression is genuinely needed, index the expression:

```sql
CREATE TABLE app_users (user_id int PRIMARY KEY, email text NOT NULL);
INSERT INTO app_users SELECT g, 'User' || g || '@Mail.com' FROM generate_series(1, 100000) AS g;
ALTER TABLE app_users SET (parallel_workers = 0);
CREATE INDEX app_users_email_lower_idx ON app_users ((lower(email)));
ANALYZE app_users;

EXPLAIN (COSTS OFF)
SELECT user_id FROM app_users WHERE lower(email) = 'user42@mail.com';
```

**Output:**

```text
                       QUERY PLAN
---------------------------------------------------------
 Index Scan using app_users_email_lower_idx on app_users
   Index Cond: (lower(email) = 'user42@mail.com'::text)
(2 rows)
```

The query must use exactly the indexed expression (`lower(email)`).

### What indexes cost

```sql
SELECT indexrelname AS index, pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE relname = 'events'
ORDER BY indexrelname;
```

**Output:**

```text
        index         |  size
----------------------+---------
 events_kind_date_idx | 1464 kB
 events_pkey          | 4408 kB
 events_user_date_idx | 4408 kB
 events_user_idx      | 1400 kB
(4 rows)
```

Four indexes together (about 11.4 MB) are as large as the 11 MB table itself, and every insert into `events` now writes to all four.

## Comparison

### Scan types

| | Seq Scan | Index Scan | Bitmap Heap Scan | Index Only Scan |
|---|---|---|---|---|
| Reads | All table pages | Index + heap page per row | Index, then heap pages in order | Index (+ heap for not-all-visible pages) |
| Best for | Large fractions, small tables | Very few rows, ordered output | Moderate fractions, combining indexes | Queries covered by the index |
| Output order | Physical | Index order | Physical | Index order |

## Common Mistakes

- Indexing every column "just in case" (write cost, space, no benefit for low-selectivity columns).
- Forgetting to index foreign-key columns.
- Wrong column order in composite indexes (range column first, equality column second).
- Wrapping indexed columns in functions or casts in `WHERE`.
- Expecting an index to be used for a query that returns most of the table.
- Building indexes on busy production tables without `CONCURRENTLY`.
- Never checking `pg_stat_user_indexes` for unused indexes.

## Revision

- B-tree: sorted, balanced, O(log n) lookups, leaf chain for ranges; supports `=`, `<`, `>`, `BETWEEN`, `IN`, `ORDER BY`, prefix `LIKE` (with suitable collation/opclass).
- Planner picks Seq / Index / Bitmap / Index Only scans by cost; selectivity decides.
- Composite `(a, b)`: equality columns first, then range/sort; leading column needed (PostgreSQL 18 skip scan helps when it has few values).
- Index blockers: functions/casts on the column, leading wildcards, low selectivity, stale stats.
- PK/UNIQUE create indexes; foreign keys do not.
- Indexes cost writes and space; `CREATE INDEX CONCURRENTLY` on live tables; drop unused ones.

## Quick Revision

A B-tree index keeps keys sorted for O(log n) lookups, range scans and ordered reads, and the planner uses it only when few rows match. Put equality columns first in composite indexes, keep indexed columns bare in WHERE, index foreign keys, and remember every index slows writes.
