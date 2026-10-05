# EXPLAIN and Query Plans

**Module:** Query Optimization · **Interview priority:** Core

## What Is It?

SQL says **what** to return; the **planner** (optimizer) decides **how**. The chosen strategy is the **query plan**: a tree of operations (scans, joins, sorts, aggregates). `EXPLAIN` shows the plan with the planner's estimates; `EXPLAIN ANALYZE` also **runs** the query and shows what actually happened.

```text
HashAggregate                       ← 3. group the joined rows by city
  ->  Hash Join                     ← 2. join events to users using a hash table
        ->  Seq Scan on events      ← 1a. read all events
        ->  Hash
              ->  Seq Scan on users ← 1b. read users and build the hash table
```

Plans are read **from the innermost (most indented) nodes outward**: leaves produce rows, each parent consumes its children's rows.

## Why It Matters

- Every performance investigation starts with `EXPLAIN (ANALYZE)`: it shows where the time goes and whether the planner misjudged the data.
- Interviewers ask: "How do you find why a query is slow?", "What is the difference between EXPLAIN and EXPLAIN ANALYZE?", "Nested loop vs hash join vs merge join?", "What does cost mean?".

## Core Concept

### EXPLAIN options

| Option | Effect |
|--------|--------|
| (none) | Plan with estimated costs and rows; the query is **not** executed |
| `ANALYZE` | **Executes** the query; adds actual time, rows, loops |
| `BUFFERS` | Pages found in cache (`shared hit`) vs read from disk/OS (`read`); on by default with `ANALYZE` from PostgreSQL 18 |
| `COSTS OFF` | Hide cost estimates (for readable plans) |
| `TIMING OFF` | Skip per-node timing (less overhead) |
| `VERBOSE` | Output columns, schema-qualified names |
| `SETTINGS` | Non-default planner settings in effect |
| `FORMAT JSON` | Machine-readable output for tools |
| `SERIALIZE` | Include the cost of converting results for the client (PostgreSQL 17+) |

> [!CAUTION]
> `EXPLAIN ANALYZE` really executes the statement. For `INSERT`/`UPDATE`/`DELETE`, wrap it: `BEGIN; EXPLAIN ANALYZE UPDATE …; ROLLBACK;`.

### Reading a node

```text
Seq Scan on e  (cost=0.00..3471.00 rows=200000 width=4) (actual time=0.010..12.3 rows=200000.00 loops=1)
                     │       │        │          │                     │          │                 │
            startup cost  total cost  est. rows  bytes/row      first..last row ms  rows per loop   executions
```

- **Cost** is in arbitrary planner units (by default reading one page sequentially costs 1.0, a random page 4.0, processing a row 0.01). Only comparisons between plans matter; costs are not milliseconds.
- **Startup cost**: work before the first row (e.g. building a hash table, sorting). **Total cost**: work to return all rows.
- With `ANALYZE`: **actual time** is per loop; multiply rows and time by **loops** for nodes executed repeatedly (inner side of a nested loop).
- The most important check: **estimated rows vs actual rows**. A large mismatch means the planner had wrong information and may have chosen a bad plan.

### Common node types

| Node | Meaning |
|------|---------|
| Seq Scan, Index Scan, Index Only Scan, Bitmap Heap/Index Scan | Ways to read a table ([Index Fundamentals](../../indexing/index-fundamentals/content.md)) |
| **Nested Loop** | For each outer row, look up matching inner rows (ideally via an index) |
| **Hash Join** | Build a hash table on the smaller input, probe it with the other |
| **Merge Join** | Walk two inputs already sorted on the join key |
| HashAggregate / GroupAggregate | `GROUP BY` via a hash table / via sorted input |
| Sort | Sort in memory (`quicksort`), keep only the top N (`top-N heapsort`), or spill to disk (`external merge`) |
| Limit | Stop after n rows |
| Materialize / Memoize | Cache an inner input / cache inner results per key (PostgreSQL 14+) |
| Gather / Gather Merge | Collect rows from parallel workers |
| Append / Merge Append | Combine inputs (partitions, `UNION ALL`) |
| SubPlan / InitPlan | Correlated / one-time subqueries ([Correlated Subqueries](../../subqueries/correlated-subqueries/content.md)) |
| CTE Scan | Read a materialized CTE |

### Join algorithms

