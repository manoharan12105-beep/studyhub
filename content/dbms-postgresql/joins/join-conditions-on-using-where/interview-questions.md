# ON vs USING vs WHERE in Joins — Interview Questions

## Beginner

### Q1. What is the difference between ON and USING?

<details>
<summary>Answer</summary>

`ON` takes any join condition and keeps both tables' columns separate. `USING (col)` is shorthand for equality on a column with the same name in both tables; the column appears once in the output and can be referenced without a table prefix. `USING` cannot express different column names or non-equality conditions.

</details>

### Q2. What is a NATURAL JOIN and why avoid it?

<details>
<summary>Answer</summary>

A join on all columns that share a name in both tables, chosen implicitly. Adding a column with a common name (`name`, `created_at`, `status`) to either table silently changes the join condition — and the result. Explicit `ON`/`USING` is safer and clearer.

</details>

## Intermediate

### Q3. Does moving a condition from ON to WHERE change the result?

<details>
<summary>Answer</summary>

For inner joins, no. For outer joins, yes: `ON` decides which rows match while all preserved rows are kept; `WHERE` filters after the join, removing padded rows whose optional-side columns are NULL. A condition on the right table of a LEFT JOIN placed in `WHERE` therefore turns it into an inner join.

</details>

### Q4. My LEFT JOIN returns the same rows as an INNER JOIN. Why?

<details>
<summary>Answer</summary>

A `WHERE` condition references a column of the right (optional) table, e.g. `WHERE d.location = 'Chennai'` or `WHERE o.status = 'DELIVERED'`. For unmatched rows those columns are NULL, so the condition is UNKNOWN and the rows are removed. Move the condition into the `ON` clause (or deliberately test `IS NULL` for an anti-join).

</details>

### Q5. What happens if you put a condition on the left table in the ON clause of a LEFT JOIN?

<details>
<summary>Answer</summary>

It does not filter the left table. All left rows are still returned; rows failing the condition simply have no match and get NULLs on the right. To filter the left table, put the condition in `WHERE`.

</details>

### Q6. Can you still reference `e.dept_id` after `JOIN departments d USING (dept_id)`?

<details>
<summary>Answer</summary>

In PostgreSQL, yes — the qualified columns of each side remain accessible, and the unqualified `dept_id` refers to the merged column. For inner and left joins the merged value equals the left value; for a FULL JOIN it is `COALESCE(e.dept_id, d.dept_id)`.

</details>

## Advanced

### Q7. Write: all customers with the count of their orders in 2026-03, including customers with zero.

<details>
<summary>Answer</summary>

```sql
SELECT c.name, count(o.order_id) AS march_orders
FROM customers c
LEFT JOIN orders o
       ON o.customer_id = c.customer_id
      AND o.order_date >= DATE '2026-03-01'
      AND o.order_date <  DATE '2026-04-01'
GROUP BY c.customer_id, c.name;
```

The date filter is on the optional side, so it goes in `ON`; `count(o.order_id)` counts 0 for padded rows.

</details>

### Q8. Can the optimizer move conditions between ON and WHERE?

<details>
<summary>Answer</summary>

Only where it does not change the result. For inner joins, PostgreSQL freely pushes conditions down to the scans and between `ON`/`WHERE`. For outer joins it respects the semantics, but it does apply one useful transformation: if a `WHERE` condition on the nullable side is *strict* (it can never be true for NULLs, like `d.location = 'Chennai'`), the planner proves the padded rows would be removed anyway and **converts the LEFT JOIN into an inner join** — so the plan shows an inner join. That is the optimizer confirming the bug, not causing it.

</details>
