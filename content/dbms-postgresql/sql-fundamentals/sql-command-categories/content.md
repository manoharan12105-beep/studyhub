# SQL Overview: DDL, DML, DQL, DCL and TCL

**Module:** SQL Fundamentals · **Interview priority:** Core

## What Is It?

**SQL** (Structured Query Language) is the standard language for relational databases. It is **declarative**: you describe *what* result you want, and the DBMS's planner decides *how* to compute it. SQL statements are grouped by purpose:

| Category | Stands for | Purpose | Commands |
|----------|-----------|---------|----------|
| DDL | Data Definition Language | Define and change structure | `CREATE`, `ALTER`, `DROP`, `TRUNCATE`, `COMMENT`, `RENAME` (via `ALTER … RENAME`) |
| DML | Data Manipulation Language | Change data | `INSERT`, `UPDATE`, `DELETE`, `MERGE` |
| DQL | Data Query Language | Read data | `SELECT` |
| DCL | Data Control Language | Control access | `GRANT`, `REVOKE` |
| TCL | Transaction Control Language | Group statements into transactions | `BEGIN`/`START TRANSACTION`, `COMMIT`, `ROLLBACK`, `SAVEPOINT`, `RELEASE SAVEPOINT`, `ROLLBACK TO SAVEPOINT` |

## Why It Matters

- "What are DDL, DML, DCL and TCL? Give examples" is one of the most common SQL interview openers.
- The categories explain behaviour: for example, `TRUNCATE` is DDL, so it behaves differently from `DELETE` (DML).
- PostgreSQL differs from some databases in an important way: its DDL is **transactional** and can be rolled back.

## Core Concept

### SQL is declarative

```sql
-- "What": the names of Engineering employees earning over 80000
SELECT e.name
FROM employees e
JOIN departments d ON d.dept_id = e.dept_id
WHERE d.dept_name = 'Engineering' AND e.salary > 80000
ORDER BY e.name;
```

**Output:**

```text
 name
-------
 Asha
 Meena
 Ravi
(3 rows)
```

You did not say whether to scan `employees` first or `departments`, whether to use an index, or which join algorithm to use. The planner chooses — see [EXPLAIN and Query Plans](../../query-optimization/explain-and-query-plans/content.md).

### Standard SQL and dialects

SQL is an ISO/ANSI standard (SQL:2023 is the latest edition), but every product implements a **dialect**: a large shared core plus extensions. PostgreSQL follows the standard closely and adds features such as `RETURNING`, `ON CONFLICT`, `DISTINCT ON`, `::` casts, arrays and `jsonb`. This category marks PostgreSQL-specific syntax wherever it appears.

### DDL — Data Definition Language

Creates, changes and removes **database objects** (tables, indexes, views, schemas, sequences, functions). Details: [DDL Commands](../ddl-commands/content.md).

### DML — Data Manipulation Language

Adds, changes and removes **rows**. Details: [DML Commands](../dml-commands/content.md).

### DQL — Data Query Language

`SELECT` reads data. Many textbooks and the SQL standard count `SELECT` as part of DML (it "manipulates" data by retrieving it); others separate it as DQL. Either answer is accepted if you explain it. Details: [SELECT Basics](../select-query-basics/content.md).

### DCL — Data Control Language

`GRANT` and `REVOKE` give and remove privileges (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, …) on objects to roles. Details: [Roles and Privileges](../../security-and-permissions/roles-and-privileges/content.md).

### TCL — Transaction Control Language

Groups statements into all-or-nothing units. Details: [Transactions and ACID](../../transactions/database-transactions/content.md).

### Autocommit

`psql` and JDBC drivers run in **autocommit** mode by default: every statement outside an explicit `BEGIN … COMMIT` is its own transaction and is committed immediately when it succeeds.

### PostgreSQL DDL is transactional

In PostgreSQL almost all DDL can run inside a transaction and be **rolled back** — including `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE` and `TRUNCATE`. Oracle and MySQL commit implicitly before and after most DDL. This makes PostgreSQL schema migrations safer: a failed migration leaves no half-applied changes.

Exceptions include `CREATE DATABASE`, `DROP DATABASE`, `CREATE INDEX CONCURRENTLY` and `VACUUM`, which cannot run inside a transaction block.

## Examples

### One statement from each category

