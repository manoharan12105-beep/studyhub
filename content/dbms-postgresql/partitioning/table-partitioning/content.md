# Table Partitioning

**Module:** Partitioning · **Interview priority:** Frequently asked

## What Is It?

**Partitioning** splits one large logical table into smaller physical tables called **partitions**, each holding the rows for a range or list of values of the **partition key**. Queries and DML address the parent table; PostgreSQL routes rows to the right partition and skips partitions that cannot contain matching rows (**partition pruning**).

```text
measurements (partitioned by RANGE (taken_at))
├── measurements_2026_01   taken_at in [2026-01-01, 2026-02-01)
├── measurements_2026_02   taken_at in [2026-02-01, 2026-03-01)
├── measurements_2026_03   taken_at in [2026-03-01, 2026-04-01)
└── measurements_default   everything else
```

> [!NOTE]
> Table partitioning is unrelated to `PARTITION BY` inside a window function's `OVER (…)`, which only groups rows for a calculation ([Window Functions](../../window-functions/window-functions-basics/content.md)).

## Why It Matters

- Very large tables (events, logs, measurements, orders over many years) become easier to maintain and often faster to query when split by time.
- Data retention becomes cheap: dropping a month is `DROP TABLE` on one partition instead of deleting millions of rows (which creates bloat).
- Interviewers ask: range vs list vs hash partitioning, partition pruning, the primary-key restriction, and when partitioning does **not** help.

## Core Concept

### Partitioning methods

| Method | Partition holds | Example key | Typical use |
|--------|-----------------|-------------|-------------|
| `RANGE` | A contiguous range `[from, to)` | `created_at` | Time series, retention by month |
| `LIST` | An explicit list of values | `region`, `country` | Data separated by category or tenant group |
| `HASH` | Rows whose key hashes to `remainder` (mod `modulus`) | `customer_id` | Spreading load evenly when no natural range exists |

Partitions can themselves be partitioned (**sub-partitioning**), e.g. by month, then by region.

### Declarative partitioning (PostgreSQL 10+)

- The parent (`PARTITION BY …`) stores no rows; partitions are created with `CREATE TABLE … PARTITION OF parent FOR VALUES …`.
- A row whose key fits no partition is rejected unless a `DEFAULT` partition exists.
- Updating the key so a row belongs elsewhere moves it to the other partition automatically.
- `ALTER TABLE parent DETACH PARTITION p [CONCURRENTLY]` turns a partition into a standalone table; `ATTACH PARTITION` adds an existing table (its rows are validated).

### Rules and limitations

- **Primary keys and unique constraints must include all partition-key columns**, because uniqueness is enforced per partition. A `PRIMARY KEY (id)` alone is impossible on a table partitioned by date; use `(id, created_at)`.
- Indexes created on the parent are created on every partition (each partition has its own index).
- Foreign keys from and to partitioned tables are supported (PostgreSQL 12+).
- There is no global index across partitions.

### Partition pruning

- **Plan-time pruning**: a constant condition on the key (`WHERE created_at >= '2026-02-10'`) removes non-matching partitions from the plan.
- **Run-time pruning**: with parameters (prepared statements) or values known only during execution, the executor skips partitions (`Subplans Removed: n` in `EXPLAIN ANALYZE`).
- Pruning works only when the query filters on the **partition key** in a usable form — functions on the key or filters on other columns scan every partition.

### When partitioning helps — and when it does not

| Helps | Does not help (or hurts) |
|-------|--------------------------|
| Queries usually filter on the partition key (recent data, one month) | Queries mostly filter on other columns → every partition scanned |
| Retention: drop/detach old partitions instantly | Small tables (an index is enough) |
| Maintenance per partition (vacuum, reindex, move old partitions to cheaper storage) | Thousands of tiny partitions (planning overhead, many files) |
| Bulk loads into a fresh partition | Point lookups by a key not included in the partition key (no global unique index) |

Rule of thumb: consider partitioning when a table is large (hundreds of GB, or more than RAM) **and** there is a natural key that most queries and the retention policy use.

## Syntax

```sql
-- Illustrative
CREATE TABLE t (…) PARTITION BY RANGE (col) | LIST (col) | HASH (col);
CREATE TABLE t_p1 PARTITION OF t FOR VALUES FROM (a) TO (b);
CREATE TABLE t_p2 PARTITION OF t FOR VALUES IN ('x', 'y');
CREATE TABLE t_p3 PARTITION OF t FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE t_default PARTITION OF t DEFAULT;
ALTER TABLE t DETACH PARTITION t_p1 [CONCURRENTLY];
ALTER TABLE t ATTACH PARTITION t_new FOR VALUES FROM (b) TO (c);
```

## Examples

### Creating a range-partitioned table

```sql
CREATE TABLE measurements (
    id        bigint  NOT NULL,
    sensor_id int     NOT NULL,
    taken_at  date    NOT NULL,
    value     numeric NOT NULL,
    PRIMARY KEY (id)
) PARTITION BY RANGE (taken_at);
```

