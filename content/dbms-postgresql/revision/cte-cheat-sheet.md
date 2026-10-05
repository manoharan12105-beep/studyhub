# CTE Cheat Sheet

Common table expressions, recursive CTEs and data-modifying CTEs in PostgreSQL.

## Syntax

```sql
-- Illustrative
WITH step1 AS (SELECT …),
     step2 AS (SELECT … FROM step1)
SELECT … FROM step2;

WITH RECURSIVE tree AS (
    SELECT …               -- anchor
    UNION ALL
    SELECT … FROM t JOIN tree ON …   -- recursive term, runs until it returns no rows
)
SELECT … FROM tree;
```

## Key Facts

- A CTE exists for **one statement**; reference it like a table.
- PostgreSQL 12+: a side-effect-free, non-recursive CTE referenced **once** is **inlined** (optimised with the outer query). It is materialized when referenced more than once, or when written `AS MATERIALIZED`.
- `AS NOT MATERIALIZED` forces inlining; `AS MATERIALIZED` forces a single evaluation (an optimisation fence).
- Data-modifying CTEs (`WITH x AS (DELETE … RETURNING *) INSERT … SELECT FROM x`) run in the same snapshot and always execute, even if not referenced.
- Recursive CTEs need `UNION ALL` (or `UNION` to discard duplicate rows), a termination condition, and a cycle guard (`CYCLE id SET is_cycle USING path`, PostgreSQL 14+).
- `SEARCH DEPTH FIRST BY id SET ord` / `SEARCH BREADTH FIRST` (14+) give tree ordering.

## Recursive Example: Org Chart

```sql
WITH RECURSIVE org AS (
    SELECT emp_id, name, 1 AS level FROM employees WHERE manager_id IS NULL
    UNION ALL
    SELECT e.emp_id, e.name, o.level + 1
    FROM employees e JOIN org o ON e.manager_id = o.emp_id
)
SELECT level, count(*) AS people, string_agg(name, ', ' ORDER BY emp_id) AS names
FROM org
GROUP BY level
ORDER BY level;
```

**Output:**

```text
 level | people |                  names
-------+--------+------------------------------------------
     1 |      1 | Asha
     2 |      5 | Ravi, Divya, Vikram, Farhan, Nisha
     3 |      6 | Meena, Karan, Arjun, Sneha, Pooja, Rahul
(3 rows)
```

## CTE vs Alternatives

| | CTE | Subquery | View | Temp table |
|---|---|---|---|---|
| Scope | One statement | One place in one statement | Permanent, reusable | Session |
| Reuse within statement | Yes (by name) | No (repeat it) | Yes | Yes |
| Indexes / statistics | No | No | No (base tables) | Yes |
| Recursion | Yes | No | Via recursive view | No |

## Typical Uses

- Breaking a complex report into named steps.
- Top-N per group (rank in a CTE, filter outside).
- Hierarchies, bill of materials, graph paths (recursive).
- Number and date series (prefer `generate_series` in PostgreSQL).
- Moving rows atomically (`DELETE … RETURNING` → `INSERT`).
