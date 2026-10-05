# Query Optimization Cheat Sheet

The process, the plan nodes and the fixes for slow PostgreSQL queries.

## Process

1. **Find**: `pg_stat_statements` (by total and mean time), `log_min_duration_statement`, `auto_explain`.
2. **Measure**: `EXPLAIN (ANALYZE, BUFFERS)` with realistic parameters and data.
3. **Locate**: the node with the most time; estimated vs actual rows; loops; disk sorts.
4. **Fix**: index → rewrite → statistics → schema → configuration.
5. **Verify** with the same measurement; check write overhead.

## EXPLAIN Options

```sql
-- Illustrative
EXPLAIN SELECT …;                               -- estimated plan
EXPLAIN (ANALYZE, BUFFERS) SELECT …;            -- run it: actual time, rows, pages
EXPLAIN (ANALYZE, BUFFERS, SETTINGS, WAL) …;    -- plus non-default settings, WAL volume
EXPLAIN (COSTS OFF) SELECT …;                   -- plan shape only
BEGIN; EXPLAIN ANALYZE UPDATE …; ROLLBACK;      -- measure DML safely
```

## Plan Nodes

| Node | Meaning |
|------|---------|
| Seq Scan | Read the whole table |
| Index Scan | Walk index, fetch rows |
| Index Only Scan | Answer from the index (+ visibility map) |
| Bitmap Index/Heap Scan | Collect TIDs, read pages in order |
| Nested Loop | Per outer row, probe inner |
| Hash Join | Hash smaller side, probe with larger |
| Merge Join | Walk two sorted inputs |
| Sort | `external merge` = spilled to disk |
| HashAggregate / GroupAggregate | `GROUP BY` by hashing / on sorted input |
| Limit | Stop early (great with an ordered index) |
| Gather | Parallel workers |

## Red Flags → Fixes

| Red flag | Fix |
|----------|-----|
| Seq Scan returning few rows of a big table | Index on the filter columns; make predicate sargable |
| Estimated 10, actual 100,000 | `ANALYZE`, higher statistics target, extended statistics |
| Nested Loop with huge `loops` | Fix estimates; index the inner key |
| `Sort Method: external merge` | Index providing the order, fewer columns, `work_mem` for this query |
| Hash `Batches` > 1 | `work_mem`, smaller inputs |
| `Rows Removed by Filter` very high | Better index or partial index |
| `Heap Fetches` high in Index Only Scan | Vacuum the table |
| Many identical fast queries | N+1 — batch or join |

## Query Rewrites

- Function on a column → expression index or range: `ts >= d AND ts < d + 1`.
- `NOT IN (subquery)` → `NOT EXISTS`.
- `OFFSET` deep paging → keyset pagination.
- `SELECT *` → needed columns (enables index-only scans).
- Fan-out joins + `DISTINCT` → aggregate first, then join.
- `OR` across columns → `UNION ALL` of indexed branches (if bitmap OR is not chosen).
- Repeated correlated scalar subqueries → join to a grouped derived table or window function.

## Configuration (after queries are fixed)

`shared_buffers` (~25% RAM), `effective_cache_size`, `work_mem` (per node), `maintenance_work_mem`, `random_page_cost` (~1.1 on SSD), `max_parallel_workers_per_gather`.

## Beyond a Single Query

Materialized views or summary tables, partitioning with pruning, caching, read replicas, connection pooling.
