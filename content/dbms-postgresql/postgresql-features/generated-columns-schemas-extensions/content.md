# Generated Columns, Schemas and Extensions

**Module:** PostgreSQL Features · **Interview priority:** Awareness

## What Is It?

Three PostgreSQL features that shape how a database is organised:

- **Generated columns** — columns whose value is always computed from other columns of the same row: `total numeric GENERATED ALWAYS AS (price * qty) STORED`.
- **Schemas** — namespaces inside a database that group tables, views, functions and types: `sales.orders`, `hr.employees`.
- **Extensions** — packaged add-ons installed with `CREATE EXTENSION`, adding types, functions, operators and index methods (`pg_trgm`, `pgcrypto`, `citext`, PostGIS…).

## Why It Matters

- Generated columns keep derived values consistent without triggers or application code.
- Schemas organise large databases, separate modules or tenants, and control permissions; `search_path` mistakes cause "relation does not exist" errors and even security issues.
- Much of PostgreSQL's power in practice comes from extensions; backend developers are expected to know the common ones.

## Core Concept

### Generated columns

| | `STORED` | `VIRTUAL` (PostgreSQL 18+) |
|---|---|---|
| When computed | On `INSERT`/`UPDATE`, stored on disk | On read |
| Disk space | Yes | No |
| Can be indexed | Yes | No (PostgreSQL 18) |
| Default when neither keyword is given | — (PostgreSQL 12–17 require `STORED`) | **Yes, in PostgreSQL 18** |

Rules:

- Cannot be written directly — `INSERT`/`UPDATE` may only use `DEFAULT` for them.
- The expression may use only columns of the same row and **immutable** functions: no subqueries, no other tables, no `now()`, no other generated columns. Casting `timestamptz` to `date` is not immutable (it depends on the session time zone), so it is rejected.
- Typical uses: totals (`price * qty`), normalised search keys (`lower(email)`), extracted JSON fields (`(attrs ->> 'brand')`), full-text vectors (`to_tsvector('english', title || ' ' || body)`).

Generated column vs alternatives:

| Need | Use |
|------|-----|
| Value derived from the same row | Generated column |
| Index on an expression only (no column needed) | Expression index `CREATE INDEX … (lower(email))` |
| Value from other rows/tables, or with side effects | Trigger or application code |
| Derived value only for some queries | A view, or compute in `SELECT` |

### Schemas

- A **database** contains schemas; a schema contains objects. The full name of a table is `database.schema.table`; queries can only reach tables in the **current** database.
- Every new database has the `public` schema. `pg_catalog` holds system tables; `information_schema` holds standard metadata views.
- **`search_path`** lists the schemas searched for unqualified names, by default `"$user", public`: a table named like the current user's schema first, then `public`. The first schema in the path that exists is where `CREATE TABLE t` puts a new table.
- Since **PostgreSQL 15**, ordinary users can no longer create objects in `public` by default (the `CREATE` privilege was revoked from `PUBLIC`). Owners grant it explicitly or create dedicated schemas.
- Uses: separate application modules (`billing`, `auth`), per-tenant schemas, keeping extension objects in their own schema, granting privileges per schema.
- Security: a writable schema early in another user's `search_path` lets an attacker shadow functions or tables. Functions marked `SECURITY DEFINER` should set a fixed `search_path`.

### Extensions

- `CREATE EXTENSION name [SCHEMA s];` installs into the **current database** (each database separately). The extension's files must be present on the server — `pg_available_extensions` lists them, `pg_extension` lists installed ones.
- Some extensions need a server setting first, e.g. `pg_stat_statements` requires `shared_preload_libraries` and a restart.
- Managed cloud services allow only a vetted list.

Commonly used extensions:

| Extension | Adds |
|-----------|------|
| `pg_stat_statements` | Statistics per normalised query: calls, total/mean time, rows — the first stop for slow-query analysis |
| `pg_trgm` | Trigram similarity and GIN/GiST indexes that speed up `LIKE '%text%'` and fuzzy search |
| `pgcrypto` | Hashing (`crypt` with bcrypt), encryption, random bytes |
| `citext` | Case-insensitive text type (e.g. emails) |
| `uuid-ossp` | Extra UUID generators (v1, v3, v5); for random UUIDs the built-in `gen_random_uuid()` is enough |
| `hstore` | Key/value pairs (older alternative to `jsonb`) |
| `ltree` | Hierarchical label paths (`Top.Science.Physics`) with tree operators |
| `btree_gist` | Lets GiST indexes include scalar columns — needed for exclusion constraints such as "no overlapping bookings for the same room" |
| `postgis` | Geographic types, spatial indexes and functions |
| `pg_partman` | Automated partition creation/retention (third-party) |