| | Nested Loop | Hash Join | Merge Join |
|---|---|---|---|
| How | For each outer row, scan/lookup inner | Hash the smaller side, probe with the other | Merge two sorted inputs |
| Best when | Outer side is small and inner has an index | Large unsorted inputs, equality join | Both inputs already sorted (indexes) or need sorting anyway |
| Join conditions | Any (including `<`, `LIKE`) | Equality only | Equality (sortable) |
| Memory | Little | Hash table (`work_mem` × `hash_mem_multiplier`; batches to disk if larger) | Little |
| Startup | Immediate | Must build the hash first | Must sort first unless presorted |

### Where estimates come from

`ANALYZE` (also run by autovacuum) samples each table and stores statistics in `pg_stats`: fraction of `NULL`s, number of distinct values, most common values and their frequencies, a histogram of the rest, and physical **correlation** with row order. The planner multiplies selectivities of conditions assuming they are **independent** — the usual source of misestimates when columns are correlated (city and state, model and brand). `CREATE STATISTICS` teaches the planner about such dependencies.

## Syntax

```sql
-- Illustrative
EXPLAIN SELECT …;
EXPLAIN (ANALYZE, BUFFERS) SELECT …;
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF) SELECT …;
EXPLAIN (FORMAT JSON) SELECT …;
BEGIN; EXPLAIN ANALYZE DELETE FROM … ; ROLLBACK;
CREATE STATISTICS name (dependencies, ndistinct, mcv) ON col1, col2 FROM t;
```

## Examples

Two related tables: 5,000 users and 200,000 events. Parallel query is disabled on them to keep the plans short.

```sql
CREATE TABLE users (
    user_id int  PRIMARY KEY,
    city    text NOT NULL,
    state   text NOT NULL
);
INSERT INTO users
SELECT g,
       (ARRAY['Chennai', 'Coimbatore', 'Mumbai', 'Pune', 'Kochi'])[g % 5 + 1],
       (ARRAY['Tamil Nadu', 'Tamil Nadu', 'Maharashtra', 'Maharashtra', 'Kerala'])[g % 5 + 1]
FROM generate_series(0, 4999) AS g;

CREATE TABLE events (
    event_id   bigint PRIMARY KEY,
    user_id    int  NOT NULL REFERENCES users,
    kind       text NOT NULL,
    event_date date NOT NULL,
    amount     numeric(10,2) NOT NULL
);
INSERT INTO events
SELECT g, g % 5000, (ARRAY['view', 'click', 'buy'])[g % 3 + 1], DATE '2026-01-01' + g / 1440, g % 1000
FROM generate_series(1, 200000) AS g;
CREATE INDEX events_user_idx ON events (user_id);

ALTER TABLE users  SET (parallel_workers = 0);
ALTER TABLE events SET (parallel_workers = 0);
VACUUM ANALYZE users;
VACUUM ANALYZE events;
```

### Plain EXPLAIN: estimates only

```sql
EXPLAIN SELECT * FROM events WHERE user_id = 42;
```

**Output (varies):**

```text
                                  QUERY PLAN
-------------------------------------------------------------------------------
 Bitmap Heap Scan on events  (cost=4.60..145.32 rows=40 width=24)
   Recheck Cond: (user_id = 42)
   ->  Bitmap Index Scan on events_user_idx  (cost=0.00..4.59 rows=40 width=0)
         Index Cond: (user_id = 42)
(4 rows)
```

The planner expects 40 rows (200,000 rows / 5,000 distinct user ids). Startup cost of the bitmap index scan is near zero; total cost includes visiting up to 40 heap pages. `width` (average row size in bytes) and costs can differ slightly from run to run, because `ANALYZE` builds statistics from a random sample of large tables.

### EXPLAIN ANALYZE: estimates vs reality

```sql
EXPLAIN (ANALYZE, BUFFERS OFF, TIMING OFF, SUMMARY OFF)
SELECT u.city, count(*)
FROM events e
JOIN users u ON u.user_id = e.user_id
GROUP BY u.city;
```

**Output:**

```text
                                                 QUERY PLAN
------------------------------------------------------------------------------------------------------------
 HashAggregate  (cost=5141.94..5141.99 rows=5 width=15) (actual rows=5.00 loops=1)
   Group Key: u.city
   Batches: 1  Memory Usage: 32kB
   ->  Hash Join  (cost=145.50..4141.94 rows=200000 width=7) (actual rows=200000.00 loops=1)
         Hash Cond: (e.user_id = u.user_id)
         ->  Seq Scan on events e  (cost=0.00..3471.00 rows=200000 width=4) (actual rows=200000.00 loops=1)
         ->  Hash  (cost=83.00..83.00 rows=5000 width=11) (actual rows=5000.00 loops=1)
               Buckets: 8192  Batches: 1  Memory Usage: 283kB
               ->  Seq Scan on users u  (cost=0.00..83.00 rows=5000 width=11) (actual rows=5000.00 loops=1)
(9 rows)
```

