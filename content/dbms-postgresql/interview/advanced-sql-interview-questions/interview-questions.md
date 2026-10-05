# Advanced SQL Interview Questions — Interview Questions

## Beginner

### Q1. What is the difference between an aggregate function and a window function?

<details>
<summary>Answer</summary>

An aggregate with `GROUP BY` collapses each group into one row. The same function with `OVER (…)` becomes a window function: every input row stays, and each gets a value computed over its window.

```sql
SELECT name, dept_id, salary,
       sum(salary) OVER (PARTITION BY dept_id) AS dept_payroll
FROM employees
WHERE dept_id = 30
ORDER BY emp_id;
```

**Output:**

```text
  name  | dept_id | salary | dept_payroll
--------+---------+--------+--------------
 Vikram |      30 |  70000 |       122000
 Pooja  |      30 |  52000 |       122000
(2 rows)
```

</details>

### Q2. What does `PARTITION BY` do inside `OVER`?

<details>
<summary>Answer</summary>

It splits the rows into independent groups for the window calculation, like `GROUP BY` without collapsing. Without `PARTITION BY`, the whole result is one partition. Ranks restart, running totals reset and `lag` does not cross from one partition into another.

</details>

### Q3. What is the `WINDOW` clause?

<details>
<summary>Answer</summary>

A named window definition reused by several window functions in the same query: `… rank() OVER w, lag(salary) OVER w … WINDOW w AS (PARTITION BY dept_id ORDER BY salary DESC)`. It avoids repetition. Window functions with identical definitions are computed in one sort.

</details>

## Intermediate

### Q4. Explain `ROWS`, `RANGE` and `GROUPS` frames.

<details>
<summary>Answer</summary>

The frame decides which rows of the partition a window aggregate sees, relative to the current row:

- `ROWS` counts physical rows: `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` is the last three rows.
- `RANGE` uses values of the `ORDER BY` column: `RANGE BETWEEN INTERVAL '7 days' PRECEDING AND CURRENT ROW` takes all rows within 7 days. Peers (equal values) are always included together.
- `GROUPS` counts peer groups: `GROUPS BETWEEN 1 PRECEDING AND CURRENT ROW` is the current set of ties plus the previous one.

With `ORDER BY` and no frame, the default is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`; without `ORDER BY` it is the whole partition.

</details>

### Q5. Produce subtotals per department and a grand total in one query.

<details>
<summary>Answer</summary>

```sql
SELECT CASE WHEN GROUPING(dept_id) = 1 THEN 'ALL' ELSE coalesce(dept_id::text, 'none') END AS dept,
       count(*) AS staff, sum(salary) AS payroll
FROM employees
GROUP BY ROLLUP (dept_id)
ORDER BY GROUPING(dept_id), dept_id NULLS LAST;
```

**Output:**

```text
 dept | staff | payroll
------+-------+---------
 10   |     4 |  412000
 20   |     4 |  263000
 30   |     2 |  122000
 40   |     1 |   82000
 none |     1 |   45000
 ALL  |    12 |  924000
(6 rows)
```

`GROUPING(dept_id)` is 1 on the grand-total row, which distinguishes it from the real `NULL` department (Nisha). `GROUPING SETS ((a), (b), ())` and `CUBE (a, b)` generalise this.

</details>

### Q6. What is `LATERAL`, and when do you need it?

<details>
<summary>Answer</summary>

`LATERAL` lets a subquery in `FROM` refer to columns of tables listed before it, so it runs once per outer row (like a correlated subquery that can return many rows and columns).

```sql
SELECT d.dept_name, top.name, top.salary
FROM departments d
CROSS JOIN LATERAL (
    SELECT name, salary FROM employees e
    WHERE e.dept_id = d.dept_id
    ORDER BY salary DESC, emp_id
    LIMIT 2
) top
ORDER BY d.dept_id, top.salary DESC;
```

**Output:**

```text
  dept_name  |  name  | salary
-------------+--------+--------
 Engineering | Asha   | 150000
 Engineering | Ravi   |  95000
 Sales       | Divya  |  88000
 Sales       | Arjun  |  60000
 HR          | Vikram |  70000
 HR          | Pooja  |  52000
 Finance     | Farhan |  82000
