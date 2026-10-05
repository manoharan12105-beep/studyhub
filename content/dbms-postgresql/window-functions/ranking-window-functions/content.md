# Ranking Window Functions

**Module:** Window Functions · **Interview priority:** Core

## What Is It?

**Ranking functions** number the rows of each window partition according to the window's `ORDER BY`:

| Function | Returns | Ties |
|----------|---------|------|
| `row_number()` | 1, 2, 3, … | Different numbers (order among ties arbitrary) |
| `rank()` | Position with gaps | Same rank; next rank skips: 1, 2, 2, **4** |
| `dense_rank()` | Position without gaps | Same rank; next rank continues: 1, 2, 2, **3** |
| `ntile(n)` | Bucket number 1…n | Rows split into n nearly equal buckets |
| `percent_rank()` | (rank − 1) / (rows − 1), 0…1 | Same for ties |
| `cume_dist()` | (rows ≤ current, peers included) / rows, >0…1 | Same for ties |

They ignore the frame clause — they always look at the whole partition in order.

## Why It Matters

- "Top N per group", "Nth highest salary", "remove duplicates keeping the latest" and "rank students with ties" are the most common SQL interview problems, and all are ranking-function problems.
- Choosing between `row_number`, `rank` and `dense_rank` is a deliberate decision about ties; interviewers ask for the difference with an example.

## Core Concept

### The three main functions side by side

Sales salaries ordered high to low:

```text
name    salary   row_number   rank   dense_rank
Divya    88000        1          1        1
Arjun    60000        2          2        2
Sneha    60000        3          2        2      ← tie
Rahul    55000        4          4        3      ← rank skips 3; dense_rank does not
```

- `row_number` — "pick exactly one / exactly N rows". Ties are broken arbitrarily unless you add a unique tiebreaker to `ORDER BY`.
- `rank` — "competition ranking": two people tie for 2nd, the next is 4th.
- `dense_rank` — "Nth distinct value": the Nth highest **salary**, regardless of how many people earn it.

### Choosing for top-N per group

| Requirement | Function | `WHERE` in outer query |
|-------------|----------|------------------------|
| Exactly N rows per group (ties cut arbitrarily or by a tiebreaker) | `row_number()` | `rn <= N` |
| Top N positions, all tied rows included (may return more than N) | `rank()` | `rnk <= N` |
| Top N distinct values, all rows having them | `dense_rank()` | `drnk <= N` |

### Deterministic results

`row_number()` over a non-unique `ORDER BY` can give different numbers on different runs or plans. Always end the window `ORDER BY` with a unique column (`ORDER BY salary DESC, emp_id`) when the choice among ties matters.

### ntile

`ntile(4)` splits the ordered partition into 4 buckets whose sizes differ by at most one; the first buckets get the extra rows (12 rows → 3, 3, 3, 3; 10 rows → 3, 3, 2, 2). Ties can be split across buckets.

### percent_rank and cume_dist

- `percent_rank()` = (rank − 1) / (partition rows − 1): 0 for the first row, 1 for the last (0 when the partition has one row).
- `cume_dist()` = (number of rows ordered before or tied with the current row) / partition rows: the fraction of rows at or below this one.

### PostgreSQL alternatives

- `DISTINCT ON (key) … ORDER BY key, sort` returns the first row per group — the simplest "top 1 per group" in PostgreSQL ([DISTINCT ON](../../postgresql-features/distinct-on/content.md)).
- `LATERAL (… ORDER BY … LIMIT n)` per group can use an index on large tables.

## Syntax

```sql
-- Illustrative
row_number()  OVER (PARTITION BY … ORDER BY …)
rank()        OVER (PARTITION BY … ORDER BY …)
dense_rank()  OVER (PARTITION BY … ORDER BY …)
ntile(n)      OVER (PARTITION BY … ORDER BY …)
percent_rank() OVER (…), cume_dist() OVER (…)
```

## Examples

### All three on the whole company

```sql
SELECT name, salary,
       row_number() OVER (ORDER BY salary DESC, emp_id) AS row_num,
       rank()       OVER (ORDER BY salary DESC)         AS rnk,
       dense_rank() OVER (ORDER BY salary DESC)         AS dense_rnk
FROM employees
ORDER BY salary DESC, emp_id;
```

**Output:**

