# DDL: CREATE, ALTER, DROP and TRUNCATE

**Module:** SQL Fundamentals · **Interview priority:** Core

## What Is It?

**Data Definition Language** statements create and change the *structure* of a database:

- `CREATE` — make a new object (table, index, view, schema, sequence, function…).
- `ALTER` — change an existing object (add a column, change a type, add a constraint, rename).
- `DROP` — remove an object completely, structure and data.
- `TRUNCATE` — remove **all rows** of a table quickly, keeping its structure.

## Why It Matters

- Every schema migration in a Spring Boot project (Flyway/Liquibase scripts) is DDL.
- "DELETE vs TRUNCATE vs DROP" is one of the most asked SQL questions; PostgreSQL's answers differ from other databases in ways interviewers like to probe (rollback, triggers, locks).
- Careless DDL on large production tables can lock them for minutes.

## Core Concept

### CREATE TABLE

```sql
-- Illustrative: CREATE TABLE forms
CREATE TABLE IF NOT EXISTS suppliers (            -- no error if it already exists
    supplier_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        text NOT NULL,
    city        text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE suppliers_backup (LIKE suppliers INCLUDING ALL);   -- copy structure only

CREATE TABLE chennai_staff AS                      -- structure + data from a query
SELECT emp_id, name, salary FROM employees WHERE dept_id IN (10, 30);
```

`CREATE TABLE … AS` copies column names, types and data but **not** constraints (not even `NOT NULL`), defaults or indexes. `LIKE … INCLUDING ALL` copies the definition (defaults, constraints, indexes) but no data.

### ALTER TABLE

Common forms:

| Change | Syntax |
|--------|--------|
| Add a column | `ALTER TABLE t ADD COLUMN c type [DEFAULT …] [NOT NULL];` |
| Drop a column | `ALTER TABLE t DROP COLUMN c;` |
| Rename a column | `ALTER TABLE t RENAME COLUMN a TO b;` |
| Rename a table | `ALTER TABLE t RENAME TO t2;` |
| Change type | `ALTER TABLE t ALTER COLUMN c TYPE newtype [USING expression];` |
| Set / drop default | `ALTER TABLE t ALTER COLUMN c SET DEFAULT v;` / `DROP DEFAULT` |
| Set / drop NOT NULL | `ALTER TABLE t ALTER COLUMN c SET NOT NULL;` / `DROP NOT NULL` |
| Add / drop constraint | `ALTER TABLE t ADD CONSTRAINT name …;` / `DROP CONSTRAINT name;` |

PostgreSQL cost notes (they matter on big tables):

- `ADD COLUMN` with no default, or with a **constant** default, only changes the catalog — instant, no table rewrite (since PostgreSQL 11).
- `ADD COLUMN` with a **volatile** default (e.g. `clock_timestamp()`), and most `ALTER COLUMN … TYPE` changes, **rewrite the whole table** under an `ACCESS EXCLUSIVE` lock (no reads or writes meanwhile).
- `SET NOT NULL` scans the table to check existing rows.
- `DROP COLUMN` is instant: the column is hidden and its space reclaimed by later rewrites.

### DROP

`DROP TABLE t;` removes the table, its data, indexes, constraints and triggers. Options:

- `IF EXISTS` — no error if missing (a notice instead).
- `RESTRICT` (default) — refuse if other objects depend on it (views, foreign keys from other tables).
- `CASCADE` — also drop the dependent objects. For a foreign key from another table, `CASCADE` drops the **foreign key constraint**, not the other table or its rows.

Other objects use the same pattern: `DROP VIEW`, `DROP INDEX`, `DROP SCHEMA … CASCADE`, `DROP DATABASE`.

### TRUNCATE

`TRUNCATE t;` empties a table by giving it new, empty storage instead of deleting row by row.

- Much faster than `DELETE` on large tables and frees disk space immediately (no dead rows to vacuum).
- No `WHERE` clause — all or nothing.
- `RESTART IDENTITY` resets identity/serial sequences owned by the table's columns; the default `CONTINUE IDENTITY` leaves them.
- Fails if another table has a foreign key to it, unless that table is truncated in the same command or `CASCADE` is used (which truncates **every** referencing table entirely).
- Does not fire `ON DELETE` triggers (it fires `ON TRUNCATE` triggers, if any).
- Takes an `ACCESS EXCLUSIVE` lock — it waits for, and blocks, all other access to the table.
- In PostgreSQL it is transactional: `ROLLBACK` restores the rows.
- It is not MVCC-safe: a concurrent transaction using an older snapshot (e.g. REPEATABLE READ) that reads the table after the truncate commits sees it as empty.

