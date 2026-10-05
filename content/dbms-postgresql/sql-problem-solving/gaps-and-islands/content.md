# Gaps and Islands

**Module:** SQL Problem Solving · **Interview priority:** Frequently asked

## What Is It?

**Islands** are maximal runs of consecutive values: consecutive login days, consecutive invoice numbers, consecutive months with the same status. **Gaps** are the missing stretches between islands: missing invoice numbers, days without activity.

```text
login days:   1  2  3  .  .  6  7  .  9
              └─island─┘ gap └isl┘ gap └isl┘
```

Typical questions: "users who logged in on 3 or more consecutive days", "find missing ids in a sequence", "longest winning streak", "merge overlapping booking periods".

## Why It Matters

- It is a classic "advanced SQL" interview problem, because the trick is not obvious until you have seen it.
- Real systems need it: streaks and retention, gaps in invoice numbering (audits), sensor downtime, merging availability periods.
- Solutions use window functions in a non-trivial way (`ROW_NUMBER`, `lag`/`lead`, running sums).

## Core Concept

### Technique 1: value minus row number (consecutive values)

For values that increase by exactly 1 (integers, or dates by day), subtract a row number. Within an island both grow by 1, so the difference is constant; at a gap the value jumps, so the difference changes.

```text
login_date   row_number   login_date - row_number
2026-03-01   1            2026-02-28   ← island A
2026-03-02   2            2026-02-28   ← island A
2026-03-03   3            2026-02-28   ← island A
2026-03-06   4            2026-03-02   ← island B
2026-03-07   5            2026-03-02   ← island B
```

`GROUP BY` that difference to get each island's start, end and length. Remove duplicate values first (`DISTINCT`), or one value would get two row numbers. For other steps (months, numbers in tens), map the value to a consecutive integer first.

### Technique 2: change flags and a running sum (islands of equal values)

When islands are runs of the **same status** rather than consecutive numbers:

1. Flag a row with 1 where it starts a new island: `CASE WHEN status IS DISTINCT FROM lag(status) OVER (…) THEN 1 ELSE 0 END`.
2. A running `sum` of the flags numbers the islands.
3. `GROUP BY` that island number.

The same flagging works for "a gap larger than N starts a new session": `CASE WHEN ts - lag(ts) > interval '30 minutes' THEN 1 ELSE 0 END`.

### Finding gaps

- Compare each value with the next one: `lead(id) OVER (ORDER BY id)`. Where `next - id > 1`, the gap is `id + 1 … next - 1`.
- Or list every expected value with `generate_series(min, max)` and anti-join the existing ones.

## Syntax

```sql
-- Illustrative
-- Islands of consecutive integers/dates
SELECT min(v) AS island_start, max(v) AS island_end, count(*) AS length
FROM (SELECT v, v - ROW_NUMBER() OVER (ORDER BY v)::int AS grp
      FROM (SELECT DISTINCT v FROM t) d) x
GROUP BY grp;

-- Gaps
SELECT v + 1 AS gap_start, next_v - 1 AS gap_end
FROM (SELECT v, lead(v) OVER (ORDER BY v) AS next_v FROM t) x
WHERE next_v - v > 1;
```

## Examples

### E1. Consecutive login days

```sql
CREATE TABLE logins (user_id int, login_at timestamp);
INSERT INTO logins VALUES
    (1, '2026-03-01 09:00'), (1, '2026-03-01 18:00'), (1, '2026-03-02 10:00'),
    (1, '2026-03-03 08:30'), (1, '2026-03-06 11:00'), (1, '2026-03-07 09:15'),
    (2, '2026-03-01 12:00'), (2, '2026-03-03 12:00'), (2, '2026-03-04 12:00'),
    (2, '2026-03-05 12:00'), (2, '2026-03-06 12:00'),
    (3, '2026-03-02 07:00');

WITH days AS (
    SELECT DISTINCT user_id, login_at::date AS day
    FROM logins
),
grouped AS (
    SELECT user_id, day,
           day - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day)::int AS grp
    FROM days
)
SELECT user_id, min(day) AS streak_start, max(day) AS streak_end, count(*) AS days
FROM grouped
GROUP BY user_id, grp
ORDER BY user_id, streak_start;
```

