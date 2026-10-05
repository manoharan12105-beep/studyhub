# Correlated Subqueries

**Module:** Subqueries · **Interview priority:** Core

## What Is It?

A **correlated subquery** is a subquery that refers to a column of the outer query. It cannot run on its own, because its result depends on the current outer row.

```sql
-- Illustrative: x.dept_id = e.dept_id ties the inner query to the outer row
SELECT e.name, e.salary
FROM employees e
WHERE e.salary > (SELECT avg(x.salary)
                  FROM employees x
                  WHERE x.dept_id = e.dept_id);   -- e comes from the outer query
```

A **non-correlated** subquery, such as `(SELECT avg(salary) FROM employees)`, has no such reference and produces the same result for every outer row.

## Why It Matters

- "Compare each row with its own group" questions are the classic use: above the department average, latest order per customer, Nth highest salary.
- Interviewers routinely ask "does a correlated subquery run once per row?" The precise answer separates the **logical meaning** (per row) from the **physical execution** (whatever plan the optimizer picks). Saying only "yes, it is always slow" is a weak answer.
- Correlated subqueries also produce a well-known silent bug: an unqualified column that accidentally binds to the outer query.

## Core Concept

### Logical meaning: evaluated for each outer row

The SQL standard defines a correlated subquery as if it were evaluated once for every candidate row of the outer query, with the outer columns acting as parameters.

Dry run of the department-average query for a few employees:

```text
outer row               inner query becomes                               value     salary > value?
Asha   dept 10  150000  avg(salary) WHERE dept_id = 10                   103000    TRUE   → kept
Ravi   dept 10   95000  avg(salary) WHERE dept_id = 10                   103000    FALSE
Divya  dept 20   88000  avg(salary) WHERE dept_id = 20                    65750    TRUE   → kept
Vikram dept 30   70000  avg(salary) WHERE dept_id = 30                    61000    TRUE   → kept
Farhan dept 40   82000  avg(salary) WHERE dept_id = 40                    82000    FALSE
Nisha  dept NULL 45000  avg(salary) WHERE dept_id = NULL  → no rows       NULL      UNKNOWN → dropped
```

This model is what you use to **reason about the result**. It says nothing about how many times the database actually runs anything.

### Physical execution: what PostgreSQL really does

The planner is free to execute the query any way that produces the same result. In PostgreSQL:

| Subquery form | Typical plan | Runs per outer row? |
|---------------|--------------|---------------------|
| `EXISTS (correlated)` / `IN (subquery)` in `WHERE` | **Pulled up** into a semi-join (hash, merge or nested loop) | No — joined like a table |
| `NOT EXISTS (correlated)` | Pulled up into an **anti-join** | No |
| Scalar correlated subquery (`= (SELECT agg … WHERE x = outer.col)`), in `WHERE` or the `SELECT` list | A **SubPlan** node, re-executed for each outer row that needs it | Yes |
| Non-correlated scalar subquery | An **InitPlan**, run once | No |
| `NOT IN (subquery)` | A hashed SubPlan (hash table built once), because NULL semantics block an anti-join | Probe per row, build once |

Two consequences:

- `EXISTS` with a correlation is **not** "run once per row" in PostgreSQL; it is usually a hash or merge semi-join, as fast as the equivalent join.
- A correlated **scalar aggregate** is genuinely re-executed for each row. With an index on the correlated column, each execution is an index lookup and the cost is fine; without one, each execution scans the inner table — O(n × m).

`EXPLAIN` tells you which case you are in. The `loops=` count under a SubPlan is the number of executions.

### Where correlated subqueries appear

| Position | Example use |
|----------|-------------|
| `WHERE` with a comparison | Salary above the department average |
| `WHERE EXISTS` / `NOT EXISTS` | Customers with / without orders |
| `SELECT` list | Order count per customer |
| `UPDATE … SET col = (correlated)` | Copy a value or an aggregate from a related table |
| `DELETE … WHERE EXISTS (correlated)` | Delete rows that have a matching row elsewhere |
| `FROM LATERAL (…)` | Several rows or columns per outer row (top-N per group) |

