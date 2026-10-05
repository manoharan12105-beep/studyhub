# INNER, LEFT, RIGHT and FULL Joins

**Module:** Joins · **Interview priority:** Core

## What Is It?

A **join** combines rows from two tables by pairing rows that satisfy a **join condition**, usually equal key values (`e.dept_id = d.dept_id`). The join type decides what happens to rows that find **no partner**:

| Join | Keeps |
|------|-------|
| `INNER JOIN` | Only matched pairs |
| `LEFT [OUTER] JOIN` | All left rows; unmatched ones get `NULL`s on the right |
| `RIGHT [OUTER] JOIN` | All right rows; unmatched ones get `NULL`s on the left |
| `FULL [OUTER] JOIN` | All rows from both sides; `NULL`s wherever a side has no match |

`CROSS JOIN` and self joins are covered in [CROSS JOIN and SELF JOIN](../cross-and-self-joins/content.md).

## Why It Matters

- Normalised databases split data across tables; joins put it back together. Nearly every real query has one.
- "Explain the join types with an example" and "What is the result size of this join?" are core interview questions; join mistakes (missing rows, duplicated rows) are among the most common production bugs.

## Core Concept

### The two tables used below

```text
departments                          employees (subset of columns)
dept_id | dept_name   | location     emp_id | name   | dept_id
10      | Engineering | Chennai      1..4   | Asha, Ravi, Meena, Karan | 10
20      | Sales       | Mumbai       5,6,7,12 | Divya, Arjun, Sneha, Rahul | 20
30      | HR          | Chennai      8,9    | Vikram, Pooja | 30
40      | Finance     | Bengaluru    10     | Farhan | 40
50      | Research    | NULL         11     | Nisha  | NULL   ← no department
```

- Research (50) has no employees.
- Nisha has no department.

### How the types differ, on these tables

```text
                 employees ⋈ departments on dept_id
                 ┌────────────────────────────────┐
 Nisha (no dept) │  11 matched employee–dept pairs │  Research (no employees)
 only in LEFT,   │  in every join type             │  only in RIGHT,
 FULL            │                                 │  FULL
                 └────────────────────────────────┘

INNER JOIN  → 11 rows   (matched only)
LEFT JOIN   → 12 rows   (11 + Nisha with NULL department)
RIGHT JOIN  → 12 rows   (11 + Research with NULL employee)
FULL JOIN   → 13 rows   (11 + Nisha + Research)
```

(Here "left" is `employees` because it is written first: `employees e LEFT JOIN departments d`.)

### INNER JOIN

Returns only pairs where the condition is TRUE. Rows with no partner — or with a `NULL` key — disappear. `JOIN` alone means `INNER JOIN`.

### LEFT JOIN

Every row of the left table appears at least once. If no right row matches, the right-side columns are `NULL`. Use it when the left table is the main subject and the right table is optional information ("all employees, with department name if any").

### RIGHT JOIN

The mirror image: every right row appears. `A RIGHT JOIN B` is the same as `B LEFT JOIN A` (with column order swapped). Most teams write `LEFT JOIN` consistently and reorder tables instead.

### FULL OUTER JOIN

Every row from both tables appears; unmatched rows on either side are padded with `NULL`s. Useful for reconciliation: "which records exist on one side only?"

### How many rows does a join return?

For each left row, the join produces one output row **per matching right row**:

- Matching on a unique key (each employee has one department) → at most one match per left row.
- Matching on a non-unique column → one left row can produce **many** rows (**fan-out**).
- Outer joins add one padded row for each unmatched row.

So `INNER` row count ≤ `LEFT` count, and an inner join can return **more** rows than either table when keys repeat. Fan-out is the cause of "duplicate rows after a JOIN" and of inflated `SUM`s — see the examples.

### Joining more than two tables

Joins chain left to right: `orders JOIN customers … JOIN order_items … JOIN products …`. Each join adds columns from one more table. Mixing inner and outer joins in a chain needs care: an `INNER JOIN` after a `LEFT JOIN` that references the optional table removes the padded rows again.