## Syntax

```sql
-- Illustrative: DDL syntax summary
CREATE TABLE [IF NOT EXISTS] name (column type [constraints], ... [, table_constraints]);
CREATE TABLE name AS query;
ALTER TABLE name action [, action ...];
DROP TABLE [IF EXISTS] name [, ...] [CASCADE | RESTRICT];
TRUNCATE [TABLE] name [, ...] [RESTART IDENTITY | CONTINUE IDENTITY] [CASCADE | RESTRICT];
```

## Examples

### CREATE TABLE AS loses constraints

```sql
CREATE TABLE chennai_staff AS
SELECT emp_id, name, salary FROM employees WHERE dept_id IN (10, 30);

SELECT count(*) AS rows_copied FROM chennai_staff;
SELECT count(*) AS constraints_copied
FROM pg_constraint WHERE conrelid = 'chennai_staff'::regclass;
```

**Output:**

```text
 rows_copied
-------------
           6
(1 row)

 constraints_copied
--------------------
                  0
(1 row)
```

The data came across; the primary key, `NOT NULL` and `CHECK` constraints did not.

### ALTER TABLE: add, rename, change type

```sql
ALTER TABLE customers ADD COLUMN phone text;
ALTER TABLE customers ADD COLUMN is_active boolean NOT NULL DEFAULT true;  -- constant default: instant
ALTER TABLE customers RENAME COLUMN city TO home_city;

SELECT customer_id, name, home_city, phone, is_active
FROM customers ORDER BY customer_id LIMIT 3;
```

**Output:**

```text
 customer_id |  name  | home_city | phone | is_active
-------------+--------+-----------+-------+-----------
           1 | Anil   | Chennai   | NULL  | t
           2 | Bhavna | Mumbai    | NULL  | t
           3 | Chirag | Delhi     | NULL  | t
(3 rows)
```

Existing rows got `true` from the default; `phone` is `NULL` because it has no default.

### Changing a type needs USING when there is no automatic cast

```sql
CREATE TABLE legacy_stock (sku text PRIMARY KEY, qty text);
INSERT INTO legacy_stock VALUES ('A1', '10'), ('B2', '7');

ALTER TABLE legacy_stock ALTER COLUMN qty TYPE integer;
```

**Output:**

```text
ERROR:  column "qty" cannot be cast automatically to type integer
HINT:  You might need to specify "USING qty::integer".
```

```sql
ALTER TABLE legacy_stock ALTER COLUMN qty TYPE integer USING qty::integer;
SELECT sku, qty + 1 AS qty_plus_one FROM legacy_stock ORDER BY sku;
```

**Output:**

```text
 sku | qty_plus_one
-----+--------------
 A1  |           11
 B2  |            8
(2 rows)
```

### DROP is blocked by dependencies

```sql
DROP TABLE departments;
```

**Output:**

```text
ERROR:  cannot drop table departments because other objects depend on it
DETAIL:  constraint employees_dept_id_fkey on table employees depends on table departments
HINT:  Use DROP ... CASCADE to drop the dependent objects too.
```

`DROP TABLE departments CASCADE` would drop the table **and the foreign key constraint** on `employees` — the employees and their `dept_id` values would remain, no longer checked.

### TRUNCATE and foreign keys

```sql
TRUNCATE orders;
```

**Output:**

```text
ERROR:  cannot truncate a table referenced in a foreign key constraint
DETAIL:  Table "order_items" references "orders".
HINT:  Truncate table "order_items" at the same time, or use TRUNCATE ... CASCADE.
```

```sql
BEGIN;
TRUNCATE orders CASCADE;
SELECT (SELECT count(*) FROM orders)      AS orders_left,
       (SELECT count(*) FROM order_items) AS items_left;
ROLLBACK;
SELECT count(*) AS orders_after_rollback FROM orders;
```