Read bottom-up: both tables are scanned; a hash table is built from `users` (5,000 rows, 283 kB, one batch — it fit in memory); all 200,000 events probe it; `HashAggregate` groups the results into 5 rows. Every estimate matches the actual row count, so the planner understood the data. (Times were turned off for reproducible output; with timing, each node shows `actual time=first..last` in milliseconds.)

### The three join algorithms

Nested loop — a single user, looked up by index:

```sql
EXPLAIN (COSTS OFF)
SELECT e.* FROM events e JOIN users u ON u.user_id = e.user_id WHERE u.user_id = 42;
```

**Output:**

```text
                    QUERY PLAN
---------------------------------------------------
 Nested Loop
   ->  Index Only Scan using users_pkey on users u
         Index Cond: (user_id = 42)
   ->  Bitmap Heap Scan on events e
         Recheck Cond: (user_id = 42)
         ->  Bitmap Index Scan on events_user_idx
               Index Cond: (user_id = 42)
(7 rows)
```

Hash join — a few events joined to all users:

```sql
EXPLAIN (COSTS OFF)
SELECT * FROM events e JOIN users u ON u.user_id = e.user_id WHERE e.event_id < 100;
```

**Output:**

```text
                   QUERY PLAN
------------------------------------------------
 Hash Join
   Hash Cond: (e.user_id = u.user_id)
   ->  Index Scan using events_pkey on events e
         Index Cond: (event_id < 100)
   ->  Hash
         ->  Seq Scan on users u
(6 rows)
```

Merge join — the result must be sorted by the join key, and both sides can be read in that order from indexes:

```sql
EXPLAIN (COSTS OFF)
SELECT * FROM events e JOIN users u ON u.user_id = e.user_id ORDER BY e.user_id;
```

**Output:**

```text
                     QUERY PLAN
----------------------------------------------------
 Merge Join
   Merge Cond: (e.user_id = u.user_id)
   ->  Index Scan using events_user_idx on events e
   ->  Index Scan using users_pkey on users u
(4 rows)
```

### Sorts: in memory, top-N, on disk

```sql
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT * FROM events ORDER BY amount LIMIT 10;
```

**Output:**

```text
                           QUERY PLAN
----------------------------------------------------------------
 Limit (actual rows=10.00 loops=1)
   ->  Sort (actual rows=10.00 loops=1)
         Sort Key: amount
         Sort Method: top-N heapsort  Memory: 25kB
         ->  Seq Scan on events (actual rows=200000.00 loops=1)
(5 rows)
```

With `LIMIT`, only the best 10 rows are kept while scanning (`top-N heapsort`, 25 kB). A full sort with little memory spills to disk:

```sql
SET work_mem = '64kB';
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT * FROM events ORDER BY amount, event_id;
```

**Output:**

```text
                        QUERY PLAN
----------------------------------------------------------
 Sort (actual rows=200000.00 loops=1)
   Sort Key: amount, event_id
   Sort Method: external merge  Disk: 7440kB
   ->  Seq Scan on events (actual rows=200000.00 loops=1)
(4 rows)
```

`external merge  Disk: …` means the sort did not fit in `work_mem` and used temporary files — a common hidden cost in reports. An index on the sort key, or more `work_mem` for that query, avoids it.

### Rows Removed by Filter

```sql
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT * FROM events WHERE kind = 'buy' AND amount < 10;
```

**Output:**

```text
                          QUERY PLAN
---------------------------------------------------------------
 Seq Scan on events (actual rows=667.00 loops=1)
   Filter: ((amount < '10'::numeric) AND (kind = 'buy'::text))
   Rows Removed by Filter: 199333
(3 rows)
```

199,333 rows were read and thrown away to return 667 — a sign that an index (here, on `amount`, or a partial/composite index) could help if the query is frequent.

### A misestimate from correlated columns

`state` depends on `city`, but the planner assumes independent conditions:

```sql
EXPLAIN (ANALYZE, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT * FROM users WHERE city = 'Chennai' AND state = 'Tamil Nadu';
```

**Output:**

```text
                                       QUERY PLAN
----------------------------------------------------------------------------------------
 Seq Scan on users  (cost=0.00..108.00 rows=400 width=21) (actual rows=1000.00 loops=1)
   Filter: ((city = 'Chennai'::text) AND (state = 'Tamil Nadu'::text))
   Rows Removed by Filter: 4000
(3 rows)
```

