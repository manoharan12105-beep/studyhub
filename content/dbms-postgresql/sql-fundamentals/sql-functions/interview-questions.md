# SQL Functions — Interview Questions

## Beginner

### Q1. What is the difference between `COUNT(*)` and `COUNT(column)`?

<details>
<summary>Answer</summary>

`COUNT(*)` counts all rows. `COUNT(column)` counts only rows where that column is not NULL. In the sample `employees`, `count(*)` is 12 and `count(commission)` is 3.

</details>

### Q2. Is `COUNT(1)` faster than `COUNT(*)`?

<details>
<summary>Answer</summary>

No. Both count rows and return the same result; `1` is never NULL. In PostgreSQL `count(*)` is the natural form (it takes no argument), and `count(1)` is, if anything, marginally more work. The myth comes from old databases and from confusing `count(*)` with "reading all columns".

</details>

### Q3. How do aggregate functions treat NULL?

<details>
<summary>Answer</summary>

They ignore NULL values — `sum`, `avg`, `min`, `max` and `count(col)` work only on non-NULL values. `count(*)` counts rows regardless. If every value (or every row) is missing, `sum`/`avg`/`min`/`max` return NULL while `count` returns 0.

</details>

### Q4. What is the difference between scalar and aggregate functions?

<details>
<summary>Answer</summary>

A scalar function returns one value per input row (`upper(name)`, `round(price)`). An aggregate function collapses a set of rows into one value per group (`sum(amount)`). Aggregates require `GROUP BY` for per-group results and cannot appear in `WHERE`.

</details>

## Intermediate

### Q5. `AVG(commission)` returns 2666.67, but the manager expected 666.67. Why?

<details>
<summary>Answer</summary>

`avg` ignores NULLs: it divided the total 8000 by the 3 employees who have a commission value, not by all 12. If NULL means "no commission" (zero), use `avg(COALESCE(commission, 0))`. If NULL means "unknown", ignoring it is correct. The fix depends on the meaning of NULL.

</details>

### Q6. Why does `SELECT 7 / 2` return 3 in PostgreSQL?

<details>
<summary>Answer</summary>

Both operands are integers, so integer division is performed and the fraction is truncated. Make one operand numeric — `7 / 2.0`, `7::numeric / 2` — to get 3.5. The same issue makes `delivered * 100 / total` wrong in reports.

</details>

### Q7. How do you add time to a date, and how do you get the difference between two dates?

<details>
<summary>Answer</summary>

Add an `interval` (or an integer number of days to a `date`); subtracting two dates gives days, and `age()` gives years/months/days:

```sql
SELECT DATE '2026-01-31' + 30                    AS plus_30_days,
       DATE '2026-01-31' + interval '1 month'    AS plus_1_month,
       DATE '2026-03-15' - DATE '2026-01-05'     AS days_between,
       age(DATE '2026-03-15', DATE '2024-06-01') AS age_result;
```

**Output:**

```text
 plus_30_days |    plus_1_month     | days_between |      age_result
--------------+---------------------+--------------+-----------------------
 2026-03-02   | 2026-02-28 00:00:00 |           69 | 1 year 9 mons 14 days
(1 row)
```

`date + interval` returns a `timestamp`, and adding a month to 31 January clamps to the last day of February.

</details>

### Q8. What is the difference between `||` and `concat()`?

<details>
<summary>Answer</summary>

`||` returns NULL if any operand is NULL. `concat()` treats NULL arguments as empty strings. `concat_ws(separator, …)` also skips NULLs and inserts the separator only between non-NULL values.

</details>

### Q9. How do you get the month of a date and group by month?

<details>
<summary>Answer</summary>

`extract(month FROM d)` returns the month number (1–12) — but grouping by it merges the same month of different years. `date_trunc('month', d)` returns the first instant of the month, so it keeps years apart and is the right grouping key for monthly reports.

</details>

## Advanced

### Q10. What does `SUM` return over an empty set, and why does it matter in Java?

<details>
<summary>Answer</summary>

NULL. In JDBC, `rs.getLong(1)` returns 0 for SQL NULL (check `rs.wasNull()`), but `rs.getObject(1)` or a JPA query returning `Long`/`BigDecimal` gives `null`, and unboxing it throws `NullPointerException`. Use `COALESCE(sum(x), 0)` in SQL when the business meaning of "no rows" is zero.

</details>

### Q11. What types do `sum` and `avg` return for integer columns in PostgreSQL?

<details>
<summary>Answer</summary>

`sum(integer)` returns `bigint` (and `sum(bigint)` returns `numeric`) so totals do not overflow; `avg` of integer types returns `numeric` with fractional digits. `count` returns `bigint`. Java code should map them to `Long`/`BigDecimal`, not `Integer`.

</details>
