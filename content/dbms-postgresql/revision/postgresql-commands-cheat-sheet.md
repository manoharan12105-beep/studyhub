# PostgreSQL Commands Cheat Sheet

`psql` meta-commands, everyday SQL commands and monitoring queries.

## psql Meta-Commands

| Command | Does |
|---------|------|
| `psql -h host -p 5432 -U user -d db` | Connect from the shell |
| `\l` / `\c db` | List databases / connect to one |
| `\dn` / `\dt` / `\dv` / `\dm` / `\di` / `\ds` / `\df` | List schemas / tables / views / materialized views / indexes / sequences / functions |
| `\d name` / `\d+ name` | Describe an object (with details) |
| `\du` / `\dp name` | Roles / privileges |
| `\x` / `\x auto` | Expanded output |
| `\timing` | Show execution time |
| `\pset null NULL` | Show `NULL` visibly |
| `\i file.sql` / `\o file` | Run a file / send output to a file |
| `\copy t FROM 'file.csv' CSV HEADER` | Client-side import (and `TO` for export) |
| `\e` / `\g` / `\gx` / `\watch 5` | Edit buffer / run / run expanded / repeat every 5 s |
| `\conninfo` / `\q` / `\?` | Connection info / quit / help |

## Databases, Schemas, Roles

```sql
-- Illustrative
CREATE DATABASE app;  DROP DATABASE app;
CREATE SCHEMA billing;  SET search_path = billing, public;
CREATE ROLE app_user LOGIN PASSWORD '…';  CREATE ROLE readonly NOLOGIN;
GRANT readonly TO app_user;
GRANT USAGE ON SCHEMA billing TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA billing TO readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA billing GRANT SELECT ON TABLES TO readonly;
REVOKE INSERT ON billing.invoices FROM app_user;
```

## Tables and Changes

```sql
-- Illustrative
CREATE TABLE t (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, name text NOT NULL);
ALTER TABLE t ADD COLUMN email text;
ALTER TABLE t ALTER COLUMN email SET NOT NULL;
ALTER TABLE t ADD CONSTRAINT t_email_key UNIQUE (email);
ALTER TABLE t ADD CONSTRAINT fk FOREIGN KEY (x) REFERENCES p (id) NOT VALID;
ALTER TABLE t VALIDATE CONSTRAINT fk;
ALTER TABLE t RENAME COLUMN name TO full_name;
TRUNCATE t RESTART IDENTITY;
COPY t FROM '/server/path/file.csv' WITH (FORMAT csv, HEADER);
```

## Maintenance

```sql
-- Illustrative
VACUUM (VERBOSE, ANALYZE) t;
ANALYZE t;
REINDEX TABLE CONCURRENTLY t;
CLUSTER t USING t_pkey;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv;
```

## Monitoring Queries

```sql
-- Illustrative
-- What is running, and who waits for whom
SELECT pid, usename, state, wait_event_type, pg_blocking_pids(pid), now() - query_start AS runtime, query
FROM pg_stat_activity WHERE state <> 'idle' ORDER BY runtime DESC;

-- Heaviest statements (needs pg_stat_statements)
SELECT calls, round(total_exec_time) AS total_ms, round(mean_exec_time, 2) AS mean_ms, query
FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 10;

-- Table health
SELECT relname, n_live_tup, n_dead_tup, last_autovacuum, last_autoanalyze, seq_scan, idx_scan
FROM pg_stat_user_tables ORDER BY n_dead_tup DESC;

-- Sizes
SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- Cancel / terminate
SELECT pg_cancel_backend(12345);  SELECT pg_terminate_backend(12345);
```

## Useful Functions

```sql
SELECT version() LIKE 'PostgreSQL%' AS is_postgres,
       current_database() IS NOT NULL AS has_db,
       pg_size_pretty(1048576::bigint) AS one_mib,
       gen_random_uuid() IS NOT NULL AS uuid_ok,
       now() = current_timestamp AS same_in_txn;
```

**Output:**

```text
 is_postgres | has_db | one_mib | uuid_ok | same_in_txn
-------------+--------+---------+---------+-------------
 t           | t      | 1024 kB | t       | t
(1 row)
```

## Backup and Restore (shell)

```text
pg_dump -Fc -d app -f app.dump          # custom-format logical backup
pg_restore -d app_restored -j 4 app.dump
pg_dumpall --globals-only > globals.sql # roles and tablespaces
pg_basebackup -D /backup/base -X stream # physical base backup
```
