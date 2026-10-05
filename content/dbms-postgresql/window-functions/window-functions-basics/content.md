# Window Functions: OVER, PARTITION BY and Frames

**Module:** Window Functions · **Interview priority:** Core

## What Is It?

A **window function** computes a value for each row from a set of related rows — its **window** — without collapsing those rows into one. It is written as a function followed by `OVER (…)`.

```sql
-- Illustrative: every employee keeps their row, and also sees the department average
SELECT name, dept_id, salary,
       avg(salary) OVER (PARTITION BY dept_id) AS dept_avg
FROM employees;
```

`GROUP BY` returns one row per group; a window function returns every row plus a value computed over its group (or over a sliding range of rows).

## Why It Matters

- Running totals, moving averages, rankings, top-N per group, previous/next row comparisons, percentages of a total — all are short, single-pass queries with window functions and awkward without them.
- They are among the most tested topics in SQL interviews, especially "top N per group" and "difference from previous row".
- The default frame contains a trap with ties that silently changes running totals.

## Core Concept

### Anatomy of OVER

```text
function(args) OVER (
    PARTITION BY …      ← split rows into independent groups (optional)
    ORDER BY …          ← order rows inside each partition (optional)
    frame_clause        ← which rows around the current row are included (optional)
)
```

- **`OVER ()`** — the window is the whole result set.
- **`PARTITION BY`** — like `GROUP BY` without collapsing: each row sees only the rows of its own partition. `NULL` keys form one partition.
- **`ORDER BY`** — defines the order within a partition; needed for ranking, `lag`/`lead` and running calculations.
- **Frame** — the subset of the partition used for aggregate and `first_value`/`last_value`/`nth_value` functions, relative to the current row.

> [!NOTE]
> `PARTITION BY` in a window has nothing to do with **table partitioning** (`CREATE TABLE … PARTITION BY RANGE`), which physically splits a table — see [Table Partitioning](../../partitioning/table-partitioning/content.md).

### Kinds of window functions

| Kind | Functions | Uses the frame? |
|------|-----------|-----------------|
| Aggregate | `sum`, `avg`, `count`, `min`, `max`, `string_agg`, … with `OVER` | Yes |
| Ranking | `row_number`, `rank`, `dense_rank`, `percent_rank`, `cume_dist`, `ntile` | No — whole partition order |
| Value / offset | `lag`, `lead` | No — offset from current row |
| Value / frame | `first_value`, `last_value`, `nth_value` | Yes |

Ranking and value functions are covered in [Ranking Window Functions](../ranking-window-functions/content.md) and [Value Window Functions](../value-window-functions/content.md).

### Frames

A frame is written `{ROWS | RANGE | GROUPS} BETWEEN start AND end`, where start/end are:

`UNBOUNDED PRECEDING` · `n PRECEDING` · `CURRENT ROW` · `n FOLLOWING` · `UNBOUNDED FOLLOWING`

| Mode | Counts in units of | `1 PRECEDING` means |
|------|--------------------|---------------------|
| `ROWS` | Physical rows | The previous row |
| `RANGE` | Values of the single `ORDER BY` column | Rows whose order value is ≥ current value − 1 (number, or interval for dates) |
| `GROUPS` | Peer groups (rows with equal `ORDER BY` values) | The previous group of tied rows |

Rows with equal `ORDER BY` values are **peers**.

### The default frame (and the tie trap)

| Window has `ORDER BY`? | Default frame |
|------------------------|---------------|
| No | The whole partition |
| Yes | `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` — from the start **through the last peer** of the current row |

So `sum(salary) OVER (ORDER BY salary)` is a running total in which **tied rows get the same total** (both include each other). For a strict row-by-row running total use `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` **and** make the `ORDER BY` unique (add a key), or the order among ties is arbitrary.

The default frame also explains why `last_value(x) OVER (ORDER BY …)` usually returns the current row's value instead of the partition's last.

### Naming windows: the WINDOW clause

When several functions share a window, name it once:

```sql
-- Illustrative
SELECT name, sum(salary) OVER w, avg(salary) OVER w
FROM employees
WINDOW w AS (PARTITION BY dept_id);
```

