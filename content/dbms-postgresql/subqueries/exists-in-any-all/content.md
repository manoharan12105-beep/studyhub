# IN, EXISTS, ANY and ALL

**Module:** Subqueries · **Interview priority:** Frequently asked

## What Is It?

Four operators connect a value or a row to the result of a multi-row subquery:

| Operator | Question it answers |
|----------|---------------------|
| `x IN (subquery)` | Is `x` equal to one of the returned values? |
| `EXISTS (subquery)` | Does the subquery return at least one row? |
| `x op ANY (subquery)` | Is `x op v` true for at least one returned value `v`? (`SOME` is a synonym) |
| `x op ALL (subquery)` | Is `x op v` true for every returned value `v`? |

`op` is any comparison: `=`, `<>`, `<`, `<=`, `>`, `>=`.

## Why It Matters

- "IN vs EXISTS" and "NOT IN vs NOT EXISTS" are among the most asked SQL interview questions. The expected answer covers semantics (NULLs), duplicates and performance — and the performance part is often answered with outdated folklore.
- `ANY`/`ALL` look simple but hide two traps: the empty subquery and NULLs.
- In backend code, `= ANY(array)` is how a list of ids is passed as one parameter.

## Core Concept

### IN

- `x IN (subquery)` is exactly `x = ANY (subquery)`.
- It is a **semi-join**: each outer row appears at most once, however many inner rows match. A join to the same table would repeat the outer row per match.
- With a literal list, `x IN (1, 2, 3)` means `x = 1 OR x = 2 OR x = 3`.

### EXISTS

- `EXISTS (subquery)` is TRUE if the subquery returns any row, FALSE otherwise. **It is never UNKNOWN**: it looks only at whether rows exist, not at their values.
- The select list inside is ignored: `SELECT 1`, `SELECT *` and `SELECT NULL` behave identically. `SELECT 1` is the convention.
- It is almost always correlated: `EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id)`.

### IN vs EXISTS

| | `IN` | `EXISTS` |
|---|---|---|
| Tests | Value membership | Row existence |
| Subquery returns | One column (or a row for `(a, b) IN`) | Anything; columns ignored |
| Usually | Non-correlated | Correlated |
| NULL in subquery | Can make the result UNKNOWN, but a found match is still TRUE | Irrelevant |
| Duplicates outer rows | No | No |
| PostgreSQL plan | Semi-join | Semi-join |

For positive tests, they are interchangeable in PostgreSQL: both are pulled up into a semi-join and usually get the **same plan**. The old rule "EXISTS is faster for big subqueries, IN for small ones" comes from older optimizers that executed `IN` by materializing a list; it is not a PostgreSQL rule. Choose by readability, and by correctness for the negative forms.

### NOT IN vs NOT EXISTS

The negative forms are **not** interchangeable:

| | `NOT IN (subquery)` | `NOT EXISTS (correlated)` | `LEFT JOIN … WHERE right.key IS NULL` |
|---|---|---|---|
| Subquery column contains NULL | Returns **no rows** (every test is FALSE or UNKNOWN) | Correct | Correct |
| Outer value is NULL | Row dropped (UNKNOWN) | Kept if no match | Kept |
| PostgreSQL plan | Hashed SubPlan; a plain per-row SubPlan if the hash would not fit in `work_mem` | Anti-join | Anti-join |

Use `NOT EXISTS` (or the `LEFT JOIN … IS NULL` anti-join) for "rows with no match". Step-by-step NULL analysis: [NULL in Joins and Subqueries](../../null-and-conditional-logic/null-in-joins-and-subqueries/content.md).

Why can't `NOT IN` become an anti-join? Because an anti-join answers "no matching row", while `NOT IN` must answer UNKNOWN when the list contains a NULL. The transformation would be valid only when neither side can be NULL. PostgreSQL 18 does not perform it even then: in the sample database `customers.customer_id` is a primary key and `orders.customer_id` is `NOT NULL`, yet `customer_id NOT IN (SELECT customer_id FROM orders)` is still planned as a hashed SubPlan.

### ANY and ALL

