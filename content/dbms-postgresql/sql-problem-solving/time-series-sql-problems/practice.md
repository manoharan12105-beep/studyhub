# Time-Series SQL Problems — Practice

Problems use the [sample database](../../sql-fundamentals/dbms-sample-database/content.md) unless they define their own tables.

### P1. Pick the frame

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** window frames

A table has one row per day, but some days are missing. Which frame computes a correct "last 7 calendar days" total?

- A) `ROWS BETWEEN 6 PRECEDING AND CURRENT ROW`
- B) `ROWS BETWEEN 7 PRECEDING AND CURRENT ROW`
- C) `RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW`
- D) `RANGE UNBOUNDED PRECEDING`

<details>
<summary>Answer</summary>

**Answer:** C)

**Explanation:** `ROWS` counts rows, which spans more than 7 days when days are missing. D is a running total from the beginning.

</details>

### P2. Orders per month by status

**Difficulty:** Easy · **Type:** Query · **Concepts:** date_trunc, FILTER

For each month, count all orders and the delivered ones.

**Expected output:**

```text
   month    | orders | delivered
------------+--------+-----------
 2026-01-01 |      2 |         2
 2026-02-01 |      3 |         1
 2026-03-01 |      3 |         2
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT date_trunc('month', order_date)::date AS month,
       count(*) AS orders,
       count(*) FILTER (WHERE status = 'DELIVERED') AS delivered
FROM orders
GROUP BY 1
ORDER BY 1;
```

</details>

### P3. Running total of order lines by date

**Difficulty:** Easy · **Type:** Query · **Concepts:** running total, peers

Show each order's date, total, and the running total of all (including cancelled) orders by date.

**Expected output:**

```text
 order_id | order_date |  total   | running_total
----------+------------+----------+---------------
      101 | 2026-01-05 | 56000.00 |      56000.00
      102 | 2026-01-12 | 17000.00 |      73000.00
      103 | 2026-02-03 |  1500.00 |      74500.00
      104 | 2026-02-14 | 55000.00 |     129500.00
      105 | 2026-02-20 |  5000.00 |     134500.00
      106 | 2026-03-01 |  1950.00 |     136450.00
      107 | 2026-03-15 | 12500.00 |     148950.00
      108 | 2026-03-28 |  1500.00 |     150450.00
(8 rows)
```

<details>
<summary>Hint</summary>

Aggregate per order first; then `sum(…) OVER (ORDER BY order_date, order_id)`. You can nest: `sum(sum(x)) OVER (…)`.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT o.order_id, o.order_date,
       sum(oi.quantity * oi.unit_price) AS total,
       sum(sum(oi.quantity * oi.unit_price)) OVER (ORDER BY o.order_date, o.order_id) AS running_total
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
GROUP BY o.order_id
ORDER BY o.order_date, o.order_id;
```

**Explanation:** The inner `sum` is the `GROUP BY` aggregate; the outer `sum … OVER` runs over the grouped rows.

</details>

### P4. Weekly signups with empty weeks

**Difficulty:** Medium · **Type:** Query · **Concepts:** generate_series, LEFT JOIN, date_trunc week

**Schema and data:**

```sql
CREATE TABLE signups (user_id int PRIMARY KEY, signed_up date NOT NULL);
INSERT INTO signups VALUES
    (1, '2026-03-02'), (2, '2026-03-04'), (3, '2026-03-05'),
    (4, '2026-03-18'), (5, '2026-03-19'), (6, '2026-03-30');
```

Report signups per ISO week (weeks start on Monday) from the week of 2 March to the week of 30 March 2026, including weeks with none.

**Expected output:**

```text
    week    | signups
------------+---------
 2026-03-02 |       3
 2026-03-09 |       0
 2026-03-16 |       2
 2026-03-23 |       0
 2026-03-30 |       1
(5 rows)
```

<details>
<summary>Hint</summary>

`date_trunc('week', …)` returns the Monday. Generate Mondays with a 1-week step.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT w::date AS week, count(s.user_id) AS signups
FROM generate_series(TIMESTAMP '2026-03-02', TIMESTAMP '2026-03-30', interval '1 week') AS w
LEFT JOIN signups s ON date_trunc('week', s.signed_up) = w
GROUP BY w
ORDER BY w;
```

**Explanation:** `count(s.user_id)` counts only matched rows, so empty weeks show 0; `count(*)` would show 1.

</details>

### P5. Month-over-month change in order count

**Difficulty:** Medium · **Type:** Query · **Concepts:** lag over aggregates

**Expected output:**

```text
   month    | orders | prev | change
------------+--------+------+--------
 2026-01-01 |      2 | NULL |   NULL
 2026-02-01 |      3 |    2 |      1
 2026-03-01 |      3 |    3 |      0
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT date_trunc('month', order_date)::date AS month,
       count(*) AS orders,
       lag(count(*)) OVER (ORDER BY date_trunc('month', order_date)::date) AS prev,
       count(*) - lag(count(*)) OVER (ORDER BY date_trunc('month', order_date)::date) AS change
FROM orders
GROUP BY 1
ORDER BY 1;
```

**Explanation:** The window `ORDER BY` must use exactly the grouped expression (including `::date`). Otherwise PostgreSQL complains that `order_date` is not grouped.

</details>

### P6. Month-to-date revenue that resets

**Difficulty:** Medium · **Type:** Query · **Concepts:** PARTITION BY month, running total

For non-cancelled orders, show each order's total and the month-to-date revenue.

