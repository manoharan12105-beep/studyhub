# Nth-Highest and Top-N Problems

**Module:** SQL Problem Solving · **Interview priority:** Core

## What Is It?

A family of interview problems that all ask for rows ranked by a value: the **second-highest salary**, the **Nth-highest salary**, the **highest or top 3 salaries per department**, employees **above their department's average**, the **latest record per user**, and the **first and last transaction** of each customer.

All of them reduce to two decisions:

1. **Rank within what?** The whole table, or each group (department, customer)?
2. **What about ties?** Is "second highest" the second distinct value, or the second row?

Every example below uses the [sample database](../../sql-fundamentals/dbms-sample-database/content.md).

## Why It Matters

- "Second-highest salary" is probably the most asked SQL interview question; follow-ups add `N`, groups and ties.
- The same patterns answer real backend queries: a user's latest login, a product's current price, each customer's first order.
- Interviewers judge whether you handle ties, empty results and NULLs, and whether you know more than one approach.

## Core Concept

### Ties decide the ranking function

Engineering salaries are `150000, 95000, 95000, 72000`.

| Function | Values ranked | "Top 2" returns |
|----------|---------------|-----------------|
| `ROW_NUMBER()` | 1, 2, 3, 4 | 150000 and one arbitrary 95000 |
| `RANK()` | 1, 2, 2, 4 | 150000 and both 95000s |
| `DENSE_RANK()` | 1, 2, 2, 3 | 150000 and both 95000s; rank 3 = 72000 |

- "Nth-highest **salary**" (a value) → `DENSE_RANK` or `DISTINCT`.
- "Top N **employees**" with ties included → `RANK` or `DENSE_RANK`.
- "Exactly N rows" / "one row per group" → `ROW_NUMBER` with a deterministic tiebreaker.

See [Ranking Window Functions](../../window-functions/ranking-window-functions/content.md).

### Approaches

| Approach | Good for | Notes |
|----------|----------|-------|
| `max(x) WHERE x < (SELECT max(x) …)` | Second highest only | Simple; does not generalise to N |
| `SELECT DISTINCT x ORDER BY x DESC OFFSET n-1 LIMIT 1` | Nth highest overall | Wrap in a scalar subquery to get `NULL` when missing |
| `DENSE_RANK() OVER (ORDER BY x DESC)` | Nth highest, per group with `PARTITION BY` | Most general; filter in an outer query |
| Correlated `count(DISTINCT …)` | Nth highest without window functions | O(n²) without an index; classic textbook answer |
| `DISTINCT ON (group) … ORDER BY group, x DESC` | One row per group (PostgreSQL) | Short and fast; one row only, ties broken by `ORDER BY` |
| `LATERAL (… ORDER BY x DESC LIMIT n)` | Top N per group with an index | Uses an index per group; best for "latest N per user" |

### Window results cannot be filtered in `WHERE`

Window functions run after `WHERE` (see [Logical Query Processing Order](../../aggregation-and-grouping/logical-query-processing-order/content.md)), so `WHERE dense_rank() … = 2` is an error. Compute the rank in a CTE or subquery and filter outside.

## Syntax

```sql
-- Illustrative
-- Nth highest value overall
SELECT (SELECT DISTINCT x FROM t ORDER BY x DESC OFFSET n - 1 LIMIT 1) AS nth;

-- Top N per group
SELECT * FROM (
    SELECT t.*, DENSE_RANK() OVER (PARTITION BY g ORDER BY x DESC) AS rnk
    FROM t
) ranked
WHERE rnk <= n;

-- One row per group (PostgreSQL)
SELECT DISTINCT ON (g) * FROM t ORDER BY g, x DESC, id;
```

## Examples

### E1. Second-highest salary — three ways

```sql
SELECT max(salary) AS second_highest
FROM employees
WHERE salary < (SELECT max(salary) FROM employees);

SELECT (SELECT DISTINCT salary FROM employees
        ORDER BY salary DESC OFFSET 1 LIMIT 1) AS second_highest;

SELECT DISTINCT salary AS second_highest
FROM (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
      FROM employees) ranked
WHERE rnk = 2;
```

**Output:**

```text
 second_highest
----------------
          95000
(1 row)

 second_highest
----------------
          95000
(1 row)

 second_highest
----------------
          95000
(1 row)
```

Two employees earn 95000; all three queries return the value once. `ORDER BY salary DESC OFFSET 1 LIMIT 1` **without** `DISTINCT` would also return 95000 here, but only by coincidence — with salaries `150000, 150000, 95000` it would return 150000.

### E2. When there is no second-highest value

