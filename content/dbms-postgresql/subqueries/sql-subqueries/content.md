# Subqueries: Scalar, Multi-Row and Derived Tables

**Module:** Subqueries · **Interview priority:** Core

## What Is It?

A **subquery** (inner query, nested query) is a `SELECT` written inside another SQL statement, in parentheses. The outer statement uses its result as a value, a list of values, or a table.

```sql
-- Illustrative: a subquery used as a single value
SELECT name, salary
FROM employees
WHERE salary > (SELECT avg(salary) FROM employees);   -- inner query: one number
```

## Why It Matters

- Many questions are naturally two-step: "employees earning above the average", "customers whose total spend exceeds X", "the second-highest salary". Subqueries express the first step inline.
- Interviewers expect you to name the kinds of subqueries, know where each may appear, and know when a join, CTE or window function is a better fit.

## Core Concept

### Kinds by what the subquery returns

| Kind | Returns | Used with | Example |
|------|---------|-----------|---------|
| **Scalar** | Exactly one column, at most one row | Anywhere a single value fits: `=`, `>`, `SELECT` list, `SET` | `(SELECT max(salary) FROM employees)` |
| **Single-row** | One row (one or more columns) | `=`, `<`, `>` (with a row constructor for several columns) | `(SELECT dept_id FROM departments WHERE dept_name = 'HR')` |
| **Multi-row** | One column, many rows | `IN`, `NOT IN`, `ANY`/`SOME`, `ALL`, `EXISTS` | `(SELECT dept_id FROM departments WHERE location = 'Chennai')` |
| **Multi-column** | Several columns (one or many rows) | Row comparisons `(a, b) IN (…)`, `FROM` | `(dept_id, salary) IN (SELECT dept_id, max(salary) …)` |
| **Table (derived table)** | A whole result set | `FROM (subquery) AS alias` | `FROM (SELECT … GROUP BY …) AS t` |

Rules for scalar subqueries:

- **No rows** → the value is `NULL` (no error).
- **More than one row** → run-time error: *more than one row returned by a subquery used as an expression*.

"Single-row" is an Oracle-course term; in PostgreSQL it is simply a subquery that the data guarantees returns one row (because it filters on a unique key or aggregates without `GROUP BY`).

### Kinds by where the subquery appears

| Position | Purpose | Example |
|----------|---------|---------|
| `WHERE` / `HAVING` | Filter using another query's result | `WHERE dept_id IN (SELECT …)` |
| `SELECT` list | Compute a value per output row (must be scalar) | `(SELECT count(*) FROM orders o WHERE o.customer_id = c.customer_id) AS orders` |
| `FROM` | Use a query result as a table (**derived table**) | `FROM (SELECT customer_id, sum(…) AS total …) AS t` |
| DML | Choose rows or values to change | `UPDATE … SET x = (SELECT …)`, `DELETE … WHERE id IN (SELECT …)` |

### Derived tables (subqueries in FROM)

- Let you aggregate first and filter or join the aggregate afterwards — the cure for fan-out (see [Joins](../../joins/sql-join-types/content.md)).
- Aliases: PostgreSQL 16+ allows `FROM (SELECT …)` without an alias; earlier versions (and many other databases) require `AS alias`. Always writing an alias is portable and readable.
- A derived table cannot refer to other tables in the same `FROM` list — unless it is a `LATERAL` subquery.

### Nested subqueries

Subqueries can contain subqueries:

```text
SELECT … WHERE dept_id IN (
    SELECT dept_id FROM departments WHERE location IN (
        SELECT location FROM … ))
```

Readable up to two levels; beyond that, a [CTE](../../ctes/common-table-expressions/content.md) names each step.

### Non-correlated vs correlated

- A **non-correlated** (independent) subquery can run on its own: `(SELECT avg(salary) FROM employees)`. Conceptually it is evaluated once.
- A **correlated** subquery refers to a column of the outer query: `(SELECT avg(salary) FROM employees x WHERE x.dept_id = e.dept_id)`. Conceptually it is evaluated for each outer row — how PostgreSQL actually executes it is covered in [Correlated Subqueries](../correlated-subqueries/content.md).

### Operators for multi-row subqueries

| Operator | TRUE when |
|----------|-----------|
| `x IN (subquery)` | `x` equals some returned value (same as `= ANY`) |
| `x NOT IN (subquery)` | `x` differs from every value **and no value is NULL** |
| `x op ANY (subquery)` / `SOME` | `x op v` is TRUE for at least one value |
| `x op ALL (subquery)` | `x op v` is TRUE for every value (vacuously TRUE for none) |
| `EXISTS (subquery)` | The subquery returns at least one row |

