# SQL Interview Questions — Interview Questions

## Beginner

### Q1. In what order does SQL logically process a `SELECT` statement?

<details>
<summary>Answer</summary>

`FROM` and joins → `WHERE` → `GROUP BY` → `HAVING` → window functions → `SELECT` expressions → `DISTINCT` → `ORDER BY` → `LIMIT`/`OFFSET`. This explains several rules:

- `WHERE` cannot use aggregates or select-list aliases.
- `HAVING` can use aggregates.
- `ORDER BY` can use aliases.
- Window functions cannot appear in `WHERE`.

The optimiser may execute steps in another physical order, but the result must match this logical order.

</details>

### Q2. List each department with its number of employees, including departments with none.

<details>
<summary>Answer</summary>

```sql
SELECT d.dept_name, count(e.emp_id) AS employees
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.dept_id
GROUP BY d.dept_id, d.dept_name
ORDER BY d.dept_id;
```

**Output:**

```text
  dept_name  | employees
-------------+-----------
 Engineering |         4
 Sales       |         4
 HR          |         2
 Finance     |         1
 Research    |         0
(5 rows)
```

`count(e.emp_id)` counts only matched rows; `count(*)` would show 1 for Research, because the left join produces one `NULL`-extended row.

</details>

### Q3. What is the difference between `INNER JOIN` and `LEFT JOIN`?

<details>
<summary>Answer</summary>

`INNER JOIN` returns only pairs of rows that satisfy the join condition. `LEFT JOIN` returns every row of the left table; where there is no match, the right table's columns are `NULL`. Use a left join when the left rows must appear even without related data ("all customers and their orders, if any").

</details>

### Q4. What does `SELECT DISTINCT` do, and how is it different from `GROUP BY`?

<details>
<summary>Answer</summary>

`DISTINCT` removes duplicate result rows. `GROUP BY` forms groups so you can compute aggregates per group. `SELECT DISTINCT city FROM customers` and `SELECT city FROM customers GROUP BY city` return the same rows, and PostgreSQL may plan them the same way. Use `DISTINCT` to de-duplicate, `GROUP BY` to aggregate. Adding `DISTINCT` to hide duplicates caused by a wrong join hides a bug.

</details>

### Q5. How do you find the total revenue of each order?

<details>
<summary>Answer</summary>

```sql
SELECT order_id, sum(quantity * unit_price) AS total
FROM order_items
GROUP BY order_id
ORDER BY total DESC
LIMIT 3;
```

**Output:**

```text
 order_id |  total
----------+----------
      101 | 56000.00
      104 | 55000.00
      102 | 17000.00
(3 rows)
```

</details>

### Q6. What is a self join? Give a use case.

<details>
<summary>Answer</summary>

A table joined to itself under two aliases. The typical case is a hierarchy stored in one table: `employees e JOIN employees m ON m.emp_id = e.manager_id` lists each employee with their manager. Another is comparing rows of the same table, such as pairs of employees in the same department (`a.dept_id = b.dept_id AND a.emp_id < b.emp_id`).

</details>

## Intermediate

### Q7. Find departments whose average salary is above the company average.

<details>
<summary>Answer</summary>

```sql
SELECT dept_id, round(avg(salary)) AS avg_salary
FROM employees
WHERE dept_id IS NOT NULL
GROUP BY dept_id
HAVING avg(salary) > (SELECT avg(salary) FROM employees)
ORDER BY dept_id;
```

**Output:**

```text
 dept_id | avg_salary
---------+------------
      10 |     103000
      40 |      82000
(2 rows)
```

The scalar subquery is computed once; `HAVING` compares each group's average with it.

</details>

### Q8. What is a correlated subquery, and when is it a performance concern?

<details>
<summary>Answer</summary>

A subquery that refers to columns of the outer query, so logically it is evaluated once per outer row: `WHERE salary > (SELECT avg(salary) FROM employees x WHERE x.dept_id = e.dept_id)`. PostgreSQL decorrelates `EXISTS`/`IN` into semi- and anti-joins, but a correlated **scalar** subquery in `SELECT` or `WHERE` usually runs per row. That is cheap with an index on the correlation column, and expensive without one. Rewrites: join to a grouped derived table, or use a window function.

</details>

### Q9. How do `UNION`, `INTERSECT` and `EXCEPT` work?

<details>
<summary>Answer</summary>

They combine the results of two queries with the same number of columns and compatible types:

- `UNION` — rows in either result.
- `INTERSECT` — rows in both.
- `EXCEPT` — rows in the first but not the second.

Without `ALL` they remove duplicates; with `ALL` they keep multiplicities. They compare whole rows and treat `NULL`s as equal, unlike `=`. Column names come from the first query.

