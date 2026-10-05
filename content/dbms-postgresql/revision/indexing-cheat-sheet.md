# Indexing Cheat Sheet

Which index to create, which queries it serves, and what it costs.

## Commands

```sql
-- Illustrative
CREATE INDEX idx ON t (a);                          -- B-tree
CREATE INDEX idx ON t (a, b DESC);                  -- multicolumn with order
CREATE UNIQUE INDEX idx ON t (lower(email));        -- unique expression index
CREATE INDEX idx ON t (created_at) WHERE status = 'OPEN';   -- partial
CREATE INDEX idx ON t (customer_id) INCLUDE (total);        -- covering
CREATE INDEX idx ON t USING gin (data jsonb_path_ops);      -- GIN on jsonb
CREATE INDEX idx ON t USING gin (name gin_trgm_ops);        -- trigram (pg_trgm)
CREATE INDEX idx ON t USING brin (logged_at);               -- BRIN
CREATE INDEX CONCURRENTLY idx ON t (a);             -- without blocking writes
REINDEX INDEX CONCURRENTLY idx;  DROP INDEX CONCURRENTLY idx;
```

## Index Types

| Type | Operators / use | Notes |
|------|-----------------|-------|
| B-tree | `= < <= > >= BETWEEN IN`, `IS NULL`, sorting, `LIKE 'abc%'`* | Default; supports `UNIQUE` |
| Hash | `=` | Smaller for long keys; no uniqueness, no ranges |
| GIN | `jsonb @> ? ?& ?\|`, arrays `@> && `, full-text `@@`, trigrams | Fast reads, slower writes |
| GiST | Ranges `&& @>`, geometry, `<->` nearest neighbour, exclusion | Lossy, rechecked |
| SP-GiST | Points, prefixes, non-balanced partitions | Specialised |
| BRIN | Ranges on physically ordered huge tables | Tiny; needs correlation |

*Pattern `LIKE` needs the C collation or `text_pattern_ops`.

## Multicolumn Index `(a, b, c)`

| Query | Uses index well? |
|-------|------------------|
| `a = ?` | Yes |
| `a = ? AND b = ?` | Yes |
| `a = ? AND b > ?` | Yes |
| `a = ? ORDER BY b` | Yes, no sort |
| `a > ? AND b = ?` | Partly (range on `a` stops `b` from narrowing) |
| `b = ?` | No (PostgreSQL 18 may skip-scan when `a` has few values) |

Order: equality columns first, then range/sort columns; most selective first among equalities.

## Index Not Used? Checklist

1. Function or cast on the column → expression index or rewrite.
2. Low selectivity or small table → seq scan is right.
3. Leading wildcard `LIKE '%x'` → trigram GIN.
4. Not the leading column of a composite index.
5. Type mismatch.
6. Stale statistics → `ANALYZE`.
7. `OR` across columns → bitmap OR or `UNION`.

## Costs

- Every index slows `INSERT`/`UPDATE`/`DELETE` and uses disk, cache and vacuum time.
- Updates of indexed columns prevent HOT updates.
- Find unused indexes: `pg_stat_user_indexes.idx_scan = 0` (excluding constraint indexes).

## Remember

- Primary key and `UNIQUE` create indexes; foreign keys do **not** — index them.
- Index-only scans need covering columns **and** an all-visible table (vacuum).
- Verify every index with `EXPLAIN (ANALYZE, BUFFERS)` before and after.
