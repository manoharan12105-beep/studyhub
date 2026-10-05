# Query Optimization in Practice — Practice

### P1. Sargable or not?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** sargable predicates

`orders(created_at)` is indexed. Which condition can use the index directly?

- A) `WHERE extract(year FROM created_at) = 2026`
- B) `WHERE created_at + INTERVAL '30 days' > now()`
- C) `WHERE created_at > now() - INTERVAL '30 days'`
- D) `WHERE to_char(created_at, 'YYYY') = '2026'`

<details>
<summary>Answer</summary>

**Answer:** C)

**Explanation:** Only C leaves `created_at` alone on one side; the others apply a function or arithmetic to the column.

</details>

### P2. Keyset pagination query

**Difficulty:** Medium · **Type:** Query · **Concepts:** keyset pagination, composite order

Employees are listed by salary (highest first), 4 per page, ties broken by `emp_id`. The last row of page 1 was (salary 88000, emp_id 5). Write the query for page 2 without `OFFSET`.

**Expected output:**

```text
 emp_id |  name  | salary
--------+--------+--------
     10 | Farhan |  82000
      4 | Karan  |  72000
      8 | Vikram |  70000
      7 | Sneha  |  60000
(4 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT emp_id, name, salary
FROM employees
WHERE (salary, emp_id) < (88000, 5)
ORDER BY salary DESC, emp_id DESC
LIMIT 4;
```

**Explanation:** The row comparison `(salary, emp_id) < (88000, 5)` continues exactly after the last row of page 1 in `(salary DESC, emp_id DESC)` order; with an index on `(salary, emp_id)` PostgreSQL reads only these 4 rows. Note the tiebreaker direction must match (`emp_id DESC` here), so all sort keys run the same way.

</details>

### P3. Remove the N+1

**Difficulty:** Medium · **Type:** Query · **Concepts:** N+1, aggregation in one query

An endpoint lists every department and, for each, runs `SELECT count(*), max(salary) FROM employees WHERE dept_id = ?`. Replace the 1 + N queries with one query (departments without employees must appear with 0).

**Expected output:**

```text
 dept_id |  dept_name  | headcount | top_salary
---------+-------------+-----------+------------
      10 | Engineering |         4 |     150000
      20 | Sales       |         4 |      88000
      30 | HR          |         2 |      70000
      40 | Finance     |         1 |      82000
      50 | Research    |         0 |       NULL
(5 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT d.dept_id, d.dept_name, count(e.emp_id) AS headcount, max(e.salary) AS top_salary
FROM departments d
LEFT JOIN employees e ON e.dept_id = d.dept_id
GROUP BY d.dept_id
ORDER BY d.dept_id;
```

</details>

### P4. Diagnose from the plan

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** reading plans, fixes

For each plan fragment, name the problem and the fix:

1. `Seq Scan on orders (actual rows=12 …) Filter: (customer_id = 4711) Rows Removed by Filter: 3999988`
2. `Sort Method: external merge  Disk: 812000kB` under a report's `ORDER BY created_at`
3. `Index Scan using orders_pkey … (actual rows=500020 …)` under `Limit (actual rows=20)` for `OFFSET 500000`
4. `Filter: (lower(email) = 'a@b.com')` on a 10-million-row table with an index on `email`

<details>
<summary>Answer</summary>

1. Missing index on the foreign key `customer_id` → `CREATE INDEX ON orders (customer_id)`.
2. Sort spilling 800 MB to disk → index on `created_at` (if the report reads in that order, ideally with `LIMIT`) or more `work_mem` for this report only.
3. Deep `OFFSET` → keyset pagination (`WHERE id > :last ORDER BY id LIMIT 20`).
4. Function on the column hides the index → expression index on `lower(email)` (or `citext`), or store emails normalized.

</details>

### P5. Speed up a dashboard query

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** workflow, trade-offs

A dashboard shows "revenue per day for the last 90 days" from a 300-million-row `order_lines` table. The query takes 40 seconds, runs every time someone opens the dashboard (about 2,000 times a day), and the data is append-only. Outline your approach.

<details>
<summary>Answer</summary>

1. `EXPLAIN (ANALYZE, BUFFERS)`: it probably scans 90 days of lines (tens of millions of rows) and aggregates them — no index makes that cheap.
2. Make the scan as small as possible: a sargable date range; if the table is partitioned by month, partition pruning limits the scan to 3–4 partitions; a BRIN index on the timestamp helps on append-only data.
3. Precompute: a `daily_revenue` summary table updated incrementally (upsert of today's total by a scheduled job or trigger), or a materialized view refreshed every few minutes with `REFRESH MATERIALIZED VIEW CONCURRENTLY`. The dashboard then reads 90 rows.
4. Verify: dashboard latency in milliseconds; refresh cost acceptable; document the staleness (e.g. up to 5 minutes).

</details>
