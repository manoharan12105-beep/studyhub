# Triggers

**Module:** Functions, Procedures and Triggers · **Interview priority:** Frequently asked

## What Is It?

A **trigger** makes PostgreSQL call a function automatically when a specified event happens on a table or view: `INSERT`, `UPDATE`, `DELETE` or `TRUNCATE`. The trigger function can inspect and change the affected row, reject the operation, or perform other work such as writing an audit record.

```sql
-- Illustrative
CREATE TRIGGER employees_audit
AFTER UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION log_employee_change();
```

## Why It Matters

- Triggers enforce rules that constraints cannot express, keep audit trails, maintain derived data and timestamps — for **every** client, not only the main application.
- They are also a classic source of hidden behaviour and performance problems. Interviewers ask about BEFORE vs AFTER, row vs statement triggers, `NEW`/`OLD`, and when **not** to use triggers.

## Core Concept

### Timing × level

| | `FOR EACH ROW` | `FOR EACH STATEMENT` |
|---|---|---|
| `BEFORE` | Runs before each row is written; can **modify** `NEW` or **skip** the row (return `NULL`) | Runs once before the statement |
| `AFTER` | Runs after each row is written (at the end of the statement); sees the final row; return value ignored | Runs once after the statement; can read all changed rows via **transition tables** |
| `INSTEAD OF` | Only on **views**: replaces the operation, making complex views writable | — |

A statement-level trigger fires even if the statement affects zero rows.

### Inside a trigger function

A trigger function is declared `RETURNS trigger` (usually PL/pgSQL) and gets special variables:

| Variable | Meaning |
|----------|---------|
| `NEW` | The new row (`INSERT`/`UPDATE`); `NULL` for `DELETE` |
| `OLD` | The old row (`UPDATE`/`DELETE`); `NULL` for `INSERT` |
| `TG_OP` | `'INSERT'`, `'UPDATE'`, `'DELETE'` or `'TRUNCATE'` |
| `TG_TABLE_NAME`, `TG_WHEN`, `TG_LEVEL`, `TG_ARGV[]` | Table, timing, level, arguments given in `CREATE TRIGGER` |

Return value of a **BEFORE ROW** trigger:

- `NEW` (possibly modified) → the operation proceeds with that row;
- `NULL` → the operation is **silently skipped** for this row;
- for `DELETE`, return `OLD` to proceed.

`RAISE EXCEPTION` aborts the whole statement.

### Conditions and ordering

- `WHEN (condition)` restricts firing, e.g. `WHEN (OLD.salary IS DISTINCT FROM NEW.salary)` — cheaper than testing inside the function, because the function is not even called.
- `UPDATE OF col1, col2` fires only when those columns are targets of the `UPDATE`.
- Several triggers for the same event fire in **alphabetical order of their names**.
- Changes made by a trigger can fire other triggers (cascading); guard against infinite recursion.

### Typical uses

| Use | Trigger |
|-----|---------|
| `updated_at` timestamps | `BEFORE UPDATE … FOR EACH ROW` setting `NEW.updated_at = now()` |
| Audit trail | `AFTER INSERT OR UPDATE OR DELETE … FOR EACH ROW` writing `to_jsonb(OLD)`, `to_jsonb(NEW)` |
| Normalising input | `BEFORE INSERT OR UPDATE` lower-casing emails, trimming |
| Cross-row or cross-table rules | `BEFORE`/constraint triggers with explicit locking ("max 5 open loans") |
| Maintaining counters/summaries | `AFTER` row or statement triggers ([Denormalization](../../normalization/denormalization/content.md)) |
| Writable complex views | `INSTEAD OF` |

### Prefer declarative tools when they fit

| Need | Better than a trigger |
|------|-----------------------|
| Value from the same row | Generated column |
| Simple validation | `CHECK`, `NOT NULL`, domains |
| Uniqueness, references | `UNIQUE`, partial unique index, `FOREIGN KEY` |
| No overlaps | Exclusion constraint |

### Pitfalls

- **Hidden logic**: developers do not see the side effects in application code.
- **Performance**: row triggers run per row — a 1-million-row `UPDATE` runs the function a million times. Statement triggers with transition tables are often much cheaper.
- **Bulk operations**: `COPY` fires row triggers; `TRUNCATE` fires only `TRUNCATE` triggers, not `DELETE` triggers.
- **Concurrency**: a trigger that checks "count of rows" can be raced by another transaction unless it locks something (or runs under `SERIALIZABLE`).
- Disabling for maintenance: `ALTER TABLE … DISABLE TRIGGER name | USER | ALL`; replication tools use `session_replication_role = replica`.

### Other kinds (awareness)

