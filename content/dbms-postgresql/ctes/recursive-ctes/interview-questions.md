# Recursive CTEs — Interview Questions

## Beginner

### Q1. What is a recursive CTE and what are its parts?

<details>
<summary>Answer</summary>

A CTE that references itself, declared with `WITH RECURSIVE`. It has an **anchor** (non-recursive) query that produces the starting rows, `UNION` or `UNION ALL`, and a **recursive** query that references the CTE to produce the next rows. It is used for hierarchies (org charts, category trees), graphs and generated sequences.

</details>

### Q2. Write a query to list all employees under a given manager, at any depth.

<details>
<summary>Answer</summary>

```sql
WITH RECURSIVE team AS (
    SELECT emp_id, name, 1 AS depth
    FROM employees
    WHERE manager_id = 1               -- the manager's id
  UNION ALL
    SELECT e.emp_id, e.name, t.depth + 1
    FROM employees e
    JOIN team t ON e.manager_id = t.emp_id
)
SELECT * FROM team ORDER BY depth, emp_id;
```

The anchor finds direct reports; each iteration finds the reports of the rows found in the previous iteration.

</details>

### Q3. How does a recursive CTE know when to stop?

<details>
<summary>Answer</summary>

It stops when an iteration produces no new rows. In a tree, the leaves have no children, so the last iteration is empty. With generators, a condition such as `WHERE i < 10` in the recursive part makes the step eventually empty. If the data has a cycle and nothing prevents revisiting, it never stops.

</details>

## Intermediate

### Q4. How does PostgreSQL actually execute a recursive CTE?

<details>
<summary>Answer</summary>

Iteratively, with a working table: run the anchor, put its rows in the result and the working table; run the recursive part reading only the working table; the produced rows (minus duplicates, with `UNION`) are appended to the result and become the new working table; repeat until the working table is empty. Each iteration sees only the previous iteration's rows, not the whole result.

</details>

### Q5. UNION or UNION ALL in a recursive CTE?

<details>
<summary>Answer</summary>

`UNION ALL` is faster (no duplicate check) and the usual choice for trees. `UNION` discards rows already in the result, which stops simple cycles — but only when the repeated rows are identical. If you carry a `level` or `path` column, every row is new and `UNION` will not stop the loop.

</details>

### Q6. How do you handle cycles in hierarchical data?

<details>
<summary>Answer</summary>

Options: (1) the SQL-standard `CYCLE col SET is_cycle USING path` clause (PostgreSQL 14+), which marks and stops paths that revisit a value; (2) carry an array of visited ids and add `WHERE NOT next_id = ANY (path)`; (3) a maximum depth (`WHERE level < 50`) as a safety net. Also consider preventing cycles at write time (e.g. a trigger check).

</details>

### Q7. Show the management chain of an employee up to the CEO.

<details>
<summary>Answer</summary>

```sql
WITH RECURSIVE chain AS (
    SELECT emp_id, name, manager_id, 0 AS steps
    FROM employees WHERE emp_id = 9
  UNION ALL
    SELECT m.emp_id, m.name, m.manager_id, c.steps + 1
    FROM employees m
    JOIN chain c ON m.emp_id = c.manager_id
)
SELECT steps, name FROM chain ORDER BY steps;
```

The join direction is reversed compared with walking down: the next row is the current row's manager.

</details>

## Advanced

### Q8. What are the restrictions on the recursive part?

<details>
<summary>Answer</summary>

The self-reference may appear only once and not inside aggregates, window functions, `DISTINCT`, `GROUP BY`, `ORDER BY`, `LIMIT`/`OFFSET`, subqueries, or on the nullable side of an outer join. The anchor's column types fix the CTE's types, so values that grow (paths) must be cast to a wide type such as `text` in the anchor.

</details>

### Q9. How would you print a hierarchy in tree order (each node followed by its subtree)?

<details>
<summary>Answer</summary>

Build a sort key while recursing — a text path (`parent_path || ' > ' || name`) or an array of ids — and `ORDER BY` it; indent with `repeat('  ', level)`. PostgreSQL 14+ also offers `SEARCH DEPTH FIRST BY id SET ord` and then `ORDER BY ord`. `SEARCH BREADTH FIRST` gives level order.

</details>

### Q10. Recursive CTE vs storing the hierarchy differently — when would you choose another model?

<details>
<summary>Answer</summary>

An adjacency list (`parent_id`) with recursive CTEs is simple and keeps writes cheap; reads of large subtrees cost one join per level. If subtree reads dominate on deep, large trees, a materialized path (`ltree` extension in PostgreSQL), nested sets, or a closure table (one row per ancestor–descendant pair) make reads a single indexed query at the cost of more complex writes when nodes move.

</details>
