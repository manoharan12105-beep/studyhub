# Common Table Expressions (WITH)

**Module:** CTEs · **Interview priority:** Core

## What Is It?

A **common table expression (CTE)** is a named, temporary result set defined with `WITH` at the start of a statement and used like a table inside that statement.

```sql
-- Illustrative
WITH dept_avg AS (                          -- define
    SELECT dept_id, avg(salary) AS avg_salary
    FROM employees
    GROUP BY dept_id
)
SELECT e.name, e.salary, d.avg_salary       -- use
FROM employees e
JOIN dept_avg d ON d.dept_id = e.dept_id;
```

It exists only for the duration of that one statement.

## Why It Matters

- CTEs turn a deeply nested query into a sequence of named steps that read top to bottom — the main reason to use them.
- Recursive CTEs ([next topic](../recursive-ctes/content.md)) are the standard way to query hierarchies.
- PostgreSQL-specific behaviour is a favourite interview topic: whether a CTE is **inlined or materialized**, and **data-modifying CTEs** (`WITH … DELETE … RETURNING`).

## Core Concept

### Structure

```text
WITH name1 [(col, …)] AS ( query1 ),
     name2 AS ( query2 — may reference name1 ),
     …
main_statement — may reference any of them
```

- CTEs are separated by commas; one `WITH` keyword starts the list.
- A later CTE can reference an earlier one; an earlier one cannot reference a later one (except in `WITH RECURSIVE`).
- Each CTE can be referenced several times in the main statement.
- An optional column list renames the output columns: `WITH t (dept, total) AS (…)`.
- The main statement may be `SELECT`, `INSERT`, `UPDATE`, `DELETE` or `MERGE`.

### Inlined or materialized? (PostgreSQL 12+)

PostgreSQL decides how to run each non-recursive CTE:

| Situation | Default behaviour |
|-----------|-------------------|
| Referenced **once**, no side effects, not recursive | **Inlined**: merged into the main query like a subquery, so outer conditions can be pushed into it and indexes used |
| Referenced **two or more times** | **Materialized**: computed once into a temporary result (`CTE Scan` in the plan), reused by each reference |
| Data-modifying (`INSERT`/`UPDATE`/`DELETE` … `RETURNING`) or containing volatile functions | Always materialized, run exactly once |

You can override the choice:

- `WITH x AS MATERIALIZED (…)` — compute once, act as an **optimization fence** (outer conditions are applied after, not pushed in).
- `WITH x AS NOT MATERIALIZED (…)` — inline even if referenced several times (each reference recomputes it).

Before PostgreSQL 12, every CTE was materialized; old advice that "CTEs are always an optimization fence in PostgreSQL" is outdated.

### Data-modifying CTEs

PostgreSQL allows `INSERT`, `UPDATE` and `DELETE` (with `RETURNING`) inside `WITH`:

```sql
-- Illustrative: move rows in one statement
WITH moved AS (
    DELETE FROM orders WHERE status = 'CANCELLED' RETURNING *
)
INSERT INTO orders_archive SELECT * FROM moved;
```

Rules worth knowing:

- Every sub-statement runs **exactly once**, whether or not the main query reads it.
- All sub-statements and the main query see the **same snapshot**, taken at the start. The main query does not see changes made by a data-modifying CTE; use its `RETURNING` output instead.
- Two sub-statements must not modify the same row — the outcome is unpredictable.
- The whole statement is atomic: it succeeds or fails as one.

### CTE vs subquery vs view vs temporary table

| | CTE | Derived table | View | Temporary table |
|---|---|---|---|---|
| Lifetime | One statement | One statement | Permanent (schema object) | Session or transaction |
| Named and reusable within the statement | Yes | No | Yes | Yes |
| Reusable across statements | No | No | Yes | Yes (same session) |
| Can be indexed / analyzed | No | No | No (underlying tables are) | Yes |
| Recursive | Yes | No | Via recursive CTE inside | No |

Use a CTE for readability inside one statement; a temporary table when the intermediate result is large, reused by several statements, or needs an index; a view for a query reused across the application.

## Syntax

```sql
-- Illustrative
WITH [RECURSIVE]
    name [(column, …)] AS [[NOT] MATERIALIZED] (statement),
    …
main_statement;
```

## Examples

### Readable multi-step query

Customers whose delivered revenue is above the average delivered revenue per customer:

```sql
WITH delivered AS (
    SELECT o.customer_id, sum(oi.quantity * oi.unit_price) AS revenue
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.order_id
    WHERE o.status = 'DELIVERED'
    GROUP BY o.customer_id
),
benchmark AS (
    SELECT avg(revenue) AS avg_revenue FROM delivered
)
SELECT c.name, d.revenue, round(b.avg_revenue, 2) AS avg_revenue
FROM delivered d
JOIN customers c ON c.customer_id = d.customer_id
CROSS JOIN benchmark b
WHERE d.revenue > b.avg_revenue
ORDER BY d.revenue DESC;
```

**Output:**

```text
 name | revenue  | avg_revenue
------+----------+-------------
 Anil | 68500.00 |    23000.00
(1 row)
```

`benchmark` reads `delivered`; the main query reads both. The same logic as nested subqueries would repeat the revenue aggregation.

### Busiest customer without repeating the count

Compare with the nested derived-table version in [Subqueries](../../subqueries/sql-subqueries/practice.md):

```sql
WITH counts AS (
    SELECT customer_id, count(*) AS orders
    FROM orders
    GROUP BY customer_id
)
SELECT c.name, k.orders
FROM counts k
JOIN customers c ON c.customer_id = k.customer_id
WHERE k.orders = (SELECT max(orders) FROM counts);
```

**Output:**

```text
 name | orders
------+--------
 Anil |      3
(1 row)
```

