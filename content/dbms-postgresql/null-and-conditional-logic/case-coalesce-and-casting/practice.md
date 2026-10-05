# CASE, COALESCE, NULLIF and Type Casting — Practice

### P1. Price categories

**Difficulty:** Easy · **Type:** Query · **Concepts:** searched CASE

Label each product `'Budget'` (below 1000), `'Mid'` (1000 to below 10000) or `'Premium'` (10000 and above). Order by price.

**Expected output:**

```text
   name   |  price   |  tier
----------+----------+---------
 Notebook |    50.00 | Budget
 Mouse    |   500.00 | Budget
 Keyboard |  1500.00 | Mid
 Chair    |  4500.00 | Mid
 Desk     |  8000.00 | Mid
 Laptop   | 55000.00 | Premium
(6 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT name, price,
       CASE
           WHEN price < 1000  THEN 'Budget'
           WHEN price < 10000 THEN 'Mid'
           ELSE 'Premium'
       END AS tier
FROM products
ORDER BY price;
```

</details>

### P2. Contact line

**Difficulty:** Easy · **Type:** Query · **Concepts:** COALESCE

For every customer show `name` and a `contact` value: the email if known, else the city, else `'no contact'`. Order by id.

**Expected output:**

```text
  name  |     contact
--------+-----------------
 Anil   | anil@mail.com
 Bhavna | bhavna@mail.com
 Chirag | chirag@mail.com
 Deepa  | Chennai
 Eshan  | eshan@mail.com
 Fatima | fatima@mail.com
(6 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT name, COALESCE(email, city, 'no contact') AS contact
FROM customers
ORDER BY customer_id;
```

**Explanation:** `COALESCE` takes the first non-NULL of any number of arguments. Deepa has no email, so her city is used.

</details>

### P3. Department pivot

**Difficulty:** Medium · **Type:** Query · **Concepts:** conditional aggregation

One row: the number of employees in Engineering, Sales and HR, and those without a department, as four columns.

**Expected output:**

```text
 engineering | sales | hr | unassigned
-------------+-------+----+------------
           4 |     4 |  2 |          1
(1 row)
```

<details>
<summary>Solution</summary>

```sql
SELECT count(*) FILTER (WHERE dept_id = 10)    AS engineering,
       count(*) FILTER (WHERE dept_id = 20)    AS sales,
       count(*) FILTER (WHERE dept_id = 30)    AS hr,
       count(*) FILTER (WHERE dept_id IS NULL) AS unassigned
FROM employees;
```

**Alternative:** `sum(CASE WHEN dept_id = 10 THEN 1 ELSE 0 END)` for databases without `FILTER`.

</details>

### P4. Revenue per item sold, safely

**Difficulty:** Medium · **Type:** Query · **Concepts:** NULLIF, casting

For each product show the total quantity sold and the average revenue per unit (2 decimals). Products never sold must appear with quantity 0 and `NULL` average — no division error. Order by product id.

**Expected output:**

```text
   name   | qty_sold | avg_per_unit
----------+----------+--------------
 Laptop   |        2 |     55000.00
 Mouse    |        7 |       492.86
 Keyboard |        2 |      1500.00
 Desk     |        2 |      8000.00
 Chair    |        4 |      4500.00
 Notebook |        0 |         NULL
(6 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT p.name,
       COALESCE(sum(oi.quantity), 0)                                   AS qty_sold,
       round(sum(oi.quantity * oi.unit_price) / NULLIF(sum(oi.quantity), 0), 2) AS avg_per_unit
FROM products p
LEFT JOIN order_items oi ON oi.product_id = p.product_id
GROUP BY p.product_id, p.name
ORDER BY p.product_id;
```

**Explanation:** For the Notebook, `sum(oi.quantity)` is `NULL`, so `NULLIF` is not even needed there — but a product whose rows summed to 0 would otherwise raise an error. `COALESCE` turns the missing total into 0 for display.

</details>

### P5. Fix the type error

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** casting

```sql
CREATE TABLE web_hits (page text, customer_ref text);
INSERT INTO web_hits VALUES ('/cart', '1'), ('/cart', '2'), ('/home', 'guest');

SELECT c.name, count(*) AS cart_hits
FROM web_hits w
JOIN customers c ON c.customer_id = w.customer_ref
WHERE w.page = '/cart'
GROUP BY c.name;
```

**Output:**

```text
ERROR:  operator does not exist: integer = text
LINE 3: JOIN customers c ON c.customer_id = w.customer_ref
                                          ^
HINT:  No operator matches the given name and argument types. You might need to add explicit type casts.
```

Fix the query. Watch out: some `customer_ref` values are not numbers.

<details>
<summary>Hint</summary>

Casting `'guest'` to integer would fail; compare as text instead, or cast only valid values.

</details>

<details>
<summary>Answer</summary>

`customer_id` is `integer` and `customer_ref` is `text`; PostgreSQL will not compare them implicitly. Casting `customer_ref::integer` would fail on `'guest'` (unless the planner happens to filter that row first — do not rely on it). Casting the integer side to text is always safe:

```sql
SELECT c.name, count(*) AS cart_hits
FROM web_hits w
JOIN customers c ON c.customer_id::text = w.customer_ref
WHERE w.page = '/cart'
GROUP BY c.name
ORDER BY c.name;
```

The real fix is the schema: store `customer_id integer` (nullable for guests) instead of overloading a text column.

</details>

### P6. Unreachable branch

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** CASE order

Why does no employee ever get `'Senior'`? Fix it.

```sql
SELECT name, hire_date,
       CASE
           WHEN hire_date < DATE '2022-01-01' THEN 'Experienced'
           WHEN hire_date < DATE '2018-01-01' THEN 'Senior'
           ELSE 'New'
       END AS level
FROM employees
WHERE emp_id IN (1, 3, 12)
ORDER BY emp_id;
```

**Output:**

```text
 name  | hire_date  |    level
-------+------------+-------------
 Asha  | 2015-01-10 | Experienced
 Meena | 2019-02-01 | Experienced
 Rahul | 2024-06-01 | New
(3 rows)
```

<details>
<summary>Answer</summary>

`CASE` returns the first TRUE branch. Every date before 2018 is also before 2022, so the first branch catches it. Put the more specific condition first:

```sql
SELECT name, hire_date,
       CASE
           WHEN hire_date < DATE '2018-01-01' THEN 'Senior'
           WHEN hire_date < DATE '2022-01-01' THEN 'Experienced'
           ELSE 'New'
       END AS level
FROM employees
WHERE emp_id IN (1, 3, 12)
ORDER BY emp_id;
```

</details>