### Rewriting a correlated subquery

The same "compare with my group" logic can usually be written three ways:

| Approach | Shape | Notes |
|----------|-------|-------|
| Correlated subquery | `WHERE salary > (SELECT avg … WHERE x.dept_id = e.dept_id)` | Closest to the English question; per-row SubPlan |
| Join to a derived table / CTE | Aggregate per group once, join back | One pass to aggregate, one join |
| Window function | `avg(salary) OVER (PARTITION BY dept_id)` | One scan of one table; groups NULL keys together |

None is "always fastest". For small tables they are identical in practice; for large ones, compare plans with `EXPLAIN ANALYZE`.

## Syntax

```sql
-- Illustrative: the outer alias is referenced inside the inner query
SELECT …
FROM outer_table o
WHERE o.col op (SELECT agg(i.col) FROM inner_table i WHERE i.key = o.key);

SELECT …
FROM outer_table o
WHERE EXISTS (SELECT 1 FROM inner_table i WHERE i.key = o.key);
```

Always qualify columns with table aliases in both queries — see the trap below.

## Examples

The plans below were captured on PostgreSQL 18 after `ANALYZE`. Plan shapes depend on version, statistics and table sizes; the semantics do not.

```sql
ANALYZE;
```

### Employees above their department average

```sql
SELECT e.name, e.dept_id, e.salary
FROM employees e
WHERE e.salary > (SELECT avg(x.salary)
                  FROM employees x
                  WHERE x.dept_id = e.dept_id)
ORDER BY e.emp_id;
```

**Output:**

```text
  name  | dept_id | salary
--------+---------+--------
 Asha   |      10 | 150000
 Divya  |      20 |  88000
 Vikram |      30 |  70000
(3 rows)
```

Nisha is absent: her `dept_id` is `NULL`, so `x.dept_id = NULL` matches nothing, `avg` over no rows is `NULL`, and `45000 > NULL` is UNKNOWN.

### How PostgreSQL ran it

```sql
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF, SUMMARY OFF, BUFFERS OFF)
SELECT e.name, e.dept_id, e.salary
FROM employees e
WHERE e.salary > (SELECT avg(x.salary)
                  FROM employees x
                  WHERE x.dept_id = e.dept_id);
```

**Output:**

```text
                            QUERY PLAN
-------------------------------------------------------------------
 Seq Scan on employees e (actual rows=3.00 loops=1)
   Filter: ((salary)::numeric > (SubPlan 1))
   Rows Removed by Filter: 9
   SubPlan 1
     ->  Aggregate (actual rows=1.00 loops=12)
           ->  Seq Scan on employees x (actual rows=3.08 loops=12)
                 Filter: (dept_id = e.dept_id)
                 Rows Removed by Filter: 9
(8 rows)
```

`SubPlan 1` ran `loops=12` — once per employee, matching the logical model. Each run scanned all 12 employees, so 144 row visits for 12 rows. On a large table, an index on `employees(dept_id)` turns each run into an index lookup, or a rewrite removes the repetition.

### Correlated EXISTS becomes a semi-join

```sql
EXPLAIN (COSTS OFF)
SELECT c.name
FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);
```

**Output:**

```text
                  QUERY PLAN
----------------------------------------------
 Hash Right Semi Join
   Hash Cond: (o.customer_id = c.customer_id)
   ->  Seq Scan on orders o
   ->  Hash
         ->  Seq Scan on customers c
(5 rows)
```

No SubPlan: the planner **pulled up** the subquery and joined `orders` once. ("Right Semi Join" means the hash table was built on `customers`; PostgreSQL 17 and older can only build it on the inner side and show `Hash Semi Join`.) The same happens for `NOT EXISTS`, which becomes an anti-join:

```sql
EXPLAIN (COSTS OFF)
SELECT c.name
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);
```

**Output:**

```text
                  QUERY PLAN
----------------------------------------------
 Hash Anti Join
   Hash Cond: (c.customer_id = o.customer_id)
   ->  Seq Scan on customers c
   ->  Hash
         ->  Seq Scan on orders o
(5 rows)
```

### Correlated subquery in the SELECT list

