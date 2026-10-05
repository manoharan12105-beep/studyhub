# Table Partitioning — Practice

### P1. Pick the method

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** RANGE, LIST, HASH

An `audit_log` table grows by 50 million rows a month; queries look at the last 7 days and data older than 13 months must be removed. Which partitioning fits best?

- A) LIST on `user_id`
- B) RANGE on `logged_at` by month
- C) HASH on `audit_id` with 16 partitions
- D) No partitioning, just a B-tree on `logged_at`

<details>
<summary>Answer</summary>

**Answer:** B)

**Explanation:** Queries filter on recent time ranges (pruning) and retention is by age (drop a month at a time). Hash spreads every month across all partitions, so neither benefit applies. A B-tree alone helps reads but leaves retention as a huge `DELETE`.

</details>

### P2. Fix the table definition

**Difficulty:** Easy · **Type:** Query · **Concepts:** primary key with partition key

This fails. Correct it, create a partition for Q1 2026, insert one row and show which partition holds it.

```sql
-- Illustrative
CREATE TABLE invoices (
    invoice_id bigint PRIMARY KEY,
    issued_on  date NOT NULL,
    amount     numeric NOT NULL
) PARTITION BY RANGE (issued_on);
```

**Expected output:**

```text
    partition    | invoice_id
-----------------+------------
 invoices_2026q1 |          1
(1 row)
```

<details>
<summary>Solution</summary>

```sql
CREATE TABLE invoices (
    invoice_id bigint  NOT NULL,
    issued_on  date    NOT NULL,
    amount     numeric NOT NULL,
    PRIMARY KEY (invoice_id, issued_on)
) PARTITION BY RANGE (issued_on);

CREATE TABLE invoices_2026q1 PARTITION OF invoices
    FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');

INSERT INTO invoices VALUES (1, '2026-02-14', 500);

SELECT tableoid::regclass AS partition, invoice_id FROM invoices;
```

**Explanation:** Uniqueness is enforced per partition, so the primary key must include `issued_on`.

</details>

### P3. Will it prune?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** partition pruning

`events` is partitioned by `RANGE (created_at)` (a `date`) into monthly partitions for 2026. For each `WHERE` clause, say whether the planner can prune partitions.

1. `created_at = '2026-03-15'`
2. `created_at >= '2026-03-01' AND created_at < '2026-04-01'`
3. `date_trunc('month', created_at) = '2026-03-01'`
4. `user_id = 42`
5. `created_at BETWEEN '2026-03-01' AND '2026-03-31'`

<details>
<summary>Answer</summary>

**Answer:**

1. Yes — one partition (March).
2. Yes — one partition (March).
3. No — the key is inside a function.
4. No — `user_id` is not the partition key.
5. Yes — one partition (March).

**Explanation:** Pruning needs a comparison on the raw partition-key column. Clause 3 should be rewritten as clause 2.

</details>

### P4. Monthly partitions and a default

**Difficulty:** Medium · **Type:** Query · **Concepts:** RANGE partitions, DEFAULT partition, tableoid

Create `page_views (view_id int, viewed_on date NOT NULL)` partitioned by month for January and February 2026, plus a default partition. Insert views on `2026-01-05`, `2026-01-31`, `2026-02-01` and `2026-06-10` (ids 1–4), then count rows per partition.

**Expected output:**

```text
     partition      | rows
--------------------+------
 page_views_2026_01 |    2
 page_views_2026_02 |    1
 page_views_default |    1
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
CREATE TABLE page_views (view_id int, viewed_on date NOT NULL) PARTITION BY RANGE (viewed_on);
CREATE TABLE page_views_2026_01 PARTITION OF page_views FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE page_views_2026_02 PARTITION OF page_views FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE page_views_default PARTITION OF page_views DEFAULT;

INSERT INTO page_views VALUES (1, '2026-01-05'), (2, '2026-01-31'), (3, '2026-02-01'), (4, '2026-06-10');

SELECT tableoid::regclass AS partition, count(*) AS rows
FROM page_views
GROUP BY 1
ORDER BY 1;
```

**Explanation:** The upper bound is exclusive, so `2026-02-01` belongs to February, not January. June has no partition and lands in the default.

</details>

### P5. Rewrite for pruning

**Difficulty:** Medium · **Type:** Query · **Concepts:** pruning, sargable filters

**Schema and data:**

