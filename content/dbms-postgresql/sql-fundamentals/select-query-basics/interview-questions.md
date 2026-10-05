# SELECT, Filtering, Sorting and Pagination — Interview Questions

## Beginner

### Q1. Is `BETWEEN` inclusive?

<details>
<summary>Answer</summary>

Yes, on both ends: `x BETWEEN a AND b` means `x >= a AND x <= b`. If `a > b` it matches nothing (`BETWEEN SYMMETRIC` swaps them in PostgreSQL).

</details>

### Q2. What is the difference between `LIKE` and `ILIKE`?

<details>
<summary>Answer</summary>

Both match patterns with `%` (any sequence) and `_` (one character). `LIKE` is case-sensitive; `ILIKE` is PostgreSQL's case-insensitive version. Portable alternative: `lower(col) LIKE lower(pattern)`.

</details>

### Q3. What does `SELECT DISTINCT a, b` return?

<details>
<summary>Answer</summary>

Distinct combinations of `(a, b)`. `DISTINCT` applies to the entire select list, not to `a` alone. Rows are duplicates only if every selected column is equal (with `NULL`s treated as equal for this purpose).

</details>

### Q4. Why can't I use a column alias in WHERE?

<details>
<summary>Answer</summary>

Logically, `WHERE` is evaluated before the `SELECT` list, so the alias does not exist yet. Repeat the expression, or compute it in a subquery or CTE and filter outside. `ORDER BY` runs after `SELECT`, so aliases work there.

</details>

## Intermediate

### Q5. Where do NULLs appear in `ORDER BY` in PostgreSQL?

<details>
<summary>Answer</summary>

PostgreSQL treats `NULL` as larger than any value: last with `ASC`, first with `DESC`. Use `NULLS FIRST` or `NULLS LAST` to choose explicitly. (Other databases differ — MySQL and SQL Server sort `NULL`s first in ascending order.)

</details>

### Q6. What does `WHERE a = 1 OR b = 2 AND c = 3` mean?

<details>
<summary>Answer</summary>

`a = 1 OR (b = 2 AND c = 3)`, because `AND` has higher precedence than `OR`. Add parentheses to express `(a = 1 OR b = 2) AND c = 3`.

</details>

### Q7. Why is `LIMIT 10` without `ORDER BY` a bug in pagination?

<details>
<summary>Answer</summary>

Without an ordering the database may return any 10 rows, and the choice can change between executions (different plans, parallel workers, table changes). Pages can overlap or skip rows. Order by a unique key (or add a unique tie-breaker such as the primary key).

</details>

### Q8. What is `FETCH FIRST n ROWS WITH TIES`?

<details>
<summary>Answer</summary>

SQL-standard limiting (PostgreSQL 13+) that returns the first `n` rows plus any further rows that tie with the n-th row on the `ORDER BY` keys. "Top 3 salaries with ties" returns 4 rows if two people share third place. It requires `ORDER BY`.

</details>

## Advanced

### Q9. Why does `OFFSET` pagination get slower for later pages? What is the alternative?

<details>
<summary>Answer</summary>

To return rows 100 001–100 020, the database must produce and discard the first 100 000 rows in order — work grows with the offset. Rows inserted or deleted between requests also shift pages. Keyset (seek) pagination remembers the last key seen: `WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT 20`, which uses an index to jump straight to the next page — constant cost per page. The trade-off: no jumping to an arbitrary page number.

</details>

### Q10. Why avoid `SELECT *` in application code?

<details>
<summary>Answer</summary>

It transfers unused columns (wasted I/O, memory, network — especially large text/jsonb), breaks or silently changes behaviour when columns are added, reordered or renamed, prevents index-only scans, and hides which columns the code depends on. List the columns you need.

</details>