| Expression | Equivalent (non-empty subquery, no NULLs) |
|------------|-------------------------------------------|
| `x = ANY (s)` | `x IN (s)` |
| `x <> ALL (s)` | `x NOT IN (s)` |
| `x > ANY (s)` | `x > min(s)` |
| `x > ALL (s)` | `x > max(s)` |
| `x < ANY (s)` | `x < max(s)` |
| `x < ALL (s)` | `x < min(s)` |
| `x <> ANY (s)` | some value differs from `x` — not "not in"! |

Empty subquery:

- `ANY` over no rows is **FALSE** (there is no value that satisfies it).
- `ALL` over no rows is **TRUE** (vacuous truth: no value violates it).

So `salary > ALL (salaries of an empty department)` is TRUE for everyone, while `salary > (SELECT max(salary) …)` is `NULL` for everyone. The two "equivalents" differ exactly on empty sets and NULLs.

NULLs: if no value makes `ANY` TRUE and some comparison is UNKNOWN, `ANY` is UNKNOWN; if no value makes `ALL` FALSE and some comparison is UNKNOWN, `ALL` is UNKNOWN.

### ANY with arrays (PostgreSQL)

PostgreSQL also accepts an **array** on the right: `x = ANY (ARRAY[1, 2, 3])` or `x = ANY ('{1,2,3}'::int[])`. A backend can pass a whole id list as one bind parameter (`WHERE id = ANY (?)`) instead of building `IN (?, ?, ?, …)` strings of varying length. `x <> ALL (array)` is the negative form, with the same NULL caveat as `NOT IN`.

## Syntax

```sql
-- Illustrative
WHERE x IN (SELECT col FROM t)
WHERE x NOT IN (SELECT col FROM t WHERE col IS NOT NULL)
WHERE EXISTS (SELECT 1 FROM t WHERE t.key = outer.key)
WHERE NOT EXISTS (SELECT 1 FROM t WHERE t.key = outer.key)
WHERE x > ANY (SELECT col FROM t)
WHERE x > ALL (SELECT col FROM t)
WHERE x = ANY (ARRAY[1, 2, 3])
```

## Examples

### IN and EXISTS give the same rows

```sql
SELECT name
FROM customers
WHERE customer_id IN (SELECT customer_id FROM orders)
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
(5 rows)
```

```sql
SELECT c.name
FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id)
ORDER BY c.customer_id;
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
(5 rows)
```

A join returns Anil three times and Bhavna twice, because the join is one row per match:

```sql
SELECT c.name
FROM customers c
JOIN orders o ON o.customer_id = c.customer_id
ORDER BY c.customer_id;
```

**Output:**

```text
  name
--------
 Anil
 Anil
 Anil
 Bhavna
 Bhavna
 Chirag
 Deepa
 Eshan
(8 rows)
```

### Same plan for IN and EXISTS

```sql
ANALYZE;

EXPLAIN (COSTS OFF)
SELECT c.name FROM customers c
WHERE c.customer_id IN (SELECT o.customer_id FROM orders o);
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

The `EXISTS` form produces this identical plan (shown in [Correlated Subqueries](../correlated-subqueries/content.md)).

### EXISTS ignores the select list

```sql
SELECT c.name
FROM customers c
WHERE EXISTS (SELECT NULL FROM orders o WHERE o.customer_id = c.customer_id AND o.status = 'PLACED');
```

**Output:**

```text
  name
--------
 Bhavna
(1 row)
```

The subquery returns a row containing `NULL`, and that still counts as a row.

### NOT IN with a nullable column: who is not a manager?

`manager_id` is `NULL` for Asha, the root of the hierarchy:

```sql
SELECT emp_id, name
FROM employees
WHERE emp_id NOT IN (SELECT manager_id FROM employees);
```

**Output:**

```text
 emp_id | name
--------+------
(0 rows)
```

Zero rows — the list `(NULL, 1, 2, 2, 1, 5, 5, 1, 8, 1, 1, 5)` contains a `NULL`, so every `NOT IN` test ends UNKNOWN. `NOT EXISTS` answers the question:

```sql
SELECT e.emp_id, e.name
FROM employees e
WHERE NOT EXISTS (SELECT 1 FROM employees r WHERE r.manager_id = e.emp_id)
ORDER BY e.emp_id;
```

**Output:**

```text
 emp_id |  name
