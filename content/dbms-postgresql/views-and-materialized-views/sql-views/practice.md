# Views — Practice

### P1. Updatable or not?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** updatable views

Which view is automatically updatable?

- A) `CREATE VIEW v AS SELECT dept_id, count(*) FROM employees GROUP BY dept_id`
- B) `CREATE VIEW v AS SELECT emp_id, name, salary FROM employees WHERE salary > 60000`
- C) `CREATE VIEW v AS SELECT e.name, d.dept_name FROM employees e JOIN departments d USING (dept_id)`
- D) `CREATE VIEW v AS SELECT DISTINCT dept_id FROM employees`

<details>
<summary>Answer</summary>

**Answer:** B)

**Explanation:** One table, plain columns, a `WHERE` only. A aggregates, C joins two tables, D uses `DISTINCT`.

</details>

### P2. A customer summary view

**Difficulty:** Easy · **Type:** Query · **Concepts:** CREATE VIEW, LEFT JOIN, aggregates

Create a view `customer_stats` with each customer's name, number of non-cancelled orders and total spent (0 if none). Query it for customers who spent more than 5000, highest first.

**Expected output:**

```text
  name  | orders |  spent
--------+--------+----------
 Anil   |      3 | 70000.00
 Bhavna |      2 | 18950.00
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
CREATE VIEW customer_stats AS
SELECT c.customer_id, c.name,
       count(DISTINCT o.order_id)                        AS orders,
       COALESCE(sum(oi.quantity * oi.unit_price), 0)     AS spent
FROM customers c
LEFT JOIN orders o       ON o.customer_id = c.customer_id AND o.status <> 'CANCELLED'
LEFT JOIN order_items oi ON oi.order_id = o.order_id
GROUP BY c.customer_id;

SELECT name, orders, spent FROM customer_stats WHERE spent > 5000 ORDER BY spent DESC;
```

**Explanation:** `count(DISTINCT o.order_id)` avoids counting each order once per item (fan-out). Queries on the view always see current data.

</details>

### P3. Restrict writes to the view's rows

**Difficulty:** Medium · **Type:** Query · **Concepts:** WITH CHECK OPTION

Create a view `chennai_customers` (id, name, city, email) for customers in Chennai that rejects inserts or updates that would move a customer out of Chennai. Show that moving Anil to Pune through the view fails, while adding a Chennai customer works.

**Expected output:**

```text
ERROR:  new row violates check option for view "chennai_customers"
DETAIL:  Failing row contains (1, Anil, Pune, anil@mail.com).
 customer_id | name |  city   |     email
-------------+------+---------+---------------
           7 | Gita | Chennai | gita@mail.com
(1 row)
```

<details>
<summary>Solution</summary>

```sql
CREATE VIEW chennai_customers AS
SELECT customer_id, name, city, email
FROM customers
WHERE city = 'Chennai'
WITH CHECK OPTION;

UPDATE chennai_customers SET city = 'Pune' WHERE name = 'Anil';
INSERT INTO chennai_customers VALUES (7, 'Gita', 'Chennai', 'gita@mail.com') RETURNING *;
```

</details>

### P4. Fix the view change

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** CREATE OR REPLACE rules

**Schema and data:**

```sql
CREATE VIEW product_list AS SELECT product_id, name, price FROM products;
```

A developer wants the view to show `price` rounded to whole rupees as an integer:

```sql
CREATE OR REPLACE VIEW product_list AS SELECT product_id, name, round(price)::int AS price FROM products;
```

**Output:**

```text
ERROR:  cannot change data type of view column "price" from numeric(10,2) to integer
```

Explain and fix.

<details>
<summary>Answer</summary>

`CREATE OR REPLACE VIEW` cannot change an existing column's type (`numeric(10,2)` → `integer`). Drop and recreate it (in one transaction, so readers never see it missing):

```sql
BEGIN;
DROP VIEW product_list;
CREATE VIEW product_list AS SELECT product_id, name, round(price)::int AS price FROM products;
COMMIT;
SELECT * FROM product_list WHERE product_id IN (1, 6) ORDER BY product_id;
```

**Output:**

```text
 product_id |   name   | price
------------+----------+-------
          1 | Laptop   | 55000
          6 | Notebook |    50
(2 rows)
```

If other views depend on `product_list`, they must be dropped and recreated too (`DROP VIEW … CASCADE` lists them).

</details>
