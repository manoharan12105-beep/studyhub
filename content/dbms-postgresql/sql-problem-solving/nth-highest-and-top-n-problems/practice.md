# Nth-Highest and Top-N Problems — Practice

All problems use the [sample database](../../sql-fundamentals/dbms-sample-database/content.md) unless they define their own tables.

### P1. Which query is wrong?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** second-highest value, ties

Salaries are `150000, 150000, 95000`. Which query does **not** return `95000` as the second-highest salary?

- A) `SELECT max(salary) FROM t WHERE salary < (SELECT max(salary) FROM t)`
- B) `SELECT salary FROM t ORDER BY salary DESC OFFSET 1 LIMIT 1`
- C) `SELECT DISTINCT salary FROM t ORDER BY salary DESC OFFSET 1 LIMIT 1`
- D) `SELECT salary FROM (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS r FROM t) x WHERE r = 2`

<details>
<summary>Answer</summary>

**Answer:** B)

**Explanation:** Without `DISTINCT`, the second row is the second `150000`. A and C work on distinct values; D ranks values densely.

</details>

### P2. Third-highest salary in Sales

**Difficulty:** Easy · **Type:** Query · **Concepts:** DISTINCT, OFFSET, scalar subquery

Return the third-highest distinct salary in department 20, as a single column `third_highest`.

**Expected output:**

```text
 third_highest
---------------
         55000
(1 row)
```

<details>
<summary>Hint</summary>

Sales salaries are 88000, 60000, 60000, 55000. Distinct values first, then skip two.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT (SELECT DISTINCT salary FROM employees WHERE dept_id = 20
        ORDER BY salary DESC OFFSET 2 LIMIT 1) AS third_highest;
```

**Explanation:** The distinct values are 88000, 60000, 55000; `OFFSET 2` lands on 55000. Without `DISTINCT` the third row would be 60000.

</details>

### P3. Most expensive product in each category

**Difficulty:** Easy · **Type:** Query · **Concepts:** DISTINCT ON

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
<summary>Hint</summary>

One row per category, chosen by highest price.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT DISTINCT ON (category) category, name, price
FROM products
ORDER BY category, price DESC, product_id;
```

**Alternative:**

```sql
SELECT category, name, price
FROM (SELECT p.*, RANK() OVER (PARTITION BY category ORDER BY price DESC) AS r FROM products p) t
WHERE r = 1
ORDER BY category;
```

**Explanation:** `DISTINCT ON` keeps the first row of each category in the `ORDER BY`. The `RANK` version would return every product tied at the top price.

</details>

### P4. The query that does not run

**Difficulty:** Easy · **Type:** Debugging · **Concepts:** window functions in WHERE

```sql
SELECT name, salary
FROM employees
WHERE DENSE_RANK() OVER (ORDER BY salary DESC) = 2;
```

**Output:**

```text
ERROR:  window functions are not allowed in WHERE
LINE 3: WHERE DENSE_RANK() OVER (ORDER BY salary DESC) = 2;
              ^
```

Fix it so it lists every employee earning the second-highest salary.

**Expected output:**

```text
 name  | salary
-------+--------
 Meena |  95000
 Ravi  |  95000
(2 rows)
```

<details>
<summary>Hint</summary>

Window functions are computed after `WHERE`. Move the ranking one level down.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT name, salary
FROM (SELECT name, salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS r
      FROM employees) ranked
WHERE r = 2
ORDER BY name;
```

**Explanation:** The subquery computes the rank for every row; the outer `WHERE` can then filter on it.

</details>

### P5. Fourth-highest salary without window functions

**Difficulty:** Medium · **Type:** Query · **Concepts:** correlated subquery, count DISTINCT

Find the fourth-highest distinct salary using a correlated subquery (no `LIMIT`, no window functions).

**Expected output:**

```text
 fourth_highest
----------------
          82000