--------+--------
      3 | Meena
      4 | Karan
      6 | Arjun
      7 | Sneha
      9 | Pooja
     10 | Farhan
     11 | Nisha
     12 | Rahul
(8 rows)
```

### NOT IN can also be slow

Plans for "customers without orders" on a larger generated dataset, with `work_mem` deliberately tiny:

```sql
CREATE TABLE big_orders AS
    SELECT g AS order_id, (g % 50000) + 1 AS customer_id
    FROM generate_series(1, 200000) AS g;
CREATE TABLE big_customers AS
    SELECT g AS customer_id FROM generate_series(1, 60000) AS g;
ANALYZE big_orders, big_customers;
SET work_mem = '64kB';

EXPLAIN (COSTS OFF)
SELECT count(*) FROM big_customers c
WHERE c.customer_id NOT IN (SELECT o.customer_id FROM big_orders o);
```

**Output:**

```text
                          QUERY PLAN
--------------------------------------------------------------
 Aggregate
   ->  Seq Scan on big_customers c
         Filter: (NOT (ANY (customer_id = (SubPlan 1).col1)))
         SubPlan 1
           ->  Materialize
                 ->  Seq Scan on big_orders o
(6 rows)
```

The subquery result does not fit in a hash table within `work_mem`, so `SubPlan 1` is not hashed: for every customer, the materialized list of 200,000 ids is scanned — O(n × m). With the default `work_mem` (4MB) it would be `hashed SubPlan 1`. `NOT EXISTS` is an anti-join regardless:

```sql
SET work_mem = '64kB';

EXPLAIN (COSTS OFF)
SELECT count(*) FROM big_customers c
WHERE NOT EXISTS (SELECT 1 FROM big_orders o WHERE o.customer_id = c.customer_id);
```

**Output:**

```text
                     QUERY PLAN
----------------------------------------------------
 Aggregate
   ->  Hash Anti Join
         Hash Cond: (c.customer_id = o.customer_id)
         ->  Seq Scan on big_customers c
         ->  Hash
               ->  Seq Scan on big_orders o
(6 rows)
```

### ANY and ALL against Sales salaries

Sales salaries are 88000, 60000, 60000 and 55000.

More than **every** Sales employee (`> ALL` ⇔ `> 88000`):

```sql
SELECT name, salary
FROM employees
WHERE salary > ALL (SELECT salary FROM employees WHERE dept_id = 20)
ORDER BY emp_id;
```

**Output:**

```text
 name  | salary
-------+--------
 Asha  | 150000
 Ravi  |  95000
 Meena |  95000
(3 rows)
```

More than **at least one** Sales employee (`> ANY` ⇔ `> 55000`), excluding Sales itself:

```sql
SELECT name, salary
FROM employees
WHERE salary > ANY (SELECT salary FROM employees WHERE dept_id = 20)
  AND dept_id <> 20
ORDER BY emp_id;
```

**Output:**

```text
  name  | salary
--------+--------
 Asha   | 150000
 Ravi   |  95000
 Meena  |  95000
 Karan  |  72000
 Vikram |  70000
 Farhan |  82000
(6 rows)
```

Nisha is excluded by `dept_id <> 20` (`NULL <> 20` is UNKNOWN) as well as by her salary.

### The empty-subquery trap

Research (dept 50) has no employees. "Who earns more than everyone in Research?":

```sql
SELECT count(*) AS rows_returned
FROM employees
WHERE salary > ALL (SELECT salary FROM employees WHERE dept_id = 50);
```

**Output:**

```text
 rows_returned
---------------
            12
(1 row)
```

All 12 — `ALL` over an empty set is TRUE. The `max` version returns nobody, because `max` of nothing is `NULL`:

```sql
SELECT count(*) AS rows_returned
FROM employees
WHERE salary > (SELECT max(salary) FROM employees WHERE dept_id = 50);
```

**Output:**

```text
 rows_returned
---------------
             0
