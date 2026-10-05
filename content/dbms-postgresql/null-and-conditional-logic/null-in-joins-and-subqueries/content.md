# NULL in Joins and Subqueries (the NOT IN Trap)

**Module:** NULL and Conditional Logic · **Interview priority:** Core

## What Is It?

How `NULL` behaves when tables are combined:

- In **joins**, a `NULL` key never matches anything, and outer joins *create* `NULL`s for rows without a match.
- In **subqueries**, `NULL`s returned by the subquery change the result of `IN`, `NOT IN`, `ANY` and `ALL` — most famously, **`NOT IN` returns no rows if the subquery returns a single `NULL`**.

Prerequisite: [NULL and Three-Valued Logic](../null-and-three-valued-logic/content.md).

## Why It Matters

- "Find customers who never ordered" written with `NOT IN` is correct on test data and silently returns nothing in production the day a `NULL` appears. Interviewers ask this constantly.
- Outer-join `NULL`s are easy to misread: is a `NULL` there because the row had no match, or because the matching row really stores `NULL`?

## Core Concept

### NULL keys never match in a join

`ON e.dept_id = d.dept_id` is UNKNOWN when `e.dept_id` is `NULL`, so an inner join drops that row. In the sample data Nisha (no department) disappears from `employees JOIN departments`.

Two `NULL` keys do not match each other either: `NULL = NULL` is UNKNOWN. To join "NULL with NULL" deliberately, use `ON a.k IS NOT DISTINCT FROM b.k` (note: this condition cannot use a hash or merge join efficiently).

### Outer joins produce NULLs

`LEFT JOIN` keeps every left row; when there is no match, the right-side columns are filled with `NULL`. `RIGHT JOIN` does the reverse, `FULL JOIN` both ways.

```text
employees LEFT JOIN departments
name   dept_id  dept_name
Asha   10       Engineering
Nisha  NULL     NULL         ← no match: right side padded with NULL
```

### Two kinds of NULL in an outer join result

| Cause | How to detect |
|-------|---------------|
| No matching row on the other side | The other side's **primary key** (or any `NOT NULL` column) is `NULL` |
| Matching row exists but stores `NULL` | The other side's key is not `NULL`, the column is |

Example: `departments LEFT JOIN employees` — Research has no employees, so `e.emp_id IS NULL`; Engineering matches Karan, whose `email` is `NULL` but `emp_id` is 4.

To find unmatched rows (an **anti-join**), test a column that cannot be `NULL` in a real match: `WHERE e.emp_id IS NULL`.

### Filtering the outer side in WHERE turns LEFT into INNER

`WHERE d.location = 'Chennai'` after a `LEFT JOIN departments d` removes the padded rows (their `d.location` is `NULL` → UNKNOWN). Put conditions on the optional side in the `ON` clause instead. Full treatment: [ON vs USING vs WHERE in Joins](../../joins/join-conditions-on-using-where/content.md).

### Aggregates over outer joins

`count(*)` counts the padded row, so a department with no employees shows 1. Count a column from the optional side — `count(e.emp_id)` — to get 0.

### IN with a subquery

`x IN (SELECT y …)` is TRUE if some `y = x`; otherwise it is UNKNOWN if any `y` is `NULL`, and FALSE only if no `y` is `NULL`. In a `WHERE` clause UNKNOWN and FALSE both reject the row, so `IN` behaves intuitively — the `NULL` only bites when the result is negated.

### The NOT IN trap

```text
x NOT IN (SELECT y …)   ≡   x <> y1 AND x <> y2 AND … AND x <> yn
```

If any `yi` is `NULL`, that term is UNKNOWN, so the whole condition can never be TRUE: **no rows are returned**.

| Subquery returns | `5 NOT IN (…)` | Row kept? |
|------------------|----------------|-----------|
| `(1, 2)` | TRUE | Yes |
| `(1, 5)` | FALSE | No |
| `(1, NULL)` | UNKNOWN | **No** |
| `(NULL)` | UNKNOWN | **No** |
| empty set | TRUE | Yes |

Also: if `x` itself is `NULL`, `x NOT IN (non-empty set)` is UNKNOWN, so rows with a `NULL` key are never returned either.

### NOT EXISTS does not have the trap

