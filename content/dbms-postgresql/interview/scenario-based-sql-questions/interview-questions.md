# Scenario-Based SQL Questions — Interview Questions

## Beginner

### Q1. "Show me revenue by product category this quarter (January–March 2026), excluding cancelled orders. Include categories with no sales."

<details>
<summary>Answer</summary>

Clarify: revenue = `quantity * unit_price` (the price paid, not the current list price). Then:

```sql
SELECT p.category, coalesce(sum(oi.quantity * oi.unit_price), 0) AS revenue
FROM products p
LEFT JOIN (order_items oi
           JOIN orders o ON o.order_id = oi.order_id
                        AND o.status <> 'CANCELLED'
                        AND o.order_date >= '2026-01-01' AND o.order_date < '2026-04-01')
       ON oi.product_id = p.product_id
GROUP BY p.category
ORDER BY revenue DESC;
```

**Output:**

```text
  category   | revenue
-------------+----------
 Electronics | 61450.00
 Furniture   | 34000.00
 Stationery  |        0
(3 rows)
```

The order filters sit inside the joined group, so products without qualifying sales still appear with 0.

</details>

### Q2. "Which cities have customers but no delivered orders?"

<details>
<summary>Answer</summary>

```sql
SELECT DISTINCT c.city
FROM customers c
WHERE c.city IS NOT NULL
  AND NOT EXISTS (SELECT 1
                  FROM customers c2
                  JOIN orders o ON o.customer_id = c2.customer_id AND o.status = 'DELIVERED'
                  WHERE c2.city = c.city)
ORDER BY c.city;
```

**Output:**

```text
 city
-------
 Delhi
 Pune
(2 rows)
```

Grain is the **city**, so the anti-join checks every customer of that city, not just the current one. Customers with an unknown city are excluded on purpose; confirm that with the requester.

</details>

### Q3. "List employees hired in the last two years (as of 2026-01-31), newest first, with their department name or 'Unassigned'."

<details>
<summary>Answer</summary>

```sql
SELECT e.name, e.hire_date, coalesce(d.dept_name, 'Unassigned') AS department
FROM employees e
LEFT JOIN departments d ON d.dept_id = e.dept_id
WHERE e.hire_date > DATE '2026-01-31' - interval '2 years'
ORDER BY e.hire_date DESC;
```

**Output:**

```text
 name  | hire_date  | department
-------+------------+------------
 Rahul | 2024-06-01 | Sales
 Nisha | 2024-02-15 | Unassigned
(2 rows)
```

In production use `current_date` instead of a fixed date; a fixed date keeps this example reproducible.

</details>

## Intermediate

### Q4. "Finance says total revenue is 150,450 but the dashboard shows more. Find out why."

<details>
<summary>Answer</summary>

Compute the total independently from the lowest grain, then compare it with the dashboard query's logic.

```sql
SELECT sum(quantity * unit_price) AS from_items,
       (SELECT sum(t) FROM (SELECT sum(oi.quantity * oi.unit_price) AS t
                             FROM orders o JOIN order_items oi ON oi.order_id = o.order_id
                             GROUP BY o.order_id) x) AS from_orders,
       (SELECT sum(oi.quantity * oi.unit_price)
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.order_id
        JOIN employees e ON e.dept_id = 20) AS with_bad_join
FROM order_items;
```

**Output:**

```text
 from_items | from_orders | with_bad_join
------------+-------------+---------------
  150450.00 |   150450.00 |     601800.00
(1 row)
```

A join to an unrelated or one-to-many table (here, the 4 Sales employees) multiplies every order line by 4 — fan-out. Look for joins that are not on keys, or one-to-many joins before aggregation. Also clarify whether Finance excludes cancelled orders (95,450 then).

</details>

### Q5. "Give each customer a segment: 'High' if lifetime delivered spend ≥ 50,000, 'Medium' if ≥ 5,000, 'Low' if above 0, 'None' otherwise."

<details>
<summary>Answer</summary>

```sql
WITH spend AS (
    SELECT c.customer_id, c.name,
           coalesce(sum(oi.quantity * oi.unit_price), 0) AS delivered_spend
    FROM customers c
    LEFT JOIN orders o       ON o.customer_id = c.customer_id AND o.status = 'DELIVERED'
    LEFT JOIN order_items oi ON oi.order_id = o.order_id
    GROUP BY c.customer_id, c.name
)
SELECT name, delivered_spend,
       CASE WHEN delivered_spend >= 50000 THEN 'High'
            WHEN delivered_spend >= 5000  THEN 'Medium'
            WHEN delivered_spend > 0      THEN 'Low'
            ELSE 'None' END AS segment
FROM spend
ORDER BY delivered_spend DESC, name;
```

**Output:**

