# Set Operations: UNION, INTERSECT, EXCEPT

**Module:** Set Operations · **Interview priority:** Frequently asked

## What Is It?

**Set operations** combine the results of two queries **vertically** (rows of one result followed by, matched with, or removed from the rows of another), whereas joins combine tables **horizontally** (columns side by side).

| Operator | Result | Duplicates |
|----------|--------|------------|
| `A UNION B` | Rows in A or B | Removed |
| `A UNION ALL B` | All rows of A, then all rows of B | Kept |
| `A INTERSECT B` | Rows in both A and B | Removed |
| `A INTERSECT ALL B` | Rows in both, each as many times as the smaller count | Kept (min count) |
| `A EXCEPT B` | Rows in A that are not in B | Removed |
| `A EXCEPT ALL B` | Rows of A minus one occurrence per matching row in B | Kept (count difference) |

Oracle calls `EXCEPT` **`MINUS`**; PostgreSQL uses the standard `EXCEPT`.

## Why It Matters

- "UNION vs UNION ALL" is one of the most common SQL interview questions; the answer involves both correctness (duplicates) and performance (the duplicate-removal step).
- Combining data from similar tables (current + archive), comparing two lists, and finding differences between datasets are everyday tasks.
- Set operations compare `NULL`s as equal, unlike `=`, which makes `EXCEPT` behave differently from `NOT IN`.

## Core Concept

### Rules

1. Both queries must return the **same number of columns**.
2. Columns are matched **by position**, not by name; each pair must have compatible types (PostgreSQL resolves them like `CASE` branches — e.g. `integer` and `numeric` become `numeric`; `integer` and `text` is an error).
3. Output column **names come from the first query**.
4. `ORDER BY` and `LIMIT` at the end apply to the **combined** result. To sort or limit one branch, put it in parentheses.
5. Precedence: `INTERSECT` binds tighter than `UNION` and `EXCEPT`, which are evaluated left to right. Use parentheses to make intent explicit.

### Duplicates and NULLs

- `UNION`, `INTERSECT` and `EXCEPT` treat rows as duplicates when all columns are **not distinct** — so two `NULL`s count as equal here (the same as `DISTINCT` and `GROUP BY`, unlike `=`).
- Duplicate removal applies to the **whole result**, including duplicates within one branch: `SELECT 1 UNION SELECT 1 UNION SELECT 1` returns one row.

### UNION vs UNION ALL performance

`UNION` must remove duplicates: PostgreSQL appends both inputs and then runs a **HashAggregate** or **Sort + Unique** over all rows. `UNION ALL` is a plain **Append** that streams rows with no extra work. When duplicates are impossible (different partitions, disjoint filters) or acceptable, use `UNION ALL`.

### EXCEPT vs NOT EXISTS vs NOT IN

| | `EXCEPT` | `NOT EXISTS` | `NOT IN` |
|---|---|---|---|
| Compares | Whole rows (all selected columns) | Any condition | One value (or row) |
| `NULL`s | Treated as equal | No issue | Breaks with a `NULL` in the list |
| Duplicates in result | Removed (unless `ALL`) | Kept | Kept |
| Can return columns not compared | No | Yes | Yes |

### Set operations vs joins

```text
UNION:      A rows      JOIN:   A cols | B cols
            ─────               ───────┼───────
            B rows              matched side by side
```

## Syntax

```sql
-- Illustrative
query1 { UNION | INTERSECT | EXCEPT } [ALL | DISTINCT] query2
[ORDER BY …] [LIMIT …];

(SELECT … ORDER BY … LIMIT 3)     -- per-branch ordering needs parentheses
UNION ALL
(SELECT … ORDER BY … LIMIT 3);
```

## Examples

### UNION vs UNION ALL

Cities of customers and departments:

```sql
SELECT city FROM customers WHERE city IS NOT NULL
UNION
SELECT location FROM departments WHERE location IS NOT NULL
ORDER BY city;
```

**Output:**

```text
   city
-----------
 Bengaluru
 Chennai
 Delhi
 Mumbai
 Pune
(5 rows)
```

