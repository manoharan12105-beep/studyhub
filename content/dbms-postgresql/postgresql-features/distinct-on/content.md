# DISTINCT ON

**Module:** PostgreSQL Features · **Interview priority:** Frequently asked

## What Is It?

**`SELECT DISTINCT ON (expressions)`** is a PostgreSQL extension that keeps **only the first row of each group** of rows sharing the same values of `expressions`, where "first" is decided by `ORDER BY`.

```sql
-- Illustrative: each customer's most recent order
SELECT DISTINCT ON (customer_id) customer_id, order_id, order_date
FROM orders
ORDER BY customer_id, order_date DESC;
```

It answers "the top row per group" in one short query, where standard SQL needs a window function in a subquery.

## Why It Matters

- "Latest status per order", "most recent login per user", "cheapest offer per product" are common backend queries; `DISTINCT ON` is the idiomatic PostgreSQL answer.
- Interviewers ask how it differs from `DISTINCT` and from `row_number()`, and what the `ORDER BY` rule is.

## Core Concept

### How it works

1. Rows are sorted by the `ORDER BY`.
2. Rows are grouped by the `DISTINCT ON` expressions (which must be the leftmost `ORDER BY` items).
3. From each group, the **first** row in sort order is kept; the others are discarded.

```text
ORDER BY customer_id, order_date DESC        DISTINCT ON (customer_id)
customer  order  date                         keeps
1         107    2026-03-15   ← first of 1    1  107  2026-03-15
1         103    2026-02-03
1         101    2026-01-05
2         106    2026-03-01   ← first of 2    2  106  2026-03-01
2         102    2026-01-12
…
```

### Rules

- The `DISTINCT ON` expressions must match the **leftmost** `ORDER BY` expressions (same order); otherwise PostgreSQL raises an error.
- The remaining `ORDER BY` items decide which row of the group wins. If they do not determine a unique row, the winner among ties is **unpredictable** — add a tiebreaker.
- Without `ORDER BY`, an arbitrary row of each group is returned.
- `NULL` values of the `DISTINCT ON` expression form one group (like `GROUP BY`).
- The output order follows the `ORDER BY`. To present results in another order, wrap the query and sort outside.

### DISTINCT vs DISTINCT ON vs GROUP BY vs row_number

| | Removes duplicates of | Returns | Ties |
|---|---|---|---|
| `DISTINCT` | Entire selected row | Distinct rows | — |
| `DISTINCT ON (k)` | Key `k` | One full row per `k` (first by `ORDER BY`) | One row, chosen by the sort |
| `GROUP BY k` | Key `k` | Aggregates per `k`; other columns only via aggregates | — |
| `row_number() OVER (PARTITION BY k ORDER BY …) = 1` | Key `k` | One full row per `k` | One row, chosen by the sort |
| `rank() … = 1` | — | All rows tied for first | All tied rows |

`DISTINCT ON` is limited to **one** row per group. For top-N per group (N > 1) or for keeping ties, use a window function.

### Performance

- PostgreSQL implements it as a sort (or an ordered index scan) followed by a `Unique` node that keeps the first row of each group.
- An index on `(group_key, sort_key DESC)` lets PostgreSQL read rows already in order and skip the sort.
- For very large tables with **few groups and many rows per group**, reading every row is wasteful; a `LATERAL (… ORDER BY … LIMIT 1)` per group (or a recursive "skip scan") can be faster.

## Syntax

```sql
-- Illustrative
SELECT DISTINCT ON (key1 [, key2 …]) columns
FROM …
[WHERE …]
ORDER BY key1 [, key2 …], tie_breaking_sort … ;
```

## Examples

### Latest order per customer

```sql
SELECT DISTINCT ON (customer_id) customer_id, order_id, order_date, status
FROM orders
ORDER BY customer_id, order_date DESC;
```

**Output:**

```text
 customer_id | order_id | order_date |  status
-------------+----------+------------+-----------
           1 |      107 | 2026-03-15 | DELIVERED
           2 |      106 | 2026-03-01 | PLACED
           3 |      104 | 2026-02-14 | CANCELLED
           4 |      105 | 2026-02-20 | DELIVERED
           5 |      108 | 2026-03-28 | DELIVERED
(5 rows)
```

### Top earner per department, with a tiebreaker

```sql
SELECT DISTINCT ON (dept_id) dept_id, name, salary
FROM employees
ORDER BY dept_id, salary DESC, emp_id;
```

**Output:**

```text
 dept_id |  name  | salary
---------+--------+--------
      10 | Asha   | 150000
      20 | Divya  |  88000
      30 | Vikram |  70000
      40 | Farhan |  82000
    NULL | Nisha  |  45000
(5 rows)
```

One row per department, including the `NULL` department (Nisha). In Engineering no tie matters, but in a department where two people share the top salary, `emp_id` decides; without it the choice would be arbitrary.

### Second place is not available

`DISTINCT ON` can only keep the first row. Sales has a tie for second place (Arjun and Sneha); to get second-highest earners, use `dense_rank()` ([Ranking Window Functions](../../window-functions/ranking-window-functions/content.md)).

### The ORDER BY rule

