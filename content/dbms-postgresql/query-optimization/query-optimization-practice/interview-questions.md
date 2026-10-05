# Query Optimization in Practice — Interview Questions

## Beginner

### Q1. How would you optimize a slow SQL query?

<details>
<summary>Answer</summary>

Measure, don't guess: reproduce it with realistic data and parameters and run `EXPLAIN (ANALYZE, BUFFERS)`. Find the expensive node — a sequential scan discarding most rows, a disk sort, a nested loop with a huge loop count, an estimate far from the actual rows. Then fix the cause: add or adjust an index, make the predicate sargable, refresh statistics, rewrite (joins instead of correlated subqueries, keyset pagination), select fewer columns, or reduce round trips. Verify with `EXPLAIN ANALYZE` again and consider the write cost of any new index.

</details>

### Q2. What is a sargable predicate?

<details>
<summary>Answer</summary>

A condition that can use an index because the indexed column appears alone on one side of the comparison: `created_at >= '2026-03-01'` is sargable; `date(created_at) = '2026-03-01'`, `amount * 2 > 100` or `col::text = '42'` are not. Rewrite by moving computations to the constant side, or create an expression index on the exact expression used.

</details>

### Q3. Why is SELECT * discouraged?

<details>
<summary>Answer</summary>

It reads and transfers columns the application does not need (wider rows, more network and memory, possibly large TOASTed values), prevents index-only scans, and makes code fragile when columns are added or reordered. Selecting the needed columns is cheaper and clearer.

</details>

## Intermediate

### Q4. Why is OFFSET pagination slow on large tables, and what is the alternative?

<details>
<summary>Answer</summary>

`LIMIT 20 OFFSET 100000` must produce the first 100,020 rows in order and throw away 100,000, so later pages get progressively slower. Keyset (seek) pagination filters by the last seen key: `WHERE id > :last_id ORDER BY id LIMIT 20` (or a composite `(created_at, id) < (:ts, :id)` with a matching index), which reads only the requested rows. Trade-off: no jumping to page N and the sort key must be unique (add the id as a tiebreaker).

</details>

### Q5. What is the N+1 query problem?

<details>
<summary>Answer</summary>

Loading a list with one query and then running one more query per item to load related data — N+1 round trips. It typically comes from ORM lazy loading (accessing `order.getCustomer()` in a loop). Fix with a join, a single `WHERE id = ANY(?)` query for all ids, or ORM features: `JOIN FETCH`, entity graphs, `@BatchSize`. Detect it by logging SQL or counting queries per request.

</details>

### Q6. How do you find the slowest queries in a PostgreSQL database?

<details>
<summary>Answer</summary>

`pg_stat_statements` (extension, needs `shared_preload_libraries`) aggregates every normalized statement with calls, total and mean execution time, rows and buffer usage — sort by `total_exec_time` to find what costs the server most overall. `log_min_duration_statement` logs individual slow statements; `auto_explain` logs their plans; `pg_stat_activity` shows what is running now.

</details>

### Q7. How do you update 50 million rows without hurting production?

<details>
<summary>Answer</summary>

In batches (e.g. 5,000–50,000 rows by primary-key range), each in its own short transaction, possibly with a short pause between batches: this limits lock duration, WAL bursts and replication lag, and lets vacuum reuse space between batches. Make the operation idempotent (`… AND new_col IS NULL`) so it can resume after interruption. For schema changes, add nullable columns first and backfill, rather than rewriting the table in one `ALTER`.

</details>

## Advanced

### Q8. A query uses an index scan but is still slow. What could be wrong?

<details>
<summary>Answer</summary>

The index may not be selective for this condition (it returns most of the table through random heap reads), only part of the predicate may be an index condition with the rest as a `Filter` (check `Rows Removed by Filter`), the index column order may not match (range column before equality column), the heap fetches may be many because of poor correlation or a stale visibility map (index-only scans with high `Heap Fetches` → vacuum), or the scan may be the inner side of a nested loop executed thousands of times due to an underestimate.

</details>

### Q9. What server settings most affect query performance?

<details>
<summary>Answer</summary>

`shared_buffers` (PostgreSQL's cache, commonly ~25% of RAM), `effective_cache_size` (planner's estimate of OS + PostgreSQL cache), `work_mem` (memory per sort/hash node — too low causes disk spills, too high risks OOM with many connections), `maintenance_work_mem` (index builds, vacuum), `random_page_cost` (lower to ~1.1 on SSDs so index plans are not undervalued), and `max_connections` with a connection pooler. Tune from measurements, not defaults found online.

</details>

### Q10. When would you choose a materialized view or summary table over query tuning?

<details>
<summary>Answer</summary>

When the query is inherently expensive (aggregating millions of rows), is run far more often than the underlying data changes, and can tolerate some staleness: dashboards, leaderboards, daily reports. Tuning and indexes cannot make "aggregate 100 million rows" cheap; precomputing it can. The cost is refresh work and stale data between refreshes ([Materialized Views](../../views-and-materialized-views/materialized-views/content.md)).

</details>