```sql
SELECT city FROM customers WHERE city IS NOT NULL
UNION ALL
SELECT location FROM departments WHERE location IS NOT NULL
ORDER BY city;
```

**Output:**

```text
   city
-----------
 Bengaluru
 Chennai
 Chennai
 Chennai
 Chennai
 Delhi
 Mumbai
 Mumbai
 Pune
(9 rows)
```

`UNION` removed every repeat — across branches (Chennai and Mumbai appear in both) and within one branch (two customers live in Chennai). The column is named `city` — from the first query — and `ORDER BY city` refers to that name.

### INTERSECT and EXCEPT

Cities that have both customers and a department, and customer cities without a department:

```sql
SELECT city FROM customers
INTERSECT
SELECT location FROM departments
ORDER BY 1;
```

**Output:**

```text
  city
---------
 Chennai
 Mumbai
 NULL
(3 rows)
```

The `NULL` row is not a mistake: Eshan has no city and Research has no location, and set operations treat the two `NULL`s as equal (next example).

```sql
SELECT city FROM customers
EXCEPT
SELECT location FROM departments
ORDER BY 1;
```

**Output:**

```text
 city
-------
 Delhi
 Pune
(2 rows)
```

### NULLs are equal in set operations

Eshan's city and Research's location are both `NULL`:

```sql
SELECT city FROM customers WHERE city IS NULL
INTERSECT
SELECT location FROM departments WHERE location IS NULL;
```

**Output:**

```text
 city
------
 NULL
(1 row)
```

One row containing `NULL`: `INTERSECT` matched the two `NULL`s. A join `ON c.city = d.location` would never match them.

### ALL variants count duplicates

```sql
SELECT x FROM (VALUES (1), (1), (1), (2)) AS a(x)
EXCEPT ALL
SELECT x FROM (VALUES (1), (2), (2)) AS b(x);
```

**Output:**

```text
 x
---
 1
 1
(2 rows)
```

Three 1s minus one 1 leaves two; one 2 minus two 2s leaves none.

### Column count and type rules

```sql
SELECT name, salary FROM employees
UNION
SELECT name FROM customers;
```

**Output:**

```text
ERROR:  each UNION query must have the same number of columns
LINE 3: SELECT name FROM customers;
               ^
```

```sql
SELECT emp_id FROM employees
UNION
SELECT name FROM customers;
```

**Output:**

```text
ERROR:  UNION types integer and text cannot be matched
LINE 3: SELECT name FROM customers;
               ^
```

Integer and numeric combine to numeric:

```sql
SELECT pg_typeof(v) AS type, v
FROM (SELECT 1 AS v UNION ALL SELECT 2.5) AS t;
```

**Output:**

```text
  type   |  v
---------+-----
 numeric |   1
 numeric | 2.5
(2 rows)
```

### Combining different sources with a label

A contact list of employees and customers:

```sql
SELECT 'employee' AS kind, name, email FROM employees WHERE email LIKE 'a%'
UNION ALL
SELECT 'customer', name, email FROM customers WHERE email LIKE 'a%'
ORDER BY kind, name;
```

**Output:**

```text
   kind   | name  |     email
----------+-------+----------------
 customer | Anil  | anil@mail.com
 employee | Arjun | arjun@corp.com
 employee | Asha  | asha@corp.com
(3 rows)
```

A literal column distinguishes the sources; with it, duplicates across sources are impossible, so `UNION ALL` is the right choice.

### Precedence

```sql
SELECT 1 AS n UNION SELECT 2 INTERSECT SELECT 3;
```

**Output:**

```text
 n
---
 1
(1 row)
```

`INTERSECT` runs first: `SELECT 2 INTERSECT SELECT 3` is empty, so the result is `1 UNION (nothing)` = 1. Read left to right, `(1 UNION 2) INTERSECT 3` would be empty. Use parentheses to say which you mean.

### Per-branch LIMIT

Top two earners of Engineering and of Sales in one result:

```sql
(SELECT dept_id, name, salary FROM employees WHERE dept_id = 10 ORDER BY salary DESC, emp_id LIMIT 2)
UNION ALL
(SELECT dept_id, name, salary FROM employees WHERE dept_id = 20 ORDER BY salary DESC, emp_id LIMIT 2)
ORDER BY dept_id, salary DESC;
```