**Output:**

```text
 user_id | streak_start | streak_end | days
---------+--------------+------------+------
       1 | 2026-03-01   | 2026-03-03 |    3
       1 | 2026-03-06   | 2026-03-07 |    2
       2 | 2026-03-01   | 2026-03-01 |    1
       2 | 2026-03-03   | 2026-03-06 |    4
       3 | 2026-03-02   | 2026-03-02 |    1
(5 rows)
```

`date - integer` gives a date, so `grp` is a date that is constant within a streak. `DISTINCT` is essential: user 1 logged in twice on 1 March.

### E2. Users with 3 or more consecutive login days

```sql
WITH days AS (
    SELECT DISTINCT user_id, login_at::date AS day FROM logins
),
grouped AS (
    SELECT user_id, day,
           day - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day)::int AS grp
    FROM days
)
SELECT user_id, max(streak) AS longest_streak
FROM (SELECT user_id, grp, count(*) AS streak FROM grouped GROUP BY user_id, grp) s
GROUP BY user_id
HAVING max(streak) >= 3
ORDER BY user_id;
```

**Output:**

```text
 user_id | longest_streak
---------+----------------
       1 |              3
       2 |              4
(2 rows)
```

A shorter alternative for "at least 3 in a row" compares each day with the day two rows earlier, because three consecutive distinct days span exactly two days:

```sql
SELECT DISTINCT user_id
FROM (SELECT user_id, day, lag(day, 2) OVER (PARTITION BY user_id ORDER BY day) AS two_back
      FROM (SELECT DISTINCT user_id, login_at::date AS day FROM logins) d) t
WHERE day - two_back = 2
ORDER BY user_id;
```

**Output:**

```text
 user_id
---------
       1
       2
(2 rows)
```

### E3. Missing invoice numbers (gaps)

```sql
CREATE TABLE invoices (invoice_no int PRIMARY KEY);
INSERT INTO invoices VALUES (1001), (1002), (1003), (1006), (1007), (1010), (1011), (1012);

SELECT invoice_no + 1 AS gap_start, next_no - 1 AS gap_end, next_no - invoice_no - 1 AS missing
FROM (SELECT invoice_no, lead(invoice_no) OVER (ORDER BY invoice_no) AS next_no
      FROM invoices) t
WHERE next_no - invoice_no > 1
ORDER BY gap_start;
```

**Output:**

```text
 gap_start | gap_end | missing
-----------+---------+---------
      1004 |    1005 |       2
      1008 |    1009 |       2
(2 rows)
```

To list every missing number, generate the full range and anti-join:

```sql
SELECT n AS missing_invoice
FROM generate_series((SELECT min(invoice_no) FROM invoices),
                     (SELECT max(invoice_no) FROM invoices)) AS n
WHERE NOT EXISTS (SELECT 1 FROM invoices WHERE invoice_no = n)
ORDER BY n;
```

**Output:**

```text
 missing_invoice
-----------------
            1004
            1005
            1008
            1009
(4 rows)
```

### E4. Islands of consecutive invoice numbers

```sql
SELECT min(invoice_no) AS range_start, max(invoice_no) AS range_end, count(*) AS invoices
FROM (SELECT invoice_no, invoice_no - ROW_NUMBER() OVER (ORDER BY invoice_no) AS grp
      FROM invoices) t
GROUP BY grp
ORDER BY range_start;
```

**Output:**

```text
 range_start | range_end | invoices
-------------+-----------+----------
        1001 |      1003 |        3
        1006 |      1007 |        2
        1010 |      1012 |        3
(3 rows)
```

A compact "1001–1003, 1006–1007, 1010–1012" summary is what auditors and UIs usually show.

