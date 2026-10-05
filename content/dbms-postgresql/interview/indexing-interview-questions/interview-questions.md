# Indexing Interview Questions — Interview Questions

## Beginner

### Q1. What is an index, and what does it cost?

<details>
<summary>Answer</summary>

A separate data structure, ordered by the indexed columns, that lets the database find matching rows without reading the whole table — like a book's index. Costs:

- disk space and memory;
- slower `INSERT`/`UPDATE`/`DELETE`, because every index must be maintained (and in PostgreSQL an update that cannot be HOT adds entries to all indexes);
- planning overhead.

Index what queries filter, join and sort on, not every column.

</details>

### Q2. Clustered vs non-clustered index — how does this apply to PostgreSQL?

<details>
<summary>Answer</summary>

In SQL Server and MySQL InnoDB, the **clustered** index *is* the table, with rows stored in key order (the primary key in InnoDB); other indexes are non-clustered and point to it. PostgreSQL has no clustered indexes: tables are **heaps** (unordered), and every index, including the primary key's, is secondary and points to row locations (TIDs). The `CLUSTER` command reorders a table once by an index, but the order is not maintained on later writes.

</details>

### Q3. Does a primary key or unique constraint create an index?

<details>
<summary>Answer</summary>

Yes. PostgreSQL enforces `PRIMARY KEY` and `UNIQUE` with a unique B-tree index. A **foreign key** does **not** create an index on the referencing column, and you usually should add one. Otherwise, joins from parent to children and every `DELETE`/`UPDATE` of a parent key scan the child table.

</details>

## Intermediate

### Q4. With an index on `(last_name, first_name)`, which queries can use it?

<details>
<summary>Answer</summary>

- `WHERE last_name = 'Rao'` — yes (leading column).
- `WHERE last_name = 'Rao' AND first_name = 'Asha'` — yes, the best case.
- `WHERE last_name = 'Rao' ORDER BY first_name` — yes, with no sort.
- `WHERE last_name LIKE 'Ra%'` — yes, if the index supports pattern matching (C collation or `text_pattern_ops`).
- `WHERE first_name = 'Asha'` — normally no: entries are ordered by last name first. PostgreSQL 18 can sometimes use a **skip scan** when the leading column has few distinct values; otherwise a full index scan may still be chosen, as a smaller alternative to the table.

Rule: put equality-filtered columns first, then the column used for ranges or sorting.

</details>

### Q5. Why is my index not used?

<details>
<summary>Answer</summary>

Common reasons:

1. The query returns a large fraction of rows — a sequential scan is cheaper (correct choice).
2. The table is small.
3. A function or expression wraps the column: `lower(email) = …`, `created_at::date = …` → use an expression index or rewrite as a range.
4. Type mismatch or implicit cast (comparing `text` with a number, `varchar` parameters vs `bigint` column).
5. Leading wildcard `LIKE '%x'` — needs a trigram GIN index.
6. The column is not the leading column of a composite index.
7. Outdated statistics → `ANALYZE`.
8. `OR` across different columns (sometimes solved by a bitmap OR, or by rewriting as `UNION`).

Check with `EXPLAIN (ANALYZE, BUFFERS)`, and compare estimated with actual rows.

</details>

### Q6. What is index bloat, and how do you fix it?

<details>
<summary>Answer</summary>

Under MVCC, updates and deletes leave dead index entries. Vacuum removes them, but freed space inside B-tree pages is reused only for keys that fit there, so an index can stay much larger than its live content (common with random keys, or after mass deletes). Symptoms: an index much bigger than expected, and slower scans. Fix: `REINDEX INDEX CONCURRENTLY idx` (PostgreSQL 12+) rebuilds it without blocking writes; prevent it with healthy autovacuum and fewer massive update/delete waves.

</details>

### Q7. What are partial and expression indexes? Give a use case for each.

<details>
<summary>Answer</summary>

- **Partial**: indexes only rows that match a predicate. `CREATE INDEX ON orders (order_date) WHERE status = 'PLACED'` is tiny when only a few orders are open, and is used by queries whose `WHERE` implies the predicate. A partial **unique** index enforces "one active subscription per user".
- **Expression**: indexes the result of an expression. `CREATE INDEX ON users (lower(email))` serves `WHERE lower(email) = lower($1)`. The query must use the same expression.

</details>

### Q8. How do you create an index on a busy production table?

<details>
<summary>Answer</summary>

`CREATE INDEX CONCURRENTLY idx ON big_table (col);` builds without blocking writes. It takes longer, scans the table twice, cannot run inside a transaction block, and if it fails leaves an `INVALID` index that must be dropped and recreated. A plain `CREATE INDEX` blocks inserts, updates and deletes for the whole build. Also check disk space, and do it during low traffic.

</details>

## Advanced

### Q9. How does a B-tree index find a row, and what is its complexity?

<details>
<summary>Answer</summary>

The B-tree is balanced: the root and internal pages hold separator keys and child pointers; leaf pages hold sorted keys with TIDs and are linked to their neighbours. A lookup descends from the root to one leaf, comparing keys on each page — O(log n) page reads, with a high fan-out (hundreds of keys per 8 kB page). Even 100 million rows are only about 4 levels deep. A range scan finds the first leaf entry, then follows the leaf links. Each matching TID then needs a heap access, which is why many matches favour a bitmap or sequential scan.

</details>

### Q10. Bitmap index scan vs index scan — what is the difference?

<details>
<summary>Answer</summary>

An **index scan** fetches heap rows in index order, one at a time. That is good for few rows, or when the order is needed, but means random I/O for many rows. A **bitmap index scan** first collects all matching TIDs into an in-memory bitmap (sorted by page). Then a **bitmap heap scan** reads each needed page once, in physical order. It is good for medium selectivity, and it can combine several indexes with `BitmapAnd`/`BitmapOr`. If the bitmap exceeds `work_mem` it becomes lossy (whole pages), and the planner rechecks the condition.

</details>

### Q11. How do you find unused or duplicate indexes?

<details>
<summary>Answer</summary>

- `pg_stat_user_indexes.idx_scan = 0` over a long period (after a statistics reset, and not counting unique indexes that enforce constraints) → candidates to drop. Check replicas too, since statistics are per server.
- Indexes whose columns are a leading prefix of another index (`(a)` vs `(a, b)`) are often redundant, unless one is unique or much smaller.
- Compare `pg_relation_size` of indexes with the benefit.

Dropping unused indexes speeds up writes and vacuum and frees memory.

</details>

### Q12. Why can a random UUID primary key hurt insert performance?

<details>
<summary>Answer</summary>

Random keys land on random leaf pages of the B-tree. With a large index, most of those pages are not in cache, so each insert may need a disk read; pages split everywhere; WAL volume grows (full-page images after checkpoints); and the index stays only about half full. Sequential keys (identity, or time-ordered UUIDv7) always append to the rightmost leaf, which stays in cache.

</details>