## Syntax

```sql
-- Illustrative
col type GENERATED ALWAYS AS (expression) [STORED | VIRTUAL]

CREATE SCHEMA billing [AUTHORIZATION role];
SET search_path TO billing, public;
ALTER ROLE app_user SET search_path = billing, public;

CREATE EXTENSION IF NOT EXISTS pg_trgm [SCHEMA extensions];
ALTER EXTENSION pg_trgm UPDATE;
DROP EXTENSION pg_trgm;
```

## Examples

### Stored and virtual generated columns

```sql
CREATE TABLE cart_lines (
    product   text    NOT NULL,
    price     numeric(10,2) NOT NULL,
    qty       integer NOT NULL,
    total     numeric(12,2) GENERATED ALWAYS AS (price * qty) STORED,
    total_gst numeric(12,2) GENERATED ALWAYS AS (round(price * qty * 1.18, 2))   -- VIRTUAL by default in 18
);
INSERT INTO cart_lines (product, price, qty) VALUES ('Mouse', 500, 2), ('Desk', 8000, 1);
UPDATE cart_lines SET qty = 3 WHERE product = 'Mouse';
SELECT * FROM cart_lines ORDER BY product;
```

**Output:**

```text
 product |  price  | qty |  total  | total_gst
---------+---------+-----+---------+-----------
 Desk    | 8000.00 |   1 | 8000.00 |   9440.00
 Mouse   |  500.00 |   3 | 1500.00 |   1770.00
(2 rows)
```

```sql
SELECT attname, attgenerated
FROM pg_attribute
WHERE attrelid = 'cart_lines'::regclass AND attgenerated <> '';
```

**Output:**

```text
  attname  | attgenerated
-----------+--------------
 total     | s
 total_gst | v
(2 rows)
```

`s` = stored, `v` = virtual. The values followed the update automatically.

### Generated columns cannot be written

```sql
INSERT INTO cart_lines (product, price, qty, total) VALUES ('Chair', 4500, 1, 999);
```

**Output:**

```text
ERROR:  cannot insert a non-DEFAULT value into column "total"
DETAIL:  Column "total" is a generated column.
```

### Only stored generated columns can be indexed

```sql
CREATE INDEX ON cart_lines (total);
CREATE INDEX ON cart_lines (total_gst);
```

**Output:**

```text
ERROR:  indexes on virtual generated columns are not supported
```

The first index is created silently; the second fails.

### Expressions must be immutable

```sql
CREATE TABLE visits (
    visited_at timestamptz NOT NULL,
    visit_day  date GENERATED ALWAYS AS (visited_at::date) STORED
);
```

**Output:**

```text
ERROR:  generation expression is not immutable
```

The calendar day of an instant depends on the time zone. Fix it by naming the zone, which makes the expression immutable:

```sql
SET TIME ZONE 'UTC';
CREATE TABLE visits (
    visited_at timestamptz NOT NULL,
    visit_day  date GENERATED ALWAYS AS ((visited_at AT TIME ZONE 'Asia/Kolkata')::date) STORED
);
INSERT INTO visits VALUES ('2026-03-09 20:00+00');
SELECT visited_at, visit_day FROM visits;
```

**Output:**

```text
       visited_at       | visit_day
------------------------+------------
 2026-03-09 20:00:00+00 | 2026-03-10
(1 row)
```

### A normalised search key

```sql
CREATE TABLE app_accounts (
    email       text NOT NULL,
    email_lower text GENERATED ALWAYS AS (lower(email)) STORED UNIQUE
);
INSERT INTO app_accounts (email) VALUES ('Anil@Mail.com');
INSERT INTO app_accounts (email) VALUES ('anil@mail.com');
```

**Output:**

```text
ERROR:  duplicate key value violates unique constraint "app_accounts_email_lower_key"
DETAIL:  Key (email_lower)=(anil@mail.com) already exists.
```

A unique constraint on the generated column enforces case-insensitive uniqueness. (A unique expression index on `lower(email)` achieves the same without the extra column.)

### Schemas and search_path

```sql
CREATE SCHEMA billing;
CREATE TABLE billing.invoices (invoice_no int PRIMARY KEY, amount numeric(12,2));
INSERT INTO billing.invoices VALUES (1, 1500.00);

SELECT * FROM invoices;
```

**Output:**

```text
ERROR:  relation "invoices" does not exist
LINE 1: SELECT * FROM invoices;
                      ^
```

