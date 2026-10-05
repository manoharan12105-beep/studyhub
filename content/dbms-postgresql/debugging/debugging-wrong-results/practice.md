# Debugging Wrong Query Results — Practice

Problems use the [sample database](../../sql-fundamentals/dbms-sample-database/content.md) unless they define their own tables. Each gives a broken query and its output; write the corrected query.

### P1. The missing customers

**Difficulty:** Easy · **Type:** Debugging · **Concepts:** LEFT JOIN, ON vs WHERE

This should list every customer with the number of orders shipped or delivered (0 if none), but Chirag and Fatima are missing:

```sql
SELECT c.name, count(o.order_id) AS fulfilled
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE o.status IN ('SHIPPED', 'DELIVERED')
GROUP BY c.customer_id, c.name
ORDER BY c.customer_id;
```

**Output:**

```text
  name  | fulfilled
--------+-----------
 Anil   |         3
 Bhavna |         1
 Deepa  |         1
 Eshan  |         1
(4 rows)
```

**Expected output:**

```text
  name  | fulfilled
--------+-----------
 Anil   |         3
 Bhavna |         1
 Chirag |         0
 Deepa  |         1
 Eshan  |         1
 Fatima |         0
(6 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT c.name, count(o.order_id) AS fulfilled
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status IN ('SHIPPED', 'DELIVERED')
GROUP BY c.customer_id, c.name
ORDER BY c.customer_id;
```

**Explanation:** The status filter moved into `ON`. `count(o.order_id)` counts only matched orders, so unmatched customers show 0.

</details>

### P2. Nobody without a department?

**Difficulty:** Easy · **Type:** Debugging · **Concepts:** NULL comparison

```sql
SELECT name FROM employees WHERE dept_id = NULL OR dept_id = 50;
```

**Output:**

```text
 name
------
(0 rows)
```

The query should list employees with no department or in department 50.

**Expected output:**

```text
 name
-------
 Nisha
(1 row)
```

<details>
<summary>Solution</summary>

```sql
SELECT name FROM employees WHERE dept_id IS NULL OR dept_id = 50;
```

**Explanation:** `dept_id = NULL` is never true. Department 50 (Research) has nobody, so only Nisha remains.

</details>

### P3. Double-counted revenue

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** fan-out

**Schema and data:**

```sql
CREATE TABLE order_tags (order_id int, tag text);
INSERT INTO order_tags VALUES (101, 'gift'), (101, 'express'), (107, 'express');
```

This should show revenue per customer for customers 1 and 2:

```sql
SELECT o.customer_id, sum(oi.quantity * oi.unit_price) AS revenue
FROM orders o
JOIN order_items oi    ON oi.order_id = o.order_id
LEFT JOIN order_tags t ON t.order_id = o.order_id
WHERE o.customer_id IN (1, 2)
GROUP BY o.customer_id
ORDER BY o.customer_id;
```

**Output:**

```text
 customer_id |  revenue
-------------+-----------
           1 | 126000.00
           2 |  18950.00
(2 rows)
```

**Expected output:**

```text
 customer_id | revenue
-------------+----------
           1 | 70000.00
           2 | 18950.00
(2 rows)
```

<details>
<summary>Hint</summary>

Order 101 has two tags. How many times does each of its item rows appear?

</details>

<details>
<summary>Solution</summary>

```sql
SELECT o.customer_id, sum(oi.quantity * oi.unit_price) AS revenue
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
WHERE o.customer_id IN (1, 2)
GROUP BY o.customer_id
ORDER BY o.customer_id;
```

**Explanation:** The tags were not needed for revenue at all. If they are (for example "revenue of express orders"), filter with `EXISTS (SELECT 1 FROM order_tags …)` instead of joining.

</details>

### P4. The empty exclusion list

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** NOT IN with NULL

**Schema and data:**

```sql
CREATE TABLE blocked_emails (email text);
INSERT INTO blocked_emails VALUES ('ravi@corp.com'), (NULL);
```

A newsletter query should email every employee who is not blocked, but returns nothing:

```sql
SELECT name FROM employees
WHERE email NOT IN (SELECT email FROM blocked_emails)
ORDER BY emp_id
LIMIT 3;
```

**Output:**

```text
 name
------
(0 rows)
```

**Expected output:**

```text
 name
-------
 Asha
 Meena
 Divya
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT e.name FROM employees e
WHERE e.email IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM blocked_emails b WHERE b.email = e.email)
ORDER BY e.emp_id
LIMIT 3;
```

**Explanation:** The `NULL` row in `blocked_emails` made `NOT IN` unknown for everyone. Karan (no email) is excluded explicitly, because he cannot be emailed.

</details>

### P5. Monthly headcount split in two

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** GROUP BY grain

This should count hires per year, but it shows one row per hire date:

```sql
SELECT extract(year FROM hire_date) AS year, count(*) AS hires
FROM employees
WHERE hire_date >= '2022-01-01'
GROUP BY hire_date
ORDER BY year;
```

**Output:**

```text
 year | hires
------+-------
 2022 |     1
 2023 |     1
 2024 |     1
 2024 |     1
(4 rows)
```

**Expected output:**

```text
 year | hires
------+-------
 2022 |     1
 2023 |     1
 2024 |     2
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT extract(year FROM hire_date) AS year, count(*) AS hires
FROM employees
WHERE hire_date >= '2022-01-01'
GROUP BY 1
ORDER BY year;
```

**Explanation:** The query grouped by the full date, which is finer than the year shown. Group by the same expression that is displayed.

</details>

### P6. Last order shows the current order

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** last_value, window frame

This should show, next to every order of customer 1, the customer's most recent order id (107):

```sql
SELECT order_id, order_date,
       last_value(order_id) OVER (PARTITION BY customer_id ORDER BY order_date) AS latest_order
FROM orders
WHERE customer_id = 1
ORDER BY order_date;
```

**Output:**

```text
 order_id | order_date | latest_order
----------+------------+--------------
      101 | 2026-01-05 |          101
      103 | 2026-02-03 |          103
      107 | 2026-03-15 |          107
(3 rows)
```

**Expected output:**

```text
 order_id | order_date | latest_order
----------+------------+--------------
      101 | 2026-01-05 |          107
      103 | 2026-02-03 |          107
      107 | 2026-03-15 |          107
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT order_id, order_date,
       last_value(order_id) OVER (PARTITION BY customer_id ORDER BY order_date
                                  ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS latest_order
FROM orders
WHERE customer_id = 1
ORDER BY order_date;
```

**Alternative:** `first_value(order_id) OVER (PARTITION BY customer_id ORDER BY order_date DESC)` needs no frame change.

**Explanation:** The default frame ends at the current row, so the "last" value in it is always the current row.

</details>