### Where window functions fit

- Evaluated after `WHERE`, `GROUP BY` and `HAVING`, before `DISTINCT`, `ORDER BY` and `LIMIT` ([Logical Query Processing Order](../../aggregation-and-grouping/logical-query-processing-order/content.md)).
- Allowed only in the select list and `ORDER BY`. To filter on them, wrap the query.
- They may contain aggregates when the query is grouped: `sum(count(*)) OVER ()`.

### How PostgreSQL executes them

- A `WindowAgg` node processes rows already sorted by `PARTITION BY` + `ORDER BY`; each distinct window specification may need its own sort.
- An index matching the partition and order keys can remove the sort.
- PostgreSQL 15+ adds a **run condition**: for `WHERE rn <= 3` on an outer `row_number()`, the `WindowAgg` stops producing rows once the condition can no longer be true.

## Syntax

```sql
-- Illustrative
function_name(args) [FILTER (WHERE …)] OVER (
    [PARTITION BY expr, …]
    [ORDER BY expr [ASC | DESC] [NULLS FIRST | LAST], …]
    [{ROWS | RANGE | GROUPS} BETWEEN frame_start AND frame_end [EXCLUDE …]]
)
-- or: OVER window_name, with WINDOW window_name AS (…) after HAVING
```

## Examples

### Group value next to every row

```sql
SELECT name, dept_id, salary,
       round(avg(salary) OVER (PARTITION BY dept_id)) AS dept_avg,
       salary - round(avg(salary) OVER (PARTITION BY dept_id)) AS diff
FROM employees
WHERE dept_id IN (10, 20)
ORDER BY dept_id, salary DESC, name;
```

**Output:**

```text
 name  | dept_id | salary | dept_avg |  diff
-------+---------+--------+----------+--------
 Asha  |      10 | 150000 |   103000 |  47000
 Meena |      10 |  95000 |   103000 |  -8000
 Ravi  |      10 |  95000 |   103000 |  -8000
 Karan |      10 |  72000 |   103000 | -31000
 Divya |      20 |  88000 |    65750 |  22250
 Arjun |      20 |  60000 |    65750 |  -5750
 Sneha |      20 |  60000 |    65750 |  -5750
 Rahul |      20 |  55000 |    65750 | -10750
(8 rows)
```

### Percentage of the total

```sql
SELECT name, salary,
       round(100.0 * salary / sum(salary) OVER (), 1) AS pct_of_payroll
FROM employees
ORDER BY salary DESC, name
LIMIT 4;
```

**Output:**

```text
 name  | salary | pct_of_payroll
-------+--------+----------------
 Asha  | 150000 |           16.2
 Meena |  95000 |           10.3
 Ravi  |  95000 |           10.3
 Divya |  88000 |            9.5
(4 rows)
```

`OVER ()` makes the window the whole result. Note that `LIMIT` runs after the window function, so the percentages are of the full payroll (924000).

### Running total: the default frame and ties

```sql
SELECT name, salary,
       sum(salary) OVER (ORDER BY salary) AS default_frame,
       sum(salary) OVER (ORDER BY salary, emp_id
                         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS rows_frame
FROM employees
ORDER BY salary, emp_id;
```

**Output:**

```text
  name  | salary | default_frame | rows_frame
--------+--------+---------------+------------
 Nisha  |  45000 |         45000 |      45000
 Pooja  |  52000 |         97000 |      97000
 Rahul  |  55000 |        152000 |     152000
 Arjun  |  60000 |        272000 |     212000
 Sneha  |  60000 |        272000 |     272000
 Vikram |  70000 |        342000 |     342000
 Karan  |  72000 |        414000 |     414000
 Farhan |  82000 |        496000 |     496000
 Divya  |  88000 |        584000 |     584000
 Ravi   |  95000 |        774000 |     679000
 Meena  |  95000 |        774000 |     774000
 Asha   | 150000 |        924000 |     924000
(12 rows)
```

