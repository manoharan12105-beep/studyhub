# Rapid-Fire Database Questions — Interview Questions

## Beginner

### Q1. Can a table have two primary keys?

<details>
<summary>Answer</summary>

No — one primary key per table, but it may span several columns (composite).

</details>

### Q2. Can a foreign key column be `NULL`?

<details>
<summary>Answer</summary>

Yes, unless declared `NOT NULL`; a `NULL` foreign key means "no related row".

</details>

### Q3. Can a foreign key reference a non-primary-key column?

<details>
<summary>Answer</summary>

Yes, any column set with a `UNIQUE` constraint or unique index (not a partial one).

</details>

### Q4. What does `TRUNCATE` do?

<details>
<summary>Answer</summary>

Removes all rows of a table quickly, without scanning or firing row triggers; transactional in PostgreSQL.

</details>

### Q5. What is the default isolation level in PostgreSQL?

<details>
<summary>Answer</summary>

Read Committed.

</details>

### Q6. What does `count(*)` return for an empty table?

<details>
<summary>Answer</summary>

0 — while `sum`, `avg`, `max` and `min` return `NULL` over no rows.

</details>

### Q7. What is `NULL + 5`?

<details>
<summary>Answer</summary>

`NULL` — arithmetic with `NULL` yields `NULL`.

</details>

### Q8. Which is applied first, `WHERE` or `GROUP BY`?

<details>
<summary>Answer</summary>

`WHERE` — it filters rows before they are grouped.

</details>

### Q9. What does `LEFT JOIN` return when there is no match?

<details>
<summary>Answer</summary>

The left row, with `NULL` in all right-table columns.

</details>

### Q10. What does `CROSS JOIN` of 5 rows and 4 rows produce?

<details>
<summary>Answer</summary>

20 rows — every combination (Cartesian product).

</details>

### Q11. What is the difference between `CHAR(10)` and `VARCHAR(10)`?

<details>
<summary>Answer</summary>

`CHAR(10)` pads with spaces to 10; `VARCHAR(10)` stores the string as is, up to 10 characters.

</details>

### Q12. What does `DISTINCT` do with `NULL`s?

<details>
<summary>Answer</summary>

Treats them as equal — multiple `NULL`s collapse into one.

</details>

### Q13. What is a candidate key?

<details>
<summary>Answer</summary>

A minimal set of columns that uniquely identifies every row.

</details>

### Q14. What does `ORDER BY` do with `NULL`s in PostgreSQL?

<details>
<summary>Answer</summary>

Sorts them last in ascending order and first in descending order; override with `NULLS FIRST`/`NULLS LAST`.

</details>

### Q15. Which command removes privileges?

<details>
<summary>Answer</summary>

`REVOKE`.

</details>

## Intermediate

### Q16. Does a foreign key create an index in PostgreSQL?

<details>
<summary>Answer</summary>

No — only the referenced side has one (via its key); index the referencing column yourself.

</details>

### Q17. What does `EXPLAIN ANALYZE` do that `EXPLAIN` does not?

<details>
<summary>Answer</summary>

Executes the query and reports actual times and row counts.

</details>

### Q18. What does `INCLUDE` add to an index?

<details>
<summary>Answer</summary>

Non-key payload columns stored in the leaf entries, so more queries can be answered by index-only scans; they cannot be searched or sorted on.

</details>

### Q19. Which ranking function gives 1, 2, 2, 3?

<details>
<summary>Answer</summary>

`DENSE_RANK()`.

</details>

### Q20. Which ranking function gives 1, 2, 2, 4?

<details>
<summary>Answer</summary>

`RANK()`.

</details>

### Q21. What does `lag(x)` return on the first row of a partition?

<details>
<summary>Answer</summary>

`NULL` (or the default given as its third argument).

</details>

### Q22. Is a non-recursive CTE always materialised in PostgreSQL 12+?

<details>
<summary>Answer</summary>

No — if referenced once and free of side effects it is inlined, unless written `AS MATERIALIZED`.

</details>

### Q23. What is a phantom read?

