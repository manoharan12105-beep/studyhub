# Logical Query Processing Order

**Module:** Aggregation and Grouping · **Interview priority:** Core

## What Is It?

A `SELECT` is written in one order but **defined** to be evaluated in another. The **logical processing order** is the sequence of steps whose results the SQL standard specifies:

```text
Written order                   Logical order
─────────────                   ─────────────
SELECT  (6, 7)                  1. FROM / JOIN … ON      build the input rows
FROM    (1)                     2. WHERE                 filter rows
WHERE   (2)                     3. GROUP BY              form groups
GROUP BY (3)                    4. HAVING                filter groups
HAVING  (4)                     5. Window functions      computed over the remaining rows
WINDOW  (5)                     6. SELECT list           compute expressions, name aliases
ORDER BY (8)                    7. DISTINCT              remove duplicate rows
LIMIT   (9)                     8. ORDER BY              sort
                                9. LIMIT / OFFSET        keep a slice
```

Each step only sees what earlier steps produced. That single idea explains most "why does this query fail?" questions.

## Why It Matters

- It explains, without memorising special cases, why an alias works in `ORDER BY` but not in `WHERE`, why aggregates are illegal in `WHERE`, and why a window function cannot be filtered directly.
- Interviewers ask "what is the order of execution of a SQL query?" — and the strong answer adds that this is the *logical* order, not what the engine physically does.

## Core Concept

### Step by step

| Step | Input → output | Consequence |
|------|----------------|-------------|
| 1. `FROM` / `JOIN` | Tables → one combined row set (joins evaluated with their `ON` conditions; outer joins add padded rows) | Conditions in `ON` act during the join; padded rows exist from here on |
| 2. `WHERE` | Rows → fewer rows | Cannot use aggregates, window functions or select-list aliases (none exist yet). Runs after outer joins, so a `WHERE` on the right table removes padded rows |
| 3. `GROUP BY` | Rows → groups | From here, only grouped columns and aggregates have a single value |
| 4. `HAVING` | Groups → fewer groups | May use aggregates; may not use select aliases (standard; PostgreSQL agrees) |
| 5. Window functions | Rows/groups → same rows plus window values | Operate on the result after `HAVING`; can wrap aggregates (`sum(count(*)) OVER ()`) |
| 6. `SELECT` list | Compute output columns and aliases | Aliases are born here |
| 7. `DISTINCT` | Remove duplicate output rows | Works on the computed columns |
| 8. `ORDER BY` | Sort | Can use aliases; in PostgreSQL can also use non-selected columns, unless `DISTINCT` is used |
| 9. `LIMIT` / `OFFSET` / `FETCH` | Keep a slice | Without `ORDER BY`, which rows you get is unspecified |

For set operations (`UNION`, `INTERSECT`, `EXCEPT`), steps 1–7 run for each branch, the branches are combined, and then a final `ORDER BY` and `LIMIT` apply to the combined result.

### Where aliases are visible

| Clause | Select-list alias usable? | Why |
|--------|---------------------------|-----|
| `WHERE` | No | Runs at step 2, aliases are created at step 6 |
| `GROUP BY` | **PostgreSQL: yes** (extension); standard: no | PostgreSQL resolves a bare name to an output column if no input column has that name |
| `HAVING` | No | Step 4 |
| `ORDER BY` | Yes — but only as a bare name, not inside an expression | `ORDER BY total` works; `ORDER BY total * 2` does not |

When `GROUP BY` sees a name that is both an input column and an output alias, PostgreSQL uses the **input column** (in `ORDER BY` it is the reverse — the output column wins). Avoid aliases that shadow column names.

### Logical order is not execution order

The logical order defines the **result**. The planner may execute differently as long as the result is the same:

- It pushes `WHERE` conditions down into table scans and index lookups, and through joins and subqueries.
- It chooses the join order and join algorithm itself — not the order written in `FROM`.
- It moves `HAVING` conditions that do not use aggregates into `WHERE`.
- With `ORDER BY … LIMIT n`, it can read an index in order and **stop after n rows**, never sorting the whole table.
- It may compute select-list expressions only for rows that reach the output.

