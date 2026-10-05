# Debugging Wrong Query Results

**Module:** Debugging · **Interview priority:** Frequently asked

## What Is It?

A collection of debugging scenarios in which a query **runs without error but returns the wrong answer**: missing rows, extra rows, wrong totals or wrong ranks. Each scenario follows the same structure — **problem, why it happens, incorrect query, correct query, explanation, interview takeaway** — and runs against the [sample database](../../sql-fundamentals/dbms-sample-database/content.md).

Errors and slow queries are covered in [Debugging Errors and Performance](../debugging-errors-and-performance/content.md).

## Why It Matters

- Wrong results are worse than errors: nothing fails, and the wrong number reaches a report or a customer.
- "This query returns nothing / too much — why?" is a favourite interview format, because it tests real understanding of `NULL`, joins and grouping.

## Core Concept

### A checklist for wrong results

1. **Shrink the case**: one customer, one order, one day. Compare with what you expect by hand.
2. **Check row counts at each step**: run the `FROM`/`JOIN` part alone with `count(*)`; did a join multiply or drop rows?
3. **Look for `NULL`**: in join keys, in `NOT IN` subqueries, in compared columns, in aggregates.
4. **Check filter placement**: `WHERE` vs `ON` vs `HAVING`.
5. **Check the grain**: is each output row what the question asks for (per order, per customer)?
6. **Check ordering and ties**: window `ORDER BY`, frames, `DISTINCT ON`, `LIMIT` without `ORDER BY`.
7. **Check types and time zones**: integer division, `timestamp` vs `timestamptz`, date boundaries.

### Scenarios in this lesson

| # | Symptom | Usual cause |
|---|---------|-------------|
| D1 | No rows for a `NULL` filter | `= NULL` instead of `IS NULL` |
| D2 | Left join lost rows | Right-table filter in `WHERE` |
| D3 | Totals too high | Join fan-out |
| D4 | Wrong per-group values | Grouping by the wrong column |
| D5 | "Aggregate in `WHERE`" rewritten wrongly | Filtering rows instead of groups |
| D6 | `NOT IN` returns nothing | `NULL` in the subquery |
| D7 | Running total or rank looks wrong | Ties and default frame |
| D8 | Unexpected `NULL`s in output | `NULL` propagation through arithmetic/concatenation |
| D9 | Events on the wrong day | Time zone not applied |

## Examples

### D1. NULL comparison returns no rows

**Problem:** "Show employees without a commission" returns nothing, although several exist.

**Why it happens:** `commission = NULL` evaluates to unknown for every row, and `WHERE` keeps only true.

Incorrect:

```sql
SELECT name FROM employees WHERE commission = NULL;
```

**Output:**

```text
 name
------
(0 rows)
```

Correct:

```sql
SELECT name FROM employees WHERE commission IS NULL ORDER BY emp_id;
```

**Output:**

```text
  name
--------
 Asha
 Ravi
 Meena
 Karan
 Sneha
 Vikram
 Pooja
 Farhan
 Nisha
(9 rows)
```

**Explanation:** `NULL` is a missing value, not a value; it can only be tested with `IS [NOT] NULL` or compared NULL-safely with `IS [NOT] DISTINCT FROM`. The same bug hides in `<>`: `commission <> 0` silently excludes the nine `NULL` rows too.

**Interview takeaway:** "Comparisons with `NULL` are unknown, so use `IS NULL`."

### D2. LEFT JOIN behaving like INNER JOIN

**Problem:** "All customers with their delivered orders" drops customers who have none.

**Why it happens:** The condition on the right table is in `WHERE`, which runs after the join and rejects the `NULL`-extended rows.

Incorrect:

```sql
SELECT c.name, o.order_id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
WHERE o.status = 'DELIVERED'
ORDER BY c.customer_id, o.order_id;
```

**Output:**

```text
  name  | order_id
--------+----------
 Anil   |      101
 Anil   |      107
 Bhavna |      102
 Deepa  |      105
 Eshan  |      108
(5 rows)
```

Correct:

```sql
SELECT c.name, o.order_id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'DELIVERED'
ORDER BY c.customer_id, o.order_id;
```

**Output:**

```text
  name  | order_id
--------+----------
 Anil   |      101
 Anil   |      107
 Bhavna |      102
 Chirag |     NULL
 Deepa  |      105
 Eshan  |      108
 Fatima |     NULL
(7 rows)
```

**Explanation:** For an unmatched customer, `o.status` is `NULL`, and `NULL = 'DELIVERED'` is not true. Conditions that decide **which right rows match** go in `ON`; conditions that decide **which result rows survive** go in `WHERE`. `WHERE o.order_id IS NULL` (an anti-join) is the deliberate exception.

