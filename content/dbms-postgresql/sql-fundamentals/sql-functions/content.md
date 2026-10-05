# SQL Functions: Aggregate, String, Date and Numeric

**Module:** SQL Fundamentals · **Interview priority:** Core

## What Is It?

SQL has two kinds of functions:

- **Scalar functions** take values from one row and return one value per row: `upper(name)`, `round(price)`, `date_trunc('month', order_date)`.
- **Aggregate functions** take a set of rows and return one value for the whole set (or for each group with `GROUP BY`): `count`, `sum`, `avg`, `min`, `max`.

## Why It Matters

- Reports, dashboards and most interview queries are built from aggregates and date functions.
- `NULL` handling in aggregates — especially `COUNT(*)` vs `COUNT(column)` and `AVG` ignoring `NULL`s — is one of the most frequent SQL interview traps.
- Small type details (integer division, `avg` returning `numeric`, rounding) cause wrong numbers in production reports.

## Core Concept

### Aggregate functions

| Function | Returns | NULL handling | Empty input |
|----------|---------|---------------|-------------|
| `count(*)` | Number of rows | Counts every row, `NULL`s included | `0` |
| `count(col)` | Number of non-NULL values of `col` | Skips `NULL` | `0` |
| `count(DISTINCT col)` | Number of distinct non-NULL values | Skips `NULL` | `0` |
| `sum(col)` | Total | Skips `NULL` | `NULL` (not 0) |
| `avg(col)` | Mean of non-NULL values | Skips `NULL` (divides by the non-NULL count) | `NULL` |
| `min(col)` / `max(col)` | Smallest / largest | Skips `NULL` | `NULL` |

Result types in PostgreSQL: `count` → `bigint`; `sum(integer)` → `bigint`; `sum(bigint)` and `sum(numeric)` → `numeric`; `avg` of any integer type → `numeric`.

### COUNT(*) vs COUNT(column) vs COUNT(1)

- `count(*)` counts **rows**.
- `count(column)` counts rows where `column IS NOT NULL`.
- `count(1)` counts rows where the expression `1` is not null — always — so it equals `count(*)`. It is **not** faster in PostgreSQL; `count(*)` is the idiomatic form and is specially optimised (no argument to evaluate).
- `count(DISTINCT column)` counts distinct non-NULL values.

### String functions

| Function | Example | Result |
|----------|---------|--------|
| `concat(a, b, …)` | `concat('A', NULL, 'B')` | `'AB'` (NULLs ignored) |
| `a \|\| b` | `'A' \|\| NULL` | `NULL` (any NULL makes it NULL) |
| `concat_ws(sep, …)` | `concat_ws('-', '2026', '04')` | `'2026-04'` |
| `length(s)` / `char_length(s)` | `length('Chennai')` | `7` (characters) |
| `lower(s)`, `upper(s)` | `upper('sql')` | `'SQL'` |
| `substring(s FROM start FOR len)` / `substr(s, start, len)` | `substring('PostgreSQL' FROM 1 FOR 4)` | `'Post'` (positions start at 1) |
| `trim([LEADING\|TRAILING\|BOTH] [chars] FROM s)` | `trim('  hi  ')` | `'hi'` |
| `replace(s, from, to)` | `replace('a-b-c', '-', '/')` | `'a/b/c'` |
| `position(sub IN s)` | `position('@' IN 'asha@corp.com')` | `5` |
| `left(s, n)`, `right(s, n)` | `left('Mumbai', 3)` | `'Mum'` |
| `string_agg(s, sep ORDER BY …)` (aggregate) | names joined by `', '` | `'Arjun, Divya, …'` |

### Date and time functions

| Function | Meaning |
|----------|---------|
| `CURRENT_DATE` | Today's date (`date`) |
| `CURRENT_TIMESTAMP` / `now()` | Start time of the **current transaction** (`timestamptz`); both are identical in PostgreSQL |
| `clock_timestamp()` | The actual current time, changes during a statement |
| `date_trunc('month', ts)` | Truncate to a unit: `year`, `quarter`, `month`, `week`, `day`, `hour`… |
| `extract(field FROM ts)` / `date_part` | A component: `year`, `month`, `day`, `dow` (0 = Sunday), `epoch`… |
| `age(later, earlier)` | Interval in years/months/days; `age(ts)` measures from today's midnight |
| `date + integer` | Add days to a date |
| `ts + interval '1 month'` | Interval arithmetic |
| `date2 - date1` | Number of days (`integer`) |

Because `now()` is fixed for the whole transaction, two calls in one transaction return the same value — handy for consistent timestamps on related rows.

### Numeric functions

