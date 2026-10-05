# Date and Time Types

**Module:** PostgreSQL Data Types · **Interview priority:** Frequently asked

## What Is It?

PostgreSQL has five main date/time types:

| Type | Stores | Size | Example |
|------|--------|------|---------|
| `date` | A calendar date | 4 bytes | `2026-03-10` |
| `time` | A time of day (no date) | 8 bytes | `09:00:00` |
| `timestamp` (without time zone) | A date and wall-clock time, **no zone** | 8 bytes | `2026-03-10 09:00:00` |
| `timestamptz` (with time zone) | An **absolute instant** | 8 bytes | `2026-03-10 03:30:00+00` |
| `interval` | A duration in months, days and microseconds | 16 bytes | `1 mon 2 days 03:00:00` |

Timestamps have microsecond resolution. Date/time functions (`now()`, `date_trunc`, `extract`, `age`, …) are listed in [SQL Functions](../../sql-fundamentals/sql-functions/content.md); this topic is about how the types behave.

## Why It Matters

- Time-zone bugs are among the most common production bugs: events shown hours off, reports split across the wrong day, duplicate or missing hours at daylight-saving changes.
- "timestamp vs timestamptz" is a standard PostgreSQL interview question, and most candidates get the storage part wrong.
- Date arithmetic has non-obvious rules (month ends, DST days vs 24 hours) that change results.

## Core Concept

### timestamp vs timestamptz

| | `timestamp` | `timestamptz` |
|---|---|---|
| Meaning | A wall-clock reading with no zone ("09:00 on 10 March", somewhere) | A specific moment in time |
| On input | Stored as typed; any zone in the input is **ignored** | Converted to UTC using the zone in the input, or the session `TimeZone` if none |
| Stored | The wall-clock value | The UTC instant (no zone name is stored) |
| On output | As stored | Converted to the session `TimeZone` |
| Changes with session `TimeZone` | No | Display changes; the instant does not |

Key facts:

- `timestamptz` does **not** store a time zone. It stores an instant (internally UTC) and displays it in the session's zone.
- For events that happened at a moment — created_at, paid_at, logged_in_at — use **`timestamptz`**.
- Use `timestamp` only for wall-clock values that are deliberately zone-independent ("the store opens at 09:00 local time", a recurring local schedule), usually together with a separate zone column.
- Use `date` for calendar dates without a time (birthdays, hire dates, due dates).

### The session time zone

