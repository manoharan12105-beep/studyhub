# Debugging Wrong Query Results — Interview Questions

## Beginner

### Q1. A query with `WHERE manager_id = NULL` returns nothing. Why, and what is the fix?

<details>
<summary>Answer</summary>

Any comparison with `NULL` is unknown, never true, so `WHERE` discards every row. Use `WHERE manager_id IS NULL`. For "equal, treating two `NULL`s as equal" use `a IS NOT DISTINCT FROM b`.

</details>

### Q2. Your report has duplicate rows. What do you check before adding `DISTINCT`?

<details>
<summary>Answer</summary>

Whether a join multiplies rows: a one-to-many join (orders → items, customers → addresses), a missing or partial join condition (an accidental cross join), or a join on a non-unique column. Run the `FROM … JOIN` part with `count(*)` after each join and compare with the expected count. Fix the join or aggregate first. `DISTINCT` hides the symptom and still leaves sums wrong.

</details>

### Q3. After adding `WHERE o.status = 'PAID'`, customers without orders vanished from a `LEFT JOIN` report. Why?

<details>
<summary>Answer</summary>

For customers without orders, `o.status` is `NULL`, so the `WHERE` condition is unknown and removes them; the left join effectively became an inner join. Move the condition into the `ON` clause: `LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status = 'PAID'`.

</details>

## Intermediate

### Q4. `SELECT … WHERE id NOT IN (SELECT ref_id FROM other)` suddenly returns zero rows in production. What happened?

<details>
<summary>Answer</summary>

A `NULL` appeared in `other.ref_id`. `NOT IN` is `id <> v1 AND id <> v2 AND …`, and `id <> NULL` is unknown, so no row qualifies. It worked in testing because the test data had no `NULL`s. Rewrite with `NOT EXISTS (SELECT 1 FROM other WHERE other.ref_id = t.id)`, which is NULL-safe and planned as an anti-join.

</details>

### Q5. Order totals are exactly double for some orders. How do you investigate?

<details>
<summary>Answer</summary>

Exact multiples point to fan-out. Take one affected order and run the join without `GROUP BY`. If each item line appears twice, a second one-to-many table (shipments, payments, tags) is joined in. Fix it by aggregating each child table in its own subquery or CTE (one row per order) before joining, or by using correlated scalar subqueries per child.

</details>

### Q6. A running total repeats the same value on two rows. Is that a bug?

<details>
<summary>Answer</summary>

It is the default frame. With `ORDER BY` in `OVER` and no frame, PostgreSQL uses `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, which includes all **peers** (rows with the same sort value), so tied rows share the total up to the end of the tie. If each row must accumulate separately, add a unique tiebreaker to the window `ORDER BY` and use `ROWS UNBOUNDED PRECEDING`.

</details>

### Q7. A daily sales report differs from the payment provider's daily totals. What would you check?

<details>
<summary>Answer</summary>

1. **Time zone**: the report truncates `timestamptz` in UTC while the provider uses local time (or vice versa) → compare with `AT TIME ZONE`.
2. **Boundaries**: `BETWEEN` with dates on timestamp columns loses the last day; use half-open ranges.
3. **Status filters**: refunds, cancellations, pending payments.
4. **Fan-out** in joins.
5. **Currency and rounding**.

Reconcile on one day and one order first, then generalise.

</details>

## Advanced

### Q8. A query's result changes between runs without any data changes. What could cause that?

<details>
<summary>Answer</summary>

Non-determinism in the query:

- `LIMIT`/`OFFSET` or `DISTINCT ON` without a complete `ORDER BY`;
- `ROW_NUMBER()` over a non-unique order;
- `array_agg`/`string_agg` without `ORDER BY`;
- volatile functions (`random()`, `now()` across transactions, `clock_timestamp()`);
- parallel plans returning rows in a different order;
- a session setting such as `TimeZone` or `DateStyle` differing between clients.

Add unique tiebreakers and explicit orderings; pin settings in the query when the output depends on them.

</details>

### Q9. A colleague says "the database is returning wrong data". How do you approach it?

<details>
<summary>Answer</summary>

Assume the query is wrong until proven otherwise, and work systematically:

1. Reproduce with a minimal case (one id, one day).
2. Compute the expected answer by hand or with a simpler independent query.
3. Check row counts after each join; look for `NULL` in keys and filters.
4. Check filter placement, grain, ties, time zones and types.
5. Check the transaction context: uncommitted changes, isolation level, replica lag if reading from a standby.

Genuine database bugs (corruption, wrong-result planner bugs) are rare; collect a reproducible test case before claiming one.

</details>
