# Window Functions Basics — Practice

### P1. Department headcount on every row

**Difficulty:** Easy · **Type:** Query · **Concepts:** count OVER PARTITION BY

List Sales and HR employees with the size of their department on each row. Order by department, then name.

**Expected output:**

```text
  name  | dept_id | dept_size
--------+---------+-----------
 Arjun  |      20 |         4
 Divya  |      20 |         4
 Rahul  |      20 |         4
 Sneha  |      20 |         4
 Pooja  |      30 |         2
 Vikram |      30 |         2
(6 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT name, dept_id, count(*) OVER (PARTITION BY dept_id) AS dept_size
FROM employees
WHERE dept_id IN (20, 30)
ORDER BY dept_id, name;
```

</details>

### P2. Predict the output

**Difficulty:** Easy · **Type:** Output · **Concepts:** default frame with ties

```sql
-- Illustrative
SELECT x, sum(x) OVER (ORDER BY x) AS s
FROM (VALUES (1), (2), (2), (3)) AS t(x);
```

What are the four values of `s`?

- A) 1, 3, 5, 8
- B) 1, 5, 5, 8
- C) 8, 8, 8, 8
- D) 1, 2, 2, 3

<details>
<summary>Answer</summary>

**Answer:** B) 1, 5, 5, 8

**Explanation:** With `ORDER BY` and no explicit frame, the frame is `RANGE … CURRENT ROW`, which includes all peers. Both rows with `x = 2` see 1 + 2 + 2 = 5. A would need `ROWS`; C is `OVER ()`.

</details>

### P3. Cumulative orders per month

**Difficulty:** Medium · **Type:** Query · **Concepts:** window over aggregate, running total

Show the number of orders per month and the cumulative count up to that month.

**Expected output:**

```text
   month    | orders | cumulative
------------+--------+------------
 2026-01-01 |      2 |          2
 2026-02-01 |      3 |          5
 2026-03-01 |      3 |          8
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT date_trunc('month', order_date)::date AS month,
       count(*) AS orders,
       sum(count(*)) OVER (ORDER BY date_trunc('month', order_date)) AS cumulative
FROM orders
GROUP BY date_trunc('month', order_date)
ORDER BY month;
```

**Explanation:** The window runs after grouping, over one row per month. Months are unique, so the default frame is a correct running total here.

</details>

### P4. Difference from the department maximum

**Difficulty:** Medium · **Type:** Query · **Concepts:** max OVER PARTITION BY

For Engineering, show each employee's salary and how far it is below the department's top salary.

**Expected output:**

```text
 name  | salary | below_top
-------+--------+-----------
 Asha  | 150000 |         0
 Meena |  95000 |     55000
 Ravi  |  95000 |     55000
 Karan |  72000 |     78000
(4 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT name, salary,
       max(salary) OVER (PARTITION BY dept_id) - salary AS below_top
FROM employees
WHERE dept_id = 10
ORDER BY salary DESC, name;
```

</details>

### P5. Fix the percentage

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** WHERE before window

The report should list Finance employees with their share of the **company** payroll, but it shows 100%:

```sql
SELECT name, round(100.0 * salary / sum(salary) OVER (), 1) AS pct
FROM employees
WHERE dept_id = 40;
```

**Output:**

```text
  name  |  pct
--------+-------
 Farhan | 100.0
(1 row)
```

<details>
<summary>Answer</summary>

`WHERE` removes the other employees before the window function runs, so `sum(salary) OVER ()` is Finance's payroll. Compute the window over all rows first, then filter:

```sql
SELECT name, pct
FROM (SELECT name, dept_id,
             round(100.0 * salary / sum(salary) OVER (), 1) AS pct
      FROM employees) AS t
WHERE dept_id = 40;
```

**Output:**

```text
  name  | pct
--------+-----
 Farhan | 8.9
(1 row)
```

</details>

### P6. Three-order moving sum per customer

**Difficulty:** Hard · **Type:** Query · **Concepts:** ROWS frame, PARTITION BY

For each order (all statuses), show the customer and the sum of that order's value and the customer's previous two orders' values (by date).

**Expected output:**

```text
 customer_id | order_id |  amount  | last_three
-------------+----------+----------+------------
           1 |      101 | 56000.00 |   56000.00
           1 |      103 |  1500.00 |   57500.00
           1 |      107 | 12500.00 |   70000.00
           2 |      102 | 17000.00 |   17000.00
           2 |      106 |  1950.00 |   18950.00
           3 |      104 | 55000.00 |   55000.00
           4 |      105 |  5000.00 |    5000.00
           5 |      108 |  1500.00 |    1500.00
(8 rows)
```

<details>
<summary>Hint</summary>

Aggregate order values in a CTE first; then `sum(amount) OVER (PARTITION BY customer_id ORDER BY order_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)`.

</details>

<details>
<summary>Solution</summary>

```sql
WITH order_totals AS (
    SELECT o.order_id, o.customer_id, o.order_date, sum(oi.quantity * oi.unit_price) AS amount
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.order_id
    GROUP BY o.order_id
)
SELECT customer_id, order_id, amount,
       sum(amount) OVER (PARTITION BY customer_id ORDER BY order_date
                         ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS last_three
FROM order_totals
ORDER BY customer_id, order_date;
```

**Explanation:** Anil's third order sums all three of his orders; Bhavna has only two orders, so her second row sums two.

</details>
