# DISTINCT ON — Practice

### P1. Cheapest product per category

**Difficulty:** Easy · **Type:** Query · **Concepts:** DISTINCT ON

Return the cheapest product of each category.

**Expected output:**

```text
  category   |   name   |  price
-------------+----------+---------
 Electronics | Mouse    |  500.00
 Furniture   | Chair    | 4500.00
 Stationery  | Notebook |   50.00
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT DISTINCT ON (category) category, name, price
FROM products
ORDER BY category, price, product_id;
```

</details>

### P2. Which query is valid?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** ORDER BY rule

- A) `SELECT DISTINCT ON (dept_id) * FROM employees ORDER BY salary DESC;`
- B) `SELECT DISTINCT ON (dept_id) * FROM employees ORDER BY dept_id, salary DESC;`
- C) `SELECT DISTINCT ON (dept_id) * FROM employees ORDER BY salary DESC, dept_id;`
- D) `SELECT DISTINCT ON (dept_id, name) * FROM employees ORDER BY name, dept_id;`

<details>
<summary>Answer</summary>

**Answer:** B)

**Explanation:** The `DISTINCT ON` expressions must be the leftmost `ORDER BY` items in the same order. A and C put `salary` first; D reverses the two keys.

</details>

### P3. Each customer's largest order

**Difficulty:** Medium · **Type:** Query · **Concepts:** DISTINCT ON over an aggregate

For each customer, return the order with the highest total value (any status), with the value. Break ties by the lower order id.

**Expected output:**

```text
 customer_id | order_id | order_value
-------------+----------+-------------
           1 |      101 |    56000.00
           2 |      102 |    17000.00
           3 |      104 |    55000.00
           4 |      105 |     5000.00
           5 |      108 |     1500.00
(5 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT DISTINCT ON (o.customer_id)
       o.customer_id, o.order_id, sum(oi.quantity * oi.unit_price) AS order_value
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
GROUP BY o.customer_id, o.order_id
ORDER BY o.customer_id, order_value DESC, o.order_id;
```

**Explanation:** `DISTINCT ON` is applied after grouping, so it picks among the per-order totals; `ORDER BY` may use the output alias `order_value`.

</details>

### P4. Current status per shipment

**Difficulty:** Medium · **Type:** Query · **Concepts:** latest row per key

**Schema and data:**

```sql
CREATE TABLE shipment_events (shipment_id int, event_time timestamp, status text);
INSERT INTO shipment_events VALUES
    (1, '2026-03-01 09:00', 'PACKED'), (1, '2026-03-02 08:00', 'IN_TRANSIT'),
    (2, '2026-03-01 10:00', 'PACKED'), (1, '2026-03-03 18:00', 'DELIVERED'),
    (2, '2026-03-02 11:00', 'IN_TRANSIT'), (3, '2026-03-03 09:00', 'PACKED');
```

Return the latest status of every shipment.

**Expected output:**

```text
 shipment_id |   status   |     event_time
-------------+------------+---------------------
           1 | DELIVERED  | 2026-03-03 18:00:00
           2 | IN_TRANSIT | 2026-03-02 11:00:00
           3 | PACKED     | 2026-03-03 09:00:00
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT DISTINCT ON (shipment_id) shipment_id, status, event_time
FROM shipment_events
ORDER BY shipment_id, event_time DESC;
```

</details>

### P5. The result changes between runs

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** ties, determinism

A report shows "the highest-paid employee per department". In production, one department has two employees on the same top salary, and the report sometimes shows a different person after an unrelated data change. The query:

```sql
-- Illustrative
SELECT DISTINCT ON (dept_id) dept_id, name, salary
FROM employees
ORDER BY dept_id, salary DESC;
```

Is the report wrong? What should change if the business wants (a) one deterministic person, (b) every top earner?

<details>
<summary>Answer</summary>

When two employees share a department's top salary, `ORDER BY dept_id, salary DESC` does not decide between them, so the chosen row depends on the physical order rows reach the `Unique` step, which can change after updates, vacuum or a different plan. (a) Add a unique tiebreaker reflecting a rule, e.g. `ORDER BY dept_id, salary DESC, hire_date, emp_id` (most senior wins). (b) Use `rank()`:

```sql
SELECT dept_id, name, salary
FROM (SELECT dept_id, name, salary,
             rank() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS r
      FROM employees) AS t
WHERE r = 1
ORDER BY dept_id, name;
```

**Output:**

```text
 dept_id |  name  | salary
---------+--------+--------
      10 | Asha   | 150000
      20 | Divya  |  88000
      30 | Vikram |  70000
      40 | Farhan |  82000
    NULL | Nisha  |  45000
(5 rows)
```

In the sample data no department has a tie at the top, so this matches the `DISTINCT ON` result; in a department with two top earners, both rows would appear.

</details>
