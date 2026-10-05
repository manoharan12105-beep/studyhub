# Time-Series SQL Problems

**Module:** SQL Problem Solving · **Interview priority:** Core

## What Is It?

Problems over rows ordered in time: **monthly sales**, **running totals**, **month-over-month change**, **moving averages**, **time between consecutive records**, **new customers per month**, and **reports with no missing periods**. They combine three tools:

- `date_trunc` / `generate_series` to define the periods,
- `GROUP BY` to aggregate per period,
- window functions (`sum() OVER`, `lag`, frames) to compare periods.

Examples use the [sample database](../../sql-fundamentals/dbms-sample-database/content.md); its orders run from January to March 2026.

## Why It Matters

- Dashboards, finance reports and analytics queries are mostly time series.
- Interviewers ask "monthly revenue with running total", "month-over-month growth" and "fill in the missing days" to test aggregation, window frames and outer joins together.
- Time zones and month boundaries cause real production bugs.

## Core Concept

### Steps for a time-series report

1. **Bucket**: `date_trunc('month', ts)` (or `'day'`, `'week'`, `'hour'`).
2. **Aggregate**: `GROUP BY bucket`.
3. **Complete the calendar** (when empty periods must appear): `generate_series(start, end, interval '1 month')` `LEFT JOIN` the aggregates, `coalesce(…, 0)`.
4. **Compare**: window functions over the aggregated rows — `sum(x) OVER (ORDER BY bucket)` for running totals, `lag(x) OVER (ORDER BY bucket)` for change, frames for moving averages.

Window functions run after `GROUP BY`, so step 4 can use aggregates directly: `sum(sum(amount)) OVER (ORDER BY month)`.

### Window frames for time

| Frame | Meaning |
|-------|---------|
| `ORDER BY d` (default `RANGE UNBOUNDED PRECEDING`) | Running total; **rows with the same `d` are peers and get the same total** |
| `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` | Last 3 **rows**, whatever dates they have |
| `RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW` | Last 7 **calendar days** (dates may be missing) |

See [Window Functions Basics](../../window-functions/window-functions-basics/content.md) and [Value Window Functions](../../window-functions/value-window-functions/content.md).

### Half-open date ranges

Filter a month as `ts >= '2026-02-01' AND ts < '2026-03-01'`. `BETWEEN '2026-02-01' AND '2026-02-28'` misses everything after midnight on the 28th when `ts` is a timestamp. A range on the raw column can also use an index (or partition pruning); `extract(month FROM ts) = 2` cannot.

### Time zones

`timestamptz` stores an instant. "Which day did this happen?" depends on the time zone: group by `date_trunc('day', ts AT TIME ZONE 'Asia/Kolkata')`, or `date_trunc('day', ts, 'Asia/Kolkata')` (PostgreSQL 12+). See [Date and Time Types](../../postgresql-data-types/postgresql-date-time-types/content.md).

## Syntax

```sql
-- Illustrative
SELECT date_trunc('month', ts) AS month,
       sum(amount)                                           AS revenue,
       sum(sum(amount)) OVER (ORDER BY date_trunc('month', ts)) AS running_revenue,
       sum(amount) - lag(sum(amount)) OVER (ORDER BY date_trunc('month', ts)) AS change
FROM sales
GROUP BY 1
ORDER BY 1;

SELECT d::date FROM generate_series(DATE '2026-01-01', DATE '2026-01-31', interval '1 day') AS d;
```

## Examples

### E1. Monthly sales

```sql
SELECT date_trunc('month', o.order_date)::date AS month,
       count(DISTINCT o.order_id)                AS orders,
       sum(oi.quantity * oi.unit_price)          AS revenue
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
WHERE o.status <> 'CANCELLED'
GROUP BY 1
ORDER BY 1;
```

**Output:**

```text
   month    | orders | revenue
------------+--------+----------
 2026-01-01 |      2 | 73000.00
 2026-02-01 |      2 |  6500.00
 2026-03-01 |      3 | 15950.00
(3 rows)
```

`date_trunc` returns a `timestamp`; `::date` keeps the label short. `count(DISTINCT order_id)` is needed because the join produces one row per order line.

### E2. Every month in the report, even empty ones

April has no orders, but the report for January–April must show it:

```sql
WITH monthly AS (
    SELECT date_trunc('month', o.order_date) AS month,
           sum(oi.quantity * oi.unit_price) AS revenue
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.order_id
    WHERE o.status <> 'CANCELLED'
    GROUP BY 1
)
SELECT m::date AS month, coalesce(monthly.revenue, 0) AS revenue
FROM generate_series(TIMESTAMP '2026-01-01', TIMESTAMP '2026-04-01', interval '1 month') AS m
LEFT JOIN monthly ON monthly.month = m
ORDER BY m;
```

**Output:**

```text
   month    | revenue
------------+----------
 2026-01-01 | 73000.00
 2026-02-01 |  6500.00
 2026-03-01 | 15950.00
 2026-04-01 |        0
(4 rows)
```

The calendar comes from `generate_series`, so every period appears; the data is attached with a `LEFT JOIN`.

