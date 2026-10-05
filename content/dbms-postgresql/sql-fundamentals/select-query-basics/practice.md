# SELECT, Filtering, Sorting and Pagination — Practice

### P1. Filter and sort

**Difficulty:** Easy · **Type:** Query · **Concepts:** WHERE, ORDER BY

List employees hired in 2019 or later who earn at least 60000, newest hire first.

**Expected output:**

```text
  name  | salary | hire_date
--------+--------+------------
 Sneha  |  60000 | 2022-01-03
 Karan  |  72000 | 2021-08-20
 Arjun  |  60000 | 2020-04-12
 Farhan |  82000 | 2019-07-22
 Meena  |  95000 | 2019-02-01
(5 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT name, salary, hire_date
FROM employees
WHERE hire_date >= DATE '2019-01-01'
  AND salary >= 60000
ORDER BY hire_date DESC;
```

**Explanation:** Both conditions must hold; `>=` includes exactly 60000 (Arjun, Sneha).

</details>

### P2. Which rows?

**Difficulty:** Easy · **Type:** MCQ

`SELECT name FROM employees WHERE dept_id = 20 OR dept_id = 30 AND salary > 60000;` returns:

- A) Sales and HR employees earning over 60000
- B) All Sales employees, plus HR employees earning over 60000
- C) Only HR employees earning over 60000
- D) An error

<details>
<summary>Answer</summary>

**Answer:** B) All Sales employees, plus HR employees earning over 60000

**Explanation:** `AND` binds tighter: `dept_id = 20 OR (dept_id = 30 AND salary > 60000)`.

</details>

### P3. Products in a price band

**Difficulty:** Easy · **Type:** Query · **Concepts:** BETWEEN, IN

List products in the Electronics or Furniture categories priced from 1000 to 10000 inclusive, cheapest first.

**Expected output:**

```text
   name   |  category   |  price
----------+-------------+---------
 Keyboard | Electronics | 1500.00
 Chair    | Furniture   | 4500.00
 Desk     | Furniture   | 8000.00
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT name, category, price
FROM products
WHERE category IN ('Electronics', 'Furniture')
  AND price BETWEEN 1000 AND 10000
ORDER BY price;
```

</details>

### P4. Unknown emails last

**Difficulty:** Medium · **Type:** Query · **Concepts:** ORDER BY, NULLS LAST

List all customers ordered by email descending, with customers without an email at the end.

**Expected output:**

```text
  name  |      email
--------+-----------------
 Fatima | fatima@mail.com
 Eshan  | eshan@mail.com
 Chirag | chirag@mail.com
 Bhavna | bhavna@mail.com
 Anil   | anil@mail.com
 Deepa  | NULL
(6 rows)
```

<details>
<summary>Hint</summary>

In PostgreSQL, `DESC` puts `NULL`s first by default.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT name, email
FROM customers
ORDER BY email DESC NULLS LAST;
```

</details>

### P5. Third page

**Difficulty:** Medium · **Type:** Query · **Concepts:** LIMIT, OFFSET, deterministic ordering

Show page 3 of employees ordered by name, 4 employees per page.

**Expected output:**

```text
 emp_id |  name
--------+--------
     12 | Rahul
      2 | Ravi
      7 | Sneha
      8 | Vikram
(4 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT emp_id, name
FROM employees
ORDER BY name, emp_id
LIMIT 4 OFFSET 8;
```

**Explanation:** Page `p` with size `s` skips `(p − 1) × s` rows. `emp_id` breaks ties if two employees ever share a name.

</details>

### P6. Top salaries with ties

**Difficulty:** Medium · **Type:** Query · **Concepts:** FETCH WITH TIES

Return the employees with the 5 highest salaries, including everyone tied with the fifth.

**Expected output:**

```text
  name  | salary
--------+--------
 Asha   | 150000
 Ravi   |  95000
 Meena  |  95000
 Divya  |  88000
 Farhan |  82000
(5 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT name, salary
FROM employees
ORDER BY salary DESC
FETCH FIRST 5 ROWS WITH TIES;
```

**Explanation:** The 5th-highest *row* is Farhan (82000), and nobody else earns 82000, so exactly 5 rows return. Note this is "top 5 rows", not "top 5 distinct salaries" (Ravi and Meena share 95000) — for distinct salary ranks use `DENSE_RANK()` ([Ranking Functions](../../window-functions/ranking-window-functions/content.md)).

</details>

### P7. Keyset pagination

**Difficulty:** Hard · **Type:** Query · **Concepts:** keyset pagination

The client last saw the order `(order_date = 2026-02-14, order_id = 104)` on a page sorted by `order_date DESC, order_id DESC`. Fetch the next 3 orders without using `OFFSET`.

**Expected output:**

```text
 order_id | order_date |  status
----------+------------+-----------
      103 | 2026-02-03 | SHIPPED
      102 | 2026-01-12 | DELIVERED
      101 | 2026-01-05 | DELIVERED
(3 rows)
```

<details>
<summary>Hint</summary>

Row-value comparison `(a, b) < (x, y)` compares lexicographically, matching a two-column descending sort.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT order_id, order_date, status
FROM orders
WHERE (order_date, order_id) < (DATE '2026-02-14', 104)
ORDER BY order_date DESC, order_id DESC
LIMIT 3;
```

**Explanation:** With an index on `(order_date, order_id)`, PostgreSQL can start right after the last seen key instead of counting through skipped rows, so every page costs the same.

</details>
