# Advanced Indexes — Practice

### P1. Match the index to the query

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** index access methods

Which index best supports `WHERE tags && ARRAY['sale', 'new']` on a `text[]` column?

- A) B-tree on `tags`
- B) Hash on `tags`
- C) GIN on `tags`
- D) BRIN on `tags`

<details>
<summary>Answer</summary>

**Answer:** C)

**Explanation:** `&&` (overlap) on arrays is an element-membership search — exactly what an inverted GIN index provides. B-tree and hash compare whole arrays; BRIN summarises ranges of ordered values.

</details>

### P2. A queue index

**Difficulty:** Medium · **Type:** Query · **Concepts:** partial index

**Schema and data:**

```sql
CREATE TABLE tasks (task_id int PRIMARY KEY, done boolean NOT NULL, due date NOT NULL);
INSERT INTO tasks SELECT g, g % 50 <> 0, DATE '2026-01-01' + g % 90 FROM generate_series(1, 100000) AS g;
ALTER TABLE tasks SET (parallel_workers = 0);
VACUUM ANALYZE tasks;
```

Workers repeatedly run `SELECT task_id FROM tasks WHERE NOT done ORDER BY due LIMIT 10`. Create a small index that serves this query and show the plan.

**Expected output:**

```text
                     QUERY PLAN
----------------------------------------------------
 Limit
   ->  Index Scan using tasks_open_due_idx on tasks
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
CREATE INDEX tasks_open_due_idx ON tasks (due) WHERE NOT done;

EXPLAIN (COSTS OFF)
SELECT task_id FROM tasks WHERE NOT done ORDER BY due LIMIT 10;
```

**Explanation:** Only 2% of tasks are open, so the partial index holds 2,000 entries instead of 100,000; it is already ordered by `due`, so the `LIMIT 10` stops after ten entries with no sort.

</details>

### P3. Make it index-only

**Difficulty:** Medium · **Type:** Query · **Concepts:** covering index, INCLUDE

For the sample `order_items`, the report `SELECT order_id, quantity, unit_price FROM order_items WHERE product_id = 2` runs constantly. Create a covering index and show (with `enable_seqscan = off`, because the table is tiny) that the plan is an index-only scan.

**Expected output:**

```text
                          QUERY PLAN
--------------------------------------------------------------
 Index Only Scan using order_items_product_cov on order_items
   Index Cond: (product_id = 2)
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
CREATE INDEX order_items_product_cov ON order_items (product_id) INCLUDE (order_id, quantity, unit_price);
VACUUM order_items;
SET enable_seqscan = off;

EXPLAIN (COSTS OFF)
SELECT order_id, quantity, unit_price FROM order_items WHERE product_id = 2;
```

**Explanation:** `product_id` is the search key; the other three columns are payload. After `VACUUM`, pages are all-visible, so the heap is not touched.

</details>

### P4. Choose for a 2-billion-row log

**Difficulty:** Hard · **Type:** Design · **Concepts:** BRIN vs B-tree

An `access_log` table receives 30 million rows per day, inserted in time order, never updated, and is queried by time windows (`WHERE logged_at >= now() - interval '1 hour'`). The B-tree on `logged_at` is 60 GB. What would you use instead, and what are the risks?

<details>
<summary>Answer</summary>

A BRIN index on `logged_at` (perhaps with a smaller `pages_per_range` for finer granularity): rows arrive in time order, so each block range covers a narrow time window; the index is a few megabytes and nearly free to maintain. Time-window queries read only the matching ranges plus a recheck. Risks: correlation is lost if rows are updated (new versions land elsewhere) or loaded out of order, and BRIN is poor for single-row lookups. Combine with partitioning by time ([Table Partitioning](../../partitioning/table-partitioning/content.md)) so old partitions can be dropped instead of deleted.

</details>

### P5. Why is the full-text index ignored?

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** expression matching

**Schema and data:**

```sql
CREATE TABLE articles (id int PRIMARY KEY, body text NOT NULL);
INSERT INTO articles
SELECT g, CASE WHEN g % 1000 = 0 THEN 'database tuning tips number ' || g
                 ELSE 'general news item ' || g END
FROM generate_series(1, 50000) AS g;
CREATE INDEX articles_fts ON articles USING gin (to_tsvector('english', body));
ANALYZE articles;
ALTER TABLE articles SET (parallel_workers = 0);
```

```sql
EXPLAIN (COSTS OFF)
SELECT count(*) FROM articles WHERE to_tsvector(body) @@ to_tsquery('tuning');
```

**Output:**

```text
                            QUERY PLAN
-------------------------------------------------------------------
 Aggregate
   ->  Seq Scan on articles
         Filter: (to_tsvector(body) @@ to_tsquery('tuning'::text))
(3 rows)
```

<details>
<summary>Answer</summary>

Only 50 of 50,000 articles mention tuning, yet the table is scanned. The index is on `to_tsvector('english', body)`, but the query uses the one-argument `to_tsvector(body)`, which depends on the `default_text_search_config` setting — a different expression, so the index does not match. Use the same configuration explicitly:

```sql
EXPLAIN (COSTS OFF)
SELECT count(*) FROM articles WHERE to_tsvector('english', body) @@ to_tsquery('english', 'tuning');
```

**Output:**

```text
                                         QUERY PLAN
--------------------------------------------------------------------------------------------
 Aggregate
   ->  Bitmap Heap Scan on articles
         Recheck Cond: (to_tsvector('english'::regconfig, body) @@ '''tune'''::tsquery)
         ->  Bitmap Index Scan on articles_fts
               Index Cond: (to_tsvector('english'::regconfig, body) @@ '''tune'''::tsquery)
(5 rows)
```

</details>
