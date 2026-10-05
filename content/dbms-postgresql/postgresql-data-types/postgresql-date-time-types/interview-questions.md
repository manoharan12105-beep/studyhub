# Date and Time Types — Interview Questions

## Beginner

### Q1. What is the difference between TIMESTAMP and TIMESTAMPTZ in PostgreSQL?

<details>
<summary>Answer</summary>

`timestamp` (without time zone) stores a wall-clock date and time with no zone; it never changes on display. `timestamptz` stores an absolute instant: input is converted to UTC (using the offset in the input or the session time zone) and output is converted to the session's `TimeZone`. Despite its name, `timestamptz` does not store a zone. Use `timestamptz` for event times.

</details>

### Q2. What is the difference between `now()`, `current_timestamp` and `clock_timestamp()`?

<details>
<summary>Answer</summary>

`now()` and `current_timestamp` are identical: the start time of the current transaction, constant for the whole transaction. `clock_timestamp()` returns the actual time at the moment it is evaluated and changes even within one statement. Use `now()` for consistent timestamps across related rows; `clock_timestamp()` to measure elapsed time.

</details>

### Q3. How do you select all rows from March 2026 on a timestamp column?

<details>
<summary>Answer</summary>

`WHERE created_at >= '2026-03-01' AND created_at < '2026-04-01'`. A half-open range covers every instant of the month regardless of precision and can use an index on `created_at`. `BETWEEN '2026-03-01' AND '2026-03-31'` misses everything after midnight on 31 March, and `date_trunc('month', created_at) = …` cannot use a plain index on the column.

</details>

## Intermediate

### Q4. What does `AT TIME ZONE` do?

<details>
<summary>Answer</summary>

It converts between the two timestamp types. Applied to a `timestamptz`, it returns the `timestamp` (wall-clock time) in the given zone: "what did clocks in Kolkata show at this instant?". Applied to a `timestamp`, it interprets that wall-clock time as being in the given zone and returns the `timestamptz` instant. Example: `date_trunc('day', created_at AT TIME ZONE 'Asia/Kolkata')` groups events by Indian calendar day.

</details>

### Q5. What is `DATE '2026-01-31' + INTERVAL '1 month'`?

<details>
<summary>Answer</summary>

`2026-02-28 00:00:00` — month arithmetic keeps the day number and clamps to the last day of the target month. It is not reversible: adding a month again gives 28 March, while adding `2 months` to 31 January gives 31 March. The result is a `timestamp`, because `date + interval` returns `timestamp`.

</details>

### Q6. Why should you use time-zone names instead of abbreviations?

<details>
<summary>Answer</summary>

Abbreviations are ambiguous and represent a fixed offset: PostgreSQL's default table reads `IST` as Israel Standard Time (+02), not India (+05:30), and `EST` never switches to daylight time. Region names such as `Asia/Kolkata` or `America/New_York` follow the full rules, including daylight-saving changes and historical offsets.

</details>

## Advanced

### Q7. Is `INTERVAL '1 day'` the same as `INTERVAL '24 hours'`?

<details>
<summary>Answer</summary>

They compare as equal (comparisons treat a day as 24 hours), but they behave differently in arithmetic with `timestamptz` across a daylight-saving change: `+ '1 day'` keeps the same local time on the next calendar day (23 or 25 real hours), `+ '24 hours'` adds exactly 86,400 seconds. Intervals store months, days and microseconds separately for exactly this reason.

</details>

### Q8. A daily-sales report built with `GROUP BY created_at::date` gives different numbers on two servers. Why?

<details>
<summary>Answer</summary>

Casting `timestamptz` to `date` uses the session `TimeZone`, so servers (or connection pools/JDBC clients) with different zone settings put the same instants on different days. Make the business zone explicit: `GROUP BY (created_at AT TIME ZONE 'Asia/Kolkata')::date`.

</details>

### Q9. How would you store a recurring local event, such as "the shop opens at 09:00 every day in Mumbai"?

<details>
<summary>Answer</summary>

As a `time` (09:00) plus a time-zone name column (`Asia/Kolkata`), not as a `timestamptz`. The instant of "09:00 local" changes with daylight-saving rules for zones that have them, so it must be computed per date: `(date + open_time) AT TIME ZONE zone`. Store instants (`timestamptz`) only for things that happen at a specific moment.

</details>