```sql
SELECT c.name,
       (SELECT count(*) FROM orders o WHERE o.customer_id = c.customer_id) AS orders
FROM customers c
ORDER BY c.customer_id;
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

```sql
EXPLAIN (COSTS OFF)
SELECT c.name,
       (SELECT count(*) FROM orders o WHERE o.customer_id = c.customer_id) AS orders
FROM customers c;
```

**Output:**

```text
                      QUERY PLAN
-------------------------------------------------------
 Seq Scan on customers c
   SubPlan 1
     ->  Aggregate
           ->  Seq Scan on orders o
                 Filter: (customer_id = c.customer_id)
(5 rows)
```

A scalar subquery in the `SELECT` list stays a SubPlan executed per output row.

### The same question three ways

Rewrite 1 — join to an aggregated derived table:

```sql
SELECT e.name, e.dept_id, e.salary
FROM employees e
JOIN (SELECT dept_id, avg(salary) AS avg_salary
      FROM employees
      GROUP BY dept_id) AS d ON d.dept_id = e.dept_id
WHERE e.salary > d.avg_salary
ORDER BY e.emp_id;
```

**Output:**

```text
  name  | dept_id | salary
--------+---------+--------
 Asha   |      10 | 150000
 Divya  |      20 |  88000
 Vikram |      30 |  70000
(3 rows)
```

Rewrite 2 — window function:

```sql
SELECT name, dept_id, salary
FROM (SELECT name, dept_id, salary, emp_id,
             avg(salary) OVER (PARTITION BY dept_id) AS avg_salary
      FROM employees) AS t
WHERE salary > avg_salary
ORDER BY emp_id;
```

**Output:**

```text
  name  | dept_id | salary
--------+---------+--------
 Asha   |      10 | 150000
 Divya  |      20 |  88000
 Vikram |      30 |  70000
(3 rows)
```

Same rows here. They differ only for the `NULL` department: the window function treats Nisha as a one-person partition (average 45000, not above it), the join and the correlated subquery never match `NULL = NULL`. Had the question been "≥ the department average", Nisha would appear only in the window version.

### Highest earner per department, including the NULL group

`IS NOT DISTINCT FROM` makes the correlation NULL-safe:

```sql
SELECT e.name, e.dept_id, e.salary
FROM employees e
WHERE e.salary = (SELECT max(x.salary)
                  FROM employees x
                  WHERE x.dept_id IS NOT DISTINCT FROM e.dept_id)
ORDER BY e.dept_id;
```

**Output:**

```text
  name  | dept_id | salary
--------+---------+--------
 Asha   |      10 | 150000
 Divya  |      20 |  88000
 Vikram |      30 |  70000
 Farhan |      40 |  82000
 Nisha  |    NULL |  45000
(5 rows)
```

Compare with the `(dept_id, salary) IN (…)` version in [Subqueries](../sql-subqueries/content.md), which loses Nisha.

### Nth highest salary with a correlated count

Employees earning the 2nd highest distinct salary — exactly one distinct salary is greater than theirs:

```sql
SELECT e1.name, e1.salary
FROM employees e1
WHERE 1 = (SELECT count(DISTINCT e2.salary)
           FROM employees e2
           WHERE e2.salary > e1.salary)
ORDER BY e1.emp_id;
```

**Output:**

```text
 name  | salary
-------+--------
 Ravi  |  95000
 Meena |  95000
(2 rows)
```

For the Nth highest use `N - 1`. This is a classic interview answer that works on any SQL database, but it is O(n²) without help; `dense_rank()` is the modern answer — see [Nth-Highest and Top-N Problems](../../sql-problem-solving/nth-highest-and-top-n-problems/content.md).

### Correlated UPDATE

Store each customer's order count in a new column:

```sql
ALTER TABLE customers ADD COLUMN order_count integer;

UPDATE customers c
SET order_count = (SELECT count(*) FROM orders o WHERE o.customer_id = c.customer_id)
RETURNING c.name, c.order_count;
```

**Output:**

```text
  name  | order_count