**Output:**

```text
 dept_id | name  | salary
---------+-------+--------
      10 | Asha  | 150000
      10 | Ravi  |  95000
      20 | Divya |  88000
      20 | Arjun |  60000
(4 rows)
```

Without parentheses, the first `ORDER BY … LIMIT` would be a syntax error, and a single `LIMIT` at the end applies to the whole union.

### The plan difference

```sql
EXPLAIN (COSTS OFF)
SELECT city FROM customers UNION SELECT location FROM departments;
```

**Output:**

```text
             QUERY PLAN
-------------------------------------
 HashAggregate
   Group Key: customers.city
   ->  Append
         ->  Seq Scan on customers
         ->  Seq Scan on departments
(5 rows)
```

```sql
EXPLAIN (COSTS OFF)
SELECT city FROM customers UNION ALL SELECT location FROM departments;
```

**Output:**

```text
          QUERY PLAN
-------------------------------
 Append
   ->  Seq Scan on customers
   ->  Seq Scan on departments
(3 rows)
```

`UNION` adds a `HashAggregate` over the appended rows to remove duplicates; `UNION ALL` is just `Append`.

### Comparing two tables for differences

Rows in a staging copy that differ from the live table, in both directions:

**Schema and data:**

```sql
CREATE TABLE products_staging AS SELECT * FROM products;
UPDATE products_staging SET price = 520.00 WHERE product_id = 2;
DELETE FROM products_staging WHERE product_id = 6;
```

```sql
(SELECT 'only in live' AS side, * FROM (SELECT * FROM products EXCEPT SELECT * FROM products_staging) AS a)
UNION ALL
(SELECT 'only in staging', * FROM (SELECT * FROM products_staging EXCEPT SELECT * FROM products) AS b)
ORDER BY product_id, side;
```

**Output:**

```text
      side       | product_id |   name   |  category   | price
-----------------+------------+----------+-------------+--------
 only in live    |          2 | Mouse    | Electronics | 500.00
 only in staging |          2 | Mouse    | Electronics | 520.00
 only in live    |          6 | Notebook | Stationery  |  50.00
(3 rows)
```

A changed row appears on both sides (old and new version); a missing row on one side.

## Comparison

### UNION vs UNION ALL

| | `UNION` | `UNION ALL` |
|---|---|---|
| Duplicates | Removed (across and within branches) | Kept |
| Extra work | Hash or sort over all rows | None (Append) |
| Use when | Duplicates are possible and unwanted | Branches are disjoint, or duplicates are meaningful |

### Set operations vs joins

| | Set operations | Joins |
|---|---|---|
| Combine | Rows (vertically) | Columns (horizontally) |
| Requirement | Same column count, compatible types | A join condition |
| Matching | Whole rows, NULLs equal | Condition, NULLs never equal with `=` |

## Common Mistakes

- Using `UNION` where `UNION ALL` is correct, paying for a sort/hash and silently losing legitimate duplicate rows (two identical payments).
- Expecting columns to be matched by name — they are matched by position.
- Putting `ORDER BY` in the first branch without parentheses.
- Forgetting that `INTERSECT` binds tighter than `UNION`.
- Using `EXCEPT` when you need extra columns from the left side — use `NOT EXISTS`.
- Assuming `EXCEPT` and `NOT IN` give the same answer when `NULL`s are present.

## Revision

- `UNION` (dedup), `UNION ALL` (keep all, fastest), `INTERSECT` (both), `EXCEPT` (left minus right); `ALL` variants count duplicates.
- Same column count, positional matching, compatible types, names from the first query.
- Final `ORDER BY`/`LIMIT` apply to the whole result; parentheses for per-branch ones.
- `INTERSECT` before `UNION`/`EXCEPT`; otherwise left to right.
- Set operations treat `NULL`s as equal; `=` does not.

## Quick Revision

UNION removes duplicates with an extra hash or sort, UNION ALL just appends; INTERSECT keeps common rows and EXCEPT subtracts. Columns match by position, names come from the first query, NULLs count as equal, and INTERSECT binds first.
