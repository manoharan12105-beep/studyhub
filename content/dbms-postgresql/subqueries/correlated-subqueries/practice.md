# Correlated Subqueries — Practice

### P1. Correlated or not?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** correlation

Which subquery is correlated?

- A) `WHERE salary > (SELECT avg(salary) FROM employees)`
- B) `WHERE dept_id IN (SELECT dept_id FROM departments WHERE location = 'Chennai')`
- C) `WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id)`
- D) `FROM (SELECT dept_id, count(*) FROM employees GROUP BY dept_id) AS t`

<details>
<summary>Answer</summary>

**Answer:** C)

**Explanation:** Only C references a column of the outer query (`c.customer_id`). A and B can run on their own; D is a derived table, which cannot reference other `FROM` items unless it is `LATERAL`.

</details>

### P2. Latest order per customer

**Difficulty:** Easy · **Type:** Query · **Concepts:** correlated scalar subquery

List each customer's most recent order (order id and date), using a correlated subquery. Customers without orders are not listed. Order by customer name.

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
<summary>Hint</summary>

Keep an order if its date equals the maximum order date of the same customer.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT c.name, o.order_id, o.order_date
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
WHERE o.order_date = (SELECT max(o2.order_date)
                      FROM orders o2
                      WHERE o2.customer_id = o.customer_id)
ORDER BY c.name;
```

**Explanation:** If a customer had two orders on the same latest date, both would be returned. PostgreSQL alternatives: `DISTINCT ON (customer_id) … ORDER BY customer_id, order_date DESC`, or `row_number()`.

</details>

### P3. Customers who never bought furniture

**Difficulty:** Easy · **Type:** Query · **Concepts:** correlated NOT EXISTS

List customers who have never ordered a product in the `Furniture` category (including customers with no orders), ordered by `customer_id`.

**Expected output:**

```text
  name
--------
 Chirag
 Eshan
 Fatima
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT c.name
FROM customers c
WHERE NOT EXISTS (SELECT 1
                  FROM orders o
                  JOIN order_items oi ON oi.order_id = o.order_id
                  JOIN products p     ON p.product_id = oi.product_id
                  WHERE o.customer_id = c.customer_id
                    AND p.category = 'Furniture')
ORDER BY c.customer_id;
```

**Explanation:** The subquery is correlated through `o.customer_id = c.customer_id`; PostgreSQL still executes it as an anti-join, not a loop of separate queries. Fatima, who never ordered anything, qualifies too.

</details>

### P4. Above their category average

**Difficulty:** Medium · **Type:** Query · **Concepts:** correlated aggregate

Using a correlated subquery, list products whose price is above the average price of their category. Order by price descending.

**Expected output:**

```text
  name  |  category   |  price
--------+-------------+----------
 Laptop | Electronics | 55000.00
 Desk   | Furniture   |  8000.00
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT p.name, p.category, p.price
FROM products p
WHERE p.price > (SELECT avg(p2.price) FROM products p2 WHERE p2.category = p.category)
ORDER BY p.price DESC;
```

**Alternative:** `avg(price) OVER (PARTITION BY category)` in a derived table.

</details>

### P5. Second-highest salary in each department

**Difficulty:** Medium · **Type:** Query · **Concepts:** correlated count, Nth per group

For each department, list the employee(s) with the second-highest distinct salary in that department. Order by department, then name.

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

Count distinct salaries in the same department that are greater than the current employee's salary.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT e1.dept_id, e1.name, e1.salary
FROM employees e1
WHERE 1 = (SELECT count(DISTINCT e2.salary)
           FROM employees e2
           WHERE e2.dept_id = e1.dept_id
             AND e2.salary > e1.salary)
ORDER BY e1.dept_id, e1.name;
```

**Explanation:** Engineering's salaries are 150000, 95000, 95000, 72000, so Ravi and Meena tie at second. Sales has 88000, 60000, 60000, 55000, so Arjun and Sneha tie. HR's second is Pooja. Finance has one employee and no second. Nisha (no department) is never compared with anyone.

</details>

### P6. Read the plan

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** SubPlan, loops

`EXPLAIN ANALYZE` for a query on a 1,000,000-row `orders` table shows:

```text
Seq Scan on customers c (actual rows=50000.00 loops=1)
  SubPlan 1
    ->  Aggregate (actual rows=1.00 loops=50000)
          ->  Seq Scan on orders o (actual rows=20.00 loops=50000)
                Filter: (customer_id = c.customer_id)
                Rows Removed by Filter: 999980
```

What is the problem, and give two fixes.

<details>
<summary>Answer</summary>

The correlated subquery runs 50,000 times (`loops=50000`) and each run scans all 1,000,000 orders — about 50 billion row visits. Fixes:

1. `CREATE INDEX ON orders (customer_id);` — each SubPlan run becomes an index scan reading ~20 rows.
2. Rewrite as one aggregation joined back: `LEFT JOIN (SELECT customer_id, count(*) AS n FROM orders GROUP BY customer_id) t ON t.customer_id = c.customer_id`, which scans `orders` once.

</details>

### P7. Why did deleting one customer fail?

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** outer column binding

A developer wants to delete the customers listed in `blocked_users(user_id)` — only Fatima (id 6), who has no orders. The statement fails with a foreign-key error about customer **1**.

**Schema and data:**

```sql
CREATE TABLE blocked_users (user_id integer);
INSERT INTO blocked_users VALUES (6);
```

```sql
DELETE FROM customers
WHERE customer_id IN (SELECT customer_id FROM blocked_users)
RETURNING name;
```

**Output:**

```text
ERROR:  update or delete on table "customers" violates foreign key constraint "orders_customer_id_fkey" on table "orders"
DETAIL:  Key (customer_id)=(1) is still referenced from table "orders".
```

Explain the result and fix the query.

<details>
<summary>Answer</summary>

`blocked_users` has no `customer_id` column, so inside the subquery `customer_id` binds to the outer `customers` row. For each customer the subquery returns that customer's own id, so `IN` is TRUE for **every** customer and the `DELETE` targets the whole table. Deleting Anil (id 1) violates the foreign key from `orders`, so the statement fails and is rolled back — nothing is deleted. The foreign key is what saved the data; on a table nobody references, every row would have been deleted silently.

Fix by using the right column and qualifying it:

```sql
DELETE FROM customers c
WHERE c.customer_id IN (SELECT b.user_id FROM blocked_users b)
RETURNING c.name;
```

**Output:**

```text
  name
--------
 Fatima
(1 row)
```

</details>