Arjun and Sneha (60000) are peers in the default `RANGE` frame, so both show 272000; Ravi and Meena both show 774000. The `ROWS` frame with a unique order (`salary, emp_id`) gives a strict running total.

### Running total per partition

Cumulative spending per customer, order by order:

```sql
WITH order_totals AS (
    SELECT o.order_id, o.customer_id, o.order_date,
           sum(oi.quantity * oi.unit_price) AS amount
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.order_id
    WHERE o.status <> 'CANCELLED'
    GROUP BY o.order_id
)
SELECT customer_id, order_id, order_date, amount,
       sum(amount) OVER (PARTITION BY customer_id ORDER BY order_date
                         ROWS UNBOUNDED PRECEDING) AS running_total
FROM order_totals
ORDER BY customer_id, order_date;
```

**Output:**

```text
 customer_id | order_id | order_date |  amount  | running_total
-------------+----------+------------+----------+---------------
           1 |      101 | 2026-01-05 | 56000.00 |      56000.00
           1 |      103 | 2026-02-03 |  1500.00 |      57500.00
           1 |      107 | 2026-03-15 | 12500.00 |      70000.00
           2 |      102 | 2026-01-12 | 17000.00 |      17000.00
           2 |      106 | 2026-03-01 |  1950.00 |      18950.00
           4 |      105 | 2026-02-20 |  5000.00 |       5000.00
           5 |      108 | 2026-03-28 |  1500.00 |       1500.00
(7 rows)
```