</details>

### Q10. How do you pivot rows into columns in PostgreSQL?

<details>
<summary>Answer</summary>

Conditional aggregation:

```sql
SELECT customer_id,
       count(*) FILTER (WHERE status = 'DELIVERED') AS delivered,
       count(*) FILTER (WHERE status = 'SHIPPED')   AS shipped,
       count(*) FILTER (WHERE status = 'PLACED')    AS placed,
       count(*) FILTER (WHERE status = 'CANCELLED') AS cancelled
FROM orders
GROUP BY customer_id
ORDER BY customer_id;
```

**Output:**

```text
 customer_id | delivered | shipped | placed | cancelled
-------------+-----------+---------+--------+-----------
           1 |         2 |       1 |      0 |         0
           2 |         1 |       0 |      1 |         0
           3 |         0 |       0 |      0 |         1
           4 |         1 |       0 |      0 |         0
           5 |         1 |       0 |      0 |         0
(5 rows)
```

`FILTER` is PostgreSQL's clean form of `sum(CASE WHEN … THEN 1 ELSE 0 END)`. The `tablefunc` extension's `crosstab` exists, but is rarely needed.

</details>

### Q11. Why does joining orders to order items and to payments give wrong totals?

<details>
<summary>Answer</summary>

Joining one parent to two independent child tables multiplies rows: an order with 3 items and 2 payments produces 6 rows, so `sum(item amount)` is doubled and `sum(payment)` tripled (**fan-out**). Aggregate each child in its own subquery or CTE first (one row per order), then join the aggregates. Or use correlated scalar subqueries per child.

</details>

### Q12. What is the difference between `COALESCE`, `NULLIF` and `CASE`?

<details>
<summary>Answer</summary>

- `coalesce(a, b, c)` returns the first non-`NULL` argument — for defaults.
- `nullif(a, b)` returns `NULL` if `a = b`, else `a` — typically to avoid division by zero: `x / nullif(y, 0)`.
- `CASE` is the general conditional; both functions are shorthand for specific `CASE` expressions.

</details>

### Q13. How do `INSERT … ON CONFLICT` and `MERGE` differ?

<details>
<summary>Answer</summary>

`INSERT … ON CONFLICT (key) DO UPDATE / DO NOTHING` is PostgreSQL's **upsert**. It relies on a unique index, and it is concurrency-safe: two sessions inserting the same key do not both insert. `MERGE` (PostgreSQL 15+, SQL standard) matches a source against a target with arbitrary conditions and can `INSERT`, `UPDATE` or `DELETE`. It is more flexible for synchronising tables, but under concurrency it can still raise unique violations. Use `ON CONFLICT` for single-row upserts from applications, `MERGE` for batch synchronisation.

</details>

## Advanced

### Q14. Can you use a column alias in `WHERE`? In `ORDER BY`? In `GROUP BY`?

<details>
<summary>Answer</summary>

- `WHERE`: no — it is evaluated before `SELECT`.
- `ORDER BY`: yes — evaluated after `SELECT`.
- `GROUP BY`: PostgreSQL allows output-column aliases and positions (`GROUP BY 1`) as an extension, but an input column with the same name takes precedence, which can surprise.

Repeat the expression in `WHERE`, or wrap the query in a subquery or CTE.

</details>

### Q15. Why might `SELECT * FROM orders ORDER BY order_date LIMIT 10 OFFSET 100000` be slow, and what is the alternative?

<details>
<summary>Answer</summary>

`OFFSET` still produces and discards the first 100,000 rows, so deep pages get slower linearly, and concurrent inserts shift rows between pages. **Keyset (seek) pagination** remembers the last row seen and continues from it:

```sql
-- Illustrative
SELECT * FROM orders
WHERE (order_date, order_id) > ($last_date, $last_id)
ORDER BY order_date, order_id
LIMIT 10;
```

With an index on `(order_date, order_id)` every page costs the same. The trade-off is no random "jump to page 500".

</details>

### Q16. How do you compare two tables to find rows that differ?

<details>
<summary>Answer</summary>

Use `EXCEPT` in both directions (it compares whole rows and treats `NULL`s as equal):

```sql
-- Illustrative
(SELECT * FROM table_a EXCEPT SELECT * FROM table_b)
UNION ALL
(SELECT * FROM table_b EXCEPT SELECT * FROM table_a);
```

To see which rows changed for the same key, use a `FULL JOIN … ON a.id = b.id WHERE a IS DISTINCT FROM b` (comparing whole-row values). That reports rows only in A, only in B, and rows present in both with different values.

</details>