Deep comparison: [IN, EXISTS, ANY and ALL](../exists-in-any-all/content.md).

### Subquery or join?

| Use a subquery when | Use a join when |
|---------------------|-----------------|
| You only filter by the other table (semi-join: "customers who ordered") | You need columns from both tables in the output |
| You compare with an aggregate ("above average") | One-to-one or many-to-one lookups (employee → department name) |
| The two-step logic reads more clearly | The same subquery would be repeated in several places |

PostgreSQL often transforms `IN`/`EXISTS` subqueries into joins internally, so the choice is mainly about correctness and readability; check `EXPLAIN` when performance matters.

## Syntax

```sql
-- Illustrative: subquery positions
SELECT col, (SELECT …) AS scalar_value          -- SELECT list (scalar)
FROM (SELECT …) AS derived                       -- FROM (derived table)
WHERE x = (SELECT …)                             -- scalar comparison
  AND y IN (SELECT …)                            -- multi-row
  AND (a, b) IN (SELECT c, d FROM …)             -- multi-column
  AND EXISTS (SELECT 1 FROM … WHERE …);          -- existence
```

## Examples

### Scalar subquery in WHERE

```sql
SELECT name, salary
FROM employees
WHERE salary > (SELECT avg(salary) FROM employees)
ORDER BY salary DESC;
```

**Output:**

```text
  name  | salary
--------+--------
 Asha   | 150000
 Ravi   |  95000
 Meena  |  95000
 Divya  |  88000
 Farhan |  82000
(5 rows)
```

The company average is 77000.

### Single-row subquery

Employees in the HR department, looked up by name:

```sql
SELECT name
FROM employees
WHERE dept_id = (SELECT dept_id FROM departments WHERE dept_name = 'HR')
ORDER BY emp_id;
```

**Output:**

```text
  name
--------
 Vikram
 Pooja
(2 rows)
```

If the subquery could return several rows, `=` fails:

```sql
SELECT name
FROM employees
WHERE dept_id = (SELECT dept_id FROM departments WHERE location = 'Chennai');
```

**Output:**

```text
ERROR:  more than one row returned by a subquery used as an expression
```

Use `IN` for multi-row results.

### Multi-row subquery with IN

```sql
SELECT name, dept_id
FROM employees
WHERE dept_id IN (SELECT dept_id FROM departments WHERE location = 'Chennai')
ORDER BY emp_id;
```

**Output:**

```text
  name  | dept_id
--------+---------
 Asha   |      10
 Ravi   |      10
 Meena  |      10
 Karan  |      10
 Vikram |      30
 Pooja  |      30
(6 rows)
```

### Multi-column subquery: highest earner per department

```sql
SELECT name, dept_id, salary
FROM employees
WHERE (dept_id, salary) IN (
    SELECT dept_id, max(salary)
    FROM employees
    GROUP BY dept_id
)
ORDER BY dept_id;
```

**Output:**

```text
  name  | dept_id | salary
--------+---------+--------
 Asha   |      10 | 150000
 Divya  |      20 |  88000
 Vikram |      30 |  70000
 Farhan |      40 |  82000
(4 rows)
```

Nisha is missing even though she is the only employee with no department: the subquery returns `(NULL, 45000)`, and `(NULL, 45000) = (NULL, 45000)` is UNKNOWN because `NULL = NULL` is UNKNOWN.

### Scalar subquery in the SELECT list

```sql
SELECT c.name,
       (SELECT count(*) FROM orders o WHERE o.customer_id = c.customer_id) AS order_count,
       (SELECT max(o.order_date) FROM orders o WHERE o.customer_id = c.customer_id) AS last_order
FROM customers c
ORDER BY c.customer_id;
```

**Output:**

```text
  name  | order_count | last_order
--------+-------------+------------
 Anil   |           3 | 2026-03-15
 Bhavna |           2 | 2026-03-01
 Chirag |           1 | 2026-02-14
 Deepa  |           1 | 2026-02-20
 Eshan  |           1 | 2026-03-28
 Fatima |           0 | NULL
(6 rows)
```

These are correlated subqueries. `count(*)` returns 0 for Fatima; `max` returns `NULL`.

