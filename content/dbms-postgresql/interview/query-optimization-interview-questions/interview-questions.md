# Query Optimization Interview Questions — Interview Questions

## Beginner

### Q1. What does the `BUFFERS` option add to `EXPLAIN ANALYZE`?

<details>
<summary>Answer</summary>

Per plan node, the number of 8 kB pages **hit** in shared buffers (cache), **read** from the OS or disk, and **dirtied/written**. It shows whether a query is slow because it reads too much data, and whether that data was cached. A query that touches 2 million pages to return 10 rows needs a better access path, even if it was fast this time because everything was cached.

</details>

### Q2. How do you read the cost numbers in a plan?

<details>
<summary>Answer</summary>

`cost=0.29..8.31 rows=1 width=40`: the first number is the startup cost (before the first row), the second the total cost to return all rows. The units are arbitrary (based on `seq_page_cost = 1`). `rows` is the estimated output row count and `width` the average row size in bytes. A parent's cost includes its children's. Costs only compare plans; they are not milliseconds. For real time use `EXPLAIN ANALYZE`.

</details>

### Q3. Why can `SELECT *` be slow?

<details>
<summary>Answer</summary>

- It transfers and de-TOASTs every column, including large text and `jsonb`.
- It prevents index-only scans.
- It breaks when columns change, and it hides which columns the code really needs.

Select only the needed columns, especially in high-traffic endpoints and in ORMs (projections/DTOs in JPA).

</details>

## Intermediate

### Q4. In a nested-loop plan, what do `loops` and `rows` on the inner node mean?

<details>
<summary>Answer</summary>

In `EXPLAIN ANALYZE`, the inner node of a nested loop runs once per outer row: `loops=5000` means 5,000 executions. Its `actual time` and `rows` are **per loop averages**, so total rows = rows × loops, and total time is roughly time × loops. A cheap-looking inner index scan with `loops=1000000` is often the real cost. The fix is usually a better estimate on the outer side (so a hash join is chosen) or a better inner index.

</details>

### Q5. The estimated rows are 10, the actual rows are 500,000. What do you do?

<details>
<summary>Answer</summary>

The misestimate drives bad plan choices above that node. Steps:

1. `ANALYZE` the table (statistics may be stale after a bulk load).
2. Raise the statistics target for skewed columns: `ALTER TABLE … ALTER COLUMN … SET STATISTICS 1000`.
3. For correlated columns (city and postcode), create **extended statistics**: `CREATE STATISTICS … (dependencies, ndistinct, mcv) ON city, postcode FROM t`.
4. Remove opaque expressions the planner cannot estimate (functions on columns, casts), or index the expression — expression indexes also get statistics.
5. Check parameter-sensitive plans: a generic plan in a prepared statement may suit typical values but not skewed ones.

</details>

### Q6. How do you find the slowest queries in a running system?

<details>
<summary>Answer</summary>

- Enable `pg_stat_statements` and sort by `total_exec_time` (overall load) and `mean_exec_time` (individually slow). Look at `calls` for chatty N+1 patterns.
- Log slow statements with `log_min_duration_statement`, and use `auto_explain` to log their plans.
- Look at live activity in `pg_stat_activity` (long-running queries, waits).
- Check `pg_stat_user_tables` for tables with many sequential scans.

Optimise by total time first: a 5 ms query called a million times matters more than one 10-second report.

</details>

### Q7. How would you speed up `WHERE date(created_at) = '2026-03-01'`?

<details>
<summary>Answer</summary>

The function on the column prevents a plain index on `created_at` from being used, and the planner cannot estimate selectivity well. Rewrite as a sargable half-open range:

```sql
-- Illustrative
WHERE created_at >= '2026-03-01' AND created_at < '2026-03-02'
```

or create an expression index on `(created_at::date)` (only for `timestamp`; for `timestamptz` the cast depends on the time zone and cannot be indexed directly). The range rewrite is preferred: one index serves every range.

</details>

### Q8. `EXISTS`, `IN` or `JOIN` for "customers with orders" — which is fastest?

<details>
<summary>Answer</summary>

`EXISTS` and `IN (subquery)` become the same **semi-join** in PostgreSQL and stop at the first match per customer. A plain `JOIN` returns one row per order, so it needs `DISTINCT` to get customers, which adds work and can hide fan-out. Choose `EXISTS`/`IN` for "has at least one", and a join when you need columns from both sides. Verify with `EXPLAIN`.

</details>

## Advanced

### Q9. When is a sequential scan better than an index scan?

<details>
<summary>Answer</summary>

When a large fraction of the table matches (often more than a few percent), the table is small, or the rows are needed in physical order anyway. Sequential reads are cheap and benefit from read-ahead; an index scan does a random heap access per row. The planner weighs this with `random_page_cost` (default 4, often lowered to about 1.1 on SSDs) and `effective_cache_size`. Forcing index use with `enable_seqscan = off` is for testing only.

</details>

### Q10. Which configuration parameters matter most for query performance?

<details>
<summary>Answer</summary>

- `shared_buffers` — PostgreSQL's page cache (often about 25% of RAM).
- `effective_cache_size` — the planner's estimate of total cache, including the OS cache.
- `work_mem` — memory **per sort/hash operation** (a query can use several, times parallel workers) before spilling to disk; watch for `external merge` and hash `Batches` in plans.
- `maintenance_work_mem` — for index builds and vacuum.
- `random_page_cost` — lower it for SSDs.
- Parallelism: `max_parallel_workers_per_gather`.

Tune after fixing queries and indexes, not instead.

</details>

### Q11. A report query is slow but must run every minute. What options exist beyond indexing?

<details>
<summary>Answer</summary>

- **Pre-aggregate**: a materialized view refreshed periodically (`REFRESH … CONCURRENTLY`), or a summary table updated incrementally (by triggers or a job).
- **Reduce the data**: partition by time and prune, archive old rows, use a BRIN index on append-only time series.
- **Cache** results in the application if a minute of staleness is fine.
- **Move** heavy analytics to a read replica or an analytical store.

Each trades freshness or complexity for speed; state which trade-off the requirement allows.

</details>

### Q12. How do prepared statements affect planning?

<details>
<summary>Answer</summary>

A prepared statement is parsed once. For its first five executions PostgreSQL plans it with the actual parameter values (**custom plans**); afterwards it may switch to a cached **generic plan** if that is not estimated to be worse. This saves planning time, but for skewed data a generic plan can be bad for rare values (or common ones). `plan_cache_mode = force_custom_plan` (or `force_generic_plan`) overrides the heuristic. JDBC uses server-side prepared statements after `prepareThreshold` executions (5 by default).

</details>
