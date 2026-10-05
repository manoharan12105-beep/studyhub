# ON vs USING vs WHERE in Joins

**Module:** Joins · **Interview priority:** Core

## What Is It?

Three places can hold conditions in a join query:

- **`ON condition`** — the join condition: which rows of the two tables pair up. Any boolean expression.
- **`USING (col, …)`** — shorthand for equality on identically named columns; the shared column appears **once** in the output.
- **`WHERE condition`** — filters the rows **after** the join has been formed.

For **inner** joins, moving a condition between `ON` and `WHERE` does not change the result. For **outer** joins it changes the result completely.

## Why It Matters

- "My LEFT JOIN behaves like an INNER JOIN" is one of the most common SQL bugs; the cause is almost always a condition in `WHERE` that belongs in `ON`.
- "ON vs WHERE" and "ON vs USING" are standard interview questions for backend roles.

## Core Concept

### ON

- Accepts any condition: equality, ranges, several columns, conditions on one table only.
- Both tables' columns stay separate in the output (`e.dept_id` and `d.dept_id`).
- Required for self joins and for keys with different names (`o.customer_id = c.customer_id` works with `USING`, but `e.manager_id = m.emp_id` needs `ON`).

### USING

- `JOIN departments USING (dept_id)` means `ON e.dept_id = d.dept_id`, for columns with the **same name** in both tables.
- The join column appears **once** in `SELECT *`, and may be referenced **unqualified** (`dept_id`).
- In PostgreSQL the unqualified merged column of a `FULL JOIN … USING` is `COALESCE(left.col, right.col)`; the qualified columns (`e.dept_id`, `d.dept_id`) are still available.
- Only equality; only identical names.

### NATURAL JOIN (avoid)

`NATURAL JOIN` joins on **all** columns with the same name, implicitly. If someone later adds a `created_at` or `name` column to both tables, the join condition silently changes. Prefer explicit `ON` or `USING`.

### ON vs WHERE in inner joins

`FROM a JOIN b ON a.k = b.k AND b.x = 1` and `FROM a JOIN b ON a.k = b.k WHERE b.x = 1` return the same rows — an inner join keeps only TRUE pairs either way. Put join relationships in `ON` and row filters in `WHERE` for readability.

### ON vs WHERE in outer joins

Logical order: **the join (with its `ON`) is formed first, including padded rows; then `WHERE` filters.**

| Condition on… | Put in `ON` of a LEFT JOIN | Put in `WHERE` |
|---------------|----------------------------|----------------|
| The **right** (optional) table, e.g. `d.location = 'Chennai'` | Decides which right rows may match; **all left rows are kept**, non-matching ones padded with `NULL` | Removes padded rows (their `d.location` is `NULL` → UNKNOWN) → LEFT JOIN **becomes INNER** |
| The **left** (preserved) table, e.g. `e.salary > 80000` | Does **not** remove left rows; it only prevents them from matching (they appear with `NULL`s) | Removes those left rows — usually what you want |

Rules of thumb:

1. Conditions that restrict the **optional** side → `ON`.
2. Conditions that restrict the **preserved** side → `WHERE`.
3. Testing the optional side for `IS NULL` in `WHERE` is deliberate: it is the anti-join pattern.

### Visual: the same filter in two places

```text
employees e LEFT JOIN departments d ON d.dept_id = e.dept_id AND d.location = 'Chennai'
→ 12 rows: Chennai departments filled in; Sales/Finance employees and Nisha have NULL dept columns

employees e LEFT JOIN departments d ON d.dept_id = e.dept_id
WHERE d.location = 'Chennai'
→ 6 rows: only employees of Chennai departments (an inner join in effect)
```

## Syntax

```sql
-- Illustrative: forms
FROM a JOIN b ON a.x = b.x AND b.flag
FROM a JOIN b USING (x)
FROM a JOIN b USING (x, y)
FROM a LEFT JOIN b ON a.x = b.x AND b.flag   -- optional-side filter
WHERE a.status = 'ACTIVE'                    -- preserved-side filter
```

