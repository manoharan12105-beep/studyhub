# SELECT, Filtering, Sorting and Pagination

**Module:** SQL Fundamentals · **Interview priority:** Core

## What Is It?

`SELECT` reads data. Its basic clauses:

```sql
-- Illustrative: the basic SELECT skeleton
SELECT [DISTINCT] expressions [AS alias]   -- which columns / computed values
FROM table [alias]                         -- where the rows come from
WHERE condition                            -- which rows to keep
ORDER BY expression [ASC|DESC] [NULLS FIRST|LAST]
LIMIT n OFFSET m;                          -- or: OFFSET m ROWS FETCH FIRST n ROWS ONLY
```

## Why It Matters

- Everything else in SQL — joins, grouping, window functions — builds on these clauses.
- Small details are classic interview traps: `AND`/`OR` precedence, `BETWEEN` inclusiveness, `NULL` sort position, `DISTINCT` on several columns, non-deterministic `LIMIT` without `ORDER BY`, and why `OFFSET` pagination gets slow.

## Core Concept

### Column list, expressions and aliases

- `SELECT *` returns all columns — fine for exploring, avoid in application code (fragile, transfers unused data, prevents index-only scans).
- Any expression can be selected: arithmetic (`salary * 12`), string concatenation (`name || '@'`), function calls, `CASE`.
- `AS alias` names an output column; `AS` is optional but clearer. Quote aliases with spaces or capitals: `AS "Annual Salary"`.
- Table aliases (`FROM employees e`) shorten references and are required for self-joins.
- A column alias can be used in `ORDER BY`, but **not** in `WHERE` or `HAVING`, because those are evaluated before the `SELECT` list ([logical processing order](../../aggregation-and-grouping/logical-query-processing-order/content.md)). PostgreSQL does allow output aliases in `GROUP BY` as an extension.

### WHERE operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `=`, `<>` (or `!=`), `<`, `<=`, `>`, `>=` | Comparison | `salary >= 80000` |
| `AND`, `OR`, `NOT` | Logic | `dept_id = 20 AND salary > 55000` |
| `BETWEEN a AND b` | `>= a AND <= b` (inclusive both ends) | `salary BETWEEN 60000 AND 72000` |
| `IN (…)` | Equal to any listed value | `dept_id IN (10, 30)` |
| `LIKE` / `ILIKE` | Pattern match (`%` any string, `_` one char); `ILIKE` is case-insensitive (PostgreSQL) | `name LIKE 'A%'` |
| `IS NULL`, `IS NOT NULL` | Test for NULL | `email IS NULL` |

**Precedence:** `NOT` binds tighter than `AND`, which binds tighter than `OR`. `a OR b AND c` means `a OR (b AND c)`. Use parentheses whenever you mix them.

### ORDER BY

- Default direction is `ASC`. Several keys: `ORDER BY dept_id, salary DESC`.
- In PostgreSQL, `NULL`s sort as if **larger** than every value: **last** in `ASC`, **first** in `DESC`. Override with `NULLS FIRST` / `NULLS LAST`.
- You can order by an alias, an expression, or a column position (`ORDER BY 2`; avoid it in real code).
- **Without `ORDER BY`, row order is not guaranteed.**

### DISTINCT

`DISTINCT` removes duplicate **result rows** — it applies to the whole select list, not to the first column. `SELECT DISTINCT dept_id, location` returns distinct *pairs*. All `NULL`s count as one value for `DISTINCT`. PostgreSQL also has `DISTINCT ON (…)` — see [DISTINCT ON](../../postgresql-features/distinct-on/content.md).

### LIMIT, OFFSET and FETCH

