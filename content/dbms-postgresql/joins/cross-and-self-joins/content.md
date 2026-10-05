# CROSS JOIN and SELF JOIN

**Module:** Joins · **Interview priority:** Frequently asked

## What Is It?

- A **CROSS JOIN** returns the **Cartesian product** of two tables: every row of the first paired with every row of the second. It has no join condition. `m` rows × `n` rows = `m × n` rows.
- A **SELF JOIN** joins a table **to itself**, using two different aliases, to relate rows of the same table — employees to their managers, products to other products in the same category.

## Why It Matters

- Self joins answer classic interview questions: "employee and manager names", "employees earning more than their manager", "pairs of customers in the same city".
- Cross joins are useful for generating combinations (sizes × colours, every product × every month) — and are also the result of a **forgotten join condition**, a common cause of huge, wrong results.

## Core Concept

### CROSS JOIN

```text
sizes (3 rows)    colours (2 rows)        sizes CROSS JOIN colours (3 × 2 = 6 rows)
S                 Red                     S Red, S Blue,
M                 Blue                    M Red, M Blue,
L                                         L Red, L Blue
```

Equivalent forms:

```sql
-- Illustrative: three ways to write a Cartesian product
SELECT * FROM a CROSS JOIN b;
SELECT * FROM a, b;                 -- comma join without WHERE
SELECT * FROM a JOIN b ON true;
```

Uses:

- Generating all combinations (product variants, schedule slots).
- Building a "report grid" — every product × every month — then `LEFT JOIN` real data onto it so empty cells show 0.
- Attaching a one-row result (a total, a parameter) to every row.

Danger: in the old comma syntax, `FROM orders, customers` without a `WHERE` condition silently produces a cross product. With 1 million orders and 100 000 customers that is 10¹¹ rows. Explicit `JOIN … ON` makes a missing condition a syntax error.

### SELF JOIN

There is no `SELF JOIN` keyword: you join a table to itself with an ordinary join and **two aliases**, so each copy plays a role.

```text
employees e (as "worker")          employees m (as "manager")
emp_id | name  | manager_id   ───>  emp_id | name
2      | Ravi  | 1                   1      | Asha
3      | Meena | 2                   2      | Ravi
```

Condition: `e.manager_id = m.emp_id`.

- Use `LEFT JOIN` to keep employees without a manager (Asha).
- Self joins go **one level** per join. For a whole hierarchy of unknown depth, use a [recursive CTE](../../ctes/recursive-ctes/content.md).

### Pairs without duplicates

To pair rows of the same table (people in the same city), join on the shared attribute and break symmetry with `a.id < b.id`:

- `a.id <> b.id` removes self-pairs but keeps both (A, B) and (B, A).
- `a.id < b.id` keeps each unordered pair once.

### Non-equi joins

Join conditions need not be equality: `ON e.salary BETWEEN g.min_salary AND g.max_salary` (salary grades) or `ON b.salary > a.salary`. Self joins with `<`/`>` conditions can be used for ranking-style questions, though [window functions](../../window-functions/window-functions-basics/content.md) are usually clearer and faster.

## Syntax

```sql
-- Illustrative: syntax
SELECT … FROM a CROSS JOIN b;
SELECT … FROM t AS x JOIN t AS y ON x.parent_id = y.id;      -- self join
```

## Examples

### CROSS JOIN: product variants

```sql
CREATE TABLE sizes   (size text);
CREATE TABLE colours (colour text);
INSERT INTO sizes   VALUES ('S'), ('M'), ('L');
INSERT INTO colours VALUES ('Red'), ('Blue');

SELECT s.size, c.colour
FROM sizes s
CROSS JOIN colours c
ORDER BY c.colour, s.size;
```

**Output:**

```text
 size | colour
------+--------
 L    | Blue
 M    | Blue
 S    | Blue
 L    | Red
 M    | Red
 S    | Red
(6 rows)
```

### CROSS JOIN as a report grid

Goal: revenue for every category in every month of Q1 2026, showing 0 where nothing was sold. First, the real per-category totals — note that Stationery and some month/category combinations are simply missing:

