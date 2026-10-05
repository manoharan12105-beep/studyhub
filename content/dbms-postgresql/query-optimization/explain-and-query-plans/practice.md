# EXPLAIN and Query Plans — Practice

### P1. Read the numbers

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** loops

An inner node shows `(actual rows=3.00 loops=2000)`. How many rows did it produce in total?

- A) 3
- B) 2000
- C) 6000
- D) 667

<details>
<summary>Answer</summary>

**Answer:** C) 6000

**Explanation:** `actual rows` (and `actual time`) are averages per execution; the node ran 2,000 times.

</details>

### P2. Which join algorithm?

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** join algorithms

For each case, which join algorithm would you expect?

1. Look up 10 orders by id, then their customers through the customers primary-key index.
2. Join 5 million order lines to 2 million orders on `order_id`, no useful order, enough memory.
3. Join two tables whose join keys are both indexed, with the result ordered by that key.
4. `JOIN price_bands b ON o.amount BETWEEN b.low AND b.high`.

<details>
<summary>Answer</summary>

1. Nested loop with an inner index scan — tiny outer side.
2. Hash join — large inputs, equality condition.
3. Merge join — both inputs can be read in key order and the output must be sorted.
4. Nested loop — the condition is not an equality, so hash and merge joins are impossible.

</details>

### P3. Find the waste

**Difficulty:** Medium · **Type:** Query · **Concepts:** Rows Removed by Filter, adding an index

**Schema and data:**

```sql
CREATE TABLE logs (id bigint PRIMARY KEY, level text NOT NULL, msg text NOT NULL);
INSERT INTO logs SELECT g, CASE WHEN g % 500 = 0 THEN 'ERROR' ELSE 'INFO' END, 'message ' || g
FROM generate_series(1, 100000) AS g;
ALTER TABLE logs SET (parallel_workers = 0);
VACUUM ANALYZE logs;
```

Show the plan (without costs or timing) for `SELECT id FROM logs WHERE level = 'ERROR'`, then add an index that serves it and show the new plan.

**Expected output:**

```text
                  QUERY PLAN
-----------------------------------------------
 Seq Scan on logs (actual rows=200.00 loops=1)
   Filter: (level = 'ERROR'::text)
   Rows Removed by Filter: 99800
(3 rows)

                                QUERY PLAN
---------------------------------------------------------------------------
 Index Only Scan using logs_error_idx on logs (actual rows=200.00 loops=1)
   Heap Fetches: 0
   Index Searches: 1
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT id FROM logs WHERE level = 'ERROR';

CREATE INDEX logs_error_idx ON logs (id) WHERE level = 'ERROR';

EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT id FROM logs WHERE level = 'ERROR';
```

**Explanation:** The sequential scan discarded 99,800 rows to return 200. A partial index containing only error rows (keyed on `id`, so the query is index-only) answers it from a tiny index.

</details>

### P4. Fix the estimate

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** stale statistics

**Schema and data:**

```sql
CREATE TABLE tickets (id int PRIMARY KEY, status text NOT NULL);
INSERT INTO tickets SELECT g, 'OPEN' FROM generate_series(1, 1000) AS g;
ANALYZE tickets;
INSERT INTO tickets SELECT g, 'CLOSED' FROM generate_series(1001, 50000) AS g;
```

```sql
EXPLAIN (ANALYZE, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT count(*) FROM tickets WHERE status = 'CLOSED';
```

**Output:**

```text
                                          QUERY PLAN
----------------------------------------------------------------------------------------------
 Aggregate  (cost=835.59..835.60 rows=1 width=8) (actual rows=1.00 loops=1)
   ->  Seq Scan on tickets  (cost=0.00..835.59 rows=1 width=0) (actual rows=49000.00 loops=1)
         Filter: (status = 'CLOSED'::text)
         Rows Removed by Filter: 1000
(4 rows)
```

Why is the estimate wrong, and how do you fix it?

<details>
<summary>Answer</summary>

Statistics were gathered when every ticket was `OPEN`; the planner believes `CLOSED` is (almost) absent and estimates very few rows, while 49,000 match. Bulk changes make statistics stale until autovacuum analyzes the table. Run `ANALYZE` after bulk loads:

```sql
ANALYZE tickets;
EXPLAIN (ANALYZE, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT count(*) FROM tickets WHERE status = 'CLOSED';
```

**Output (varies):**

```text
                                            QUERY PLAN
--------------------------------------------------------------------------------------------------
 Aggregate  (cost=1018.53..1018.54 rows=1 width=8) (actual rows=1.00 loops=1)
   ->  Seq Scan on tickets  (cost=0.00..896.00 rows=49013 width=0) (actual rows=49000.00 loops=1)
         Filter: (status = 'CLOSED'::text)
         Rows Removed by Filter: 1000
(4 rows)
```

The estimate now matches reality (exact figures can vary slightly because `ANALYZE` samples).

</details>

### P5. Explain the slow report

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** reading plans

A report's `EXPLAIN ANALYZE` contains:

```text
Nested Loop (actual time=0.05..48210.33 rows=120000 loops=1)
  ->  Seq Scan on orders o (cost=… rows=12 …) (actual … rows=120000 loops=1)
        Filter: (created_at >= '2026-01-01')
  ->  Index Scan using order_lines_order_idx on order_lines l (actual time=0.38..0.39 rows=1.00 loops=120000)
```

What went wrong, and what would you check first?

<details>
<summary>Answer</summary>

The planner estimated 12 orders but got 120,000 — a 10,000× underestimate. With 12 outer rows a nested loop with an index lookup is ideal; with 120,000 it performs 120,000 index probes (≈ 0.39 ms × 120,000 ≈ 47 s). With a correct estimate it would likely have chosen a hash join. Check statistics on `orders.created_at` (`last_analyze`, `pg_stats` histogram — often stale after a bulk load or for recently inserted dates beyond the histogram's range), run `ANALYZE orders`, and consider a higher statistics target for that column.

</details>
