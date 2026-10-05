# Subqueries — Interview Questions

## Beginner

### Q1. What is a subquery?

<details>
<summary>Answer</summary>

A `SELECT` nested inside another statement (in `WHERE`, `HAVING`, the `SELECT` list, `FROM`, or DML), whose result the outer statement uses as a value, a list or a table. Example: `WHERE salary > (SELECT avg(salary) FROM employees)`.

</details>

### Q2. What types of subqueries are there?

<details>
<summary>Answer</summary>

By result shape: scalar (one value), single-row, multi-row (one column, many rows), multi-column, and table subqueries (derived tables in `FROM`). By dependency: non-correlated (independent of the outer query) and correlated (references outer columns).

</details>

### Q3. What happens if a scalar subquery returns no rows? Two rows?

<details>
<summary>Answer</summary>

No rows: its value is NULL. Two or more rows: an error — "more than one row returned by a subquery used as an expression".

</details>

### Q4. What is a derived table?

<details>
<summary>Answer</summary>

A subquery in the `FROM` clause, treated as a temporary table for the outer query: `FROM (SELECT dept_id, avg(salary) AS avg_sal FROM employees GROUP BY dept_id) AS t`. PostgreSQL 16+ makes the alias optional; older versions require it.

</details>

## Intermediate

### Q5. Find employees who earn more than the average salary of the company.

<details>
<summary>Answer</summary>

```sql
SELECT name, salary
FROM employees
WHERE salary > (SELECT avg(salary) FROM employees);
```

The subquery is non-correlated; conceptually it runs once.

</details>

### Q6. Subquery vs join — which is better?

<details>
<summary>Answer</summary>

Neither in general. Use a join when you need columns from both tables; use `EXISTS`/`IN` subqueries when you only filter by another table (they never duplicate outer rows, unlike a join to a one-to-many table); use subqueries for comparisons with aggregates. PostgreSQL converts many `IN`/`EXISTS` subqueries into semi-joins, so performance is often identical — verify with `EXPLAIN` rather than relying on rules of thumb.

</details>

### Q7. Why does `WHERE (dept_id, salary) IN (SELECT dept_id, max(salary) … GROUP BY dept_id)` miss the group with NULL dept_id?

<details>
<summary>Answer</summary>

Row comparison uses `=` on each field; `NULL = NULL` is UNKNOWN, so the row with a NULL `dept_id` never matches its own group. Use a window function (`rank() OVER (PARTITION BY dept_id …)`, which groups NULLs together) or `IS NOT DISTINCT FROM` in a correlated `EXISTS`.

</details>

### Q8. Can you use an alias defined in the outer SELECT inside a subquery?

<details>
<summary>Answer</summary>

No. Output-column aliases are not visible inside subqueries or in `WHERE`. Subqueries can reference outer **table columns** (that is what makes them correlated), not select-list aliases.

</details>

## Advanced

### Q9. What is a LATERAL subquery?

<details>
<summary>Answer</summary>

A subquery in `FROM` marked `LATERAL` may reference columns of tables listed before it — it behaves like a correlated subquery that can return several rows and columns. Example: the three latest orders per customer: `FROM customers c CROSS JOIN LATERAL (SELECT … FROM orders o WHERE o.customer_id = c.customer_id ORDER BY order_date DESC LIMIT 3) AS recent`. Useful for top-N-per-group with an index and for calling set-returning functions per row.

</details>

### Q10. A scalar subquery in the SELECT list is slow on a big table. What are the options?

<details>
<summary>Answer</summary>

It is a correlated subplan that PostgreSQL evaluates per outer row. Options: replace it with a `LEFT JOIN` to a pre-aggregated derived table (one pass over the child table), with a window function if it reads the same table, or with a `LATERAL` join if several values come from the same child lookup; and make sure the correlated lookup has an index (e.g. on `orders(customer_id)`). Measure with `EXPLAIN ANALYZE`.

</details>
