# Subqueries Cheat Sheet

Kinds of subqueries, where they can appear, and which form to choose.

## Kinds

| Kind | Returns | Example |
|------|---------|---------|
| Scalar | One value (or `NULL` if no row) | `WHERE salary > (SELECT avg(salary) FROM employees)` |
| Row | One row | `WHERE (dept_id, salary) = (SELECT dept_id, max(salary) …)` |
| Table / derived table | A set of rows in `FROM` | `FROM (SELECT … GROUP BY …) t` |
| Correlated | Depends on the outer row | `WHERE salary > (SELECT avg(salary) FROM employees x WHERE x.dept_id = e.dept_id)` |
| `LATERAL` | Table subquery per outer row | `CROSS JOIN LATERAL (… LIMIT 3)` |

A scalar subquery returning more than one row is an error: `more than one row returned by a subquery used as an expression`.

## Operators

| Operator | True when | `NULL` behaviour |
|----------|-----------|------------------|
| `EXISTS (q)` | `q` returns at least one row | Never unknown |
| `NOT EXISTS (q)` | `q` returns no rows | Never unknown — safe |
| `x IN (q)` | `x` equals some value | Unknown if no match and `q` has a `NULL` |
| `x NOT IN (q)` | `x` differs from all values | **No rows** if `q` has a `NULL` |
| `x > ANY (q)` | Greater than at least one | — |
| `x > ALL (q)` | Greater than every value; true for an empty `q` | — |

## Examples

```sql
SELECT name, salary
FROM employees e
WHERE salary > (SELECT avg(salary) FROM employees x WHERE x.dept_id = e.dept_id)
ORDER BY salary DESC;
```

**Output:**

```text
  name  | salary
--------+--------
 Asha   | 150000
 Divya  |  88000
 Vikram |  70000
(3 rows)
```

```sql
SELECT c.name
FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id AND o.status = 'CANCELLED');
```

**Output:**

```text
  name
--------
 Chirag
(1 row)
```

## Choosing a Form

- "Has at least one" → `EXISTS` / `IN` (semi-join; no duplicates).
- "Has none" → `NOT EXISTS` (never `NOT IN` over a nullable column).
- "Compare with an aggregate" → scalar subquery, or a window function to avoid re-reading.
- "Per-group values next to rows" → window function (`avg() OVER (PARTITION BY …)`) or join to a grouped derived table.
- "Top N per row of another table" → `LATERAL … LIMIT`.
- Long, nested queries → name the steps with CTEs.

## Performance Notes

- PostgreSQL turns `EXISTS`/`IN`/`NOT EXISTS` subqueries into semi- and anti-joins.
- Correlated scalar subqueries usually run once per outer row — fine with an index on the correlation column, slow without.
- `NOT IN (subquery)` cannot become an anti-join (because of `NULL` semantics) and may be slow as well as wrong.
