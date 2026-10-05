# Value Window Functions — Interview Questions

## Beginner

### Q1. What do LAG and LEAD do?

<details>
<summary>Answer</summary>

`lag(expr, n, default)` returns `expr` from the row n positions before the current row in the window's order; `lead` returns it from n rows after. n defaults to 1; where no such row exists the result is `NULL` or the given default. Typical use: compare each row with the previous one, e.g. `amount - lag(amount) OVER (ORDER BY month)`.

</details>

### Q2. Calculate the difference between each order's amount and the customer's previous order.

<details>
<summary>Answer</summary>

```sql
-- Illustrative
SELECT customer_id, order_date, amount,
       amount - lag(amount) OVER (PARTITION BY customer_id ORDER BY order_date, order_id) AS diff
FROM order_totals;
```

`PARTITION BY customer_id` keeps comparisons within one customer; the `order_id` tiebreaker makes "previous" well defined for same-day orders.

</details>

## Intermediate

### Q3. Why does LAST_VALUE often return the current row's value?

<details>
<summary>Answer</summary>

Because `last_value` reads the last row of the **frame**, and with `ORDER BY` in the window the default frame is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` — it ends at the current row (and its peers). Specify `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`, or use `first_value` with the reverse order.

</details>

### Q4. Write a query for month-over-month growth percentage.

<details>
<summary>Answer</summary>

```sql
-- Illustrative
SELECT month, revenue,
       round(100.0 * (revenue - lag(revenue) OVER (ORDER BY month))
             / NULLIF(lag(revenue) OVER (ORDER BY month), 0), 1) AS growth_pct
FROM monthly_revenue;
```

`NULLIF` avoids division by zero. Make sure every month exists (fill gaps with `generate_series`), because `lag` takes the previous row, not the previous calendar month.

</details>

### Q5. How do you find rows where a value changed compared with the previous row?

<details>
<summary>Answer</summary>

Compute `lag(status) OVER (PARTITION BY id ORDER BY ts)` in a subquery and keep rows where `status IS DISTINCT FROM prev_status`. `IS DISTINCT FROM` treats the first row's `NULL` previous value as different, so the initial status is kept; `<>` would drop it. This is also the first step of many "gaps and islands" solutions.

</details>

## Advanced

### Q6. How would you fill NULLs with the last known value in PostgreSQL?

<details>
<summary>Answer</summary>

PostgreSQL (through version 18) does not support `IGNORE NULLS`. Create groups that start at each non-NULL value with `count(col) OVER (ORDER BY ts)` — it only increments on non-NULLs — then take `first_value(col) OVER (PARTITION BY grp ORDER BY ts)`. Alternatively, a correlated subquery `(SELECT col FROM t t2 WHERE t2.ts <= t.ts AND col IS NOT NULL ORDER BY ts DESC LIMIT 1)` works but runs per row.

</details>

### Q7. Can LAG replace a self join? When is a self join still needed?

<details>
<summary>Answer</summary>

For "previous/next row in some order" `lag`/`lead` is simpler and needs one sort instead of a join. A self join is still needed when the related row is defined by a condition rather than a position — e.g. "the previous order more than 30 days earlier", "the employee's manager" or matching overlapping intervals.

</details>

### Q8. What does `nth_value(name, 2) OVER (ORDER BY salary DESC)` return for the first row?

<details>
<summary>Answer</summary>

`NULL` (unless the first row has a peer). With the default frame, the first row's frame contains only rows up to its last peer, so there is no second row yet. With `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING`, every row would see the partition's second row.

</details>
