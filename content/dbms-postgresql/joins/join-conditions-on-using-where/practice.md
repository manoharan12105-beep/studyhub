# ON vs USING vs WHERE in Joins — Practice

### P1. Rewrite with USING

**Difficulty:** Easy · **Type:** Query · **Concepts:** USING

Rewrite `SELECT o.order_id, c.name FROM orders o JOIN customers c ON c.customer_id = o.customer_id` with `USING`, and also select the unqualified `customer_id`. Show orders 101–103.

**Expected output:**

```text
 order_id | customer_id |  name
----------+-------------+--------
      101 |           1 | Anil
      102 |           2 | Bhavna
      103 |           1 | Anil
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT order_id, customer_id, c.name
FROM orders o
JOIN customers c USING (customer_id)
WHERE order_id BETWEEN 101 AND 103
ORDER BY order_id;
```

</details>

### P2. Where does the filter go?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** ON vs WHERE

You want **all products** with their order items from **March 2026 only** (products without March sales must still appear). Where do you put the date condition on `orders`?

- A) In `WHERE`
- B) In the `ON` clause of the join to `orders`
- C) In `HAVING`
- D) It makes no difference

<details>
<summary>Answer</summary>

**Answer:** B) In the `ON` clause of the join to `orders`

**Explanation:** The orders side is optional; a `WHERE` condition on it would remove products without March sales.

</details>

### P3. March units per product

**Difficulty:** Medium · **Type:** Query · **Concepts:** LEFT JOIN with ON filter

For every product, show units sold in March 2026 (0 if none). Order by product id.

**Expected output:**

```text
   name   | march_units
----------+-------------
 Laptop   |           0
 Mouse    |           4
 Keyboard |           1
 Desk     |           1
 Chair    |           1
 Notebook |           0
(6 rows)
```

<details>
<summary>Hint</summary>

`products LEFT JOIN order_items LEFT JOIN orders` — but the date filter is on `orders`, the third table. Joining `order_items` to `orders` with an inner join inside a parenthesised join (or a subquery) keeps the filter from discarding products.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT p.name, COALESCE(sum(m.quantity), 0) AS march_units
FROM products p
LEFT JOIN (
    SELECT oi.product_id, oi.quantity
    FROM order_items oi
    JOIN orders o ON o.order_id = oi.order_id
    WHERE o.order_date >= DATE '2026-03-01'
      AND o.order_date <  DATE '2026-04-01'
) AS m ON m.product_id = p.product_id
GROUP BY p.product_id, p.name
ORDER BY p.product_id;
```

**Explanation:** The derived table contains only March items; the outer `LEFT JOIN` keeps every product. A chain `products LEFT JOIN order_items LEFT JOIN orders ON … AND <march>` would be wrong: non-March items would still be joined and summed (their order columns just become `NULL`).

</details>

### P4. Fix the report

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** LEFT JOIN turned INNER

The report should list every department and the number of employees hired since 2020, but Finance and Research are missing:

```sql
SELECT d.dept_name, count(e.emp_id) AS recent_hires
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.dept_id
WHERE e.hire_date >= DATE '2020-01-01'
GROUP BY d.dept_id, d.dept_name
ORDER BY d.dept_id;
```

**Output:**

```text
  dept_name  | recent_hires
-------------+--------------
 Engineering |            1
 Sales       |            3
 HR          |            1
(3 rows)
```

<details>
<summary>Answer</summary>

The hire-date condition is on the optional table but sits in `WHERE`, so departments whose employees were all hired earlier (Finance) or that have none (Research) lose their rows. Move it to `ON`:

```sql
SELECT d.dept_name, count(e.emp_id) AS recent_hires
FROM departments d
LEFT JOIN employees e
       ON e.dept_id = d.dept_id
      AND e.hire_date >= DATE '2020-01-01'
GROUP BY d.dept_id, d.dept_name
ORDER BY d.dept_id;
```

</details>

### P5. Predict the row count with a condition on the preserved side

**Difficulty:** Hard · **Type:** Output · **Concepts:** preserved-side condition in ON

```sql
SELECT count(*) AS rows_returned, count(d.dept_id) AS rows_with_department
FROM employees e
LEFT JOIN departments d ON d.dept_id = e.dept_id AND e.name LIKE 'A%';
```

<details>
<summary>Answer</summary>

**Output:**

```text
 rows_returned | rows_with_department
---------------+----------------------
            12 |                    2
(1 row)
```

12 rows, but only Asha and Arjun get a department. The condition on the preserved table does not filter employees; it only controls which of them may match.

</details>
