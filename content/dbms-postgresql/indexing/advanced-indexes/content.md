# Advanced Indexes: Partial, Covering, GIN, GiST, BRIN, Hash

**Module:** Indexing · **Interview priority:** Frequently asked

## What Is It?

Beyond the plain B-tree on a column, PostgreSQL offers index **variants** and **access methods** for specific query shapes:

| Feature | One-line purpose |
|---------|------------------|
| **Partial index** | Index only the rows matching a `WHERE` condition |
| **Covering index** (`INCLUDE`) | Store extra columns in the index so more queries become index-only |
| **Expression index** | Index the result of an expression (`lower(email)`) |
| **Unique / partial unique index** | Enforce uniqueness, possibly among a subset of rows |
| **GIN** | "Contains" searches: `jsonb`, arrays, full-text search, trigram `LIKE '%…%'` |
| **GiST / SP-GiST** | Ranges, geometry, nearest-neighbour, exclusion constraints |
| **BRIN** | Tiny summary index for huge tables whose rows are physically ordered (time series) |
| **Hash** | Equality-only lookups |

## Why It Matters

- The right specialised index turns impossible queries (substring search, JSON containment, overlapping ranges on millions of rows) into fast ones.
- Partial and covering indexes are the most practical tools for making hot queries cheap without bloating every write.
- Interviewers ask: "How do you speed up `LIKE '%text%'`?", "When would you use BRIN?", "What is a covering index?", "GIN vs GiST?".

## Core Concept

### Partial indexes

`CREATE INDEX … ON orders (created_at) WHERE status = 'PENDING'` indexes only pending orders.

- Much smaller and cheaper to maintain when the condition selects a small subset (queues, unprocessed rows, soft-deleted rows excluded with `WHERE deleted_at IS NULL`).
- Used only when the query's `WHERE` implies the index predicate (`status = 'PENDING'` written the same way).
- A **partial unique index** enforces uniqueness among some rows ([Schema Design Case Studies](../../database-design/schema-design-case-studies/content.md)).

### Covering indexes (INCLUDE)

`CREATE INDEX … ON events (user_id) INCLUDE (amount)` stores `amount` in the leaf entries without making it part of the key. Queries selecting only `user_id` and `amount` can run as **index-only scans**. Included columns cannot be used for searching or ordering, and they make the index larger.

### Ordering options

`(created_at DESC NULLS LAST)` matters for multi-column orders such as `ORDER BY a ASC, b DESC`. A single-column index can be read in either direction, so `DESC` alone rarely matters.

### Index access methods

| Method | Structure | Supports | Typical use |
|--------|-----------|----------|-------------|
| **B-tree** | Balanced sorted tree | `= < > BETWEEN IN`, sorting, prefix `LIKE`* | Default for almost everything |
| **Hash** | Hash table | `=` only | Equality on long values (smaller than B-tree); WAL-logged and crash-safe since PostgreSQL 10 |
| **GIN** (Generalized Inverted Index) | Map from each element/key to the rows containing it | `@>`, `?`, `&&`, `@@`, trigram `LIKE`/`ILIKE`/`%` | `jsonb`, arrays, full-text, `pg_trgm` |
| **GiST** (Generalized Search Tree) | Balanced tree of bounding "predicates" | Overlap `&&`, containment, distance `<->` (KNN) | Ranges, geometry/PostGIS, exclusion constraints, trigram |
| **SP-GiST** | Space-partitioned tree | Non-balanced partitions (quadtrees, radix trees) | IP addresses, points, text prefixes |
| **BRIN** (Block Range Index) | Min/max summary per range of pages (default 128 pages) | `= < >` on physically correlated data | Append-only time series, logs |

\* Prefix `LIKE 'abc%'` with a B-tree needs the `C` collation or an index with `text_pattern_ops`.

### GIN vs GiST for the same data

| | GIN | GiST |
|---|---|---|
| Lookups | Faster (exact) | Slower (lossy, rechecks) |
| Build and updates | Slower (mitigated by the `fastupdate` pending list) | Faster |
| Size | Larger | Smaller |
| Extra abilities | — | Nearest-neighbour ordering (`ORDER BY col <-> value`), exclusion constraints, ranges |

### BRIN in one picture

```text
pages 0–127:    event_date min 2026-01-01, max 2026-01-12
pages 128–255:  event_date min 2026-01-12, max 2026-01-24
…
WHERE event_date = '2026-03-01' → only ranges whose [min, max] include it are read
```

