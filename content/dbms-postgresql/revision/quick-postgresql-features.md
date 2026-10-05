# 30 Minutes: PostgreSQL-Specific Features

Block 4 of 5. What to say when asked "what do you know about PostgreSQL?". Details: **PostgreSQL One-Shot**.

## Architecture

- Process per connection → use a connection pool.
- Shared buffers + OS cache; WAL for durability and replication.
- Autovacuum removes dead row versions and freezes XIDs.
- Cluster → database → schema → objects; `search_path`.

## Types

- `bigint GENERATED ALWAYS AS IDENTITY` for ids (`SERIAL` is legacy); `uuid` (`gen_random_uuid()`, `uuidv7()` in 18).
- `numeric` for money; `text` for strings; `timestamptz` for instants; `interval`.
- `jsonb` (operators `-> ->> @> ?`, GIN index) over `json`.
- Arrays (`ANY`, `unnest`, `array_agg`), ranges and multiranges, enums, `citext`.

## SQL Extras

- `RETURNING`, `ON CONFLICT` upsert, `MERGE` (15+, `RETURNING` in 17+).
- `DISTINCT ON`, `FILTER`, `LATERAL`, `generate_series`, `string_agg`, `array_agg`.
- `UPDATE … FROM`, `DELETE … USING`.
- Generated columns (stored; virtual by default in 18); transactional DDL.
- Recursive CTEs with `SEARCH` and `CYCLE` (14+).

## Server-Side Code

- Functions (`LANGUAGE sql | plpgsql`, `RETURNS TABLE`, volatility), procedures (`CALL`, can commit).
- Triggers (`BEFORE`/`AFTER`/`INSTEAD OF`, row/statement, `NEW`/`OLD`).
- Views (updatable when simple), materialized views (`REFRESH … CONCURRENTLY`).
- Temporary tables (`ON COMMIT DROP | DELETE ROWS`).

## Concurrency

- Read Committed default; Repeatable Read = snapshot; Serializable = SSI; retry `40001`.
- Row locks: `FOR UPDATE`, `FOR NO KEY UPDATE`, `FOR SHARE`, `FOR KEY SHARE`; `SKIP LOCKED` for queues.
- Advisory locks for app-level coordination.

## Indexes and Scale

- B-tree, hash, GIN, GiST, SP-GiST, BRIN; partial, expression, covering (`INCLUDE`), `CONCURRENTLY`.
- Declarative partitioning (range, list, hash) with pruning.
- Streaming and logical replication; `pg_dump` and PITR backups.

## Security

- Roles, `GRANT`/`REVOKE`, default privileges, predefined roles.
- Row-level security policies; `SECURITY DEFINER` with a fixed `search_path`.

## Extensions Worth Naming

`pg_stat_statements`, `pg_trgm`, `pgcrypto`, `citext`, `btree_gist`, `postgres_fdw`, PostGIS, `pgvector`.

## Self-Check

1. Why does PostgreSQL need vacuum?
2. When would you use `DISTINCT ON`?
3. `json` or `jsonb`, and why?
4. What does `SKIP LOCKED` make possible?