**Output:**

```text
NOTICE:  truncate cascades to table "order_items"
 orders_left | items_left
-------------+------------
           0 |          0
(1 row)

 orders_after_rollback
-----------------------
                     8
(1 row)
```

`CASCADE` emptied `order_items` as well; the rollback restored both — `TRUNCATE` is transactional in PostgreSQL.

### TRUNCATE … RESTART IDENTITY

```sql
CREATE TABLE audit_log (
    id      integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    message text NOT NULL
);
INSERT INTO audit_log (message) VALUES ('a'), ('b'), ('c');
TRUNCATE audit_log;
INSERT INTO audit_log (message) VALUES ('after plain truncate');
TRUNCATE audit_log RESTART IDENTITY;
INSERT INTO audit_log (message) VALUES ('after restart identity');
SELECT * FROM audit_log;
```

**Output:**

```text
 id |        message
----+------------------------
  1 | after restart identity
(1 row)
```

After the plain `TRUNCATE` the next id was 4 (the sequence continued); after `RESTART IDENTITY` it started again at 1.

## Comparison

### DELETE vs TRUNCATE vs DROP

| Aspect | `DELETE` | `TRUNCATE` | `DROP TABLE` |
|--------|----------|------------|--------------|
| Category | DML | DDL | DDL |
| Removes | Selected rows (`WHERE`) or all rows | All rows | The table itself: rows, structure, indexes, constraints, triggers |
| `WHERE` clause | Yes | No | No |
| Table still exists | Yes | Yes | No |
| Speed on large tables | Slow: visits and marks every row, writes WAL per row | Fast: swaps in new empty storage | Fast |
| Space | Dead rows remain until `VACUUM` reuses them | Freed immediately | Freed immediately |
| Row triggers | `ON DELETE` triggers fire | No `DELETE` triggers (`ON TRUNCATE` triggers fire) | No |
| Foreign keys | Checked per row; `ON DELETE` actions apply | Refused if referenced, unless `CASCADE` truncates all referencing tables | Refused if referenced, unless `CASCADE` drops the constraints |
| Identity/sequence | Unchanged | Unchanged, or reset with `RESTART IDENTITY` | Owned sequences dropped |
| Rollback in PostgreSQL | Yes | Yes | Yes |
| Lock | Row locks; others can read and write other rows | `ACCESS EXCLUSIVE` (blocks everything) | `ACCESS EXCLUSIVE` |
| `RETURNING` | Yes | No | No |

> [!WARNING]
> "TRUNCATE cannot be rolled back" is true in Oracle and (implicit commit) MySQL, **false in PostgreSQL**. State the database when you answer.

## Common Mistakes

- Using `CREATE TABLE … AS` as a backup and assuming constraints and indexes came with it.
- Running a type change or a volatile-default `ADD COLUMN` on a large busy table without planning for the rewrite and its exclusive lock.
- Thinking `DROP TABLE parent CASCADE` deletes child rows. It drops the foreign key constraint and leaves the child data unchecked.
- Using `TRUNCATE … CASCADE` to empty one table and wiping every referencing table by accident.
- Expecting `ON DELETE` triggers (audit logs) to record a `TRUNCATE`.

## Revision

- `CREATE` makes objects; `CREATE TABLE AS` copies data without constraints; `LIKE … INCLUDING ALL` copies definition without data.
- `ALTER`: add/drop/rename columns, change types (`USING`), defaults, `NOT NULL`, constraints. Constant-default `ADD COLUMN` is instant; type changes usually rewrite.
- `DROP` removes the object; `CASCADE` also drops dependents (for FKs: the constraint, not the child table).
- `TRUNCATE` removes all rows fast, frees space, `RESTART IDENTITY` option, blocked by FKs unless `CASCADE`, no `DELETE` triggers, `ACCESS EXCLUSIVE` lock, rollback-able in PostgreSQL.
- DELETE (DML, WHERE, triggers, dead rows, row locks) vs TRUNCATE (DDL, all rows, fast) vs DROP (table gone).

## Quick Revision

DELETE removes chosen rows (DML, slow, triggers fire); TRUNCATE empties the table (DDL, fast, frees space); DROP removes the table. In PostgreSQL all three can be rolled back inside a transaction.
