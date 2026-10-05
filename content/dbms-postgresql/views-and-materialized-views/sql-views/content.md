# Views

**Module:** Views and Materialized Views · **Interview priority:** Frequently asked

## What Is It?

A **view** is a named, stored `SELECT` that can be queried like a table. It stores **no data**: every time you query the view, PostgreSQL runs (more precisely, merges in) its defining query against the current data.

```sql
-- Illustrative
CREATE VIEW employee_directory AS
SELECT e.emp_id, e.name, d.dept_name, d.location
FROM employees e
LEFT JOIN departments d ON d.dept_id = e.dept_id;

SELECT * FROM employee_directory WHERE location = 'Chennai';
```

## Why It Matters

- Views give complex joins a simple name, hide schema changes behind a stable interface, and expose only some columns or rows to some users.
- Interviewers ask: view vs table, view vs materialized view, can you update through a view, what is `WITH CHECK OPTION`, do views improve performance (no — by themselves they do not).

## Core Concept

### How a view is executed

PostgreSQL stores the view's query as a **rewrite rule**. When a query references the view, the view's definition is substituted in place and the combined query is planned as a whole — conditions on the view are pushed into its tables and indexes are used normally. There is no stored result and no cache, so a view is exactly as fast as the query it contains.

### Uses

| Use | Example |
|-----|---------|
| Simplify repeated joins/calculations | `order_summaries` with totals per order |
| Stable interface | Keep the old shape after splitting a table, so existing code keeps working |
| Security | Grant `SELECT` on a view that omits salary or filters rows, not on the table |
| Consistency | One definition of "active customer" used everywhere |

### Updatable views

A view is **automatically updatable** (accepts `INSERT`/`UPDATE`/`DELETE`) when it is simple: exactly one table in `FROM`, no `DISTINCT`, `GROUP BY`, `HAVING`, aggregates, window functions, set operations, `LIMIT`/`OFFSET` or top-level `WITH`. Columns that are expressions are read-only; plain columns can be written.

- **`WITH CHECK OPTION`** rejects inserts/updates through the view that would produce rows the view cannot see (e.g. inserting an employee of another department into a "Sales employees" view). `LOCAL` checks only this view's condition; `CASCADED` (the default) also checks the conditions of underlying views.
- More complex views can be made writable with `INSTEAD OF` triggers ([Triggers](../../functions-procedures-triggers/postgresql-triggers/content.md)).

### Changing and dropping

- `CREATE OR REPLACE VIEW` can only **add** columns at the end; it cannot remove, rename or change the type of existing ones — drop and recreate for that.
- Objects depend on each other: you cannot drop a table or column that a view uses (`DROP … CASCADE` drops the views too). `ALTER TABLE … RENAME COLUMN` is fine — views reference columns by identity, not by name.
- `SELECT *` in a view is expanded when the view is created; columns added to the table later do **not** appear in the view.

### Views and security

- By default a view runs with the privileges of the **view owner**: a user granted `SELECT` on the view can read it even without access to the underlying tables. This is how column/row-restricting views work.
- `WITH (security_invoker = true)` (PostgreSQL 15+) makes the view check the **caller's** privileges (and row-level security policies) on the underlying tables instead.
- `WITH (security_barrier)` prevents user-supplied functions in the outer query from seeing rows the view's `WHERE` filters out — use it for row-restricting security views.

## Syntax

```sql
-- Illustrative
CREATE [OR REPLACE] [TEMP] VIEW name [(column_names)]
    [WITH (security_barrier | security_invoker = true)]
AS query
[WITH [CASCADED | LOCAL] CHECK OPTION];

ALTER VIEW name RENAME TO new_name;
DROP VIEW [IF EXISTS] name [CASCADE];
```

## Examples

### A view hides a join

```sql
CREATE VIEW employee_directory AS
SELECT e.emp_id, e.name, d.dept_name, d.location
FROM employees e
LEFT JOIN departments d ON d.dept_id = e.dept_id;

SELECT name, dept_name FROM employee_directory WHERE location = 'Chennai' ORDER BY emp_id;
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

### The view is merged into the query

```sql
EXPLAIN (COSTS OFF)
SELECT name FROM employee_directory WHERE emp_id = 3;
```

**Output:**

```text
                   QUERY PLAN
------------------------------------------------
 Index Scan using employees_pkey on employees e
   Index Cond: (emp_id = 3)
(2 rows)
```

No "view" node: the planner merged the definition, pushed `emp_id = 3` down to `employees`, and — because the `LEFT JOIN` cannot change the row count and no column of `departments` is used — removed the join entirely.

### An aggregate view

```sql
CREATE VIEW order_summaries AS
SELECT o.order_id, o.customer_id, o.status,
       count(*)                          AS lines,
       sum(oi.quantity * oi.unit_price)  AS total
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
GROUP BY o.order_id;

SELECT * FROM order_summaries WHERE total > 10000 ORDER BY total DESC;
```

**Output:**

```text
 order_id | customer_id |  status   | lines |  total
----------+-------------+-----------+-------+----------
      101 |           1 | DELIVERED |     2 | 56000.00
      104 |           3 | CANCELLED |     1 | 55000.00
      102 |           2 | DELIVERED |     2 | 17000.00
      107 |           1 | DELIVERED |     2 | 12500.00
