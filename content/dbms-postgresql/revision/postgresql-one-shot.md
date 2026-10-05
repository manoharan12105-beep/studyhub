# PostgreSQL One-Shot Revision

What makes PostgreSQL PostgreSQL: architecture, types, features, concurrency, indexes, security and operations.

## Architecture

- **Process per connection**; postmaster accepts connections; use a pool (HikariCP, PgBouncer).
- **Shared buffers** cache 8 kB pages; the OS cache sits underneath.
- **WAL** (write-ahead log) for durability, crash recovery, replication and point-in-time recovery.
- Background workers: checkpointer, background writer, WAL writer, **autovacuum**, WAL senders.
- Cluster → databases → **schemas** → objects; `search_path` resolves unqualified names.

## Data Types

| Need | Type |
|------|------|
| Whole numbers | `integer`, `bigint` (ids), `smallint` |
| Exact decimals (money) | `numeric(p, s)` |
| Approximate | `real`, `double precision` |
| Text | `text` (or `varchar(n)` for a business limit); avoid `char(n)` |
| Instants | `timestamptz`; `date`; `interval` |
| Yes/no | `boolean` |
| Ids | `bigint GENERATED ALWAYS AS IDENTITY`, `uuid` (`gen_random_uuid()`, `uuidv7()` in 18) |
| Semi-structured | `jsonb` (GIN index; `->`, `->>`, `@>`, `?`) |
| Lists | arrays (`int[]`, `ANY`, `unnest`, `array_agg`) |
| Ranges | `daterange`, `tstzrange`, multiranges (14+) |
| Enumerations | `enum` types or a lookup table |

## PostgreSQL-Specific SQL

- `RETURNING` on `INSERT`/`UPDATE`/`DELETE` (and `MERGE` in 17+).
- `INSERT … ON CONFLICT … DO NOTHING / DO UPDATE`.
- `DISTINCT ON (…)` — first row per group.
- `UPDATE … FROM`, `DELETE … USING`.
- `FILTER (WHERE …)` on aggregates; `generate_series`; `LATERAL`.
- Generated columns: `GENERATED ALWAYS AS (expr) STORED` (virtual columns are the default in 18).
- Transactional DDL; `CREATE INDEX CONCURRENTLY`.
- Extensions: `pg_stat_statements`, `pg_trgm`, `pgcrypto`, `citext`, `btree_gist`, `postgres_fdw`, PostGIS, `pgvector`.

## Concurrency and MVCC

- Each row version has `xmin`/`xmax`; `UPDATE` = new version + old marked dead.
- Readers never block writers, writers never block readers; writers block writers on the same row.
- Isolation: Read Committed (default, snapshot per statement), Repeatable Read (snapshot per transaction, `40001` on write conflict), Serializable (SSI, also prevents write skew).
- Row locks: `FOR UPDATE`, `FOR NO KEY UPDATE`, `FOR SHARE`, `FOR KEY SHARE`; `NOWAIT`, `SKIP LOCKED`.
- **Vacuum** removes dead versions, updates the visibility map and freezes XIDs (prevents wraparound); long transactions block cleanup.
- Advisory locks for application-level coordination.

## Indexes

| Type | Use |
|------|-----|
| B-tree | Default: `=`, ranges, sorting, uniqueness |
| Hash | `=` only |
| GIN | `jsonb`, arrays, full-text, trigrams |
| GiST | Ranges, geometry, nearest neighbour, exclusion constraints |
| SP-GiST | Partitioned search spaces (points, prefixes) |
| BRIN | Huge append-only tables ordered by time |

Plus multicolumn, partial (`WHERE`), expression (`lower(email)`), covering (`INCLUDE`) and unique indexes.

## Server-Side Programming

- Functions (`CREATE FUNCTION … LANGUAGE sql | plpgsql`, `RETURNS TABLE`, volatility `IMMUTABLE`/`STABLE`/`VOLATILE`).
- Procedures (`CREATE PROCEDURE`, `CALL`; can `COMMIT` inside).
- Triggers (`BEFORE`/`AFTER`/`INSTEAD OF`, row or statement level; `NEW`/`OLD`).
- Views, materialized views (`REFRESH … CONCURRENTLY` needs a unique index), temporary tables.

## Security

- Roles (users = roles with `LOGIN`), membership, `GRANT`/`REVOKE` on databases, schemas, tables, columns, sequences and functions.
- `ALTER DEFAULT PRIVILEGES`; predefined roles (`pg_read_all_data`, …).
- Row-level security: `ENABLE ROW LEVEL SECURITY` + `CREATE POLICY … USING (…)`.
- `SECURITY DEFINER` functions with a fixed `search_path`; parameters against SQL injection.

## Scale and Operations

- **Partitioning** (range, list, hash) for huge tables with a dominant key and retention.
- **Replication**: streaming (physical) for HA/read replicas; logical for selected tables and upgrades.
- **Backups**: `pg_dump`/`pg_restore` (logical), base backup + WAL archiving (PITR).
- **Monitoring**: `pg_stat_activity`, `pg_stat_statements`, `pg_stat_user_tables`, `pg_locks`, logs.

## Last Lines to Remember

PostgreSQL = MVCC + WAL + rich types + many index methods + extensions. Use `timestamptz`, `numeric`, identity columns and `jsonb`; keep transactions short so vacuum can keep up.
