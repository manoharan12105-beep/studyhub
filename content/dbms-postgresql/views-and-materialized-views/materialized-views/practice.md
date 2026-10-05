# Materialized Views — Practice

### P1. Which is true?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** materialized view behaviour

- A) A materialized view always shows the current data of its base tables.
- B) `REFRESH MATERIALIZED VIEW CONCURRENTLY` requires a unique index on the materialized view.
- C) You can `INSERT` rows directly into a materialized view.
- D) Materialized views cannot be indexed.

<details>
<summary>Answer</summary>

**Answer:** B)

**Explanation:** A materialized view is a snapshot (A false), is read-only (C false), and supports indexes (D false).

</details>

### P2. Department payroll snapshot

**Difficulty:** Easy · **Type:** Query · **Concepts:** create, index, query

Create a materialized view `dept_payroll` with each department name, headcount and payroll (departments without employees included with 0), add a unique index, and list it by payroll descending.

**Expected output:**

```text
  dept_name  | headcount | payroll
-------------+-----------+---------
 Engineering |         4 |  412000
 Sales       |         4 |  263000
 HR          |         2 |  122000
 Finance     |         1 |   82000
 Research    |         0 |       0
(5 rows)
```

<details>
<summary>Solution</summary>

```sql
CREATE MATERIALIZED VIEW dept_payroll AS
SELECT d.dept_id, d.dept_name,
       count(e.emp_id)              AS headcount,
       COALESCE(sum(e.salary), 0)   AS payroll
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.dept_id
GROUP BY d.dept_id;

CREATE UNIQUE INDEX dept_payroll_pk ON dept_payroll (dept_id);

SELECT dept_name, headcount, payroll FROM dept_payroll ORDER BY payroll DESC, dept_name;
```

</details>

### P3. Observe staleness and refresh

**Difficulty:** Medium · **Type:** Output · **Concepts:** snapshot semantics

Using `dept_payroll` from P2 (recreated here), predict the two results after a new HR hire:

```sql
CREATE MATERIALIZED VIEW dept_payroll AS
SELECT d.dept_id, d.dept_name, count(e.emp_id) AS headcount, COALESCE(sum(e.salary), 0) AS payroll
FROM departments d LEFT JOIN employees e ON e.dept_id = d.dept_id
GROUP BY d.dept_id;
CREATE UNIQUE INDEX dept_payroll_pk ON dept_payroll (dept_id);

INSERT INTO employees (emp_id, name, dept_id, manager_id, salary, hire_date)
VALUES (13, 'Tara', 30, 8, 50000, '2026-03-01');

SELECT headcount, payroll FROM dept_payroll WHERE dept_name = 'HR';
REFRESH MATERIALIZED VIEW CONCURRENTLY dept_payroll;
SELECT headcount, payroll FROM dept_payroll WHERE dept_name = 'HR';
```

<details>
<summary>Answer</summary>

**Output:**

```text
 headcount | payroll
-----------+---------
         2 |  122000
(1 row)

 headcount | payroll
-----------+---------
         3 |  172000
(1 row)
```

Before the refresh the snapshot still shows 2 employees and 122000; after it, 3 and 172000.

</details>

### P4. The refresh fails

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** CONCURRENTLY requirements

```sql
CREATE MATERIALIZED VIEW city_customers AS
SELECT city, count(*) AS customers FROM customers GROUP BY city;
CREATE UNIQUE INDEX city_customers_city ON city_customers (city) WHERE city IS NOT NULL;

REFRESH MATERIALIZED VIEW CONCURRENTLY city_customers;
```

**Output:**

```text
ERROR:  cannot refresh materialized view "public.city_customers" concurrently
HINT:  Create a unique index with no WHERE clause on one or more columns of the materialized view.
```

Why, and how do you fix it?

<details>
<summary>Answer</summary>

`CONCURRENTLY` needs a unique index **without** a `WHERE` clause covering all rows, so it can match old and new rows. The partial index does not qualify. A plain unique index on `city` works: PostgreSQL's unique indexes allow several `NULL`s, but here `GROUP BY city` produces only one `NULL` group anyway.

```sql
DROP INDEX city_customers_city;
CREATE UNIQUE INDEX city_customers_city ON city_customers (city);
REFRESH MATERIALIZED VIEW CONCURRENTLY city_customers;
SELECT * FROM city_customers ORDER BY city NULLS LAST;
```

**Output:**

```text
  city   | customers
---------+-----------
 Chennai |         2
 Delhi   |         1
 Mumbai  |         1
 Pune    |         1
 NULL    |         1
(5 rows)
```

</details>
