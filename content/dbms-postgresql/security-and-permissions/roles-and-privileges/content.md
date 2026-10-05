# Roles, Privileges and Row-Level Security

**Module:** Security and Permissions · **Interview priority:** Frequently asked

## What Is It?

PostgreSQL controls access with **roles** and **privileges**:

- A **role** is a database identity. A role with the `LOGIN` attribute is what other systems call a *user*; a role without it is a *group* that other roles can be members of.
- **Privileges** (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `USAGE`, `EXECUTE`, …) are granted on objects — databases, schemas, tables, columns, sequences, functions — with `GRANT` and removed with `REVOKE`.
- **Row-level security (RLS)** adds policies that decide **which rows** a role may see or change.

```sql
-- Illustrative
CREATE ROLE reporting NOLOGIN;
CREATE ROLE asha LOGIN PASSWORD '…' IN ROLE reporting;
GRANT SELECT ON orders TO reporting;          -- asha can now read orders
```

## Why It Matters

- Applications should connect with **least privilege**: a compromised or buggy service should not be able to drop tables or read data it does not need.
- Interviewers ask: user vs role, `GRANT` on tables vs schemas, default privileges, `PUBLIC`, row-level security, how to protect against SQL injection, and why applications should not use a superuser.

## Core Concept

### Roles

| Attribute | Meaning |
|-----------|---------|
| `LOGIN` | Can connect (a "user") |
| `SUPERUSER` | Bypasses all permission checks — reserve for administration |
| `CREATEDB`, `CREATEROLE` | Can create databases / roles |
| `INHERIT` (default) | Automatically uses the privileges of roles it is a member of |
| `BYPASSRLS` | Ignores row-level security policies |
| `PASSWORD`, `VALID UNTIL` | Password authentication (stored as `scram-sha-256` hashes by default) |

- Roles are **cluster-wide** (shared by all databases); privileges are per object.
- Membership: `GRANT reporting TO asha;` — `asha` inherits `reporting`'s privileges (and can `SET ROLE reporting`).
- Every object has an **owner** (its creator by default) who has all privileges on it and can grant them; only the owner (or a superuser) can `ALTER`/`DROP` it.

### Privileges by object

| Object | Main privileges |
|--------|-----------------|
| Database | `CONNECT`, `CREATE` (schemas), `TEMPORARY` |
| Schema | `USAGE` (look up objects inside), `CREATE` (create objects inside) |
| Table / view | `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER` |
| Column | `SELECT`, `INSERT`, `UPDATE`, `REFERENCES` on specific columns |
| Sequence | `USAGE` (`nextval`), `SELECT`, `UPDATE` |
| Function / procedure | `EXECUTE` (granted to `PUBLIC` by default) |

Reading a table requires `CONNECT` on the database, `USAGE` on the schema **and** `SELECT` on the table.

### PUBLIC and defaults

- `PUBLIC` is a pseudo-role meaning "every role". By default it has `CONNECT` and `TEMPORARY` on databases, `EXECUTE` on functions, and `USAGE` on the `public` schema.
- Since PostgreSQL 15, `PUBLIC` no longer has `CREATE` on the `public` schema.
- `GRANT … ON ALL TABLES IN SCHEMA s` affects **existing** tables only. For tables created later, use `ALTER DEFAULT PRIVILEGES [FOR ROLE creator] IN SCHEMA s GRANT … TO role`.

### Predefined roles

Built-in roles to grant common capabilities without superuser: `pg_read_all_data`, `pg_write_all_data` (14+), `pg_monitor` (monitoring views), `pg_signal_backend` (cancel/terminate other sessions), `pg_read_server_files`, `pg_maintain` (17+: `VACUUM`, `ANALYZE`, `REINDEX`, `REFRESH MATERIALIZED VIEW` on all tables), and more.

### A typical application setup

| Role | Privileges | Used by |
|------|------------|---------|
| `app_owner` (NOLOGIN) | Owns schema and tables | Migrations (via a deploy user that is a member) |
| `app_rw` (NOLOGIN) | `SELECT/INSERT/UPDATE/DELETE` on tables, `USAGE` on sequences | Granted to the service's login role |
| `app_ro` (NOLOGIN) | `SELECT` only | Reporting, read replicas |
| `service_login` (LOGIN) | Member of `app_rw` | The Java service's connection pool |

The runtime role does not own tables, so the service cannot `DROP` or `ALTER` them even if compromised.

### Row-level security

1. `ALTER TABLE t ENABLE ROW LEVEL SECURITY;`
2. `CREATE POLICY name ON t [FOR SELECT | INSERT | UPDATE | DELETE | ALL] [TO role] USING (condition) [WITH CHECK (condition)];`
   - `USING` filters rows that can be read (or updated/deleted);
   - `WITH CHECK` validates rows being inserted or updated.