`invoices` is not found because `billing` is not in the `search_path`. Qualify the name, or change the path:

```sql
SET search_path TO billing, public;
SELECT current_schemas(false) AS search_path, invoice_no, amount FROM invoices;
```

**Output:**

```text
   search_path    | invoice_no | amount
------------------+------------+---------
 {billing,public} |          1 | 1500.00
(1 row)
```

With `billing` first in the path, a new unqualified table would be created there:

```sql
SET search_path TO billing, public;
CREATE TABLE payments (id int);
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name IN ('payments', 'invoices', 'orders')
ORDER BY table_schema, table_name;
```

**Output:**

```text
 table_schema | table_name
--------------+------------
 billing      | invoices
 billing      | payments
 public       | orders
(3 rows)
```

### Same name in two schemas

```sql
CREATE SCHEMA archive;
CREATE TABLE archive.orders (LIKE public.orders);
INSERT INTO archive.orders SELECT * FROM public.orders WHERE status = 'CANCELLED';

SELECT 'public' AS schema, count(*) FROM public.orders
UNION ALL
SELECT 'archive', count(*) FROM archive.orders;
```

**Output:**

```text
 schema  | count
---------+-------
 public  |     8
 archive |     1
(2 rows)
```

### Extensions: pg_trgm and citext

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
SELECT similarity('Keyboard', 'Keybord') AS sim,
       name
FROM products
WHERE name % 'Keybord';
```

**Output:**

```text
    sim     |   name
------------+----------
 0.54545456 | Keyboard
(1 row)
```

`%` is pg_trgm's "similar enough" operator (threshold 0.3 by default) — fuzzy matching that tolerates typos.

```sql
CREATE EXTENSION IF NOT EXISTS citext;
SELECT 'Anil@Mail.com'::citext = 'anil@mail.com'::citext AS citext_equal,
       'Anil@Mail.com'::text   = 'anil@mail.com'::text   AS text_equal;
```

**Output:**

```text
 citext_equal | text_equal
--------------+------------
 t            | f
(1 row)
```

```sql
SELECT extname, extversion IS NOT NULL AS installed
FROM pg_extension
WHERE extname IN ('plpgsql', 'pg_trgm', 'citext')
ORDER BY extname;
```

**Output:**

```text
 extname | installed
---------+-----------
 citext  | t
 pg_trgm | t
 plpgsql | t
(3 rows)
```

Installed extensions are listed in `pg_extension`; `plpgsql` is installed in every database by default.

## Comparison

### Database vs schema

| | Database | Schema |
|---|---|---|
| Contains | Schemas | Tables, views, functions, types, sequences |
| Cross-references in one query | No (needs `dblink`/`postgres_fdw`) | Yes (`a.t JOIN b.u`) |
| Connection targets | Yes — a connection is to one database | No |
| Typical use | Separate applications/environments | Modules, tenants, permission groups |

### Generated column vs trigger vs view

| | Generated column | Trigger | View |
|---|---|---|---|
| Inputs | Same row only | Anything | Anything |
| Stored | `STORED` yes, `VIRTUAL` no | Yes | No |
| Can be bypassed | No | Can be disabled | — |
| Complexity | One expression | Procedural code | A query |

## Common Mistakes

- Trying to `INSERT` a value into a generated column, or using `now()` / a subquery / a mutable cast in its expression.
- Expecting a PostgreSQL 18 generated column without `STORED` to be indexable (it is virtual).
- Creating tables without a schema while `search_path` points somewhere unexpected — they land in the wrong schema.
- On PostgreSQL 15+, expecting any user to create tables in `public`.
- Forgetting that extensions are per database, or that `pg_stat_statements` needs `shared_preload_libraries`.
- Installing `uuid-ossp` just for random UUIDs (`gen_random_uuid()` is built in).

## Revision

- Generated columns: `GENERATED ALWAYS AS (expr) STORED | VIRTUAL`; VIRTUAL is the PostgreSQL 18 default and is not indexable; same-row, immutable expressions only; never written directly.
- Schemas: namespaces in a database; `search_path` resolves unqualified names and decides where new objects go; PostgreSQL 15 removed default `CREATE` on `public`.
- Extensions: `CREATE EXTENSION` per database; key ones: `pg_stat_statements`, `pg_trgm`, `pgcrypto`, `citext`, `btree_gist`, `postgis`.

## Quick Revision

Generated columns compute a value from the same row with an immutable expression — STORED is indexable, VIRTUAL (the PostgreSQL 18 default) is not. Schemas are namespaces resolved through search_path, and extensions add features per database with CREATE EXTENSION.
