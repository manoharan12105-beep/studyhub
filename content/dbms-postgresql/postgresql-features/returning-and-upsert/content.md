# RETURNING and Upsert (ON CONFLICT)

**Module:** PostgreSQL Features · **Interview priority:** Frequently asked

## What Is It?

- **`RETURNING`** makes `INSERT`, `UPDATE`, `DELETE` and (PostgreSQL 17+) `MERGE` return the rows they affected, like a `SELECT` on the changed rows — generated ids, defaults, computed values, before/after values.
- **Upsert** ("update or insert") is `INSERT … ON CONFLICT`: insert a row, and if it would violate a unique constraint, either skip it (`DO NOTHING`) or update the existing row (`DO UPDATE`).

```sql
-- Illustrative
INSERT INTO stock (product_id, qty) VALUES (2, 10)
ON CONFLICT (product_id) DO UPDATE SET qty = stock.qty + EXCLUDED.qty
RETURNING product_id, qty;
```

## Why It Matters

- Backends constantly need "insert and give me the id", "update and tell me the new value", "create if missing, otherwise update". `RETURNING` saves a round trip; `ON CONFLICT` makes upserts atomic and safe under concurrency.
- The naive alternative — `SELECT`, then `INSERT` or `UPDATE` in application code — has a race condition: two requests both see "missing" and both insert, and one fails (or creates a duplicate if there is no unique constraint).

## Core Concept

### RETURNING

- Works on `INSERT`, `UPDATE`, `DELETE`, and `MERGE` from PostgreSQL 17.
- Returns the values **after** the change for `INSERT`/`UPDATE` and the deleted values for `DELETE`; any expression is allowed (`RETURNING id, price * qty AS total`).
- PostgreSQL 18 adds **`old` and `new`** aliases: `UPDATE … RETURNING old.salary, new.salary` gives both versions without a CTE trick. For `INSERT`, `old` values are `NULL`; for `DELETE`, `new` values are `NULL`.
- The returned rows can feed another statement through a data-modifying CTE ([CTEs](../../ctes/common-table-expressions/content.md)).

### INSERT … ON CONFLICT

```text
INSERT INTO t (cols) VALUES (…)
ON CONFLICT conflict_target
    DO NOTHING
  | DO UPDATE SET col = EXCLUDED.col, … [WHERE condition]
```

- **Conflict target** says which unique constraint is handled: a column list `(email)` (matched to a unique index or constraint on exactly those columns), `ON CONSTRAINT name`, or a column list with `WHERE` to match a **partial** unique index.
- `DO NOTHING` may omit the target (then any unique conflict is skipped). `DO UPDATE` requires one.
- **`EXCLUDED`** is the row that was proposed for insertion; the table name (or alias) refers to the existing row.
- A `WHERE` on `DO UPDATE` makes the update conditional; when false, the row is left unchanged (and not returned).
- `RETURNING` returns inserted and updated rows; rows skipped by `DO NOTHING` (or by the `DO UPDATE … WHERE`) are **not** returned.

### Guarantees and limits

- `ON CONFLICT` is **atomic**: for every proposed row, PostgreSQL guarantees either an insert or an update/skip, even when other sessions insert the same key at the same moment (it waits for and re-checks the conflicting transaction). No "duplicate key" error from the race.
- One statement cannot update the same row twice: if the `VALUES` list contains the same key twice, `DO UPDATE` fails with *ON CONFLICT DO UPDATE command cannot affect row a second time*. Deduplicate the input first.
- It needs a unique index or constraint to detect conflicts — it does not compare arbitrary columns.
- The identity/sequence value is drawn before the conflict is detected, so upserts that end up updating still consume ids (gaps).
- Before-insert triggers fire for every proposed row, including ones that end up as updates.

### ON CONFLICT vs MERGE

