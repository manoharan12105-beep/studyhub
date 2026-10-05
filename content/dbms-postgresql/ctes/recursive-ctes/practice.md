# Recursive CTEs — Practice

### P1. Numbers 1 to 10

**Difficulty:** Easy · **Type:** Query · **Concepts:** recursive generator

Generate the numbers 1 to 10 with a recursive CTE and show only the even ones.

**Expected output:**

```text
 i
----
  2
  4
  6
  8
 10
(5 rows)
```

<details>
<summary>Solution</summary>

```sql
WITH RECURSIVE n (i) AS (
    SELECT 1
  UNION ALL
    SELECT i + 1 FROM n WHERE i < 10
)
SELECT i FROM n WHERE i % 2 = 0 ORDER BY i;
```

**Explanation:** The filter on even numbers is in the main query; putting it in the recursive part would stop the recursion at 1.

</details>

### P2. Employees and their level

**Difficulty:** Easy · **Type:** Query · **Concepts:** level tracking

List every employee with their level in the hierarchy (Asha = 1). Order by level, then name.

**Expected output:**

```text
 level |  name
-------+--------
     1 | Asha
     2 | Divya
     2 | Farhan
     2 | Nisha
     2 | Ravi
     2 | Vikram
     3 | Arjun
     3 | Karan
     3 | Meena
     3 | Pooja
     3 | Rahul
     3 | Sneha
(12 rows)
```

<details>
<summary>Solution</summary>

```sql
WITH RECURSIVE org AS (
    SELECT emp_id, name, 1 AS level FROM employees WHERE manager_id IS NULL
  UNION ALL
    SELECT e.emp_id, e.name, o.level + 1
    FROM employees e JOIN org o ON e.manager_id = o.emp_id
)
SELECT level, name FROM org ORDER BY level, name;
```

</details>

### P3. Is Karan under Asha?

**Difficulty:** Medium · **Type:** Query · **Concepts:** upward walk, EXISTS

Return `true` if Asha appears anywhere in Karan's management chain, otherwise `false`.

**Expected output:**

```text
 under_asha
------------
 t
(1 row)
```

<details>
<summary>Solution</summary>

```sql
WITH RECURSIVE chain AS (
    SELECT manager_id FROM employees WHERE name = 'Karan'
  UNION ALL
    SELECT e.manager_id
    FROM employees e JOIN chain c ON e.emp_id = c.manager_id
)
SELECT EXISTS (
    SELECT 1 FROM chain c JOIN employees m ON m.emp_id = c.manager_id
    WHERE m.name = 'Asha'
) AS under_asha;
```

**Explanation:** The chain for Karan is Ravi (2), then Asha (1), then `NULL`. The `NULL` row is harmless: the join in the next iteration finds nothing and the recursion stops.

</details>

### P4. Payroll of each manager's whole team

**Difficulty:** Medium · **Type:** Query · **Concepts:** ancestor pairs, aggregation

For each manager, show the total salary of everyone below them (all levels, excluding the manager). Highest first.

**Expected output:**

```text
 manager | team_payroll
---------+--------------
 Asha    |       774000
 Divya   |       175000
 Ravi    |       167000
 Vikram  |        52000
(4 rows)
```

<details>
<summary>Hint</summary>

Build (ancestor, employee) pairs recursively — start with (manager_id, emp_id), then extend upwards — and sum salaries per ancestor.

</details>

<details>
<summary>Solution</summary>

```sql
WITH RECURSIVE pairs AS (
    SELECT manager_id AS boss, emp_id
    FROM employees WHERE manager_id IS NOT NULL
  UNION ALL
    SELECT e.manager_id, p.emp_id
    FROM pairs p JOIN employees e ON e.emp_id = p.boss
    WHERE e.manager_id IS NOT NULL
)
SELECT b.name AS manager, sum(w.salary) AS team_payroll
FROM pairs p
JOIN employees b ON b.emp_id = p.boss
JOIN employees w ON w.emp_id = p.emp_id
GROUP BY b.emp_id
ORDER BY team_payroll DESC;
```

**Explanation:** Asha's team is everyone else: 924000 − 150000 = 774000.

</details>

### P5. Fix the infinite query

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** cycles, UNION vs UNION ALL

A category table accidentally contains a cycle. The query below never finishes (shown here with a safety limit of 5 levels so it returns).

**Schema and data:**

```sql
CREATE TABLE categories (id integer PRIMARY KEY, parent_id integer, name text);
INSERT INTO categories VALUES
    (1, NULL, 'All'), (2, 1, 'Electronics'), (3, 2, 'Computers'), (4, 3, 'Laptops');
UPDATE categories SET parent_id = 4 WHERE id = 2;   -- the bad update: a cycle 2 → 3 → 4 → 2
```

```sql
WITH RECURSIVE sub AS (
    SELECT id, name, 1 AS depth FROM categories WHERE id = 2
  UNION ALL
    SELECT c.id, c.name, s.depth + 1
    FROM categories c JOIN sub s ON c.parent_id = s.id
    WHERE s.depth < 5
)
SELECT depth, name FROM sub ORDER BY depth;
```

**Output:**

```text
 depth |    name
-------+-------------
     1 | Electronics
     2 | Computers
     3 | Laptops
     4 | Electronics
     5 | Computers
(5 rows)
```

Why would `UNION` instead of `UNION ALL` not help here? Write a version that lists each category under Electronics once.

<details>
<summary>Answer</summary>

Each row carries `depth`, which differs at every visit, so `UNION` never sees an exact duplicate. Either drop `depth` and use `UNION` (the rows `(id, name)` then repeat exactly and are discarded), or use the `CYCLE` clause:

```sql
WITH RECURSIVE sub AS (
    SELECT id, name FROM categories WHERE id = 2
  UNION
    SELECT c.id, c.name
    FROM categories c JOIN sub s ON c.parent_id = s.id
)
SELECT name FROM sub ORDER BY id;
```

**Output:**

```text
    name
-------------
 Electronics
 Computers
 Laptops
(3 rows)
```

The real fix is the data: a constraint or trigger should prevent a category from becoming its own ancestor.

</details>