(7 rows)
```

Typical uses are top N per group with an index, and calling set-returning functions per row. Use `LEFT JOIN LATERAL … ON true` to keep outer rows that produce nothing (Research).

</details>

### Q7. How do you move rows from one table to another atomically in one statement?

<details>
<summary>Answer</summary>

A data-modifying CTE: delete with `RETURNING` and insert what was returned.

```sql
CREATE TABLE orders_archive (LIKE orders);
WITH moved AS (
    DELETE FROM orders WHERE status = 'CANCELLED' RETURNING *
)
INSERT INTO orders_archive SELECT * FROM moved;
SELECT (SELECT count(*) FROM orders) AS remaining, (SELECT count(*) FROM orders_archive) AS archived;
```

**Output:**

```text
 remaining | archived
-----------+----------
         7 |        1
(1 row)
```

Both parts run in one statement and one snapshot; either both happen or neither. (Order 104's items go with it through `ON DELETE CASCADE`.)

</details>

### Q8. How do you compute a median or a percentile?

<details>
<summary>Answer</summary>

With ordered-set aggregates:

```sql
SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY salary) AS median_interpolated,
       percentile_disc(0.5) WITHIN GROUP (ORDER BY salary) AS median_actual_value,
       percentile_cont(0.9) WITHIN GROUP (ORDER BY salary) AS p90
FROM employees;
```

**Output:**

```text
 median_interpolated | median_actual_value |  p90
---------------------+---------------------+-------
               71000 |               70000 | 95000
(1 row)
```

`percentile_cont` interpolates between the two middle values (70000 and 72000); `percentile_disc` returns an actual value from the data. `mode() WITHIN GROUP (ORDER BY x)` gives the most frequent value.

</details>

## Advanced

### Q9. Rewrite a correlated subquery as a window function, and explain when that is better.

<details>
<summary>Answer</summary>

Correlated: `WHERE salary = (SELECT max(salary) FROM employees x WHERE x.dept_id = e.dept_id)`. Window: compute `max(salary) OVER (PARTITION BY dept_id)` in a subquery and filter `salary = dept_max`. The window version reads the table once and sorts or hashes by department, which is predictable for large tables. The correlated version can be faster when only a few outer rows are needed and an index on `(dept_id, salary)` answers each probe. State both and pick by data size and indexes.

</details>

### Q10. Generate a calendar and a series of numbers without a table.

<details>
<summary>Answer</summary>

`generate_series` is a set-returning function:

```sql
SELECT d::date AS day, extract(isodow FROM d) AS iso_weekday
FROM generate_series(DATE '2026-03-01', DATE '2026-03-04', interval '1 day') AS d;
```

**Output:**

```text
    day     | iso_weekday
------------+-------------
 2026-03-01 |           7
 2026-03-02 |           1
 2026-03-03 |           2
 2026-03-04 |           3
(4 rows)
```

Portable alternative: a recursive CTE (`SELECT 1 UNION ALL SELECT n + 1 … WHERE n < 100`). Calendars are used to fill gaps in reports and to expand ranges into rows.

</details>

### Q11. What do `FILTER`, `GROUPING SETS` and conditional aggregation have in common?

<details>
<summary>Answer</summary>

All three compute several aggregates in **one pass** over the data instead of several queries joined together. `FILTER (WHERE …)` restricts the rows of one aggregate (a pivot column). `GROUPING SETS` produces several groupings at once (detail, subtotal, total). Interviewers like them because a solution that scans a large table once beats one that unions three scans.

</details>

### Q12. A query must return "the price in effect on each order date" from a `price_history(product_id, valid_from, price)` table. How?

<details>
<summary>Answer</summary>

For each order line, pick the latest history row with `valid_from <= order_date`:

```sql
-- Illustrative
SELECT oi.order_id, oi.product_id, ph.price
FROM order_items oi
JOIN orders o ON o.order_id = oi.order_id
CROSS JOIN LATERAL (
    SELECT price FROM price_history h
    WHERE h.product_id = oi.product_id AND h.valid_from <= o.order_date
    ORDER BY h.valid_from DESC
    LIMIT 1
) ph;
```

With an index on `price_history (product_id, valid_from DESC)` each lookup is one index probe. Alternatives: store `valid_to` and join on `order_date >= valid_from AND order_date < valid_to`, or a `daterange` column with a GiST index and an exclusion constraint against overlaps.

</details>