| | `INSERT … ON CONFLICT` | `MERGE` (PostgreSQL 15+) |
|---|---|---|
| Source | Rows being inserted | Any table/query, joined with `ON` |
| Actions | Insert, or update/skip on unique conflict | Insert, update, delete, do nothing — per `WHEN` clause |
| Needs a unique index | Yes | No (any join condition) |
| Concurrent same-key inserts | Safe (no unique-violation error) | Can fail with a unique violation; not designed for that race |
| RETURNING | Yes | PostgreSQL 17+, with `merge_action()` |
| Use for | Idempotent writes from applications | Batch synchronisation of tables |

## Syntax

```sql
-- Illustrative
INSERT INTO t (k, v) VALUES (…)
ON CONFLICT (k) DO NOTHING;

INSERT INTO t (k, v) VALUES (…)
ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v [WHERE t.v IS DISTINCT FROM EXCLUDED.v]
RETURNING *;

INSERT … ON CONFLICT ON CONSTRAINT t_k_key DO …;
INSERT … ON CONFLICT (k) WHERE active DO …;           -- matches a partial unique index

UPDATE t SET v = v + 1 WHERE … RETURNING old.v, new.v; -- PostgreSQL 18+
```

## Examples

### RETURNING on each command

```sql
INSERT INTO products (product_id, name, category, price)
VALUES (7, 'Monitor', 'Electronics', 12000.00)
RETURNING product_id, name, price;
```

**Output:**

```text
 product_id |  name   |  price
------------+---------+----------
          7 | Monitor | 12000.00
(1 row)
```

```sql
UPDATE products
SET price = round(price * 1.05, 2)
WHERE category = 'Furniture'
RETURNING product_id, name, price AS new_price;
```

**Output:**

```text
 product_id | name  | new_price
------------+-------+-----------
          4 | Desk  |   8400.00
          5 | Chair |   4725.00
(2 rows)
```

```sql
DELETE FROM order_items
WHERE order_id = 106
RETURNING order_id, product_id, quantity * unit_price AS line_total;
```

**Output:**

```text
 order_id | product_id | line_total
----------+------------+------------
      106 |          3 |    1500.00
      106 |          2 |     450.00
(2 rows)
```

### Old and new values (PostgreSQL 18)

```sql
UPDATE employees
SET salary = salary + 5000
WHERE dept_id = 30
RETURNING name, old.salary AS old_salary, new.salary AS new_salary;
```

**Output:**

```text
  name  | old_salary | new_salary
--------+------------+------------
 Vikram |      70000 |      75000
 Pooja  |      52000 |      57000
(2 rows)
```

On PostgreSQL 17, get the old value from a data-modifying CTE joined to the table's pre-update snapshot, or compute it (`salary - 5000`).

### DO NOTHING: insert if missing

**Schema and data:**

```sql
CREATE TABLE subscribers (
    email      text PRIMARY KEY,
    name       text NOT NULL,
    visits     integer NOT NULL DEFAULT 1,
    updated_at date
);
INSERT INTO subscribers VALUES ('anil@mail.com', 'Anil', 3, '2026-03-01');
```

```sql
INSERT INTO subscribers (email, name)
VALUES ('anil@mail.com', 'Anil K'), ('meera@mail.com', 'Meera')
ON CONFLICT (email) DO NOTHING
RETURNING email, name;
```

**Output:**

```text
     email      | name
----------------+-------
 meera@mail.com | Meera
(1 row)
```

Only the inserted row is returned; Anil's existing row was left untouched.

### DO UPDATE with EXCLUDED

```sql
INSERT INTO subscribers (email, name, updated_at)
VALUES ('anil@mail.com', 'Anil Kumar', '2026-03-20'),
       ('ravi@mail.com', 'Ravi', '2026-03-20')
ON CONFLICT (email) DO UPDATE
SET name       = EXCLUDED.name,
    visits     = subscribers.visits + 1,
    updated_at = EXCLUDED.updated_at
RETURNING email, name, visits, updated_at;
```

**Output:**

```text
     email     |    name    | visits | updated_at
---------------+------------+--------+------------
 anil@mail.com | Anil Kumar |      4 | 2026-03-20
 ravi@mail.com | Ravi       |      1 | 2026-03-20
(2 rows)
```

