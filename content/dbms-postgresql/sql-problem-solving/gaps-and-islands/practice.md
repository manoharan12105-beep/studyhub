# Gaps and Islands — Practice

### P1. What does the difference column look like?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** value minus row number

Values `3, 4, 5, 9, 10, 12` are numbered with `ROW_NUMBER() OVER (ORDER BY v)`. What is `v - ROW_NUMBER()` for each row?

- A) `2, 2, 2, 5, 5, 6`
- B) `3, 3, 3, 6, 6, 7`
- C) `2, 2, 2, 6, 6, 7`
- D) `0, 0, 0, 4, 4, 5`

<details>
<summary>Answer</summary>

**Answer:** A)

**Explanation:** `3-1, 4-2, 5-3 = 2`; `9-4, 10-5 = 5`; `12-6 = 6`. Three islands: 3–5, 9–10 and 12.

</details>

### P2. Missing seat numbers

**Difficulty:** Easy · **Type:** Query · **Concepts:** generate_series, NOT EXISTS

**Schema and data:**

```sql
CREATE TABLE booked_seats (seat int PRIMARY KEY);
INSERT INTO booked_seats VALUES (1), (2), (4), (5), (8), (10);
```

Seats run from 1 to 10. List the free ones.

**Expected output:**

```text
 free_seat
-----------
         3
         6
         7
         9
(4 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT s AS free_seat
FROM generate_series(1, 10) AS s
WHERE NOT EXISTS (SELECT 1 FROM booked_seats WHERE seat = s)
ORDER BY s;
```

**Explanation:** The full range comes from `generate_series`, not `min`/`max` of the table, because seats at the edges could be free.

</details>

### P3. Blocks of adjacent free seats

**Difficulty:** Medium · **Type:** Query · **Concepts:** islands on generated data

**Schema and data:**

```sql
CREATE TABLE booked_seats (seat int PRIMARY KEY);
INSERT INTO booked_seats VALUES (1), (2), (4), (5), (8), (10);
```

A group of two wants adjacent seats. Show every block of free seats with its size.

**Expected output:**

```text
 block_start | block_end | seats
-------------+-----------+-------
           3 |         3 |     1
           6 |         7 |     2
           9 |         9 |     1
(3 rows)
```

<details>
<summary>Hint</summary>

Build the free seats (P2), then apply value minus row number.

</details>

<details>
<summary>Solution</summary>

```sql
WITH free AS (
    SELECT s FROM generate_series(1, 10) AS s
    WHERE NOT EXISTS (SELECT 1 FROM booked_seats WHERE seat = s)
)
SELECT min(s) AS block_start, max(s) AS block_end, count(*) AS seats
FROM (SELECT s, s - ROW_NUMBER() OVER (ORDER BY s) AS grp FROM free) t
GROUP BY grp
ORDER BY block_start;
```

**Explanation:** Islands of free seats are the gaps of booked seats; `HAVING count(*) >= 2` would return only seats 6–7.

</details>

### P4. Longest streak per user

**Difficulty:** Medium · **Type:** Query · **Concepts:** DISTINCT days, islands per user

**Schema and data:**

```sql
CREATE TABLE workouts (user_id int, done_at timestamp);
INSERT INTO workouts VALUES
    (1, '2026-06-01 07:00'), (1, '2026-06-02 07:00'), (1, '2026-06-02 19:00'),
    (1, '2026-06-04 07:00'), (1, '2026-06-05 07:00'), (1, '2026-06-06 07:00'),
    (1, '2026-06-07 07:00'), (2, '2026-06-01 06:00'), (2, '2026-06-03 06:00');
```

For each user, show the longest run of consecutive workout days.

**Expected output:**

```text
 user_id | longest_streak
---------+----------------
       1 |              4
       2 |              1
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
WITH days AS (
    SELECT DISTINCT user_id, done_at::date AS day FROM workouts
),
g AS (
    SELECT user_id, day - ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY day)::int AS grp
    FROM days
)
SELECT user_id, max(cnt) AS longest_streak
FROM (SELECT user_id, grp, count(*) AS cnt FROM g GROUP BY user_id, grp) s
GROUP BY user_id
ORDER BY user_id;
```

**Explanation:** User 1 has streaks 1–2 June (2 days) and 4–7 June (4 days). Without `DISTINCT`, the two workouts on 2 June would break the arithmetic.

</details>

### P5. Price change periods

**Difficulty:** Medium · **Type:** Query · **Concepts:** change flag, running sum

**Schema and data:**

```sql
CREATE TABLE daily_price (day date PRIMARY KEY, price int NOT NULL);
INSERT INTO daily_price VALUES
    ('2026-07-01', 100), ('2026-07-02', 100), ('2026-07-03', 120),
    ('2026-07-04', 120), ('2026-07-05', 120), ('2026-07-06', 100),
    ('2026-07-07', 100);
```

Collapse the history into periods with a constant price.

**Expected output:**

```text
 price | valid_from |  valid_to
-------+------------+------------
   100 | 2026-07-01 | 2026-07-02
   120 | 2026-07-03 | 2026-07-05
   100 | 2026-07-06 | 2026-07-07
(3 rows)
```

<details>
<summary>Hint</summary>

`GROUP BY price` alone would merge the two separate 100 periods.

</details>

<details>
<summary>Solution</summary>

