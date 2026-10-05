# Joins Cheat Sheet

Every join type, its result, and the traps. Examples use the **sample database**.

## Join Types

| Join | Keeps | Unmatched rows |
|------|-------|----------------|
| `INNER JOIN` | Pairs satisfying `ON` | Dropped |
| `LEFT JOIN` | All left rows | Right columns `NULL` |
| `RIGHT JOIN` | All right rows | Left columns `NULL` |
| `FULL JOIN` | All rows of both | Missing side `NULL` |
| `CROSS JOIN` | Every pair (m × n) | — |
| Self join | Table with itself under two aliases | Depends on type |
| Semi-join | Left rows with a match (`EXISTS`, `IN`) | Dropped; no duplicates |
| Anti-join | Left rows without a match (`NOT EXISTS`, `LEFT JOIN … IS NULL`) | — |

## Syntax

```sql
-- Illustrative
FROM a JOIN b ON b.a_id = a.id               -- explicit condition
FROM a JOIN b USING (a_id)                   -- same-named columns, merged in output
FROM a NATURAL JOIN b                        -- all same-named columns (fragile; avoid)
FROM a LEFT JOIN LATERAL (subquery) x ON true -- per-row subquery
```

## Row Counts

```sql
SELECT (SELECT count(*) FROM departments d JOIN employees e ON e.dept_id = d.dept_id)      AS inner_rows,
       (SELECT count(*) FROM departments d LEFT JOIN employees e ON e.dept_id = d.dept_id) AS left_rows,
       (SELECT count(*) FROM departments d FULL JOIN employees e ON e.dept_id = d.dept_id) AS full_rows,
       (SELECT count(*) FROM departments CROSS JOIN employees)                             AS cross_rows;
```

**Output:**

```text
 inner_rows | left_rows | full_rows | cross_rows
------------+-----------+-----------+------------
         11 |        12 |        13 |         60
(1 row)
```

- Inner: 11 employees with a department.
- Left adds Research (no employees).
- Full also adds Nisha (no department).
- Cross: 5 × 12.

## Rules

- **`ON` vs `WHERE`** — for outer joins, conditions on the optional side go in `ON`; in `WHERE` they turn the join into an inner join.
- **Fan-out** — one-to-many joins multiply rows; aggregate child tables before joining two of them.
- **`NULL` keys never match** — `NULL = NULL` is unknown; rows with `NULL` join keys appear only via outer joins.
- **Anti-join** — test a never-null column of the right table (`WHERE b.id IS NULL`).
- **Self join** — two aliases: `employees e JOIN employees m ON m.emp_id = e.manager_id`.
- **Non-equi joins** — ranges (`o.order_date BETWEEN p.valid_from AND p.valid_to`) work; only nested loops (or range-aware indexes) can execute them.
- **Join order** — the planner reorders inner joins freely; write them for readability.

## Join Algorithms (PostgreSQL)

| Algorithm | Best when |
|-----------|-----------|
| Nested loop | Small outer side + index on the inner join key; non-equality joins |
| Hash join | Large unsorted inputs, equality joins; needs `work_mem` |
| Merge join | Both sides sorted (indexes) on the join key |

## Common Interview Asks

- "All customers with their orders, including those without" → `LEFT JOIN`.
- "Customers without orders" → `NOT EXISTS` or `LEFT JOIN … WHERE o.order_id IS NULL`.
- "Employee and manager names" → self join (`LEFT` to keep the CEO).
- "Every product × every month" → `CROSS JOIN` with `generate_series`, then `LEFT JOIN` facts.
