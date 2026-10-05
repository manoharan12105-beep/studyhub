# Time-Series SQL Problems — Interview Questions

## Beginner

### Q1. How do you compute monthly sales?

<details>
<summary>Answer</summary>

Bucket the timestamp with `date_trunc('month', …)` and group by it:

```sql
-- Illustrative
SELECT date_trunc('month', ordered_at) AS month, sum(amount) AS revenue
FROM orders
GROUP BY 1
ORDER BY 1;
```

`to_char(ordered_at, 'YYYY-MM')` also works but returns text. Use it for display, not for sorting or joining with a calendar.

</details>

### Q2. How do you write a running total?

<details>
<summary>Answer</summary>

A window `sum` with an `ORDER BY`:

```sql
-- Illustrative
SELECT day, amount, sum(amount) OVER (ORDER BY day) AS running_total FROM daily_sales;
```

The default frame is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. Rows with equal `day` values are peers and get the same total, so add a tiebreaker or use `ROWS UNBOUNDED PRECEDING` when rows must accumulate one by one. Add `PARTITION BY customer_id` for a running total per customer.

</details>

### Q3. Why is `WHERE created_at BETWEEN '2026-02-01' AND '2026-02-28'` a bug?

<details>
<summary>Answer</summary>

If `created_at` is a `timestamp`, `'2026-02-28'` means midnight at the start of the 28th, so the whole last day is excluded. Use a half-open range: `created_at >= '2026-02-01' AND created_at < '2026-03-01'`. It works for every month length and data type, and it can use an index on `created_at`.

</details>

## Intermediate

### Q4. How do you include months that have no sales?

<details>
<summary>Answer</summary>

Generate the calendar and left join the data:

```sql
-- Illustrative
SELECT m AS month, coalesce(s.revenue, 0) AS revenue
FROM generate_series(TIMESTAMP '2026-01-01', TIMESTAMP '2026-12-01', interval '1 month') AS m
LEFT JOIN (SELECT date_trunc('month', ordered_at) AS month, sum(amount) AS revenue
           FROM orders GROUP BY 1) s ON s.month = m
ORDER BY m;
```

`GROUP BY` can only produce periods that have rows; `generate_series` produces every period.

</details>

### Q5. Calculate month-over-month growth in percent.

<details>
<summary>Answer</summary>

```sql
-- Illustrative
SELECT month, revenue,
       round(100.0 * (revenue - lag(revenue) OVER (ORDER BY month))
             / nullif(lag(revenue) OVER (ORDER BY month), 0), 1) AS pct_change
FROM monthly_revenue;
```

- `lag` reads the previous row's value (`NULL` for the first).
- `100.0` avoids integer division.
- `nullif(…, 0)` avoids division by zero.
- If months can be missing, complete the calendar first, or `lag` compares with whatever row came before.

</details>

### Q6. What is the difference between `ROWS` and `RANGE` frames for a 7-day moving average?

<details>
<summary>Answer</summary>

`ROWS BETWEEN 6 PRECEDING AND CURRENT ROW` takes the previous 6 **rows**. If some days have no row, it reaches further back than 7 days. `RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW` takes rows whose date is within 6 days of the current one — a true 7-calendar-day window (PostgreSQL 11+ supports offsets in `RANGE`). With one row per day and no gaps the two are equal.

</details>

### Q7. How do you find the number of days between a customer's consecutive orders?

<details>
<summary>Answer</summary>

```sql
SELECT customer_id, order_id, order_date,
       order_date - lag(order_date) OVER (PARTITION BY customer_id ORDER BY order_date, order_id) AS gap_days
FROM orders
WHERE customer_id = 1
ORDER BY order_date;
```

**Output:**

```text
 customer_id | order_id | order_date | gap_days
-------------+----------+------------+----------
           1 |      101 | 2026-01-05 |     NULL
           1 |      103 | 2026-02-03 |       29
           1 |      107 | 2026-03-15 |       40
(3 rows)
```

`date - date` is an integer number of days; for timestamps the result is an `interval`. Average gap per customer: wrap in a subquery and `avg(gap_days)`.

</details>

## Advanced

### Q8. A daily report for Indian users shows some orders on the wrong day. Why?

<details>
<summary>Answer</summary>

The `timestamptz` values are being truncated in the session time zone (often UTC). An order at 20:00 UTC on 31 March is 01:30 on 1 April in India. Convert to the business time zone before truncating: `date_trunc('day', ordered_at AT TIME ZONE 'Asia/Kolkata')`, or `date_trunc('day', ordered_at, 'Asia/Kolkata')`. Do the same for filters ("orders on 1 April IST" = `ordered_at >= '2026-04-01 00:00+05:30' AND ordered_at < '2026-04-02 00:00+05:30'`).

</details>

### Q9. A dashboard query aggregates 3 years of events every minute and is slow. What can you do?

<details>
<summary>Answer</summary>

- Filter by a half-open time range on the raw column, with a B-tree index (or BRIN for append-only data) on the timestamp.
- Partition the table by month so old partitions are pruned and dropped cheaply.
- Pre-aggregate: a summary table (daily totals) maintained incrementally, or a materialized view refreshed on a schedule. The dashboard then reads hundreds of rows instead of millions.
- Only the current day needs live aggregation; combine it with the stored history.
- Check `EXPLAIN (ANALYZE, BUFFERS)` before and after.

</details>

### Q10. How do you compute a running total that resets every month?

<details>
<summary>Answer</summary>

Partition by the month:

```sql
-- Illustrative
SELECT day, amount,
       sum(amount) OVER (PARTITION BY date_trunc('month', day) ORDER BY day) AS month_to_date
FROM daily_sales;
```

`PARTITION BY` restarts the window for each month. The same idea gives year-to-date (`date_trunc('year', …)`) or per-customer totals.

</details>
