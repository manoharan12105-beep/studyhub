# GROUP BY and HAVING

**Module:** Aggregation and Grouping · **Interview priority:** Core

## What Is It?

**GROUP BY** splits the rows that survive `WHERE` into groups that share the same values in the grouping columns, and produces **one output row per group**. Aggregate functions (`count`, `sum`, `avg`, `min`, `max`, …) then summarise each group.

**HAVING** filters those groups, using conditions on aggregates.

```sql
-- Illustrative: departments with more than two employees
SELECT dept_id, count(*) AS headcount
FROM employees
GROUP BY dept_id
HAVING count(*) > 2;
```

Aggregate functions themselves — `count(*)` vs `count(col)`, NULL handling, behaviour on empty input — are covered in [SQL Functions](../../sql-fundamentals/sql-functions/content.md).

## Why It Matters

- Almost every report is a grouped query: revenue per month, orders per customer, headcount per department.
- "WHERE vs HAVING" and "why does this GROUP BY query fail?" are standard interview questions.
- Grouping errors produce wrong numbers silently: grouping by the wrong column, counting after a fan-out join, or filtering groups in `WHERE`.

## Core Concept

### From rows to groups

```text
employees (after WHERE)          GROUP BY dept_id                 one row per group
emp  dept  salary                                                 dept  count  sum
Asha   10  150000  ┐                                              10      4    412000
Ravi   10   95000  │ group 10                                     20      4    263000
Meena  10   95000  │                                              30      2    122000
Karan  10   72000  ┘                                              40      1     82000
Divya  20   88000  ┐ group 20                                     NULL    1     45000
…                  ┘
Nisha NULL  45000  ─ group NULL (all NULLs form ONE group)
```

- All `NULL` values of a grouping column form **one group** (grouping treats NULLs as equal, unlike `=`).
- A group exists only if at least one row has those values: Research (dept 50) has no employees, so it has no group. To show empty groups, start from `departments` and `LEFT JOIN`.

### The grouping rule

After `GROUP BY`, each output row stands for a whole group. Every expression in `SELECT`, `HAVING` and `ORDER BY` must therefore have **one value per group**:

- a grouping column or an expression of grouping columns, or
- an aggregate, or
- a column **functionally dependent** on the grouping columns.

PostgreSQL implements the third case for primary keys: if you `GROUP BY` a table's primary key, you may select any other column of that table without grouping by it, because the key determines it.

```sql
-- Illustrative
SELECT d.dept_id, d.dept_name, count(e.emp_id)   -- d.dept_name allowed:
FROM departments d                               -- dept_id is the primary key of d
LEFT JOIN employees e ON e.dept_id = d.dept_id
GROUP BY d.dept_id;
```

MySQL with `ONLY_FULL_GROUP_BY` disabled lets you select ungrouped columns and returns an arbitrary value; PostgreSQL refuses, which is the safe behaviour.

### WHERE vs HAVING

| | `WHERE` | `HAVING` |
|---|---|---|
| Filters | Rows | Groups |
| Runs | Before grouping | After grouping and aggregation |
| Can use aggregates | No | Yes |
| Can use ungrouped columns | Yes | No (only grouped columns and aggregates) |

A condition that does not involve an aggregate belongs in `WHERE`: it removes rows before they are grouped, which is clearer and lets indexes help. PostgreSQL's planner moves a non-aggregate `HAVING` condition on a grouping column into `WHERE` automatically, but writing it in the right place is still the expected style.

`HAVING` without `GROUP BY` treats the whole result as one group: `SELECT count(*) FROM employees HAVING count(*) > 100` returns one row or none.

### What you can group by

- Several columns: `GROUP BY dept_id, manager_id` — one group per distinct combination.
- Expressions: `GROUP BY date_trunc('month', order_date)`, `GROUP BY extract(year FROM hire_date)`.
- An output-column alias or position: `GROUP BY month` / `GROUP BY 1`. PostgreSQL allows both (the alias form is a PostgreSQL extension); positions break when the select list is edited.

### Conditional aggregation: FILTER and CASE

Count or sum only some rows of each group, producing several measures in one pass:

