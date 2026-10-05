# GROUP BY and HAVING — Interview Questions

## Beginner

### Q1. What is the difference between WHERE and HAVING?

<details>
<summary>Answer</summary>

`WHERE` filters individual rows before they are grouped and cannot use aggregate functions. `HAVING` filters groups after aggregation and can use aggregates. Example: `WHERE hire_date < '2021-01-01'` removes rows; `HAVING count(*) > 1` removes departments with one remaining employee. Conditions that do not need an aggregate belong in `WHERE`.

</details>

### Q2. Can you use HAVING without GROUP BY?

<details>
<summary>Answer</summary>

Yes. The whole result is then treated as one group, so the query returns a single row or none: `SELECT count(*) FROM orders HAVING count(*) > 5` returns the count only if it exceeds 5.

</details>

### Q3. Why does `SELECT dept_id, name, count(*) FROM employees GROUP BY dept_id` fail?

<details>
<summary>Answer</summary>

Each output row represents a whole department, but `name` has several values per department; PostgreSQL cannot pick one, so it raises "column must appear in the GROUP BY clause or be used in an aggregate function". Fix: group by `name` too, aggregate it (`string_agg(name, ', ')`, `min(name)`), or use a window function if you want per-row output with group totals.

</details>

### Q4. How are NULLs treated in GROUP BY?

<details>
<summary>Answer</summary>

All `NULL` values of a grouping column fall into a single group, even though `NULL = NULL` is not TRUE. So employees with no department form one `NULL` group.

</details>

## Intermediate

### Q5. Write a query to find duplicate emails in a users table.

<details>
<summary>Answer</summary>

```sql
-- Illustrative
SELECT email, count(*) AS copies
FROM users
GROUP BY email
HAVING count(*) > 1;
```

Add `lower(email)` in both places for case-insensitive duplicates. To see the full duplicate rows, use a window function: `count(*) OVER (PARTITION BY email) > 1`.

</details>

### Q6. When can you select a column that is not in GROUP BY in PostgreSQL?

<details>
<summary>Answer</summary>

When it is functionally dependent on the grouped columns through a primary key: if you `GROUP BY d.dept_id` and `dept_id` is the primary key of `departments`, any other column of `d` may be selected. PostgreSQL recognises primary keys (not unique constraints or other dependencies) for this. Otherwise the column must be grouped or aggregated.

</details>

### Q7. How do you count rows matching different conditions in one query?

<details>
<summary>Answer</summary>

Conditional aggregation:

```sql
-- Illustrative
SELECT customer_id,
       count(*) FILTER (WHERE status = 'DELIVERED')          AS delivered,
       sum(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled
FROM orders
GROUP BY customer_id;
```

`FILTER` is standard SQL and PostgreSQL supports it; `CASE` inside the aggregate works on every database. One scan produces all the counts — the usual way to pivot rows into columns.

</details>

### Q8. Can you use a column alias in GROUP BY, HAVING or WHERE?

<details>
<summary>Answer</summary>

In PostgreSQL, `GROUP BY` and `ORDER BY` accept output-column aliases (and positions like `GROUP BY 1`). `WHERE` and `HAVING` do not: they are evaluated before the select list is computed, so repeat the expression (`HAVING count(*) > 1`, not `HAVING n > 1`) or wrap the query in a derived table or CTE.

</details>

## Advanced

### Q9. What are ROLLUP, CUBE and GROUPING SETS?

<details>
<summary>Answer</summary>

Extensions that compute several groupings in one query. `ROLLUP (a, b)` produces groups `(a, b)`, `(a)` and `()` — subtotals along a hierarchy plus a grand total. `CUBE (a, b)` produces every combination: `(a, b)`, `(a)`, `(b)`, `()`. `GROUPING SETS` lists exactly the groupings wanted. Rolled-up columns appear as `NULL`; `GROUPING(col)` returns 1 for those, distinguishing a subtotal from a real `NULL` value.

</details>

### Q10. A report joins customers → orders → order_items and shows `sum(o.shipping_fee)` per customer. The totals are too high. Why?

<details>
<summary>Answer</summary>

Fan-out: each order row is repeated once per order item, so its `shipping_fee` is summed several times. Grouping happens after the join, so it cannot undo the duplication. Fix by aggregating each child table separately in a derived table or CTE (orders per customer, items per order) and then joining the aggregates. `sum(DISTINCT …)` is not a fix — two different orders can have the same fee.

</details>

### Q11. Is GROUP BY slower than DISTINCT?

<details>
<summary>Answer</summary>

For the same set of columns without aggregates, PostgreSQL plans them with the same strategies (HashAggregate, or Sort + Unique/GroupAggregate) and the cost is essentially the same. Choose by intent: `DISTINCT` to remove duplicate rows, `GROUP BY` to aggregate. Check `EXPLAIN` if in doubt.

</details>
