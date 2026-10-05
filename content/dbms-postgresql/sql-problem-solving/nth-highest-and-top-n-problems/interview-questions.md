# Nth-Highest and Top-N Problems — Interview Questions

## Beginner

### Q1. Write a query for the second-highest salary.

<details>
<summary>Answer</summary>

```sql
SELECT max(salary) AS second_highest
FROM employees
WHERE salary < (SELECT max(salary) FROM employees);
```

**Output:**

```text
 second_highest
----------------
          95000
(1 row)
```

It finds the largest salary below the maximum, so ties at the top do not matter, and it returns `NULL` (not zero rows) when there is no second value, because `max` over no rows is `NULL`.

</details>

### Q2. Why is `ORDER BY salary DESC LIMIT 1 OFFSET 1` not a correct second-highest salary query?

<details>
<summary>Answer</summary>

It returns the second **row**, not the second **distinct value**. If two people share the top salary, it returns the top salary again. Add `DISTINCT`: `SELECT DISTINCT salary … ORDER BY salary DESC OFFSET 1 LIMIT 1`. It also returns zero rows instead of `NULL` when there is no second value; wrap it in a scalar subquery `SELECT (…) AS second_highest` to get `NULL`.

</details>

### Q3. How do you get the highest-paid employee in each department?

<details>
<summary>Answer</summary>

Ties included — compare with the group maximum:

```sql
SELECT dept_id, name, salary
FROM employees e
WHERE salary = (SELECT max(salary) FROM employees x WHERE x.dept_id = e.dept_id)
ORDER BY dept_id;
```

**Output:**

```text
 dept_id |  name  | salary
---------+--------+--------
      10 | Asha   | 150000
      20 | Divya  |  88000
      30 | Vikram |  70000
      40 | Farhan |  82000
(4 rows)
```

Exactly one per department in PostgreSQL: `SELECT DISTINCT ON (dept_id) … ORDER BY dept_id, salary DESC, emp_id`. Equivalent window version: `RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) = 1`.

</details>

## Intermediate

### Q4. Write a query for the Nth-highest salary that returns `NULL` if it does not exist.

<details>
<summary>Answer</summary>

```sql
SELECT (SELECT DISTINCT salary FROM employees
        ORDER BY salary DESC OFFSET 4 - 1 LIMIT 1) AS fourth_highest;
```

**Output:**

```text
 fourth_highest
----------------
          82000
(1 row)
```

`DISTINCT` makes it a value ranking; the scalar subquery turns "no row" into `NULL`. Alternatives: `DENSE_RANK() OVER (ORDER BY salary DESC) = N` in a subquery, or the correlated form `WHERE N - 1 = (SELECT count(DISTINCT salary) FROM employees x WHERE x.salary > e.salary)`. In a function, the `OFFSET` comes from the parameter.

</details>

### Q5. "Top 3 salaries per department" — `ROW_NUMBER`, `RANK` or `DENSE_RANK`?

<details>
<summary>Answer</summary>

It depends on the meaning, so ask:

- **Top 3 distinct salary values**, everyone earning them → `DENSE_RANK() <= 3`.
- **Top 3 people**, ties at the boundary included (may return more than 3) → `RANK() <= 3`.
- **Exactly 3 rows** → `ROW_NUMBER() <= 3` with a deterministic tiebreaker (`ORDER BY salary DESC, emp_id`).

In Engineering (150000, 95000, 95000, 72000), `DENSE_RANK() <= 3` returns four people, `RANK() <= 3` returns three, and `ROW_NUMBER() <= 3` returns three, chosen by the tiebreaker.

</details>

### Q6. Why can't you write `WHERE DENSE_RANK() OVER (…) <= 3`?

<details>
<summary>Answer</summary>

Window functions are evaluated after `WHERE`, `GROUP BY` and `HAVING`, so `WHERE` cannot see them (PostgreSQL raises `window functions are not allowed in WHERE`). Compute the rank in a subquery or CTE and filter in the outer query. Some databases offer `QUALIFY` for this; PostgreSQL does not.

</details>

### Q7. Find employees who earn more than their department's average.

<details>
<summary>Answer</summary>

```sql
SELECT name, dept_id, salary
FROM (SELECT e.*, avg(salary) OVER (PARTITION BY dept_id) AS dept_avg FROM employees e) t
WHERE salary > dept_avg
ORDER BY dept_id, name;
```

**Output:**

```text
  name  | dept_id | salary
--------+---------+--------
 Asha   |      10 | 150000
 Divya  |      20 |  88000
 Vikram |      30 |  70000
(3 rows)
```

The correlated version `WHERE salary > (SELECT avg(salary) FROM employees x WHERE x.dept_id = e.dept_id)` gives the same rows. The window version computes each average once; the correlated one may re-run per row unless the planner or an index helps.

</details>

### Q8. How do you get each user's latest record? Give two PostgreSQL approaches.

<details>
<summary>Answer</summary>

1. `DISTINCT ON`:

   ```sql
   -- Illustrative
   SELECT DISTINCT ON (user_id) *
   FROM logins
   ORDER BY user_id, logged_at DESC, login_id DESC;
   ```

2. `ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY logged_at DESC, login_id DESC) = 1` in a subquery (portable).

For a large table with few users per lookup, `users u CROSS JOIN LATERAL (SELECT … FROM logins WHERE user_id = u.user_id ORDER BY logged_at DESC LIMIT 1)` with an index on `(user_id, logged_at DESC)` reads one index entry per user instead of sorting the whole table. Use `LEFT JOIN LATERAL … ON true` to keep users with no logins.

</details>

## Advanced

### Q9. The top-N-per-group query on a 50-million-row table is slow. How do you speed it up?

<details>
<summary>Answer</summary>

1. Check `EXPLAIN (ANALYZE)`: a window solution sorts all rows by `(group, value)`.
2. Create an index matching the partition and order: `CREATE INDEX ON orders (customer_id, order_date DESC)`. A window query can then read rows in index order and skip the sort.
3. If there are relatively few groups and N is small, rewrite with `LATERAL (… ORDER BY order_date DESC LIMIT N)` driven from the group table. Each group becomes an index probe reading N entries, instead of a scan of all 50 million rows.
4. Filter early (date range, active users) before ranking.
5. If the result is read often and can be slightly stale, store it in a materialized view or a "latest" table maintained by the application or a trigger.

</details>

### Q10. Is `DISTINCT ON` deterministic?

<details>
<summary>Answer</summary>

Only if the `ORDER BY` fully decides which row comes first in each group. `DISTINCT ON (dept_id) … ORDER BY dept_id, salary DESC` returns an arbitrary one of Ravi and Meena if the top salary is tied, and the choice can change between runs or plans. Add a unique tiebreaker (`, emp_id`). The `DISTINCT ON` expressions must also match the leftmost `ORDER BY` expressions, or PostgreSQL raises an error.

</details>

### Q11. How would you return the first and last order of every customer in one query?

<details>
<summary>Answer</summary>

Aggregate with ordered aggregates:

```sql
-- Illustrative
SELECT customer_id,
       (array_agg(order_id ORDER BY order_date, order_id))[1]           AS first_order,
       (array_agg(order_id ORDER BY order_date DESC, order_id DESC))[1] AS last_order
FROM orders
GROUP BY customer_id;
```

Or use window functions: `first_value(order_id) OVER w` and `last_value(order_id) OVER w` with `w AS (PARTITION BY customer_id ORDER BY order_date, order_id ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)`, then `DISTINCT` or `GROUP BY`. The explicit frame is essential: the default frame ends at the current row, so `last_value` would return the current row's value.

</details>