```sql
-- Illustrative
count(*) FILTER (WHERE status = 'DELIVERED')            -- PostgreSQL / SQL standard
sum(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END)    -- portable everywhere
```

This also **pivots** rows into columns (one column per status, per year, …).

### Collecting values: string_agg and array_agg

- `string_agg(name, ', ' ORDER BY name)` joins a group's values into one string.
- `array_agg(name ORDER BY name)` collects them into an array.
- `ORDER BY` inside the call controls the order; without it the order is unspecified.
- `bool_and(cond)` / `bool_or(cond)` answer "all rows?" / "any row?" per group.

### Subtotals: GROUPING SETS, ROLLUP, CUBE

One query can compute several groupings and union them:

| Clause | Groupings produced |
|--------|--------------------|
| `GROUPING SETS ((a, b), (a), ())` | Exactly those listed |
| `ROLLUP (a, b)` | `(a, b)`, `(a)`, `()` — hierarchy with subtotals and a grand total |
| `CUBE (a, b)` | `(a, b)`, `(a)`, `(b)`, `()` — every combination |

In subtotal rows the rolled-up column is `NULL`. `GROUPING(col)` returns 1 when the column was rolled up, 0 otherwise — the way to tell a subtotal `NULL` from a real `NULL` value.

### DISTINCT vs GROUP BY

`SELECT DISTINCT dept_id FROM employees` and `SELECT dept_id FROM employees GROUP BY dept_id` return the same rows, and PostgreSQL can use the same hash or sort strategy for both. Use `DISTINCT` to remove duplicates and `GROUP BY` when you aggregate.

## Syntax

```sql
-- Illustrative
SELECT grouping_columns, aggregate(…) [FILTER (WHERE …)]
FROM …
WHERE row_conditions
GROUP BY grouping_columns | ROLLUP (…) | CUBE (…) | GROUPING SETS (…)
HAVING group_conditions
ORDER BY …;
```

## Examples

### Headcount and payroll per department

```sql
SELECT dept_id,
       count(*)            AS headcount,
       sum(salary)         AS payroll,
       round(avg(salary))  AS avg_salary,
       max(salary)         AS top_salary
FROM employees
GROUP BY dept_id
ORDER BY dept_id;
```

**Output:**

```text
 dept_id | headcount | payroll | avg_salary | top_salary
---------+-----------+---------+------------+------------
      10 |         4 |  412000 |     103000 |     150000
      20 |         4 |  263000 |      65750 |      88000
      30 |         2 |  122000 |      61000 |      70000
      40 |         1 |   82000 |      82000 |      82000
    NULL |         1 |   45000 |      45000 |      45000
(5 rows)
```

The `NULL` group is Nisha. Research has no row.

### Selecting an ungrouped column fails

```sql
SELECT dept_id, name, count(*)
FROM employees
GROUP BY dept_id;
```

**Output:**

```text
ERROR:  column "employees.name" must appear in the GROUP BY clause or be used in an aggregate function
LINE 1: SELECT dept_id, name, count(*)
                        ^
```

Which name should represent four Engineering employees? There is no single answer, so PostgreSQL rejects the query.

### Primary-key functional dependency

```sql
SELECT d.dept_id, d.dept_name, d.location, count(e.emp_id) AS headcount
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.dept_id
GROUP BY d.dept_id
ORDER BY d.dept_id;
```

**Output:**

```text
 dept_id |  dept_name  | location  | headcount
---------+-------------+-----------+-----------
      10 | Engineering | Chennai   |         4
      20 | Sales       | Mumbai    |         4
      30 | HR          | Chennai   |         2
      40 | Finance     | Bengaluru |         1
      50 | Research    | NULL      |         0
(5 rows)
```

`dept_name` and `location` need not be listed in `GROUP BY` because `dept_id` is the primary key of `departments`. `count(e.emp_id)` (not `count(*)`) gives 0 for Research, whose padded row has `e.emp_id = NULL`.

### WHERE then HAVING

Departments where more than one employee was hired before 2021:

