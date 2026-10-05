# Common Table Expressions — Practice

### P1. Department payroll above company average

**Difficulty:** Easy · **Type:** Query · **Concepts:** two CTEs

Using CTEs, list departments whose total payroll is above the average departmental payroll (ignore employees without a department). Show department name and payroll, highest first.

**Expected output:**

```text
  dept_name  | total
-------------+--------
 Engineering | 412000
 Sales       | 263000
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
WITH payroll AS (
    SELECT dept_id, sum(salary) AS total
    FROM employees
    WHERE dept_id IS NOT NULL
    GROUP BY dept_id
),
average AS (
    SELECT avg(total) AS avg_total FROM payroll
)
SELECT d.dept_name, p.total
FROM payroll p
JOIN departments d ON d.dept_id = p.dept_id
CROSS JOIN average a
WHERE p.total > a.avg_total
ORDER BY p.total DESC;
```

**Explanation:** The four departmental payrolls average 219750.

</details>

### P2. Inlined or not?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** CTE materialization

On PostgreSQL 17, how is this CTE executed by default?

```sql
-- Illustrative
WITH recent AS (SELECT * FROM orders WHERE order_date >= '2026-03-01')
SELECT * FROM recent WHERE customer_id = 1;
```

- A) Materialized, because all CTEs are materialized
- B) Inlined into the main query, so both conditions can be applied in one scan
- C) Executed once per output row
- D) Rejected — CTEs cannot be filtered

<details>
<summary>Answer</summary>

**Answer:** B)

**Explanation:** It is referenced once, is not recursive and has no side effects, so PostgreSQL 12+ inlines it. A was true before PostgreSQL 12.

</details>

### P3. Top product per category

**Difficulty:** Medium · **Type:** Query · **Concepts:** CTE + window function

Using a CTE that computes quantity sold per product (excluding cancelled orders), return the best-selling product of each category (ties included).

**Expected output:**

```text
  category   | name  | qty
-------------+-------+-----
 Electronics | Mouse |   7
 Furniture   | Chair |   4
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
WITH sold AS (
    SELECT p.category, p.name, sum(oi.quantity) AS qty
    FROM order_items oi
    JOIN orders o   ON o.order_id = oi.order_id
    JOIN products p ON p.product_id = oi.product_id
    WHERE o.status <> 'CANCELLED'
    GROUP BY p.category, p.name
),
ranked AS (
    SELECT *, rank() OVER (PARTITION BY category ORDER BY qty DESC) AS rnk
    FROM sold
)
SELECT category, name, qty
FROM ranked
WHERE rnk = 1
ORDER BY category;
```

</details>

### P4. Promote and report in one statement

**Difficulty:** Medium · **Type:** Query · **Concepts:** data-modifying CTE, RETURNING

Give every HR employee a 10% raise and, in the same statement, return each name with old and new salary.

**Expected output:**

```text
  name  | old_salary | new_salary
--------+------------+------------
 Vikram |      70000 |      77000
 Pooja  |      52000 |      57200
(2 rows)
```

<details>
<summary>Hint</summary>

The CTE's `UPDATE … RETURNING` gives the new salary; the main query can still read the old value from `employees`, because it sees the snapshot from before the update.

</details>

<details>
<summary>Solution</summary>

```sql
WITH raised AS (
    UPDATE employees
    SET salary = salary * 110 / 100
    WHERE dept_id = 30
    RETURNING emp_id, name, salary AS new_salary
)
SELECT r.name, e.salary AS old_salary, r.new_salary
FROM raised r
JOIN employees e ON e.emp_id = r.emp_id
ORDER BY r.emp_id;
```

**Explanation:** The join to `employees` reads the pre-update snapshot. (Since PostgreSQL 18, `RETURNING old.salary, new.salary` gives both values directly from a plain `UPDATE`.)

</details>

### P5. Debug the archive job

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** data-modifying CTE snapshot

This statement should archive order 101 and then report how many orders remain. It reports 8, although one order was moved.

**Schema and data:**

```sql
CREATE TABLE orders_archive (LIKE orders);
```

```sql
WITH moved AS (
    DELETE FROM orders WHERE order_id = 101 RETURNING *
), archived AS (
    INSERT INTO orders_archive SELECT * FROM moved RETURNING order_id
)
SELECT (SELECT count(*) FROM orders) AS remaining,
       (SELECT count(*) FROM archived) AS archived;
```

**Output:**

```text
 remaining | archived
-----------+----------
         8 |        1
(1 row)
```

Is the data wrong? How would you report the correct remaining count?

<details>
<summary>Answer</summary>

The data is right: order 101 was deleted and archived. The main query reads `orders` from the snapshot taken when the statement started, so it still counts 8. Either compute it from the snapshot and the returned rows (`(SELECT count(*) FROM orders) - (SELECT count(*) FROM moved)`), or run the count as a separate statement afterwards:

```sql
SELECT count(*) AS remaining FROM orders;
```

**Output:**

```text
 remaining
-----------
         7
(1 row)
```

</details>