(4 rows)
```

This view is not updatable (it aggregates), but it is always current: the totals are computed from the live tables at query time.

### Updating through a simple view

```sql
CREATE VIEW sales_team AS
SELECT emp_id, name, salary, dept_id, hire_date
FROM employees
WHERE dept_id = 20;

UPDATE sales_team SET salary = salary + 2000 WHERE name = 'Rahul'
RETURNING emp_id, name, salary;
```

**Output:**

```text
 emp_id | name  | salary
--------+-------+--------
     12 | Rahul |  57000
(1 row)
```

The update went to `employees`. Without a check option, the view also accepts rows it will never show:

```sql
INSERT INTO sales_team (emp_id, name, salary, dept_id, hire_date) VALUES (20, 'Ghost', 40000, 30, '2026-03-01');
SELECT count(*) AS visible_in_view FROM sales_team WHERE emp_id = 20;
SELECT count(*) AS stored_in_table FROM employees WHERE emp_id = 20;
```

**Output:**

```text
 visible_in_view
-----------------
               0
(1 row)

 stored_in_table
-----------------
               1
(1 row)
```

The row was written to `employees` with `dept_id = 30`, so it vanished from the Sales view at once. `WITH CHECK OPTION` rejects such rows:

```sql
CREATE OR REPLACE VIEW sales_team AS
SELECT emp_id, name, salary, dept_id, hire_date
FROM employees
WHERE dept_id = 20
WITH CHECK OPTION;

INSERT INTO sales_team (emp_id, name, salary, dept_id, hire_date) VALUES (22, 'Ghost 2', 40000, 30, '2026-03-01');
```

**Output:**

```text
ERROR:  new row violates check option for view "sales_team"
DETAIL:  Failing row contains (22, Ghost 2, null, 30, null, 40000, null, 2026-03-01).
```

```sql
INSERT INTO sales_team (emp_id, name, salary, dept_id, hire_date) VALUES (21, 'Mira', 58000, 20, '2026-03-01')
RETURNING emp_id, name, dept_id;
```

**Output:**

```text
 emp_id | name | dept_id
--------+------+---------
     21 | Mira |      20
(1 row)
```

### CREATE OR REPLACE limits

```sql
CREATE OR REPLACE VIEW employee_directory AS
SELECT e.emp_id, e.name, d.location
FROM employees e
LEFT JOIN departments d ON d.dept_id = e.dept_id;
```

**Output:**

```text
ERROR:  cannot drop columns from view
```

Removing (or renaming, or retyping) a column requires `DROP VIEW` and `CREATE VIEW`. Adding a column at the end is allowed.

### Dependencies

```sql
DROP TABLE departments;
```

**Output:**

```text
ERROR:  cannot drop table departments because other objects depend on it
DETAIL:  constraint employees_dept_id_fkey on table employees depends on table departments
view employee_directory depends on table departments
HINT:  Use DROP ... CASCADE to drop the dependent objects too.
```

### A view as a security boundary

```sql
CREATE VIEW public_directory AS
SELECT emp_id, name, dept_id FROM employees;          -- no salary, no email

CREATE ROLE intern LOGIN;
GRANT SELECT ON public_directory TO intern;

SET ROLE intern;
SELECT name FROM public_directory WHERE emp_id = 1;
SELECT salary FROM employees WHERE emp_id = 1;
RESET ROLE;
```

**Output:**

```text
 name
------
 Asha
(1 row)

ERROR:  permission denied for table employees
```

The intern reads the view (it runs with its owner's rights) but not the table. With `security_invoker = true`, the view itself would fail for the intern, because the caller's own privileges on `employees` would be checked.

## Comparison

### Table vs view vs materialized view

| | Table | View | Materialized view |
|---|---|---|---|
| Stores data | Yes | No (stored query) | Yes (query result snapshot) |
| Always current | — | Yes | No — until `REFRESH` |
| Query speed | Depends on indexes | Same as its query | Fast (precomputed), indexable |
| Writable | Yes | Simple views; others via `INSTEAD OF` triggers | No |
| Use for | Source data | Abstraction, security, reuse | Expensive reports, caching |

## Common Mistakes

- Expecting a view to make a query faster by itself (it does not store results).
- Using `SELECT *` in a view and expecting new table columns to appear.
- Trying `CREATE OR REPLACE VIEW` to drop or retype a column.
- Updatable views without `WITH CHECK OPTION`, letting users insert rows they cannot see.
- Layering many views on views, making plans hard to read and slow to tune.
- Assuming `GRANT` on a view also requires `GRANT` on the base table (not for default, owner-privilege views — and forgetting that this is also a way to leak data).

## Revision

- View = stored query, no data; merged into the calling query at plan time.
- Uses: simplification, stable interface, security (column/row restriction), single definition of business logic.
- Simple single-table views are updatable; `WITH [LOCAL | CASCADED] CHECK OPTION` keeps writes inside the view's condition.
- `CREATE OR REPLACE` only adds columns; dependencies block dropping underlying objects.
- Default: owner's privileges; `security_invoker` (15+) uses the caller's; `security_barrier` for row-filtering security views.

## Quick Revision

A view is a named query with no stored data, expanded into each query that uses it, so it is always current and no faster than its definition. Simple views are updatable (add WITH CHECK OPTION), and by default a view runs with its owner's privileges.