**Interview takeaway:** "Filters on the optional side of an outer join belong in `ON`."

### D3. Duplicate rows and inflated totals after a JOIN

**Problem:** Order totals double after a join to a `shipments` table is added to the report.

**Why it happens:** Each join to a one-to-many table multiplies rows (**fan-out**); aggregates then count the same value several times.

```sql
CREATE TABLE shipments (order_id int, shipped_on date);
INSERT INTO shipments VALUES (101, '2026-01-06'), (101, '2026-01-08'), (102, '2026-01-13');
```

Incorrect:

```sql
SELECT o.order_id, sum(oi.quantity * oi.unit_price) AS total, count(s.shipped_on) AS shipments
FROM orders o
JOIN order_items oi    ON oi.order_id = o.order_id
LEFT JOIN shipments s  ON s.order_id = o.order_id
WHERE o.order_id IN (101, 102)
GROUP BY o.order_id
ORDER BY o.order_id;
```

**Output:**

```text
 order_id |   total   | shipments
----------+-----------+-----------
      101 | 112000.00 |         4
      102 |  17000.00 |         2
(2 rows)
```

Correct — aggregate each child table before joining:

```sql
SELECT o.order_id, i.total, coalesce(s.shipments, 0) AS shipments
FROM orders o
JOIN (SELECT order_id, sum(quantity * unit_price) AS total FROM order_items GROUP BY order_id) i
     ON i.order_id = o.order_id
LEFT JOIN (SELECT order_id, count(*) AS shipments FROM shipments GROUP BY order_id) s
     ON s.order_id = o.order_id
WHERE o.order_id IN (101, 102)
ORDER BY o.order_id;
```

**Output:**

```text
 order_id |  total   | shipments
----------+----------+-----------
      101 | 56000.00 |         2
      102 | 17000.00 |         1
(2 rows)
```

**Explanation:** Order 101 has 2 items × 2 shipments = 4 joined rows, so its total doubled (56000 → 112000) and its shipment count also doubled (2 → 4). Count rows after each join to spot it. `count(DISTINCT …)` can hide the symptom for counts, but cannot fix sums.

**Interview takeaway:** "Never join two independent one-to-many tables before aggregating; aggregate each first."

### D4. Incorrect GROUP BY

**Problem:** "Headcount per department name" shows the same department twice.

**Why it happens:** The query groups by a column that is finer than the intended grain (here `office` as well as the name), or by an expression that differs slightly between rows.

```sql
CREATE TABLE staff_offices (emp_id int, dept_name text, office text);
INSERT INTO staff_offices VALUES
    (1, 'Engineering', 'Chennai'), (2, 'Engineering', 'Chennai'), (3, 'Engineering', 'Pune'),
    (4, 'sales', 'Mumbai'), (5, 'Sales', 'Mumbai'), (6, 'Sales ', 'Mumbai');
```

Incorrect:

```sql
SELECT dept_name, office, count(*) AS headcount
FROM staff_offices
GROUP BY dept_name, office
ORDER BY dept_name, office;
```

**Output:**

```text
  dept_name  | office  | headcount
-------------+---------+-----------
 Engineering | Chennai |         2
 Engineering | Pune    |         1
 Sales       | Mumbai  |         1
 Sales       | Mumbai  |         1
 sales       | Mumbai  |         1
(5 rows)
```

Correct:

```sql
SELECT initcap(trim(dept_name)) AS dept_name, count(*) AS headcount
FROM staff_offices
GROUP BY initcap(trim(dept_name))
ORDER BY 1;
```

**Output:**

```text
  dept_name  | headcount
-------------+-----------
 Engineering |         3
 Sales       |         3
(2 rows)
```

**Explanation:** Every `GROUP BY` column splits groups further, so group only by the output grain. The two `Sales` rows that look identical differ by a trailing space, which psql does not show. Dirty text values (case, spaces) also form separate groups. Normalise them in the query, and fix them at the source with a lookup table and a foreign key.

**Interview takeaway:** "One output row per distinct combination of the `GROUP BY` columns — choose them to match the question's grain."

### D5. Aggregate used in WHERE — and the wrong fix

**Problem:** "Departments with more than two employees". `WHERE count(*) > 2` raises an error, and the developer "fixes" it with a subquery that filters the wrong thing.

Incorrect (error):

```sql
SELECT dept_id, count(*) FROM employees WHERE count(*) > 2 GROUP BY dept_id;
```

**Output:**

