# Common Table Expressions — Interview Questions

## Beginner

### Q1. What is a CTE?

<details>
<summary>Answer</summary>

A common table expression is a named temporary result set defined with `WITH name AS (query)` before the main statement, and referenced like a table inside it. It exists only for that one statement. CTEs make multi-step queries readable and enable recursion (`WITH RECURSIVE`).

</details>

### Q2. How do you define more than one CTE?

<details>
<summary>Answer</summary>

With one `WITH` and a comma-separated list; later CTEs can reference earlier ones:

```sql
-- Illustrative
WITH a AS (SELECT …),
     b AS (SELECT … FROM a)
SELECT … FROM a JOIN b ON …;
```

</details>

### Q3. What is the difference between a CTE and a view?

<details>
<summary>Answer</summary>

A CTE belongs to a single statement and disappears after it; a view is a named query stored in the schema, reusable by any statement and subject to permissions. Neither stores data (except a materialized view, or a CTE that PostgreSQL materializes temporarily during execution).

</details>

## Intermediate

### Q4. CTE vs subquery — is there a performance difference in PostgreSQL?

<details>
<summary>Answer</summary>

Since PostgreSQL 12, a non-recursive, side-effect-free CTE referenced once is inlined, so it performs like the equivalent subquery. A CTE referenced more than once is materialized once by default, which can be cheaper (computed once) or more expensive (outer filters cannot be pushed in, no indexes on the materialized result). `MATERIALIZED` / `NOT MATERIALIZED` override the default. Before 12, all CTEs were materialized and acted as optimization fences.

</details>

### Q5. What is an optimization fence?

<details>
<summary>Answer</summary>

A boundary the planner does not optimize across: the fenced query is computed on its own and conditions from the outer query are applied afterwards instead of being pushed inside. A `MATERIALIZED` CTE is a fence, so `WITH x AS MATERIALIZED (SELECT * FROM big) SELECT * FROM x WHERE id = 5` reads all of `big` before filtering, whereas the inlined version could use an index on `id`. Fences are occasionally used deliberately to stop the planner from choosing a bad plan.

</details>

### Q6. CTE or temporary table for a large intermediate result?

<details>
<summary>Answer</summary>

A temporary table when the result is reused across several statements, is large and filtered or joined repeatedly (it can be indexed and `ANALYZE`d, so the planner has statistics), or when you want to inspect it while debugging. A CTE when it is used within one statement and readability is the goal.

</details>

## Advanced

### Q7. What are data-modifying CTEs?

<details>
<summary>Answer</summary>

A PostgreSQL feature allowing `INSERT`, `UPDATE` or `DELETE` inside `WITH`, usually with `RETURNING` so later parts can use the affected rows:

```sql
-- Illustrative
WITH moved AS (DELETE FROM orders WHERE status = 'CANCELLED' RETURNING *)
INSERT INTO orders_archive SELECT * FROM moved;
```

Each data-modifying sub-statement runs exactly once, all parts share one snapshot (the main query does not see the changes — only the `RETURNING` rows), and the whole statement is atomic.

</details>

### Q8. In `WITH u AS (UPDATE accounts SET balance = balance + 100 WHERE id = 1 RETURNING balance) SELECT balance FROM accounts WHERE id = 1`, what does the SELECT return?

<details>
<summary>Answer</summary>

The old balance. All sub-statements of a `WITH` run against the same snapshot taken at statement start, so the main `SELECT` cannot see the update made by the CTE. To get the new value, read it from `u` (`SELECT balance FROM u`). The update is committed with the statement and visible to later statements.

</details>

### Q9. Does PostgreSQL execute a CTE that the main query never references?

<details>
<summary>Answer</summary>

A plain `SELECT` CTE that is never referenced is not executed. A data-modifying CTE is always executed exactly once, even if nothing reads its output — a common source of surprise when a "debug" CTE deletes rows.

</details>
