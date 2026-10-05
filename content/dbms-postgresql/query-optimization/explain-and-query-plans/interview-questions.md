# EXPLAIN and Query Plans — Interview Questions

## Beginner

### Q1. What is a query plan?

<details>
<summary>Answer</summary>

The strategy the database chooses to execute a SQL statement: a tree of operations such as table scans (sequential or via an index), joins (nested loop, hash, merge), sorts and aggregates. SQL is declarative; the optimizer (planner) picks the plan with the lowest estimated cost based on table statistics. `EXPLAIN` displays it.

</details>

### Q2. What is the difference between EXPLAIN and EXPLAIN ANALYZE?

<details>
<summary>Answer</summary>

`EXPLAIN` shows the chosen plan with estimated costs and row counts without running the query. `EXPLAIN ANALYZE` executes the query and adds actual timing, actual row counts, loops, memory and disk usage (and buffer statistics, on by default from PostgreSQL 18). Because it executes, `EXPLAIN ANALYZE` on `INSERT`/`UPDATE`/`DELETE` changes data unless wrapped in `BEGIN … ROLLBACK`.

</details>

### Q3. What does "cost" mean in a plan?

<details>
<summary>Answer</summary>

An estimate in arbitrary planner units, not milliseconds — by default one sequential page read = 1.0, one random page read = 4.0, processing one row = 0.01. Each node shows `cost=startup..total`: the work before producing the first row and the work to produce all rows. Costs are only meaningful for comparing alternative plans for the same query.

</details>

## Intermediate

### Q4. How do you read an execution plan?

<details>
<summary>Answer</summary>

From the most indented nodes outward: leaves read tables, parents combine or transform their children's rows. For each node compare estimated rows with actual rows; look for the nodes with the largest actual time (remembering that time and rows are per loop — multiply by `loops`), large `Rows Removed by Filter`, sorts that spill to disk (`external merge`), hash joins with many batches, and nested loops executed thousands of times.

</details>

### Q5. Explain nested loop, hash join and merge join.

<details>
<summary>Answer</summary>

Nested loop: for each row of the outer input, find matching inner rows — fast when the outer side is small and the inner lookup uses an index; works with any join condition. Hash join: build a hash table on the smaller input, then probe it with each row of the larger — best for large unsorted equality joins; needs memory. Merge join: walk both inputs sorted on the join key in step — good when both are already sorted (indexes) or must be sorted anyway; equality joins only.

</details>

### Q6. Why might the planner choose a bad plan?

<details>
<summary>Answer</summary>

Mostly because its row estimates are wrong: stale statistics (no `ANALYZE` after bulk changes), correlated columns treated as independent, skewed data not captured by the sample (raise the column's statistics target), functions or expressions it cannot estimate, or parameters in generic prepared-statement plans. Other causes: cost settings that do not match the hardware (`random_page_cost` = 4 on SSDs), too little `work_mem`, or a missing index that forces an inferior plan.

</details>

### Q7. What does "Sort Method: external merge Disk: 7440kB" tell you?

<details>
<summary>Answer</summary>

The sort did not fit in `work_mem` and spilled to temporary files, which is much slower than an in-memory quicksort. Options: add an index that provides the order (and lets `LIMIT` stop early), reduce the rows or columns being sorted, or raise `work_mem` for that session/query (carefully — it is allowed per sort/hash node per query, not per connection).

</details>

## Advanced

### Q8. What are extended statistics and when do you need them?

<details>
<summary>Answer</summary>

Statistics on combinations of columns created with `CREATE STATISTICS name (dependencies | ndistinct | mcv) ON col1, col2 FROM t`. The planner normally assumes conditions on different columns are independent and multiplies their selectivities; for correlated columns (city and state, car brand and model) this underestimates matching rows. Functional-dependency, n-distinct and most-common-value statistics correct estimates for `WHERE` combinations and `GROUP BY` on several columns.

</details>

### Q9. A query is fast in development and slow in production with the same indexes. How do you investigate?

<details>
<summary>Answer</summary>

Run `EXPLAIN (ANALYZE, BUFFERS)` in production (or on a production-sized copy): plans depend on data volume and distribution, so development's tiny tables can produce completely different plans. Compare estimates with actuals, check statistics freshness (`last_analyze`), look for bloat (`n_dead_tup`), buffer reads vs hits (cold cache), lock waits (`pg_stat_activity`), differing settings (`EXPLAIN (SETTINGS)`), and parameter values that make a cached generic plan bad. `pg_stat_statements` and `auto_explain` capture slow plans as they happen.

</details>

### Q10. What is Memoize in a plan?

<details>
<summary>Answer</summary>

A node (PostgreSQL 14+) placed above the inner side of a nested loop that caches inner results by the join key. When the outer side contains many repeated keys, later lookups for the same key are served from the cache instead of rescanning the inner table or index. It appears with `Hits`/`Misses` counts in `EXPLAIN ANALYZE` and is controlled by `enable_memoize`.

</details>