3. With RLS enabled and no matching policy, non-owners see **no rows** (default deny).
4. Table owners and roles with `BYPASSRLS` (and superusers) are not subject to policies unless `FORCE ROW LEVEL SECURITY` is set.

Typical use: multi-tenant tables where each request sets `SET app.tenant_id = …` and the policy filters `tenant_id = current_setting('app.tenant_id')::int`.

### SQL injection

Never build SQL by concatenating user input. With JDBC, use `PreparedStatement` placeholders — the value is sent separately from the SQL text and can never change the statement's structure:

```java
// Illustrative fragment
// Vulnerable: input "' OR '1'='1" returns every row
String bad = "SELECT * FROM customers WHERE email = '" + email + "'";

// Safe: the input is bound as a value
PreparedStatement ps = conn.prepareStatement("SELECT * FROM customers WHERE email = ?");
ps.setString(1, email);
```

Identifiers (table/column names) cannot be bound; whitelist them in code. In PL/pgSQL dynamic SQL use `format('… %I … %L', ident, literal)` or `EXECUTE … USING`.

### Connection-level security (awareness)

`pg_hba.conf` decides which hosts/users may connect to which databases with which method (`scram-sha-256`, certificates, …); enable SSL/TLS for network connections; never use `trust` outside local development.

## Syntax

```sql
-- Illustrative
CREATE ROLE name [LOGIN] [PASSWORD '…'] [IN ROLE group, …] [NOSUPERUSER] …;
ALTER ROLE name …;  DROP ROLE name;
GRANT {SELECT | INSERT | … | ALL} ON {TABLE t | ALL TABLES IN SCHEMA s} TO role [WITH GRANT OPTION];
GRANT SELECT (col1, col2) ON t TO role;
GRANT USAGE ON SCHEMA s TO role;
GRANT group_role TO member_role;
REVOKE … FROM role;
ALTER DEFAULT PRIVILEGES IN SCHEMA s GRANT SELECT ON TABLES TO role;
ALTER TABLE t ENABLE ROW LEVEL SECURITY;
CREATE POLICY p ON t USING (…) WITH CHECK (…);
```

## Examples

Roles are cluster-wide; the examples create roles with distinctive names. `SET ROLE` switches the current session to another role to test what it can do.

### A read-only group role

```sql
CREATE ROLE demo_readonly NOLOGIN;
CREATE ROLE demo_analyst LOGIN IN ROLE demo_readonly;
GRANT USAGE ON SCHEMA public TO demo_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO demo_readonly;

SET ROLE demo_analyst;
SELECT count(*) AS employees_visible FROM employees;
INSERT INTO accounts VALUES (9, 'Intruder', 1);
RESET ROLE;
```

**Output:**

```text
 employees_visible
-------------------
                12
(1 row)

ERROR:  permission denied for table accounts
```

### New tables need default privileges

```sql
CREATE ROLE demo_reader LOGIN;
GRANT USAGE ON SCHEMA public TO demo_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO demo_reader;

CREATE TABLE shipments (id int);                    -- created after the GRANT
SET ROLE demo_reader;
SELECT count(*) FROM shipments;
RESET ROLE;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO demo_reader;
CREATE TABLE returns (id int);                      -- created after ALTER DEFAULT PRIVILEGES
SET ROLE demo_reader;
SELECT count(*) AS returns_visible FROM returns;
RESET ROLE;
```

**Output:**

```text
ERROR:  permission denied for table shipments
 returns_visible
-----------------
               0
(1 row)
```

`ALTER DEFAULT PRIVILEGES` applies to objects created later **by the role that ran it** (here the current user); use `FOR ROLE app_owner` for tables created by a migration role.

### Column-level privileges

```sql
CREATE ROLE demo_hr_viewer LOGIN;
GRANT USAGE ON SCHEMA public TO demo_hr_viewer;
GRANT SELECT (emp_id, name, dept_id) ON employees TO demo_hr_viewer;

SET ROLE demo_hr_viewer;
SELECT name, dept_id FROM employees WHERE emp_id = 2;
SELECT salary FROM employees WHERE emp_id = 2;
SELECT * FROM employees WHERE emp_id = 2;
RESET ROLE;
```

**Output:**

```text
 name | dept_id
------+---------
 Ravi |      10
(1 row)

ERROR:  permission denied for table employees
ERROR:  permission denied for table employees
```

`SELECT *` fails because it includes columns the role may not read. (A view exposing the allowed columns is often friendlier — [Views](../../views-and-materialized-views/sql-views/content.md).)

### Checking privileges

```sql
CREATE ROLE demo_auditor LOGIN;
GRANT USAGE ON SCHEMA public TO demo_auditor;
GRANT SELECT ON orders TO demo_auditor;

SELECT has_table_privilege('demo_auditor', 'orders', 'SELECT')  AS can_read_orders,
       has_table_privilege('demo_auditor', 'orders', 'UPDATE')  AS can_update_orders,
       has_table_privilege('demo_auditor', 'accounts', 'SELECT') AS can_read_accounts;
```

