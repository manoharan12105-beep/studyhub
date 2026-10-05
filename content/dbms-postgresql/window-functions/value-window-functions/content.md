# Value Window Functions: LAG, LEAD, FIRST_VALUE, LAST_VALUE

**Module:** Window Functions · **Interview priority:** Frequently asked

## What Is It?

**Value window functions** return a value taken from another row of the window:

| Function | Returns the value from |
|----------|------------------------|
| `lag(expr [, offset [, default]])` | The row `offset` rows **before** the current row (default offset 1) |
| `lead(expr [, offset [, default]])` | The row `offset` rows **after** the current row |
| `first_value(expr)` | The first row of the **frame** |
| `last_value(expr)` | The last row of the **frame** |
| `nth_value(expr, n)` | The nth row of the **frame** (NULL if the frame has fewer rows) |

`lag` and `lead` move by row positions in the partition's order and ignore the frame; the other three depend on the frame.

## Why It Matters

- "Compare each row with the previous one" — month-over-month growth, days between orders, price changes, detecting status changes — is a very common interview and reporting task. Without `lag` it needs a self join on "the previous row", which is awkward and slow.
- `last_value` returning the "wrong" value is a classic trap caused by the default frame.

## Core Concept

### LAG and LEAD

```text
order_date   amount   lag(amount)   lead(amount)
2026-01-05   56000    NULL          1500
2026-02-03    1500    56000         12500
2026-03-15   12500    1500          NULL
```

- At the partition edges there is no previous/next row: the result is `NULL`, or the third argument if given (`lag(amount, 1, 0)`).
- The offset can be larger than 1: `lag(amount, 12)` = same month last year in monthly data.
- They require an `ORDER BY` in the window to be meaningful. Make it unique, or rows with equal sort keys may swap.

### FIRST_VALUE, LAST_VALUE, NTH_VALUE and the frame

