# Relational Division and Hierarchy Problems — Practice

Problems use the [sample database](../../sql-fundamentals/dbms-sample-database/content.md) unless they define their own tables.

### P1. Why DISTINCT?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** relational division

In `HAVING count(DISTINCT product_id) = (SELECT count(*) FROM required_products)`, what goes wrong without `DISTINCT`?

- A) The query raises an error
- B) A customer who bought one required product several times can be counted as having bought them all
- C) Customers with no orders are included
- D) Nothing; `count` ignores duplicates

<details>
<summary>Answer</summary>

**Answer:** B)

**Explanation:** `count(product_id)` counts rows. Two purchases of the same product would match a required count of 2.

</details>

### P2. Customers who bought every Electronics product

**Difficulty:** Easy · **Type:** Query · **Concepts:** counting division

**Expected output:**

```text
 customer_id | name
-------------+------
           1 | Anil
(1 row)
```

<details>
<summary>Solution</summary>

```sql
SELECT c.customer_id, c.name
FROM customers c
JOIN orders o       ON o.customer_id = c.customer_id
JOIN order_items oi ON oi.order_id = o.order_id
JOIN products p     ON p.product_id = oi.product_id
WHERE p.category = 'Electronics'
GROUP BY c.customer_id, c.name
HAVING count(DISTINCT p.product_id) = (SELECT count(*) FROM products WHERE category = 'Electronics')
ORDER BY c.customer_id;
```

**Explanation:** Electronics = Laptop, Mouse, Keyboard. Bhavna has Mouse and Keyboard only; Chirag has only the (cancelled) Laptop order.

</details>

### P3. Candidates with all required skills

**Difficulty:** Medium · **Type:** Query · **Concepts:** division with double NOT EXISTS

**Schema and data:**

```sql
CREATE TABLE candidate_skills (candidate text, skill text);
CREATE TABLE job_requirements (job text, skill text);
INSERT INTO candidate_skills VALUES
    ('Kavya', 'java'), ('Kavya', 'sql'), ('Kavya', 'spring'),
    ('Ishaan', 'java'), ('Ishaan', 'sql'),
    ('Lata', 'sql'), ('Lata', 'spring'), ('Lata', 'java'), ('Lata', 'docker');
INSERT INTO job_requirements VALUES
    ('backend', 'java'), ('backend', 'sql'), ('backend', 'spring');
```

Which candidates have every skill the `backend` job requires?

**Expected output:**

```text
 candidate
-----------
 Kavya
 Lata
(2 rows)
```

<details>
<summary>Hint</summary>

"No required skill that the candidate lacks."

</details>

<details>
<summary>Solution</summary>

```sql
SELECT DISTINCT cs.candidate
FROM candidate_skills cs
WHERE NOT EXISTS (
    SELECT 1 FROM job_requirements r
    WHERE r.job = 'backend'
      AND NOT EXISTS (SELECT 1 FROM candidate_skills x
                      WHERE x.candidate = cs.candidate AND x.skill = r.skill)
)
ORDER BY cs.candidate;
```

**Alternative:** `WHERE skill IN (SELECT skill FROM job_requirements WHERE job = 'backend') GROUP BY candidate HAVING count(DISTINCT skill) = 3`.

