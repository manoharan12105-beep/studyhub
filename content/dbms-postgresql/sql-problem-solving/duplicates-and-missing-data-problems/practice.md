# Duplicates and Missing Data Problems — Practice

Problems use the [sample database](../../sql-fundamentals/dbms-sample-database/content.md) unless they define their own tables.

### P1. Pick the NULL-safe anti-join

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** NOT IN, NOT EXISTS, NULL

`b.k` may contain `NULL`. Which query reliably returns rows of `a` with no match in `b`?

- A) `SELECT * FROM a WHERE a.k NOT IN (SELECT k FROM b)`
- B) `SELECT * FROM a WHERE NOT EXISTS (SELECT 1 FROM b WHERE b.k = a.k)`
- C) `SELECT * FROM a WHERE a.k <> ALL (SELECT k FROM b)`
- D) `SELECT a.* FROM a JOIN b ON b.k <> a.k`

<details>
<summary>Answer</summary>

**Answer:** B)

**Explanation:** A and C are the same test and become unknown when `b` has a `NULL`. D returns every pair of non-matching rows, so almost everything.

</details>

### P2. Departments with no employees

**Difficulty:** Easy · **Type:** Query · **Concepts:** LEFT JOIN anti-join

Use a `LEFT JOIN` to list departments with no employees.

**Expected output:**

```text
 dept_id | dept_name
---------+-----------
      50 | Research
(1 row)
```

<details>
<summary>Hint</summary>

Keep every department; test a column of `employees` that is never `NULL` in a real match.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT d.dept_id, d.dept_name
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.dept_id
WHERE e.emp_id IS NULL;
```

**Alternative:** `WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.dept_id = d.dept_id)`.

</details>

### P3. Products never delivered

**Difficulty:** Easy · **Type:** Query · **Concepts:** NOT EXISTS with a condition inside

List products that have never been part of a `DELIVERED` order.

**Expected output:**

```text
 product_id |   name
------------+----------
          3 | Keyboard
          6 | Notebook
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT p.product_id, p.name
FROM products p
WHERE NOT EXISTS (SELECT 1
                  FROM order_items oi
                  JOIN orders o ON o.order_id = oi.order_id
                  WHERE oi.product_id = p.product_id AND o.status = 'DELIVERED')
ORDER BY p.product_id;
```

**Explanation:** The status condition belongs inside the subquery. The Keyboard was ordered (orders 103 and 106) but never in a delivered order; the Notebook was never ordered at all.

</details>

### P4. Employees who manage nobody

**Difficulty:** Medium · **Type:** Query · **Concepts:** self anti-join, NOT IN trap

List employees who are not anyone's manager, ordered by `emp_id`.

**Expected output:**

```text
 emp_id |  name
--------+--------
      3 | Meena
      4 | Karan
      6 | Arjun
      7 | Sneha
      9 | Pooja
     10 | Farhan
     11 | Nisha
     12 | Rahul
(8 rows)
```

<details>
<summary>Hint</summary>

`WHERE emp_id NOT IN (SELECT manager_id FROM employees)` returns nothing — why? Asha's `manager_id` is `NULL`.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT e.emp_id, e.name
FROM employees e
WHERE NOT EXISTS (SELECT 1 FROM employees r WHERE r.manager_id = e.emp_id)
ORDER BY e.emp_id;
```

**Explanation:** Managers are 1, 2, 5 and 8; everyone else manages nobody. The `NOT IN` version fails because the subquery includes Asha's `NULL` `manager_id`.

</details>

### P5. Count duplicate orders by customer and date

**Difficulty:** Medium · **Type:** Query · **Concepts:** GROUP BY on several columns, HAVING

**Schema and data:**

```sql
CREATE TABLE web_orders (id int PRIMARY KEY, customer_id int, ordered_on date, amount numeric);
INSERT INTO web_orders VALUES
    (1, 1, '2026-04-01', 500), (2, 1, '2026-04-01', 500), (3, 2, '2026-04-01', 900),
    (4, 1, '2026-04-02', 500), (5, 2, '2026-04-01', 900), (6, 2, '2026-04-01', 900),
    (7, 3, '2026-04-03', 120);
```

A double-click bug submitted orders twice. Find every (customer, date, amount) that appears more than once, with the ids involved.

**Expected output:**

```text
 customer_id | ordered_on | amount | copies |   ids
-------------+------------+--------+--------+---------
           1 | 2026-04-01 |    500 |      2 | {1,2}
           2 | 2026-04-01 |    900 |      3 | {3,5,6}
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT customer_id, ordered_on, amount, count(*) AS copies,
       array_agg(id ORDER BY id) AS ids
FROM web_orders
GROUP BY customer_id, ordered_on, amount
HAVING count(*) > 1
ORDER BY customer_id;
```

</details>

### P6. Remove the double-submitted orders

**Difficulty:** Medium · **Type:** Query · **Concepts:** DELETE USING, ROW_NUMBER

**Schema and data:**

```sql
CREATE TABLE web_orders (id int PRIMARY KEY, customer_id int, ordered_on date, amount numeric);
INSERT INTO web_orders VALUES
    (1, 1, '2026-04-01', 500), (2, 1, '2026-04-01', 500), (3, 2, '2026-04-01', 900),
    (4, 1, '2026-04-02', 500), (5, 2, '2026-04-01', 900), (6, 2, '2026-04-01', 900),
    (7, 3, '2026-04-03', 120);
```

Delete duplicates, keeping the first (lowest id) of each group, then list what is left.

**Expected output:**

```text
 id | customer_id | ordered_on | amount
----+-------------+------------+--------
  1 |           1 | 2026-04-01 |    500
  3 |           2 | 2026-04-01 |    900
  4 |           1 | 2026-04-02 |    500
  7 |           3 | 2026-04-03 |    120
(4 rows)
```