These read from the **frame**, and the default frame with `ORDER BY` is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`:

- `first_value` works as expected: the frame always starts at the partition's first row.
- `last_value` returns the **last row of the frame** — the current row (or its last peer), not the last row of the partition.
- `nth_value(x, 3)` is `NULL` for the first two rows, because their frames do not yet contain a third row.

Fix: give a full-partition frame:

```sql
-- Illustrative
last_value(name) OVER (PARTITION BY dept_id ORDER BY salary DESC
                       ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
```

Often simpler: `first_value` with the opposite sort order.

### NULL handling

The SQL standard defines `IGNORE NULLS` (e.g. `lag(x) IGNORE NULLS`), but PostgreSQL 18 does not support it — it is a syntax error. To carry the last non-NULL value forward, use the grouping trick shown in the examples.

## Syntax

```sql
-- Illustrative
lag(expr [, offset [, default]])  OVER (PARTITION BY … ORDER BY …)
lead(expr [, offset [, default]]) OVER (PARTITION BY … ORDER BY …)
first_value(expr) OVER (… [frame])
last_value(expr)  OVER (… ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)
nth_value(expr, n) OVER (… [frame])
```

## Examples

### Days between a customer's orders

```sql
SELECT customer_id, order_id, order_date,
       lag(order_date) OVER w                AS previous_order,
       order_date - lag(order_date) OVER w   AS days_since_previous
FROM orders
WHERE customer_id IN (1, 2)
WINDOW w AS (PARTITION BY customer_id ORDER BY order_date)
ORDER BY customer_id, order_date;
```

**Output:**

```text
 customer_id | order_id | order_date | previous_order | days_since_previous
-------------+----------+------------+----------------+---------------------
           1 |      101 | 2026-01-05 | NULL           |                NULL
           1 |      103 | 2026-02-03 | 2026-01-05     |                  29
           1 |      107 | 2026-03-15 | 2026-02-03     |                  40
           2 |      102 | 2026-01-12 | NULL           |                NULL
           2 |      106 | 2026-03-01 | 2026-01-12     |                  48
(5 rows)
```

`date - date` is an integer number of days. Each customer's first order has no previous order.

### Month-over-month revenue change

```sql
WITH monthly AS (
    SELECT date_trunc('month', o.order_date)::date AS month,
           sum(oi.quantity * oi.unit_price) AS revenue
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.order_id
    WHERE o.status <> 'CANCELLED'
    GROUP BY 1
)
SELECT month, revenue,
       lag(revenue) OVER (ORDER BY month) AS previous,
       revenue - lag(revenue) OVER (ORDER BY month) AS change,
       round(100 * (revenue - lag(revenue) OVER (ORDER BY month))
                 / lag(revenue) OVER (ORDER BY month), 1) AS pct_change
FROM monthly
ORDER BY month;
```

**Output:**

```text
   month    | revenue  | previous |  change   | pct_change
------------+----------+----------+-----------+------------
 2026-01-01 | 73000.00 |     NULL |      NULL |       NULL
 2026-02-01 |  6500.00 | 73000.00 | -66500.00 |      -91.1
 2026-03-01 | 15950.00 |  6500.00 |   9450.00 |      145.4
(3 rows)
```

If a previous month's revenue could be 0, wrap the divisor in `NULLIF(…, 0)`. If months can be missing entirely, `lag` compares with the previous **existing** month — fill gaps with `generate_series` first.

### lead with a default

Each hire and the next hire date in the company (the last gets a placeholder):

```sql
SELECT name, hire_date,
       lead(name, 1, '(none yet)') OVER (ORDER BY hire_date) AS next_hire
FROM employees
WHERE hire_date >= '2021-01-01'
ORDER BY hire_date;
```

**Output:**

```text
 name  | hire_date  | next_hire
-------+------------+------------
 Karan | 2021-08-20 | Sneha
 Sneha | 2022-01-03 | Pooja
 Pooja | 2023-03-01 | Nisha
 Nisha | 2024-02-15 | Rahul
 Rahul | 2024-06-01 | (none yet)
(5 rows)
```

### first_value: the top earner beside everyone

```sql
SELECT dept_id, name, salary,
       first_value(name) OVER (PARTITION BY dept_id ORDER BY salary DESC, emp_id) AS top_earner
FROM employees
WHERE dept_id IN (10, 20)
ORDER BY dept_id, salary DESC, emp_id;
```

**Output:**

```text
 dept_id | name  | salary | top_earner
---------+-------+--------+------------
      10 | Asha  | 150000 | Asha
      10 | Ravi  |  95000 | Asha
      10 | Meena |  95000 | Asha
      10 | Karan |  72000 | Asha
      20 | Divya |  88000 | Divya
      20 | Arjun |  60000 | Divya
      20 | Sneha |  60000 | Divya
      20 | Rahul |  55000 | Divya
(8 rows)
```

### The last_value trap

```sql
SELECT dept_id, name, salary,
       last_value(name) OVER (PARTITION BY dept_id ORDER BY salary DESC, emp_id) AS default_frame,
       last_value(name) OVER (PARTITION BY dept_id ORDER BY salary DESC, emp_id
                              ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS full_frame
FROM employees
WHERE dept_id IN (10, 20)
ORDER BY dept_id, salary DESC, emp_id;
```

**Output:**

```text
 dept_id | name  | salary | default_frame | full_frame
---------+-------+--------+---------------+------------
      10 | Asha  | 150000 | Asha          | Karan
      10 | Ravi  |  95000 | Ravi          | Karan
      10 | Meena |  95000 | Meena         | Karan
      10 | Karan |  72000 | Karan         | Karan
      20 | Divya |  88000 | Divya         | Rahul
      20 | Arjun |  60000 | Arjun         | Rahul
      20 | Sneha |  60000 | Sneha         | Rahul
      20 | Rahul |  55000 | Rahul         | Rahul
(8 rows)
```

With the default frame, each row's frame ends at itself, so `last_value` is the row's own name. The full frame gives the lowest earner of the department.

### nth_value

Second-highest earner of each department, shown on every row:

```sql
SELECT dept_id, name, salary,
       nth_value(name, 2) OVER (PARTITION BY dept_id ORDER BY salary DESC, emp_id
                                ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS second
FROM employees
WHERE dept_id IN (20, 40)
ORDER BY dept_id, salary DESC, emp_id;
```

**Output:**

```text
 dept_id |  name  | salary | second
---------+--------+--------+--------
      20 | Divya  |  88000 | Arjun
      20 | Arjun  |  60000 | Arjun
      20 | Sneha  |  60000 | Arjun
      20 | Rahul  |  55000 | Arjun
      40 | Farhan |  82000 | NULL
(5 rows)
```

Finance has one employee, so there is no second row: `NULL`.

### Detecting changes

Status history of shipments — find rows where the status differs from the previous row:

**Schema and data:**

```sql
CREATE TABLE shipment_events (shipment_id int, event_time timestamp, status text);
INSERT INTO shipment_events VALUES
    (1, '2026-03-01 09:00', 'PACKED'),
    (1, '2026-03-01 12:00', 'PACKED'),
    (1, '2026-03-02 08:00', 'IN_TRANSIT'),
    (1, '2026-03-03 10:00', 'IN_TRANSIT'),
    (1, '2026-03-03 18:00', 'DELIVERED');
```

```sql
SELECT event_time, status
FROM (SELECT event_time, status,
             lag(status) OVER (PARTITION BY shipment_id ORDER BY event_time) AS prev_status
      FROM shipment_events) AS t
WHERE prev_status IS DISTINCT FROM status
ORDER BY event_time;
```

**Output:**

```text
     event_time      |   status
---------------------+------------
 2026-03-01 09:00:00 | PACKED
 2026-03-02 08:00:00 | IN_TRANSIT
 2026-03-03 18:00:00 | DELIVERED
(3 rows)
```

`IS DISTINCT FROM` keeps the first row too, whose `prev_status` is `NULL` (`<>` would give UNKNOWN and drop it).

### Carrying the last non-NULL value forward (no IGNORE NULLS)

**Schema and data:**

```sql
CREATE TABLE readings (reading_time int, temperature numeric);
INSERT INTO readings VALUES (1, 30.5), (2, NULL), (3, NULL), (4, 31.0), (5, NULL);
```

```sql
SELECT reading_time, temperature,
       first_value(temperature) OVER (PARTITION BY grp ORDER BY reading_time) AS filled
FROM (SELECT reading_time, temperature,
             count(temperature) OVER (ORDER BY reading_time) AS grp
      FROM readings) AS t
ORDER BY reading_time;
```

**Output:**

```text
 reading_time | temperature | filled
--------------+-------------+--------
            1 |        30.5 |   30.5
            2 |        NULL |   30.5
            3 |        NULL |   30.5
            4 |        31.0 |   31.0
            5 |        NULL |   31.0
(5 rows)
```

`count(temperature)` counts only non-NULL values, so it increases exactly at each real reading. Rows after a reading share its group number, and `first_value` within the group is that reading.

## Comparison

### LAG/LEAD vs self join

| | `lag`/`lead` | Self join on "previous row" |
|---|---|---|
| Expressing "previous" | Built in (by window order) | Needs a row number or a correlated `max(date) < current` |
| Passes over the data | One sort + one scan | Two scans + join |
| Ties in the order | Need a unique order | Same problem, harder to see |
| Portability | All modern databases | Everywhere |

## Common Mistakes

- `last_value` with the default frame, expecting the partition's last row.
- `lag`/`lead` over a non-unique `ORDER BY`, so tied rows swap neighbours.
- Forgetting `PARTITION BY`, so the first order of customer 2 is compared with the last order of customer 1.
- Using `<>` against `lag(...)` and losing the first row of each partition (`NULL`); use `IS DISTINCT FROM`.
- Writing `IGNORE NULLS` in PostgreSQL 18 (not supported).
- Computing month-over-month changes when months are missing — `lag` takes the previous existing row, not the previous calendar month.

## Revision

- `lag`/`lead(expr, offset, default)`: value from n rows before/after in window order; frame ignored; `NULL` (or default) at edges.
- `first_value`/`last_value`/`nth_value`: from the frame — use `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` for whole-partition answers.
- Change detection: compare with `lag(...)` using `IS DISTINCT FROM`.
- PostgreSQL 18 has no `IGNORE NULLS`; carry values forward with a `count(col)` group plus `first_value`.

## Quick Revision

lag and lead read the row n positions before or after; first_value, last_value and nth_value read the frame, so last_value needs a full frame. Always give a unique ORDER BY, partition per entity, and compare with IS DISTINCT FROM.
