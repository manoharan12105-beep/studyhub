# Ranking Window Functions — Interview Questions

## Beginner

### Q1. What is the difference between ROW_NUMBER, RANK and DENSE_RANK?

<details>
<summary>Answer</summary>

All number rows by the window's `ORDER BY`. For values 100, 90, 90, 80: `row_number` gives 1, 2, 3, 4 (always unique; ties broken arbitrarily), `rank` gives 1, 2, 2, 4 (ties share a rank, then a gap), `dense_rank` gives 1, 2, 2, 3 (ties share a rank, no gap). Use `row_number` to pick exactly N rows or deduplicate, `rank` for competition-style ranking, `dense_rank` for the Nth distinct value.

</details>

### Q2. Find the second highest salary using a window function.

<details>
<summary>Answer</summary>

```sql
SELECT DISTINCT salary
FROM (SELECT salary, dense_rank() OVER (ORDER BY salary DESC) AS dr
      FROM employees) AS t
WHERE dr = 2;
```

`dense_rank` is required: with `rank`, a tie at the top would make rank 2 not exist. `DISTINCT` removes repeated rows when several employees share that salary.

</details>

### Q3. What does `ntile(4)` do?

<details>
<summary>Answer</summary>

Splits the ordered rows of each partition into 4 buckets of nearly equal size and returns the bucket number (1–4). With 10 rows the sizes are 3, 3, 2, 2 — earlier buckets get the extra rows. It cuts by row count, so equal values can end up in different buckets.

</details>

## Intermediate

### Q4. Find the top 3 highest-paid employees in each department.

<details>
<summary>Answer</summary>

```sql
SELECT dept_id, name, salary
FROM (SELECT dept_id, name, salary,
             dense_rank() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS dr
      FROM employees) AS t
WHERE dr <= 3
ORDER BY dept_id, salary DESC;
```

State the tie policy: `dense_rank` returns everyone with the top 3 distinct salaries; `rank` returns the top 3 positions including ties; `row_number` (with a tiebreaker) returns exactly 3 rows per department.

</details>

### Q5. Why might a query using ROW_NUMBER return different rows on different runs?

<details>
<summary>Answer</summary>

If the window's `ORDER BY` is not unique, rows that tie can be numbered in any order, and the order may change with the plan, parallelism or physical row order. Add a unique tiebreaker (`ORDER BY salary DESC, emp_id`) to make the result deterministic.

</details>

### Q6. Remove duplicate rows from a table, keeping one per email.

<details>
<summary>Answer</summary>

```sql
-- Illustrative
DELETE FROM users u
USING (SELECT id, row_number() OVER (PARTITION BY email ORDER BY created_at DESC, id DESC) AS rn
       FROM users) d
WHERE u.id = d.id AND d.rn > 1;
```

`row_number` marks the newest row per email as 1; every row numbered above 1 is deleted. Without a key column, PostgreSQL's `ctid` can identify physical rows, but adding a real key first is better.

</details>

### Q7. How would you rank customers by total spending, with ties sharing a rank?

<details>
<summary>Answer</summary>

Group first, then rank the groups — window functions run after `GROUP BY`:

```sql
-- Illustrative
SELECT customer_id, sum(amount) AS spent,
       rank() OVER (ORDER BY sum(amount) DESC) AS position
FROM payments
GROUP BY customer_id;
```

</details>

## Advanced

### Q8. What are PERCENT_RANK and CUME_DIST?

<details>
<summary>Answer</summary>

`percent_rank()` = (rank − 1) / (rows in partition − 1), ranging 0 to 1 — the relative position of the row. `cume_dist()` = (rows ordered at or before the current row, including peers) / rows in partition, ranging above 0 to 1 — the fraction of rows with a value ≤ the current one. For salaries 55, 60, 60, 88 (ascending): `percent_rank` of 60 is 1/3, `cume_dist` is 3/4.

</details>

### Q9. Top-N per group on a 100-million-row table is slow with ROW_NUMBER. Alternatives in PostgreSQL?

<details>
<summary>Answer</summary>

`row_number()` must sort every row of every group. Options: (1) an index on `(group_key, sort_key DESC)` so the input arrives presorted; (2) a `LATERAL` subquery per group with `ORDER BY sort_key DESC LIMIT N`, which with that index reads only N rows per group: `SELECT … FROM groups g CROSS JOIN LATERAL (SELECT … FROM big b WHERE b.group_key = g.id ORDER BY b.sort_key DESC LIMIT 3) x`; (3) for top 1, `DISTINCT ON (group_key) … ORDER BY group_key, sort_key DESC`. PostgreSQL 15+ also stops a `WindowAgg` early for `rn <= N` (run condition), but only for the whole partition stream, not to skip reading rows.

</details>

### Q10. Can you use a ranking function's result to filter in the same SELECT?

<details>
<summary>Answer</summary>

No — it is evaluated after `WHERE` and `HAVING`, and select-list aliases are not visible there. Use a subquery or CTE and filter in the outer query. PostgreSQL has no `QUALIFY` clause (unlike Snowflake, BigQuery, Teradata or DuckDB).

</details>
