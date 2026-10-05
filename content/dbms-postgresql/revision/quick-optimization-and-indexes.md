# 30 Minutes: Query Optimization and Indexes

Block 5 of 5. The tuning process, index rules and plan red flags. Details: **Indexing Cheat Sheet** and **Query Optimization Cheat Sheet**.

## Process

Find (`pg_stat_statements`) → measure (`EXPLAIN (ANALYZE, BUFFERS)`) → locate the expensive node and misestimates → fix (index, rewrite, statistics, schema, config) → verify.

## Index Rules

- B-tree by default: `=`, ranges, `ORDER BY`, uniqueness.
- Composite `(a, b)`: equality columns first, then range/sort; `b` alone does not use it well.
- Function on a column → expression index or range rewrite.
- Small subset queried → partial index.
- Avoid table visits → covering index with `INCLUDE` + vacuumed table.
- `jsonb`/arrays/full-text/trigram → GIN; ranges/geometry/exclusion → GiST; huge time-ordered → BRIN.
- Index foreign keys; drop unused indexes (`idx_scan = 0`).
- Build in production with `CREATE INDEX CONCURRENTLY`.

## Plan Reading

- Scans: Seq · Index · Index Only · Bitmap.
- Joins: Nested Loop (small outer + inner index) · Hash (large, equality) · Merge (sorted inputs).
- Red flags: huge estimate errors, nested loop with millions of loops, `external merge` sorts, hash batches, high `Rows Removed by Filter`, high `Heap Fetches`.

## Rewrites

- Sargable predicates (raw column vs constant/range).
- `NOT EXISTS` instead of `NOT IN`.
- Keyset pagination instead of deep `OFFSET`.
- Select only needed columns.
- Aggregate before joining one-to-many tables.
- Batch N+1 queries into one.

## Statistics and Settings

- `ANALYZE` after bulk loads; raise statistics targets for skewed columns; `CREATE STATISTICS` for correlated columns.
- `work_mem` per sort/hash node; `random_page_cost` ≈ 1.1 on SSD; `effective_cache_size`; `shared_buffers`.

## When Indexes Are Not Enough

Materialized views or summary tables, partitioning + pruning, caching, read replicas, connection pooling.

## Self-Check

1. Which queries can use an index on `(customer_id, order_date)`?
2. A plan estimates 5 rows but gets 500,000 — what next?
3. Why might an index-only scan still visit the table?
4. How do you add an index to a busy table safely?