`NOT EXISTS (SELECT 1 FROM t WHERE t.y = x)` asks "is there **no row** where the condition is TRUE?". Rows where `t.y` is `NULL` make the inner condition UNKNOWN, which simply means "not a match" — they do not poison the result. `EXISTS` returns only TRUE or FALSE, never UNKNOWN.

| | `NOT IN (subquery)` | `NOT EXISTS (correlated subquery)` |
|---|---|---|
| Subquery contains `NULL` | Returns **no rows** | Correct result |
| Outer value is `NULL` | Row excluded | Row included (nothing matches it) |
| Result can be UNKNOWN | Yes | No |
| PostgreSQL plan | Often a hashed subplan; cannot use an anti-join because of NULL semantics | Hash/merge **anti-join** |
| Recommendation | Only with lists/subqueries guaranteed non-NULL | Default choice for "not in another table" |

A third option is the `LEFT JOIN … WHERE right.key IS NULL` anti-join, which behaves like `NOT EXISTS`.

### ANY and ALL with NULL

- `x > ANY (subquery)` — TRUE if `x` is greater than at least one value. NULLs only matter when no value makes it TRUE.
- `x > ALL (subquery)` — TRUE only if `x` is greater than every value. **One `NULL` makes it UNKNOWN unless some value already makes it FALSE.**
- `x > ALL (empty set)` is TRUE; `x > ANY (empty set)` is FALSE.
- `NOT IN` is exactly `<> ALL`; `IN` is `= ANY`.

### Scalar subqueries that find nothing

A scalar subquery that returns **no rows** yields `NULL`, not an error: `(SELECT salary FROM employees WHERE emp_id = 999)` is `NULL`. Comparisons with it are then UNKNOWN. A scalar subquery returning **more than one** row is an error.

## Examples

### The inner join loses NULL keys

```sql
SELECT (SELECT count(*) FROM employees) AS employees_total,
       (SELECT count(*) FROM employees e JOIN departments d ON d.dept_id = e.dept_id) AS after_inner_join;
```

**Output:**

```text
 employees_total | after_inner_join
-----------------+------------------
              12 |               11
(1 row)
```

```sql
SELECT e.name, e.dept_id, d.dept_name
FROM employees e
LEFT JOIN departments d ON d.dept_id = e.dept_id
WHERE d.dept_id IS NULL;
```

**Output:**

```text
 name  | dept_id | dept_name
-------+---------+-----------
 Nisha |    NULL | NULL
(1 row)
```

### Unmatched NULL vs stored NULL

```sql
SELECT d.dept_name, e.emp_id, e.name, e.email
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.dept_id
WHERE d.dept_id IN (10, 50)
ORDER BY d.dept_id, e.emp_id;
```

**Output:**

```text
  dept_name  | emp_id | name  |     email
-------------+--------+-------+----------------
 Engineering |      1 | Asha  | asha@corp.com
 Engineering |      2 | Ravi  | ravi@corp.com
 Engineering |      3 | Meena | meena@corp.com
 Engineering |      4 | Karan | NULL
 Research    |   NULL | NULL  | NULL
(5 rows)
```

Research's `NULL`s mean "no employee"; Karan's `NULL` email is a stored value. The tell is `emp_id`.

### count(*) vs count(column) after a LEFT JOIN

```sql
SELECT d.dept_name,
       count(*)        AS count_star_wrong,
       count(e.emp_id) AS employees
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.dept_id
GROUP BY d.dept_id, d.dept_name
ORDER BY d.dept_id;
```

**Output:**

```text
  dept_name  | count_star_wrong | employees
-------------+------------------+-----------
 Engineering |                4 |         4
 Sales       |                4 |         4
 HR          |                2 |         2
 Finance     |                1 |         1
 Research    |                1 |         0
(5 rows)
```

### The NOT IN trap, step by step

"Departments that have no employees" — the subquery `SELECT dept_id FROM employees` contains Nisha's `NULL`:

```sql
SELECT dept_name
FROM departments
WHERE dept_id NOT IN (SELECT dept_id FROM employees);
```

**Output:**

```text
 dept_name
-----------
(0 rows)
```

Zero rows, although Research clearly has no employees. For Research: `50 <> 10 AND 50 <> 20 AND … AND 50 <> NULL` → `TRUE AND … AND UNKNOWN` → UNKNOWN.

