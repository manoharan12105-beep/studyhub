# The Relational Model — Practice

### P1. Degree and cardinality

**Difficulty:** Easy · **Type:** MCQ

A table `products(product_id, name, category, price)` holds 6 rows. What are its degree and cardinality?

- A) Degree 6, cardinality 4
- B) Degree 4, cardinality 6
- C) Degree 4, cardinality 4
- D) Degree 6, cardinality 6

<details>
<summary>Answer</summary>

**Answer:** B) Degree 4, cardinality 6

**Explanation:** Degree counts columns (4); cardinality counts rows (6).

</details>

### P2. Which property is violated?

**Difficulty:** Easy · **Type:** Conceptual

A column `phones` stores `'98400 11111, 98400 22222'` for one employee. Which relational property does this break, and how would you fix it?

<details>
<summary>Answer</summary>

Atomicity of values (first normal form): one cell holds two phone numbers. Store each number as its own row in an `employee_phones(emp_id, phone)` table.

</details>

### P3. Projection with set semantics

**Difficulty:** Easy · **Type:** Query · **Concepts:** projection, DISTINCT

List the distinct cities of customers (including the unknown city), sorted.

**Expected output:**

```text
  city
---------
 Chennai
 Delhi
 Mumbai
 Pune
 NULL
(5 rows)
```

<details>
<summary>Hint</summary>

Projection onto `city` with `DISTINCT`. `NULL` sorts last in ascending order in PostgreSQL.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT DISTINCT city
FROM customers
ORDER BY city;
```

**Explanation:** Chennai appears twice in the table but once in the result. `DISTINCT` treats all `NULL`s as one group, so the unknown city appears once.

</details>

### P4. Create and use a domain

**Difficulty:** Medium · **Type:** Query · **Concepts:** CREATE DOMAIN

Create a domain `percentage` for `numeric(5,2)` values between 0 and 100 inclusive. Create `discounts(code text PRIMARY KEY, pct percentage NOT NULL)`, insert `('FEST', 15)`, then try to insert `('OOPS', 120)`.

**Expected output:**

```text
ERROR:  value for domain percentage violates check constraint "percentage_check"
```

<details>
<summary>Hint</summary>

Inside a domain `CHECK`, the value being tested is called `VALUE`.

</details>

<details>
<summary>Solution</summary>

```sql
CREATE DOMAIN percentage AS numeric(5,2) CHECK (VALUE BETWEEN 0 AND 100);
CREATE TABLE discounts (code text PRIMARY KEY, pct percentage NOT NULL);
INSERT INTO discounts VALUES ('FEST', 15);
INSERT INTO discounts VALUES ('OOPS', 120);
```

**Explanation:** The first insert passes the domain check; the second violates it. Any table using `percentage` gets the same rule, defined once.

</details>

### P5. Relational algebra to SQL

**Difficulty:** Medium · **Type:** Query · **Concepts:** selection, projection, join

Write SQL for π name, dept_name (σ location = 'Chennai' (employees ⋈ departments)), sorted by name.

**Expected output:**

```text
  name  |  dept_name
--------+-------------
 Asha   | Engineering
 Karan  | Engineering
 Meena  | Engineering
 Pooja  | HR
 Ravi   | Engineering
 Vikram | HR
(6 rows)
```

<details>
<summary>Hint</summary>

The join condition is `employees.dept_id = departments.dept_id`; σ is `WHERE`, π is the select list.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT e.name, d.dept_name
FROM employees e
JOIN departments d ON d.dept_id = e.dept_id
WHERE d.location = 'Chennai'
ORDER BY e.name;
```

**Explanation:** Engineering and HR are in Chennai, so their six employees are returned.

</details>