**Expected output:**

```text
 order_id | order_date |  total   | month_to_date
----------+------------+----------+---------------
      101 | 2026-01-05 | 56000.00 |      56000.00
      102 | 2026-01-12 | 17000.00 |      73000.00
      103 | 2026-02-03 |  1500.00 |       1500.00
      105 | 2026-02-20 |  5000.00 |       6500.00
      106 | 2026-03-01 |  1950.00 |       1950.00
      107 | 2026-03-15 | 12500.00 |      14450.00
      108 | 2026-03-28 |  1500.00 |      15950.00
(7 rows)
```

<details>
<summary>Solution</summary>

```sql
WITH t AS (
    SELECT o.order_id, o.order_date, sum(oi.quantity * oi.unit_price) AS total
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.order_id
    WHERE o.status <> 'CANCELLED'
    GROUP BY o.order_id
)
SELECT order_id, order_date, total,
       sum(total) OVER (PARTITION BY date_trunc('month', order_date)
                        ORDER BY order_date, order_id) AS month_to_date
FROM t
ORDER BY order_date, order_id;
```

</details>

### P7. Seven-day rolling total

**Difficulty:** Medium · **Type:** Query · **Concepts:** RANGE with interval

**Schema and data:**

```sql
CREATE TABLE sales_days (day date PRIMARY KEY, amount int NOT NULL);
INSERT INTO sales_days VALUES
    ('2026-05-01', 10), ('2026-05-03', 20), ('2026-05-07', 30),
    ('2026-05-08', 40), ('2026-05-15', 50);
```

For each day, show the total of the last 7 calendar days (that day and the 6 before).

**Expected output:**

```text
    day     | amount | last_7_days
------------+--------+-------------
 2026-05-01 |     10 |          10
 2026-05-03 |     20 |          30
 2026-05-07 |     30 |          60
 2026-05-08 |     40 |          90
 2026-05-15 |     50 |          50
(5 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT day, amount,
       sum(amount) OVER (ORDER BY day RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW) AS last_7_days
FROM sales_days
ORDER BY day;
```

**Explanation:** On 8 May the window is 2–8 May: 20 + 30 + 40 = 90 (1 May falls outside). A `ROWS` frame would have included it.

</details>

### P8. Longest gap between orders

**Difficulty:** Medium · **Type:** Query · **Concepts:** lag, then aggregate

For each customer with at least two orders, show the longest gap in days between consecutive orders.

**Expected output:**

```text
 customer_id | longest_gap_days
-------------+------------------
           1 |               40
           2 |               48
(2 rows)
```

<details>
<summary>Hint</summary>

Window functions cannot be nested inside aggregates in the same level. Compute the gaps in a subquery, then `max` them.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT customer_id, max(gap) AS longest_gap_days
FROM (SELECT customer_id,
             order_date - lag(order_date) OVER (PARTITION BY customer_id ORDER BY order_date, order_id) AS gap
      FROM orders) t
WHERE gap IS NOT NULL
GROUP BY customer_id
ORDER BY customer_id;
```

</details>

### P9. The broken monthly filter

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** half-open ranges, timestamps

**Schema and data:**

```sql
CREATE TABLE clicks (id int, clicked_at timestamp);
INSERT INTO clicks VALUES
    (1, '2026-02-01 00:00'), (2, '2026-02-14 12:00'),
    (3, '2026-02-28 09:30'), (4, '2026-03-01 00:00');
```

This query should count February's clicks (3), but returns 2:

```sql
SELECT count(*) FROM clicks
WHERE clicked_at BETWEEN '2026-02-01' AND '2026-02-28';
```

**Output:**

```text
 count
-------
     2
(1 row)
```

Fix it.

**Expected output:**

```text
 count
-------
     3
(1 row)
```

<details>
<summary>Solution</summary>

```sql
SELECT count(*) FROM clicks
WHERE clicked_at >= '2026-02-01' AND clicked_at < '2026-03-01';
```

**Explanation:** `'2026-02-28'` as a timestamp is midnight, so the click at 09:30 on the 28th is excluded. Extending `BETWEEN` to `'2026-03-01'` would wrongly include click 4. A half-open range has neither problem.

</details>

### P10. Cohort: repeat customers by first-order month

**Difficulty:** Hard · **Type:** Query · **Concepts:** first order per customer, conditional aggregation

For each first-order month, show how many customers started then and how many of them ordered again later.

**Expected output:**

```text
 cohort_month | customers | came_back
--------------+-----------+-----------
 2026-01-01   |         2 |         2
 2026-02-01   |         2 |         0
 2026-03-01   |         1 |         0
(3 rows)
```

<details>
<summary>Hint</summary>

Per customer: first order date and number of orders. Then group those rows by month.

</details>

<details>
<summary>Solution</summary>

```sql
WITH per_customer AS (
    SELECT customer_id,
           date_trunc('month', min(order_date))::date AS cohort_month,
           count(*) AS orders
    FROM orders
    GROUP BY customer_id
)
SELECT cohort_month,
       count(*) AS customers,
       count(*) FILTER (WHERE orders > 1) AS came_back
FROM per_customer
GROUP BY cohort_month
ORDER BY cohort_month;
```

**Explanation:** Anil and Bhavna (January) ordered again; Chirag and Deepa (February) and Eshan (March) did not. Real cohort reports add a second dimension — orders per month since the cohort month — with `generate_series` and a conditional count.

</details>
