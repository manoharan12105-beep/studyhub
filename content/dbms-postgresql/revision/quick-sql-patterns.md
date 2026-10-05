# 30 Minutes: Important SQL Patterns

Block 2 of 5. The pattern for each common question, in one line. Full queries are in **Last-Minute SQL Revision**.

## Order of Evaluation

`FROM` → `WHERE` → `GROUP BY` → `HAVING` → windows → `SELECT` → `DISTINCT` → `ORDER BY` → `LIMIT`.

## Patterns

| Question | Pattern |
|----------|---------|
| Second / Nth highest value | `DISTINCT … ORDER BY x DESC OFFSET n-1 LIMIT 1` in a scalar subquery, or `dense_rank() = n` |
| Highest per group (ties) | `rank() OVER (PARTITION BY g ORDER BY x DESC) = 1` |
| One row per group | `DISTINCT ON (g) … ORDER BY g, x DESC, id` |
| Top N per group | rank in a subquery, `WHERE r <= n`; or `LATERAL … LIMIT n` |
| Above group average | `x > avg(x) OVER (PARTITION BY g)` or correlated `avg` |
| Find duplicates | `GROUP BY key HAVING count(*) > 1` |
| Delete duplicates | `DELETE … USING` self-join with `a.id > b.id`, or `row_number() > 1` |
| Rows without a match | `NOT EXISTS` / `LEFT JOIN … WHERE b.pk IS NULL` |
| Rows with a match | `EXISTS` / `IN` (semi-join) |
| Monthly totals | `date_trunc('month', ts)` + `GROUP BY` |
| Include empty periods | `generate_series` calendar + `LEFT JOIN` + `coalesce` |
| Running total | `sum(x) OVER (ORDER BY t, id ROWS UNBOUNDED PRECEDING)` |
| Change vs previous | `x - lag(x) OVER (ORDER BY t)` |
| Moving average | `avg(x) OVER (ORDER BY t ROWS BETWEEN n-1 PRECEDING AND CURRENT ROW)` |
| Consecutive days | `day - row_number()` → group by the difference |
| Runs of a status / sessions | change flag with `lag` → running `sum` → group |
| Gaps in ids | `lead(id) - id > 1` |
| Customers who bought all X | `HAVING count(DISTINCT x) = (SELECT count(*) …)` or double `NOT EXISTS` |
| Hierarchy / subordinates | recursive CTE: anchor + `UNION ALL` + join on parent |
| Pivot | `count(*) FILTER (WHERE …)` per column |
| Subtotals | `GROUP BY ROLLUP (…)` + `GROUPING()` |
| Upsert | `INSERT … ON CONFLICT (key) DO UPDATE SET … = EXCLUDED.…` |
| Latest N per user, fast | index `(user_id, ts DESC)` + `LATERAL … LIMIT n` |
| Keyset pagination | `WHERE (ts, id) < ($1, $2) ORDER BY ts DESC, id DESC LIMIT 20` |

## Join Reminders

- Inner = matches; left = all left; full = all both; cross = every pair.
- Outer-join filters on the optional side → `ON`.
- Aggregate children before joining two one-to-many tables.

## Self-Check

1. Write the second-highest salary query from memory, returning `NULL` when there is none.
2. Which ranking function for "top 3 salaries, ties included"?
3. How do you show months with zero sales?
4. How do you find users with 3 consecutive login days?