<details>
<summary>Hint</summary>

Self-join on all three business columns with `a.id > b.id`.

</details>

<details>
<summary>Solution</summary>

```sql
DELETE FROM web_orders a
USING web_orders b
WHERE a.customer_id = b.customer_id
  AND a.ordered_on = b.ordered_on
  AND a.amount = b.amount
  AND a.id > b.id;

SELECT * FROM web_orders ORDER BY id;
```

**Alternative:**

```sql
-- Illustrative
DELETE FROM web_orders
WHERE id IN (SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY customer_id, ordered_on, amount ORDER BY id) AS rn
    FROM web_orders) t
WHERE rn > 1);
```

**Explanation:** Rows 2, 5 and 6 each have an earlier copy and are deleted. Id 6 is matched by both 3 and 5, but `DELETE … USING` deletes it once.

</details>

### P7. Why are there two rows for Deepa?

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** NULL in duplicates

**Schema and data:**

```sql
CREATE TABLE people (id int PRIMARY KEY, name text, email text);
INSERT INTO people VALUES (1, 'Deepa', NULL), (2, 'Deepa', NULL), (3, 'Anil', 'a@x.com'), (4, 'Anil', 'a@x.com');
```

A developer de-duplicates by email, but both Deepa rows survive:

```sql
DELETE FROM people a USING people b
WHERE a.email = b.email AND a.id > b.id;
SELECT * FROM people ORDER BY id;
```

**Output:**

```text
 id | name  |  email
----+-------+---------
  1 | Deepa | NULL
  2 | Deepa | NULL
  3 | Anil  | a@x.com
(3 rows)
```

Rewrite the delete so that rows with the same name and a `NULL` email also count as duplicates.

**Expected output:**

```text
 id | name  |  email
----+-------+---------
  1 | Deepa | NULL
  3 | Anil  | a@x.com
(2 rows)
```

<details>
<summary>Hint</summary>

`NULL = NULL` is unknown. PostgreSQL has a NULL-safe comparison operator.

</details>

<details>
<summary>Solution</summary>

```sql
DELETE FROM people a USING people b
WHERE a.name = b.name
  AND a.email IS NOT DISTINCT FROM b.email
  AND a.id > b.id;
SELECT * FROM people ORDER BY id;
```

**Explanation:** `IS NOT DISTINCT FROM` treats two `NULL`s as equal. Whether two people with no email are duplicates is a business decision, so confirm it before deleting.

</details>

### P8. Customers who ordered but never received anything

**Difficulty:** Medium · **Type:** Query · **Concepts:** EXISTS with NOT EXISTS

List customers who have at least one order, but no order with status `DELIVERED`.

**Expected output:**

```text
 customer_id |  name
-------------+--------
           3 | Chirag
(1 row)
```

<details>
<summary>Solution</summary>

```sql
SELECT c.customer_id, c.name
FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id)
  AND NOT EXISTS (SELECT 1 FROM orders o
                  WHERE o.customer_id = c.customer_id AND o.status = 'DELIVERED')
ORDER BY c.customer_id;
```

**Alternative:** `GROUP BY customer_id HAVING count(*) FILTER (WHERE status = 'DELIVERED') = 0` on `orders`, then join to `customers`.

</details>

### P9. Data-quality report

**Difficulty:** Medium · **Type:** Query · **Concepts:** count with FILTER, NULL counts

For `employees`, report in one row: total rows, rows missing an email, rows missing a department, and rows with no commission (`NULL` or 0).

**Expected output:**

```text
 total | no_email | no_dept | no_commission
-------+----------+---------+---------------
    12 |        1 |       1 |            10
(1 row)
```

<details>
<summary>Solution</summary>

```sql
SELECT count(*)                                              AS total,
       count(*) - count(email)                               AS no_email,
       count(*) FILTER (WHERE dept_id IS NULL)               AS no_dept,
       count(*) FILTER (WHERE coalesce(commission, 0) = 0)   AS no_commission
FROM employees;
```

**Explanation:** `count(email)` skips `NULL`s. Only Divya (5000) and Arjun (3000) have a non-zero commission; Rahul has 0 and nine employees have `NULL`.

</details>

### P10. Make the clean-up stick

**Difficulty:** Hard · **Type:** Design · **Concepts:** unique expression index, ON CONFLICT

After de-duplicating `web_orders` (P6), design a rule so that the same customer cannot submit the same amount twice on the same day, and so that a retry from the client is silently ignored rather than failing. Show it rejecting a duplicate.

**Schema and data:**

```sql
CREATE TABLE web_orders (id int PRIMARY KEY, customer_id int, ordered_on date, amount numeric);
INSERT INTO web_orders VALUES (1, 1, '2026-04-01', 500), (4, 1, '2026-04-02', 500);
```

**Expected output:**

```text
 id | customer_id | ordered_on | amount
----+-------------+------------+--------
  1 |           1 | 2026-04-01 |    500
  4 |           1 | 2026-04-02 |    500
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
ALTER TABLE web_orders
    ADD CONSTRAINT web_orders_no_double_submit UNIQUE (customer_id, ordered_on, amount);

INSERT INTO web_orders VALUES (9, 1, '2026-04-01', 500)
ON CONFLICT ON CONSTRAINT web_orders_no_double_submit DO NOTHING;

SELECT * FROM web_orders ORDER BY id;
```

**Explanation:** The unique constraint makes duplicates impossible even under concurrency; `ON CONFLICT … DO NOTHING` turns the retry into a no-op. A better real-world design is an **idempotency key** column (a client-generated request id) with a unique constraint, because a customer may legitimately buy the same amount twice in a day.

</details>
