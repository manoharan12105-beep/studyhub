# Value Window Functions — Practice

### P1. Previous product price

**Difficulty:** Easy · **Type:** Query · **Concepts:** lag

List products by price (cheapest first) with the price of the next cheaper product.

**Expected output:**

```text
   name   |  price   | next_cheaper
----------+----------+--------------
 Notebook |    50.00 |         NULL
 Mouse    |   500.00 |        50.00
 Keyboard |  1500.00 |       500.00
 Chair    |  4500.00 |      1500.00
 Desk     |  8000.00 |      4500.00
 Laptop   | 55000.00 |      8000.00
(6 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT name, price, lag(price) OVER (ORDER BY price) AS next_cheaper
FROM products
ORDER BY price;
```

</details>

### P2. Choose the function

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** value functions

Which expression puts the **lowest** salary of the department on every employee's row?

- A) `last_value(salary) OVER (PARTITION BY dept_id ORDER BY salary DESC)`
- B) `first_value(salary) OVER (PARTITION BY dept_id ORDER BY salary)`
- C) `lag(salary) OVER (PARTITION BY dept_id ORDER BY salary)`
- D) `lead(salary) OVER (PARTITION BY dept_id ORDER BY salary DESC)`

<details>
<summary>Answer</summary>

**Answer:** B)

**Explanation:** Ascending order puts the lowest salary first, and `first_value`'s default frame always starts at the partition start. A fails because of the default frame (it ends at the current row). C and D return neighbouring rows.

</details>

### P3. Gap to the next salary

**Difficulty:** Medium · **Type:** Query · **Concepts:** lead, unique ordering

For Sales employees ordered by salary descending, show how much more each earns than the next person (0 for ties, `NULL` for the last).

**Expected output:**

```text
 name  | salary | ahead_of_next
-------+--------+---------------
 Divya |  88000 |         28000
 Arjun |  60000 |             0
 Sneha |  60000 |          5000
 Rahul |  55000 |          NULL
(4 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT name, salary,
       salary - lead(salary) OVER (ORDER BY salary DESC, emp_id) AS ahead_of_next
FROM employees
WHERE dept_id = 20
ORDER BY salary DESC, emp_id;
```

</details>

### P4. First and latest order per customer on each row

**Difficulty:** Medium · **Type:** Query · **Concepts:** first_value, last_value, frame

For customers 1 and 2, show every order with the customer's first and latest order ids.

**Expected output:**

```text
 customer_id | order_id | order_date | first_order | latest_order
-------------+----------+------------+-------------+--------------
           1 |      101 | 2026-01-05 |         101 |          107
           1 |      103 | 2026-02-03 |         101 |          107
           1 |      107 | 2026-03-15 |         101 |          107
           2 |      102 | 2026-01-12 |         102 |          106
           2 |      106 | 2026-03-01 |         102 |          106
(5 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT customer_id, order_id, order_date,
       first_value(order_id) OVER w AS first_order,
       last_value(order_id)  OVER w AS latest_order
FROM orders
WHERE customer_id IN (1, 2)
WINDOW w AS (PARTITION BY customer_id ORDER BY order_date
             ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
ORDER BY customer_id, order_date;
```

**Explanation:** The full frame is what makes `last_value` return the partition's last row.

</details>

### P5. Price change log

**Difficulty:** Hard · **Type:** Query · **Concepts:** lag, change detection

A price history table records a price snapshot every day. List only the days on which the price changed (plus the first day), with the old and new price.

**Schema and data:**

```sql
CREATE TABLE price_history (product_id int, snapshot_date date, price numeric(10,2));
INSERT INTO price_history VALUES
    (2, '2026-03-01', 500), (2, '2026-03-02', 500), (2, '2026-03-03', 450),
    (2, '2026-03-04', 450), (2, '2026-03-05', 500);
```

**Expected output:**

```text
 product_id | snapshot_date | old_price | new_price
------------+---------------+-----------+-----------
          2 | 2026-03-01    |      NULL |    500.00
          2 | 2026-03-03    |    500.00 |    450.00
          2 | 2026-03-05    |    450.00 |    500.00
(3 rows)
```

<details>
<summary>Hint</summary>

Compute `lag(price)` per product ordered by date in a subquery; keep rows where the price `IS DISTINCT FROM` the previous one.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT product_id, snapshot_date, old_price, price AS new_price
FROM (SELECT product_id, snapshot_date, price,
             lag(price) OVER (PARTITION BY product_id ORDER BY snapshot_date) AS old_price
      FROM price_history) AS t
WHERE price IS DISTINCT FROM old_price
ORDER BY product_id, snapshot_date;
```

</details>
