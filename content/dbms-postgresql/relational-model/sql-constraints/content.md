# Constraints and Referential Integrity

**Module:** Relational Model · **Interview priority:** Core

## What Is It?

A **constraint** is a rule declared on a table that the DBMS checks on every insert and update (and, for foreign keys, on deletes of the parent). A statement that would break a rule fails with an error and changes nothing. PostgreSQL supports:

| Constraint | Rule |
|------------|------|
| `NOT NULL` | The column must have a value |
| `UNIQUE` | No two rows share the value (NULLs excepted by default) |
| `PRIMARY KEY` | `UNIQUE` + `NOT NULL`; one per table |
| `FOREIGN KEY` | The value must exist in the referenced key (or be NULL) |
| `CHECK` | A boolean condition must not be false |
| `DEFAULT` | Not a rule but a column property: the value used when none is supplied |

(PostgreSQL also has `EXCLUDE` constraints — for example "no two bookings of one room overlap" — beyond the scope of this topic.)

**Referential integrity** means every foreign key value points to a row that really exists: no orphans.

## Why It Matters

- Constraints are the last line of defence: the application, a migration script, a data fix and an analyst's manual `UPDATE` all go through them.
- Bugs that constraints catch immediately (negative stock, orders for deleted customers) otherwise surface weeks later as corrupt reports.
- Interviewers ask about `ON DELETE CASCADE` vs `SET NULL` vs `RESTRICT`, `CHECK` and `NULL`, and `DEFAULT` behaviour.

## Core Concept

### Column constraints and table constraints

A constraint on one column can be written next to the column; a constraint on several columns must be written as a table constraint. Naming constraints makes error messages and later `ALTER TABLE … DROP CONSTRAINT` easier.

```sql
-- Illustrative: column vs table constraints
CREATE TABLE shipments (
    shipment_id integer PRIMARY KEY,                         -- column constraint
    order_id    integer NOT NULL REFERENCES orders,          -- column constraints
    shipped_on  date,
    delivered_on date,
    CONSTRAINT delivered_after_shipped                       -- named table constraint
        CHECK (delivered_on >= shipped_on)
);
```

### NOT NULL

The column must always hold a value. Use it for every column the business requires. Most columns in a well-designed schema are `NOT NULL`.

### UNIQUE

No duplicate values across rows; enforced by a unique index. Multiple `NULL`s are allowed by default because `NULL` is not equal to `NULL`. `UNIQUE NULLS NOT DISTINCT` (PostgreSQL 15+) treats `NULL`s as equal. A multi-column `UNIQUE (a, b)` constrains the combination.

### PRIMARY KEY

Unique and not null; at most one per table. See [Keys](../database-keys/content.md).

### CHECK

A boolean expression evaluated for each new or updated row. The row is rejected only if the expression is **false**. If it evaluates to **NULL (unknown)**, the row is **accepted**.

```text
CHECK (salary > 0)
salary = 500   → true    → accepted
salary = -5    → false   → rejected
salary = NULL  → unknown → accepted   ← add NOT NULL if NULL must be rejected
```

PostgreSQL `CHECK` constraints should only look at the current row; they cannot query other tables (use foreign keys or triggers for that).

### DEFAULT

The value used when an `INSERT` omits the column, or writes the keyword `DEFAULT`. It can be a constant or an expression (`now()`, `gen_random_uuid()`).

> [!WARNING]
> Explicitly inserting `NULL` stores `NULL`; the default is **not** applied. `DEFAULT` is not a constraint — combine it with `NOT NULL` if the column must never be empty.

### FOREIGN KEY and referential integrity

```text
parent (referenced)              child (referencing)
departments                      employees
dept_id PK  <──────────────────  dept_id FK
```

The foreign key is checked:

- on child `INSERT`/`UPDATE` — the new value must exist in the parent (or be NULL);
- on parent `DELETE`/key `UPDATE` — what happens to children is decided by the **referential action**.

