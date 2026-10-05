# Ranking Window Functions — Practice

### P1. Fill in the ranks

**Difficulty:** Easy · **Type:** Output · **Concepts:** rank vs dense_rank

Scores ordered high to low: 90, 85, 85, 85, 70. What are `rank()` and `dense_rank()` for the score 70?

- A) rank 5, dense_rank 3
- B) rank 3, dense_rank 3
- C) rank 5, dense_rank 5
- D) rank 4, dense_rank 3

<details>
<summary>Answer</summary>

**Answer:** A)

**Explanation:** Three rows tie at rank 2, so the next rank is 2 + 3 = 5. `dense_rank` gives 85 the value 2 and 70 the value 3.

</details>

### P2. Most expensive product per category

**Difficulty:** Easy · **Type:** Query · **Concepts:** rank, PARTITION BY

Return the most expensive product in each category (all products if tied).

**Expected output:**

```text
  category   |   name   |  price
-------------+----------+----------
 Electronics | Laptop   | 55000.00
 Furniture   | Desk     |  8000.00
 Stationery  | Notebook |    50.00
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT category, name, price
FROM (SELECT category, name, price,
             rank() OVER (PARTITION BY category ORDER BY price DESC) AS rnk
      FROM products) AS t
WHERE rnk = 1
ORDER BY category;
```

</details>

### P3. Each customer's first order

**Difficulty:** Easy · **Type:** Query · **Concepts:** row_number

Using `row_number()`, return each customer's first order (earliest date). Order by customer id.

**Expected output:**

```text
 customer_id | order_id | order_date
-------------+----------+------------
           1 |      101 | 2026-01-05
           2 |      102 | 2026-01-12
           3 |      104 | 2026-02-14
           4 |      105 | 2026-02-20
           5 |      108 | 2026-03-28
(5 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT customer_id, order_id, order_date
FROM (SELECT customer_id, order_id, order_date,
             row_number() OVER (PARTITION BY customer_id ORDER BY order_date, order_id) AS rn
      FROM orders) AS t
WHERE rn = 1
ORDER BY customer_id;
```

**Explanation:** `order_id` is a tiebreaker in case a customer placed two orders on the same day.

</details>

### P4. Second-highest salary per department

**Difficulty:** Medium · **Type:** Query · **Concepts:** dense_rank, PARTITION BY

Return the employees earning the second-highest distinct salary of their department. Departments with a single distinct salary return nothing.

**Expected output:**

```text
 dept_id | name  | salary
---------+-------+--------
      10 | Meena |  95000
      10 | Ravi  |  95000
      20 | Arjun |  60000
      20 | Sneha |  60000
      30 | Pooja |  52000
(5 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT dept_id, name, salary
FROM (SELECT dept_id, name, salary,
             dense_rank() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS dr
      FROM employees) AS t
WHERE dr = 2
ORDER BY dept_id, name;
```

**Explanation:** Compare with the correlated-count solution in [Correlated Subqueries](../../subqueries/correlated-subqueries/practice.md) — same result, one pass.

</details>

### P5. Why does it return nothing?

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** rank gaps

"Find the third highest salary":

```sql
SELECT salary
FROM (SELECT salary, rank() OVER (ORDER BY salary DESC) AS r FROM employees) AS t
WHERE r = 3;
```

**Output:**

```text
 salary
--------
(0 rows)
```

<details>
<summary>Answer</summary>

Ravi and Meena tie for rank 2, so the next rank is 4 — no row has rank 3. Use `dense_rank()` (and `DISTINCT`, in case several employees share the value):

```sql
SELECT DISTINCT salary
FROM (SELECT salary, dense_rank() OVER (ORDER BY salary DESC) AS r FROM employees) AS t
WHERE r = 3;
```

**Output:**

```text
 salary
--------
  88000
(1 row)
```

</details>

### P6. Best-selling product per month

**Difficulty:** Hard · **Type:** Query · **Concepts:** aggregate then rank

For each month, find the product(s) with the largest quantity sold (non-cancelled orders), with ties included.

**Expected output:**

```text
   month    |   name   | qty
------------+----------+-----
 2026-01-01 | Chair    |   2
 2026-01-01 | Mouse    |   2
 2026-02-01 | Chair    |   1
 2026-02-01 | Keyboard |   1
 2026-02-01 | Mouse    |   1
 2026-03-01 | Mouse    |   4
(6 rows)
```

<details>
<summary>Hint</summary>

Aggregate quantity per (month, product) in a CTE, then `rank() OVER (PARTITION BY month ORDER BY qty DESC)`.

</details>

<details>
<summary>Solution</summary>

```sql
WITH monthly AS (
    SELECT date_trunc('month', o.order_date)::date AS month, p.name, sum(oi.quantity) AS qty
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.order_id
    JOIN products p     ON p.product_id = oi.product_id
    WHERE o.status <> 'CANCELLED'
    GROUP BY 1, 2
)
SELECT month, name, qty
FROM (SELECT *, rank() OVER (PARTITION BY month ORDER BY qty DESC) AS rnk FROM monthly) AS t
WHERE rnk = 1
ORDER BY month, name;
```

</details>
