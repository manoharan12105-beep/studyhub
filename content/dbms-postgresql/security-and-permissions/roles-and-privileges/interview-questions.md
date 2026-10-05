# Roles, Privileges and Row-Level Security — Interview Questions

## Beginner

### Q1. What is the difference between a user and a role in PostgreSQL?

<details>
<summary>Answer</summary>

There is only one concept: the role. A "user" is a role with the `LOGIN` attribute; a "group" is a role (usually without `LOGIN`) that other roles are members of. `CREATE USER` is just `CREATE ROLE … LOGIN`. Roles exist at the cluster level and receive privileges on objects in any database.

</details>

### Q2. What does GRANT do? Give examples.

<details>
<summary>Answer</summary>

It gives privileges on an object to a role: `GRANT SELECT, INSERT ON orders TO app_rw;`, `GRANT USAGE ON SCHEMA sales TO app_rw;`, `GRANT EXECUTE ON FUNCTION f(int) TO app_rw;`, or role membership `GRANT app_rw TO service_login;`. `REVOKE` removes them. Reading a table needs `CONNECT` on the database, `USAGE` on the schema and `SELECT` on the table.

</details>

### Q3. Why should an application not connect as a superuser?

<details>
<summary>Answer</summary>

A superuser bypasses all permission checks and row-level security, can read every database, drop anything, change server settings and even run programs on the server (e.g. `COPY … PROGRAM`). A bug or SQL injection in the application would then compromise the whole cluster. Applications should use a login role with only the privileges they need, and should not own the tables they use.

</details>

## Intermediate

### Q4. You granted SELECT on all tables to a reporting role, but it cannot read tables created last week. Why?

<details>
<summary>Answer</summary>

`GRANT … ON ALL TABLES IN SCHEMA` applies only to tables existing at that moment. For future tables, define default privileges: `ALTER DEFAULT PRIVILEGES FOR ROLE app_owner IN SCHEMA public GRANT SELECT ON TABLES TO reporting;` — they apply to objects later created by the specified role (the migration/owner role).

</details>

### Q5. What is row-level security?

<details>
<summary>Answer</summary>

A feature that restricts which rows a role can see or modify, defined by policies: `ALTER TABLE t ENABLE ROW LEVEL SECURITY; CREATE POLICY p ON t USING (tenant_id = current_setting('app.tenant_id')::int) WITH CHECK (…);`. `USING` filters visible/updatable rows; `WITH CHECK` validates new rows. With RLS on and no applicable policy, rows are hidden (default deny). Owners, superusers and `BYPASSRLS` roles are exempt unless `FORCE ROW LEVEL SECURITY` is set. Common use: multi-tenant isolation.

</details>

### Q6. How do you prevent SQL injection in a Java application?

<details>
<summary>Answer</summary>

Use `PreparedStatement` with `?` placeholders (or an ORM/JdbcTemplate that does) for every value — the driver sends values separately from the SQL text, so input cannot change the statement's structure. Never concatenate user input into SQL. Identifiers (table/column names, sort directions) cannot be parameters, so validate them against a whitelist. Add least-privilege roles so a successful injection can do little.

</details>

### Q7. What are predefined roles?

<details>
<summary>Answer</summary>

Built-in roles that grant common administrative capabilities without superuser: `pg_read_all_data` / `pg_write_all_data` (14+), `pg_monitor` and `pg_read_all_stats` (monitoring), `pg_signal_backend` (cancel/terminate sessions), `pg_maintain` (17+: vacuum, analyze, reindex, refresh materialized views), `pg_read_server_files` / `pg_write_server_files`, `pg_checkpoint`, and others. Grant them to operational roles instead of making those roles superusers.

</details>

## Advanced

### Q8. How would you design database roles for a Java microservice?

<details>
<summary>Answer</summary>

- An owner role (`NOLOGIN`) that owns the schema and tables, used only by migrations (Flyway/Liquibase run as a deploy login that is a member of it, or connect as it).
- A runtime group role with `USAGE` on the schema, `SELECT/INSERT/UPDATE/DELETE` on the tables and `USAGE, SELECT` on sequences, plus default privileges so new tables are covered.
- A login role for the service's connection pool, member of the runtime role, with a strong `scram-sha-256` password from a secret store, restricted in `pg_hba.conf` to the service's network.
- A read-only role for reporting/analytics, possibly on replicas.

The service can then read and write data but never alter or drop schema objects.

</details>

### Q9. Why is RLS easy to test incorrectly?

<details>
<summary>Answer</summary>

Policies do not apply to the table owner, superusers or `BYPASSRLS` roles, and developers often test while connected as one of those — every query returns all rows and the tests pass. Test with the actual application role (`SET ROLE app_rw`), or set `ALTER TABLE … FORCE ROW LEVEL SECURITY` so the owner is subject to policies too. Also make sure the session variable used by the policy is always set, and that connection pools reset it between requests.

</details>

### Q10. What does WITH GRANT OPTION do, and why be careful with it?

<details>
<summary>Answer</summary>

It allows the grantee to grant the same privilege to other roles. It makes privilege delegation possible but also makes access harder to track and revoke (revoking from the grantor requires `CASCADE` to remove the grants it made). Prefer group roles managed centrally over chains of `WITH GRANT OPTION`.

</details>