| Action | On parent `DELETE` | On parent key `UPDATE` |
|--------|--------------------|------------------------|
| `NO ACTION` (default) | Error if children exist — checked at the end of the statement (or at commit if deferred) | Error if children exist |
| `RESTRICT` | Error if children exist — checked immediately, cannot be deferred | Error if children exist |
| `CASCADE` | Delete the children too | Update the children's foreign key to the new value |
| `SET NULL` | Set the children's foreign key to NULL | Same |
| `SET DEFAULT` | Set it to the column default (which must itself exist in the parent) | Same |

`ON DELETE` and `ON UPDATE` are declared independently. Choosing:

- **CASCADE** for parts that cannot exist without the parent: `order_items` of an order.
- **SET NULL** for optional links: a ticket's assignee leaves the company; the ticket stays, unassigned.
- **RESTRICT / NO ACTION** when deletion should be blocked: a department with employees must not disappear.
- `ON UPDATE CASCADE` is useful only with natural keys that can change; surrogate keys never change.

### Deferrable constraints

`UNIQUE`, `PRIMARY KEY`, `FOREIGN KEY` (and `EXCLUDE`) constraints can be declared `DEFERRABLE`, and `SET CONSTRAINTS … DEFERRED` postpones their checks to `COMMIT`. Useful for circular references or swapping unique values inside one transaction. `CHECK` and `NOT NULL` are always checked immediately.

### Adding constraints to existing tables

```sql
-- Illustrative: add constraints to a table that already has data
ALTER TABLE customers ALTER COLUMN name SET NOT NULL;
ALTER TABLE customers ADD CONSTRAINT customers_email_key2 UNIQUE (email);
ALTER TABLE orders ADD CONSTRAINT orders_status_check2
    CHECK (status <> 'UNKNOWN') NOT VALID;          -- skip checking existing rows now
ALTER TABLE orders VALIDATE CONSTRAINT orders_status_check2;  -- check them later, with a lighter lock
```

Adding a constraint fails if existing rows violate it. `NOT VALID` (for `CHECK` and `FOREIGN KEY`) enforces the rule for new rows immediately and lets you validate old rows later — a standard technique for large production tables.

## Syntax

```sql
-- Illustrative: constraint syntax summary
CREATE TABLE child (
    id         integer PRIMARY KEY,
    code       text    NOT NULL UNIQUE,
    qty        integer NOT NULL DEFAULT 1 CHECK (qty > 0),
    parent_id  integer REFERENCES parent (id)
                   ON DELETE CASCADE
                   ON UPDATE NO ACTION,
    CONSTRAINT child_code_qty_uq UNIQUE (code, qty)
);
ALTER TABLE child DROP CONSTRAINT child_code_qty_uq;
```

## Examples

### NOT NULL and CHECK violations

```sql
INSERT INTO products VALUES (7, NULL, 'Stationery', 20.00);
```

**Output:**

```text
ERROR:  null value in column "name" of relation "products" violates not-null constraint
DETAIL:  Failing row contains (7, null, Stationery, 20.00).
```

```sql
INSERT INTO products VALUES (7, 'Pen', 'Stationery', -20.00);
```

**Output:**

```text
ERROR:  new row for relation "products" violates check constraint "products_price_check"
DETAIL:  Failing row contains (7, Pen, Stationery, -20.00).
```

### CHECK accepts NULL

`employees.commission` has no check. Add `CHECK (commission >= 0)` and insert a `NULL` commission:

```sql
ALTER TABLE employees ADD CONSTRAINT commission_non_negative CHECK (commission >= 0);
INSERT INTO employees (emp_id, name, dept_id, manager_id, salary, commission, hire_date)
VALUES (13, 'Tara', 30, 8, 48000, NULL, '2026-04-01');
SELECT emp_id, name, commission FROM employees WHERE emp_id = 13;
```

**Output:**

```text
 emp_id | name | commission
--------+------+------------
     13 | Tara |       NULL
(1 row)
```

`NULL >= 0` is unknown, not false, so the row is accepted.

### DEFAULT vs explicit NULL