## Examples

### USING merges the join column

```sql
SELECT *
FROM employees e
JOIN departments d USING (dept_id)
WHERE dept_id = 30;
```

**Output:**

```text
 dept_id | emp_id |  name  |      email      | manager_id | salary | commission | hire_date  | dept_name | location
---------+--------+--------+-----------------+------------+--------+------------+------------+-----------+----------
      30 |      8 | Vikram | vikram@corp.com |          1 |  70000 |       NULL | 2018-09-17 | HR        | Chennai
      30 |      9 | Pooja  | pooja@corp.com  |          8 |  52000 |       NULL | 2023-03-01 | HR        | Chennai
(2 rows)
```

`dept_id` appears once, first, and can be used unqualified. With `ON`, `SELECT *` would show both `e.dept_id` and `d.dept_id`.

### USING needs identical names

Self joins and differently named keys need `ON`:

```sql
SELECT e.name, m.name AS manager
FROM employees e
JOIN employees m ON m.emp_id = e.manager_id
WHERE e.dept_id = 30
ORDER BY e.emp_id;
```

**Output:**

```text
  name  | manager
--------+---------
 Vikram | Asha
 Pooja  | Vikram
(2 rows)
```

### Ambiguous column without USING

```sql
SELECT dept_id, name, dept_name
FROM employees e
JOIN departments d ON d.dept_id = e.dept_id;
```

**Output:**

```text
ERROR:  column reference "dept_id" is ambiguous
LINE 1: SELECT dept_id, name, dept_name
               ^
```

Qualify it (`e.dept_id`) or join with `USING (dept_id)`.

### NATURAL JOIN surprise

Both `customers` and `products` have a column called `name`. A natural join silently joins on it:

```sql
SELECT count(*) AS rows_from_natural_join
FROM customers NATURAL JOIN products;
```

**Output:**

```text
 rows_from_natural_join
------------------------
                      0
(1 row)
```

Zero rows — no customer has a product's name. Nobody intended a join on `name`; `NATURAL JOIN` decided it from column names.

### Filter on the optional side: ON vs WHERE

All employees, with the department name only if the department is in Chennai:

```sql
SELECT e.name, d.dept_name
FROM employees e
LEFT JOIN departments d
       ON d.dept_id = e.dept_id
      AND d.location = 'Chennai'
ORDER BY e.emp_id;
```

**Output:**

```text
  name  |  dept_name
--------+-------------
 Asha   | Engineering
 Ravi   | Engineering
 Meena  | Engineering
 Karan  | Engineering
 Divya  | NULL
 Arjun  | NULL
 Sneha  | NULL
 Vikram | HR
 Pooja  | HR
 Farhan | NULL
 Nisha  | NULL
 Rahul  | NULL
(12 rows)
```

The same filter in `WHERE`:

```sql
SELECT e.name, d.dept_name
FROM employees e
LEFT JOIN departments d ON d.dept_id = e.dept_id
WHERE d.location = 'Chennai'
ORDER BY e.emp_id;
```

**Output:**

```text
  name  |  dept_name
--------+-------------
 Asha   | Engineering
 Ravi   | Engineering
 Meena  | Engineering
 Karan  | Engineering
 Vikram | HR
 Pooja  | HR
(6 rows)
```

Twelve rows became six: the `WHERE` discarded every padded row and every non-Chennai match — the `LEFT JOIN` now behaves like an `INNER JOIN`.

### Filter on the preserved side: ON vs WHERE

"Departments of employees earning over 80000" — the wrong place first:

```sql
SELECT e.name, e.salary, d.dept_name
FROM employees e
LEFT JOIN departments d
       ON d.dept_id = e.dept_id
      AND e.salary > 80000
ORDER BY e.emp_id;
```

**Output:**

