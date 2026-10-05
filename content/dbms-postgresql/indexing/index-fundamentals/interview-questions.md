# Index Fundamentals — Interview Questions

## Beginner

### Q1. What is an index and why is it used?

<details>
<summary>Answer</summary>

A separate data structure (by default a B-tree) that maps column values to row locations, so the database can find matching rows without scanning the whole table. It speeds up `WHERE`, `JOIN`, `ORDER BY` and uniqueness checks. It costs disk space and slows down inserts, updates and deletes, because every index must be maintained.

</details>

### Q2. How does a B-tree index work?

<details>
<summary>Answer</summary>

It is a balanced tree of pages: the root and internal pages hold separator keys that guide the search, and the leaf pages hold all keys in sorted order with pointers to the table rows, linked to their neighbours. A lookup descends from root to leaf in O(log n) page reads (typically 3–4 levels); a range query finds the first key and walks the leaf chain. Because keys are sorted, it supports `=`, `<`, `>`, `BETWEEN`, `IN`, `ORDER BY` and prefix `LIKE`.

</details>

### Q3. Does PostgreSQL create indexes automatically?

<details>
<summary>Answer</summary>

Yes for `PRIMARY KEY` and `UNIQUE` constraints (and exclusion constraints), which need an index to enforce uniqueness. No for foreign keys: the referencing column (e.g. `orders.customer_id`) is not indexed automatically, so it usually needs a manual index for joins and for deletes/updates on the parent table.

</details>

## Intermediate

### Q4. Why might PostgreSQL not use an index that exists?

<details>
<summary>Answer</summary>

Because the planner estimates a sequential scan is cheaper (the condition matches a large fraction of rows, or the table is small); because the query cannot use it (a function or cast on the column, a leading-wildcard `LIKE`, an `OR` across columns without suitable indexes, the leading column of a composite index is missing); or because statistics are stale (`ANALYZE`). Check with `EXPLAIN (ANALYZE)` and compare estimated vs actual rows.

</details>

### Q5. How do you choose the column order of a composite index?

<details>
<summary>Answer</summary>

Columns tested with equality first, then the column used for a range or `ORDER BY`. An index on `(customer_id, created_at)` serves `WHERE customer_id = ? AND created_at >= ?` and `WHERE customer_id = ? ORDER BY created_at DESC LIMIT 10`; an index on `(created_at, customer_id)` would have to scan the whole date range. Also consider which columns are queried alone: the leading column should be useful by itself. PostgreSQL 18's skip scan can use an index without its leading column only when that column has few distinct values.

</details>

### Q6. What is an index-only scan?

<details>
<summary>Answer</summary>

A scan that answers a query entirely from the index because all needed columns are in it, skipping the table. PostgreSQL still has to confirm row visibility; it uses the visibility map, and only pages not marked all-visible require a heap fetch (`Heap Fetches` in `EXPLAIN ANALYZE`). Regular vacuuming keeps it efficient. Covering indexes (`INCLUDE`) make more queries eligible.

</details>

### Q7. What is the difference between a clustered and a non-clustered index?

<details>
<summary>Answer</summary>

A clustered index determines the physical order of the table rows — in SQL Server or MySQL InnoDB the table is stored in primary-key order inside the index. A non-clustered (secondary) index is a separate structure pointing to rows. PostgreSQL tables are heaps, so all its indexes are secondary; `CLUSTER` reorders a table once by an index but the order is not maintained afterwards.

</details>

### Q8. What is the downside of having many indexes?

<details>
<summary>Answer</summary>

Each insert must add an entry to every index, and updates that change indexed columns (or that are not HOT) do too, so writes slow down and generate more WAL; indexes use disk and memory (cache); vacuum has more work; and the planner has more plans to consider. Unused indexes are pure cost — find them with `pg_stat_user_indexes.idx_scan = 0` over a representative period and drop them (unless they enforce a constraint).

</details>

## Advanced

### Q9. What is a bitmap scan and when is it chosen?

<details>
<summary>Answer</summary>

A two-step access: a Bitmap Index Scan collects the locations of all matching rows into an in-memory bitmap (one bit per page, or per row), then a Bitmap Heap Scan reads the heap pages in physical order, each page once, rechecking the condition. It is chosen when too many rows match for a plain index scan (random heap reads) but too few for a sequential scan, and to combine several indexes with `BitmapAnd`/`BitmapOr`. Its output is not in index order.

</details>

### Q10. How do you add an index to a large table in production?

<details>
<summary>Answer</summary>

`CREATE INDEX CONCURRENTLY idx ON big_table (col);` — it does not block inserts/updates/deletes (plain `CREATE INDEX` takes a `SHARE` lock that blocks writes for the whole build). It is slower, scans the table twice, cannot run inside a transaction block, and waits for existing transactions. If it fails, it leaves an `INVALID` index that must be dropped (`DROP INDEX CONCURRENTLY`) before retrying. Set a `lock_timeout` and monitor with `pg_stat_progress_create_index`.

</details>
