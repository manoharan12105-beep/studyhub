# SQL Overview: DDL, DML, DQL, DCL and TCL — Interview Questions

## Beginner

### Q1. What are DDL, DML, DCL and TCL? Give two commands for each.

<details>
<summary>Answer</summary>

DDL defines structure: `CREATE`, `ALTER`, `DROP`, `TRUNCATE`. DML changes data: `INSERT`, `UPDATE`, `DELETE`. DCL controls access: `GRANT`, `REVOKE`. TCL controls transactions: `COMMIT`, `ROLLBACK`, `SAVEPOINT`. `SELECT` is either DQL or part of DML depending on the classification.

</details>

### Q2. Why is SQL called a declarative language?

<details>
<summary>Answer</summary>

You state the result you want (which rows, which columns, which conditions), not the steps to compute it. The DBMS's optimizer chooses access paths, join order and algorithms. A procedural language such as Java spells out every loop and step.

</details>

### Q3. Is `TRUNCATE` DDL or DML?

<details>
<summary>Answer</summary>

DDL. It removes all rows by discarding and recreating the table's storage rather than deleting rows one by one, it does not fire per-row `DELETE` triggers, needs a stronger lock and resets identity columns with `RESTART IDENTITY`. (In PostgreSQL it can still be rolled back inside a transaction.)

</details>

## Intermediate

### Q4. Can DDL be rolled back?

<details>
<summary>Answer</summary>

Depends on the DBMS. In PostgreSQL, yes — `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE`, `TRUNCATE` and most other DDL are transactional. A few commands cannot run inside a transaction block (`CREATE DATABASE`, `CREATE INDEX CONCURRENTLY`, `VACUUM`). In Oracle and MySQL most DDL causes an implicit commit, so it cannot be rolled back.

</details>

### Q5. Which commands cannot run inside a transaction block in PostgreSQL?

<details>
<summary>Answer</summary>

Most DDL is transactional, but a few commands manage resources that cannot be rolled back and fail with `cannot run inside a transaction block`: `CREATE DATABASE`, `DROP DATABASE`, `CREATE TABLESPACE`/`DROP TABLESPACE`, `ALTER SYSTEM`, `VACUUM`, and the `CONCURRENTLY` variants (`CREATE INDEX CONCURRENTLY`, `REINDEX … CONCURRENTLY`, `DROP INDEX CONCURRENTLY`). Migration tools must run these outside their usual per-migration transaction.

</details>

### Q6. Is `SELECT` part of DML?

<details>
<summary>Answer</summary>

In the SQL standard and many textbooks, yes — data manipulation includes retrieval. Many courses and interviewers separate it as DQL. Say both: "`SELECT` is DQL, which some classifications treat as part of DML."

</details>

## Advanced

### Q7. Why is transactional DDL valuable for schema migrations?

<details>
<summary>Answer</summary>

A migration often contains several steps (create table, backfill, add constraint). If step three fails, PostgreSQL rolls everything back and the schema stays at the previous version, so the migration can be fixed and rerun. Without transactional DDL, a failure leaves a half-migrated schema that must be repaired by hand. Tools like Flyway run each PostgreSQL migration in a transaction for this reason (except statements that cannot run in one, such as `CREATE INDEX CONCURRENTLY`).

</details>

### Q8. Which category does `MERGE` belong to, and does PostgreSQL support it?

<details>
<summary>Answer</summary>

DML — it inserts, updates or deletes rows of a target table based on matches with a source. PostgreSQL supports the standard `MERGE` since version 15 (with `RETURNING` support added in 17). For single-table upserts, PostgreSQL's `INSERT … ON CONFLICT` is often simpler and handles concurrent inserts atomically.

</details>