| Function | Example | Result |
|----------|---------|--------|
| `round(x)` / `round(x, d)` | `round(2666.6667, 2)` | `2666.67` (half away from zero for `numeric`) |
| `ceil(x)` / `ceiling(x)` | `ceil(4.1)` | `5` |
| `floor(x)` | `floor(-4.1)` | `-5` |
| `abs(x)` | `abs(-7)` | `7` |
| `mod(a, b)` / `a % b` | `mod(17, 5)` | `2` |
| `trunc(x, d)` | `trunc(9.876, 1)` | `9.8` |

> [!WARNING]
> **Integer division truncates.** `7 / 2` is `3` in PostgreSQL because both operands are integers. Write `7 / 2.0`, `7::numeric / 2`, or multiply by `1.0` to get `3.5`. This bites percentage calculations such as `delivered_count / total_count * 100`.

## Examples

### Aggregates and NULLs

`commission` is 5000, 3000 and 0 for three Sales employees and `NULL` for the other nine:

```sql
SELECT count(*)                   AS all_rows,
       count(commission)          AS with_commission,
       count(DISTINCT commission) AS distinct_commissions,
       sum(commission)            AS total,
       round(avg(commission), 2)  AS avg_ignoring_nulls,
       round(avg(COALESCE(commission, 0)), 2) AS avg_nulls_as_zero,
       min(commission)            AS min_c,
       max(commission)            AS max_c
FROM employees;
```

**Output:**

```text
 all_rows | with_commission | distinct_commissions | total | avg_ignoring_nulls | avg_nulls_as_zero | min_c | max_c
----------+-----------------+----------------------+-------+--------------------+-------------------+-------+-------
       12 |               3 |                    3 |  8000 |            2666.67 |            666.67 |     0 |  5000
(1 row)
```

`avg` divided 8000 by 3 (only non-NULL values); treating `NULL` as 0 divides by 12. Which one is correct depends on the meaning of `NULL` — decide explicitly.

### COUNT(*) vs COUNT(column) vs COUNT(1)

```sql
SELECT count(*) AS count_star, count(1) AS count_one, count(email) AS count_email
FROM employees;
```

**Output:**

```text
 count_star | count_one | count_email
------------+-----------+-------------
         12 |        12 |          11
(1 row)
```

Karan has no email, so `count(email)` is 11.

### Aggregates over no rows

```sql
SELECT count(*) AS cnt, sum(salary) AS total, avg(salary) AS average, max(salary) AS highest
FROM employees
WHERE dept_id = 50;
```

**Output:**

```text
 cnt | total | average | highest
-----+-------+---------+---------
   0 |  NULL |    NULL |    NULL
(1 row)
```

Research has no employees: `count` is 0, but `sum` is `NULL`, not 0. Use `COALESCE(sum(salary), 0)` when a report needs 0.

### String functions

```sql
SELECT name,
       upper(name)                                   AS upper_name,
       length(name)                                  AS len,
       substring(email FROM 1 FOR position('@' IN email) - 1) AS mailbox,
       replace(email, '@corp.com', '@company.in')    AS new_email,
       concat(name, ' (', email, ')')                AS with_concat,
       name || ' (' || email || ')'                  AS with_pipes
FROM employees
WHERE emp_id IN (2, 4)
ORDER BY emp_id;
```

**Output:**

```text
 name  | upper_name | len | mailbox |    new_email    |     with_concat      |      with_pipes
-------+------------+-----+---------+-----------------+----------------------+----------------------
 Ravi  | RAVI       |   4 | ravi    | ravi@company.in | Ravi (ravi@corp.com) | Ravi (ravi@corp.com)
 Karan | KARAN      |   5 | NULL    | NULL            | Karan ()             | NULL
(2 rows)
```

For Karan (no email), `concat` skipped the `NULL` but `||` turned the whole result into `NULL`.

```sql
SELECT '[' || trim('   padded   ') || ']'           AS trimmed,
       '[' || trim(LEADING '0' FROM '000123') || ']' AS no_leading_zeros,
       string_agg(name, ', ' ORDER BY name)          AS sales_team
FROM employees
WHERE dept_id = 20;
```

**Output:**

```text
 trimmed  | no_leading_zeros |         sales_team
----------+------------------+----------------------------
 [padded] | [123]            | Arjun, Divya, Rahul, Sneha
(1 row)
```

### Date and time functions

Fixed dates make the output reproducible; in real queries you would use `CURRENT_DATE` or `now()`.

```sql
SELECT name,
       hire_date,
       extract(year FROM hire_date)              AS hire_year,
       date_trunc('month', hire_date)::date      AS hire_month,
       age(DATE '2026-04-01', hire_date)         AS tenure,
       DATE '2026-04-01' - hire_date             AS days_employed,
       hire_date + interval '6 months'           AS probation_end
FROM employees
WHERE emp_id IN (1, 12)
ORDER BY emp_id;
```