### Derived table: aggregate first, then filter

Customers whose delivered revenue exceeds 10000:

```sql
SELECT t.name, t.revenue
FROM (
    SELECT c.name, sum(oi.quantity * oi.unit_price) AS revenue
    FROM customers c
    JOIN orders o       ON o.customer_id = c.customer_id
    JOIN order_items oi ON oi.order_id = o.order_id
    WHERE o.status = 'DELIVERED'
    GROUP BY c.customer_id, c.name
) AS t
WHERE t.revenue > 10000
ORDER BY t.revenue DESC;
```

**Output:**

```text
  name  | revenue
--------+----------
 Anil   | 68500.00
 Bhavna | 17000.00
(2 rows)
```

(`HAVING` would also work here; a derived table becomes necessary when you need to join the aggregate to something else, or apply window functions to it.)

### Derived table to avoid fan-out

Department headcount and total salary next to each department's location — aggregate employees first, then join:

```sql
SELECT d.dept_name, d.location, s.headcount, s.total_salary
FROM departments d
JOIN (
    SELECT dept_id, count(*) AS headcount, sum(salary) AS total_salary
    FROM employees
    GROUP BY dept_id
) AS s ON s.dept_id = d.dept_id
ORDER BY d.dept_id;
```

**Output:**

```text
  dept_name  | location  | headcount | total_salary
-------------+-----------+-----------+--------------
 Engineering | Chennai   |         4 |       412000
 Sales       | Mumbai    |         4 |       263000
 HR          | Chennai   |         2 |       122000
 Finance     | Bengaluru |         1 |        82000
(4 rows)
```

### Nested subquery

Customers who bought anything from the Furniture category:

```sql
SELECT name
FROM customers
WHERE customer_id IN (
    SELECT customer_id FROM orders
    WHERE order_id IN (
        SELECT order_id FROM order_items
        WHERE product_id IN (SELECT product_id FROM products WHERE category = 'Furniture')
    )
)
ORDER BY name;
```

**Output:**

```text
  name
--------
 Anil
 Bhavna
 Deepa
(3 rows)
```

Three levels work, but a join or CTE would read better.

### Subquery in UPDATE

Set each order item's price to the current catalogue price for order 106:

```sql
UPDATE order_items oi
SET unit_price = (SELECT p.price FROM products p WHERE p.product_id = oi.product_id)
WHERE oi.order_id = 106
RETURNING oi.order_id, oi.product_id, oi.unit_price;
```

**Output:**

```text
 order_id | product_id | unit_price
----------+------------+------------
      106 |          3 |    1500.00
      106 |          2 |     500.00
(2 rows)
```

## Comparison

### Subquery kinds

| | Scalar | Multi-row | Multi-column | Derived table |
|---|---|---|---|---|
| Shape | 1 × 1 | n × 1 | n × k | n × k (named) |
| Operators | `=`, `<`, `>` … | `IN`, `ANY`, `ALL`, `EXISTS` | `(a, b) IN`, row `=` | Used as a table |
| Empty result | `NULL` | `IN` false, `NOT IN` true, `ALL` true | as multi-row | Empty table |
| Too many rows | Error | Fine | Fine | Fine |

## Common Mistakes

- Using `=` with a subquery that can return several rows.
- `NOT IN (subquery)` when the subquery column is nullable.
- Expecting `(a, b) IN (…)` to match rows containing `NULL`.
- Repeating the same correlated subquery in several columns of the `SELECT` list instead of one join or `LATERAL` subquery.
- Forgetting an alias for a derived table on PostgreSQL 15 and older (required there).
- Joining to a child table and aggregating parent values instead of aggregating in a derived table first.

## Revision

- Subquery = `SELECT` nested in another statement, in parentheses.
- By shape: scalar (1 value; 0 rows → `NULL`, >1 row → error), single-row, multi-row, multi-column, derived table.
- By position: `WHERE`/`HAVING`, `SELECT` list (scalar only), `FROM` (derived table; alias optional only from PostgreSQL 16), DML.
- Multi-row operators: `IN`, `NOT IN`, `ANY`, `ALL`, `EXISTS`.
- Non-correlated: independent; correlated: references the outer row.
- Derived tables aggregate first → no fan-out.

## Quick Revision

Scalar subqueries give one value (0 rows = NULL, 2+ rows = error); multi-row ones go with IN/ANY/ALL/EXISTS; subqueries in FROM are derived tables — aggregate first, then join.