Fix 1 — `NOT EXISTS` (recommended):

```sql
SELECT d.dept_name
FROM departments d
WHERE NOT EXISTS (SELECT 1 FROM employees e WHERE e.dept_id = d.dept_id);
```

**Output:**

```text
 dept_name
-----------
 Research
(1 row)
```

Fix 2 — remove `NULL`s from the subquery:

```sql
SELECT dept_name
FROM departments
WHERE dept_id NOT IN (SELECT dept_id FROM employees WHERE dept_id IS NOT NULL);
```

**Output:**

```text
 dept_name
-----------
 Research
(1 row)
```

Fix 3 — anti-join with `LEFT JOIN`:

```sql
SELECT d.dept_name
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.dept_id
WHERE e.emp_id IS NULL;
```

**Output:**

```text
 dept_name
-----------
 Research
(1 row)
```

### The same trap the other way round

"Employees whose department is not in Chennai" with `NOT IN` loses Nisha because her own `dept_id` is `NULL`:

```sql
SELECT name
FROM employees
WHERE dept_id NOT IN (SELECT dept_id FROM departments WHERE location = 'Chennai')
ORDER BY emp_id;
```

**Output:**

```text
  name
--------
 Divya
 Arjun
 Sneha
 Farhan
 Rahul
(5 rows)
```

Whether Nisha belongs in the answer is a business decision — but it should be a decision, not an accident.

### IN still works with NULLs in the subquery

```sql
SELECT dept_name
FROM departments
WHERE dept_id IN (SELECT dept_id FROM employees)
ORDER BY dept_id;
```

**Output:**

```text
  dept_name
-------------
 Engineering
 Sales
 HR
 Finance
(4 rows)
```

### ALL with a NULL

Who earns more than every employee of departments 30 and 40? The subquery has no `NULL`s, so `ALL` works as expected:

```sql
SELECT name, salary
FROM employees
WHERE salary > ALL (SELECT salary FROM employees WHERE dept_id IN (30, 40))
ORDER BY salary DESC;
```

**Output:**

```text
 name  | salary
-------+--------
 Asha  | 150000
 Ravi  |  95000
 Meena |  95000
 Divya |  88000
(4 rows)
```

Now compare salaries with all Sales commissions, which include a `NULL`:

```sql
SELECT count(*) AS rows_returned
FROM employees
WHERE salary > ALL (SELECT commission FROM employees WHERE dept_id = 20);
```

**Output:**

```text
 rows_returned
---------------
             0
(1 row)
```

Sales commissions are 5000, 3000, `NULL` and 0. Every salary exceeds 5000, but `salary > NULL` is UNKNOWN, so `ALL` is never TRUE.

### A scalar subquery that finds nothing

```sql
SELECT name
FROM employees
WHERE salary > (SELECT salary FROM employees WHERE emp_id = 999);
```

**Output:**

```text
 name
------
(0 rows)
```

No error — the subquery is `NULL`, every comparison is UNKNOWN, and no rows qualify.

## Common Mistakes

- `NOT IN (SELECT nullable_column …)` for "not in the other table".
- Testing a nullable column (instead of the key) for `IS NULL` to find unmatched outer-join rows.
- `count(*)` after a `LEFT JOIN` when counting children.
- Filtering the optional side of a `LEFT JOIN` in `WHERE`.
- Expecting `NULL` keys to match each other in a join.
- Using `> ALL (subquery)` on a nullable column.

## Revision

- Inner joins drop rows whose join key is `NULL`; `NULL` never equals `NULL` in `ON`.
- Outer joins pad missing sides with `NULL`; check the other side's key to tell "no match" from "stored NULL".
- `count(child.key)`, not `count(*)`, after a `LEFT JOIN`.
- `x NOT IN (… NULL …)` is never TRUE → zero rows. `NOT EXISTS` and `LEFT JOIN … IS NULL` are NULL-safe.
- `IN` = `= ANY`, `NOT IN` = `<> ALL`; `ALL` with a `NULL` is never TRUE (unless already FALSE); `ALL` on empty set is TRUE.
- Scalar subquery with no rows = `NULL`; more than one row = error.

## Quick Revision

One `NULL` in a `NOT IN` subquery makes it return nothing — use `NOT EXISTS`. In outer joins, test the other table's key for `IS NULL` to find unmatched rows.