A BRIN index is thousands of times smaller than a B-tree, but it is **lossy**: it returns whole page ranges that must be rechecked, and it is useless if values are not correlated with physical row order (frequent updates or random inserts destroy the correlation).

### Full-text search

`to_tsvector('english', text)` reduces text to normalized **lexemes** (`'damaged'` → `'damag'`, stop words removed); `to_tsquery`/`plainto_tsquery`/`websearch_to_tsquery` build queries; `@@` matches; `ts_rank` orders results. A GIN index on the `tsvector` expression (or a stored generated `tsvector` column) makes it fast.

### Substring search: pg_trgm

`LIKE '%text%'` cannot use a B-tree. The `pg_trgm` extension splits strings into 3-character **trigrams**; a GIN (or GiST) index with `gin_trgm_ops` supports `LIKE`, `ILIKE`, regular expressions and similarity (`%`) — as long as the pattern contains at least one full trigram.

### Maintenance

- Indexes bloat like tables; `REINDEX INDEX CONCURRENTLY` rebuilds one online.
- `pg_stat_user_indexes` (`idx_scan`) shows usage; drop unused indexes.
- After bulk loads into BRIN-indexed tables, `brin_summarize_new_values()` (or autovacuum) summarises new ranges.

## Syntax

```sql
-- Illustrative
CREATE INDEX … ON t (col) WHERE condition;                      -- partial
CREATE INDEX … ON t (key_col) INCLUDE (extra_col);              -- covering
CREATE INDEX … ON t ((lower(email)));                           -- expression
CREATE INDEX … ON t USING gin (jsonb_col [jsonb_path_ops]);
CREATE INDEX … ON t USING gin (text_col gin_trgm_ops);          -- needs pg_trgm
CREATE INDEX … ON t USING gin (to_tsvector('english', body));
CREATE INDEX … ON t USING gist (range_col);
CREATE INDEX … ON t USING brin (created_at) [WITH (pages_per_range = 32)];
CREATE INDEX … ON t USING hash (col);
CREATE INDEX … ON t (col text_pattern_ops);                     -- LIKE 'prefix%'
```

## Examples

The examples use a 200,000-row table with a 1% `PENDING` status and free-text notes:

```sql
CREATE TABLE events (
    event_id   bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    int     NOT NULL,
    event_date date    NOT NULL,
    amount     numeric(10,2) NOT NULL,
    status     text    NOT NULL,
    note       text    NOT NULL
);
INSERT INTO events (user_id, event_date, amount, status, note)
SELECT g % 5000,
       DATE '2026-01-01' + g / 1440,
       g % 1000,
       CASE WHEN g % 100 = 0 THEN 'PENDING' ELSE 'DONE' END,
       (ARRAY['fast delivery', 'damaged box', 'great price', 'late refund', 'gift wrap'])[g % 5 + 1] || ' ' || g
FROM generate_series(1, 200000) AS g;
ALTER TABLE events SET (parallel_workers = 0);
VACUUM ANALYZE events;
SELECT status, count(*) FROM events GROUP BY status ORDER BY status;
```

**Output:**

```text
 status  | count
---------+--------
 DONE    | 198000
 PENDING |   2000
(2 rows)
```

### Partial index: index only what you search

```sql
CREATE INDEX events_pending_idx ON events (event_date) WHERE status = 'PENDING';
CREATE INDEX events_status_date_idx ON events (status, event_date);

SELECT pg_size_pretty(pg_relation_size('events_pending_idx'))     AS partial_index,
       pg_size_pretty(pg_relation_size('events_status_date_idx')) AS full_index;
```

**Output:**

```text
 partial_index | full_index
---------------+------------
 40 kB         | 1408 kB
(1 row)
```

```sql
DROP INDEX events_status_date_idx;
EXPLAIN (COSTS OFF)
SELECT event_id FROM events WHERE status = 'PENDING' AND event_date >= '2026-03-01';
```

**Output:**

```text
                    QUERY PLAN
--------------------------------------------------
 Index Scan using events_pending_idx on events
   Index Cond: (event_date >= '2026-03-01'::date)
(2 rows)
```

The condition `status = 'PENDING'` is implied by the index predicate, so the 40 kB partial index answers the query; the index on all rows would be 35 times larger and updated by every insert.

### Covering index: index-only scan

