# DISTINCT ON — Interview Questions

## Beginner

### Q1. What does DISTINCT ON do?

<details>
<summary>Answer</summary>

`SELECT DISTINCT ON (k) …` returns one row for each distinct value of `k`: the first row of that group according to `ORDER BY`. Example: `SELECT DISTINCT ON (customer_id) * FROM orders ORDER BY customer_id, order_date DESC` returns each customer's latest order. It is a PostgreSQL extension.

</details>

### Q2. How is DISTINCT ON different from DISTINCT?

<details>
<summary>Answer</summary>

`DISTINCT` removes rows that are identical in **all** selected columns. `DISTINCT ON (k)` removes rows that share `k`, keeping one full row per `k` even though the other columns differ. `SELECT DISTINCT dept_id, name` returns one row per (department, name) pair; `SELECT DISTINCT ON (dept_id) dept_id, name` returns one row per department.

</details>

## Intermediate

### Q3. What is the rule about ORDER BY with DISTINCT ON?

<details>
<summary>Answer</summary>

The `DISTINCT ON` expressions must be the leftmost `ORDER BY` expressions, in the same order; otherwise PostgreSQL raises "SELECT DISTINCT ON expressions must match initial ORDER BY expressions". The `ORDER BY` items after them choose which row of each group is kept. To sort the final result differently, wrap the query in a subquery and add an outer `ORDER BY`.

</details>

### Q4. DISTINCT ON vs ROW_NUMBER — when would you use each?

<details>
<summary>Answer</summary>

Both return one row per group. `DISTINCT ON` is shorter and often slightly faster in PostgreSQL (Sort → Unique, no window computation). `row_number()` is standard SQL (portable) and extends to top-N per group (`rn <= 3`); `rank()` additionally keeps ties. Use `DISTINCT ON` for PostgreSQL-only top-1 queries.

</details>

### Q5. Two employees tie for the highest salary in a department. Which one does DISTINCT ON return?

<details>
<summary>Answer</summary>

Whichever comes first in the sort — and if `ORDER BY dept_id, salary DESC` does not distinguish them, that is unpredictable and may change between runs. Add a unique tiebreaker (`ORDER BY dept_id, salary DESC, emp_id`) to make it deterministic, or use `rank() = 1` if both should be returned.

</details>

## Advanced

### Q6. How can you make a DISTINCT ON query fast on a large table?

<details>
<summary>Answer</summary>

Create an index matching the `ORDER BY` — e.g. `(customer_id, order_date DESC)` — so PostgreSQL can read rows in order (Index Scan → Unique) without sorting. If there are few groups but millions of rows per group, it still reads every row; then iterate over the groups and fetch one row each with `CROSS JOIN LATERAL (SELECT … WHERE o.customer_id = c.customer_id ORDER BY order_date DESC LIMIT 1)`, which does one index lookup per group.

</details>

### Q7. How would you deduplicate a staging table, keeping the newest row per key, before an upsert?

<details>
<summary>Answer</summary>

```sql
-- Illustrative
INSERT INTO target (key, payload)
SELECT DISTINCT ON (key) key, payload
FROM staging
ORDER BY key, updated_at DESC, id DESC
ON CONFLICT (key) DO UPDATE SET payload = EXCLUDED.payload;
```

`DISTINCT ON` guarantees each key appears once, which also avoids the "ON CONFLICT DO UPDATE command cannot affect row a second time" error.

</details>