(1 row)
```

<details>
<summary>Hint</summary>

The Nth-highest salary has exactly N − 1 distinct salaries above it.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT DISTINCT e.salary AS fourth_highest
FROM employees e
WHERE 3 = (SELECT count(DISTINCT x.salary) FROM employees x WHERE x.salary > e.salary);
```

**Explanation:** 150000, 95000 and 88000 are above 82000. `DISTINCT` in the outer query matters when several employees share the answer.

**Performance:** The subquery runs for each employee, O(n²) without an index; `DENSE_RANK` sorts once.

</details>

### P6. Second-highest earner in every department

**Difficulty:** Medium · **Type:** Query · **Concepts:** DENSE_RANK, PARTITION BY

List every employee who earns their department's second-highest distinct salary. Departments with only one salary value have no row.

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
<summary>Hint</summary>

`DENSE_RANK` partitioned by department; keep rank 2.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT dept_id, name, salary
FROM (SELECT e.*, DENSE_RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS r
      FROM employees e) t
WHERE r = 2
ORDER BY dept_id, name;
```

**Explanation:** Finance (one employee) and the `NULL` "department" of Nisha have no rank 2, so they disappear naturally.

</details>

### P7. Biggest order of each customer

**Difficulty:** Medium · **Type:** Query · **Concepts:** aggregation then ranking, ties

For each customer who ordered, show their highest-value order (sum of `quantity * unit_price`). Include ties.

**Expected output:**

```text
 customer_id | order_id |  total
-------------+----------+----------
           1 |      101 | 56000.00
           2 |      102 | 17000.00
           3 |      104 | 55000.00
           4 |      105 |  5000.00
           5 |      108 |  1500.00
(5 rows)
```

<details>
<summary>Hint</summary>

Two steps: compute order totals (`GROUP BY order_id`), then rank them per customer.

</details>

<details>
<summary>Solution</summary>

```sql
WITH totals AS (
    SELECT o.customer_id, o.order_id, sum(oi.quantity * oi.unit_price) AS total
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.order_id
    GROUP BY o.customer_id, o.order_id
)
SELECT customer_id, order_id, total
FROM (SELECT t.*, RANK() OVER (PARTITION BY customer_id ORDER BY total DESC) AS r FROM totals t) ranked
WHERE r = 1
ORDER BY customer_id, order_id;
```

**Explanation:** Aggregates are computed before window functions, so you can also write it in one level: `RANK() OVER (PARTITION BY o.customer_id ORDER BY sum(oi.quantity * oi.unit_price) DESC)`. The CTE is easier to read.

</details>

### P8. Top 2 products by revenue in each category

**Difficulty:** Medium · **Type:** Query · **Concepts:** LEFT JOIN, aggregation, ROW_NUMBER

Revenue counts only orders that are not `CANCELLED`. Every product appears in the ranking (revenue 0 if unsold). Return exactly two products per category (one if the category has only one product), breaking ties by `product_id`.

**Expected output:**

```text
  category   |   name   | revenue
-------------+----------+----------
 Electronics | Laptop   | 55000.00
 Electronics | Mouse    |  3450.00
 Furniture   | Chair    | 18000.00
 Furniture   | Desk     | 16000.00
 Stationery  | Notebook |        0
(5 rows)
```

<details>
<summary>Hint</summary>

Join `products` → `order_items` → `orders` with `LEFT JOIN`s, and put the status filter in the `ON` clause so unsold products survive. Then `ROW_NUMBER` per category.

</details>

<details>
<summary>Solution</summary>

```sql
WITH revenue AS (
    SELECT p.product_id, p.category, p.name,
           coalesce(sum(oi.quantity * oi.unit_price), 0) AS revenue
    FROM products p
    LEFT JOIN (order_items oi
               JOIN orders o ON o.order_id = oi.order_id AND o.status <> 'CANCELLED')
           ON oi.product_id = p.product_id
    GROUP BY p.product_id
)
SELECT category, name, revenue
FROM (SELECT r.*, ROW_NUMBER() OVER (PARTITION BY category ORDER BY revenue DESC, product_id) AS rn
      FROM revenue r) t
