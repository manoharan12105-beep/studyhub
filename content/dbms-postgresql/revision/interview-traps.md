# Interview Traps

The precise answers to the comparisons and "gotchas" interviewers use most. Proofs and examples are in **SQL Interview Traps**.

## NULL

- `NULL = NULL` → unknown, not true; use `IS NULL` / `IS NOT DISTINCT FROM`.
- `WHERE col = NULL` → zero rows.
- `col <> 5` silently skips `NULL` rows.
- `NOT IN (subquery with NULL)` → zero rows; use `NOT EXISTS`.
- `avg(col)` ignores `NULL`s — it is not "missing = 0".
- `'a' || NULL` → `NULL`; `concat('a', NULL)` → `'a'`.

## Counting and Aggregating

- `count(*)` counts rows; `count(col)` skips `NULL`s; `count(DISTINCT col)` counts distinct non-null values.
- `count(1)` = `count(*)` in result; not faster.
- `sum` over zero rows is `NULL`, `count` is 0.
- `7 / 2 = 3` (integer division) — use `7 / 2.0` or `100.0 * a / b`.

## Filtering

- `WHERE` filters rows before grouping; `HAVING` filters groups after.
- Outer join: optional-side filters in `ON`; in `WHERE` they make it an inner join.
- `BETWEEN '2026-01-01' AND '2026-01-31'` on timestamps misses most of the 31st — use half-open ranges.
- `LIMIT` without `ORDER BY` returns arbitrary rows.

## Set Operations and Duplicates

- `UNION` removes duplicates (slower); `UNION ALL` keeps them.
- Joins to one-to-many tables multiply rows; `DISTINCT` hides, not fixes.
- `GROUP BY`, `DISTINCT`, `UNION` treat `NULL`s as equal; `=` does not.

## Comparisons

| Pair | Precise difference |
|------|--------------------|
| `DELETE` / `TRUNCATE` / `DROP` | Some rows, logged, triggers / all rows, fast, transactional in PG / the table itself |
| `char` / `varchar` / `text` | Same storage; `char(n)` pads; `varchar(n)` adds a length check |
| `EXISTS` / `IN` | Same semi-join plan in PostgreSQL; differ only with `NOT` and `NULL`s |
| CTE / subquery | Usually the same plan (inlined) since PG 12 |
| CTE / temp table | One statement vs session; temp tables can be indexed and analysed |
| View / materialized view | Stored query vs stored result (refresh needed) |
| `ROW_NUMBER` / `RANK` / `DENSE_RANK` | 1,2,3,4 / 1,2,2,4 / 1,2,2,3 |
| `PRIMARY KEY` / `UNIQUE` | One per table, not null / many per table, `NULL`s allowed |
| `NO ACTION` / `CASCADE` | Delete of a referenced parent fails / deletes children too |
| `SERIAL` / `IDENTITY` | PG shorthand / SQL standard, stricter; both have gaps |
| `timestamp` / `timestamptz` | Wall-clock value / absolute instant shown in the session zone |
| Index / partition | Finds rows / splits storage, prunes by key |
| Normalization / denormalization | Remove redundancy for integrity / add it for read speed |
| Clustered / non-clustered | PostgreSQL has neither in the InnoDB sense; tables are heaps |
| `json` / `jsonb` | Text as entered / binary, indexable — use `jsonb` |

## PostgreSQL Specifics

- Read Uncommitted behaves as Read Committed; dirty reads are impossible.
- `TRUNCATE` and DDL can be rolled back.
- Foreign keys do not create indexes.
- `UPDATE` writes a new row version; vacuum cleans up.
- Default isolation is Read Committed, not Repeatable Read (MySQL InnoDB's default).
- A non-recursive CTE is not automatically materialized (since 12).
- `GROUP BY` the primary key allows selecting other columns of that table.

## Phrases That Sound Wrong

- "Static data never needs an index" — it may if queried by a filter.
- "Indexes always speed up queries" — not for low selectivity, and they slow writes.
- "Serializable means one transaction at a time" — no; it guarantees a serial-equivalent result, aborting conflicting transactions.
- "Normalization always improves performance" — it improves integrity; reads may need more joins.