**Output:**

```text
 can_read_orders | can_update_orders | can_read_accounts
-----------------+-------------------+-------------------
 t               | f                 | f
(1 row)
```

```sql
CREATE ROLE demo_auditor2 LOGIN;
GRANT SELECT, INSERT ON orders TO demo_auditor2;
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'orders' AND grantee = 'demo_auditor2'
ORDER BY privilege_type;
```

**Output:**

```text
    grantee    | privilege_type
---------------+----------------
 demo_auditor2 | INSERT
 demo_auditor2 | SELECT
(2 rows)
```

### Row-level security for tenants

Each session states which department it works for; the policy shows only that department's employees:

```sql
CREATE ROLE demo_dept_app LOGIN;
GRANT USAGE ON SCHEMA public TO demo_dept_app;
GRANT SELECT, UPDATE ON employees TO demo_dept_app;

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY dept_isolation ON employees
    USING (dept_id = current_setting('app.dept_id')::int)
    WITH CHECK (dept_id = current_setting('app.dept_id')::int);

SET ROLE demo_dept_app;
SET app.dept_id = '30';
SELECT emp_id, name, dept_id FROM employees ORDER BY emp_id;
UPDATE employees SET salary = salary + 1 WHERE emp_id = 1;     -- Asha is in dept 10: not visible
UPDATE employees SET dept_id = 10 WHERE emp_id = 9;            -- moving a row out of the tenant
RESET ROLE;
```

**Output:**

```text
 emp_id |  name  | dept_id
--------+--------+---------
      8 | Vikram |      30
      9 | Pooja  |      30
(2 rows)

ERROR:  new row violates row-level security policy for table "employees"
```

The update of Asha affected zero rows (she is invisible to this role), and moving Pooja out of department 30 violated the `WITH CHECK` condition. The table owner is not subject to the policy:

```sql
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY none_visible ON employees USING (false);
SELECT count(*) AS owner_sees FROM employees;
```

**Output:**

```text
 owner_sees
------------
         12
(1 row)
```

### Revoking

```sql
CREATE ROLE demo_temp_access LOGIN;
GRANT USAGE ON SCHEMA public TO demo_temp_access;
GRANT SELECT ON customers TO demo_temp_access;
REVOKE SELECT ON customers FROM demo_temp_access;

SET ROLE demo_temp_access;
SELECT count(*) FROM customers;
RESET ROLE;
```

**Output:**

```text
ERROR:  permission denied for table customers
```

## Comparison

### GRANT on objects vs role membership vs RLS

| Mechanism | Controls | Granularity |
|-----------|----------|-------------|
| `GRANT … ON TABLE` | Which operations a role may perform on a table | Table |
| Column `GRANT` | Which columns may be read/written | Column |
| Role membership | Bundles privileges into groups | Role |
| Views | Which columns/rows are exposed | Query-defined |
| Row-level security | Which rows each role/session sees and writes | Row |

## Common Mistakes

- Connecting applications as a superuser or as the table owner.
- `GRANT SELECT ON ALL TABLES` and expecting future tables to be covered (use default privileges).
- Forgetting `USAGE` on the schema or sequence (`permission denied for sequence …` on insert with `serial`).
- Enabling RLS and testing as the owner/superuser — policies do not apply to them, so tests pass misleadingly.
- Building SQL strings from user input instead of using bound parameters.
- Granting `ALL PRIVILEGES` or `WITH GRANT OPTION` broadly.
- Leaving `pg_hba.conf` with `trust` or allowing connections from anywhere.

## Revision

- Role = user (with `LOGIN`) or group; cluster-wide; membership with inheritance; owners have all rights on their objects.
- Access path: `CONNECT` (database) → `USAGE` (schema) → table/column privilege; `EXECUTE` for functions; `USAGE` for sequences.
- `GRANT … ON ALL TABLES` = existing tables; `ALTER DEFAULT PRIVILEGES` = future ones.
- PostgreSQL 15: no `CREATE` on `public` for `PUBLIC`; predefined roles (`pg_read_all_data`, `pg_monitor`, `pg_maintain`…).
- RLS: `ENABLE ROW LEVEL SECURITY` + `CREATE POLICY … USING / WITH CHECK`; owners and `BYPASSRLS` exempt unless `FORCE`.
- Least privilege for apps; prepared statements against SQL injection.

## Quick Revision

Roles are users or groups that receive privileges through GRANT on databases, schemas, tables, columns, sequences and functions; future tables need ALTER DEFAULT PRIVILEGES. Row-level security policies filter rows per session, applications should never run as superuser, and bound parameters stop SQL injection.