`SET TIME ZONE 'Asia/Kolkata'` (or the `TimeZone` setting) controls how `timestamptz` values are displayed and how zone-less input is interpreted. Applications should set it explicitly (JDBC drivers send the JVM's zone) or work in UTC and convert at the edges.

Use **full zone names** (`Asia/Kolkata`, `America/New_York`), not abbreviations: abbreviations are ambiguous and fixed-offset. In PostgreSQL's default abbreviation table, `IST` means **Israel** Standard Time (+02), not India (+05:30).

### AT TIME ZONE: converting between the two

`AT TIME ZONE` works in both directions, and the direction depends on the input type:

| Expression | Input | Result | Meaning |
|------------|-------|--------|---------|
| `tstz AT TIME ZONE 'Asia/Kolkata'` | `timestamptz` | `timestamp` | "What did clocks in Kolkata show at this instant?" |
| `ts AT TIME ZONE 'Asia/Kolkata'` | `timestamp` | `timestamptz` | "Which instant is this Kolkata wall-clock time?" |

Typical use: group events by **local** day — `date_trunc('day', created_at AT TIME ZONE 'Asia/Kolkata')`.

### Intervals

An `interval` has three separate parts: months, days and microseconds. They are kept separate because they are not convertible in general:

- A month has 28–31 days. `DATE '2026-01-31' + INTERVAL '1 month'` is `2026-02-28` (clamped to the month end).
- A day is not always 24 hours. Across a daylight-saving change, `+ INTERVAL '1 day'` keeps the wall-clock time, while `+ INTERVAL '24 hours'` adds exactly 24 hours of elapsed time.
- For **comparison** only, PostgreSQL treats 1 month as 30 days and 1 day as 24 hours, so `INTERVAL '1 day' = INTERVAL '24 hours'` is TRUE even though adding them can give different results.
- Month arithmetic is not reversible: adding one month twice to 31 January gives 28 March, not 31 March.

### Subtraction results

| Expression | Result type |
|------------|-------------|
| `date - date` | `integer` (days) |
| `date + integer` | `date` |
| `date + interval` | `timestamp` |
| `timestamp - timestamp` | `interval` (days and time, never months) |
| `age(ts1, ts2)` | `interval` in years, months and days |

### Querying a time range: half-open intervals

Filter a day, month or year with **`>= start AND < next_start`**:

```text
created_at >= '2026-03-01' AND created_at < '2026-04-01'     -- all of March, any precision
created_at BETWEEN '2026-03-01' AND '2026-03-31'              -- misses 31 March after 00:00:00
```

The half-open form also lets PostgreSQL use an index on `created_at`; wrapping the column in a function (`date_trunc('month', created_at) = …`, `created_at::date = …`) prevents a plain index from being used.

### Special values and validation

- Input is validated: `'2026-02-30'::date` is an error.
- `'infinity'` and `'-infinity'` are valid timestamps and dates (useful as open ends of validity periods).
- `now()`, `current_timestamp` → `timestamptz` (transaction start); `localtimestamp` → `timestamp`; `current_date` → `date`; `clock_timestamp()` → the actual current time.

## Syntax

```sql
-- Illustrative
DATE '2026-03-10'
TIMESTAMP '2026-03-10 09:00'
TIMESTAMPTZ '2026-03-10 09:00+05:30'
INTERVAL '1 month 2 days 3 hours'
ts AT TIME ZONE 'Asia/Kolkata'
SET TIME ZONE 'UTC';
```

## Examples

### Same input, two types, three session zones

```sql
SET TIME ZONE 'Asia/Kolkata';
CREATE TABLE events (local_ts timestamp, instant timestamptz);
INSERT INTO events VALUES ('2026-03-10 09:00', '2026-03-10 09:00');
SELECT local_ts, instant FROM events;
```

**Output:**

```text
      local_ts       |          instant
---------------------+---------------------------
 2026-03-10 09:00:00 | 2026-03-10 09:00:00+05:30
(1 row)
```

The `timestamptz` input had no zone, so it was interpreted in the session zone (Kolkata, +05:30) and stored as 03:30 UTC.

```sql
SET TIME ZONE 'America/New_York';
SELECT local_ts, instant FROM events;
```

**Output:**

```text
      local_ts       |        instant
---------------------+------------------------
 2026-03-10 09:00:00 | 2026-03-09 23:30:00-04
(1 row)
```

```sql
SET TIME ZONE 'UTC';
SELECT local_ts, instant FROM events;
```

**Output:**

```text
      local_ts       |        instant
---------------------+------------------------
 2026-03-10 09:00:00 | 2026-03-10 03:30:00+00
(1 row)
```

`local_ts` never changes. `instant` is the same moment each time, displayed in the session's zone.

### AT TIME ZONE in both directions

```sql
SET TIME ZONE 'UTC';
SELECT TIMESTAMPTZ '2026-03-10 03:30+00' AT TIME ZONE 'Asia/Kolkata' AS kolkata_wall_clock,
       TIMESTAMP '2026-03-10 09:00'       AT TIME ZONE 'Asia/Kolkata' AS instant_of_kolkata_9am;
```

**Output:**

```text
 kolkata_wall_clock  | instant_of_kolkata_9am
---------------------+------------------------
 2026-03-10 09:00:00 | 2026-03-10 03:30:00+00
(1 row)
```

```sql
SELECT pg_typeof(TIMESTAMPTZ '2026-03-10 03:30+00' AT TIME ZONE 'Asia/Kolkata') AS from_tstz,
       pg_typeof(TIMESTAMP '2026-03-10 09:00' AT TIME ZONE 'Asia/Kolkata')       AS from_ts;
```

**Output:**

```text
          from_tstz          |         from_ts
-----------------------------+--------------------------
 timestamp without time zone | timestamp with time zone
(1 row)
```

### Abbreviations are a trap

```sql
SET TIME ZONE 'UTC';
SELECT TIMESTAMPTZ '2026-03-10 09:00 IST'          AS with_ist,
       TIMESTAMPTZ '2026-03-10 09:00 Asia/Kolkata' AS with_zone_name;
```

**Output:**

```text
        with_ist        |     with_zone_name
------------------------+------------------------
 2026-03-10 07:00:00+00 | 2026-03-10 03:30:00+00
(1 row)
```

`IST` was read as Israel Standard Time (UTC+2), a 3½-hour error.

### Month arithmetic

```sql
SELECT DATE '2026-01-31' + INTERVAL '1 month'                       AS plus_one_month,
       DATE '2026-01-31' + INTERVAL '1 month' + INTERVAL '1 month'  AS plus_one_twice,
       DATE '2026-01-31' + INTERVAL '2 months'                      AS plus_two_months;
```

**Output:**

```text
   plus_one_month    |   plus_one_twice    |   plus_two_months
---------------------+---------------------+---------------------
 2026-02-28 00:00:00 | 2026-03-28 00:00:00 | 2026-03-31 00:00:00
(1 row)
```

### A day is not always 24 hours

Daylight saving starts in New York on 8 March 2026 (clocks jump from 02:00 to 03:00):

```sql
SET TIME ZONE 'America/New_York';
SELECT TIMESTAMPTZ '2026-03-07 12:00' + INTERVAL '1 day'    AS plus_1_day,
       TIMESTAMPTZ '2026-03-07 12:00' + INTERVAL '24 hours' AS plus_24_hours,
       INTERVAL '1 day' = INTERVAL '24 hours'                AS compare_equal;
```

**Output:**

```text
       plus_1_day       |     plus_24_hours      | compare_equal
------------------------+------------------------+---------------
 2026-03-08 12:00:00-04 | 2026-03-08 13:00:00-04 | t
(1 row)
```

`1 day` keeps the local time (12:00, only 23 real hours later); `24 hours` adds elapsed time and lands at 13:00. Yet the two intervals compare as equal.

### Differences between dates and timestamps

```sql
SELECT DATE '2026-03-10' - DATE '2026-01-01'                    AS days,
       TIMESTAMP '2026-03-10' - TIMESTAMP '2026-01-01 12:00'    AS timestamp_diff,
       age(TIMESTAMP '2026-03-10', TIMESTAMP '2025-01-25')      AS age;
```

**Output:**

```text
 days |  timestamp_diff  |         age
------+------------------+----------------------
   68 | 67 days 12:00:00 | 1 year 1 mon 16 days
(1 row)
```

### Half-open range vs BETWEEN

**Schema and data:**

```sql
CREATE TABLE logins (user_name text, login_at timestamptz);
INSERT INTO logins VALUES
    ('anil',   '2026-03-30 10:00+00'),
    ('bhavna', '2026-03-31 00:00+00'),
    ('chirag', '2026-03-31 18:45+00'),
    ('deepa',  '2026-04-01 00:00+00');
```

```sql
SET TIME ZONE 'UTC';
SELECT count(*) FILTER (WHERE login_at BETWEEN '2026-03-01' AND '2026-03-31')        AS with_between,
       count(*) FILTER (WHERE login_at >= '2026-03-01' AND login_at < '2026-04-01')   AS half_open
FROM logins;
```

**Output:**

```text
 with_between | half_open
--------------+-----------
            2 |         3
(1 row)
```

`BETWEEN … AND '2026-03-31'` means up to `2026-03-31 00:00:00`, so Chirag's evening login is lost (and Bhavna's is included only because it is exactly midnight).