- **Constraint triggers** (`CREATE CONSTRAINT TRIGGER … DEFERRABLE INITIALLY DEFERRED`) run at commit — useful for checks across rows changed by several statements.
- **Event triggers** fire on DDL (`ddl_command_end`, `sql_drop`), for auditing schema changes.

## Syntax

```sql
-- Illustrative
CREATE [OR REPLACE] TRIGGER name
{BEFORE | AFTER | INSTEAD OF} {INSERT | UPDATE [OF col, …] | DELETE | TRUNCATE} [OR …]
ON table
[REFERENCING {OLD | NEW} TABLE AS name]          -- AFTER … FOR EACH STATEMENT
[FOR EACH {ROW | STATEMENT}]
[WHEN (condition)]
EXECUTE FUNCTION function_name(args);

DROP TRIGGER name ON table;
ALTER TABLE table {ENABLE | DISABLE} TRIGGER name;
```

## Examples

### updated_at maintained automatically

```sql
ALTER TABLE products ADD COLUMN updated_at timestamptz NOT NULL DEFAULT '2026-01-01 00:00+00';

CREATE FUNCTION touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := TIMESTAMPTZ '2026-03-20 10:00+00';   -- now() in real code; fixed here for a stable output
    RETURN NEW;
END;
$$;

CREATE TRIGGER products_touch
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

SET TIME ZONE 'UTC';
UPDATE products SET price = 520 WHERE product_id = 2;
SELECT product_id, name, price, updated_at FROM products WHERE product_id IN (1, 2) ORDER BY product_id;
```

**Output:**

```text
 product_id |  name  |  price   |       updated_at
------------+--------+----------+------------------------
          1 | Laptop | 55000.00 | 2026-01-01 00:00:00+00
          2 | Mouse  |   520.00 | 2026-03-20 10:00:00+00
(2 rows)
```

The `BEFORE` trigger changed `NEW` before it was written; untouched rows keep their old timestamp.

### An audit log

```sql
CREATE TABLE salary_audit (
    emp_id     int,
    old_salary int,
    new_salary int,
    changed_by text
);

CREATE FUNCTION audit_salary() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO salary_audit VALUES (NEW.emp_id, OLD.salary, NEW.salary, current_user);
    RETURN NULL;          -- ignored for AFTER triggers
END;
$$;

CREATE TRIGGER employees_salary_audit
AFTER UPDATE OF salary ON employees
FOR EACH ROW
WHEN (OLD.salary IS DISTINCT FROM NEW.salary)
EXECUTE FUNCTION audit_salary();

UPDATE employees SET salary = salary + 5000 WHERE dept_id = 30;
UPDATE employees SET salary = salary WHERE dept_id = 40;          -- no real change: WHEN filters it out
UPDATE employees SET name = 'Nisha R' WHERE emp_id = 11;           -- salary not updated: does not fire
SELECT * FROM salary_audit ORDER BY emp_id;
```

**Output:**

```text
 emp_id | old_salary | new_salary | changed_by
--------+------------+------------+------------
      8 |      70000 |      75000 | postgres
      9 |      52000 |      57000 | postgres
(2 rows)
```

### Normalising and validating input

```sql
CREATE FUNCTION clean_customer() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.email := lower(trim(NEW.email));
    NEW.name  := initcap(trim(NEW.name));
    IF NEW.email NOT LIKE '%@%' THEN
        RAISE EXCEPTION 'invalid email: %', NEW.email;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER customers_clean
BEFORE INSERT OR UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION clean_customer();

INSERT INTO customers VALUES (7, '  gita rao ', 'Kochi', '  Gita@Mail.COM ')
RETURNING name, email;
```

**Output:**

```text
   name   |     email
----------+---------------
 Gita Rao | gita@mail.com
(1 row)
```

```sql
INSERT INTO customers VALUES (8, 'Hari', 'Pune', 'not-an-email');
```

**Output:**

```text
ERROR:  invalid email: not-an-email
CONTEXT:  PL/pgSQL function clean_customer() line 6 at RAISE
```

(Simple checks like this one could also be a `CHECK` constraint; triggers earn their place when they also transform data or look at other rows.)

### Returning NULL skips the row

```sql
CREATE FUNCTION ignore_test_orders() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.customer_id = 6 THEN
        RETURN NULL;          -- silently skip: Fatima is a test account
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER orders_ignore_test
BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION ignore_test_orders();

INSERT INTO orders VALUES (109, 6, '2026-03-30', 'PLACED'), (110, 1, '2026-03-30', 'PLACED');
SELECT order_id, customer_id FROM orders WHERE order_id >= 109 ORDER BY order_id;
```

**Output:**

```text
 order_id | customer_id
----------+-------------
      110 |           1
(1 row)
```