<details>
<summary>Answer</summary>

Re-running a range query in the same transaction returns new rows inserted and committed by another transaction.

</details>

### Q24. What SQLSTATE signals a serialization failure?

<details>
<summary>Answer</summary>

`40001` — retry the whole transaction.

</details>

### Q25. What SQLSTATE signals a unique violation?

<details>
<summary>Answer</summary>

`23505`.

</details>

### Q26. What does `ON DELETE SET NULL` do?

<details>
<summary>Answer</summary>

When the parent row is deleted, the referencing foreign-key columns are set to `NULL`.

</details>

### Q27. Can a unique index be partial?

<details>
<summary>Answer</summary>

Yes — `CREATE UNIQUE INDEX … WHERE active` enforces uniqueness only among the rows matching the predicate.

</details>

### Q28. Does `UPDATE` overwrite a row in place in PostgreSQL?

<details>
<summary>Answer</summary>

No — it writes a new row version and marks the old one dead (MVCC).

</details>

### Q29. What reclaims dead row versions?

<details>
<summary>Answer</summary>

`VACUUM` (normally autovacuum).

</details>

### Q30. Does a plain view store data?

<details>
<summary>Answer</summary>

No — it stores only the query, which runs (merged into the outer query) every time the view is used.

</details>

### Q31. Which normal form removes transitive dependencies?

<details>
<summary>Answer</summary>

Third normal form (3NF).

</details>

### Q32. Name one common denormalization technique.

<details>
<summary>Answer</summary>

Storing a derived value, such as an order total or a comment count, kept in sync by a trigger or the application.

</details>

### Q33. What is `COALESCE(NULL, NULL, 'x', 'y')`?

<details>
<summary>Answer</summary>

`'x'` — the first non-`NULL` argument.

</details>

### Q34. `UNION` or `UNION ALL` — which is faster?

<details>
<summary>Answer</summary>

`UNION ALL`, because it skips duplicate removal.

</details>

## Advanced

### Q35. What is HOT in PostgreSQL?

<details>
<summary>Answer</summary>

Heap-Only Tuple update: if no indexed column changes and the page has room, the new version stays on the same page and no index entries are added.

</details>

### Q36. What is the visibility map used for?

<details>
<summary>Answer</summary>

Tracking all-visible (and all-frozen) pages, which lets index-only scans skip heap visits and vacuum skip pages.

</details>

### Q37. What is WAL?

<details>
<summary>Answer</summary>

The write-ahead log: changes are logged and flushed before data pages, giving durability, crash recovery and replication.

</details>

### Q38. What does `FOR UPDATE SKIP LOCKED` enable?

<details>
<summary>Answer</summary>

Concurrent workers taking different rows from a queue table without blocking each other.

</details>

### Q39. Which index type suits `jsonb @>` containment queries?

<details>
<summary>Answer</summary>

GIN.

</details>

### Q40. Which index type suits a huge append-only table filtered by timestamp?

<details>
<summary>Answer</summary>

BRIN — tiny, and effective when values correlate with physical order.

</details>

### Q41. What prevents overlapping bookings declaratively?

<details>
<summary>Answer</summary>

An exclusion constraint with a GiST index: `EXCLUDE USING gist (room WITH =, during WITH &&)`.

</details>

### Q42. What is a generic plan?

<details>
<summary>Answer</summary>

A cached plan for a prepared statement built without specific parameter values, used after a few custom plans if it is not costlier.

</details>

### Q43. What is XID wraparound?

<details>
<summary>Answer</summary>

Exhaustion of the 32-bit transaction-id space; vacuum freezing prevents old rows from appearing to be in the future.

</details>

### Q44. What does `pg_stat_statements` provide?

<details>
<summary>Answer</summary>

Aggregated execution statistics per normalised query (calls, total and mean time, rows, buffers).

</details>

### Q45. What is the difference between physical and logical replication?

<details>
<summary>Answer</summary>

Physical replays WAL for the whole cluster (byte-identical standby); logical sends row changes for selected tables (cross-version, selective).

</details>