```text
ERROR:  aggregate functions are not allowed in WHERE
LINE 1: SELECT dept_id, count(*) FROM employees WHERE count(*) > 2 G...
                                                      ^
```

Incorrect (runs, but wrong): filtering employees by salary instead of groups by size:

```sql
SELECT dept_id, count(*) AS staff
FROM employees
WHERE salary > (SELECT avg(salary) FROM employees)
GROUP BY dept_id
ORDER BY dept_id;
```

**Output:**

```text
 dept_id | staff
---------+-------
      10 |     3
      20 |     1
      40 |     1
(3 rows)
```

Correct:

```sql
SELECT dept_id, count(*) AS staff
FROM employees
GROUP BY dept_id
HAVING count(*) > 2
ORDER BY dept_id;
```

**Output:**

```text
 dept_id | staff
---------+-------
      10 |     4
      20 |     4
(2 rows)
```

**Explanation:** `WHERE` runs before grouping, so no group size exists yet. Conditions on aggregates belong in `HAVING` (or in an outer query over a grouped subquery).

**Interview takeaway:** "`WHERE` filters rows, `HAVING` filters groups."

### D6. NOT IN returning zero rows

**Problem:** "Employees who are not managers" returns nothing.

**Why it happens:** The subquery returns a `NULL` (Asha's `manager_id`), so `x NOT IN (…, NULL)` is never true.

Incorrect:

```sql
SELECT name FROM employees
WHERE emp_id NOT IN (SELECT manager_id FROM employees);
```

**Output:**

```text
 name
------
(0 rows)
```

Correct:

```sql
SELECT e.name FROM employees e
WHERE NOT EXISTS (SELECT 1 FROM employees r WHERE r.manager_id = e.emp_id)
ORDER BY e.emp_id;
```

**Output:**

```text
  name
--------
 Meena
 Karan
 Arjun
 Sneha
 Pooja
 Farhan
 Nisha
 Rahul
(8 rows)
```

**Explanation:** `NOT IN` expands to `x <> v1 AND x <> v2 AND …`; one `x <> NULL` makes the whole condition unknown. `NOT EXISTS` only asks whether a matching row exists. Adding `WHERE manager_id IS NOT NULL` inside the subquery also fixes it, but is easy to forget.

**Interview takeaway:** "Prefer `NOT EXISTS`; `NOT IN` with a nullable subquery returns nothing."

### D7. Wrong window function result

**Problem:** A "running payroll by hire date" shows the same running total on two rows, and a "row number" changes between runs.

**Why it happens:** With `ORDER BY` and the default frame (`RANGE … CURRENT ROW`), rows with equal sort values are **peers** and share a result; and `ROW_NUMBER` over a non-unique order breaks ties arbitrarily.

```sql
CREATE TABLE hires (name text, hired date, salary int);
INSERT INTO hires VALUES ('A', '2026-01-01', 100), ('B', '2026-01-05', 200),
                         ('C', '2026-01-05', 300), ('D', '2026-01-09', 400);
```

Incorrect:

```sql
SELECT name, hired, salary,
       sum(salary) OVER (ORDER BY hired) AS running_payroll
FROM hires
ORDER BY hired, name;
```

**Output:**

```text
 name |   hired    | salary | running_payroll
------+------------+--------+-----------------
 A    | 2026-01-01 |    100 |             100
 B    | 2026-01-05 |    200 |             600
 C    | 2026-01-05 |    300 |             600
 D    | 2026-01-09 |    400 |            1000
(4 rows)
```

Correct — a unique order and a `ROWS` frame:

```sql
SELECT name, hired, salary,
       sum(salary) OVER (ORDER BY hired, name ROWS UNBOUNDED PRECEDING) AS running_payroll,
       ROW_NUMBER() OVER (ORDER BY hired, name) AS rn
FROM hires
ORDER BY hired, name;
```

**Output:**

```text
 name |   hired    | salary | running_payroll | rn
------+------------+--------+-----------------+----
 A    | 2026-01-01 |    100 |             100 |  1
 B    | 2026-01-05 |    200 |             300 |  2
 C    | 2026-01-05 |    300 |             600 |  3
 D    | 2026-01-09 |    400 |            1000 |  4
(4 rows)
```

**Explanation:** B and C were hired the same day, so under `RANGE` both see the sum through that day (600). Whether that is "wrong" depends on the requirement; per-row accumulation needs a tiebreaker. Other frequent window bugs: `last_value` with the default frame (returns the current row), and forgetting `PARTITION BY`.

**Interview takeaway:** "Window `ORDER BY` needs a unique tiebreaker, and know the default frame."

### D8. Unexpected NULL values in the output

**Problem:** A "total compensation" column is empty for most employees, and a "display name" column is `NULL` for some rows.

**Why it happens:** Arithmetic and `||` with a `NULL` operand return `NULL`.

Incorrect:

```sql
SELECT name, salary + commission AS total_comp, name || ' <' || email || '>' AS display
FROM employees
WHERE emp_id IN (4, 5, 6)
ORDER BY emp_id;
```

**Output:**

```text
 name  | total_comp |        display
-------+------------+------------------------
 Karan |       NULL | NULL
 Divya |      93000 | Divya <divya@corp.com>
 Arjun |      63000 | Arjun <arjun@corp.com>
(3 rows)
```

Correct:

```sql
SELECT name, salary + coalesce(commission, 0) AS total_comp,
       concat(name, ' <' || email || '>') AS display
FROM employees
WHERE emp_id IN (4, 5, 6)
ORDER BY emp_id;
```

**Output:**

```text
 name  | total_comp |        display
-------+------------+------------------------
 Karan |      72000 | Karan
 Divya |      93000 | Divya <divya@corp.com>
 Arjun |      63000 | Arjun <arjun@corp.com>
(3 rows)
```

**Explanation:** Decide what a missing value means (here, no commission = 0; no email = omit the part) and say so with `coalesce` or `concat`. Unexpected `NULL`s also come from outer joins (unmatched rows), from `max`/`sum` over no rows, and from scalar subqueries that find nothing.

**Interview takeaway:** "`NULL` propagates through expressions; handle it explicitly with `coalesce`."

### D9. Incorrect time zone handling

**Problem:** "Orders per day" for an Indian store puts late-evening UTC orders on the wrong day, and a day filter misses orders.

**Why it happens:** `timestamptz` values are truncated or cast to `date` in the session time zone (UTC here), not in the business time zone.

```sql
CREATE TABLE web_orders (id int, placed_at timestamptz);
INSERT INTO web_orders VALUES
    (1, '2026-04-01 03:00+00'), (2, '2026-04-01 19:00+00'), (3, '2026-04-02 10:00+00');
```

Incorrect:

```sql
SELECT placed_at::date AS day, count(*) FROM web_orders GROUP BY 1 ORDER BY 1;
```

**Output:**

```text
    day     | count
------------+-------
 2026-04-01 |     2
 2026-04-02 |     1
(2 rows)
```

Correct:

```sql
SELECT (placed_at AT TIME ZONE 'Asia/Kolkata')::date AS india_day, count(*)
FROM web_orders
GROUP BY 1
ORDER BY 1;
```

**Output:**

```text
 india_day  | count
------------+-------
 2026-04-01 |     1
 2026-04-02 |     2
(2 rows)
```

**Explanation:** Order 2 was placed at 00:30 on 2 April in India. Store instants as `timestamptz`, and convert to the business time zone explicitly before truncating or comparing with calendar dates. Do not rely on the server or session default.

**Interview takeaway:** "Store `timestamptz`; convert with `AT TIME ZONE` before grouping by local day."

## Comparison

| Symptom | First thing to check |
|---------|----------------------|
| Zero rows | `= NULL`, `NOT IN` with `NULL`, contradictory filters, wrong date range |
| Missing rows | Outer-join filter in `WHERE`, inner join where outer was needed |
| Extra rows / high totals | Fan-out joins, missing join condition (cross join) |
| Split groups | Extra `GROUP BY` columns, dirty values |
| Wrong ranks or running totals | Ties, default frame, missing `PARTITION BY` |
| `NULL`s in output | `NULL` propagation, unmatched outer rows |
| Wrong day | Time zone conversion |

## Common Mistakes

- Debugging the whole query at once instead of checking row counts after each join.
- "Fixing" duplicate rows with `DISTINCT` instead of finding the fan-out.
- Fixing `NOT IN` by excluding one known `NULL` value instead of switching to `NOT EXISTS`.
- Assuming the session time zone is the business time zone.

## Revision

- `NULL`: `IS NULL`, `IS DISTINCT FROM`, `coalesce`; `NOT EXISTS` over `NOT IN`.
- Outer joins: optional-side filters in `ON`.
- Fan-out: aggregate child tables before joining.
- Grouping: `GROUP BY` = output grain; `HAVING` for aggregates.
- Windows: unique `ORDER BY`, explicit frames.
- Time: `timestamptz` + `AT TIME ZONE`.

## Quick Revision

Wrong results usually come from `NULL` logic, filter placement, fan-out joins, the wrong grain, ties in window functions, or time zones. Shrink the case and count rows after each step.
