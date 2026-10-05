# CROSS JOIN and SELF JOIN — Practice

### P1. How many rows from a cross join?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** CROSS JOIN

`SELECT * FROM departments CROSS JOIN products;` on the sample data returns how many rows?

- A) 5
- B) 6
- C) 11
- D) 30

<details>
<summary>Answer</summary>

**Answer:** D) 30

**Explanation:** 5 departments × 6 products.

</details>

### P2. Manager's department

**Difficulty:** Easy · **Type:** Query · **Concepts:** SELF JOIN

List employees whose manager works in a **different** department from them (ignore employees without a manager). Show employee, their department id, manager and the manager's department id.

**Expected output:**

```text
 employee | dept_id | manager | manager_dept
----------+---------+---------+--------------
 Divya    |      20 | Asha    |           10
 Vikram   |      30 | Asha    |           10
 Farhan   |      40 | Asha    |           10
 Nisha    |    NULL | Asha    |           10
(4 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT e.name AS employee, e.dept_id, m.name AS manager, m.dept_id AS manager_dept
FROM employees e
JOIN employees m ON m.emp_id = e.manager_id
WHERE e.dept_id IS DISTINCT FROM m.dept_id
ORDER BY e.emp_id;
```

**Explanation:** Asha (Engineering) manages heads of other departments. `IS DISTINCT FROM` also counts Nisha, whose `NULL` department differs from Asha's; `<>` would drop her.

</details>

### P3. Colleagues hired in the same year

**Difficulty:** Medium · **Type:** Query · **Concepts:** SELF JOIN, pairs

List pairs of different employees hired in the same calendar year, each pair once.

**Expected output:**

```text
 employee_1 | employee_2 | year
------------+------------+------
 Meena      | Farhan     | 2019
 Nisha      | Rahul      | 2024
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT a.name AS employee_1, b.name AS employee_2, extract(year FROM a.hire_date) AS year
FROM employees a
JOIN employees b
  ON extract(year FROM a.hire_date) = extract(year FROM b.hire_date)
 AND a.emp_id < b.emp_id
ORDER BY year, a.emp_id;
```

**Explanation:** 2019 (Meena, Farhan) and 2024 (Nisha, Rahul).

</details>

### P4. Grandmanager

**Difficulty:** Medium · **Type:** Query · **Concepts:** two self joins

Show each employee with their manager and their manager's manager (`NULL` where missing). Order by employee id.

**Expected output:**

```text
 employee | manager | grand_manager
----------+---------+---------------
 Asha     | NULL    | NULL
 Ravi     | Asha    | NULL
 Meena    | Ravi    | Asha
 Karan    | Ravi    | Asha
 Divya    | Asha    | NULL
 Arjun    | Divya   | Asha
 Sneha    | Divya   | Asha
 Vikram   | Asha    | NULL
 Pooja    | Vikram  | Asha
 Farhan   | Asha    | NULL
 Nisha    | Asha    | NULL
 Rahul    | Divya   | Asha
(12 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT e.name AS employee, m.name AS manager, gm.name AS grand_manager
FROM employees e
LEFT JOIN employees m  ON m.emp_id  = e.manager_id
LEFT JOIN employees gm ON gm.emp_id = m.manager_id
ORDER BY e.emp_id;
```

**Explanation:** Each self join climbs one level. Both must be `LEFT` joins, otherwise Asha and her direct reports disappear.

</details>

### P5. Every customer × every category

**Difficulty:** Hard · **Type:** Query · **Concepts:** CROSS JOIN grid, pre-aggregation

For every customer and every product category, show how many units they bought (0 if none) — only for customers in Chennai. Order by customer, category.

**Expected output:**

```text
 name  |  category   | units
-------+-------------+-------
 Anil  | Electronics |     4
 Anil  | Furniture   |     2
 Anil  | Stationery  |     0
 Deepa | Electronics |     1
 Deepa | Furniture   |     1
 Deepa | Stationery  |     0
(6 rows)
```

<details>
<summary>Hint</summary>

Build the customer × category grid with `CROSS JOIN`, aggregate the purchases per customer and category separately, then `LEFT JOIN`.

</details>

<details>
<summary>Solution</summary>

```sql
WITH bought AS (
    SELECT o.customer_id, p.category, sum(oi.quantity) AS units
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.order_id
    JOIN products p     ON p.product_id = oi.product_id
    GROUP BY o.customer_id, p.category
)
SELECT c.name, cat.category, COALESCE(b.units, 0) AS units
FROM customers c
CROSS JOIN (SELECT DISTINCT category FROM products) AS cat
LEFT JOIN bought b ON b.customer_id = c.customer_id AND b.category = cat.category
WHERE c.city = 'Chennai'
ORDER BY c.name, cat.category;
```

**Explanation:** The grid guarantees 2 customers × 3 categories = 6 rows; the pre-aggregated purchases fill in the counts.

</details>