```sql
CREATE INDEX events_user_cov_idx ON events (user_id) INCLUDE (amount);
VACUUM events;

EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT user_id, amount FROM events WHERE user_id = 42;
```

**Output:**

```text
                                   QUERY PLAN
---------------------------------------------------------------------------------
 Index Only Scan using events_user_cov_idx on events (actual rows=40.00 loops=1)
   Index Cond: (user_id = 42)
   Heap Fetches: 0
   Index Searches: 1
(4 rows)
```

Without `INCLUDE (amount)`, each of the 40 rows would need a heap visit to fetch `amount`.

### BRIN vs B-tree for physically ordered data

```sql
CREATE INDEX events_date_brin  ON events USING brin (event_date);
CREATE INDEX events_date_btree ON events (event_date);
SELECT pg_size_pretty(pg_relation_size('events_date_brin'))  AS brin,
       pg_size_pretty(pg_relation_size('events_date_btree')) AS btree;
```

**Output:**

```text
 brin  |  btree
-------+---------
 24 kB | 1376 kB
(1 row)
```

```sql
DROP INDEX events_date_btree;
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT count(*) FROM events WHERE event_date = '2026-03-01';
```

**Output:**

```text
                                   QUERY PLAN
---------------------------------------------------------------------------------
 Aggregate (actual rows=1.00 loops=1)
   ->  Bitmap Heap Scan on events (actual rows=1440.00 loops=1)
         Recheck Cond: (event_date = '2026-03-01'::date)
         Rows Removed by Index Recheck: 12256
         Heap Blocks: lossy=128
         ->  Bitmap Index Scan on events_date_brin (actual rows=1280.00 loops=1)
               Index Cond: (event_date = '2026-03-01'::date)
               Index Searches: 1
(8 rows)
```

The BRIN index returned one 128-page range (`lossy=128`), and the recheck discarded the rows of other dates. Reading one 128-page range instead of the whole table, with an index 57 times smaller than the B-tree, is a good trade on very large append-only tables.

### Substring search with pg_trgm

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX events_note_trgm ON events USING gin (note gin_trgm_ops);

EXPLAIN (COSTS OFF)
SELECT count(*) FROM events WHERE note LIKE '%refund 1234%';
```

**Output:**

```text
                        QUERY PLAN
-----------------------------------------------------------
 Aggregate
   ->  Bitmap Heap Scan on events
         Recheck Cond: (note ~~ '%refund 1234%'::text)
         ->  Bitmap Index Scan on events_note_trgm
               Index Cond: (note ~~ '%refund 1234%'::text)
(5 rows)
```

```sql
SELECT count(*) AS matches FROM events WHERE note LIKE '%refund 1234%';
```

**Output:**

```text
 matches
---------
      22
(1 row)
```

A leading `%` normally forces a sequential scan; the trigram index finds candidate rows from the trigrams of `'refund 1234'`.

### Full-text search

```sql
CREATE INDEX events_note_fts ON events USING gin (to_tsvector('english', note));

EXPLAIN (COSTS OFF)
SELECT count(*) FROM events
WHERE to_tsvector('english', note) @@ to_tsquery('english', 'damaged & box');
```

**Output:**

```text
                                              QUERY PLAN
-------------------------------------------------------------------------------------------------------
 Aggregate
   ->  Bitmap Heap Scan on events
         Recheck Cond: (to_tsvector('english'::regconfig, note) @@ '''damag'' & ''box'''::tsquery)
         ->  Bitmap Index Scan on events_note_fts
               Index Cond: (to_tsvector('english'::regconfig, note) @@ '''damag'' & ''box'''::tsquery)
(5 rows)
```

```sql
SELECT to_tsvector('english', 'Damaged boxes were delivered late') AS document,
       to_tsquery('english', 'damaged & box')                        AS query;
```

**Output:**

```text
               document               |      query
--------------------------------------+-----------------
 'box':2 'damag':1 'deliv':4 'late':5 | 'damag' & 'box'
(1 row)
```

Stemming makes "boxes" match "box" and "Damaged" match "damaged"; stop words like "were" disappear.

### Hash index and prefix search

```sql
CREATE INDEX events_note_hash ON events USING hash (note);
EXPLAIN (COSTS OFF)
SELECT * FROM events WHERE note = 'gift wrap 4';
```

**Output:**

```text
                 QUERY PLAN
---------------------------------------------
 Index Scan using events_note_hash on events
   Index Cond: (note = 'gift wrap 4'::text)