```sql
SELECT dept_id, count(*) AS early_hires
FROM employees
WHERE hire_date < '2021-01-01'
GROUP BY dept_id
HAVING count(*) > 1
ORDER BY dept_id;
```

**Output:**

```text
 dept_id | early_hires
---------+-------------
      10 |           3
      20 |           2
(2 rows)
```

`WHERE` removes the later hires first; `HAVING` then drops groups with a single remaining employee.

### An aggregate in WHERE is an error

```sql
SELECT dept_id, avg(salary)
FROM employees
WHERE avg(salary) > 70000
GROUP BY dept_id;
```

**Output:**

```text
ERROR:  aggregate functions are not allowed in WHERE
LINE 3: WHERE avg(salary) > 70000
              ^
```

### Grouping by an expression

Orders per month:

```sql
SELECT date_trunc('month', order_date)::date AS month,
       count(*) AS orders
FROM orders
GROUP BY month
ORDER BY month;
```

**Output:**

```text
   month    | orders
------------+--------
 2026-01-01 |      2
 2026-02-01 |      3
 2026-03-01 |      3
(3 rows)
```

`GROUP BY month` refers to the output alias — allowed in PostgreSQL's `GROUP BY` (but not in `WHERE`).

### Conditional aggregation with FILTER

Order statuses per customer, one column per status:

```sql
SELECT c.name,
       count(o.order_id)                                       AS total,
       count(o.order_id) FILTER (WHERE o.status = 'DELIVERED') AS delivered,
       count(o.order_id) FILTER (WHERE o.status = 'CANCELLED') AS cancelled,
       count(o.order_id) FILTER (WHERE o.status IN ('PLACED', 'SHIPPED')) AS open
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
GROUP BY c.customer_id
ORDER BY c.customer_id;
```

**Output:**

```text
  name  | total | delivered | cancelled | open
--------+-------+-----------+-----------+------
 Anil   |     3 |         2 |         0 |    1
 Bhavna |     2 |         1 |         0 |    1
 Chirag |     1 |         0 |         1 |    0
 Deepa  |     1 |         1 |         0 |    0
 Eshan  |     1 |         1 |         0 |    0
 Fatima |     0 |         0 |         0 |    0
(6 rows)
```

The portable form of one column is `sum(CASE WHEN o.status = 'DELIVERED' THEN 1 ELSE 0 END)` (which yields 0 rather than relying on `count` ignoring `NULL`s).

### string_agg, array_agg and bool_or

```sql
SELECT dept_id,
       string_agg(name, ', ' ORDER BY name)  AS members,
       array_agg(emp_id ORDER BY emp_id)     AS ids,
       bool_or(commission > 0)               AS anyone_on_commission
FROM employees
WHERE dept_id IS NOT NULL
GROUP BY dept_id
ORDER BY dept_id;
```

**Output:**

```text
 dept_id |          members           |    ids     | anyone_on_commission
---------+----------------------------+------------+----------------------
      10 | Asha, Karan, Meena, Ravi   | {1,2,3,4}  | NULL
      20 | Arjun, Divya, Rahul, Sneha | {5,6,7,12} | t
      30 | Pooja, Vikram              | {8,9}      | NULL
      40 | Farhan                     | {10}       | NULL
(4 rows)
```

`bool_or` ignores `NULL` inputs; a group with only `NULL` commissions gives `NULL`, not `false`.

### Duplicates found with HAVING

Salaries shared by more than one employee:

```sql
SELECT salary, count(*) AS employees, string_agg(name, ', ' ORDER BY name) AS who
FROM employees
GROUP BY salary
HAVING count(*) > 1
ORDER BY salary DESC;
```

**Output:**

```text
 salary | employees |     who
--------+-----------+--------------
  95000 |         2 | Meena, Ravi
  60000 |         2 | Arjun, Sneha
(2 rows)
```

### ROLLUP: subtotals and grand total

Revenue by category and product, with category subtotals and a grand total (non-cancelled orders):

