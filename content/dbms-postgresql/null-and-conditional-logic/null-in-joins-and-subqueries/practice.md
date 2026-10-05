# NULL in Joins and Subqueries — Practice

### P1. Products never ordered

**Difficulty:** Easy · **Type:** Query · **Concepts:** NOT EXISTS

List products that appear in no order item.

**Expected output:**

```text
   name
----------
 Notebook
(1 row)
```

<details>
<summary>Solution</summary>

```sql
SELECT p.name
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = p.product_id);
```

**Alternative:** `LEFT JOIN order_items oi ON oi.product_id = p.product_id WHERE oi.order_id IS NULL`.

</details>

### P2. Predict the NOT IN result

**Difficulty:** Medium · **Type:** Output · **Concepts:** NOT IN trap

```sql
CREATE TABLE blocked (customer_id integer);
INSERT INTO blocked VALUES (3), (NULL);

SELECT count(*) AS allowed_customers
FROM customers
WHERE customer_id NOT IN (SELECT customer_id FROM blocked);
```

<details>
<summary>Answer</summary>

**Output:**

```text
 allowed_customers
-------------------
                 0
(1 row)
```

0. The `NULL` in `blocked` makes every `NOT IN` UNKNOWN. With `NOT EXISTS` the answer is 5. The real fix is also a schema fix: `blocked.customer_id` should be `NOT NULL` (ideally a primary key referencing `customers`).

</details>

### P3. Departments with headcount

**Difficulty:** Medium · **Type:** Query · **Concepts:** LEFT JOIN, count(column)

Show every department with its number of employees, including departments with none. Order by headcount descending, then name.

**Expected output:**

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

<details>
<summary>Solution</summary>

```sql
SELECT d.dept_name, count(e.emp_id) AS headcount
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.dept_id
GROUP BY d.dept_id, d.dept_name
ORDER BY headcount DESC, d.dept_name;
```

**Explanation:** `count(*)` would report 1 for Research.

</details>

### P4. Customers with no delivered order

**Difficulty:** Medium · **Type:** Query · **Concepts:** NOT EXISTS with a condition

List customers who have **no delivered order** (including customers with no orders at all), ordered by id.

**Expected output:**

```text
 customer_id |  name
-------------+--------
           3 | Chirag
           6 | Fatima
(2 rows)
```

<details>
<summary>Hint</summary>

The extra condition (`status = 'DELIVERED'`) goes inside the `NOT EXISTS` subquery.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT c.customer_id, c.name
FROM customers c
WHERE NOT EXISTS (
    SELECT 1 FROM orders o
    WHERE o.customer_id = c.customer_id
      AND o.status = 'DELIVERED'
)
ORDER BY c.customer_id;
```

**Explanation:** Chirag's only order was cancelled; Fatima never ordered.

</details>

### P5. Find the bug

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** LEFT JOIN, IS NULL

A developer wants "employees who have no email **or** whose department is unknown" and writes:

```sql
SELECT e.name
FROM employees e
LEFT JOIN departments d ON d.dept_id = e.dept_id
WHERE d.location IS NULL OR e.email IS NULL
ORDER BY e.emp_id;
```

**Output:**

```text
 name
-------
 Karan
 Nisha
(2 rows)
```

Research's `location` is also `NULL`. Is the query testing "unknown department" correctly? Rewrite it so it does not depend on `location`.

<details>
<summary>Answer</summary>

It returns Karan (no email) and Nisha (no department) — but only by luck: `d.location IS NULL` is also true for an employee whose department exists but has no location (Research). Test the department's key, which is `NULL` only when there is no match:

```sql
SELECT e.name
FROM employees e
LEFT JOIN departments d ON d.dept_id = e.dept_id
WHERE d.dept_id IS NULL OR e.email IS NULL
ORDER BY e.emp_id;
```

</details>

### P6. Pricier than every competitor?

**Difficulty:** Hard · **Type:** Query · **Concepts:** ALL, NULL, empty set

Competitors' prices are tracked per product; `price` is `NULL` when a competitor has not published one.

**Schema and data:**

```sql
CREATE TABLE competitor_prices (product_id integer, competitor text, price numeric(10,2));
INSERT INTO competitor_prices VALUES
    (1, 'A', 54000), (1, 'B', NULL),
    (2, 'A', 450),
    (3, 'A', 1600),
    (4, 'A', 7500),  (4, 'B', 7000),
    (5, 'B', NULL);
```

List our products whose price is higher than **every known** competitor price for that product. Products with no known competitor price should be listed too.

**Expected output:**

```text
 product_id |   name   |  price
------------+----------+----------
          1 | Laptop   | 55000.00
          2 | Mouse    |   500.00
          4 | Desk     |  8000.00
          5 | Chair    |  4500.00
          6 | Notebook |    50.00
(5 rows)
```

<details>
<summary>Hint</summary>

Try `p.price > ALL (SELECT c.price FROM competitor_prices c WHERE c.product_id = p.product_id)` first and see which products disappear. What does `> ALL` return for an empty set?

</details>

<details>
<summary>Solution</summary>

```sql
SELECT p.product_id, p.name, p.price
FROM products p
WHERE p.price > ALL (
    SELECT c.price
    FROM competitor_prices c
    WHERE c.product_id = p.product_id
      AND c.price IS NOT NULL
)
ORDER BY p.product_id;
```

**Explanation:**

- Without `c.price IS NOT NULL`, the Laptop (55000 vs 54000 and `NULL`) and the Chair (only a `NULL`) would vanish: one UNKNOWN comparison stops `ALL` from being TRUE.
- With the filter, the Chair's and the Notebook's subqueries are **empty**, and `> ALL (empty set)` is TRUE — so they are listed, which matches "no known competitor price".
- The Keyboard (1500 vs 1600) is correctly excluded.

</details>