(2 rows)
```

For `LIKE 'prefix%'`, a B-tree with `text_pattern_ops` turns the pattern into a range:

```sql
CREATE INDEX events_note_pattern ON events (note text_pattern_ops);
DROP INDEX events_note_trgm;
EXPLAIN (COSTS OFF)
SELECT * FROM events WHERE note LIKE 'gift wrap 4%';
```

**Output:**

```text
                                        QUERY PLAN
------------------------------------------------------------------------------------------
 Bitmap Heap Scan on events
   Filter: (note ~~ 'gift wrap 4%'::text)
   ->  Bitmap Index Scan on events_note_pattern
         Index Cond: ((note ~>=~ 'gift wrap 4'::text) AND (note ~<~ 'gift wrap 5'::text))
(4 rows)
```

`LIKE 'gift wrap 4%'` became the range `>= 'gift wrap 4' AND < 'gift wrap 5'`.

### GiST: range overlap

```sql
CREATE TABLE reservations (room int, stay daterange);
INSERT INTO reservations
SELECT g % 200, daterange(DATE '2026-01-01' + g % 300, DATE '2026-01-01' + g % 300 + 3)
FROM generate_series(1, 50000) AS g;
CREATE INDEX reservations_stay_gist ON reservations USING gist (stay);
ANALYZE reservations;

EXPLAIN (COSTS OFF)
SELECT count(*) FROM reservations WHERE stay && daterange('2026-03-01', '2026-03-02');
```

**Output:**

```text
                                QUERY PLAN
--------------------------------------------------------------------------
 Aggregate
   ->  Bitmap Heap Scan on reservations
         Recheck Cond: (stay && '[2026-03-01,2026-03-02)'::daterange)
         ->  Bitmap Index Scan on reservations_stay_gist
               Index Cond: (stay && '[2026-03-01,2026-03-02)'::daterange)
(5 rows)
```

GiST indexes ranges by their bounding intervals and answers overlap (`&&`) queries; the same kind of index backs exclusion constraints.

## Comparison

### Which index for which query

| Query | Index |
|-------|-------|
| `WHERE email = ?` | B-tree (or hash) |
| `WHERE lower(email) = ?` | Expression B-tree on `lower(email)` |
| `WHERE status = 'PENDING' AND …` (rare status) | Partial index `WHERE status = 'PENDING'` |
| `WHERE user_id = ?` returning one extra column | B-tree `(user_id) INCLUDE (col)` |
| `WHERE name LIKE 'abc%'` | B-tree with `text_pattern_ops` (or `C` collation) |
| `WHERE name LIKE '%abc%'` / `ILIKE` | GIN `gin_trgm_ops` |
| `WHERE doc @@ to_tsquery(…)` | GIN on `tsvector` |
| `WHERE attrs @> '{"k":"v"}'` / `tags && ARRAY[…]` | GIN |
| `WHERE period && ?` / no overlapping bookings | GiST (with `btree_gist` for mixed exclusion) |
| `WHERE created_at BETWEEN …` on a 1-billion-row append-only log | BRIN |

## Common Mistakes

- A partial index whose predicate the query does not imply (e.g. `status = $1` with a parameter — the planner cannot prove `$1 = 'PENDING'` for a generic plan).
- Using `INCLUDE` columns for filtering or sorting (they are only payload).
- BRIN on a table whose rows are not stored in value order.
- Expecting a B-tree to help `LIKE '%…%'`, or a trigram index to help patterns shorter than three characters.
- Full-text search with a different configuration in the query than in the index (`'english'` vs `'simple'`): the index is not used.
- Creating GIN indexes on write-heavy tables without considering their update cost.

## Revision

- Partial: index a subset (`WHERE …`), small and cheap; partial unique for "one active".
- Covering: `INCLUDE` payload columns → index-only scans.
- Expression: index exactly the expression the query uses.
- GIN: contains/inverted — `jsonb`, arrays, full-text, trigram. GiST: ranges, geometry, KNN, exclusion. BRIN: tiny, lossy, for physically ordered huge tables. Hash: equality only.
- `LIKE 'x%'` → `text_pattern_ops` B-tree; `LIKE '%x%'` → `pg_trgm` GIN.

## Quick Revision

Partial indexes cover only the rows you search, INCLUDE columns enable index-only scans, and expression indexes match computed predicates. Use GIN for jsonb, arrays, full-text and trigram search, GiST for ranges and exclusion, BRIN for huge append-only tables, and hash only for equality.