```sql
SELECT date_trunc('month', o.order_date)::date AS month, p.category,
       sum(oi.quantity * oi.unit_price) AS revenue
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
JOIN products p     ON p.product_id = oi.product_id
WHERE o.status <> 'CANCELLED'
GROUP BY 1, 2
ORDER BY 1, 2;
```

**Output:**

```text
   month    |  category   | revenue
------------+-------------+----------
 2026-01-01 | Electronics | 56000.00
 2026-01-01 | Furniture   | 17000.00
 2026-02-01 | Electronics |  2000.00
 2026-02-01 | Furniture   |  4500.00
 2026-03-01 | Electronics |  3450.00
 2026-03-01 | Furniture   | 12500.00
(6 rows)
```

**Right way:** aggregate the real data first, build the full grid with a `CROSS JOIN` of months × categories, then `LEFT JOIN` the totals onto the grid:

```sql
WITH sales AS (
    SELECT date_trunc('month', o.order_date) AS month, p.category,
           sum(oi.quantity * oi.unit_price) AS revenue
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.order_id
    JOIN products p     ON p.product_id = oi.product_id
    WHERE o.status <> 'CANCELLED'
    GROUP BY 1, 2
)
SELECT m.month::date AS month, cat.category, COALESCE(s.revenue, 0) AS revenue
FROM generate_series(DATE '2026-01-01', DATE '2026-03-01', interval '1 month') AS m(month)
CROSS JOIN (SELECT DISTINCT category FROM products) AS cat
LEFT JOIN sales s ON s.month = m.month AND s.category = cat.category
ORDER BY 1, 2;
```

**Output:**

```text
   month    |  category   | revenue
------------+-------------+----------
 2026-01-01 | Electronics | 56000.00
 2026-01-01 | Furniture   | 17000.00
 2026-01-01 | Stationery  |        0
 2026-02-01 | Electronics |  2000.00
 2026-02-01 | Furniture   |  4500.00
 2026-02-01 | Stationery  |        0
 2026-03-01 | Electronics |  3450.00
 2026-03-01 | Furniture   | 12500.00
 2026-03-01 | Stationery  |        0
(9 rows)
```

Every month × category cell is present, with 0 where there were no sales.

**Wrong way:** chaining `LEFT JOIN`s off the grid and summing at the end:

```sql
SELECT m.month::date AS month, cat.category,
       COALESCE(sum(oi.quantity * oi.unit_price), 0) AS revenue
FROM generate_series(DATE '2026-01-01', DATE '2026-03-01', interval '1 month') AS m(month)
CROSS JOIN (SELECT DISTINCT category FROM products) AS cat
LEFT JOIN orders o
       ON date_trunc('month', o.order_date) = m.month
      AND o.status <> 'CANCELLED'
LEFT JOIN order_items oi ON oi.order_id = o.order_id
LEFT JOIN products p     ON p.product_id = oi.product_id AND p.category = cat.category
GROUP BY m.month, cat.category
ORDER BY m.month, cat.category;
```

**Output:**

```text
   month    |  category   | revenue
------------+-------------+----------
 2026-01-01 | Electronics | 73000.00
 2026-01-01 | Furniture   | 73000.00
 2026-01-01 | Stationery  | 73000.00
 2026-02-01 | Electronics |  6500.00
 2026-02-01 | Furniture   |  6500.00
 2026-02-01 | Stationery  |  6500.00
 2026-03-01 | Electronics | 15950.00
 2026-03-01 | Furniture   | 15950.00
 2026-03-01 | Stationery  | 15950.00
(9 rows)
```

Every category received the whole month's revenue. The category test sits on the **last** join (`products`), so it only decides whether `p` is `NULL`; the `order_items` rows of other categories are still joined and summed. Lesson: when several `LEFT JOIN`s hang off a grid, pre-aggregate, then join.

### SELF JOIN: employee and manager

```sql
SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON m.emp_id = e.manager_id
ORDER BY e.emp_id;
```

**Output:**