### Grouping by local day

The same instants fall on different days in different zones:

```sql
SELECT user_name,
       (login_at AT TIME ZONE 'UTC')::date          AS utc_day,
       (login_at AT TIME ZONE 'Asia/Kolkata')::date AS kolkata_day
FROM logins
ORDER BY login_at;
```

**Output:**

```text
 user_name |  utc_day   | kolkata_day
-----------+------------+-------------
 anil      | 2026-03-30 | 2026-03-30
 bhavna    | 2026-03-31 | 2026-03-31
 chirag    | 2026-03-31 | 2026-04-01
 deepa     | 2026-04-01 | 2026-04-01
(4 rows)
```

A daily report must state which zone's days it uses.

### Generating a calendar and bucketing

```sql
SELECT d::date AS day
FROM generate_series(DATE '2026-01-30', DATE '2026-02-02', INTERVAL '1 day') AS d;
```

**Output:**

```text
    day
------------
 2026-01-30
 2026-01-31
 2026-02-01
 2026-02-02
(4 rows)
```

`generate_series` over dates with an interval produces timestamps; `::date` converts back.

```sql
SELECT date_bin(INTERVAL '15 minutes', TIMESTAMP '2026-03-10 09:52:10', TIMESTAMP '2000-01-01') AS bucket;
```

