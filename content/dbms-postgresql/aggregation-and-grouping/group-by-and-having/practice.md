# GROUP BY and HAVING — Practice

### P1. Products per category

**Difficulty:** Easy · **Type:** Query · **Concepts:** GROUP BY, count, min, max

For each product category, show the number of products and the cheapest and dearest price. Order by category.

**Expected output:**

```text
  category   | products | cheapest | dearest
-------------+----------+----------+----------
 Electronics |        3 |   500.00 | 55000.00
 Furniture   |        2 |  4500.00 |  8000.00
 Stationery  |        1 |    50.00 |    50.00
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT category, count(*) AS products, min(price) AS cheapest, max(price) AS dearest
FROM products
GROUP BY category
ORDER BY category;
```

</details>

### P2. WHERE or HAVING?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** WHERE vs HAVING

Which clause should hold the condition `status <> 'CANCELLED'` in a query that counts orders per customer and keeps customers with at least two such orders?

- A) Both conditions in `WHERE`
- B) `status <> 'CANCELLED'` in `WHERE`, `count(*) >= 2` in `HAVING`
- C) Both conditions in `HAVING`
- D) `status <> 'CANCELLED'` in `HAVING`, `count(*) >= 2` in `WHERE`

<details>
<summary>Answer</summary>

**Answer:** B)

**Explanation:** The status test is about individual rows — it belongs in `WHERE`. The count is about groups — it can only be in `HAVING`. A and D put an aggregate in `WHERE` (an error). C fails because `status` is not grouped.

</details>

### P3. Customers with at least two valid orders

**Difficulty:** Easy · **Type:** Query · **Concepts:** WHERE, HAVING

List customers with at least two non-cancelled orders, with the count.

**Expected output:**

```text
  name  | orders
--------+--------
 Anil   |      3
 Bhavna |      2
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT c.name, count(*) AS orders
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
WHERE o.status <> 'CANCELLED'
GROUP BY c.customer_id
HAVING count(*) >= 2
ORDER BY orders DESC, c.name;
```

**Explanation:** `c.name` may be selected because `c.customer_id`, the primary key of `customers`, is grouped.

</details>

### P4. Order value summary

**Difficulty:** Medium · **Type:** Query · **Concepts:** grouping by expression, aggregate of a product

For each order, compute the number of items (sum of quantities) and the order value. Show only orders worth more than 5000, highest first.

**Expected output:**

```text
 order_id | items | order_value
----------+-------+-------------
      101 |     3 |    56000.00
      104 |     1 |    55000.00
      102 |     3 |    17000.00
      107 |     2 |    12500.00
(4 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT order_id,
       sum(quantity)              AS items,
       sum(quantity * unit_price) AS order_value
FROM order_items
GROUP BY order_id
HAVING sum(quantity * unit_price) > 5000
ORDER BY order_value DESC;
```

</details>

### P5. Pivot: hires per year by department

**Difficulty:** Medium · **Type:** Query · **Concepts:** FILTER, pivot

For each department (excluding employees without one), show how many people were hired before 2018, in 2018–2021, and from 2022 on. Order by department.

**Expected output:**

```text
 dept_id | before_2018 | y2018_2021 | from_2022
---------+-------------+------------+-----------
      10 |           2 |          2 |         0
      20 |           1 |          1 |         2
      30 |           0 |          1 |         1
      40 |           0 |          1 |         0
(4 rows)
```

<details>
<summary>Hint</summary>

One `count(*) FILTER (WHERE …)` per column, using `extract(year FROM hire_date)`.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT dept_id,
       count(*) FILTER (WHERE extract(year FROM hire_date) < 2018)            AS before_2018,
       count(*) FILTER (WHERE extract(year FROM hire_date) BETWEEN 2018 AND 2021) AS y2018_2021,
       count(*) FILTER (WHERE extract(year FROM hire_date) >= 2022)           AS from_2022
FROM employees
WHERE dept_id IS NOT NULL
GROUP BY dept_id
ORDER BY dept_id;
```

</details>

### P6. Why is Research missing — and why is its count wrong?

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** empty groups, count(*) after LEFT JOIN

A developer wants headcount for **every** department. First attempt:

```sql
SELECT dept_id, count(*) AS headcount
FROM employees
WHERE dept_id IS NOT NULL
GROUP BY dept_id
ORDER BY dept_id;
```

**Output:**

```text
 dept_id | headcount
---------+-----------
      10 |         4
      20 |         4
      30 |         2
      40 |         1
(4 rows)
```

Second attempt, starting from departments:

```sql
SELECT d.dept_name, count(*) AS headcount
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.dept_id
GROUP BY d.dept_id
ORDER BY d.dept_id;
```

**Output:**

```text
  dept_name  | headcount
-------------+-----------
 Engineering |         4
 Sales       |         4
 HR          |         2
 Finance     |         1
 Research    |         1
(5 rows)
```

Explain both problems and fix the second query.

<details>
<summary>Answer</summary>

The first query groups `employees`; Research has no employee rows, so there is nothing to group and no output row. The second keeps Research through the `LEFT JOIN`, but its one padded row (all `e.*` columns `NULL`) is counted by `count(*)`. Count a column of the right table, which is `NULL` on the padded row:

```sql
SELECT d.dept_name, count(e.emp_id) AS headcount
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.dept_id
GROUP BY d.dept_id
ORDER BY d.dept_id;
```

**Output:**

```text
  dept_name  | headcount
-------------+-----------
 Engineering |         4
 Sales       |         4
 HR          |         2
 Finance     |         1
 Research    |         0
(5 rows)
```

</details>

### P7. Category subtotals

**Difficulty:** Hard · **Type:** Query · **Concepts:** ROLLUP, GROUPING, COALESCE

Show quantity sold per category and product (all orders except cancelled ones), with a subtotal per category labelled `All products` and a final `All categories` row. Order categories alphabetically with subtotals after their products and the grand total last.

**Expected output:**

```text
    category    |   product    | qty
----------------+--------------+-----
 Electronics    | Keyboard     |   2
 Electronics    | Laptop       |   1
 Electronics    | Mouse        |   7
 Electronics    | All products |  10
 Furniture      | Chair        |   4
 Furniture      | Desk         |   2
 Furniture      | All products |   6
 All categories | All products |  16
(8 rows)
```

<details>
<summary>Hint</summary>

`GROUP BY ROLLUP (category, name)`, then turn the rolled-up `NULL`s into labels using `GROUPING()` (not `COALESCE` alone — it cannot tell a subtotal from a real `NULL`).

</details>

<details>
<summary>Solution</summary>

```sql
SELECT CASE WHEN GROUPING(p.category) = 1 THEN 'All categories' ELSE p.category END AS category,
       CASE WHEN GROUPING(p.name) = 1 THEN 'All products' ELSE p.name END         AS product,
       sum(oi.quantity) AS qty
FROM order_items oi
JOIN orders o   ON o.order_id = oi.order_id
JOIN products p ON p.product_id = oi.product_id
WHERE o.status <> 'CANCELLED'
GROUP BY ROLLUP (p.category, p.name)
ORDER BY GROUPING(p.category), p.category, GROUPING(p.name), p.name;
```

**Explanation:** Sorting by `GROUPING(...)` first puts detail rows before their subtotal and the grand total at the end, independent of how `NULL`s sort.

</details>