```text
  name  | delivered_spend | segment
--------+-----------------+---------
 Anil   |        68500.00 | High
 Bhavna |        17000.00 | Medium
 Deepa  |         5000.00 | Medium
 Eshan  |         1500.00 | Low
 Chirag |               0 | None
 Fatima |               0 | None
(6 rows)
```

`CASE` branches are tested in order, so the thresholds go from highest to lowest.

</details>

### Q6. "Products are sometimes sold below list price. Show each order line sold at a discount, with the discount percentage."

<details>
<summary>Answer</summary>

```sql
SELECT oi.order_id, p.name, p.price AS list_price, oi.unit_price,
       round(100.0 * (p.price - oi.unit_price) / p.price, 1) AS discount_pct
FROM order_items oi
JOIN products p ON p.product_id = oi.product_id
WHERE oi.unit_price < p.price
ORDER BY discount_pct DESC, oi.order_id;
```

**Output:**

```text
 order_id | name  | list_price | unit_price | discount_pct
----------+-------+------------+------------+--------------
      106 | Mouse |     500.00 |     450.00 |         10.0
(1 row)
```

Storing `unit_price` on the order line (rather than reading the current product price) is what makes this history possible.

</details>

### Q7. "We want to email customers who ordered in January but not since. Who are they?"

<details>
<summary>Answer</summary>

```sql
SELECT c.customer_id, c.name, c.email
FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o
              WHERE o.customer_id = c.customer_id
                AND o.order_date >= '2026-01-01' AND o.order_date < '2026-02-01')
  AND NOT EXISTS (SELECT 1 FROM orders o
                  WHERE o.customer_id = c.customer_id AND o.order_date >= '2026-02-01')
ORDER BY c.customer_id;
```

**Output:**

```text
 customer_id | name | email
-------------+------+-------
(0 rows)
```

Both January customers (Anil and Bhavna) ordered again later, so the list is empty, and that is a valid answer. Report it rather than loosening the query. Also check the follow-up: customers with a `NULL` email cannot be emailed.

</details>

## Advanced

### Q8. "Each order should have at least one item, and the order total must match the payment. How would you find violations?"

<details>
<summary>Answer</summary>

Write **data-quality queries** that return violating rows (zero rows means healthy):

```sql
-- Illustrative
-- Orders without items
SELECT o.order_id FROM orders o
WHERE NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.order_id);

-- Orders whose payments differ from their item total
SELECT t.order_id, t.items_total, p.paid
FROM (SELECT order_id, sum(quantity * unit_price) AS items_total FROM order_items GROUP BY order_id) t
LEFT JOIN (SELECT order_id, sum(amount) AS paid FROM payments GROUP BY order_id) p USING (order_id)
WHERE p.paid IS DISTINCT FROM t.items_total;
```

Aggregate each child table separately to avoid fan-out; `IS DISTINCT FROM` also catches orders with no payment (`NULL`). Schedule them as checks, and enforce what can be enforced with constraints.

</details>

### Q9. "The sales team wants a leaderboard: each salesperson's rank by total commission, ties sharing a rank, and the gap to the person above."

<details>
<summary>Answer</summary>

```sql
SELECT name, coalesce(commission, 0) AS commission,
       DENSE_RANK() OVER (ORDER BY coalesce(commission, 0) DESC) AS rank,
       lag(coalesce(commission, 0)) OVER (ORDER BY coalesce(commission, 0) DESC, emp_id)
           - coalesce(commission, 0) AS gap_to_above
FROM employees
WHERE dept_id = 20
ORDER BY rank, emp_id;
```

**Output:**

```text
 name  | commission | rank | gap_to_above
-------+------------+------+--------------
 Divya |       5000 |    1 |         NULL
 Arjun |       3000 |    2 |         2000
 Sneha |          0 |    3 |         3000
 Rahul |          0 |    3 |            0
(4 rows)
```

Decisions to state: `NULL` commission counts as 0, ties share a dense rank, and the gap compares with the previous row in a deterministic order.

</details>

### Q10. "A nightly job must flag customers whose spend dropped by more than 50% month over month. How would you design it?"

<details>
<summary>Answer</summary>

1. Build monthly spend per customer with a complete calendar: customers × `generate_series` months, `LEFT JOIN` the aggregated orders, `coalesce(…, 0)`.
2. `lag(spend) OVER (PARTITION BY customer_id ORDER BY month)` for the previous month.
3. Flag where `prev > 0 AND spend < 0.5 * prev`.
4. Write the flags into a table with the run date (idempotent: `INSERT … ON CONFLICT (customer_id, month) DO UPDATE`), so reruns do not duplicate.
5. Index orders on `(customer_id, order_date)`, or maintain a monthly summary table, so the job does not rescan years of history.

</details>