```sql
WITH flagged AS (
    SELECT day, price,
           CASE WHEN price IS DISTINCT FROM lag(price) OVER (ORDER BY day) THEN 1 ELSE 0 END AS chg
    FROM daily_price
),
numbered AS (
    SELECT day, price, sum(chg) OVER (ORDER BY day) AS period FROM flagged
)
SELECT price, min(day) AS valid_from, max(day) AS valid_to
FROM numbered
GROUP BY period, price
ORDER BY valid_from;
```

</details>

### P6. Gaps in sensor readings

**Difficulty:** Medium · **Type:** Query · **Concepts:** lead, interval threshold

**Schema and data:**

```sql
CREATE TABLE readings (sensor int, read_at timestamp);
INSERT INTO readings VALUES
    (1, '2026-08-01 10:00'), (1, '2026-08-01 10:01'), (1, '2026-08-01 10:02'),
    (1, '2026-08-01 10:15'), (1, '2026-08-01 10:16'), (1, '2026-08-01 10:40'),
    (2, '2026-08-01 10:00'), (2, '2026-08-01 10:03');
```

A sensor should report every minute. Report outages: gaps of more than 5 minutes between consecutive readings.

**Expected output:**

```text
 sensor |  last_seen_before   |   back_online_at    |  outage
--------+---------------------+---------------------+----------
      1 | 2026-08-01 10:02:00 | 2026-08-01 10:15:00 | 00:13:00
      1 | 2026-08-01 10:16:00 | 2026-08-01 10:40:00 | 00:24:00
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT sensor, read_at AS last_seen_before, next_at AS back_online_at, next_at - read_at AS outage
FROM (SELECT sensor, read_at, lead(read_at) OVER (PARTITION BY sensor ORDER BY read_at) AS next_at
      FROM readings) t
WHERE next_at - read_at > interval '5 minutes'
ORDER BY sensor, read_at;
```

**Explanation:** Sensor 2's 3-minute gap is within the threshold.

</details>

### P7. The wrong merge

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** merging ranges, running max

**Schema and data:**

```sql
CREATE TABLE shifts (worker int, start_h int, end_h int);
INSERT INTO shifts VALUES (1, 8, 18), (1, 9, 10), (1, 12, 13), (1, 20, 22);
```

This merge compares each shift only with the previous one and wrongly reports three blocks:

```sql
WITH f AS (
    SELECT worker, start_h, end_h,
           CASE WHEN start_h <= lag(end_h) OVER (PARTITION BY worker ORDER BY start_h, end_h)
                THEN 0 ELSE 1 END AS new_block
    FROM shifts
)
SELECT worker, min(start_h) AS from_h, max(end_h) AS to_h
FROM (SELECT f.*, sum(new_block) OVER (PARTITION BY worker ORDER BY start_h, end_h) AS b FROM f) t
GROUP BY worker, b
ORDER BY from_h;
```

**Output:**

```text
 worker | from_h | to_h
--------+--------+------
      1 |      8 |   18
      1 |     12 |   13
      1 |     20 |   22
(3 rows)
```

Fix it so that 8–18 absorbs the shifts inside it.

**Expected output:**

```text
 worker | from_h | to_h
--------+--------+------
      1 |      8 |   18
      1 |     20 |   22
(2 rows)
```

<details>
<summary>Hint</summary>

The 12–13 shift starts after the 9–10 shift ends, but not after 8–18 ends.

</details>

<details>
<summary>Solution</summary>

```sql
WITH f AS (
    SELECT worker, start_h, end_h,
           CASE WHEN start_h <= max(end_h) OVER (PARTITION BY worker ORDER BY start_h, end_h
                                                 ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING)
                THEN 0 ELSE 1 END AS new_block
    FROM shifts
)
SELECT worker, min(start_h) AS from_h, max(end_h) AS to_h
FROM (SELECT f.*, sum(new_block) OVER (PARTITION BY worker ORDER BY start_h, end_h) AS b FROM f) t
GROUP BY worker, b
ORDER BY from_h;
```

**Explanation:** The running maximum of all earlier ends (18) covers 12–13; the previous row's end (10) does not.

</details>

### P8. Consecutive months as a customer

**Difficulty:** Hard · **Type:** Query · **Concepts:** mapping months to integers

**Schema and data:**

```sql
CREATE TABLE subscriptions_paid (customer int, paid_month date);
INSERT INTO subscriptions_paid VALUES
    (1, '2025-11-01'), (1, '2025-12-01'), (1, '2026-01-01'), (1, '2026-03-01'),
    (2, '2026-01-01'), (2, '2026-02-01');
```

Find each run of consecutive paid months.

**Expected output:**

```text
 customer | run_start  |  run_end   | months
----------+------------+------------+--------
        1 | 2025-11-01 | 2026-01-01 |      3
        1 | 2026-03-01 | 2026-03-01 |      1
        2 | 2026-01-01 | 2026-02-01 |      2
(3 rows)
```

<details>
<summary>Hint</summary>

Months are not consecutive integers. Convert: `year * 12 + month`. Note the year change between December and January.

</details>

<details>
<summary>Solution</summary>

```sql
WITH m AS (
    SELECT customer, paid_month,
           (extract(year FROM paid_month) * 12 + extract(month FROM paid_month))::int AS month_no
    FROM subscriptions_paid
)
SELECT customer, min(paid_month) AS run_start, max(paid_month) AS run_end, count(*) AS months
FROM (SELECT m.*, month_no - ROW_NUMBER() OVER (PARTITION BY customer ORDER BY month_no) AS grp FROM m) t
GROUP BY customer, grp
ORDER BY customer, run_start;
```

**Explanation:** November 2025 → 24311, December → 24312, January 2026 → 24313: consecutive integers across the year boundary.

</details>