```text
 employee | manager
----------+---------
 Asha     | NULL
 Ravi     | Asha
 Meena    | Ravi
 Karan    | Ravi
 Divya    | Asha
 Arjun    | Divya
 Sneha    | Divya
 Vikram   | Asha
 Pooja    | Vikram
 Farhan   | Asha
 Nisha    | Asha
 Rahul    | Divya
(12 rows)
```

### Employees earning more than their manager

```sql
SELECT e.name AS employee, e.salary, m.name AS manager, m.salary AS manager_salary
FROM employees e
JOIN employees m ON m.emp_id = e.manager_id
WHERE e.salary >= m.salary
ORDER BY e.emp_id;
```

**Output:**

```text
 employee | salary | manager | manager_salary
----------+--------+---------+----------------
 Meena    |  95000 | Ravi    |          95000
(1 row)
```

Meena earns the same as her manager Ravi; nobody earns more. (`>=` was used to show the tie; with `>` the result would be empty.)

### Number of direct reports per manager

```sql
SELECT m.name AS manager, count(e.emp_id) AS direct_reports
FROM employees m
JOIN employees e ON e.manager_id = m.emp_id
GROUP BY m.emp_id, m.name
ORDER BY direct_reports DESC, m.name;
```

**Output:**

```text
 manager | direct_reports
---------+----------------
 Asha    |              5
 Divya   |              3
 Ravi    |              2
 Vikram  |              1
(4 rows)
```

### Pairs of customers in the same city

```sql
SELECT a.name AS customer_1, b.name AS customer_2, a.city
FROM customers a
JOIN customers b ON b.city = a.city AND a.customer_id < b.customer_id;
```

**Output:**

```text
 customer_1 | customer_2 |  city
------------+------------+---------
 Anil       | Deepa      | Chennai
(1 row)
```

With `a.customer_id <> b.customer_id` the pair would appear twice (Anil–Deepa and Deepa–Anil).

### Non-equi join: salary grades

```sql
CREATE TABLE salary_grades (grade text, min_salary integer, max_salary integer);
INSERT INTO salary_grades VALUES ('C', 0, 59999), ('B', 60000, 89999), ('A', 90000, 1000000);

SELECT e.name, e.salary, g.grade
FROM employees e
JOIN salary_grades g ON e.salary BETWEEN g.min_salary AND g.max_salary
WHERE e.dept_id = 20
ORDER BY e.salary DESC;
```

**Output:**

```text
 name  | salary | grade
-------+--------+-------
 Divya |  88000 | B
 Arjun |  60000 | B
 Sneha |  60000 | B
 Rahul |  55000 | C
(4 rows)
```

## Comparison

| | CROSS JOIN | SELF JOIN |
|---|---|---|
| Tables | Two (or more) different tables, or the same | One table, two aliases |
| Condition | None | Any (`=`, `<`, `BETWEEN` …) |
| Result size | m × n | Depends on the condition |
| Typical use | Combinations, grids | Hierarchies (one level), comparing rows of one table, pairs |
| Main risk | Explosive row counts | Duplicate/mirrored pairs, forgetting `LEFT` for roots |

## Common Mistakes

- A missing join condition (`FROM a, b` without `WHERE`) creating a Cartesian product.
- Self join with `INNER JOIN` when the root (no manager) must be shown.
- Using `<>` instead of `<` for pairs and getting each pair twice.
- Expecting a self join to walk a hierarchy of any depth — it goes one level per join.
- Summing values across a grid of `LEFT JOIN`s without pre-aggregating (as the grid example showed).

## Revision

- CROSS JOIN = Cartesian product, m × n rows, no condition; `FROM a, b` without `WHERE` is the same.
- Uses: combinations, calendar/report grids (then `LEFT JOIN` aggregated data).
- SELF JOIN = table joined to itself with two aliases; `LEFT JOIN` keeps roots.
- Pairs once: `a.id < b.id`.
- Non-equi joins: `BETWEEN`, `<`, `>` conditions.
- Deep hierarchies → recursive CTE.

## Quick Revision

CROSS JOIN pairs every row with every row (m × n). SELF JOIN uses two aliases of one table — e.g. `e.manager_id = m.emp_id`; use `a.id < b.id` to list each pair once.