```sql
SELECT DISTINCT salary FROM employees WHERE dept_id = 40
ORDER BY salary DESC OFFSET 1 LIMIT 1;

SELECT (SELECT DISTINCT salary FROM employees WHERE dept_id = 40
        ORDER BY salary DESC OFFSET 1 LIMIT 1) AS second_highest;
```

**Output:**

```text
 salary
--------
(0 rows)

 second_highest
----------------
           NULL
(1 row)
```

Finance has one employee. The bare query returns **no rows**; the scalar subquery returns **one row containing `NULL`**, which is what "return NULL if there is no second-highest salary" asks for.

### E3. Nth-highest salary as a reusable function

```sql
CREATE FUNCTION nth_highest_salary(n integer) RETURNS integer
LANGUAGE sql STABLE
RETURN (SELECT DISTINCT salary FROM employees
        ORDER BY salary DESC OFFSET n - 1 LIMIT 1);

SELECT n, nth_highest_salary(n) FROM (VALUES (1), (2), (3), (11), (20)) AS v(n);
```

**Output:**

```text
 n  | nth_highest_salary
----+--------------------
  1 |             150000
  2 |              95000
  3 |              88000
 11 |               NULL
 20 |               NULL
(5 rows)
```

There are 10 distinct salaries, so `n = 11` and `n = 20` return `NULL`. (`OFFSET` must not be negative, so a production version would also reject `n < 1`.) The SQL-standard `RETURN` body form needs PostgreSQL 14+; see [Functions and Procedures](../../functions-procedures-triggers/postgresql-functions-and-procedures/content.md).

### E4. Nth highest without window functions (correlated subquery)

```sql
SELECT DISTINCT e1.salary AS third_highest
FROM employees e1
WHERE 2 = (SELECT count(DISTINCT e2.salary)
           FROM employees e2
           WHERE e2.salary > e1.salary);
```

**Output:**

```text
 third_highest
---------------
         88000
(1 row)
```

A salary is the Nth highest when exactly `N − 1` distinct salaries are larger. It works on any SQL database but re-runs the subquery for each row.

### E5. Highest salary per department

```sql
SELECT d.dept_name, e.name, e.salary
FROM employees e
JOIN departments d ON d.dept_id = e.dept_id
WHERE e.salary = (SELECT max(salary) FROM employees x WHERE x.dept_id = e.dept_id)
ORDER BY d.dept_name;
```

**Output:**

```text
  dept_name  |  name  | salary
-------------+--------+--------
 Engineering | Asha   | 150000
 Finance     | Farhan |  82000
 HR          | Vikram |  70000
 Sales       | Divya  |  88000
(4 rows)
```

The correlated subquery returns every employee who ties for the maximum. Nisha (no department) is excluded by the inner join.

The PostgreSQL shortcut `DISTINCT ON` keeps exactly one row per department:

```sql
SELECT DISTINCT ON (e.dept_id) d.dept_name, e.name, e.salary
FROM employees e
JOIN departments d ON d.dept_id = e.dept_id
ORDER BY e.dept_id, e.salary DESC, e.emp_id;
```

**Output:**

```text
  dept_name  |  name  | salary
-------------+--------+--------
 Engineering | Asha   | 150000
 Sales       | Divya  |  88000
 HR          | Vikram |  70000
 Finance     | Farhan |  82000
(4 rows)
```

See [DISTINCT ON](../../postgresql-features/distinct-on/content.md).

### E6. Top 3 salaries per department — ties matter

```sql
WITH ranked AS (
    SELECT dept_id, name, salary,
           ROW_NUMBER() OVER w AS rn,
           RANK()       OVER w AS rnk,
           DENSE_RANK() OVER w AS drnk
    FROM employees
    WHERE dept_id IN (10, 20)
    WINDOW w AS (PARTITION BY dept_id ORDER BY salary DESC, emp_id)
)
SELECT * FROM ranked ORDER BY dept_id, salary DESC, name;
```

**Output:**

```text
 dept_id | name  | salary | rn | rnk | drnk
---------+-------+--------+----+-----+------
      10 | Asha  | 150000 |  1 |   1 |    1
      10 | Meena |  95000 |  3 |   3 |    3
      10 | Ravi  |  95000 |  2 |   2 |    2
      10 | Karan |  72000 |  4 |   4 |    4
      20 | Divya |  88000 |  1 |   1 |    1
      20 | Arjun |  60000 |  2 |   2 |    2
      20 | Sneha |  60000 |  3 |   3 |    3
      20 | Rahul |  55000 |  4 |   4 |    4
(8 rows)
```

`RANK` and `DENSE_RANK` show no ties here, because including `emp_id` in the window's `ORDER BY` made every row unique. Ties only exist when the `ORDER BY` has ties, so use the tiebreaker for `ROW_NUMBER` only:

```sql
WITH ranked AS (
    SELECT dept_id, name, salary,
           ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC, emp_id) AS rn,
           RANK()       OVER (PARTITION BY dept_id ORDER BY salary DESC)         AS rnk,
           DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC)         AS drnk
    FROM employees
    WHERE dept_id IN (10, 20)
)
SELECT * FROM ranked ORDER BY dept_id, salary DESC, name;
```

**Output:**

```text
 dept_id | name  | salary | rn | rnk | drnk
---------+-------+--------+----+-----+------
      10 | Asha  | 150000 |  1 |   1 |    1
      10 | Meena |  95000 |  3 |   2 |    2
      10 | Ravi  |  95000 |  2 |   2 |    2
      10 | Karan |  72000 |  4 |   4 |    3
      20 | Divya |  88000 |  1 |   1 |    1
      20 | Arjun |  60000 |  2 |   2 |    2
      20 | Sneha |  60000 |  3 |   2 |    2
      20 | Rahul |  55000 |  4 |   4 |    3
(8 rows)
```

"Top 3 salaries" (values) is `drnk <= 3`: all four Engineering employees, because two share the second-highest salary. "Top 3 earners, exactly three rows" is `rn <= 3`.

```sql
SELECT d.dept_name, r.name, r.salary
FROM (SELECT e.*, DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS drnk
      FROM employees e) r
JOIN departments d ON d.dept_id = r.dept_id
WHERE r.drnk <= 3
ORDER BY d.dept_name, r.salary DESC, r.name;
```

**Output:**

```text
  dept_name  |  name  | salary
-------------+--------+--------
 Engineering | Asha   | 150000
 Engineering | Meena  |  95000
 Engineering | Ravi   |  95000
 Engineering | Karan  |  72000
 Finance     | Farhan |  82000
 HR          | Vikram |  70000
 HR          | Pooja  |  52000
 Sales       | Divya  |  88000
 Sales       | Arjun  |  60000
 Sales       | Sneha  |  60000
 Sales       | Rahul  |  55000
(11 rows)
```

### E7. Employees earning above their department average

```sql
SELECT e.name, e.dept_id, e.salary
FROM employees e
WHERE e.salary > (SELECT avg(x.salary) FROM employees x WHERE x.dept_id = e.dept_id)
ORDER BY e.dept_id, e.name;
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

The same result with a window average computed once per department:

```sql
SELECT name, dept_id, salary, round(dept_avg) AS dept_avg
FROM (SELECT e.*, avg(salary) OVER (PARTITION BY dept_id) AS dept_avg
      FROM employees e) t
WHERE salary > dept_avg
ORDER BY dept_id, name;
```

**Output:**

```text
  name  | dept_id | salary | dept_avg
--------+---------+--------+----------
 Asha   |      10 | 150000 |   103000
 Divya  |      20 |  88000 |    65750
 Vikram |      30 |  70000 |    61000
(3 rows)
```

Nisha (`dept_id` NULL) is absent from both. In the correlated version, `x.dept_id = NULL` matches nothing, so her average is `NULL` and the comparison is unknown. In the window version she forms her own `NULL` partition, and her salary is not greater than its own average.

### E8. Latest order per customer

```sql
SELECT DISTINCT ON (customer_id) customer_id, order_id, order_date, status
FROM orders
ORDER BY customer_id, order_date DESC, order_id DESC;
```

**Output:**

```text
 customer_id | order_id | order_date |  status
-------------+----------+------------+-----------
           1 |      107 | 2026-03-15 | DELIVERED
           2 |      106 | 2026-03-01 | PLACED
           3 |      104 | 2026-02-14 | CANCELLED
           4 |      105 | 2026-02-20 | DELIVERED
           5 |      108 | 2026-03-28 | DELIVERED
(5 rows)
```

Portable version with `ROW_NUMBER`:

```sql
SELECT customer_id, order_id, order_date, status
FROM (SELECT o.*, ROW_NUMBER() OVER (PARTITION BY customer_id
                                     ORDER BY order_date DESC, order_id DESC) AS rn
      FROM orders o) t
WHERE rn = 1
ORDER BY customer_id;
```

**Output:**

```text
 customer_id | order_id | order_date |  status
-------------+----------+------------+-----------
           1 |      107 | 2026-03-15 | DELIVERED
           2 |      106 | 2026-03-01 | PLACED
           3 |      104 | 2026-02-14 | CANCELLED
           4 |      105 | 2026-02-20 | DELIVERED
           5 |      108 | 2026-03-28 | DELIVERED