### E3. Running total of revenue

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
       sum(revenue) OVER (ORDER BY month) AS running_total
FROM monthly
ORDER BY month;
```

**Output:**

```text
   month    | revenue  | running_total
------------+----------+---------------
 2026-01-01 | 73000.00 |      73000.00
 2026-02-01 |  6500.00 |      79500.00
 2026-03-01 | 15950.00 |      95450.00
(3 rows)
```

### E4. Running total per customer, order by order

```sql
WITH order_totals AS (
    SELECT o.customer_id, o.order_id, o.order_date,
           sum(oi.quantity * oi.unit_price) AS total
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.order_id
    GROUP BY o.order_id
)
SELECT customer_id, order_id, order_date, total,
       sum(total) OVER (PARTITION BY customer_id ORDER BY order_date, order_id) AS customer_running_total
FROM order_totals
WHERE customer_id IN (1, 2)
ORDER BY customer_id, order_date;
```

**Output:**

```text
 customer_id | order_id | order_date |  total   | customer_running_total
-------------+----------+------------+----------+------------------------
           1 |      101 | 2026-01-05 | 56000.00 |               56000.00
           1 |      103 | 2026-02-03 |  1500.00 |               57500.00
           1 |      107 | 2026-03-15 | 12500.00 |               70000.00
           2 |      102 | 2026-01-12 | 17000.00 |               17000.00
           2 |      106 | 2026-03-01 |  1950.00 |               18950.00
(5 rows)
```

`GROUP BY o.order_id` may select `o.customer_id` and `o.order_date` because `order_id` is the primary key of `orders` (functional dependency). Including `order_id` in the window `ORDER BY` makes the running total well defined if a customer places two orders on the same day.

### E5. Peers in a running total

```sql
CREATE TABLE payments (paid_on date, amount int);
INSERT INTO payments VALUES ('2026-01-01', 100), ('2026-01-02', 50), ('2026-01-02', 25), ('2026-01-03', 10);

SELECT paid_on, amount,
       sum(amount) OVER (ORDER BY paid_on)                  AS range_total,
       sum(amount) OVER (ORDER BY paid_on, amount DESC ROWS UNBOUNDED PRECEDING) AS rows_total
FROM payments
ORDER BY paid_on, amount DESC;
```

**Output:**

```text
  paid_on   | amount | range_total | rows_total
------------+--------+-------------+------------
 2026-01-01 |    100 |         100 |        100
 2026-01-02 |     50 |         175 |        150
 2026-01-02 |     25 |         175 |        175
 2026-01-03 |     10 |         185 |        185
(4 rows)
```

With the default `RANGE` frame both January 2 rows are peers and show 175. With `ROWS` the total grows row by row; the tiebreaker `amount DESC` fixes which tied row comes first, otherwise that order would be arbitrary.

### E6. Month-over-month change

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
       lag(revenue) OVER (ORDER BY month)                   AS prev_revenue,
       revenue - lag(revenue) OVER (ORDER BY month)         AS change,
       round(100.0 * (revenue - lag(revenue) OVER (ORDER BY month))
             / nullif(lag(revenue) OVER (ORDER BY month), 0), 1) AS pct_change
FROM monthly
ORDER BY month;
```

**Output:**

```text
   month    | revenue  | prev_revenue |  change   | pct_change
------------+----------+--------------+-----------+------------
 2026-01-01 | 73000.00 |         NULL |      NULL |       NULL
 2026-02-01 |  6500.00 |     73000.00 | -66500.00 |      -91.1
 2026-03-01 | 15950.00 |      6500.00 |   9450.00 |      145.4
(3 rows)
```

`lag` is `NULL` for the first month, so the change is `NULL` there. `nullif(…, 0)` prevents division by zero when the previous month had no revenue. If months can be missing, build the calendar first (E2); otherwise `lag` compares with the previous **row**, which may be two months back.

### E7. Moving average: last 3 rows vs last 7 days

```sql
CREATE TABLE daily_visits (day date PRIMARY KEY, visits int NOT NULL);
INSERT INTO daily_visits VALUES
    ('2026-03-01', 100), ('2026-03-02', 120), ('2026-03-03', 90),
    ('2026-03-06', 200), ('2026-03-07', 150), ('2026-03-08', 130);

SELECT day, visits,
       round(avg(visits) OVER (ORDER BY day ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 1) AS avg_3_rows,
       round(avg(visits) OVER (ORDER BY day RANGE BETWEEN INTERVAL '2 days' PRECEDING AND CURRENT ROW), 1) AS avg_3_days
FROM daily_visits
ORDER BY day;
```

**Output:**

```text
    day     | visits | avg_3_rows | avg_3_days
------------+--------+------------+------------
 2026-03-01 |    100 |      100.0 |      100.0
 2026-03-02 |    120 |      110.0 |      110.0
 2026-03-03 |     90 |      103.3 |      103.3
 2026-03-06 |    200 |      136.7 |      200.0
 2026-03-07 |    150 |      146.7 |      175.0
 2026-03-08 |    130 |      160.0 |      160.0
(6 rows)
```

