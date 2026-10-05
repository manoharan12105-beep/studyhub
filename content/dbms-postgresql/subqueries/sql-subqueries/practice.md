# Subqueries — Practice

### P1. Most expensive product

**Difficulty:** Easy · **Type:** Query · **Concepts:** scalar subquery

Return the name and price of the most expensive product(s) using a subquery.

**Expected output:**

```text
  name  |  price
--------+----------
 Laptop | 55000.00
(1 row)
```

<details>
<summary>Solution</summary>

```sql
SELECT name, price
FROM products
WHERE price = (SELECT max(price) FROM products);
```

**Explanation:** Unlike `ORDER BY price DESC LIMIT 1`, this returns all products tied at the maximum.

</details>

### P2. Customers who ordered

**Difficulty:** Easy · **Type:** Query · **Concepts:** IN subquery

List customers who have placed at least one order, using `IN`. Order by name.

**Expected output:**

```text
  name
--------
 Anil
 Bhavna
 Chirag
 Deepa
 Eshan
(5 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT name
FROM customers
WHERE customer_id IN (SELECT customer_id FROM orders)
ORDER BY name;
```

**Explanation:** Even though Anil has three orders, he appears once — `IN` is a semi-join, it never duplicates outer rows. A plain join would return Anil three times.

</details>

### P3. Products priced above their category average

**Difficulty:** Medium · **Type:** Query · **Concepts:** derived table

Using a derived table of category averages, list products priced above their category's average.

**Expected output:**

```text
  name  |  category   |  price   | category_avg
--------+-------------+----------+--------------
 Laptop | Electronics | 55000.00 |     19000.00
 Desk   | Furniture   |  8000.00 |      6250.00
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT p.name, p.category, p.price, round(a.avg_price, 2) AS category_avg
FROM products p
JOIN (
    SELECT category, avg(price) AS avg_price
    FROM products
    GROUP BY category
) AS a ON a.category = p.category
WHERE p.price > a.avg_price
ORDER BY p.category, p.price DESC;
```

**Alternative:** a correlated subquery `WHERE p.price > (SELECT avg(price) FROM products x WHERE x.category = p.category)`, or a window function `avg(price) OVER (PARTITION BY category)`.

</details>

### P4. Second-highest salary

**Difficulty:** Medium · **Type:** Query · **Concepts:** nested scalar subquery

Return the second-highest **distinct** salary using only subqueries (no `LIMIT`, no window functions).

**Expected output:**

```text
 second_highest
----------------
          95000
(1 row)
```

<details>
<summary>Solution</summary>

```sql
SELECT max(salary) AS second_highest
FROM employees
WHERE salary < (SELECT max(salary) FROM employees);
```

**Explanation:** The highest is 150000; the largest salary below it is 95000 — earned by two people, but the question asks for the salary value. If there were no second salary, `max` over no rows returns `NULL`, which is usually the desired answer. More approaches: [Nth-Highest and Top-N Problems](../../sql-problem-solving/nth-highest-and-top-n-problems/content.md).

</details>

### P5. Which query fails?

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** scalar subquery cardinality

```sql
SELECT name
FROM employees
WHERE manager_id = (SELECT emp_id FROM employees WHERE dept_id = 10);
```

**Output:**

```text
ERROR:  more than one row returned by a subquery used as an expression
```

Explain and fix it to list employees whose manager is in Engineering.

<details>
<summary>Answer</summary>

Engineering has four employees, so the scalar comparison receives four rows. Use `IN`:

```sql
SELECT name
FROM employees
WHERE manager_id IN (SELECT emp_id FROM employees WHERE dept_id = 10)
ORDER BY emp_id;
```

</details>

### P6. Busiest customer

**Difficulty:** Hard · **Type:** Query · **Concepts:** derived table, aggregate of aggregate

Find the customer(s) with the largest number of orders, with the count — handling ties.

**Expected output:**

```text
 name | orders
------+--------
 Anil |      3
(1 row)
```

<details>
<summary>Hint</summary>

Count orders per customer in a derived table, then compare each count with the maximum of those counts.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT c.name, t.orders
FROM (
    SELECT customer_id, count(*) AS orders
    FROM orders
    GROUP BY customer_id
) AS t
JOIN customers c ON c.customer_id = t.customer_id
WHERE t.orders = (
    SELECT max(cnt) FROM (SELECT count(*) AS cnt FROM orders GROUP BY customer_id) AS x
);
```

**Explanation:** Aggregates cannot be nested directly (`max(count(*))` is an error in PostgreSQL), so the inner counts become a derived table. A CTE would avoid writing the counting query twice.

</details>