```sql
CREATE TABLE notices (id integer PRIMARY KEY, body text NOT NULL);    -- DDL
INSERT INTO notices VALUES (1, 'Office closed on Friday');             -- DML
SELECT * FROM notices;                                                  -- DQL
CREATE ROLE reception;
GRANT SELECT ON notices TO reception;                                   -- DCL
SELECT has_table_privilege('reception', 'notices', 'SELECT') AS can_read,
       has_table_privilege('reception', 'notices', 'DELETE') AS can_delete;
```

**Output:**

```text
 id |          body
----+-------------------------
  1 | Office closed on Friday
(1 row)

 can_read | can_delete
----------+------------
 t        | f
(1 row)
```

(`CREATE ROLE` is itself DDL for a cluster-wide object; `t`/`f` is how psql prints boolean true/false.)

### TCL: undo a mistake

```sql
BEGIN;
DELETE FROM notices;                 -- oops, no WHERE clause
SELECT count(*) AS rows_inside_transaction FROM notices;
ROLLBACK;
SELECT count(*) AS rows_after_rollback FROM notices;
```

**Output:**

```text
 rows_inside_transaction
-------------------------
                       0
(1 row)

 rows_after_rollback
---------------------
                   1
(1 row)
```

### Transactional DDL in PostgreSQL

```sql
BEGIN;
CREATE TABLE temp_migration (id integer);
ALTER TABLE employees ADD COLUMN middle_name text;
ROLLBACK;

SELECT to_regclass('temp_migration') AS table_exists,
       (SELECT count(*) FROM information_schema.columns
        WHERE table_name = 'employees' AND column_name = 'middle_name') AS column_exists;
```

**Output:**

```text
 table_exists | column_exists
--------------+---------------
 NULL         |             0
(1 row)
```

Both the new table and the new column vanished with the rollback. In MySQL, `CREATE TABLE` would have committed implicitly.

### Statements that refuse a transaction block

```sql
BEGIN;
CREATE INDEX CONCURRENTLY idx_orders_date ON orders (order_date);
ROLLBACK;
```

**Output:**

```text
ERROR:  CREATE INDEX CONCURRENTLY cannot run inside a transaction block
```

## Comparison

| Aspect | DDL | DML | DQL | DCL | TCL |
|--------|-----|-----|-----|-----|-----|
| Acts on | Objects (structure) | Rows | Rows (read) | Privileges | Transactions |
| Example | `ALTER TABLE` | `UPDATE` | `SELECT` | `GRANT` | `COMMIT` |
| Rollback in PostgreSQL | Yes (most) | Yes | Nothing to undo | Yes | — |
| Rollback in Oracle/MySQL | No (implicit commit) | Yes | — | No (implicit commit in Oracle) | — |

## Common Mistakes

- Calling `TRUNCATE` DML because it removes rows. It is DDL: it removes all rows by resetting storage, does not fire `ON DELETE` triggers and behaves differently from `DELETE`.
- Saying "DDL cannot be rolled back" as a universal rule. It is true for Oracle and MySQL, false for PostgreSQL.
- Forgetting autocommit: in psql, a `DELETE` without `BEGIN` is committed instantly — there is no undo.
- Assuming the database runs clauses in the written order; SQL is declarative and the planner chooses the physical order.

## Revision

- SQL is a declarative, standard language with vendor dialects; PostgreSQL adds `RETURNING`, `ON CONFLICT`, `DISTINCT ON`, `::`, arrays, `jsonb`.
- DDL: `CREATE`, `ALTER`, `DROP`, `TRUNCATE`. DML: `INSERT`, `UPDATE`, `DELETE`, `MERGE`. DQL: `SELECT` (sometimes counted as DML). DCL: `GRANT`, `REVOKE`. TCL: `BEGIN`, `COMMIT`, `ROLLBACK`, `SAVEPOINT`.
- Clients autocommit by default.
- PostgreSQL DDL is transactional (except `CREATE/DROP DATABASE`, `CREATE INDEX CONCURRENTLY`, `VACUUM`, …).

## Quick Revision

DDL = structure, DML = rows, DQL = SELECT, DCL = permissions, TCL = transactions. In PostgreSQL even `CREATE`/`ALTER`/`DROP TABLE` and `TRUNCATE` can be rolled back.