`EXPLAIN` shows the physical plan; reading it bottom-up roughly follows the logical steps, but with these optimisations applied.

### Not everything is guaranteed to short-circuit

Because the planner may reorder conditions, `WHERE x <> 0 AND 10 / x > 1` is **not** guaranteed to evaluate `x <> 0` first. If an expression must be guarded, use `CASE` (`WHERE CASE WHEN x <> 0 THEN 10 / x > 1 END`) — PostgreSQL evaluates `CASE` branches in order (with the documented exception of constant subexpressions folded at plan time).

## Syntax

```sql
-- Illustrative: clause order as written; every clause except SELECT is optional
SELECT [DISTINCT] select_list
FROM from_items
WHERE condition
GROUP BY grouping
HAVING condition
WINDOW window_definitions
ORDER BY sort_keys
LIMIT n OFFSET m;
```

## Examples

### Alias in WHERE: not yet defined

```sql
SELECT name, salary * 12 AS annual
FROM employees
WHERE annual > 1000000;
```

**Output:**

```text
ERROR:  column "annual" does not exist
LINE 3: WHERE annual > 1000000;
              ^
```

Repeat the expression in `WHERE`, or compute it in a derived table:

```sql
SELECT name, annual
FROM (SELECT name, salary * 12 AS annual FROM employees) AS t
WHERE annual > 1000000
ORDER BY annual DESC, name;
```

**Output:**

```text
 name  | annual
-------+---------
 Asha  | 1800000
 Meena | 1140000
 Ravi  | 1140000
 Divya | 1056000
(4 rows)
```

### Alias in ORDER BY: works, but only bare

```sql
SELECT name, salary * 12 AS annual
FROM employees
ORDER BY annual DESC, name
LIMIT 3;
```

**Output:**

```text
 name  | annual
-------+---------
 Asha  | 1800000
 Meena | 1140000
 Ravi  | 1140000
(3 rows)
```

```sql
SELECT name, salary * 12 AS annual
FROM employees
ORDER BY annual + 0 DESC;
```

**Output:**

```text
ERROR:  column "annual" does not exist
LINE 3: ORDER BY annual + 0 DESC;
                 ^
```

In an expression, `annual` is looked up among input columns only.

### Alias in HAVING: not allowed

```sql
SELECT dept_id, count(*) AS headcount
FROM employees
GROUP BY dept_id
HAVING headcount > 2;
```

**Output:**

```text
ERROR:  column "headcount" does not exist
LINE 4: HAVING headcount > 2;
               ^
```

Write `HAVING count(*) > 2`.

### Window function in WHERE: computed too late

Top earner per department — the obvious attempt:

```sql
SELECT name, dept_id, salary
FROM employees
WHERE rank() OVER (PARTITION BY dept_id ORDER BY salary DESC) = 1;
```

**Output:**

```text
ERROR:  window functions are not allowed in WHERE
LINE 3: WHERE rank() OVER (PARTITION BY dept_id ORDER BY salary DESC...
              ^
```

Window functions run at step 5, after `WHERE`. Compute the rank in a derived table, then filter:

```sql
SELECT name, dept_id, salary
FROM (SELECT name, dept_id, salary,
             rank() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk
      FROM employees) AS t
WHERE rnk = 1
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
 Nisha  |    NULL |  45000
(5 rows)
```

### Window over the grouped result

Because windows run after grouping, they can aggregate the aggregates — each department's share of total headcount:

```sql
SELECT dept_id,
       count(*) AS headcount,
       round(100.0 * count(*) / sum(count(*)) OVER (), 1) AS pct
FROM employees
GROUP BY dept_id
ORDER BY dept_id;
```

**Output:**

```text
 dept_id | headcount | pct
---------+-----------+------
      10 |         4 | 33.3
      20 |         4 | 33.3
      30 |         2 | 16.7
      40 |         1 |  8.3
    NULL |         1 |  8.3
(5 rows)
```

`sum(count(*)) OVER ()` sums the five group counts. A plain `sum(count(*))` would be a nested aggregate and is an error.

### DISTINCT before ORDER BY

