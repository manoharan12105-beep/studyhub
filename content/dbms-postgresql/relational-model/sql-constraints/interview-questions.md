# Constraints and Referential Integrity — Interview Questions

## Beginner

### Q1. What are constraints? Name the main ones.

<details>
<summary>Answer</summary>

Rules the database enforces on table data: `NOT NULL`, `UNIQUE`, `PRIMARY KEY`, `FOREIGN KEY` and `CHECK` (plus `EXCLUDE` in PostgreSQL). `DEFAULT` is a related column property that supplies a value when none is given. A statement that violates a constraint fails and changes nothing.

</details>

### Q2. What is referential integrity?

<details>
<summary>Answer</summary>

The guarantee that every foreign key value refers to an existing row in the referenced table (or is NULL). It prevents orphans such as an order whose customer does not exist. The DBMS enforces it with foreign key constraints on child inserts/updates and parent deletes/updates.

</details>

### Q3. What does `ON DELETE CASCADE` do?

<details>
<summary>Answer</summary>

When a parent row is deleted, all child rows referencing it are deleted automatically (and their own cascades fire in turn). Use it for parts that cannot exist without the parent, such as order items of an order.

</details>

### Q4. What is the difference between `NOT NULL` and `DEFAULT`?

<details>
<summary>Answer</summary>

`NOT NULL` is a constraint that rejects `NULL`. `DEFAULT` only supplies a value when the column is omitted from the `INSERT` (or `DEFAULT` is written). An explicit `NULL` bypasses the default and is stored — unless `NOT NULL` rejects it.

</details>

## Intermediate

### Q5. Compare `CASCADE`, `SET NULL`, `RESTRICT` and `NO ACTION`.

<details>
<summary>Answer</summary>

`CASCADE` deletes (or updates) the children with the parent. `SET NULL` keeps the children and sets their foreign key to NULL. `RESTRICT` and `NO ACTION` both refuse to delete a parent that still has children. The difference: `RESTRICT` checks immediately; `NO ACTION` (the default) checks at the end of the statement, and if the constraint is `DEFERRABLE` and deferred, at commit — so a transaction can fix things up before the check.

</details>

### Q6. Does `CHECK (price > 0)` reject a NULL price?

<details>
<summary>Answer</summary>

No. A `CHECK` fails only when its expression is false; `NULL > 0` is unknown, so the row is accepted. Add `NOT NULL` to reject it.

</details>

### Q7. Can a `CHECK` constraint reference another table?

<details>
<summary>Answer</summary>

Not reliably. PostgreSQL does not allow subqueries in `CHECK`, and wrapping one in a function is unsupported because the check is not re-run when the other table changes, so the rule can silently become false. Use a foreign key, an exclusion constraint, or a trigger for cross-table rules.

</details>

### Q8. How do you add a foreign key to a large production table safely?

<details>
<summary>Answer</summary>

Clean up violating rows first, then `ALTER TABLE child ADD CONSTRAINT … FOREIGN KEY … NOT VALID` — new writes are checked immediately but existing rows are not scanned under a heavy lock — and later `ALTER TABLE child VALIDATE CONSTRAINT …`, which scans with a weaker lock that does not block normal reads and writes. Also create an index on the referencing column (with `CREATE INDEX CONCURRENTLY`).

</details>

### Q9. Why enforce rules in the database when the application already validates?

<details>
<summary>Answer</summary>

Because the application is not the only writer (scripts, other services, migrations, manual fixes) and because application checks race under concurrency — two requests can both check "email not taken" and both insert. A `UNIQUE` constraint is atomic and always applies. Validate in the application for good error messages; enforce in the database for correctness.

</details>

## Advanced

### Q10. What are deferrable constraints and when would you use them?

<details>
<summary>Answer</summary>

`UNIQUE`, `PRIMARY KEY`, `FOREIGN KEY` and `EXCLUDE` constraints declared `DEFERRABLE` can have their checks postponed until `COMMIT` with `SET CONSTRAINTS … DEFERRED` (or `INITIALLY DEFERRED`). Uses: inserting rows with circular foreign keys, swapping values of a unique column (positions 1 and 2) in one transaction, bulk loads in arbitrary order. `CHECK` and `NOT NULL` are never deferrable.

</details>

### Q11. What are the dangers of `ON DELETE CASCADE`?

<details>
<summary>Answer</summary>

A single delete can remove large amounts of data across many tables, possibly unintentionally (deleting a customer wipes order history). Large cascades hold locks and generate heavy write and WAL volume, and without indexes on child foreign keys each cascade step scans whole tables. Use cascades for owned parts only; use `RESTRICT`/soft deletes for business records.

</details>

### Q12. How does PostgreSQL treat NULLs in a composite foreign key?

<details>
<summary>Answer</summary>

With the default `MATCH SIMPLE`, if any column of the foreign key is NULL, the constraint is not checked for that row. `MATCH FULL` requires all columns to be NULL or none. This matters for partially filled composite references.

</details>