```sql
CREATE TABLE readings (id int, read_at date NOT NULL) PARTITION BY RANGE (read_at);
CREATE TABLE readings_2026_01 PARTITION OF readings FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE readings_2026_02 PARTITION OF readings FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE readings_2026_03 PARTITION OF readings FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
INSERT INTO readings SELECT g, DATE '2026-01-01' + g % 90 FROM generate_series(1, 900) AS g;
ANALYZE readings;
```

The report uses `WHERE extract(month FROM read_at) = 3 AND extract(year FROM read_at) = 2026`, which scans all partitions. Rewrite it so only March is scanned, and show the plan.

**Expected output:**

```text
                                      QUERY PLAN
--------------------------------------------------------------------------------------
 Aggregate
   ->  Seq Scan on readings_2026_03 readings
         Filter: ((read_at >= '2026-03-01'::date) AND (read_at < '2026-04-01'::date))
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
EXPLAIN (COSTS OFF)
SELECT count(*) FROM readings
WHERE read_at >= DATE '2026-03-01' AND read_at < DATE '2026-04-01';
```

**Explanation:** A half-open range on the raw key column is something the planner can compare with partition bounds; an expression over the key is not.

</details>

### P6. Retention without DELETE

**Difficulty:** Medium · **Type:** Query · **Concepts:** DETACH PARTITION, DROP

**Schema and data:**

```sql
CREATE TABLE logs (id int, logged_on date NOT NULL) PARTITION BY RANGE (logged_on);
CREATE TABLE logs_2026_01 PARTITION OF logs FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE logs_2026_02 PARTITION OF logs FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
INSERT INTO logs SELECT g, DATE '2026-01-01' + g % 59 FROM generate_series(1, 590) AS g;
```

Remove all January data without `DELETE`, then show how many rows remain and which partitions the table still has.

**Expected output:**

```text
 remaining |  partitions
-----------+--------------
       280 | logs_2026_02
(1 row)
```

<details>
<summary>Solution</summary>

```sql
ALTER TABLE logs DETACH PARTITION logs_2026_01;
DROP TABLE logs_2026_01;

SELECT (SELECT count(*) FROM logs) AS remaining,
       string_agg(inhrelid::regclass::text, ', ') AS partitions
FROM pg_inherits
WHERE inhparent = 'logs'::regclass;
```

**Explanation:** Days 0–30 after January 1 are January (31 of the 59 day values, 310 rows); the remaining 28 February days hold 280 rows. Detach + drop removes January's file in two catalog operations.

</details>

### P7. List partitions by region

**Difficulty:** Medium · **Type:** Query · **Concepts:** LIST partitioning, row movement

Create `stores (store_id int, city text NOT NULL)` list-partitioned into `stores_south` (`'Chennai'`, `'Kochi'`) and `stores_north` (`'Delhi'`, `'Jaipur'`). Insert stores 1 Chennai, 2 Delhi, 3 Kochi. Then store 3 relocates to Jaipur. Show each store with its partition.

**Expected output:**

```text
 store_id |  city   |  partition
----------+---------+--------------
        1 | Chennai | stores_south
        2 | Delhi   | stores_north
        3 | Jaipur  | stores_north
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
CREATE TABLE stores (store_id int, city text NOT NULL) PARTITION BY LIST (city);
CREATE TABLE stores_south PARTITION OF stores FOR VALUES IN ('Chennai', 'Kochi');
CREATE TABLE stores_north PARTITION OF stores FOR VALUES IN ('Delhi', 'Jaipur');

INSERT INTO stores VALUES (1, 'Chennai'), (2, 'Delhi'), (3, 'Kochi');
UPDATE stores SET city = 'Jaipur' WHERE store_id = 3;

SELECT store_id, city, tableoid::regclass AS partition FROM stores ORDER BY store_id;
```

**Explanation:** Changing the key moves the row from `stores_south` to `stores_north` within the same `UPDATE`.

</details>

### P8. Should we partition?

**Difficulty:** Hard · **Type:** Design · **Concepts:** when partitioning helps

A `customers` table has 2 million rows (3 GB). Most queries look up a customer by `email` or `customer_id`. A teammate proposes hash-partitioning it by `customer_id` into 64 partitions "for performance". What do you advise?

<details>
<summary>Answer</summary>

Do not partition. 3 GB fits comfortably in memory and B-tree lookups on `customer_id` and `email` are already a few page reads. With 64 hash partitions:

- lookups by `email` would probe 64 indexes (no global index), and a unique constraint on `email` would become impossible because it does not include the partition key;
- planning gets slower and maintenance gets more complex;
- there is no retention benefit, since hash partitions do not separate old data.

Use indexes (unique on `email`), and revisit partitioning only if the table becomes very large with a dominant range key and a retention policy.

</details>