```sql
CREATE TABLE tasks (
    task_id    integer PRIMARY KEY,
    title      text NOT NULL,
    status     text DEFAULT 'OPEN',
    created_on date NOT NULL DEFAULT DATE '2026-04-01'
);
INSERT INTO tasks (task_id, title) VALUES (1, 'Write report');          -- defaults used
INSERT INTO tasks VALUES (2, 'Review', DEFAULT, DEFAULT);                -- DEFAULT keyword
INSERT INTO tasks (task_id, title, status) VALUES (3, 'Deploy', NULL);   -- explicit NULL
SELECT * FROM tasks ORDER BY task_id;
```

**Output:**

```text
 task_id |    title     | status | created_on
---------+--------------+--------+------------
       1 | Write report | OPEN   | 2026-04-01
       2 | Review       | OPEN   | 2026-04-01
       3 | Deploy       | NULL   | 2026-04-01
(3 rows)
```

Task 3 has `NULL` status because `NULL` was supplied. Declaring `status text NOT NULL DEFAULT 'OPEN'` would have rejected it.

### Foreign key violation on insert

```sql
INSERT INTO orders VALUES (109, 77, '2026-04-02', 'PLACED');
```

**Output:**

```text
ERROR:  insert or update on table "orders" violates foreign key constraint "orders_customer_id_fkey"
DETAIL:  Key (customer_id)=(77) is not present in table "customers".
```

### NO ACTION (the default): parent delete is blocked

`employees.dept_id` references `departments` without an action, so `NO ACTION` applies:

```sql
DELETE FROM departments WHERE dept_id = 30;
```

**Output:**

```text
ERROR:  update or delete on table "departments" violates foreign key constraint "employees_dept_id_fkey" on table "employees"
DETAIL:  Key (dept_id)=(30) is still referenced from table "employees".
```

Deleting Research (50), which has no employees, succeeds:

```sql
DELETE FROM departments WHERE dept_id = 50;
SELECT count(*) AS departments_left FROM departments;
```

**Output:**

```text
 departments_left
------------------
                4
(1 row)
```

### ON DELETE CASCADE

`order_items.order_id` is declared `ON DELETE CASCADE`. Deleting cancelled order 104 deletes its item rows too:

```sql
SELECT count(*) AS items_of_104 FROM order_items WHERE order_id = 104;
DELETE FROM orders WHERE order_id = 104;
SELECT count(*) AS items_of_104 FROM order_items WHERE order_id = 104;
```

**Output:**

```text
 items_of_104
--------------
            1
(1 row)

 items_of_104
--------------
            0
(1 row)
```

### ON DELETE SET NULL

```sql
CREATE TABLE tickets (
    ticket_id   integer PRIMARY KEY,
    title       text NOT NULL,
    assignee_id integer REFERENCES employees (emp_id) ON DELETE SET NULL
);
INSERT INTO tickets VALUES (1, 'Fix login bug', 9), (2, 'Update payroll', 8);

DELETE FROM employees WHERE emp_id = 9;   -- Pooja leaves; she manages nobody
SELECT * FROM tickets ORDER BY ticket_id;
```

**Output:**

```text
 ticket_id |     title      | assignee_id
-----------+----------------+-------------
         1 | Fix login bug  |        NULL
         2 | Update payroll |           8
(2 rows)
```

### ON DELETE RESTRICT

```sql
CREATE TABLE payslips (
    payslip_id integer PRIMARY KEY,
    emp_id     integer NOT NULL REFERENCES employees (emp_id) ON DELETE RESTRICT,
    month      date    NOT NULL
);
INSERT INTO payslips VALUES (1, 12, '2026-03-01');
DELETE FROM employees WHERE emp_id = 12;
```

**Output:**

```text
ERROR:  update or delete on table "employees" violates RESTRICT setting of foreign key constraint "payslips_emp_id_fkey" on table "payslips"
DETAIL:  Key (emp_id)=(12) is referenced from table "payslips".
```

Payroll history must survive, so deleting an employee with payslips is refused (mark them inactive instead).

### ON UPDATE CASCADE with a natural key