### How PostgreSQL executes joins (preview)

SQL describes the result; the planner picks an algorithm per join — **nested loop**, **hash join** or **merge join** — and may reorder inner joins. Details: [EXPLAIN and Query Plans](../../query-optimization/explain-and-query-plans/content.md).

## Syntax

```sql
-- Illustrative: join syntax
SELECT …
FROM a
[INNER] JOIN b ON a.key = b.key
LEFT  [OUTER] JOIN c ON c.key = a.key
RIGHT [OUTER] JOIN d ON d.key = a.key
FULL  [OUTER] JOIN e ON e.key = a.key;
```

## Examples

### INNER JOIN

```sql
SELECT e.name, d.dept_name
FROM employees e
INNER JOIN departments d ON d.dept_id = e.dept_id
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
 Divya  | Sales
 Arjun  | Sales
 Sneha  | Sales
 Vikram | HR
 Pooja  | HR
 Farhan | Finance
 Rahul  | Sales
(11 rows)
```

11 rows: Nisha is missing (her `dept_id` is `NULL`), and Research does not appear (nobody works there).

### LEFT JOIN

```sql
SELECT e.name, d.dept_name
FROM employees e
LEFT JOIN departments d ON d.dept_id = e.dept_id
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
 Divya  | Sales
 Arjun  | Sales
 Sneha  | Sales
 Vikram | HR
 Pooja  | HR
 Farhan | Finance
 Nisha  | NULL
 Rahul  | Sales
(12 rows)
```

### RIGHT JOIN

```sql
SELECT e.name, d.dept_name
FROM employees e
RIGHT JOIN departments d ON d.dept_id = e.dept_id
ORDER BY d.dept_id, e.emp_id;
```

**Output:**

```text
  name  |  dept_name
--------+-------------
 Asha   | Engineering
 Ravi   | Engineering
 Meena  | Engineering
 Karan  | Engineering
 Divya  | Sales
 Arjun  | Sales
 Sneha  | Sales
 Rahul  | Sales
 Vikram | HR
 Pooja  | HR
 Farhan | Finance
 NULL   | Research
(12 rows)
```

The same result as `departments d LEFT JOIN employees e`.

### FULL OUTER JOIN

```sql
SELECT e.name, d.dept_name
FROM employees e
FULL JOIN departments d ON d.dept_id = e.dept_id
WHERE e.emp_id IS NULL OR d.dept_id IS NULL;     -- show only the unmatched rows
```

**Output:**

```text
 name  | dept_name
-------+-----------
 Nisha | NULL
 NULL  | Research
(2 rows)
```

### Row counts side by side

```sql
SELECT
  (SELECT count(*) FROM employees e INNER JOIN departments d ON d.dept_id = e.dept_id) AS inner_rows,
  (SELECT count(*) FROM employees e LEFT  JOIN departments d ON d.dept_id = e.dept_id) AS left_rows,
  (SELECT count(*) FROM employees e RIGHT JOIN departments d ON d.dept_id = e.dept_id) AS right_rows,
  (SELECT count(*) FROM employees e FULL  JOIN departments d ON d.dept_id = e.dept_id) AS full_rows;
```

**Output:**

```text
 inner_rows | left_rows | right_rows | full_rows
------------+-----------+------------+-----------
         11 |        12 |         12 |        13
(1 row)
```

### Joining four tables

Every item of every delivered order with customer and product names:

```sql
SELECT o.order_id, c.name AS customer, p.name AS product, oi.quantity
FROM orders o
JOIN customers   c  ON c.customer_id = o.customer_id
JOIN order_items oi ON oi.order_id   = o.order_id
JOIN products    p  ON p.product_id  = oi.product_id
WHERE o.status = 'DELIVERED'
ORDER BY o.order_id, p.name;
```

**Output:**