WHERE rn <= 2
ORDER BY category, revenue DESC;
```

**Explanation:** The parenthesised inner join keeps only non-cancelled order lines; the outer `LEFT JOIN` keeps every product. Cancelled order 104 would otherwise add another 55000 to the laptop. A `WHERE o.status <> 'CANCELLED'` after the left join would drop the Notebook (its `status` is `NULL`).

</details>

### P9. Gap to the department's top earner

**Difficulty:** Medium · **Type:** Query · **Concepts:** window max, PARTITION BY

For Engineering and Sales, show each employee's salary and how far below the department's highest salary it is.

**Expected output:**

```text
 dept_id | name  | salary | gap_to_top
---------+-------+--------+------------
      10 | Asha  | 150000 |          0
      10 | Meena |  95000 |      55000
      10 | Ravi  |  95000 |      55000
      10 | Karan |  72000 |      78000
      20 | Divya |  88000 |          0
      20 | Arjun |  60000 |      28000
      20 | Sneha |  60000 |      28000
      20 | Rahul |  55000 |      33000
(8 rows)
```

<details>
<summary>Hint</summary>

`max(salary) OVER (PARTITION BY dept_id)` keeps every row and adds the group maximum.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT dept_id, name, salary,
       max(salary) OVER (PARTITION BY dept_id) - salary AS gap_to_top
FROM employees
WHERE dept_id IN (10, 20)
ORDER BY dept_id, salary DESC, name;
```

**Explanation:** Unlike `GROUP BY`, a window aggregate does not collapse rows.

</details>

### P10. Latest two orders per customer, including customers without orders

**Difficulty:** Hard · **Type:** Query · **Concepts:** LEFT JOIN LATERAL, LIMIT per group

**Expected output:**

```text
  name  | order_id | order_date
--------+----------+------------
 Anil   |      107 | 2026-03-15
 Anil   |      103 | 2026-02-03
 Bhavna |      106 | 2026-03-01
 Bhavna |      102 | 2026-01-12
 Chirag |      104 | 2026-02-14
 Deepa  |      105 | 2026-02-20
 Eshan  |      108 | 2026-03-28
 Fatima |     NULL | NULL
(8 rows)
```

<details>
<summary>Hint</summary>

For each customer, run a small "latest 2" query. `LATERAL` lets a subquery in `FROM` refer to the current customer.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT c.name, o.order_id, o.order_date
FROM customers c
LEFT JOIN LATERAL (
    SELECT order_id, order_date
    FROM orders
    WHERE orders.customer_id = c.customer_id
    ORDER BY order_date DESC, order_id DESC
    LIMIT 2
) o ON true
ORDER BY c.customer_id, o.order_date DESC;
```

**Alternative:** `ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC, order_id DESC) <= 2` on `orders`, then `customers LEFT JOIN` that result.

**Performance:** With `CREATE INDEX ON orders (customer_id, order_date DESC)`, the `LATERAL` version reads at most two index entries per customer. The window version must sort or scan every order. On large tables with "latest N" access patterns, the `LATERAL` + index combination is the standard answer.

</details>

### P11. Should Nth-highest return a row or NULL?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** empty results, scalar subqueries

An API calls `SELECT DISTINCT salary FROM employees WHERE dept_id = $1 ORDER BY salary DESC OFFSET 1 LIMIT 1` and crashes when the result is empty. Without changing application code that reads "the first row, first column", how do you make the query always return exactly one row?

<details>
<summary>Answer</summary>

Wrap it in a scalar subquery: `SELECT (SELECT DISTINCT salary … OFFSET 1 LIMIT 1) AS second_highest`. A scalar subquery that finds no row yields `NULL`, and the outer `SELECT` without `FROM` always produces one row. An aggregate gives the same guarantee: `SELECT max(salary) … WHERE salary < (…)` returns one row even when nothing matches.

</details>
