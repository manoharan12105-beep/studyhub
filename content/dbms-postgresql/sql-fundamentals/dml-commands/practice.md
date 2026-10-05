# DML: INSERT, UPDATE and DELETE — Practice

### P1. Add a customer and an order

**Difficulty:** Easy · **Type:** Query · **Concepts:** INSERT

Add customer 7, Gopal from Kochi (no email), and an order 109 for him dated `2026-04-05` with status `PLACED`. Show his orders.

**Expected output:**

```text
 name  | order_id | status
-------+----------+--------
 Gopal |      109 | PLACED
(1 row)
```

<details>
<summary>Solution</summary>

```sql
INSERT INTO customers (customer_id, name, city) VALUES (7, 'Gopal', 'Kochi');
INSERT INTO orders (order_id, customer_id, order_date, status) VALUES (109, 7, '2026-04-05', 'PLACED');
SELECT c.name, o.order_id, o.status
FROM customers c JOIN orders o ON o.customer_id = c.customer_id
WHERE c.customer_id = 7;
```

**Explanation:** The customer must exist before the order because of the foreign key. `email` was omitted, so it is `NULL`.

</details>

### P2. Raise salaries below the department average

**Difficulty:** Medium · **Type:** Query · **Concepts:** UPDATE with subquery

Give a 5000 raise to every employee whose salary is below their own department's average salary. Return the affected employees with their new salaries, ordered by `emp_id`.

**Expected output:**

```text
 emp_id | name  | dept_id | salary
--------+-------+---------+--------
      2 | Ravi  |      10 | 100000
      3 | Meena |      10 | 100000
      4 | Karan |      10 |  77000
      6 | Arjun |      20 |  65000
      7 | Sneha |      20 |  65000
      9 | Pooja |      30 |  57000
     12 | Rahul |      20 |  60000
(7 rows)
```

<details>
<summary>Hint</summary>

A correlated subquery in `WHERE` can compute the average of the row's department. All averages are computed from the table as it was before the update.

</details>

<details>
<summary>Solution</summary>

```sql
WITH updated AS (
    UPDATE employees e
    SET salary = salary + 5000
    WHERE salary < (SELECT avg(salary) FROM employees x WHERE x.dept_id = e.dept_id)
    RETURNING emp_id, name, dept_id, salary
)
SELECT * FROM updated ORDER BY emp_id;
```

**Explanation:** Engineering's average is 103000 (Ravi, Meena, Karan are below), Sales' is 65750 (Arjun, Sneha, Rahul), HR's is 61000 (Pooja). Nisha has no department: `x.dept_id = NULL` matches nothing, the average is `NULL`, and `45000 < NULL` is unknown, so she is not updated. The `WITH … RETURNING` wrapper only exists to sort the returned rows.

</details>

### P3. Delete products never sold

**Difficulty:** Medium · **Type:** Query · **Concepts:** DELETE, NOT EXISTS

Delete every product that appears in no order item, returning the deleted names.

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
DELETE FROM products p
WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.product_id = p.product_id)
RETURNING p.name;
```

**Explanation:** Only the Notebook was never sold. `NOT EXISTS` is safe even if `order_items.product_id` contained `NULL`s, unlike `NOT IN`.

</details>

### P4. Spot the bug

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** UPDATE … FROM

An analyst wants to set each product's price to its latest selling price and writes:

```sql
-- Illustrative: buggy update
UPDATE products p
SET price = oi.unit_price
FROM order_items oi
WHERE oi.product_id = p.product_id;
```

Mouse (product 2) appears in four order items at 500.00 and 450.00. What is wrong?

<details>
<summary>Answer</summary>

The join is one-to-many: Mouse matches four source rows, and PostgreSQL updates the target row once using an arbitrary one of them, so the result may be 500.00 or 450.00 — not necessarily the latest. Fix by making the source one row per product, chosen deliberately:

```sql
UPDATE products p
SET price = latest.unit_price
FROM (
    SELECT DISTINCT ON (oi.product_id) oi.product_id, oi.unit_price
    FROM order_items oi
    JOIN orders o ON o.order_id = oi.order_id
    ORDER BY oi.product_id, o.order_date DESC
) AS latest
WHERE latest.product_id = p.product_id;
```

`DISTINCT ON` keeps the first row per product in the given order, i.e. the most recent sale ([DISTINCT ON](../../postgresql-features/distinct-on/content.md)).

</details>

### P5. Safe bulk delete

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** DELETE, transactions

You must delete 30 million rows older than 2023 from a 100-million-row `events` table on a live system. Why is one `DELETE … WHERE created_at < '2023-01-01'` risky, and what would you do?

<details>
<summary>Answer</summary>

One huge `DELETE` runs as a single long transaction: it holds row locks on 30 million rows, generates a burst of WAL (replication lag), creates 30 million dead tuples that autovacuum must clean, and blocks vacuum from removing other dead rows while it runs. A failure near the end rolls everything back.

Better options:

- Delete in batches (e.g. 10 000 rows by primary-key range per transaction), pausing between batches and letting autovacuum keep up.
- If the table is **partitioned by time**, drop or detach old partitions — instantaneous and no dead rows ([Partitioning](../../partitioning/table-partitioning/content.md)).
- If most rows go, copy the rows to keep into a new table and swap it in.

</details>