```sql
SELECT p.category,
       p.name,
       sum(oi.quantity * oi.unit_price) AS revenue,
       GROUPING(p.category, p.name)     AS level
FROM order_items oi
JOIN orders o   ON o.order_id = oi.order_id
JOIN products p ON p.product_id = oi.product_id
WHERE o.status <> 'CANCELLED'
GROUP BY ROLLUP (p.category, p.name)
ORDER BY p.category NULLS LAST, p.name NULLS LAST;
```

**Output:**

```text
  category   |   name   | revenue  | level
-------------+----------+----------+-------
 Electronics | Keyboard |  3000.00 |     0
 Electronics | Laptop   | 55000.00 |     0
 Electronics | Mouse    |  3450.00 |     0
 Electronics | NULL     | 61450.00 |     1
 Furniture   | Chair    | 18000.00 |     0
 Furniture   | Desk     | 16000.00 |     0
 Furniture   | NULL     | 34000.00 |     1
 NULL        | NULL     | 95450.00 |     3
(8 rows)
```

`GROUPING(p.category, p.name)` is a bit mask: 0 for a detail row, 1 when `name` was rolled up (category subtotal), 3 when both were (grand total).

### CUBE and GROUPING SETS

Headcount by department and by hire-year band, with every combination:

```sql
SELECT dept_id,
       CASE WHEN hire_date < '2020-01-01' THEN 'before 2020' ELSE '2020 or later' END AS hired,
       count(*) AS n
FROM employees
WHERE dept_id IN (10, 20)
GROUP BY CUBE (dept_id, hired)
ORDER BY dept_id NULLS LAST, hired NULLS LAST;
```

**Output:**

```text
 dept_id |     hired     | n
---------+---------------+---
      10 | 2020 or later | 1
      10 | before 2020   | 3
      10 | NULL          | 4
      20 | 2020 or later | 3
      20 | before 2020   | 1
      20 | NULL          | 4
    NULL | 2020 or later | 4
    NULL | before 2020   | 4
    NULL | NULL          | 8
(9 rows)
```

`GROUPING SETS ((dept_id), (hired))` would return only the two sets of one-column subtotals.

## Comparison

### Grouping extensions

| Clause | Groupings for `(a, b)` | Typical use |
|--------|------------------------|-------------|
| `GROUP BY a, b` | `(a, b)` | Ordinary report |
| `ROLLUP (a, b)` | `(a, b)`, `(a)`, `()` | Hierarchical subtotals (year → month) |
| `CUBE (a, b)` | `(a, b)`, `(a)`, `(b)`, `()` | Cross-tab with all margins |
| `GROUPING SETS (…)` | Exactly the listed sets | Several independent summaries in one scan |

## Common Mistakes

- Selecting a column that is neither grouped, aggregated, nor determined by a grouped primary key.
- Putting an aggregate condition in `WHERE`, or a plain row condition in `HAVING`.
- Expecting groups for values that have no rows (Research) — start from the parent table with `LEFT JOIN`.
- Using `count(*)` after a `LEFT JOIN` and counting the padded row as 1; count a column from the right table.
- Aggregating after a one-to-many join and multiplying sums (fan-out) — aggregate first in a derived table.
- Reading `NULL` in a `ROLLUP` row as missing data instead of a subtotal; check `GROUPING()`.
- Relying on the order of `string_agg`/`array_agg` without `ORDER BY` inside the call.

## Revision

- `GROUP BY` → one row per distinct combination of grouping values; NULLs form one group; empty groups do not exist.
- Select only grouped columns, aggregates, or columns of a table whose primary key is grouped.
- `WHERE` filters rows before grouping (no aggregates); `HAVING` filters groups after.
- PostgreSQL extras: `FILTER (WHERE …)`, `GROUP BY` output alias, `string_agg`/`array_agg` with `ORDER BY`, `bool_and`/`bool_or`.
- `ROLLUP` = hierarchy subtotals; `CUBE` = all combinations; `GROUPING SETS` = chosen sets; `GROUPING()` tells subtotal `NULL`s apart.

## Quick Revision

GROUP BY makes one row per group and every selected column must be grouped, aggregated or key-dependent; WHERE filters rows before grouping, HAVING filters groups after; FILTER and ROLLUP/CUBE give conditional counts and subtotals in one query.