psql reported `INSERT 0 1`: one of the two rows was dropped without an error — powerful, and easy to misuse.

### Statement trigger with a transition table

Count deleted rows once per statement instead of once per row:

```sql
CREATE TABLE deletion_log (table_name text, rows_deleted bigint);

CREATE FUNCTION log_deletions() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO deletion_log SELECT TG_TABLE_NAME, count(*) FROM deleted_rows;
    RETURN NULL;
END;
$$;

CREATE TRIGGER order_items_log_delete
AFTER DELETE ON order_items
REFERENCING OLD TABLE AS deleted_rows
FOR EACH STATEMENT EXECUTE FUNCTION log_deletions();

DELETE FROM order_items WHERE order_id IN (101, 102);
DELETE FROM order_items WHERE order_id = 999;          -- no rows, still fires
SELECT * FROM deletion_log;
```

**Output:**

```text
 table_name  | rows_deleted
-------------+--------------
 order_items |            4
 order_items |            0
(2 rows)
```

### INSTEAD OF trigger: writable join view

```sql
CREATE VIEW employee_departments AS
SELECT e.emp_id, e.name, d.dept_name
FROM employees e JOIN departments d ON d.dept_id = e.dept_id;

CREATE FUNCTION move_employee() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE employees
    SET dept_id = (SELECT dept_id FROM departments WHERE dept_name = NEW.dept_name)
    WHERE emp_id = OLD.emp_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER employee_departments_update
INSTEAD OF UPDATE ON employee_departments
FOR EACH ROW EXECUTE FUNCTION move_employee();

UPDATE employee_departments SET dept_name = 'Finance' WHERE name = 'Pooja';
SELECT emp_id, name, dept_name FROM employee_departments WHERE name = 'Pooja';
```

**Output:**

```text
 emp_id | name  | dept_name
--------+-------+-----------
      9 | Pooja | Finance
(1 row)
```

The join view is not automatically updatable; the `INSTEAD OF` trigger defines what an update of `dept_name` means.

### Firing order is alphabetical

```sql
CREATE TABLE t_order_demo (v text);
CREATE FUNCTION append_tag() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    NEW.v := NEW.v || '-' || TG_ARGV[0];
    RETURN NEW;
END;
$$;
CREATE TRIGGER b_second BEFORE INSERT ON t_order_demo FOR EACH ROW EXECUTE FUNCTION append_tag('b');
CREATE TRIGGER a_first  BEFORE INSERT ON t_order_demo FOR EACH ROW EXECUTE FUNCTION append_tag('a');
INSERT INTO t_order_demo VALUES ('x') RETURNING v;
```

**Output:**

```text
   v
-------
 x-a-b
(1 row)
```

`a_first` ran before `b_second` although it was created later.

## Comparison

### BEFORE vs AFTER row triggers

| | BEFORE ROW | AFTER ROW |
|---|---|---|
| Can modify the row | Yes (change `NEW`) | No |
| Can skip the row | Yes (return `NULL`) | No |
| Sees final values (defaults, other BEFORE triggers' changes) | Partly | Yes |
| Typical use | Normalise, validate, set timestamps | Audit, maintain other tables, notifications |

## Common Mistakes

- Using triggers where a constraint, generated column or default would do.
- Forgetting `RETURN NEW` in a BEFORE trigger (returning `NULL` silently drops the change).
- Row triggers on bulk operations without considering per-row cost.
- Audit triggers that fire on no-op updates (use `WHEN (OLD IS DISTINCT FROM NEW)`).
- Trigger logic that assumes no concurrency (count-then-insert without locking).
- Recursive triggers (a trigger updating its own table) without a guard.
- Expecting `DELETE` triggers to fire on `TRUNCATE`.

## Revision

- Trigger = automatic call of a `RETURNS trigger` function on `INSERT`/`UPDATE`/`DELETE`/`TRUNCATE`.
- `BEFORE ROW` can modify `NEW` or skip (`NULL`); `AFTER` sees final rows; `INSTEAD OF` makes views writable; statement triggers fire once (transition tables give all rows).
- `NEW`, `OLD`, `TG_OP`, `TG_ARGV`; `WHEN (…)` and `UPDATE OF` limit firing; alphabetical order.
- Uses: audit, timestamps, normalisation, cross-row rules, derived data.
- Prefer constraints/generated columns when possible; beware hidden logic, per-row cost and concurrency.

## Quick Revision

Triggers run a function automatically on data changes: BEFORE ROW can change or skip the row, AFTER sees the final row, statement triggers use transition tables, and INSTEAD OF makes views writable. Use them for audits, timestamps and rules that constraints cannot express, and keep them small and visible.