```sql
SELECT DISTINCT ON (dept_id) dept_id, name, salary
FROM employees
ORDER BY salary DESC;
```

**Output:**

```text
ERROR:  SELECT DISTINCT ON expressions must match initial ORDER BY expressions
LINE 1: SELECT DISTINCT ON (dept_id) dept_id, name, salary
                            ^
```

The `DISTINCT ON` key must lead the `ORDER BY`. To get the result sorted by salary, wrap it:

```sql
SELECT *
FROM (SELECT DISTINCT ON (dept_id) dept_id, name, salary
      FROM employees
      ORDER BY dept_id, salary DESC, emp_id) AS top
ORDER BY salary DESC;
```

**Output:**

```text
 dept_id |  name  | salary
---------+--------+--------
      10 | Asha   | 150000
      20 | Divya  |  88000
      40 | Farhan |  82000
      30 | Vikram |  70000
    NULL | Nisha  |  45000
(5 rows)
```

### DISTINCT ON several columns

The most expensive item line per (order, category):

```sql
SELECT DISTINCT ON (oi.order_id, p.category)
       oi.order_id, p.category, p.name, oi.quantity * oi.unit_price AS line_total
FROM order_items oi
JOIN products p ON p.product_id = oi.product_id
WHERE oi.order_id IN (101, 102, 105)
ORDER BY oi.order_id, p.category, oi.quantity * oi.unit_price DESC, p.product_id;
```

**Output:**

```text
 order_id |  category   |  name  | line_total
----------+-------------+--------+------------
      101 | Electronics | Laptop |   55000.00
      102 | Furniture   | Chair  |    9000.00
      105 | Electronics | Mouse  |     500.00
      105 | Furniture   | Chair  |    4500.00
(4 rows)
```

### Same answer with row_number

```sql
SELECT customer_id, order_id, order_date, status
FROM (SELECT o.*,
             row_number() OVER (PARTITION BY customer_id ORDER BY order_date DESC) AS rn
      FROM orders o) AS t
WHERE rn = 1
ORDER BY customer_id;
```

**Output:**

```text
 customer_id | order_id | order_date |  status
-------------+----------+------------+-----------
           1 |      107 | 2026-03-15 | DELIVERED
           2 |      106 | 2026-03-01 | PLACED
           3 |      104 | 2026-02-14 | CANCELLED
           4 |      105 | 2026-02-20 | DELIVERED
           5 |      108 | 2026-03-28 | DELIVERED
(5 rows)
```

Portable to other databases, more verbose, and easy to extend to `rn <= 3`.

### The plan with a matching index

```sql
CREATE INDEX orders_customer_date_idx ON orders (customer_id, order_date DESC);
SET enable_seqscan = off;   -- tiny table: force the index to show the plan shape

EXPLAIN (COSTS OFF)
SELECT DISTINCT ON (customer_id) customer_id, order_id, order_date
FROM orders
ORDER BY customer_id, order_date DESC;
```

**Output:**

```text
                        QUERY PLAN
-----------------------------------------------------------
 Unique
   ->  Index Scan using orders_customer_date_idx on orders
(2 rows)
```

The index delivers rows already sorted by `(customer_id, order_date DESC)`; `Unique` keeps the first row of each customer. No `Sort` node.

## Comparison

### Top-1 per group in PostgreSQL

| Approach | Ties | Extends to top-N | Portable | Typical plan |
|----------|------|------------------|----------|--------------|
| `DISTINCT ON` | One row (tiebreaker decides) | No | No | Sort/Index Scan → Unique |
| `row_number() = 1` | One row | Yes (`rn <= N`) | Yes | Sort → WindowAgg → filter |
| `rank() = 1` | All tied rows | Yes | Yes | Sort → WindowAgg → filter |
| Correlated `= (SELECT max …)` | All tied rows | No | Yes | SubPlan per row |
| `LATERAL (… LIMIT 1)` | One row | Yes (`LIMIT N`) | Mostly | Index lookup per group |

## Common Mistakes

- Putting the `DISTINCT ON` key anywhere but first in `ORDER BY` (error), or omitting `ORDER BY` (arbitrary row).
- No tiebreaker when the sort key can tie — the chosen row can change between runs.
- Confusing `DISTINCT ON (a) a, b` with `DISTINCT a, b` — the first returns one row per `a`, the second one row per `(a, b)`.
- Using `DISTINCT ON` when ties should all be returned (use `rank()`), or when more than one row per group is needed.
- Expecting the final result sorted by something other than the `ORDER BY` — wrap it.

## Revision

- `DISTINCT ON (k)` keeps the first row per `k` according to `ORDER BY`; PostgreSQL-only.
- `ORDER BY` must start with the `DISTINCT ON` expressions; the rest picks the winner — add a unique tiebreaker.
- One row per group only; `NULL` keys form one group.
- Plan: Sort or ordered Index Scan → `Unique`; index on `(k, sort DESC)` avoids the sort.
- Alternatives: `row_number()` (portable, top-N), `rank()` (keeps ties), `LATERAL … LIMIT`.

## Quick Revision

DISTINCT ON (k) keeps the first row of each k-group by ORDER BY, which must start with k. Add a tiebreaker, and use window functions for ties or top-N.
