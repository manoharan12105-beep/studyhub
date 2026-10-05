# Views — Interview Questions

## Beginner

### Q1. What is a view?

<details>
<summary>Answer</summary>

A named, stored `SELECT` that can be queried like a table. It holds no data of its own: each query on the view runs its definition against the current tables. Views simplify complex queries, provide a stable interface over changing tables, and restrict which columns or rows users can see.

</details>

### Q2. What is the difference between a view and a table?

<details>
<summary>Answer</summary>

A table stores rows; a view stores only a query. A view's result is always computed from current data, takes no storage (beyond its definition), cannot have its own indexes, and is writable only when it is simple (or has `INSTEAD OF` triggers). Dropping the base table breaks the view (PostgreSQL prevents it unless `CASCADE`).

</details>

### Q3. Does a view improve performance?

<details>
<summary>Answer</summary>

Not by itself. PostgreSQL merges the view's query into the outer query and plans it as a whole, so it performs exactly like writing the query directly (sometimes slightly better or worse depending on how the combined query optimizes). To cache results, use a materialized view or a summary table.

</details>

## Intermediate

### Q4. Can you insert or update data through a view?

<details>
<summary>Answer</summary>

Yes for automatically updatable views: one base table in `FROM`, no aggregates, `DISTINCT`, `GROUP BY`, `HAVING`, window functions, set operations or `LIMIT`. Writes go to the base table; computed columns are read-only. For other views, define `INSTEAD OF INSERT/UPDATE/DELETE` triggers that translate the change into base-table operations.

</details>

### Q5. What does WITH CHECK OPTION do?

<details>
<summary>Answer</summary>

It rejects `INSERT` and `UPDATE` operations through the view that would create rows not satisfying the view's `WHERE` condition — preventing rows from "disappearing" from the view right after being written. `CASCADED` (default) also enforces the conditions of underlying views; `LOCAL` only the view's own.

</details>

### Q6. How can a view be used for security?

<details>
<summary>Answer</summary>

Create a view exposing only permitted columns or rows (e.g. without salary, or only the user's department) and grant `SELECT` on the view but not on the table. By default views execute with the privileges of their owner, so users need no rights on the base table. Add `security_barrier` for row-filtering views so that user-defined functions in queries cannot observe hidden rows; use `security_invoker` (PostgreSQL 15+) when the view should instead respect the caller's privileges and row-level security.

</details>

## Advanced

### Q7. Why can't you change a column's type with CREATE OR REPLACE VIEW?

<details>
<summary>Answer</summary>

`CREATE OR REPLACE VIEW` must keep the existing output columns with the same names, types and order — other objects (views, functions, applications) may depend on them. It can only append new columns. To remove, rename or retype a column, drop the view (and its dependents) and recreate it, usually inside one transaction.

</details>

### Q8. A view was defined as SELECT * FROM t. After adding a column to t, the view does not show it. Why?

<details>
<summary>Answer</summary>

`*` is expanded into the explicit column list when the view is created; the stored definition refers to the columns that existed then. Recreate the view (`CREATE OR REPLACE` can append the new column) to include later columns — and prefer explicit column lists in view definitions.

</details>

### Q9. What happens to a view when its underlying table is renamed or a column is renamed?

<details>
<summary>Answer</summary>

The view keeps working. PostgreSQL stores views as parsed query trees referencing objects by internal identifiers (OIDs and column numbers), not by name, so renames are followed automatically; `pg_get_viewdef` shows the new names. Dropping a referenced table or column, however, is blocked unless `CASCADE` drops the view too.

</details>