```sql
CREATE TABLE currencies (code text PRIMARY KEY, name text NOT NULL);
CREATE TABLE price_list (
    item          text PRIMARY KEY,
    amount        numeric(10,2) NOT NULL,
    currency_code text NOT NULL REFERENCES currencies (code) ON UPDATE CASCADE
);
INSERT INTO currencies VALUES ('RS', 'Indian rupee');
INSERT INTO price_list VALUES ('Mouse', 500, 'RS'), ('Desk', 8000, 'RS');

UPDATE currencies SET code = 'INR' WHERE code = 'RS';
SELECT * FROM price_list ORDER BY item;
```

**Output:**

```text
 item  | amount  | currency_code
-------+---------+---------------
 Desk  | 8000.00 | INR
 Mouse |  500.00 | INR
(2 rows)
```

### Listing a table's constraints

```sql
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'order_items'::regclass
ORDER BY conname;
```

**Output:**

```text
             conname             |                              definition
---------------------------------+----------------------------------------------------------------------
 order_items_order_id_fkey       | FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
 order_items_order_id_not_null   | NOT NULL order_id
 order_items_pkey                | PRIMARY KEY (order_id, product_id)
 order_items_product_id_fkey     | FOREIGN KEY (product_id) REFERENCES products(product_id)
 order_items_product_id_not_null | NOT NULL product_id
 order_items_quantity_check      | CHECK ((quantity > 0))
 order_items_quantity_not_null   | NOT NULL quantity
 order_items_unit_price_not_null | NOT NULL unit_price
(8 rows)
```

PostgreSQL generated the names (`order_items_pkey`, `order_items_order_id_fkey`, …) because none were given. The `NOT NULL` rows appear because PostgreSQL 18 stores `NOT NULL` as catalog constraints; PostgreSQL 17 and earlier record it only as a column property, so those rows are missing there.

## Comparison

### ON DELETE actions

| | CASCADE | SET NULL | RESTRICT | NO ACTION (default) |
|---|---|---|---|---|
| Parent row deleted? | Yes | Yes | No, error | No, error |
| Children | Deleted | Kept, FK set to NULL | Untouched | Untouched |
| Check timing | — | — | Immediately | End of statement; can be deferred to commit if `DEFERRABLE` |
| Typical use | Order → order items | Ticket → assignee | Employee → payslips | General default |

### DELETE with CASCADE vs TRUNCATE … CASCADE

`ON DELETE CASCADE` is a property of the foreign key: deleting parent rows deletes their children. `TRUNCATE parent CASCADE` is a command option that empties *every table* with a foreign key to `parent` — all their rows, not only matching ones. See [DDL Commands](../../sql-fundamentals/ddl-commands/content.md).

## Common Mistakes

- Expecting `CHECK (x > 0)` to reject `NULL`. Add `NOT NULL`.
- Expecting `DEFAULT` to replace an explicit `NULL`.
- Using `ON DELETE CASCADE` everywhere: one accidental delete of a customer silently wipes orders, payments and history. Cascade only owned parts.
- Forgetting an index on the foreign key column: parent deletes then scan the whole child table.
- Enforcing integrity only in Java code: other writers (scripts, other services, manual fixes) bypass it, and concurrent requests race past application checks.
- Adding a constraint to a huge table at once during peak traffic. Use `NOT VALID` + `VALIDATE CONSTRAINT`.

## Revision

- Constraints: `NOT NULL`, `UNIQUE`, `PRIMARY KEY`, `FOREIGN KEY`, `CHECK`; `DEFAULT` supplies values.
- `CHECK` rejects only false; NULL (unknown) passes.
- `DEFAULT` is used only when the column is omitted or `DEFAULT` is written; explicit `NULL` stays `NULL`.
- Referential integrity: no orphan foreign keys. Actions: `NO ACTION` (default), `RESTRICT`, `CASCADE`, `SET NULL`, `SET DEFAULT`, separately for `ON DELETE` and `ON UPDATE`.
- `RESTRICT` checks immediately; `NO ACTION` at statement end (deferrable).
- Index foreign key columns; add constraints to big tables with `NOT VALID` then `VALIDATE`.

## Quick Revision

Constraints make the database reject bad data for every writer. FK actions: CASCADE (delete children), SET NULL (orphan → NULL), RESTRICT/NO ACTION (block). CHECK lets NULL through; DEFAULT ignores explicit NULL.