`ROWS UNBOUNDED PRECEDING` is short for `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. The total restarts for each customer.

### Moving average: ROWS frame

Average of the current and two previous orders (by date, all statuses):

```sql
WITH order_totals AS (
    SELECT o.order_id, o.order_date, sum(oi.quantity * oi.unit_price) AS amount
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.order_id
    GROUP BY o.order_id
)
SELECT order_id, order_date, amount,
       round(avg(amount) OVER (ORDER BY order_date
                               ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS moving_avg_3
FROM order_totals
ORDER BY order_date;
```

**Output:**

```text
 order_id | order_date |  amount  | moving_avg_3
----------+------------+----------+--------------
      101 | 2026-01-05 | 56000.00 |     56000.00
      102 | 2026-01-12 | 17000.00 |     36500.00
      103 | 2026-02-03 |  1500.00 |     24833.33
      104 | 2026-02-14 | 55000.00 |     24500.00
      105 | 2026-02-20 |  5000.00 |     20500.00
      106 | 2026-03-01 |  1950.00 |     20650.00
      107 | 2026-03-15 | 12500.00 |      6483.33
      108 | 2026-03-28 |  1500.00 |      5316.67
(8 rows)
```

The first two rows average over fewer than three orders — the frame is cut at the partition start.

### RANGE with an interval: a time window

Number of orders placed in the 30 days up to and including each order's date:

```sql
SELECT order_id, order_date,
       count(*) OVER (ORDER BY order_date
                      RANGE BETWEEN INTERVAL '30 days' PRECEDING AND CURRENT ROW) AS orders_last_30_days
FROM orders
ORDER BY order_date;
```

**Output:**

```text
 order_id | order_date | orders_last_30_days
----------+------------+---------------------
      101 | 2026-01-05 |                   1
      102 | 2026-01-12 |                   2
      103 | 2026-02-03 |                   3
      104 | 2026-02-14 |                   2
      105 | 2026-02-20 |                   3
      106 | 2026-03-01 |                   4
      107 | 2026-03-15 |                   4
      108 | 2026-03-28 |                   3
(8 rows)
```

`RANGE` with an offset looks at **values**, not row counts — the right tool when dates have gaps or duplicates.

### Named window

```sql
SELECT name, dept_id, salary,
       min(salary) OVER w AS dept_min,
       max(salary) OVER w AS dept_max,
       count(*)    OVER w AS dept_size
FROM employees
WHERE dept_id = 20
WINDOW w AS (PARTITION BY dept_id)
ORDER BY salary DESC, name;
```

**Output:**

```text
 name  | dept_id | salary | dept_min | dept_max | dept_size
-------+---------+--------+----------+----------+-----------
 Divya |      20 |  88000 |    55000 |    88000 |         4
 Arjun |      20 |  60000 |    55000 |    88000 |         4
 Sneha |      20 |  60000 |    55000 |    88000 |         4
 Rahul |      20 |  55000 |    55000 |    88000 |         4
(4 rows)
```

### GROUP BY vs window function

```sql
SELECT dept_id, count(*) AS headcount
FROM employees
WHERE dept_id = 30
GROUP BY dept_id;
```

**Output:**

```text
 dept_id | headcount
---------+-----------
      30 |         2
(1 row)
```

```sql
SELECT name, dept_id, count(*) OVER (PARTITION BY dept_id) AS headcount
FROM employees
WHERE dept_id = 30
ORDER BY name;
```

**Output:**

```text
  name  | dept_id | headcount
--------+---------+-----------
 Pooja  |      30 |         2
 Vikram |      30 |         2
(2 rows)
```

### Run condition in the plan

```sql
EXPLAIN (COSTS OFF)
SELECT *
FROM (SELECT name, salary, row_number() OVER (ORDER BY salary DESC) AS rn
      FROM employees) AS t
WHERE rn <= 3;
```

**Output:**

```text
                              QUERY PLAN
----------------------------------------------------------------------
 WindowAgg
   Window: w1 AS (ORDER BY employees.salary ROWS UNBOUNDED PRECEDING)
   Run Condition: (row_number() OVER w1 <= 3)
   ->  Sort
         Sort Key: employees.salary DESC
         ->  Seq Scan on employees
(6 rows)
```

`Run Condition` tells the `WindowAgg` to stop once `row_number` exceeds 3, instead of numbering every row and filtering afterwards. (PostgreSQL also rewrote the frame of `row_number` to `ROWS UNBOUNDED PRECEDING`, which is cheaper and gives the same numbers.)

## Comparison

### GROUP BY vs window functions

| | `GROUP BY` | Window function |
|---|---|---|
| Output rows | One per group | One per input row |
| Access to individual row columns | Only grouped columns | All columns |
| Can compute | Aggregates | Aggregates, rankings, offsets, running/moving values |
| Filter on result | `HAVING` | Wrap in a subquery/CTE |

### ROWS vs RANGE vs GROUPS

| | `ROWS` | `RANGE` | `GROUPS` |
|---|---|---|---|
| Unit | Row | Value of the order key | Set of peers |
| Ties | Treated as separate rows (order among them arbitrary unless the key is unique) | Peers always together | Peers always together |
| Offset (`n PRECEDING`) | n rows | Value distance (numbers, dates with intervals); needs a single `ORDER BY` column | n peer groups |
| Typical use | Moving average of last n rows, strict running total | Time windows ("last 30 days") | "Last n distinct values" |

## Common Mistakes

- Using the default frame for a running total and getting equal totals for tied rows.
- A `ROWS` frame over a non-unique `ORDER BY` — the result depends on an arbitrary tie order.
- Expecting `last_value` with `ORDER BY` to return the partition's last value (the default frame ends at the current row).
- Filtering a window result in `WHERE`.
- Forgetting that `WHERE` runs first: filtering rows changes what the window sees (percentages of a filtered total).
- Confusing window `PARTITION BY` with table partitioning.

## Revision

- `f(…) OVER (PARTITION BY … ORDER BY … frame)` — a value per row from related rows, without collapsing.
- No `ORDER BY` → frame = whole partition. With `ORDER BY` → default `RANGE UNBOUNDED PRECEDING … CURRENT ROW`, which includes the current row's peers.
- `ROWS` counts rows, `RANGE` compares values, `GROUPS` counts peer groups.
- Evaluated after `HAVING`; filter on them in an outer query; `WINDOW w AS (…)` names a window.
- PostgreSQL: `WindowAgg` over sorted input; run conditions stop early for `row_number() <= n`-style filters.

## Quick Revision

A window function adds a value computed over related rows to every row, defined by PARTITION BY, ORDER BY and a frame. With ORDER BY the default frame runs to the current row's last peer, so use ROWS and a unique order for strict running totals.