(1 row)
```

Neither is "wrong", but they answer different questions; decide what an empty group should mean.

### Truth table at a glance

```sql
SELECT 5 IN (1, NULL)                                           AS in_null,
       5 NOT IN (1, NULL)                                       AS not_in_null,
       1 IN (1, NULL)                                           AS in_found,
       5 > ALL (SELECT x FROM (VALUES (1), (NULL)) AS v(x))     AS all_null,
       5 > ANY (SELECT x FROM (VALUES (1), (NULL)) AS v(x))     AS any_found,
       5 > ALL (SELECT 1 WHERE false)                           AS all_empty,
       5 > ANY (SELECT 1 WHERE false)                           AS any_empty,
       EXISTS (SELECT NULL)                                     AS exists_null_row;
```

**Output:**

```text
 in_null | not_in_null | in_found | all_null | any_found | all_empty | any_empty | exists_null_row
---------+-------------+----------+----------+-----------+-----------+-----------+-----------------
 NULL    | NULL        | t        | NULL     | t         | t         | f         | t
(1 row)
```

### ANY with an array parameter

```sql
SELECT order_id, status
FROM orders
WHERE order_id = ANY ('{101,104,108}'::int[])
ORDER BY order_id;
```

**Output:**

```text
 order_id |  status
----------+-----------
      101 | DELIVERED
      104 | CANCELLED
      108 | DELIVERED
(3 rows)
```

From Java with JDBC, the array is one parameter:

```java
// Illustrative fragment: connection is an open java.sql.Connection
try (PreparedStatement ps = connection.prepareStatement(
        "SELECT order_id, status FROM orders WHERE order_id = ANY (?) ORDER BY order_id")) {
    ps.setArray(1, connection.createArrayOf("integer", new Integer[] {101, 104, 108}));
    try (ResultSet rs = ps.executeQuery()) {
        while (rs.next()) {
            System.out.println(rs.getInt("order_id") + " " + rs.getString("status"));
        }
    }
}
```

## Comparison

### Choosing an operator

| Need | Use |
|------|-----|
| Rows that have a match | `EXISTS` or `IN` (same plan in PostgreSQL) |
| Rows that have no match | `NOT EXISTS` or `LEFT JOIN … IS NULL` — not `NOT IN` on a nullable column |
| Compare with every / some value | `ALL` / `ANY` — or `max`/`min`, if the empty-set and NULL behaviour you want is the aggregate's |
| A list of ids from application code | `= ANY (?)` with an array parameter |
| Columns from the other table in the output | A join, not a subquery |

## Common Mistakes

- `NOT IN (subquery)` when the subquery column is nullable — returns nothing.
- Believing `EXISTS` is always faster than `IN` (or the reverse). In PostgreSQL, the positive forms usually share a plan.
- Thinking `x <> ANY (s)` means "x is not in s". It means "x differs from at least one value" — almost always TRUE. "Not in" is `<> ALL`.
- Forgetting that `ALL` over an empty subquery is TRUE.
- Replacing `EXISTS` with a join and getting duplicate outer rows.
- Writing `count(*) > 0` in a correlated subquery instead of `EXISTS` — `count` must read every match; `EXISTS` stops at the first.

## Revision

- `IN` = `= ANY`; `NOT IN` = `<> ALL`.
- `EXISTS` is TRUE/FALSE only, ignores the select list, is usually correlated.
- `IN` and `EXISTS`: semi-joins, no duplicate outer rows, same plan in PostgreSQL.
- `NOT IN` + any NULL in the list → no rows; plan is a (hashed) SubPlan, per-row if over `work_mem`. `NOT EXISTS` → anti-join, NULL-safe.
- `> ANY` ≈ `> min`, `> ALL` ≈ `> max` — except on empty sets (ANY FALSE, ALL TRUE) and NULLs.
- PostgreSQL: `= ANY (array)` for id lists from code.

## Quick Revision

IN and EXISTS are the same semi-join in PostgreSQL; NOT IN breaks on NULLs and may run per row, so use NOT EXISTS. ANY over nothing is FALSE, ALL over nothing is TRUE.
