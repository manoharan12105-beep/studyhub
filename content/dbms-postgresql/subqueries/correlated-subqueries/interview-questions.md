# Correlated Subqueries — Interview Questions

## Beginner

### Q1. What is a correlated subquery?

<details>
<summary>Answer</summary>

A subquery that references a column of the outer query, so its result depends on the current outer row and it cannot run on its own. Example: `WHERE e.salary > (SELECT avg(x.salary) FROM employees x WHERE x.dept_id = e.dept_id)` compares each employee with their own department's average.

</details>

### Q2. What is the difference between a correlated and a non-correlated subquery?

<details>
<summary>Answer</summary>

A non-correlated subquery is independent: it produces one result for the whole statement (PostgreSQL runs it once as an InitPlan). A correlated subquery references outer columns, so logically it is evaluated for each outer row. Non-correlated: "above the company average"; correlated: "above my department's average".

</details>

### Q3. Write a query to list employees who earn more than the average salary of their department.

<details>
<summary>Answer</summary>

```sql
SELECT e.name, e.dept_id, e.salary
FROM employees e
WHERE e.salary > (SELECT avg(x.salary)
                  FROM employees x
                  WHERE x.dept_id = e.dept_id);
```

Alternatives: join to `(SELECT dept_id, avg(salary) … GROUP BY dept_id)`, or a window function `avg(salary) OVER (PARTITION BY dept_id)` in a derived table. Employees with a `NULL` department never qualify in the first two forms.

</details>

## Intermediate

### Q4. Does a correlated subquery execute once for every row of the outer query?

<details>
<summary>Answer</summary>

Logically, yes — the result is defined as if it were evaluated per outer row. Physically, it depends on the plan. PostgreSQL pulls `EXISTS` and `IN` subqueries up into semi-joins (and `NOT EXISTS` into anti-joins), which read the inner table once with a hash or merge join. A correlated scalar subquery (an aggregate compared with or selected for each row) stays a SubPlan and really is re-executed per outer row; `EXPLAIN ANALYZE` shows this as `loops=N`. So the honest answer is "logically per row; physically only if the planner keeps it as a SubPlan".

</details>

### Q5. How would you speed up a slow correlated subquery?

<details>
<summary>Answer</summary>

1. Check the plan with `EXPLAIN ANALYZE` — is it a SubPlan with a large `loops` count and a sequential scan inside?
2. Index the correlation column of the inner table (e.g. `orders(customer_id)`) so each execution is an index lookup.
3. Rewrite: join to a pre-aggregated derived table or CTE, use a window function when the subquery reads the same table, or use `EXISTS` instead of `count(*) > 0`.
4. Combine several correlated subqueries on the same child table into one `LATERAL` subquery or one join.

</details>

### Q6. Why might `WHERE customer_id IN (SELECT customer_id FROM products)` return every customer?

<details>
<summary>Answer</summary>

If `products` has no `customer_id` column, the name resolves to the outer table (`customers.customer_id`). The subquery becomes correlated and returns the outer row's own id, so `IN` is always TRUE (as long as `products` is not empty and the id is not NULL). No error is raised. Qualifying columns (`p.customer_id`) turns this into an error. In a `DELETE` it can wipe a table.

</details>

### Q7. Find employees who earn the 2nd highest salary without LIMIT or window functions.

<details>
<summary>Answer</summary>

```sql
SELECT e1.name, e1.salary
FROM employees e1
WHERE 1 = (SELECT count(DISTINCT e2.salary)
           FROM employees e2
           WHERE e2.salary > e1.salary);
```

For the Nth highest, compare with `N - 1`. It returns every employee tied at that salary. It is O(n²) in the worst case; on PostgreSQL, `dense_rank() OVER (ORDER BY salary DESC) = N` is clearer and usually faster.

</details>

## Advanced

### Q8. Can a correlated subquery appear in UPDATE and DELETE? Give an example.

<details>
<summary>Answer</summary>

Yes:

```sql
-- Illustrative: assumes customers has an order_count column
UPDATE customers c
SET order_count = (SELECT count(*) FROM orders o WHERE o.customer_id = c.customer_id);

DELETE FROM order_items oi
WHERE EXISTS (SELECT 1 FROM orders o
              WHERE o.order_id = oi.order_id AND o.status = 'CANCELLED');
```

Watch for the scalar subquery returning no rows: with `sum`/`max` the column becomes `NULL` for unmatched rows. PostgreSQL also supports `UPDATE … FROM` and `DELETE … USING` for join-style changes.

</details>

### Q9. Why do correlated subqueries and window functions sometimes give different answers for the same "compare with my group" question?

<details>
<summary>Answer</summary>

NULL group keys. A correlation `x.dept_id = e.dept_id` never matches when `dept_id` is `NULL`, so those rows get a `NULL` aggregate and fail every comparison. `PARTITION BY dept_id` puts all `NULL` keys into one partition, so those rows get a real aggregate. Use `IS NOT DISTINCT FROM` in the correlation to get the window function's behaviour.

</details>

### Q10. What is the difference between an InitPlan and a SubPlan in a PostgreSQL plan?

<details>
<summary>Answer</summary>

An **InitPlan** is a subquery that does not depend on the outer row; it is executed once and its result reused (e.g. `salary > (SELECT avg(salary) FROM employees)`). A **SubPlan** depends on outer values, so it is re-executed whenever those values change — typically once per outer row (`loops=` in `EXPLAIN ANALYZE`). A *hashed* SubPlan (used for `NOT IN`) builds a hash table of the subquery result once and probes it per row.

</details>