**Output:**

```text
       bucket
---------------------
 2026-03-10 09:45:00
(1 row)
```

`date_bin` (PostgreSQL 14+) truncates to arbitrary intervals — `date_trunc` only handles whole units.

### Validation and precision

```sql
SELECT DATE '2026-02-30';
```

**Output:**

```text
ERROR:  date/time field value out of range: "2026-02-30"
LINE 1: SELECT DATE '2026-02-30';
                    ^
```

```sql
SELECT TIMESTAMP '2026-03-10 09:00:00.123456789' AS rounded_to_microseconds,
       'infinity'::timestamptz > now()           AS infinity_is_later;
```

**Output:**

```text
  rounded_to_microseconds   | infinity_is_later
----------------------------+-------------------
 2026-03-10 09:00:00.123457 | t
(1 row)
```

### Epoch conversion

```sql
SET TIME ZONE 'UTC';
SELECT extract(epoch FROM TIMESTAMPTZ '2026-01-01 00:00+00') AS epoch_seconds,
       to_timestamp(1767225600)                               AS from_epoch;
```

**Output:**

```text
   epoch_seconds   |       from_epoch
-------------------+------------------------
 1767225600.000000 | 2026-01-01 00:00:00+00
(1 row)
```

## Comparison

### Which type to use

| Data | Type |
|------|------|
| When something happened (created, paid, logged in) | `timestamptz` |
| A calendar date (birthday, hire date, due date) | `date` |
| A local wall-clock time independent of zone (opening hours) | `time` / `timestamp`, plus a zone column if needed |
| A duration (subscription length, SLA) | `interval` |
| A period with start and end | `tstzrange` / `daterange` (or two columns) |

### `1 day` vs `24 hours`

| | `INTERVAL '1 day'` | `INTERVAL '24 hours'` |
|---|---|---|
| Added to a `timestamptz` across DST | Same local time next day | Exactly 86,400 seconds later |
| Compared with each other | Equal | Equal |

## Common Mistakes

- Using `timestamp` for event times, then mixing data written by servers in different zones.
- Believing `timestamptz` stores the zone it was written in.
- Time-zone abbreviations (`IST`, `CST`) instead of region names.
- `BETWEEN '…-01' AND '…-31'` on timestamps.
- Wrapping an indexed timestamp column in a function in `WHERE`.
- Grouping by `created_at::date` without deciding which zone's day that is (the session zone is used).
- Assuming `+ INTERVAL '1 month'` then `- INTERVAL '1 month'` returns the original date.

## Revision

- `date` (4 B), `time`, `timestamp` (wall clock), `timestamptz` (instant, stored as UTC, shown in session zone), `interval` (months + days + µs).
- Event times → `timestamptz`; set the session zone explicitly; use zone names, not abbreviations.
- `tstz AT TIME ZONE z` → local `timestamp`; `ts AT TIME ZONE z` → `timestamptz`.
- Month-end clamping; `1 day` ≠ `24 hours` across DST (though they compare equal).
- Ranges: `>= start AND < next_start`; keep the column bare for index use.

## Quick Revision

timestamptz is an absolute instant stored as UTC and shown in the session zone, while timestamp is a zone-less wall-clock value — use timestamptz for events, zone names over abbreviations, half-open ranges for filters, and expect month-end clamping and DST effects in interval arithmetic.