`EXCLUDED.name` is the proposed value; `subscribers.visits` is the stored one. Anil was updated, Ravi inserted with the default `visits = 1`.

### Conditional update: only when something changed

```sql
INSERT INTO subscribers (email, name, updated_at)
VALUES ('anil@mail.com', 'Anil Kumar', '2026-03-25'),
       ('ravi@mail.com', 'Ravi Shankar', '2026-03-25')
ON CONFLICT (email) DO UPDATE
SET name = EXCLUDED.name, updated_at = EXCLUDED.updated_at
WHERE subscribers.name IS DISTINCT FROM EXCLUDED.name
RETURNING email, name, updated_at;
```

**Output:**

```text
     email     |     name     | updated_at
---------------+--------------+------------
 ravi@mail.com | Ravi Shankar | 2026-03-25
(1 row)
```

Anil's name is unchanged, so his row is neither updated nor returned — no needless write (or new row version).

### The same key twice in one statement

```sql
INSERT INTO subscribers (email, name)
VALUES ('zoya@mail.com', 'Zoya'), ('zoya@mail.com', 'Zoya R')
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;
```

**Output:**

```text
ERROR:  ON CONFLICT DO UPDATE command cannot affect row a second time
HINT:  Ensure that no rows proposed for insertion within the same command have duplicate constrained values.
```

Deduplicate the input (`SELECT DISTINCT ON (email) … ORDER BY email, <which one wins>`) before upserting.

### Upsert as an atomic counter

```sql
CREATE TABLE page_views (page text PRIMARY KEY, views bigint NOT NULL);

INSERT INTO page_views VALUES ('/home', 1)
ON CONFLICT (page) DO UPDATE SET views = page_views.views + 1;
INSERT INTO page_views VALUES ('/home', 1)
ON CONFLICT (page) DO UPDATE SET views = page_views.views + 1;
INSERT INTO page_views VALUES ('/home', 1)
ON CONFLICT (page) DO UPDATE SET views = page_views.views + 1
RETURNING page, views;
```

**Output:**

```text
 page  | views
-------+-------
 /home |     3
(1 row)
```

Each statement either creates the row or increments it, atomically, however many sessions run it concurrently.

### Two sessions racing for the same key

This needs two connections, so it is shown as a timeline (run on PostgreSQL 18 with `CREATE TABLE kv (k text PRIMARY KEY, v int)`):

```text
Session A                                   Session B
BEGIN;
INSERT INTO kv VALUES ('x', 1);
                                            INSERT INTO kv VALUES ('x', 2)
                                            ON CONFLICT (k) DO UPDATE
                                            SET v = kv.v + EXCLUDED.v
                                            RETURNING *;
                                            -- waits: A may still roll back
COMMIT;
                                            -- re-checks, finds A's row, updates it
                                             k | v
                                            ---+---
                                             x | 3
```

With `MERGE … WHEN NOT MATCHED THEN INSERT` in session B instead, B also waits, but after A commits it fails:

```text
ERROR:  duplicate key value violates unique constraint "kv_pkey"
DETAIL:  Key (k)=(x) already exists.
```

`MERGE` decided "not matched" from its snapshot and does not re-check; `ON CONFLICT` is built for exactly this case.

### Conflict target on a partial unique index

Only one **active** address per customer may exist:

```sql
CREATE TABLE addresses (
    customer_id integer NOT NULL,
    line        text    NOT NULL,
    active      boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX one_active_address ON addresses (customer_id) WHERE active;

INSERT INTO addresses VALUES (1, 'Old street 1', true);

INSERT INTO addresses VALUES (1, 'New road 7', true)
ON CONFLICT (customer_id) WHERE active DO UPDATE SET line = EXCLUDED.line
RETURNING customer_id, line, active;
```

**Output:**

```text
 customer_id |    line    | active
-------------+------------+--------
           1 | New road 7 | t
(1 row)
```

The `WHERE active` in the conflict target lets PostgreSQL pick the partial index; without it, there is no unique index on `(customer_id)` alone to infer:

```sql
INSERT INTO addresses VALUES (1, 'Another road 9', true)
ON CONFLICT (customer_id) DO NOTHING;
```

**Output:**

```text
ERROR:  there is no unique or exclusion constraint matching the ON CONFLICT specification
```

### Identity values are consumed by upserts

```sql
CREATE TABLE skus (
    id   integer GENERATED ALWAYS AS IDENTITY,
    code text UNIQUE
);
INSERT INTO skus (code) VALUES ('A') ON CONFLICT (code) DO NOTHING;
INSERT INTO skus (code) VALUES ('A') ON CONFLICT (code) DO NOTHING;
INSERT INTO skus (code) VALUES ('A') ON CONFLICT (code) DO NOTHING;
INSERT INTO skus (code) VALUES ('B') RETURNING id, code;
```

**Output:**

```text
 id | code
----+------
  4 | B
(1 row)
```

The two skipped inserts still drew ids 2 and 3.

### MERGE with RETURNING (PostgreSQL 17+)

Synchronise prices from a staging table:

```sql
CREATE TABLE price_updates (product_id integer, price numeric(10,2));
INSERT INTO price_updates VALUES (2, 520.00), (6, NULL), (9, 999.00);

MERGE INTO products p
USING price_updates u ON u.product_id = p.product_id
WHEN MATCHED AND u.price IS NULL THEN DELETE
WHEN MATCHED THEN UPDATE SET price = u.price
WHEN NOT MATCHED THEN INSERT (product_id, name, category, price)
                      VALUES (u.product_id, 'New item', 'Misc', u.price)
RETURNING merge_action() AS action, p.product_id, p.name, p.price;
```

**Output:**

```text
 action | product_id |   name   | price
--------+------------+----------+--------
 UPDATE |          2 | Mouse    | 520.00
 DELETE |          6 | Notebook |  50.00
 INSERT |          9 | New item | 999.00
(3 rows)
```

`merge_action()` reports what happened to each row. For deletes, `p.*` shows the deleted row.

## Comparison

### Ways to "insert or update"

| Approach | Atomic under concurrency | Notes |
|----------|-------------------------|-------|
| `SELECT`, then `INSERT` or `UPDATE` in code | No — race between check and write | Two round trips; needs retries or locks |
| `UPDATE`, and `INSERT` if 0 rows updated | No — two sessions can both insert | Classic pre-9.5 pattern |
| `INSERT … ON CONFLICT DO UPDATE` | Yes | Needs a unique index on the key |
| `MERGE` | Not for concurrent same-key inserts | Flexible multi-action synchronisation |

## Common Mistakes

- Reading back ids with `SELECT max(id)` instead of `RETURNING`.
- `ON CONFLICT (col)` when the unique index is partial — the target needs the matching `WHERE`.
- Expecting `DO NOTHING … RETURNING` to return the existing row (it returns nothing for skipped rows; use a CTE + `UNION` with a `SELECT` if you need it).
- Upserting a batch that contains the same key twice.
- Updating unconditionally in `DO UPDATE` when nothing changed, creating needless row versions (bloat, trigger firing).
- Using `MERGE` for high-concurrency idempotent inserts.

## Revision

- `RETURNING` on `INSERT`/`UPDATE`/`DELETE` (+ `MERGE` 17+); PostgreSQL 18: `old.`/`new.` values.
- `INSERT … ON CONFLICT (target) DO NOTHING | DO UPDATE SET … = EXCLUDED.… [WHERE …]`.
- Target: columns (+ `WHERE` for partial indexes) or `ON CONSTRAINT`; `DO UPDATE` needs one.
- Atomic and race-safe; cannot touch the same row twice in one statement; consumes sequence values.
- `MERGE`: multi-action sync, `merge_action()` in `RETURNING`, not race-safe for concurrent inserts.

## Quick Revision

RETURNING gives back the affected rows (old and new in PostgreSQL 18). INSERT … ON CONFLICT DO NOTHING or DO UPDATE with EXCLUDED is the atomic, concurrency-safe upsert, but it needs a unique index and cannot touch one row twice; MERGE handles batch syncs.
