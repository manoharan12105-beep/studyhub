# SQL One-Shot Revision

Every core SQL idea on one page, from statement categories to window functions. Examples use the **sample database**.

## Statement Categories

| Category | Commands |
|----------|----------|
| DDL | `CREATE`, `ALTER`, `DROP`, `TRUNCATE` |
| DML | `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `MERGE` |
| DCL | `GRANT`, `REVOKE` |
| TCL | `BEGIN`, `COMMIT`, `ROLLBACK`, `SAVEPOINT` |

## Logical Processing Order

`FROM`/`JOIN` → `WHERE` → `GROUP BY` → `HAVING` → window functions → `SELECT` → `DISTINCT` → `ORDER BY` → `LIMIT`/`OFFSET`

- `WHERE` cannot use aggregates or `SELECT` aliases; `HAVING` can use aggregates; `ORDER BY` can use aliases.
- Window functions cannot be filtered in `WHERE`; wrap them in a subquery or CTE.

## SELECT Essentials

- `DISTINCT` removes duplicate result rows; `DISTINCT ON (x)` (PostgreSQL) keeps the first row per `x`.
- `ORDER BY … NULLS FIRST/LAST`; without `ORDER BY` there is no guaranteed order.
- `LIMIT n OFFSET m` (or `FETCH FIRST n ROWS ONLY`); pair with a unique `ORDER BY`.
- `LIKE` / `ILIKE` (`%` any, `_` one), `IN`, `BETWEEN` (inclusive), `IS NULL`.

## NULL

- Comparisons with `NULL` are **unknown**; `WHERE` keeps only true.
- `IS NULL`, `IS DISTINCT FROM`, `coalesce`, `nullif`.
- Aggregates skip `NULL`s, except `count(*)`.
- `NOT IN` with a `NULL` in the list → no rows.

## Joins

| Join | Returns |
|------|---------|
| `INNER` | Matching pairs |
| `LEFT` / `RIGHT` | All rows of one side + matches (or `NULL`s) |
| `FULL` | All rows of both sides |
| `CROSS` | Every pair |
| Self join | A table joined to itself (hierarchies, comparisons) |

- Outer-join filters on the optional side go in `ON`.
- One-to-many joins multiply rows (fan-out); aggregate first.

## Grouping

- `GROUP BY` → one row per group; select only grouped columns or aggregates (or columns dependent on a grouped primary key).
- `HAVING` filters groups; `count(*) FILTER (WHERE …)` for conditional aggregates.
- `ROLLUP`, `CUBE`, `GROUPING SETS` for subtotals; `GROUPING()` marks subtotal rows.

```sql
SELECT dept_id, count(*) AS staff, round(avg(salary)) AS avg_salary
FROM employees
WHERE dept_id IS NOT NULL
GROUP BY dept_id
HAVING count(*) >= 2
ORDER BY dept_id;
```

**Output:**

```text
 dept_id | staff | avg_salary
---------+-------+------------
      10 |     4 |     103000
      20 |     4 |      65750
      30 |     2 |      61000
(3 rows)
```

## Subqueries and CTEs

- Scalar (one value), row, table (in `FROM`), correlated (refers to the outer row).
- `EXISTS` / `NOT EXISTS` for existence; `IN`, `ANY`, `ALL` for comparisons with a set.
- CTE: `WITH name AS (…)` — readability; inlined unless `MATERIALIZED`, referenced twice, recursive or data-modifying.
- Recursive CTE: anchor `UNION ALL` recursive term until no new rows; hierarchies and series.

## Window Functions

- `func() OVER (PARTITION BY … ORDER BY … frame)` — keeps every row.
- Ranking: `ROW_NUMBER` (1,2,3,4), `RANK` (1,2,2,4), `DENSE_RANK` (1,2,2,3), `NTILE`, `PERCENT_RANK`, `CUME_DIST`.
- Value: `lag`, `lead`, `first_value`, `last_value` (needs a full frame), `nth_value`.
- Aggregates as windows: running totals `sum() OVER (ORDER BY …)`, moving averages with `ROWS`/`RANGE` frames.

## Set Operations

`UNION` (distinct), `UNION ALL` (keep all), `INTERSECT`, `EXCEPT` — same column count and compatible types; whole-row comparison with `NULL`s equal.

## Modifying Data

- `INSERT … VALUES`, `INSERT … SELECT`, `RETURNING`.
- `INSERT … ON CONFLICT (key) DO NOTHING / DO UPDATE SET col = EXCLUDED.col` (upsert).
- `UPDATE … FROM other`, `DELETE … USING other` (PostgreSQL join syntax).
- `MERGE` (PostgreSQL 15+) for synchronising a target with a source.

## Last Lines to Remember

Know the processing order, treat `NULL` as unknown, put outer-join filters in `ON`, aggregate before fan-out joins, rank with the right function, and always `ORDER BY` what you `LIMIT`.