```sql
SELECT DISTINCT dept_id
FROM employees
ORDER BY salary;
```

**Output:**

```text
ERROR:  for SELECT DISTINCT, ORDER BY expressions must appear in select list
LINE 3: ORDER BY salary;
                 ^
```

After `DISTINCT` (step 7), one row per `dept_id` remains — there is no single `salary` left to sort by. Without `DISTINCT`, PostgreSQL allows ordering by a column that is not selected.

### WHERE after the outer join

`WHERE` runs after `FROM`, including outer joins, so it sees padded rows:

```sql
SELECT d.dept_name, e.name
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.dept_id
WHERE e.salary > 80000
ORDER BY d.dept_id, e.name;
```

**Output:**

```text
  dept_name  |  name
-------------+--------
 Engineering | Asha
 Engineering | Meena
 Engineering | Ravi
 Sales       | Divya
 Finance     | Farhan
(5 rows)
```

HR and Research disappear: their rows (real or padded) fail `e.salary > 80000`. Moving the condition into `ON` keeps every department — see [ON vs USING vs WHERE](../../joins/join-conditions-on-using-where/content.md).

### Logical vs physical: ORDER BY … LIMIT with an index

```sql
CREATE INDEX employees_salary_idx ON employees (salary);
SET enable_seqscan = off;   -- the table is tiny; force the index to show the plan shape

EXPLAIN (COSTS OFF)
SELECT name, salary
FROM employees
ORDER BY salary DESC
LIMIT 3;
```

**Output:**

```text
                            QUERY PLAN
-------------------------------------------------------------------
 Limit
   ->  Index Scan Backward using employees_salary_idx on employees
(2 rows)
```

Logically, all rows are sorted and then three are kept. Physically, PostgreSQL reads the index backwards and stops after three rows; there is no Sort node. (`enable_seqscan = off` is only for the demonstration; on 12 rows the planner rightly prefers a sequential scan and a top-N sort.)

### Guarding a division

```sql
SELECT name
FROM employees
WHERE CASE WHEN commission > 0 THEN salary / commission > 15 ELSE false END
ORDER BY emp_id;
```

**Output:**

```text
 name
-------
 Divya
 Arjun
(2 rows)
```

`commission > 0 AND salary / commission > 15` happens to work too, but SQL does not promise left-to-right evaluation of `AND`; the `CASE` form does.

## Comparison

### Logical vs physical order

| | Logical processing order | Physical execution (plan) |
|---|---|---|
| Defined by | SQL standard | PostgreSQL planner, per query |
| Purpose | What the result means | How to compute it cheaply |
| Fixed? | Yes | Changes with statistics, indexes, settings |
| Seen with | The rules on this page | `EXPLAIN` |

## Common Mistakes

- Using a select alias in `WHERE` or `HAVING`.
- Filtering a window function in `WHERE` instead of an outer query.
- Expecting `ORDER BY alias + 1` to work because `ORDER BY alias` does.
- Using `LIMIT` without `ORDER BY` and expecting "the first rows".
- Believing the written `FROM` order or `AND` order controls execution.
- Filtering an outer-joined table in `WHERE` and losing the unmatched rows.
- Answering "the query runs FROM first" as if it were the physical behaviour.

## Revision

- Logical order: FROM/JOIN → WHERE → GROUP BY → HAVING → window functions → SELECT → DISTINCT → ORDER BY → LIMIT.
- Aliases: not in `WHERE`/`HAVING`; in `ORDER BY` as a bare name; PostgreSQL also allows them in `GROUP BY`.
- Window functions cannot be filtered in `WHERE`; wrap the query. They can wrap aggregates.
- `DISTINCT` + `ORDER BY`: sort keys must be in the select list.
- Logical ≠ physical: predicates are pushed down, join order is chosen, `ORDER BY … LIMIT` can stop early; `AND` does not guarantee short-circuit — use `CASE` to guard.

## Quick Revision

FROM, WHERE, GROUP BY, HAVING, window, SELECT, DISTINCT, ORDER BY, LIMIT — each step sees only earlier results, so aliases and window functions are unavailable to WHERE. This defines the result, not the execution plan.
