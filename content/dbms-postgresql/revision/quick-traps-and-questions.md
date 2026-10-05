# 30 Minutes: Interview Traps and Common Questions

Block 3 of 5. The traps in one line each, then the questions asked in almost every database interview with the core of a good answer. Details: **Interview Traps**.

## Traps

- `NULL = NULL` is unknown → `IS NULL`.
- `NOT IN` + `NULL` → no rows → `NOT EXISTS`.
- `count(*)` counts rows; `count(col)` skips `NULL`s; `count(1)` is not faster.
- `WHERE` (rows) vs `HAVING` (groups).
- Outer-join filter in `WHERE` → inner join.
- `UNION` dedupes; `UNION ALL` doesn't.
- `RANK` 1,2,2,4 · `DENSE_RANK` 1,2,2,3 · `ROW_NUMBER` 1,2,3,4.
- `UNIQUE` allows many `NULL`s; PK doesn't allow any.
- `TRUNCATE` is transactional in PostgreSQL.
- `timestamptz` stores an instant, not a zone.
- `BETWEEN` dates on timestamps misses the last day.
- Integer division: `7 / 2 = 3`.
- Default window frame includes ties; `last_value` needs a full frame.
- Foreign keys are not indexed automatically.

## Common Questions → Core Answer

| Question | Core answer |
|----------|-------------|
| What is normalization? | Organising tables so each fact is stored once (1NF→BCNF) to avoid anomalies |
| What is ACID? | Atomic, consistent, isolated, durable — WAL + MVCC + constraints |
| What is an index; when not to use one? | Ordered lookup structure; not for low selectivity, tiny tables, write-heavy columns |
| Clustered vs non-clustered index? | Table stored in index order vs separate structure; PostgreSQL tables are heaps |
| Primary vs foreign key? | Identifies rows vs references another table's key |
| `DELETE` vs `TRUNCATE` vs `DROP`? | Rows (logged) vs all rows (fast) vs the table |
| Join types? | Inner, left, right, full, cross, self |
| What is a view? | A stored query; materialized view stores results |
| Isolation levels? | RC, RR, Serializable; anomalies each prevents |
| What is a deadlock? | Cycle of lock waits; one aborted; prevent with lock order |
| What is MVCC? | Row versions + snapshots; readers don't block writers |
| How do you optimise a slow query? | Measure (`EXPLAIN ANALYZE`), find the expensive node, index/rewrite/statistics, verify |
| What is a CTE? | A named subquery for one statement; recursive for hierarchies |
| Window vs `GROUP BY`? | Windows keep rows; `GROUP BY` collapses them |
| SQL injection? | Untrusted input changing query structure; prevent with bound parameters |

## Self-Check

1. Explain why `NOT IN` returns nothing when the list has a `NULL`.
2. Give the three ranking results for salaries 100, 90, 90, 80.
3. Answer "how do you optimise a slow query?" in four steps.