**Explanation:** Extra skills (Lata's docker) do not matter; "all of" is not "exactly".

</details>

### P4. Matching every candidate to every job they qualify for

**Difficulty:** Hard · **Type:** Query · **Concepts:** division per group

**Schema and data:**

```sql
CREATE TABLE candidate_skills (candidate text, skill text);
CREATE TABLE job_requirements (job text, skill text);
INSERT INTO candidate_skills VALUES
    ('Kavya', 'java'), ('Kavya', 'sql'), ('Kavya', 'spring'),
    ('Ishaan', 'java'), ('Ishaan', 'sql'),
    ('Lata', 'sql'), ('Lata', 'spring'), ('Lata', 'java'), ('Lata', 'docker');
INSERT INTO job_requirements VALUES
    ('backend', 'java'), ('backend', 'sql'), ('backend', 'spring'),
    ('devops', 'docker'), ('devops', 'sql'),
    ('analyst', 'sql');
```

**Expected output:**

```text
   job   | candidate
---------+-----------
 analyst | Ishaan
 analyst | Kavya
 analyst | Lata
 backend | Kavya
 backend | Lata
 devops  | Lata
(6 rows)
```

<details>
<summary>Hint</summary>

Join candidate skills to requirements on `skill`, group by (job, candidate), and compare the matched count with the job's requirement count.

</details>

<details>
<summary>Solution</summary>

```sql
WITH req_count AS (
    SELECT job, count(*) AS needed FROM job_requirements GROUP BY job
)
SELECT r.job, cs.candidate
FROM job_requirements r
JOIN candidate_skills cs ON cs.skill = r.skill
JOIN req_count rc        ON rc.job = r.job
GROUP BY r.job, cs.candidate, rc.needed
HAVING count(DISTINCT r.skill) = rc.needed
ORDER BY r.job, cs.candidate;
```

**Explanation:** Each job is its own divisor. The join keeps only matching skills, so the count is "required skills this candidate has".

</details>

### P5. Depth of every employee

**Difficulty:** Medium · **Type:** Query · **Concepts:** recursive CTE, levels

Count employees per level of the hierarchy (Asha is level 1).

**Expected output:**

```text
 level | employees
-------+-----------
     1 |         1
     2 |         5
     3 |         6
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
WITH RECURSIVE org AS (
    SELECT emp_id, 1 AS level FROM employees WHERE manager_id IS NULL
    UNION ALL
    SELECT e.emp_id, o.level + 1 FROM employees e JOIN org o ON e.manager_id = o.emp_id
)
SELECT level, count(*) AS employees FROM org GROUP BY level ORDER BY level;
```

</details>

### P6. Who is the skip-level manager?

**Difficulty:** Medium · **Type:** Query · **Concepts:** self-join twice

For every employee who has a manager's manager, show it.

**Expected output:**

```text
 employee | manager | skip_level
----------+---------+------------
 Meena    | Ravi    | Asha
 Karan    | Ravi    | Asha
 Arjun    | Divya   | Asha
 Sneha    | Divya   | Asha
 Pooja    | Vikram  | Asha
 Rahul    | Divya   | Asha
(6 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT e.name AS employee, m.name AS manager, g.name AS skip_level
FROM employees e
JOIN employees m ON m.emp_id = e.manager_id
JOIN employees g ON g.emp_id = m.manager_id
ORDER BY e.emp_id;
```

**Explanation:** A fixed number of levels needs only self-joins; recursion is for unknown depth.

</details>

### P7. Breadcrumbs for a category

**Difficulty:** Medium · **Type:** Query · **Concepts:** upward recursion, string_agg

**Schema and data:**

```sql
CREATE TABLE categories (category_id int PRIMARY KEY, name text NOT NULL, parent_id int);
INSERT INTO categories VALUES
    (1, 'All', NULL), (2, 'Electronics', 1), (3, 'Computers', 2), (4, 'Laptops', 3),
    (5, 'Accessories', 2), (6, 'Furniture', 1);
```

Show the breadcrumb trail for category 4, root first.

**Expected output:**

```text
               breadcrumb
-----------------------------------------
 All > Electronics > Computers > Laptops
(1 row)
```

<details>
<summary>Solution</summary>

```sql
WITH RECURSIVE up AS (
    SELECT category_id, name, parent_id, 0 AS steps FROM categories WHERE category_id = 4
    UNION ALL
    SELECT c.category_id, c.name, c.parent_id, u.steps + 1
    FROM categories c JOIN up u ON c.category_id = u.parent_id
)
SELECT string_agg(name, ' > ' ORDER BY steps DESC) AS breadcrumb FROM up;
```

**Explanation:** Walk up from the leaf, then aggregate in reverse order of steps so the root comes first.

</details>

### P8. Find the employee loop

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** CYCLE clause

**Schema and data:**

```sql
CREATE TABLE staff (id int PRIMARY KEY, name text, manager_id int);
INSERT INTO staff VALUES (1, 'Uma', NULL), (2, 'Vel', 1), (3, 'Wasim', 4), (4, 'Xena', 3);
```

A reporting query walking down from every employee never finishes, because of bad data. Write a recursive query that walks up from each employee and reports the ids of employees whose chain loops.

**Expected output:**

```text
 id | name
----+-------
  3 | Wasim
  4 | Xena
(2 rows)
```

<details>
<summary>Hint</summary>

Use `CYCLE … SET is_cycle USING path` and keep the starting id in each row.

</details>

<details>
<summary>Solution</summary>

```sql
WITH RECURSIVE up AS (
    SELECT id AS start_id, id, manager_id FROM staff
    UNION ALL
    SELECT u.start_id, s.id, s.manager_id
    FROM staff s JOIN up u ON s.id = u.manager_id
) CYCLE id SET is_cycle USING path
SELECT DISTINCT s.id, s.name
FROM up
JOIN staff s ON s.id = up.start_id
WHERE up.is_cycle
ORDER BY s.id;
```

**Explanation:** Wasim reports to Xena and Xena to Wasim. The `CYCLE` clause stops each walk when an id repeats and flags it; fixing the data (and adding a validation trigger) is the real cure.

</details>