--------+-------------
 Anil   |           3
 Bhavna |           2
 Chirag |           1
 Deepa  |           1
 Eshan  |           1
 Fatima |           0
(6 rows)
```

Every customer gets a value — 0 for Fatima — because `count(*)` over no rows is 0. With `max` or `sum` instead, customers without orders would get `NULL`. PostgreSQL also offers `UPDATE … FROM` for join-style updates; [DML Commands](../../sql-fundamentals/dml-commands/content.md) covers it.

### Correlated DELETE

Remove the items of cancelled orders:

```sql
DELETE FROM order_items oi
WHERE EXISTS (SELECT 1
              FROM orders o
              WHERE o.order_id = oi.order_id
                AND o.status = 'CANCELLED')
RETURNING oi.order_id, oi.product_id;
```

**Output:**

```text
 order_id | product_id
----------+------------
      104 |          1
(1 row)
```

### Trap: the column that silently binds to the outer query

`products` has no `customer_id` column. This does not fail:

```sql
SELECT name
FROM customers
WHERE customer_id IN (SELECT customer_id FROM products)
ORDER BY customer_id;
```

**Output:**

```text
  name
--------
 Anil
 Bhavna
 Chirag
 Deepa
 Eshan
 Fatima
(6 rows)
```

Name resolution looks for `customer_id` in `products`, does not find it, and moves outward to `customers`. The subquery silently becomes correlated: for each customer it returns that customer's own id six times (once per product), so the `IN` is always TRUE and every customer is returned. Qualifying the column exposes the mistake:

```sql
SELECT c.name
FROM customers c
WHERE c.customer_id IN (SELECT p.customer_id FROM products p);
```

**Output:**

```text
ERROR:  column p.customer_id does not exist
LINE 3: WHERE c.customer_id IN (SELECT p.customer_id FROM products p...
                                       ^
HINT:  Perhaps you meant to reference the column "c.customer_id".
```

> [!WARNING]
> In a `DELETE … WHERE id IN (SELECT id FROM other_table)` this trap deletes every row. Always qualify columns inside subqueries.

## Comparison

### Correlated vs non-correlated

| | Non-correlated | Correlated |
|---|---|---|
| References outer columns | No | Yes |
| Can run on its own | Yes | No |
| Logical evaluation | Once | Once per outer row |
| Typical PostgreSQL plan | InitPlan (once), or hashed SubPlan for `IN` | Semi/anti-join for `EXISTS`/`IN`; SubPlan per row for scalar subqueries |
| Typical use | Compare with a global value | Compare with the row's own group |

## Common Mistakes

- Saying "a correlated subquery always executes once per row". Logically yes; physically PostgreSQL often turns `EXISTS`/`IN` into a join. Check `EXPLAIN`.
- Unqualified column names in the subquery that bind to the outer table.
- Forgetting that a NULL correlation key (`x.dept_id = e.dept_id` with NULL) matches nothing.
- Using `max`/`sum` in a correlated `UPDATE` and getting `NULL` for rows with no related rows (wrap in `COALESCE` if 0 is intended).
- Repeating the same correlated subquery in several `SELECT` columns — each one is a separate SubPlan. Use one `LATERAL` subquery or a join to an aggregate.
- Leaving the correlated column unindexed on a large inner table.

## Revision

- Correlated subquery = references an outer column; cannot run alone.
- Logical model: evaluated per outer row; use it to reason about results.
- PostgreSQL: `EXISTS`/`IN` → semi-join, `NOT EXISTS` → anti-join (pulled up, not per row); scalar correlated subquery → SubPlan, re-executed per row (`loops=` in `EXPLAIN ANALYZE`).
- Make it fast: index the correlation column, or rewrite with a join to an aggregate, a window function or `LATERAL`.
- NULL correlation keys never match `=`; use `IS NOT DISTINCT FROM` when NULL is a real group.
- Qualify every column; an unknown column silently binds to the outer query.

## Quick Revision

A correlated subquery references the outer row: logically per row, but PostgreSQL turns EXISTS/IN into semi-joins and runs only scalar ones per row as a SubPlan. Index the correlation key, qualify every column, and remember NULL keys never match.