- `LIMIT n` returns at most `n` rows; `OFFSET m` skips `m` rows first (PostgreSQL/MySQL syntax).
- SQL-standard form: `OFFSET m ROWS FETCH FIRST n ROWS ONLY`. `FETCH FIRST n ROWS WITH TIES` also returns rows tied with the last one (requires `ORDER BY`).
- Without a deterministic `ORDER BY`, *which* rows you get is unpredictable — and pages can overlap or skip rows.
- `OFFSET` still reads and discards the skipped rows: page 10 000 is slow. For deep pagination use **keyset pagination** (`WHERE id > last_seen_id ORDER BY id LIMIT 20`) — see [Query Optimization in Practice](../../query-optimization/query-optimization-practice/content.md).

## Examples

### Expressions and aliases

```sql
SELECT name,
       salary,
       salary * 12                  AS annual_salary,
       name || ' <' || email || '>' AS contact
FROM employees
WHERE dept_id = 10
ORDER BY emp_id;
```

**Output:**

```text
 name  | salary | annual_salary |        contact
-------+--------+---------------+------------------------
 Asha  | 150000 |       1800000 | Asha <asha@corp.com>
 Ravi  |  95000 |       1140000 | Ravi <ravi@corp.com>
 Meena |  95000 |       1140000 | Meena <meena@corp.com>
 Karan |  72000 |        864000 | NULL
(4 rows)
```

Karan's `contact` is `NULL`: concatenating with `NULL` gives `NULL`. (`concat()` skips `NULL`s instead — see [SQL Functions](../sql-functions/content.md).)

### Alias not visible in WHERE

```sql
SELECT name, salary * 12 AS annual_salary
FROM employees
WHERE annual_salary > 1000000;
```

**Output:**

```text
ERROR:  column "annual_salary" does not exist
LINE 3: WHERE annual_salary > 1000000;
              ^
```

Repeat the expression (`WHERE salary * 12 > 1000000`) or wrap the query in a subquery/CTE.

### AND/OR precedence

"Sales employees earning more than 80000, or anyone in HR" — written without parentheses vs with them:

```sql
SELECT name, dept_id, salary
FROM employees
WHERE dept_id = 30 OR dept_id = 20 AND salary > 80000
ORDER BY emp_id;
```

**Output:**

```text
  name  | dept_id | salary
--------+---------+--------
 Divya  |      20 |  88000
 Vikram |      30 |  70000
 Pooja  |      30 |  52000
(3 rows)
```

That matched the intent because `AND` is evaluated first. But "employees of Sales or HR earning more than 60000" needs parentheses:

```sql
SELECT name, dept_id, salary
FROM employees
WHERE (dept_id = 20 OR dept_id = 30) AND salary > 60000
ORDER BY emp_id;
```

**Output:**

```text
  name  | dept_id | salary
--------+---------+--------
 Divya  |      20 |  88000
 Vikram |      30 |  70000
(2 rows)
```

Without the parentheses, `dept_id = 20 OR dept_id = 30 AND salary > 60000` would return every Sales employee regardless of salary.

### BETWEEN, IN and LIKE/ILIKE

```sql
SELECT name, salary
FROM employees
WHERE salary BETWEEN 60000 AND 72000      -- inclusive on both ends
ORDER BY salary, name;
```

**Output:**

```text
  name  | salary
--------+--------
 Arjun  |  60000
 Sneha  |  60000
 Vikram |  70000
 Karan  |  72000
(4 rows)
```

```sql
SELECT name
FROM employees
WHERE name ILIKE 'a%'          -- starts with a or A
   OR name LIKE '_e%'          -- second letter e
ORDER BY name;
```

**Output:**

```text
 name
-------
 Arjun
 Asha
 Meena
(3 rows)
```

### ORDER BY with NULLs

```sql
SELECT name, commission
FROM employees
WHERE dept_id = 20
ORDER BY commission DESC;
```

**Output:**

```text
 name  | commission
-------+------------
 Sneha |       NULL
 Divya |       5000
 Arjun |       3000
 Rahul |          0
(4 rows)
```

`NULL` came first in descending order. To put unknown commissions last:

