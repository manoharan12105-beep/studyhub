# DDL: CREATE, ALTER, DROP and TRUNCATE — Interview Questions

## Beginner

### Q1. What is the difference between DELETE, TRUNCATE and DROP?

<details>
<summary>Answer</summary>

`DELETE` is DML: removes the rows matching a `WHERE` (or all rows), one by one, firing `DELETE` triggers; the table remains. `TRUNCATE` is DDL: removes all rows at once by replacing the table's storage — much faster, frees space immediately, no `WHERE`, no `DELETE` triggers; the table remains. `DROP TABLE` removes the table itself — data, structure, indexes, constraints. In PostgreSQL all three can be rolled back inside a transaction.

</details>

### Q2. How do you add a column to an existing table?

<details>
<summary>Answer</summary>

`ALTER TABLE customers ADD COLUMN phone text;` Optionally with a default and `NOT NULL`: `ADD COLUMN is_active boolean NOT NULL DEFAULT true`. In PostgreSQL 11+, a constant default does not rewrite the table, so this is instant even on large tables.

</details>

### Q3. What does `IF EXISTS` / `IF NOT EXISTS` do?

<details>
<summary>Answer</summary>

`DROP TABLE IF EXISTS t` does not raise an error when `t` is missing (it issues a notice). `CREATE TABLE IF NOT EXISTS t (...)` skips creation when a table named `t` exists — without checking that the existing definition matches.

</details>

## Intermediate

### Q4. Can TRUNCATE be rolled back?

<details>
<summary>Answer</summary>

In PostgreSQL, yes: inside `BEGIN … ROLLBACK` the rows come back, because the old storage is kept until commit. In Oracle and MySQL, `TRUNCATE` commits implicitly and cannot be rolled back. Always name the database.

</details>

### Q5. Why is TRUNCATE faster than DELETE?

<details>
<summary>Answer</summary>

`DELETE` visits every row, marks it deleted (setting `xmax` in PostgreSQL's MVCC), writes WAL for each, fires triggers and checks foreign keys per row, and leaves dead rows for `VACUUM`. `TRUNCATE` simply assigns the table new empty files and discards the old ones at commit — work proportional to the number of files, not rows.

</details>

### Q6. Why does `TRUNCATE orders` fail when `order_items` references it?

<details>
<summary>Answer</summary>

`TRUNCATE` does not check rows individually, so it cannot know whether referencing rows exist; PostgreSQL therefore refuses to truncate a referenced table unless the referencing tables are truncated in the same command (`TRUNCATE orders, order_items`) or `CASCADE` is used. `CASCADE` truncates all referencing tables completely.

</details>

### Q7. What does `DROP TABLE departments CASCADE` do to `employees`?

<details>
<summary>Answer</summary>

It drops the foreign key constraint `employees_dept_id_fkey` (a dependent object) along with `departments`. The `employees` table and its rows, including `dept_id` values, remain — now unchecked. Dependent views would be dropped too.

</details>

### Q8. What is the difference between `CREATE TABLE … AS SELECT` and `CREATE TABLE … (LIKE …)`?

<details>
<summary>Answer</summary>

`CREATE TABLE AS` creates a table from a query's result: column names, types and data, but no constraints, defaults or indexes. `CREATE TABLE new (LIKE old INCLUDING ALL)` copies the definition — defaults, constraints, indexes, identity, comments — but no data.

</details>

## Advanced

### Q9. Which `ALTER TABLE` operations are dangerous on a large production table in PostgreSQL?

<details>
<summary>Answer</summary>

Those that rewrite or scan the table under a strong lock: changing a column type (most cases), adding a column with a volatile default, `SET NOT NULL` (full scan), adding a `CHECK` or foreign key without `NOT VALID`, and `VACUUM FULL`/`CLUSTER`. Every `ALTER TABLE` also needs an `ACCESS EXCLUSIVE` lock briefly; if it waits behind a long transaction, all later queries queue behind it. Mitigations: `lock_timeout`, `NOT VALID` + `VALIDATE CONSTRAINT`, `CREATE INDEX CONCURRENTLY`, and expand-and-contract migrations (add new column, backfill in batches, switch, drop old).

</details>

### Q10. What does "TRUNCATE is not MVCC-safe" mean?

<details>
<summary>Answer</summary>

After a `TRUNCATE` commits, a concurrent transaction whose snapshot was taken before it (for example in REPEATABLE READ) that reads the table for the first time sees it as empty, rather than seeing the rows that existed in its snapshot. `DELETE` does not have this problem because old row versions stay visible to older snapshots.

</details>