### E5. Islands of the same status

```sql
CREATE TABLE server_status (checked_at timestamp PRIMARY KEY, status text NOT NULL);
INSERT INTO server_status VALUES
    ('2026-04-01 10:00', 'UP'),   ('2026-04-01 10:05', 'UP'),
    ('2026-04-01 10:10', 'DOWN'), ('2026-04-01 10:15', 'DOWN'),
    ('2026-04-01 10:20', 'DOWN'), ('2026-04-01 10:25', 'UP'),
    ('2026-04-01 10:30', 'DOWN'), ('2026-04-01 10:35', 'UP');

WITH flagged AS (
    SELECT checked_at, status,
           CASE WHEN status IS DISTINCT FROM lag(status) OVER (ORDER BY checked_at)
                THEN 1 ELSE 0 END AS new_island
    FROM server_status
),
numbered AS (
    SELECT checked_at, status,
           sum(new_island) OVER (ORDER BY checked_at) AS island
    FROM flagged
)
SELECT island, status, min(checked_at) AS from_time, max(checked_at) AS to_time, count(*) AS checks
FROM numbered
GROUP BY island, status
ORDER BY island;
```

**Output:**

```text
 island | status |      from_time      |       to_time       | checks
--------+--------+---------------------+---------------------+--------
      1 | UP     | 2026-04-01 10:00:00 | 2026-04-01 10:05:00 |      2
      2 | DOWN   | 2026-04-01 10:10:00 | 2026-04-01 10:20:00 |      3
      3 | UP     | 2026-04-01 10:25:00 | 2026-04-01 10:25:00 |      1
      4 | DOWN   | 2026-04-01 10:30:00 | 2026-04-01 10:30:00 |      1
      5 | UP     | 2026-04-01 10:35:00 | 2026-04-01 10:35:00 |      1
(5 rows)
```

Here row-number subtraction does not apply (status is not a number). Flagging changes and running-summing them works for any "runs of equal values" problem. `IS DISTINCT FROM` makes the first row (where `lag` is `NULL`) start an island.

### E6. Sessions: a gap of more than 30 minutes starts a new session

```sql
CREATE TABLE page_hits (user_id int, hit_at timestamp);
INSERT INTO page_hits VALUES
    (1, '2026-04-01 09:00'), (1, '2026-04-01 09:10'), (1, '2026-04-01 09:35'),
    (1, '2026-04-01 11:00'), (1, '2026-04-01 11:20'),
    (2, '2026-04-01 09:00'), (2, '2026-04-01 10:00');

WITH flagged AS (
    SELECT user_id, hit_at,
           CASE WHEN hit_at - lag(hit_at) OVER (PARTITION BY user_id ORDER BY hit_at)
                     <= interval '30 minutes'
                THEN 0 ELSE 1 END AS new_session
    FROM page_hits
),
sessions AS (
    SELECT user_id, hit_at,
           sum(new_session) OVER (PARTITION BY user_id ORDER BY hit_at) AS session_no
    FROM flagged
)
SELECT user_id, session_no, min(hit_at) AS started, max(hit_at) AS ended, count(*) AS hits
FROM sessions
GROUP BY user_id, session_no
ORDER BY user_id, session_no;
```

**Output:**

```text
 user_id | session_no |       started       |        ended        | hits
---------+------------+---------------------+---------------------+------
       1 |          1 | 2026-04-01 09:00:00 | 2026-04-01 09:35:00 |    3
       1 |          2 | 2026-04-01 11:00:00 | 2026-04-01 11:20:00 |    2
       2 |          1 | 2026-04-01 09:00:00 | 2026-04-01 09:00:00 |    1
       2 |          2 | 2026-04-01 10:00:00 | 2026-04-01 10:00:00 |    1
(4 rows)
```

The first hit of each user has `lag = NULL`; the comparison is unknown, so `CASE` falls to `ELSE 1` and starts session 1.

### E7. Merging overlapping date ranges

