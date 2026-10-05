# Generated Columns, Schemas and Extensions — Interview Questions

## Beginner

### Q1. What is a generated column?

<details>
<summary>Answer</summary>

A column whose value is computed from other columns of the same row by an expression, declared `GENERATED ALWAYS AS (expr)`. It cannot be written directly. `STORED` columns are computed on write and saved; `VIRTUAL` columns (PostgreSQL 18+, and the default there) are computed when read. Example: `total numeric GENERATED ALWAYS AS (price * qty) STORED`.

</details>

### Q2. What is a schema in PostgreSQL?

<details>
<summary>Answer</summary>

A namespace inside a database that contains tables, views, functions, types and sequences. The same table name can exist in different schemas (`public.orders`, `archive.orders`). Schemas organise objects, separate modules or tenants and carry privileges. Unlike databases, schemas of the same database can be queried together in one statement.

</details>

### Q3. What is an extension? Name a few.

<details>
<summary>Answer</summary>

A packaged add-on installed per database with `CREATE EXTENSION`, adding types, functions, operators or index methods. Common ones: `pg_stat_statements` (query statistics), `pg_trgm` (fuzzy search and indexes for `LIKE '%…%'`), `pgcrypto` (hashing/encryption), `citext` (case-insensitive text), `btree_gist` (exclusion constraints with scalar columns), `postgis` (geospatial).

</details>

## Intermediate

### Q4. What restrictions apply to generated column expressions?

<details>
<summary>Answer</summary>

They may reference only columns of the same row (not other generated columns, other rows or tables), may not use subqueries, and must use only immutable functions — so `now()`, `random()` and even `timestamptz::date` (which depends on the session time zone) are rejected. In PostgreSQL 18, virtual generated columns additionally cannot be indexed and cannot use user-defined types or functions.

</details>

### Q5. What is search_path and why does it matter?

<details>
<summary>Answer</summary>

The ordered list of schemas PostgreSQL searches for unqualified object names (default `"$user", public`). It determines which table `SELECT * FROM orders` reads and in which schema `CREATE TABLE orders` creates the table. Misconfigured paths cause "relation does not exist" errors or hit the wrong table; a writable schema early in another role's path is a security risk, so `SECURITY DEFINER` functions should set an explicit `search_path`.

</details>

### Q6. What changed about the public schema in PostgreSQL 15?

<details>
<summary>Answer</summary>

The `CREATE` privilege on `public` is no longer granted to all users (`PUBLIC`). Only the database owner (and roles granted the privilege) can create objects there. This closes a long-standing security weakness where any user could create objects that other users' unqualified names might resolve to.

</details>

## Advanced

### Q7. Generated column vs expression index — which would you choose for case-insensitive email lookup?

<details>
<summary>Answer</summary>

Both work. A unique expression index `CREATE UNIQUE INDEX ON users (lower(email))` enforces uniqueness and supports `WHERE lower(email) = …` without storing a second column, but queries must repeat the exact expression. A stored generated column `email_lower … UNIQUE` makes the normalised value visible and simple to query (`WHERE email_lower = …`) at the cost of storage. The `citext` type is a third option.

</details>

### Q8. Schema-per-tenant vs a tenant_id column — trade-offs?

<details>
<summary>Answer</summary>

Schema per tenant: strong isolation, easy per-tenant backup/drop, per-tenant customisation; but thousands of schemas multiply catalog size, migrations must run per schema, and connection pools must switch `search_path`. A `tenant_id` column in shared tables: one schema to migrate, efficient at scale, works with row-level security; but every query and index must include `tenant_id`, and a missing filter leaks data. Most SaaS systems with many small tenants use `tenant_id` + row-level security.

</details>

### Q9. Why does pg_stat_statements need a server restart?

<details>
<summary>Answer</summary>

It must hook into the executor of every backend and allocate shared memory at server start, so it has to be listed in `shared_preload_libraries` in `postgresql.conf`, which is read only at startup. After the restart, `CREATE EXTENSION pg_stat_statements` in a database creates the view used to read the statistics.

</details>