```text
 order_id | customer | product | quantity
----------+----------+---------+----------
      101 | Anil     | Laptop  |        1
      101 | Anil     | Mouse   |        2
      102 | Bhavna   | Chair   |        2
      102 | Bhavna   | Desk    |        1
      105 | Deepa    | Chair   |        1
      105 | Deepa    | Mouse   |        1
      107 | Anil     | Chair   |        1
      107 | Anil     | Desk    |        1
      108 | Eshan    | Mouse   |        3
(9 rows)
```

### Fan-out: duplicate rows and inflated sums

Each order has several items. Joining orders to items and then summing an **order-level** value counts it once per item:

```sql
CREATE TABLE order_payments (order_id integer PRIMARY KEY REFERENCES orders, shipping_fee numeric(8,2));
INSERT INTO order_payments VALUES (101, 100), (102, 150), (105, 50);

SELECT sum(op.shipping_fee) AS wrong_total_shipping
FROM order_payments op
JOIN order_items oi ON oi.order_id = op.order_id;
```

**Output:**

```text
 wrong_total_shipping
----------------------
               600.00
(1 row)
```

The real total is 300, but orders 101, 102 and 105 each have two items, so every fee was counted twice. Aggregate before joining, or do not join tables you do not need:

```sql
SELECT sum(shipping_fee) AS total_shipping FROM order_payments;
```

**Output:**

```text
 total_shipping
----------------
         300.00
(1 row)
```

### Customers with their order count, including those without orders

```sql
SELECT c.name, count(o.order_id) AS orders
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
GROUP BY c.customer_id, c.name
ORDER BY orders DESC, c.name;
```

**Output:**

```text
  name  | orders
--------+--------
 Anil   |      3
 Bhavna |      2
 Chirag |      1
 Deepa  |      1
 Eshan  |      1
 Fatima |      0
(6 rows)
```

## Comparison

### INNER vs LEFT vs RIGHT vs FULL

| | INNER | LEFT | RIGHT | FULL |
|---|---|---|---|---|
| Unmatched left rows | Dropped | Kept, right side `NULL` | Dropped | Kept |
| Unmatched right rows | Dropped | Dropped | Kept, left side `NULL` | Kept |
| Rows here | 11 | 12 | 12 | 13 |
| Typical question | "Pairs that exist" | "All A, with B if any" | "All B, with A if any" | "Reconcile A and B" |
| Anti-join use | — | `WHERE b.key IS NULL` → A without B | `WHERE a.key IS NULL` → B without A | Both sides |

### NULL behaviour summary

| Situation | Result |
|-----------|--------|
| Join key is `NULL` | Never matches (not even another `NULL`) |
| Outer join, no match | Missing side's columns are `NULL` |
| `WHERE` on the optional side of a LEFT JOIN | Removes padded rows → behaves like INNER (see [ON vs WHERE](../join-conditions-on-using-where/content.md)) |
| `count(*)` over a LEFT JOIN | Counts padded rows; use `count(right.key)` |

## Common Mistakes

- Using `INNER JOIN` when some rows have no partner (or a `NULL` key) and losing them silently.
- Summing parent-level values after joining to a child table (fan-out).
- Adding `DISTINCT` to hide duplicates from a wrong join instead of fixing the join condition.
- Forgetting a join condition between two tables (accidental cross product).
- Filtering the optional table in `WHERE` after a `LEFT JOIN`.
- `count(*)` instead of `count(child.key)` with outer joins.

## Revision

- INNER: matches only. LEFT: all left + matches. RIGHT: all right + matches. FULL: everything.
- Unmatched sides are padded with `NULL`; `NULL` keys never match.
- `A RIGHT JOIN B` = `B LEFT JOIN A`.
- Row count: one output row per matching pair; non-unique keys fan out and inflate aggregates.
- Anti-join: `LEFT JOIN … WHERE right.key IS NULL`.
- Sample data: inner 11, left 12, right 12, full 13 rows.

## Quick Revision

INNER keeps matches; LEFT/RIGHT keep all rows of one side with `NULL` padding; FULL keeps all of both. Watch fan-out (duplicates, inflated sums) and `NULL` keys.
