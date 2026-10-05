# NULL and Three-Valued Logic — Practice

### P1. Evaluate the expressions

**Difficulty:** Easy · **Type:** Output · **Concepts:** three-valued logic

Predict each result (TRUE, FALSE or NULL), then run it.

```sql
SELECT NULL OR true   AS a,
       NULL AND true  AS b,
       NULL = 0       AS c,
       NULL IS NULL   AS d,
       NOT (NULL = 1) AS e,
       1 + NULL       AS f;
```

<details>
<summary>Answer</summary>

**Output:**

```text
 a |  b   |  c   | d |  e   |  f
---+------+------+---+------+------
 t | NULL | NULL | t | NULL | NULL
(1 row)
```

a = TRUE (`TRUE OR anything`), b = UNKNOWN, c = UNKNOWN, d = TRUE, e = UNKNOWN (`NOT UNKNOWN`), f = NULL. psql prints `t` for TRUE and `NULL` (with `\pset null NULL`) for UNKNOWN.

</details>

### P2. Customers without a city

**Difficulty:** Easy · **Type:** Query · **Concepts:** IS NULL

List customers whose city is unknown.

**Expected output:**

```text
 customer_id | name
-------------+-------
           5 | Eshan
(1 row)
```

<details>
<summary>Solution</summary>

```sql
SELECT customer_id, name
FROM customers
WHERE city IS NULL;
```

**Explanation:** `WHERE city = NULL` would return nothing.

</details>

### P3. Everyone not in Chennai

**Difficulty:** Medium · **Type:** Query · **Concepts:** IS DISTINCT FROM

List all customers who are **not known to be** in Chennai — including those whose city is unknown. Order by id.

**Expected output:**

```text
 customer_id |  name  |  city
-------------+--------+--------
           2 | Bhavna | Mumbai
           3 | Chirag | Delhi
           5 | Eshan  | NULL
           6 | Fatima | Pune
(4 rows)
```

<details>
<summary>Hint</summary>

`city <> 'Chennai'` drops the NULL city.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT customer_id, name, city
FROM customers
WHERE city IS DISTINCT FROM 'Chennai'
ORDER BY customer_id;
```

**Alternative:** `WHERE city <> 'Chennai' OR city IS NULL`.

</details>

### P4. Total pay

**Difficulty:** Medium · **Type:** Query · **Concepts:** COALESCE

Show each Sales employee's total pay (salary + commission), treating a missing commission as 0. Order by total pay descending.

**Expected output:**

```text
 name  | total_pay
-------+-----------
 Divya |     93000
 Arjun |     63000
 Sneha |     60000
 Rahul |     55000
(4 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT name, salary + COALESCE(commission, 0) AS total_pay
FROM employees
WHERE dept_id = 20
ORDER BY total_pay DESC;
```

**Explanation:** Without `COALESCE`, Sneha's total would be `NULL`.

</details>

### P5. Average price per order item, safely

**Difficulty:** Medium · **Type:** Query · **Concepts:** NULLIF

For each order, compute the average unit price per item quantity as `sum(quantity × unit_price) / sum(quantity)` but return `NULL` instead of an error if a total quantity were 0. Show orders 101 and 108.

**Expected output:**

```text
 order_id | avg_unit_price
----------+----------------
      101 |       18666.67
      108 |         500.00
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT order_id,
       round(sum(quantity * unit_price) / NULLIF(sum(quantity), 0), 2) AS avg_unit_price
FROM order_items
WHERE order_id IN (101, 108)
GROUP BY order_id
ORDER BY order_id;
```

**Explanation:** `NULLIF(x, 0)` turns a zero divisor into `NULL`, and division by `NULL` yields `NULL` rather than an error. Order 101: (55000 + 2 × 500) / 3 = 18666.67.

</details>

### P6. Count the gap

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** three-valued logic

A table has 1000 rows. `WHERE rating >= 3` returns 600 rows and `WHERE rating < 3` returns 350. Explain the missing 50 and write a query that returns them.

<details>
<summary>Answer</summary>

The 50 rows have `rating IS NULL`: both conditions are UNKNOWN for them, so neither `WHERE` keeps them. Query: `SELECT … WHERE rating IS NULL`.

</details>

### P7. The impossible CASE branch

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** CASE, NULL

This query labels every customer, but nobody is ever labelled `'Unknown'`. Why? Fix it.

```sql
SELECT name,
       CASE city WHEN NULL THEN 'Unknown' WHEN 'Chennai' THEN 'Local' ELSE 'Outstation' END AS region
FROM customers
ORDER BY customer_id;
```

**Output:**

```text
  name  |   region
--------+------------
 Anil   | Local
 Bhavna | Outstation
 Chirag | Outstation
 Deepa  | Local
 Eshan  | Outstation
 Fatima | Outstation
(6 rows)
```

<details>
<summary>Answer</summary>

A simple `CASE city WHEN NULL` tests `city = NULL`, which is never TRUE, so Eshan falls through to `ELSE`. Use a searched `CASE`:

```sql
SELECT name,
       CASE WHEN city IS NULL      THEN 'Unknown'
            WHEN city = 'Chennai'  THEN 'Local'
            ELSE 'Outstation' END AS region
FROM customers
ORDER BY customer_id;
```

</details>