```sql
CREATE TABLE bookings (room int, check_in date, check_out date);
INSERT INTO bookings VALUES
    (1, '2026-05-01', '2026-05-04'), (1, '2026-05-03', '2026-05-06'),
    (1, '2026-05-06', '2026-05-08'), (1, '2026-05-10', '2026-05-12'),
    (2, '2026-05-01', '2026-05-02');

WITH ordered AS (
    SELECT room, check_in, check_out,
           max(check_out) OVER (PARTITION BY room ORDER BY check_in, check_out
                                ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS prev_max_out
    FROM bookings
),
flagged AS (
    SELECT room, check_in, check_out,
           CASE WHEN check_in <= prev_max_out THEN 0 ELSE 1 END AS new_block
    FROM ordered
),
blocks AS (
    SELECT room, check_in, check_out,
           sum(new_block) OVER (PARTITION BY room ORDER BY check_in, check_out) AS block
    FROM flagged
)
SELECT room, min(check_in) AS occupied_from, max(check_out) AS occupied_to
FROM blocks
GROUP BY room, block
ORDER BY room, occupied_from;
```

**Output:**

```text
 room | occupied_from | occupied_to
------+---------------+-------------
    1 | 2026-05-01    | 2026-05-08
    1 | 2026-05-10    | 2026-05-12
    2 | 2026-05-01    | 2026-05-02
(3 rows)
```

A booking starts a new block only if it begins after every earlier booking has ended (`max` of all previous `check_out`, not just the previous row's). Ranges that touch (`check_out = check_in`) are merged here. PostgreSQL 14+ can also do this with multiranges: `range_agg(daterange(check_in, check_out))` returns the merged ranges directly.

```sql
SELECT room, range_agg(daterange(check_in, check_out)) AS occupied
FROM bookings
GROUP BY room
ORDER BY room;
```

**Output:**

```text
 room |                     occupied
------+---------------------------------------------------
    1 | {[2026-05-01,2026-05-08),[2026-05-10,2026-05-12)}
    2 | {[2026-05-01,2026-05-02)}
(2 rows)
```

## Comparison

| Problem | Technique |
|---------|-----------|
| Consecutive integers or days | `value - ROW_NUMBER()` → `GROUP BY` the difference |
| "At least N in a row" | Same, `HAVING count(*) >= N`; or `value - lag(value, N-1) = N-1` |
| Missing values | `lead(v) - v > 1`, or `generate_series` + `NOT EXISTS` |
| Runs of the same status | Change flag with `lag` + running `sum` → island number |
| Sessions by inactivity | Flag `gap > threshold` + running `sum` |
| Overlapping ranges | Flag start after running `max(end)` + running `sum`; or `range_agg` |

## Common Mistakes

- Forgetting `DISTINCT` before row numbering when a value can repeat (two logins on one day).
- Using `ROW_NUMBER` without `PARTITION BY user_id` when islands are per user.
- Comparing with only the previous row's end when merging ranges (misses a long earlier range covering later ones).
- Using `status <> lag(status)`: the first row compares with `NULL` and is not flagged — use `IS DISTINCT FROM`.
- Applying value-minus-row-number to timestamps or months without first converting to a consecutive integer or date.

## Revision

- Island = maximal run; gap = missing stretch.
- Consecutive values: `v - ROW_NUMBER() OVER (ORDER BY v)` is constant per island; group by it (after `DISTINCT`).
- Gaps: `lead(v) - v > 1`, or `generate_series` + anti-join.
- Runs of equal values / sessions: change flag (`lag`, `IS DISTINCT FROM`, threshold) → running `sum` → group.
- Overlaps: compare start with running `max(end)` of earlier rows; PostgreSQL `range_agg` merges ranges directly.

## Quick Revision

Consecutive values: subtract `ROW_NUMBER()` and group by the difference. Runs of a status or sessions: flag where a new run starts with `lag`, running-sum the flags, group by the sum. Gaps: `lead(v) - v > 1`.
