# INNER, LEFT, RIGHT and FULL Joins — Practice

### P1. Orders with customer names

**Difficulty:** Easy · **Type:** Query · **Concepts:** INNER JOIN

List each order with the customer's name and city, ordered by order id.

**Expected output:**

```text
 order_id |  name  |  city
----------+--------+---------
      101 | Anil   | Chennai
      102 | Bhavna | Mumbai
      103 | Anil   | Chennai
      104 | Chirag | Delhi
      105 | Deepa  | Chennai
      106 | Bhavna | Mumbai
      107 | Anil   | Chennai
      108 | Eshan  | NULL
(8 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT o.order_id, c.name, c.city
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
ORDER BY o.order_id;
```

</details>

### P2. Predict the row count

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** LEFT JOIN

How many rows does `SELECT * FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id;` return on the sample data (6 customers, 8 orders, Fatima has none)?

- A) 6
- B) 8
- C) 9
- D) 14

<details>
<summary>Answer</summary>

**Answer:** C) 9

**Explanation:** The 8 orders each match one customer (8 rows) plus one padded row for Fatima.

</details>

### P3. Revenue per customer, including zero

**Difficulty:** Medium · **Type:** Query · **Concepts:** LEFT JOIN chain, COALESCE

For every customer, show total revenue from non-cancelled orders (0 if none). Order by revenue descending, then name.

**Expected output:**

```text
  name  | revenue
--------+----------
 Anil   | 70000.00
 Bhavna | 18950.00
 Deepa  |  5000.00
 Eshan  |  1500.00
 Chirag |        0
 Fatima |        0
(6 rows)
```

<details>
<summary>Hint</summary>

Put the status filter in the `ON` clause of the orders join, not in `WHERE`, or Fatima and Chirag disappear.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT c.name,
       COALESCE(sum(oi.quantity * oi.unit_price), 0) AS revenue
FROM customers c
LEFT JOIN orders o
       ON o.customer_id = c.customer_id
      AND o.status <> 'CANCELLED'
LEFT JOIN order_items oi ON oi.order_id = o.order_id
GROUP BY c.customer_id, c.name
ORDER BY revenue DESC, c.name;
```

**Explanation:** Both joins are `LEFT` so customers without (valid) orders survive. Chirag's only order is cancelled; the condition in `ON` makes that order not match, so Chirag keeps a padded row with revenue 0.

</details>

### P4. Reconcile two lists

**Difficulty:** Medium · **Type:** Query · **Concepts:** FULL OUTER JOIN

A warehouse count is loaded into `stock_count(product_id, counted_qty)`. Show products that are in the catalogue but not counted, and counted ids that are not in the catalogue.

**Schema and data:**

```sql
CREATE TABLE stock_count (product_id integer, counted_qty integer);
INSERT INTO stock_count VALUES (1, 4), (2, 40), (3, 12), (9, 5);
```

**Expected output:**

```text
 catalogue_id |   name   | counted_id | counted_qty
--------------+----------+------------+-------------
            4 | Desk     |       NULL |        NULL
            5 | Chair    |       NULL |        NULL
            6 | Notebook |       NULL |        NULL
         NULL | NULL     |          9 |           5
(4 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT p.product_id AS catalogue_id, p.name, s.product_id AS counted_id, s.counted_qty
FROM products p
FULL JOIN stock_count s ON s.product_id = p.product_id
WHERE p.product_id IS NULL OR s.product_id IS NULL
ORDER BY COALESCE(p.product_id, s.product_id);
```

**Explanation:** Products 4, 5 and 6 were not counted; id 9 was counted but does not exist in the catalogue.

</details>

### P5. Spot the fan-out

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** fan-out, pre-aggregation

This query should show each customer's number of orders and number of distinct products bought, but the order counts are too high. Explain and fix it.

```sql
SELECT c.name, count(o.order_id) AS orders, count(DISTINCT oi.product_id) AS products
FROM customers c
JOIN orders o       ON o.customer_id = c.customer_id
JOIN order_items oi ON oi.order_id = o.order_id
GROUP BY c.customer_id, c.name
ORDER BY c.customer_id;
```

**Output:**

```text
  name  | orders | products
--------+--------+----------
 Anil   |      5 |        5
 Bhavna |      4 |        4
 Chirag |      1 |        1
 Deepa  |      2 |        2
 Eshan  |      1 |        1
(5 rows)
```

<details>
<summary>Answer</summary>

Joining to `order_items` repeats each order once per item, so `count(o.order_id)` counts items. `count(DISTINCT o.order_id)` fixes this query:

```sql
SELECT c.name, count(DISTINCT o.order_id) AS orders, count(DISTINCT oi.product_id) AS products
FROM customers c
JOIN orders o       ON o.customer_id = c.customer_id
JOIN order_items oi ON oi.order_id = o.order_id
GROUP BY c.customer_id, c.name
ORDER BY c.customer_id;
```

For sums (not counts), `DISTINCT` does not help — two different orders can have the same amount. Aggregate each child table in a subquery/CTE first, then join the results.

</details>