**Output:**

```text
 name  | hire_date  | hire_year | hire_month |         tenure          | days_employed |    probation_end
-------+------------+-----------+------------+-------------------------+---------------+---------------------
 Asha  | 2015-01-10 |      2015 | 2015-01-01 | 11 years 2 mons 22 days |          4099 | 2015-07-10 00:00:00
 Rahul | 2024-06-01 |      2024 | 2024-06-01 | 1 year 10 mons          |           669 | 2024-12-01 00:00:00
(2 rows)
```

`date - date` gives an integer number of days; `date + interval` gives a `timestamp`.

```sql
SELECT CURRENT_DATE AS today, now() AS txn_start, clock_timestamp() AS wall_clock;
```

**Output (varies):**

```text
   today    |           txn_start           |          wall_clock
------------+-------------------------------+-------------------------------
 2026-10-04 | 2026-10-04 14:30:58.044062+00 | 2026-10-04 14:30:58.044735+00
(1 row)
```

### Numeric functions and integer division

```sql
SELECT 7 / 2           AS int_division,
       7 / 2.0         AS numeric_division,
       7 % 2           AS remainder,
       round(2.5)      AS round_half,
       round(-2.5)     AS round_neg_half,
       ceil(4.1)       AS ceil_val,
       floor(-4.1)     AS floor_val,
       abs(-15)        AS abs_val,
       round(1234.5678, 2) AS two_places;
```

**Output:**

```text
 int_division |  numeric_division  | remainder | round_half | round_neg_half | ceil_val | floor_val | abs_val | two_places
--------------+--------------------+-----------+------------+----------------+----------+-----------+---------+------------
            3 | 3.5000000000000000 |         1 |          3 |             -3 |        5 |        -5 |      15 |    1234.57
(1 row)
```

A percentage done the wrong way and the right way:

```sql
SELECT count(*) FILTER (WHERE status = 'DELIVERED') * 100 / count(*)          AS wrong_pct_int,
       round(count(*) FILTER (WHERE status = 'DELIVERED') * 100.0 / count(*), 1) AS delivered_pct
FROM orders;
```

**Output:**

```text
 wrong_pct_int | delivered_pct
---------------+---------------
            62 |          62.5
(1 row)
```

5 of 8 orders are delivered: 62.5%. The integer version silently truncated to 62. (`FILTER` is covered in [GROUP BY and HAVING](../../aggregation-and-grouping/group-by-and-having/content.md).)

## Comparison

### COUNT variants

| Expression | Counts | `NULL`s | Same as |
|------------|--------|---------|---------|
| `count(*)` | Rows | Included | `count(1)` |
| `count(1)` | Rows (1 is never NULL) | Included | `count(*)` |
| `count(col)` | Non-NULL values | Excluded | `count(*) FILTER (WHERE col IS NOT NULL)` |
| `count(DISTINCT col)` | Distinct non-NULL values | Excluded | — |

### `||` vs `concat()`

| | `a \|\| b` | `concat(a, b)` |
|---|---|---|
| A `NULL` argument | Whole result `NULL` | Treated as empty string |
| Standard | SQL standard operator | Function (PostgreSQL, MySQL, SQL Server) |

## Common Mistakes

- Assuming `count(1)` is faster than `count(*)`.
- Using `count(col)` when you meant "number of rows".
- Expecting `sum` over zero rows to be 0.
- Averages that silently ignore `NULL`s when the business meant "NULL = 0".
- Integer division in percentages and ratios.
- Using `now()` to measure elapsed time inside a long transaction — it does not move; use `clock_timestamp()`.
- Concatenating with `||` when any part may be `NULL`.

## Revision

- Aggregates ignore `NULL`s, except `count(*)`. Empty set: `count` = 0, others `NULL`.
- `count(*)` = rows = `count(1)`; `count(col)` = non-NULL values; `count(DISTINCT col)`.
- `avg` divides by the non-NULL count; `avg(int)` returns `numeric`; `sum(int)` returns `bigint`.
- Strings: `concat` skips NULL, `||` propagates it; `substring`, `trim`, `replace`, `position`, `length`, `string_agg`.
- Dates: `CURRENT_DATE`, `now()` = `CURRENT_TIMESTAMP` (transaction start), `clock_timestamp()`, `date_trunc`, `extract`, `age`, interval arithmetic; `date - date` = days.
- Numbers: `round`, `ceil`, `floor`, `abs`, `mod`; integer `/` truncates.

## Quick Revision

`count(*)` counts rows, `count(col)` counts non-NULLs, `count(1)` = `count(*)`. Aggregates skip NULLs; `sum` of nothing is NULL. `7/2 = 3` in PostgreSQL — use a numeric operand.