```text
  name  | salary |  dept_name
--------+--------+-------------
 Asha   | 150000 | Engineering
 Ravi   |  95000 | Engineering
 Meena  |  95000 | Engineering
 Karan  |  72000 | NULL
 Divya  |  88000 | Sales
 Arjun  |  60000 | NULL
 Sneha  |  60000 | NULL
 Vikram |  70000 | NULL
 Pooja  |  52000 | NULL
 Farhan |  82000 | Finance
 Nisha  |  45000 | NULL
 Rahul  |  55000 | NULL
(12 rows)
```

All 12 employees are still returned; the salary test only stopped low earners from **matching** a department. Filtering the preserved table belongs in `WHERE`:

```sql
SELECT e.name, e.salary, d.dept_name
FROM employees e
LEFT JOIN departments d ON d.dept_id = e.dept_id
WHERE e.salary > 80000
ORDER BY e.emp_id;
```

**Output:**

```text
  name  | salary |  dept_name
--------+--------+-------------
 Asha   | 150000 | Engineering
 Ravi   |  95000 | Engineering
 Meena  |  95000 | Engineering
 Divya  |  88000 | Sales
 Farhan |  82000 | Finance
(5 rows)
```

### Inner join: ON and WHERE are equivalent

```sql
SELECT
  (SELECT count(*) FROM employees e JOIN departments d
     ON d.dept_id = e.dept_id AND d.location = 'Chennai')                AS filter_in_on,
  (SELECT count(*) FROM employees e JOIN departments d
     ON d.dept_id = e.dept_id WHERE d.location = 'Chennai')              AS filter_in_where;
```

**Output:**

```text
 filter_in_on | filter_in_where
--------------+-----------------
            6 |               6
(1 row)
```

### Counting with a filtered optional side

Number of delivered orders per customer, keeping customers with none:

```sql
SELECT c.name, count(o.order_id) AS delivered_orders
FROM customers c
LEFT JOIN orders o
       ON o.customer_id = c.customer_id
      AND o.status = 'DELIVERED'
GROUP BY c.customer_id, c.name
ORDER BY c.customer_id;
```

**Output:**

```text
  name  | delivered_orders
--------+------------------
 Anil   |                2
 Bhavna |                1
 Chirag |                0
 Deepa  |                1
 Eshan  |                1
 Fatima |                0
(6 rows)
```

Moving `o.status = 'DELIVERED'` to `WHERE` would remove Chirag and Fatima from the report.

## Comparison

### ON vs USING

| | ON | USING |
|---|---|---|
| Condition | Any boolean expression | Equality on same-named columns only |
| Column names | Can differ | Must be identical |
| Output of join column | Both copies (`a.k`, `b.k`) | One merged column (plus qualified access) |
| Unqualified reference | Ambiguous error | Allowed |
| Self joins | Yes | Rarely usable (names identical but roles differ) |
| Readability | Explicit | Concise for conventional key names |

### WHERE vs ON

| | Inner join | Left join: optional-side condition | Left join: preserved-side condition |
|---|---|---|---|
| In `ON` | Same result | Keeps all left rows; restricts matches | Does **not** filter left rows |
| In `WHERE` | Same result | Turns the join into an inner join | Filters left rows (usual intent) |

## Common Mistakes

- Filtering the optional table in `WHERE` after a `LEFT JOIN`.
- Filtering the preserved table in `ON` and expecting fewer rows.
- `NATURAL JOIN` in production code.
- Unqualified column names that exist in both tables (ambiguous column error — or, worse, silently picking up a correlated outer column in a subquery).
- Assuming `USING` works for differently named keys.

## Revision

- `ON`: any condition; `USING (col)`: equality on same-named columns, merged output column.
- Avoid `NATURAL JOIN` (implicit, fragile).
- Inner joins: `ON` vs `WHERE` gives the same rows.
- Left joins: optional-side filters in `ON`; preserved-side filters in `WHERE`; `WHERE right.col …` makes it an inner join (except `IS NULL` anti-joins).
- The join (with `ON`) happens before `WHERE` in logical processing.

## Quick Revision

`USING` = same-name equality with one merged column; `ON` = anything. In a LEFT JOIN, put conditions on the right table in `ON` — in `WHERE` they silently turn it into an INNER JOIN.
