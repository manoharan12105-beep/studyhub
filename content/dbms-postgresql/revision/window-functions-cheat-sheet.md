# Window Functions Cheat Sheet

Syntax, functions, frames and the problems they solve.

## Syntax

```sql
-- Illustrative
function(args) OVER (
    PARTITION BY group_cols        -- independent windows (optional)
    ORDER BY sort_cols             -- order within the window
    frame                          -- ROWS | RANGE | GROUPS BETWEEN … AND …
)
… WINDOW w AS (PARTITION BY … ORDER BY …)   -- reusable named window
```

- Rows are **not collapsed** (unlike `GROUP BY`).
- Evaluated after `WHERE`/`GROUP BY`/`HAVING`, before `ORDER BY`/`LIMIT` → filter results in an outer query.
- Aggregates can be nested: `sum(sum(x)) OVER (…)`.

## Functions

| Group | Functions |
|-------|-----------|
| Ranking | `row_number()`, `rank()`, `dense_rank()`, `ntile(n)`, `percent_rank()`, `cume_dist()` |
| Value | `lag(x, n, default)`, `lead(…)`, `first_value(x)`, `last_value(x)`, `nth_value(x, n)` |
| Aggregate | `sum`, `avg`, `count`, `min`, `max`, `array_agg`, `string_agg` … with `OVER` |

## Ranking on Ties

```sql
SELECT name, salary,
       row_number() OVER (ORDER BY salary DESC, emp_id) AS rn,
       rank()       OVER (ORDER BY salary DESC)         AS rnk,
       dense_rank() OVER (ORDER BY salary DESC)         AS drnk
FROM employees
WHERE dept_id = 20
ORDER BY salary DESC, emp_id;
```

**Output:**

```text
 name  | salary | rn | rnk | drnk
-------+--------+----+-----+------
 Divya |  88000 |  1 |   1 |    1
 Arjun |  60000 |  2 |   2 |    2
 Sneha |  60000 |  3 |   2 |    2
 Rahul |  55000 |  4 |   4 |    3
(4 rows)
```

## Frames

| Frame | Meaning |
|-------|---------|
| No `ORDER BY` | Whole partition |
| `ORDER BY` only (default) | `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` — includes peers (ties) |
| `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` | Last 3 rows |
| `RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW` | Last 7 calendar days |
| `GROUPS BETWEEN 1 PRECEDING AND CURRENT ROW` | Current and previous peer group |
| `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` | Whole partition (needed for `last_value`) |

`EXCLUDE CURRENT ROW | GROUP | TIES` removes rows from the frame.

## Problem → Pattern

| Problem | Pattern |
|---------|---------|
| Nth highest value | `dense_rank() = n` |
| Top N per group | `row_number()`/`dense_rank()` `<= n` per partition |
| Running total | `sum(x) OVER (ORDER BY t, id ROWS UNBOUNDED PRECEDING)` |
| Moving average | `avg(x) OVER (ORDER BY t ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)` |
| Change vs previous | `x - lag(x) OVER (ORDER BY t)` |
| Share of total | `x / sum(x) OVER ()` |
| Above group average | `x > avg(x) OVER (PARTITION BY g)` |
| Islands | `value - row_number() OVER (ORDER BY value)` |
| Deduplicate | `row_number() OVER (PARTITION BY key ORDER BY id) > 1` |

## Traps

- `last_value` with the default frame returns the current row.
- Unique tiebreakers for `row_number` and running totals.
- Missing `PARTITION BY` → computed over everyone.
- `lag` compares with the previous **row**, not the previous period, when periods are missing.
