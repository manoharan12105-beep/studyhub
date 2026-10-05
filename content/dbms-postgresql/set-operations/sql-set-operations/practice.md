# Set Operations — Practice

### P1. How many rows after UNION?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** UNION vs UNION ALL

`A` returns 1, 2, 2, 3 and `B` returns 2, 3, 4. How many rows do `A UNION B` and `A UNION ALL B` return?

- A) 4 and 7
- B) 7 and 4
- C) 4 and 4
- D) 3 and 7

<details>
<summary>Answer</summary>

**Answer:** A)

**Explanation:** `UNION` returns the distinct values 1, 2, 3, 4 — the duplicate 2 inside `A` is removed too. `UNION ALL` returns all 4 + 3 = 7 rows.

</details>

### P2. Customer names that are also employee names

**Difficulty:** Easy · **Type:** Query · **Concepts:** INTERSECT

**Schema and data:**

```sql
INSERT INTO customers VALUES (7, 'Ravi', 'Chennai', 'ravi.k@mail.com');
```

List names that appear both as an employee and as a customer.

**Expected output:**

```text
 name
------
 Ravi
(1 row)
```

<details>
<summary>Solution</summary>

```sql
SELECT name FROM employees
INTERSECT
SELECT name FROM customers;
```

</details>

### P3. Products not sold in March

**Difficulty:** Medium · **Type:** Query · **Concepts:** EXCEPT

List the ids and names of products that were not part of any March 2026 order (any status).

**Expected output:**

```text
 product_id |   name
------------+----------
          1 | Laptop
          6 | Notebook
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT product_id, name FROM products
EXCEPT
SELECT p.product_id, p.name
FROM products p
JOIN order_items oi ON oi.product_id = p.product_id
JOIN orders o       ON o.order_id = oi.order_id
WHERE o.order_date >= '2026-03-01' AND o.order_date < '2026-04-01'
ORDER BY product_id;
```

**Alternative:** `NOT EXISTS` with a correlated subquery — preferable if you need more columns or the right side is large.

</details>

### P4. One activity feed

**Difficulty:** Medium · **Type:** Query · **Concepts:** UNION ALL, labels, ORDER BY on the result

Build a feed of events — employee hires in 2024 and orders in March 2026 — with columns `event_date`, `kind`, `detail`, newest first.

**Expected output:**

```text
 event_date | kind  |        detail
------------+-------+-----------------------
 2026-03-28 | order | order 108 (DELIVERED)
 2026-03-15 | order | order 107 (DELIVERED)
 2026-03-01 | order | order 106 (PLACED)
 2024-06-01 | hire  | Rahul
 2024-02-15 | hire  | Nisha
(5 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT hire_date AS event_date, 'hire' AS kind, name AS detail
FROM employees
WHERE hire_date >= '2024-01-01' AND hire_date < '2025-01-01'
UNION ALL
SELECT order_date, 'order', 'order ' || order_id || ' (' || status || ')'
FROM orders
WHERE order_date >= '2026-03-01' AND order_date < '2026-04-01'
ORDER BY event_date DESC;
```

**Explanation:** Column names come from the first branch, so the final `ORDER BY` uses `event_date`. `UNION ALL` is correct because the `kind` label makes the branches disjoint.

</details>

### P5. Why are rows missing?

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** UNION removes duplicates

A payments report combines two payment channels, but the total is too low.

**Schema and data:**

```sql
CREATE TABLE card_payments (customer_id int, amount numeric);
CREATE TABLE upi_payments  (customer_id int, amount numeric);
INSERT INTO card_payments VALUES (1, 500), (1, 500), (2, 300);
INSERT INTO upi_payments  VALUES (1, 500), (3, 200);
```

```sql
SELECT sum(amount) AS total
FROM (SELECT customer_id, amount FROM card_payments
      UNION
      SELECT customer_id, amount FROM upi_payments) AS p;
```

**Output:**

```text
 total
-------
  1000
(1 row)
```

<details>
<summary>Answer</summary>

`UNION` treats the three `(1, 500)` payments as one row. They are separate payments, so use `UNION ALL`:

```sql
SELECT sum(amount) AS total
FROM (SELECT customer_id, amount FROM card_payments
      UNION ALL
      SELECT customer_id, amount FROM upi_payments) AS p;
```

**Output:**

```text
 total
-------
  2000
(1 row)
```

</details>

### P6. Predict with precedence and NULLs

**Difficulty:** Hard · **Type:** Output · **Concepts:** precedence, NULL equality, EXCEPT ALL

What does this return?

```sql
SELECT x FROM (VALUES (1), (NULL), (NULL)) AS a(x)
EXCEPT ALL
SELECT x FROM (VALUES (NULL::int)) AS b(x)
UNION
SELECT 2
ORDER BY x;
```

<details>
<summary>Answer</summary>

**Output:**

```text
  x
------
    1
    2
 NULL
(3 rows)
```

`EXCEPT` and `UNION` have equal precedence, so it is `(a EXCEPT ALL b) UNION (2)`. `a EXCEPT ALL b` removes one `NULL` (NULLs are equal in set operations), leaving `1, NULL`. `UNION` with 2 then removes duplicates, leaving `1, NULL, 2`, and the final `ORDER BY x` (which applies to the whole result) sorts `NULL` last in ascending order. (The `NULL::int` cast matters: an untyped `NULL` in a `VALUES` subquery resolves to `text`, and `EXCEPT` would fail with "types integer and text cannot be matched".)

</details>
