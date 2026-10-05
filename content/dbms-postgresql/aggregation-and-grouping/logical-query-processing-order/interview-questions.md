# Logical Query Processing Order — Interview Questions

## Beginner

### Q1. What is the order of execution of a SQL SELECT query?

<details>
<summary>Answer</summary>

Logically: `FROM`/`JOIN` → `WHERE` → `GROUP BY` → `HAVING` → window functions → `SELECT` (expressions and aliases) → `DISTINCT` → `ORDER BY` → `LIMIT`/`OFFSET`. Each step works on the output of the previous one. This is the order that defines the result; the database's physical plan may differ (pushed-down filters, index scans, early stop for `LIMIT`) as long as the result is the same.

</details>

### Q2. Why can't you use a column alias in WHERE?

<details>
<summary>Answer</summary>

`WHERE` is evaluated (step 2) before the select list (step 6) where aliases are defined, so the alias does not exist yet. Repeat the expression, or define it in a derived table / CTE and filter in the outer query. `ORDER BY` runs after the select list, so aliases work there.

</details>

### Q3. Why are aggregate functions not allowed in WHERE?

<details>
<summary>Answer</summary>

`WHERE` filters individual rows before groups are formed; an aggregate needs a whole group, which does not exist until `GROUP BY`. Group-level conditions go in `HAVING`.

</details>

## Intermediate

### Q4. How do you filter on the result of a window function such as `row_number()`?

<details>
<summary>Answer</summary>

Window functions are computed after `WHERE`, `GROUP BY` and `HAVING`, so they cannot appear in those clauses. Compute them in a derived table or CTE and filter in the outer query:

```sql
SELECT * FROM (
    SELECT e.*, row_number() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rn
    FROM employees e
) AS t
WHERE rn = 1;
```

(Some databases offer `QUALIFY`; PostgreSQL does not.)

</details>

### Q5. Does `ORDER BY` accept aliases in PostgreSQL? Any limits?

<details>
<summary>Answer</summary>

Yes, but only as a bare name (or output-column position): `ORDER BY annual` works, `ORDER BY annual + 0` fails with "column annual does not exist", because inside an expression names are resolved against input columns only. If a name matches both an output alias and an input column, `ORDER BY` chooses the output column.

</details>

### Q6. Why does `SELECT DISTINCT dept_id FROM employees ORDER BY salary` fail?

<details>
<summary>Answer</summary>

`DISTINCT` runs before `ORDER BY` and leaves one row per `dept_id`; each such row stands for several salaries, so there is no value to sort by. PostgreSQL requires `ORDER BY` expressions to appear in the select list when `DISTINCT` is used. Without `DISTINCT`, ordering by a non-selected column is allowed.

</details>

### Q7. Does the order of tables in FROM or of conditions in WHERE affect performance?

<details>
<summary>Answer</summary>

Generally no in PostgreSQL. The planner chooses the join order (exhaustively for up to `join_collapse_limit` = 8 relations by default, then by heuristics/GEQO for larger queries) and evaluates `WHERE` conditions in an order it picks (cheaper ones first). Written order matters for explicit `JOIN` syntax only when the number of relations exceeds `join_collapse_limit`. It also means `AND` is not a guaranteed short-circuit; use `CASE` to guard expressions that can fail.

</details>

## Advanced

### Q8. Where are window functions evaluated relative to GROUP BY, and what does that enable?

<details>
<summary>Answer</summary>

After `GROUP BY` and `HAVING`, before `DISTINCT`, `ORDER BY` and `LIMIT`. So a window function sees one row per group and can take aggregates as input: `count(*) * 100.0 / sum(count(*)) OVER ()` gives each group's share of the total in a single query, and `rank() OVER (ORDER BY sum(amount) DESC)` ranks groups by their total.

</details>

### Q9. Logically ORDER BY sorts all rows before LIMIT. Is `ORDER BY created_at DESC LIMIT 10` on a 100-million-row table therefore slow?

<details>
<summary>Answer</summary>

Not necessarily. With a B-tree index on `created_at`, PostgreSQL scans the index backwards and stops after 10 rows (a `Limit` over an `Index Scan Backward`, no `Sort`). Without an index it must read every row, but it uses a bounded top-N heap sort keeping only 10 rows in memory. The logical order defines the result, not the work done.

</details>

### Q10. In PostgreSQL, if a GROUP BY name matches both an input column and an output alias, which one is used?

<details>
<summary>Answer</summary>

The input column (for SQL-standard compatibility); `ORDER BY` prefers the output column in the same situation. So `SELECT upper(name) AS name … GROUP BY name` groups by the original `name`, not by the uppercased value. Avoid aliases that shadow input columns.

</details>