March 4 and 5 are missing. On March 6, the `ROWS` average uses March 2, 3 and 6, while the 3-day `RANGE` average uses only March 6 (March 4–6). Choose `RANGE` with an interval when "last N days" is meant.

### E8. Time between consecutive orders

```sql
SELECT customer_id, order_id, order_date,
       lag(order_date) OVER w                  AS previous_order,
       order_date - lag(order_date) OVER w     AS days_since_previous
FROM orders
WHERE customer_id IN (1, 2)
WINDOW w AS (PARTITION BY customer_id ORDER BY order_date, order_id)
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

Subtracting two `date` values gives an `integer` number of days; two `timestamp`s give an `interval`.

### E9. New customers per month

```sql
WITH firsts AS (
    SELECT customer_id, date_trunc('month', min(order_date))::date AS month
    FROM orders
    GROUP BY customer_id
)
SELECT month,
       count(*) AS new_customers,
       sum(count(*)) OVER (ORDER BY month) AS total_customers
FROM firsts
GROUP BY month
ORDER BY month;
```

**Output:**

```text
   month    | new_customers | total_customers
------------+---------------+-----------------
 2026-01-01 |             2 |               2
 2026-02-01 |             2 |               4
 2026-03-01 |             1 |               5
(3 rows)
```

A customer is "new" in the month of their first order. The month is computed once in the CTE, so `GROUP BY` and the window `ORDER BY` use the same column; repeating the expression with and without `::date` would be an error. `sum(count(*)) OVER (…)` nests an aggregate inside a window function, which works because windows run after `GROUP BY`.

### E10. Grouping instants by local day

```sql
CREATE TABLE events (id int, happened_at timestamptz);
INSERT INTO events VALUES
    (1, '2026-03-31 17:00:00+00'),
    (2, '2026-03-31 20:00:00+00'),
    (3, '2026-04-01 05:00:00+00');

SELECT (happened_at AT TIME ZONE 'UTC')::date          AS utc_day,
       (happened_at AT TIME ZONE 'Asia/Kolkata')::date AS india_day,
       count(*) AS events
FROM events
GROUP BY 1, 2
ORDER BY 1, 2;
```

**Output:**

```text
  utc_day   | india_day  | events
------------+------------+--------
 2026-03-31 | 2026-03-31 |      1
 2026-03-31 | 2026-04-01 |      1
 2026-04-01 | 2026-04-01 |      1
(3 rows)
```

Event 2 happened on 31 March in UTC but at 01:30 on 1 April in India (UTC+05:30). A "daily report for India" must convert before truncating; otherwise late-evening UTC events land on the wrong day.

## Comparison

| Task | Tool |
|------|------|
| Bucket by period | `date_trunc('month', ts)` |
| Include empty periods | `generate_series(…)` + `LEFT JOIN` + `coalesce` |
| Running total | `sum(x) OVER (ORDER BY t)` (add tiebreaker, or `ROWS`) |
| Running total per group | `sum(x) OVER (PARTITION BY g ORDER BY t)` |
| Change vs previous period | `x - lag(x) OVER (ORDER BY t)` |
| Percentage change | `100.0 * (x - prev) / nullif(prev, 0)` |
| Last N rows | `ROWS BETWEEN N-1 PRECEDING AND CURRENT ROW` |
| Last N days | `RANGE BETWEEN INTERVAL 'N-1 days' PRECEDING AND CURRENT ROW` |
| Gap between records | `t - lag(t) OVER (PARTITION BY g ORDER BY t)` |
| Local-day reports | `AT TIME ZONE 'zone'` before truncating |

## Common Mistakes

- `BETWEEN '2026-02-01' AND '2026-02-28'` on timestamps — misses the last day after midnight; use half-open ranges.
- Filtering with `extract(month FROM ts) = 2` — ignores the year and cannot use an index.
- Forgetting empty periods, so charts skip months and `lag` compares the wrong periods.
- Running totals over non-unique `ORDER BY` with the default `RANGE` frame (peers share a value).
- `ROWS` frames for "last 7 days" when dates have gaps.
- Integer division in percentages (`100 * a / b` with integers) — multiply by `100.0`.
- Truncating `timestamptz` in the session time zone instead of the business time zone.

## Revision

- Bucket (`date_trunc`) → aggregate (`GROUP BY`) → complete calendar (`generate_series` + `LEFT JOIN`) → compare (window functions).
- Running total: `sum(x) OVER (ORDER BY t)`; per group with `PARTITION BY`; aggregates can be nested: `sum(sum(x)) OVER (…)`.
- Change: `x - lag(x) OVER (ORDER BY t)`; percentage with `nullif(prev, 0)`.
- Moving windows: `ROWS` = last N rows, `RANGE INTERVAL` = last N days.
- Half-open ranges; time zones before truncating.

## Quick Revision

Time series = `date_trunc` buckets, `GROUP BY`, `generate_series` + `LEFT JOIN` for empty periods, then `sum() OVER` for running totals, `lag()` for change, and `ROWS`/`RANGE` frames for moving averages.