```text
  name  | salary | row_num | rnk | dense_rnk
--------+--------+---------+-----+-----------
 Asha   | 150000 |       1 |   1 |         1
 Ravi   |  95000 |       2 |   2 |         2
 Meena  |  95000 |       3 |   2 |         2
 Divya  |  88000 |       4 |   4 |         3
 Farhan |  82000 |       5 |   5 |         4
 Karan  |  72000 |       6 |   6 |         5
 Vikram |  70000 |       7 |   7 |         6
 Arjun  |  60000 |       8 |   8 |         7
 Sneha  |  60000 |       9 |   8 |         7
 Rahul  |  55000 |      10 |  10 |         8
 Pooja  |  52000 |      11 |  11 |         9
 Nisha  |  45000 |      12 |  12 |        10
(12 rows)
```

Ravi and Meena tie for 2nd, so the next `rank` is 4; Arjun and Sneha tie for 8th, so the next is 10. `dense_rank` counts distinct salaries and never skips. `row_number` is unique only because `emp_id` breaks the ties.

### Top 2 earners per department — three interpretations

```sql
SELECT dept_id, name, salary, rnk, dense_rnk
FROM (SELECT dept_id, name, salary,
             rank()       OVER w AS rnk,
             dense_rank() OVER w AS dense_rnk
      FROM employees
      WHERE dept_id IN (10, 20)
      WINDOW w AS (PARTITION BY dept_id ORDER BY salary DESC)) AS t
WHERE dense_rnk <= 2
ORDER BY dept_id, salary DESC, name;
```

**Output:**

```text
 dept_id | name  | salary | rnk | dense_rnk
---------+-------+--------+-----+-----------
      10 | Asha  | 150000 |   1 |         1
      10 | Meena |  95000 |   2 |         2
      10 | Ravi  |  95000 |   2 |         2
      20 | Divya |  88000 |   1 |         1
      20 | Arjun |  60000 |   2 |         2
      20 | Sneha |  60000 |   2 |         2
(6 rows)
```

- `row_number() OVER w` with `WHERE row_num <= 2` would return Asha plus **one** of Ravi/Meena, and Divya plus one of Arjun/Sneha — which one is arbitrary because `ORDER BY salary DESC` has ties.
- `WHERE rnk <= 2` returns all rows shown (both tied employees have rank 2).
- `WHERE dense_rnk <= 2` returns the rows with the two highest distinct salaries — here the same rows.

### Nth highest salary with dense_rank

Third highest distinct salary in the company:

```sql
SELECT DISTINCT salary
FROM (SELECT salary, dense_rank() OVER (ORDER BY salary DESC) AS dr
      FROM employees) AS t
WHERE dr = 3;
```

**Output:**

```text
 salary
--------
  88000
(1 row)
```

150000 → 1, 95000 → 2, 88000 → 3. With `rank()`, no row has rank 3 (it jumps from 2 to 4), so the query would return nothing — a classic bug. If no third salary exists, the result is empty rather than `NULL`; wrap it as `(SELECT …)` in a scalar context to get `NULL`.

### Deduplicate: keep the latest row per key

**Schema and data:**

```sql
CREATE TABLE login_events (user_name text, login_at timestamp, ip text);
INSERT INTO login_events VALUES
    ('anil',   '2026-03-01 09:00', '10.0.0.1'),
    ('anil',   '2026-03-02 10:00', '10.0.0.2'),
    ('bhavna', '2026-03-01 08:30', '10.0.0.5'),
    ('anil',   '2026-03-02 10:00', '10.0.0.3'),
    ('bhavna', '2026-03-03 07:45', '10.0.0.6');
```

Latest login per user; Anil has two logins at the same latest moment, so a tiebreaker (`ip DESC`) decides:

```sql
SELECT user_name, login_at, ip
FROM (SELECT *, row_number() OVER (PARTITION BY user_name
                                   ORDER BY login_at DESC, ip DESC) AS rn
      FROM login_events) AS t
WHERE rn = 1
ORDER BY user_name;
```

**Output:**

```text
 user_name |      login_at       |    ip
-----------+---------------------+----------
 anil      | 2026-03-02 10:00:00 | 10.0.0.3
 bhavna    | 2026-03-03 07:45:00 | 10.0.0.6
(2 rows)
```

To delete the older duplicates instead of selecting the newest, see [Duplicates and Missing Data Problems](../../sql-problem-solving/duplicates-and-missing-data-problems/content.md).

