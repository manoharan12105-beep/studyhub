# Gaps and Islands — Interview Questions

## Beginner

### Q1. What is a gaps-and-islands problem?

<details>
<summary>Answer</summary>

A problem about runs in ordered data. An **island** is a maximal run of consecutive values (consecutive days, consecutive ids, consecutive rows with the same status); a **gap** is a missing stretch between islands. Examples: login streaks, missing invoice numbers, periods when a server was down, merging overlapping bookings.

</details>

### Q2. How do you find missing ids in a sequence?

<details>
<summary>Answer</summary>

Compare each id with the next:

```sql
-- Illustrative
SELECT id + 1 AS gap_start, next_id - 1 AS gap_end
FROM (SELECT id, lead(id) OVER (ORDER BY id) AS next_id FROM t) x
WHERE next_id - id > 1;
```

Or generate every expected id and anti-join: `SELECT n FROM generate_series(min, max) n WHERE NOT EXISTS (SELECT 1 FROM t WHERE id = n)`. Gaps in `SERIAL`/`IDENTITY` columns are normal (rolled-back inserts consume values), so they are not data loss.

</details>

## Intermediate

### Q3. Explain the "value minus row number" trick.

<details>
<summary>Answer</summary>

Number the distinct values in order with `ROW_NUMBER()`. Inside a run of consecutive values, both the value and the row number increase by 1 each row, so `value - row_number` stays constant. After a gap, the value jumps by more than 1 while the row number still grows by 1, so the difference changes. Grouping by the difference gives one group per island:

```text
value: 5 6 7 10 11      row_number: 1 2 3 4 5      difference: 4 4 4 6 6
```

`min(value)`, `max(value)` and `count(*)` per group give each island's start, end and length.

</details>

### Q4. Find users who logged in on at least 3 consecutive days.

<details>
<summary>Answer</summary>

```sql
-- Illustrative
WITH days AS (
    SELECT DISTINCT user_id, login_at::date AS day FROM logins
),
g AS (
    SELECT user_id, day - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day)::int AS grp
    FROM days
)
SELECT DISTINCT user_id
FROM g
GROUP BY user_id, grp
HAVING count(*) >= 3;
```

- `DISTINCT` per day is required (several logins on the same day).
- `PARTITION BY user_id` keeps users separate.
- Alternative: `day - lag(day, 2) OVER (PARTITION BY user_id ORDER BY day) = 2` on the distinct days.

</details>

### Q5. How do you find runs of the same status, such as periods when a server was down?

<details>
<summary>Answer</summary>

1. Flag each row where the status differs from the previous row: `CASE WHEN status IS DISTINCT FROM lag(status) OVER (ORDER BY ts) THEN 1 ELSE 0 END`.
2. A running `sum` of the flags gives an island number.
3. `GROUP BY` island number and status, then take `min(ts)` and `max(ts)`.

Value minus row number does not work here, because the islands are defined by equal values, not by consecutive numbers.

</details>

### Q6. How do you split page views into sessions with a 30-minute inactivity timeout?

<details>
<summary>Answer</summary>

Same pattern as Q5: flag a hit as a new session when `hit_at - lag(hit_at) OVER (PARTITION BY user_id ORDER BY hit_at) > interval '30 minutes'` (or when `lag` is `NULL`, for the first hit). Running-sum the flags per user to number the sessions, then aggregate per session (start, end, hits, duration).

</details>

## Advanced

### Q7. How do you merge overlapping time ranges?

<details>
<summary>Answer</summary>

Sort by start. A range starts a new merged block when its start is after the **maximum end of all earlier ranges**: `max(end) OVER (ORDER BY start ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING)`. Comparing only with the previous row is wrong when an early long range covers several later ones. Flag, running-sum the flags into block numbers, then `min(start)` and `max(end)` per block.

In PostgreSQL 14+, `range_agg(tstzrange(start, end))` returns the merged multirange directly. `unnest` turns it back into rows.

</details>

### Q8. Can you apply the row-number trick to months or timestamps?

<details>
<summary>Answer</summary>

Not directly — the trick needs values that step by exactly 1. Convert first:

- Months → `extract(year FROM d) * 12 + extract(month FROM d)` (consecutive integers).
- Hourly readings → `extract(epoch FROM ts) / 3600`.
- Irregular timestamps → use the change-flag pattern with a threshold instead.

For dates by day, `date - integer` works directly, because dates step by days.

</details>

### Q9. How would you prevent overlapping bookings in the first place?

<details>
<summary>Answer</summary>

Use an exclusion constraint instead of checking in application code:

```sql
-- Illustrative
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE bookings ADD CONSTRAINT no_overlap
    EXCLUDE USING gist (room WITH =, daterange(check_in, check_out) WITH &&);
```

It rejects any two rows with the same room whose ranges overlap, and it stays correct under concurrency, unlike "select then insert".

</details>