```sql
SELECT name, commission
FROM employees
WHERE dept_id = 20
ORDER BY commission DESC NULLS LAST, name;
```

**Output:**

```text
 name  | commission
-------+------------
 Divya |       5000
 Arjun |       3000
 Rahul |          0
 Sneha |       NULL
(4 rows)
```

### DISTINCT on one vs two columns

```sql
SELECT DISTINCT location FROM departments ORDER BY location;
```

**Output:**

```text
 location
-----------
 Bengaluru
 Chennai
 Mumbai
 NULL
(4 rows)
```

```sql
SELECT DISTINCT dept_id, salary
FROM employees
WHERE dept_id IN (10, 20)
ORDER BY dept_id, salary DESC;
```

**Output:**

```text
 dept_id | salary
---------+--------
      10 | 150000
      10 |  95000
      10 |  72000
      20 |  88000
      20 |  60000
      20 |  55000
(6 rows)
```

Ravi and Meena (10, 95000) collapse into one row; so do Arjun and Sneha (20, 60000).

### LIMIT/OFFSET and FETCH … WITH TIES

Second page of employees by salary, page size 3:

```sql
SELECT emp_id, name, salary
FROM employees
ORDER BY salary DESC, emp_id
LIMIT 3 OFFSET 3;
```

**Output:**

```text
 emp_id |  name  | salary
--------+--------+--------
      5 | Divya  |  88000
     10 | Farhan |  82000
      4 | Karan  |  72000
(3 rows)
```

The `emp_id` tie-breaker makes the order — and therefore every page — deterministic.

Top 2 salaries, including anyone tied with the second:

```sql
SELECT name, salary
FROM employees
ORDER BY salary DESC
FETCH FIRST 2 ROWS WITH TIES;
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

`LIMIT 2` would have returned only one of Ravi and Meena, chosen arbitrarily.

## Comparison

| Need | Use |
|------|-----|
| Remove duplicate result rows | `DISTINCT` |
| One row per group, chosen by an order | `DISTINCT ON` (PostgreSQL) or `ROW_NUMBER()` |
| First n rows | `LIMIT n` / `FETCH FIRST n ROWS ONLY` |
| First n rows plus ties | `FETCH FIRST n ROWS WITH TIES` |
| Deep pagination | Keyset: `WHERE key > last_key ORDER BY key LIMIT n` |

## Common Mistakes

- Mixing `AND` and `OR` without parentheses.
- Using a select-list alias in `WHERE`.
- `LIMIT` without `ORDER BY` (or with a non-unique `ORDER BY`) for pagination — rows can repeat or vanish between pages.
- Thinking `DISTINCT` applies to one column of a multi-column select.
- `BETWEEN '2026-01-01' AND '2026-01-31'` on a `timestamp` column misses everything after midnight on the 31st. Use `>= '2026-01-01' AND < '2026-02-01'`.
- `LIKE '%term%'` on a big table expecting an index to help (a leading wildcard cannot use a normal B-tree).

## Revision

- `SELECT` list: columns, expressions, aliases; avoid `SELECT *` in code.
- `WHERE` runs before the `SELECT` list → aliases are not visible there.
- Precedence: `NOT` > `AND` > `OR`; use parentheses.
- `BETWEEN` is inclusive; `ILIKE` is case-insensitive (PostgreSQL).
- `ORDER BY`: `NULL`s last in ASC, first in DESC (PostgreSQL); `NULLS FIRST/LAST` to override; no `ORDER BY` = no guaranteed order.
- `DISTINCT` applies to the whole row.
- `LIMIT/OFFSET` or `OFFSET … FETCH FIRST … ROWS ONLY`; `WITH TIES` keeps ties; deep `OFFSET` is slow → keyset pagination.

## Quick Revision

WHERE filters rows before SELECT computes aliases; AND before OR; NULLs sort last ascending in PostgreSQL. Always pair LIMIT/OFFSET with a unique ORDER BY.