**Output:**

```text
ERROR:  unique constraint on partitioned table must include all partitioning columns
DETAIL:  PRIMARY KEY constraint on table "measurements" lacks column "taken_at" which is part of the partition key.
```

The primary key must include the partition key:

```sql
CREATE TABLE measurements (
    id        bigint  NOT NULL,
    sensor_id int     NOT NULL,
    taken_at  date    NOT NULL,
    value     numeric NOT NULL,
    PRIMARY KEY (id, taken_at)
) PARTITION BY RANGE (taken_at);

CREATE TABLE measurements_2026_01 PARTITION OF measurements FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE measurements_2026_02 PARTITION OF measurements FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE measurements_2026_03 PARTITION OF measurements FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

INSERT INTO measurements
SELECT g, g % 10, DATE '2026-01-01' + g % 90, g
FROM generate_series(1, 9000) AS g;

SELECT tableoid::regclass AS partition, count(*) AS rows
FROM measurements
GROUP BY 1
ORDER BY 1;
```

**Output:**

```text
      partition       | rows
----------------------+------
 measurements_2026_01 | 3100
 measurements_2026_02 | 2800
 measurements_2026_03 | 3100
(3 rows)
```

`tableoid` reveals which physical partition each row lives in.

### Rows outside every partition

```sql
INSERT INTO measurements VALUES (99999, 1, '2026-05-10', 1);
```

**Output:**

```text
ERROR:  no partition of relation "measurements" found for row
DETAIL:  Partition key of the failing row contains (taken_at) = (2026-05-10).
```

```sql
CREATE TABLE measurements_default PARTITION OF measurements DEFAULT;
INSERT INTO measurements VALUES (99999, 1, '2026-05-10', 1);
SELECT tableoid::regclass AS partition FROM measurements WHERE id = 99999;
```

**Output:**

```text
      partition
----------------------
 measurements_default
(1 row)
```

A default partition catches stray rows, but it has a cost: creating a new partition later requires scanning the default partition to check that none of its rows belong in the new one.

### Partition pruning

```sql
ANALYZE measurements;
EXPLAIN (COSTS OFF)
SELECT count(*) FROM measurements
WHERE taken_at >= '2026-02-10' AND taken_at < '2026-02-20';
```

**Output:**

```text
                                       QUERY PLAN
----------------------------------------------------------------------------------------
 Aggregate
   ->  Seq Scan on measurements_2026_02 measurements
         Filter: ((taken_at >= '2026-02-10'::date) AND (taken_at < '2026-02-20'::date))
(3 rows)
```

Only the February partition is scanned. A filter on another column scans them all:

```sql
EXPLAIN (COSTS OFF)
SELECT count(*) FROM measurements WHERE sensor_id = 3;
```

**Output:**

```text
                         QUERY PLAN
-------------------------------------------------------------
 Aggregate
   ->  Append
         ->  Seq Scan on measurements_2026_01 measurements_1
               Filter: (sensor_id = 3)
         ->  Seq Scan on measurements_2026_02 measurements_2
               Filter: (sensor_id = 3)
         ->  Seq Scan on measurements_2026_03 measurements_3
               Filter: (sensor_id = 3)
         ->  Seq Scan on measurements_default measurements_4
               Filter: (sensor_id = 3)
(10 rows)
```

And so does a function on the key:

```sql
EXPLAIN (COSTS OFF)
SELECT count(*) FROM measurements WHERE extract(month FROM taken_at) = 2;
```

**Output:**

```text
                             QUERY PLAN
---------------------------------------------------------------------
 Aggregate
   ->  Append
         ->  Seq Scan on measurements_2026_01 measurements_1
               Filter: (EXTRACT(month FROM taken_at) = '2'::numeric)
         ->  Seq Scan on measurements_2026_02 measurements_2
               Filter: (EXTRACT(month FROM taken_at) = '2'::numeric)
         ->  Seq Scan on measurements_2026_03 measurements_3
               Filter: (EXTRACT(month FROM taken_at) = '2'::numeric)
         ->  Seq Scan on measurements_default measurements_4
               Filter: (EXTRACT(month FROM taken_at) = '2'::numeric)
(10 rows)
```

### Indexes cascade to partitions

```sql
CREATE INDEX measurements_sensor_idx ON measurements (sensor_id);
SELECT c.relname AS partition, i.relname AS index
FROM pg_inherits h
JOIN pg_class c ON c.oid = h.inhrelid
JOIN pg_index x ON x.indrelid = c.oid
JOIN pg_class i ON i.oid = x.indexrelid
WHERE h.inhparent = 'measurements'::regclass
ORDER BY c.relname, i.relname;
```

**Output:**