### Column list

```sql
WITH totals (dept, headcount, payroll) AS (
    SELECT dept_id, count(*), sum(salary)
    FROM employees
    GROUP BY dept_id
)
SELECT * FROM totals WHERE payroll > 100000 ORDER BY dept;
```

**Output:**

```text
 dept | headcount | payroll
------+-----------+---------
   10 |         4 |  412000
   20 |         4 |  263000
   30 |         2 |  122000
(3 rows)
```

### Inlined: referenced once

```sql
ANALYZE;

EXPLAIN (COSTS OFF)
WITH eng AS (SELECT * FROM employees WHERE dept_id = 10)
SELECT name FROM eng WHERE salary > 90000;
```

**Output:**

```text
                   QUERY PLAN
-------------------------------------------------
 Seq Scan on employees
   Filter: ((salary > 90000) AND (dept_id = 10))
(2 rows)
```

No CTE node: both conditions were merged into one scan of `employees`.

### Forced materialization

```sql
EXPLAIN (COSTS OFF)
WITH eng AS MATERIALIZED (SELECT * FROM employees WHERE dept_id = 10)
SELECT name FROM eng WHERE salary > 90000;
```

**Output:**

```text
            QUERY PLAN
----------------------------------
 CTE Scan on eng
   Filter: (salary > 90000)
   CTE eng
     ->  Seq Scan on employees
           Filter: (dept_id = 10)
(5 rows)
```

The CTE is computed on its own (`CTE eng`), then `CTE Scan` filters its result. On a large table with an index on `salary`, the fence would prevent that index from being used for `salary > 90000`.

### Referenced twice: materialized by default

```sql
EXPLAIN (COSTS OFF)
WITH t AS (SELECT dept_id, avg(salary) AS a FROM employees GROUP BY dept_id)
SELECT x.dept_id, y.dept_id
FROM t x JOIN t y ON x.a > y.a;
```

**Output:**

```text
               QUERY PLAN
----------------------------------------
 Nested Loop
   Join Filter: (x.a > y.a)
   CTE t
     ->  HashAggregate
           Group Key: employees.dept_id
           ->  Seq Scan on employees
   ->  CTE Scan on t x
   ->  CTE Scan on t y
(8 rows)
```

The aggregation runs once; both `CTE Scan`s read its stored result. `NOT MATERIALIZED` would duplicate the aggregation into each reference — worthwhile only when pushing conditions in saves more than the recomputation costs.

### Data-modifying CTE: archive and delete in one statement

```sql
CREATE TABLE orders_archive (LIKE orders);

WITH moved AS (
    DELETE FROM orders
    WHERE status = 'CANCELLED'
    RETURNING *
)
INSERT INTO orders_archive
SELECT * FROM moved
RETURNING order_id, status;
```

**Output:**

```text
 order_id |  status
----------+-----------
      104 | CANCELLED
(1 row)
```

```sql
SELECT (SELECT count(*) FROM orders) AS orders_left,
       (SELECT count(*) FROM orders_archive) AS archived,
       (SELECT count(*) FROM order_items WHERE order_id = 104) AS items_of_104;
```

**Output:**

```text
 orders_left | archived | items_of_104
-------------+----------+--------------
           7 |        1 |            0
(1 row)
```

The order's items were removed by the `ON DELETE CASCADE` foreign key.

### The main query does not see the CTE's changes

```sql
WITH upd AS (
    UPDATE accounts SET balance = balance + 100
    WHERE account_id = 1
    RETURNING balance
)
SELECT a.balance            AS seen_by_main_query,
       (SELECT balance FROM upd) AS returned_by_update
FROM accounts a
WHERE a.account_id = 1;
```

**Output:**

```text
 seen_by_main_query | returned_by_update
--------------------+--------------------
           10000.00 |           10100.00
(1 row)
```

Both parts use the snapshot taken when the statement started. The update is real — a following statement sees it:

```sql
SELECT balance FROM accounts WHERE account_id = 1;
```

**Output:**

```text
 balance
----------
 10100.00
(1 row)
```

## Comparison

### CTE or subquery?

| Prefer a CTE when | Prefer a subquery when |
|-------------------|------------------------|
| The query has several logical steps | It is a short, one-off filter (`IN`, `EXISTS`) |
| The same intermediate result is used twice | The intermediate result is used once and is small |
| You need recursion or a data-modifying step | Portability to very old databases matters |

Since PostgreSQL 12 a single-reference CTE performs like the equivalent subquery.

## Common Mistakes

- Repeating `WITH` before each CTE instead of separating them with commas.
- Expecting a CTE to exist in the next statement — it is scoped to one statement.
- Assuming every CTE is an optimization fence (true only before PostgreSQL 12, or with `MATERIALIZED`).
- Adding `MATERIALIZED` "for speed" on a CTE that a later filter could have used an index on.
- Reading a table in the main query and expecting to see rows changed by a data-modifying CTE in the same statement.
- Using a huge CTE referenced several times where a temporary table with an index would be better.

## Revision

- `WITH name AS (query)` — named result for one statement; several CTEs separated by commas; later ones can use earlier ones.
- PostgreSQL 12+: single reference → inlined; multiple references, side effects or volatile functions → materialized once. Override with `MATERIALIZED` / `NOT MATERIALIZED`.
- Data-modifying CTEs: run exactly once, same snapshot for all parts, use `RETURNING` to pass rows on.
- CTE = readability within a statement; temp table = reuse across statements and indexing; view = permanent named query.

## Quick Revision

A CTE names a step of one statement; PostgreSQL 12+ inlines it when used once and materializes it when used more often (overridable). Data-modifying CTEs run once on a shared snapshot — the main query sees changes only through RETURNING.