Estimate: 5,000 × 1/5 (Chennai) × 2/5 (Tamil Nadu) = 400 rows; actual: 1,000. On a join, a 2.5× underestimate can tip the planner into a nested loop that runs far more often than expected. Extended statistics capture the dependency:

```sql
CREATE STATISTICS users_city_state (dependencies) ON city, state FROM users;
ANALYZE users;

EXPLAIN (ANALYZE, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT * FROM users WHERE city = 'Chennai' AND state = 'Tamil Nadu';
```

**Output:**

```text
                                       QUERY PLAN
-----------------------------------------------------------------------------------------
 Seq Scan on users  (cost=0.00..108.00 rows=1000 width=21) (actual rows=1000.00 loops=1)
   Filter: ((city = 'Chennai'::text) AND (state = 'Tamil Nadu'::text))
   Rows Removed by Filter: 4000
(3 rows)
```

### What the planner knows: pg_stats

```sql
SELECT attname, n_distinct, most_common_vals, most_common_freqs, correlation
FROM pg_stats
WHERE tablename = 'users' AND attname IN ('city', 'state')
ORDER BY attname;
```

**Output:**

```text
 attname | n_distinct |            most_common_vals            |   most_common_freqs   | correlation
---------+------------+----------------------------------------+-----------------------+-------------
 city    |          5 | {Chennai,Coimbatore,Kochi,Mumbai,Pune} | {0.2,0.2,0.2,0.2,0.2} |   0.2006718
 state   |          3 | {Maharashtra,"Tamil Nadu",Kerala}      | {0.4,0.4,0.2}         |  0.35913575
(2 rows)
```

Positive `n_distinct` is an absolute count; negative values are a fraction of the row count. `correlation` near ±1 means the column's order matches the physical row order (good for range scans and BRIN).

### EXPLAIN ANALYZE on a DELETE, safely

```sql
BEGIN;
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
DELETE FROM events WHERE event_date < '2026-01-02';
ROLLBACK;
SELECT count(*) AS still_there FROM events WHERE event_date < '2026-01-02';
```

**Output:**

```text
                       QUERY PLAN
--------------------------------------------------------
 Delete on events (actual rows=0.00 loops=1)
   ->  Seq Scan on events (actual rows=1439.00 loops=1)
         Filter: (event_date < '2026-01-02'::date)
         Rows Removed by Filter: 198561
(4 rows)

 still_there
-------------
        1439
(1 row)
```

The `DELETE` really ran (1,439 rows) and was then rolled back.

## Comparison

### EXPLAIN vs EXPLAIN ANALYZE

| | `EXPLAIN` | `EXPLAIN ANALYZE` |
|---|---|---|
| Executes the query | No | Yes (side effects included) |
| Shows | Estimated cost, rows, width | + actual time, rows, loops, memory, disk, buffers |
| Use for | Plan shape, quick checks, queries too slow to run | Finding the real bottleneck, comparing estimates with reality |

## Common Mistakes

- Reading `cost` as milliseconds.
- Forgetting to multiply per-loop rows/time by `loops` on inner nodes.
- Running `EXPLAIN ANALYZE` on a `DELETE`/`UPDATE` outside a transaction that is rolled back.
- Testing plans on a tiny development table — the planner rightly chooses sequential scans there; plans on production-sized data differ.
- Ignoring estimated-vs-actual mismatches, which explain most "bad plan" problems.
- Forgetting `ANALYZE` after bulk loads (statistics are stale until autovacuum runs it).

## Revision

- `EXPLAIN` = plan with estimates; `EXPLAIN ANALYZE` = executes and adds actuals (BUFFERS default from 18).
- Read inner-to-outer; cost = arbitrary units (startup..total); actual time per loop × loops.
- Compare estimated vs actual rows first.
- Joins: nested loop (small outer + indexed inner), hash join (big equality joins), merge join (sorted inputs).
- Sort methods: quicksort (memory), top-N heapsort (`LIMIT`), external merge (disk → raise `work_mem` or add an index).
- Statistics from `ANALYZE` in `pg_stats`; correlated columns → `CREATE STATISTICS`.

## Quick Revision

EXPLAIN shows the planner's estimated tree; EXPLAIN ANALYZE runs it and shows actual rows, loops and memory. Read from the inside out, compare estimates with actuals, recognise the scans, joins and sorts, and fix misestimates with ANALYZE or extended statistics.