(5 rows)
```

When the customers come from their own table (including those with no orders), `LEFT JOIN LATERAL` fetches the latest order per customer. With an index on `orders (customer_id, order_date DESC)` each lookup is a single index probe:

```sql
SELECT c.name, o.order_id, o.order_date
FROM customers c
LEFT JOIN LATERAL (
    SELECT order_id, order_date
    FROM orders
    WHERE orders.customer_id = c.customer_id
    ORDER BY order_date DESC, order_id DESC
    LIMIT 1
) o ON true
ORDER BY c.customer_id;
```

**Output:**

```text
  name  | order_id | order_date
--------+----------+------------
 Anil   |      107 | 2026-03-15
 Bhavna |      106 | 2026-03-01
 Chirag |      104 | 2026-02-14
 Deepa  |      105 | 2026-02-20
 Eshan  |      108 | 2026-03-28
 Fatima |     NULL | NULL
(6 rows)
```

### E9. First and last order of each customer

```sql
SELECT customer_id,
       count(*) AS orders,
       min(order_date) AS first_date,
       max(order_date) AS last_date,
       (array_agg(order_id ORDER BY order_date, order_id))[1]           AS first_order,
       (array_agg(order_id ORDER BY order_date DESC, order_id DESC))[1] AS last_order
FROM orders
GROUP BY customer_id
ORDER BY customer_id;
```

**Output:**

```text
 customer_id | orders | first_date | last_date  | first_order | last_order
-------------+--------+------------+------------+-------------+------------
           1 |      3 | 2026-01-05 | 2026-03-15 |         101 |        107
           2 |      2 | 2026-01-12 | 2026-03-01 |         102 |        106
           3 |      1 | 2026-02-14 | 2026-02-14 |         104 |        104
           4 |      1 | 2026-02-20 | 2026-02-20 |         105 |        105
           5 |      1 | 2026-03-28 | 2026-03-28 |         108 |        108
(5 rows)
```

`min`/`max` give the dates; ordered `array_agg(...)[1]` gives the matching ids in one pass. With window functions, use `first_value` and `last_value` with a full frame — the default frame makes `last_value` return the current row (see [Value Window Functions](../../window-functions/value-window-functions/content.md)).

## Comparison

| Problem | Recommended (PostgreSQL) | Portable alternative |
|---------|--------------------------|----------------------|
| Second highest value | Scalar subquery with `DISTINCT … OFFSET 1 LIMIT 1` | `max(x) WHERE x < (SELECT max(x) …)` |
| Nth highest value | `DENSE_RANK() = n` or `OFFSET n-1` | Correlated `count(DISTINCT …) = n-1` |
| Max per group, ties included | `RANK() = 1` or correlated `= max` | Join to `GROUP BY` max |
| One row per group | `DISTINCT ON` | `ROW_NUMBER() = 1` |
| Top N per group | `DENSE_RANK`/`ROW_NUMBER` ≤ N | `LATERAL … LIMIT N` with an index |
| Above group average | Window `avg() OVER (PARTITION BY …)` | Correlated subquery |

Performance: window-function solutions scan and sort the table once (`O(n log n)`). `LATERAL … LIMIT` with a matching index costs one index probe per group, which wins when there are few groups relative to rows. Correlated subqueries without an index are `O(n²)`.

## Common Mistakes

- `ORDER BY salary DESC OFFSET 1 LIMIT 1` without `DISTINCT` — returns the second **row**, not the second value.
- Returning no rows instead of `NULL` when the Nth value does not exist.
- Using `ROW_NUMBER` for "top 3 salaries" and silently dropping tied employees.
- Adding a unique tiebreaker to the window `ORDER BY` of `RANK`/`DENSE_RANK`, which removes all ties.
- Filtering a window function in `WHERE` instead of an outer query.
- `DISTINCT ON` columns that do not match the leftmost `ORDER BY` expressions (an error).
- `last_value()` with the default frame.
- Forgetting rows with a `NULL` group (employees without a department).

## Revision

- First decide: per table or per group (`PARTITION BY`), and value or row (`DENSE_RANK` vs `ROW_NUMBER`).
- Second highest: `max(x) WHERE x < max`, `DISTINCT … OFFSET 1 LIMIT 1` in a scalar subquery (gives `NULL`), or `DENSE_RANK() = 2`.
- Top N per group: rank in a CTE/subquery, filter `≤ N` outside; `LATERAL … LIMIT N` with an index for big tables.
- One row per group: `DISTINCT ON (g) … ORDER BY g, x DESC, tiebreaker`.
- Above group average: correlated `avg` or window `avg() OVER (PARTITION BY g)`.
- First/last per group: `min`/`max`, ordered `array_agg(...)[1]`, or `first_value`/`last_value` with a full frame.

## Quick Revision

Rank, then filter. Use `DENSE_RANK` for Nth-highest values, `ROW_NUMBER` with a tiebreaker for exactly N rows, and `DISTINCT ON` for one row per group. Wrap the result in a scalar subquery when "none" must return `NULL`.
