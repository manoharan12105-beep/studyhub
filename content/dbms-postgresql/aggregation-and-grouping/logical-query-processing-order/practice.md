# Logical Query Processing Order — Practice

### P1. Put the steps in order

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** logical order

Which sequence is the logical processing order?

- A) SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY
- B) FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY
- C) FROM → GROUP BY → WHERE → HAVING → SELECT → ORDER BY
- D) FROM → WHERE → SELECT → GROUP BY → HAVING → ORDER BY

<details>
<summary>Answer</summary>

**Answer:** B)

**Explanation:** Rows are built (`FROM`), filtered (`WHERE`), grouped, groups filtered (`HAVING`), output computed (`SELECT`), then sorted. A is the written order; C filters rows after grouping; D computes the output before grouping.

</details>

### P2. Which clauses accept the alias?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** alias visibility

In PostgreSQL, `SELECT dept_id, count(*) AS n FROM employees …` — in which clause can `n` be used?

- A) `WHERE n > 1`
- B) `HAVING n > 1`
- C) `ORDER BY n DESC`
- D) `ORDER BY n * 2 DESC`

<details>
<summary>Answer</summary>

**Answer:** C)

**Explanation:** `WHERE` and `HAVING` run before the select list. `ORDER BY` accepts the alias only as a bare name, not inside an expression.

</details>

### P3. Fix the filter

**Difficulty:** Easy · **Type:** Debugging · **Concepts:** alias in WHERE

```sql
SELECT name, salary + COALESCE(commission, 0) AS total_pay
FROM employees
WHERE total_pay > 85000;
```

**Output:**

```text
ERROR:  column "total_pay" does not exist
LINE 3: WHERE total_pay > 85000;
              ^
```

Rewrite it so it lists employees whose total pay exceeds 85000, highest first.

<details>
<summary>Answer</summary>

Repeat the expression in `WHERE` (or use a derived table):

```sql
SELECT name, salary + COALESCE(commission, 0) AS total_pay
FROM employees
WHERE salary + COALESCE(commission, 0) > 85000
ORDER BY total_pay DESC, name;
```

**Output:**

```text
 name  | total_pay
-------+-----------
 Asha  |    150000
 Meena |     95000
 Ravi  |     95000
 Divya |     93000
(4 rows)
```

</details>

### P4. Latest order per customer with a window function

**Difficulty:** Medium · **Type:** Query · **Concepts:** window function then filter

Return each customer's most recent order using `row_number()`. Order by customer name.

**Expected output:**

```text
  name  | order_id | order_date
--------+----------+------------
 Anil   |      107 | 2026-03-15
 Bhavna |      106 | 2026-03-01
 Chirag |      104 | 2026-02-14
 Deepa  |      105 | 2026-02-20
 Eshan  |      108 | 2026-03-28
(5 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT name, order_id, order_date
FROM (SELECT c.name, o.order_id, o.order_date,
             row_number() OVER (PARTITION BY o.customer_id ORDER BY o.order_date DESC) AS rn
      FROM orders o
      JOIN customers c ON c.customer_id = o.customer_id) AS t
WHERE rn = 1
ORDER BY name;
```

**Explanation:** `rn` can be filtered only in the outer query, because the window function is computed after `WHERE`.

</details>

### P5. Revenue share per category

**Difficulty:** Medium · **Type:** Query · **Concepts:** window over aggregate

For non-cancelled orders, show revenue per category and its percentage of total revenue (one decimal). Highest first.

**Expected output:**

```text
  category   | revenue  | pct
-------------+----------+------
 Electronics | 61450.00 | 64.4
 Furniture   | 34000.00 | 35.6
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT p.category,
       sum(oi.quantity * oi.unit_price) AS revenue,
       round(100 * sum(oi.quantity * oi.unit_price)
                 / sum(sum(oi.quantity * oi.unit_price)) OVER (), 1) AS pct
FROM order_items oi
JOIN orders o   ON o.order_id = oi.order_id
JOIN products p ON p.product_id = oi.product_id
WHERE o.status <> 'CANCELLED'
GROUP BY p.category
ORDER BY revenue DESC;
```

**Explanation:** The window `sum(…) OVER ()` runs after grouping, over the per-category sums.

</details>

### P6. Trace the steps

**Difficulty:** Hard · **Type:** Conceptual · **Concepts:** step-by-step evaluation

Trace this query through each logical step and give the final result.

```sql
SELECT dept_id, count(*) AS n
FROM employees
WHERE salary >= 60000
GROUP BY dept_id
HAVING count(*) >= 2
ORDER BY n DESC, dept_id
LIMIT 2;
```

<details>
<summary>Answer</summary>

1. `FROM`: 12 employees.
2. `WHERE salary >= 60000`: removes Pooja (52000), Nisha (45000), Rahul (55000) → 9 rows.
3. `GROUP BY dept_id`: 10 → Asha, Ravi, Meena, Karan (4); 20 → Divya, Arjun, Sneha (3); 30 → Vikram (1); 40 → Farhan (1).
4. `HAVING count(*) >= 2`: keeps 10 and 20.
5. `SELECT`: `(10, 4)`, `(20, 3)`.
6. `ORDER BY n DESC, dept_id`, `LIMIT 2`: both rows.

```text
 dept_id | n
---------+---
      10 | 4
      20 | 3
(2 rows)
```

</details>
