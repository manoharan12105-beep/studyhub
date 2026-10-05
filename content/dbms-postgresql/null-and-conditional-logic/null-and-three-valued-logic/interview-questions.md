# NULL and Three-Valued Logic — Interview Questions

## Beginner

### Q1. What is NULL in SQL?

<details>
<summary>Answer</summary>

A marker meaning "no value": the value is unknown, missing or not applicable. It is not zero, not an empty string and not false. Any comparison with NULL yields UNKNOWN, and arithmetic with NULL yields NULL.

</details>

### Q2. What does `SELECT NULL = NULL` return?

<details>
<summary>Answer</summary>

NULL (UNKNOWN), not TRUE. Two unknown values cannot be declared equal. Use `IS NULL` to test for NULL, or `IS NOT DISTINCT FROM` to compare two values treating NULLs as equal.

</details>

### Q3. Why does `WHERE email = NULL` return no rows even when some emails are NULL?

<details>
<summary>Answer</summary>

`email = NULL` evaluates to UNKNOWN for every row, and `WHERE` keeps only rows where the condition is TRUE. Write `WHERE email IS NULL`.

</details>

### Q4. What is three-valued logic?

<details>
<summary>Answer</summary>

SQL conditions can be TRUE, FALSE or UNKNOWN. UNKNOWN arises from comparisons with NULL. Rules: `FALSE AND UNKNOWN = FALSE`, `TRUE OR UNKNOWN = TRUE`, `TRUE AND UNKNOWN = UNKNOWN`, `FALSE OR UNKNOWN = UNKNOWN`, `NOT UNKNOWN = UNKNOWN`.

</details>

### Q5. Is NULL the same as an empty string?

<details>
<summary>Answer</summary>

In PostgreSQL (and the SQL standard), no: `''` is a known, empty value; `''` IS NULL is false and its length is 0. Oracle is the notable exception — it stores `''` as NULL — so code ported from Oracle needs care.

</details>

## Intermediate

### Q6. How do `WHERE` and `CHECK` treat UNKNOWN differently?

<details>
<summary>Answer</summary>

`WHERE` (and `ON`, `HAVING`) keeps a row only when the condition is TRUE, so UNKNOWN rows are dropped. A `CHECK` constraint rejects a row only when the condition is FALSE, so UNKNOWN rows are accepted — `CHECK (price > 0)` lets a NULL price in. Add `NOT NULL` to reject it.

</details>

### Q7. How are NULLs handled by GROUP BY, DISTINCT and ORDER BY?

<details>
<summary>Answer</summary>

`GROUP BY` puts all NULLs into one group and `DISTINCT` keeps one NULL — they treat NULLs as "not distinct". `ORDER BY` in PostgreSQL treats NULL as larger than any value: last in ascending order, first in descending; `NULLS FIRST`/`NULLS LAST` override it.

</details>

### Q8. `WHERE status <> 'CANCELLED'` — are rows with NULL status returned?

<details>
<summary>Answer</summary>

No. `NULL <> 'CANCELLED'` is UNKNOWN, so those rows are filtered out. Use `WHERE status IS DISTINCT FROM 'CANCELLED'` or `WHERE status <> 'CANCELLED' OR status IS NULL` if they should be included.

</details>

### Q9. What do COALESCE and NULLIF do?

<details>
<summary>Answer</summary>

`COALESCE(a, b, …)` returns the first non-NULL argument — e.g. `COALESCE(commission, 0)`. `NULLIF(a, b)` returns NULL if `a = b`, otherwise `a` — e.g. `total / NULLIF(count, 0)` returns NULL instead of a division-by-zero error.

</details>

### Q10. What does `IS DISTINCT FROM` do?

<details>
<summary>Answer</summary>

A NULL-safe inequality: it returns TRUE or FALSE, never UNKNOWN. `NULL IS DISTINCT FROM NULL` is FALSE; `1 IS DISTINCT FROM NULL` is TRUE. `IS NOT DISTINCT FROM` is the NULL-safe equality. Useful for change detection (`WHERE old.email IS DISTINCT FROM new.email`) and joins on nullable columns.

</details>

## Advanced

### Q11. Why does `x NOT IN (1, 2, NULL)` never return TRUE?

<details>
<summary>Answer</summary>

`NOT IN` expands to `x <> 1 AND x <> 2 AND x <> NULL`. The last term is UNKNOWN for every `x`, so the whole conjunction is at best UNKNOWN (and FALSE if `x` is 1 or 2). `WHERE` keeps nothing. The same happens when a `NOT IN` subquery returns a NULL — use `NOT EXISTS`.

</details>

### Q12. A nullable boolean column `is_verified` — how many rows does `WHERE NOT is_verified` return compared with `WHERE is_verified IS NOT TRUE`?

<details>
<summary>Answer</summary>

`WHERE NOT is_verified` returns only rows where it is FALSE (`NOT NULL` is UNKNOWN). `WHERE is_verified IS NOT TRUE` returns FALSE **and** NULL rows, because `IS [NOT] TRUE` never yields UNKNOWN. Better still: make the column `NOT NULL DEFAULT false` if two states are enough.

</details>

### Q13. Can an index help `WHERE col IS NULL` in PostgreSQL?

<details>
<summary>Answer</summary>

Yes. PostgreSQL B-tree indexes store NULLs, so `IS NULL` and `IS NOT NULL` can use them (unlike Oracle single-column B-trees, which do not index all-NULL keys). If the query targets a small set of NULL rows, a partial index `CREATE INDEX … WHERE col IS NULL` is even smaller. `IS NOT DISTINCT FROM`, however, is not directly indexable.

</details>