### ntile: quartiles

```sql
SELECT name, salary, ntile(4) OVER (ORDER BY salary DESC, emp_id) AS quartile
FROM employees
ORDER BY salary DESC, emp_id;
```

**Output:**

```text
  name  | salary | quartile
--------+--------+----------
 Asha   | 150000 |        1
 Ravi   |  95000 |        1
 Meena  |  95000 |        1
 Divya  |  88000 |        2
 Farhan |  82000 |        2
 Karan  |  72000 |        2
 Vikram |  70000 |        3
 Arjun  |  60000 |        3
 Sneha  |  60000 |        3
 Rahul  |  55000 |        4
 Pooja  |  52000 |        4
 Nisha  |  45000 |        4
(12 rows)
```

Twelve rows split into four buckets of three. The tied pairs happen to stay together here, but `ntile` cuts by row count, not by value: with `ntile(5)` (bucket sizes 3, 3, 2, 2, 2) Arjun falls in bucket 3 and Sneha, with the same salary, in bucket 4.

### percent_rank and cume_dist

```sql
SELECT name, salary,
       round(percent_rank() OVER (ORDER BY salary)::numeric, 3) AS pct_rank,
       round(cume_dist()    OVER (ORDER BY salary)::numeric, 3) AS cume_dist
FROM employees
WHERE dept_id = 20
ORDER BY salary, name;
```

**Output:**

```text
 name  | salary | pct_rank | cume_dist
-------+--------+----------+-----------
 Rahul |  55000 |    0.000 |     0.250
 Arjun |  60000 |    0.333 |     0.750
 Sneha |  60000 |    0.333 |     0.750
 Divya |  88000 |    1.000 |     1.000
(4 rows)
```

For Arjun/Sneha: rank 2, so `percent_rank` = (2 − 1) / (4 − 1) = 0.333; three of four rows have salary ≤ 60000, so `cume_dist` = 0.75.

### Rank groups by an aggregate

Customers ranked by number of orders:

```sql
SELECT c.name, count(o.order_id) AS orders,
       rank() OVER (ORDER BY count(o.order_id) DESC) AS position
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.customer_id
GROUP BY c.customer_id
ORDER BY position, c.name;
```

**Output:**

```text
  name  | orders | position
--------+--------+----------
 Anil   |      3 |        1
 Bhavna |      2 |        2
 Chirag |      1 |        3
 Deepa  |      1 |        3
 Eshan  |      1 |        3
 Fatima |      0 |        6
(6 rows)
```

## Comparison

### row_number vs rank vs dense_rank

| Values `100, 90, 90, 80` | `row_number` | `rank` | `dense_rank` |
|--------------------------|--------------|--------|--------------|
| 100 | 1 | 1 | 1 |
| 90 | 2 | 2 | 2 |
| 90 | 3 | 2 | 2 |
| 80 | 4 | 4 | 3 |
| Unique per row? | Yes | No | No |
| Gaps? | No | Yes | No |
| Use for | Exactly N rows, dedup, pagination | Competition ranking | Nth distinct value |

## Common Mistakes

- Using `rank()` for "Nth highest salary" — gaps can skip N entirely.
- Using `row_number()` with ties and no tiebreaker, then getting different rows on each run.
- Filtering the rank in `WHERE` of the same query (must be an outer query).
- Forgetting `PARTITION BY` and ranking across the whole table when the question says "per group".
- Assuming `ntile` keeps ties together.
- Expecting `DISTINCT` to be unnecessary after `dense_rank() = N` — several rows can share the Nth value.

## Revision

- `row_number`: 1, 2, 3, 4 — unique; ties broken arbitrarily unless the order is unique.
- `rank`: 1, 2, 2, 4 — gaps after ties. `dense_rank`: 1, 2, 2, 3 — no gaps.
- Top-N per group: rank in a subquery/CTE with `PARTITION BY`, filter outside; choose the function by tie policy.
- Nth highest distinct value: `dense_rank() = N`.
- `ntile(n)` buckets by row count; `percent_rank` = (rank−1)/(n−1); `cume_dist` = rows ≤ current / n.

## Quick Revision

row_number numbers rows uniquely, rank leaves gaps after ties, dense_rank does not — rank inside a subquery and filter outside for top-N per group, and use dense_rank for the Nth highest value.