```text
      partition       |               index
----------------------+------------------------------------
 measurements_2026_01 | measurements_2026_01_pkey
 measurements_2026_01 | measurements_2026_01_sensor_id_idx
 measurements_2026_02 | measurements_2026_02_pkey
 measurements_2026_02 | measurements_2026_02_sensor_id_idx
 measurements_2026_03 | measurements_2026_03_pkey
 measurements_2026_03 | measurements_2026_03_sensor_id_idx
 measurements_default | measurements_default_pkey
 measurements_default | measurements_default_sensor_id_idx
(8 rows)
```

### Retention: detach and drop instead of DELETE

```sql
ALTER TABLE measurements DETACH PARTITION measurements_2026_01;
SELECT count(*) AS rows_still_in_measurements FROM measurements;
DROP TABLE measurements_2026_01;
```

**Output:**

```text
 rows_still_in_measurements
----------------------------
                       5901
(1 row)
```

Removing a month took two catalog operations instead of deleting 3,100 rows (with WAL, dead tuples and vacuum work). On a busy table, `DETACH PARTITION … CONCURRENTLY` (PostgreSQL 14+) avoids blocking queries on the parent.

### List and hash partitioning

```sql
CREATE TABLE sales (id int, region text NOT NULL, amount numeric) PARTITION BY LIST (region);
CREATE TABLE sales_south PARTITION OF sales FOR VALUES IN ('Chennai', 'Bengaluru', 'Kochi');
CREATE TABLE sales_west  PARTITION OF sales FOR VALUES IN ('Mumbai', 'Pune');
INSERT INTO sales VALUES (1, 'Chennai', 100), (2, 'Pune', 250), (3, 'Kochi', 75);

CREATE TABLE sessions (session_id int, data text) PARTITION BY HASH (session_id);
CREATE TABLE sessions_p0 PARTITION OF sessions FOR VALUES WITH (MODULUS 2, REMAINDER 0);
CREATE TABLE sessions_p1 PARTITION OF sessions FOR VALUES WITH (MODULUS 2, REMAINDER 1);
INSERT INTO sessions SELECT g, 'x' FROM generate_series(1, 1000) AS g;

SELECT tableoid::regclass AS partition, count(*) FROM sales GROUP BY 1
UNION ALL
SELECT tableoid::regclass, count(*) FROM sessions GROUP BY 1
ORDER BY 1;
```

**Output:**

```text
  partition  | count
-------------+-------
 sales_south |     2
 sales_west  |     1
 sessions_p0 |   535
 sessions_p1 |   465
(4 rows)
```

Hash partitioning spreads rows roughly evenly; it supports pruning only for equality on the key.

### Moving a row between partitions

```sql
UPDATE sales SET region = 'Mumbai' WHERE id = 1;
SELECT id, region, tableoid::regclass AS partition FROM sales ORDER BY id;
```

**Output:**

```text
 id | region |  partition
----+--------+-------------
  1 | Mumbai | sales_west
  2 | Pune   | sales_west
  3 | Kochi  | sales_south
(3 rows)
```

## Comparison

### Partitioning methods

| | RANGE | LIST | HASH |
|---|---|---|---|
| Key type | Ordered (dates, numbers) | Discrete values | Anything hashable |
| Pruning | Ranges and equality | Equality / `IN` | Equality only |
| Retention by dropping partitions | Natural | By category | Not meaningful |
| Even distribution | Depends on data | Depends on data | Yes |

### Partitioning vs indexing vs sharding

| | Index | Partitioning | Sharding |
|---|---|---|---|
| Splits | — (extra structure) | One table into many on one server | Data across many servers |
| Main benefit | Fast lookups | Pruning, cheap retention, per-partition maintenance | Horizontal scale of storage and writes |
| PostgreSQL support | Core | Core (declarative) | Extensions/tools (Citus) or application-level |

## Common Mistakes

- Expecting partitioning to speed up queries that do not filter on the partition key.
- Trying to keep `PRIMARY KEY (id)` on a time-partitioned table.
- Forgetting to create future partitions (inserts fail) — automate with a scheduled job or `pg_partman`.
- Creating thousands of tiny partitions.
- Wrapping the partition key in a function in `WHERE`, disabling pruning.
- Using `DELETE` for retention instead of detaching/dropping partitions.
- Confusing table partitioning with window-function `PARTITION BY`.

## Revision

- Partitioned table = parent + partitions by `RANGE`, `LIST` or `HASH` on a key; rows routed automatically; optional `DEFAULT` partition.
- Unique/primary keys must include the partition key; parent indexes cascade to partitions; no global indexes.
- Pruning (plan time and run time) needs a usable filter on the key.
- Retention: `DETACH` (`CONCURRENTLY`) + `DROP` instead of `DELETE`.
- Helps large tables with a dominant key; hurts when queries ignore the key or partitions are tiny and numerous.

## Quick Revision

Partitioning splits a big table into RANGE, LIST or HASH partitions on a key. Queries filtering on that key touch only matching partitions, and old data is dropped a partition at a time — but primary keys must include the key, and queries that ignore it scan everything.
