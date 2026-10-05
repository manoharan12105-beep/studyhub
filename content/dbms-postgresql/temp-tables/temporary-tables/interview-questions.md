# Temporary Tables — Interview Questions

## Beginner

### Q1. What is a temporary table?

<details>
<summary>Answer</summary>

A table visible only to the session that created it and dropped automatically when the session ends (or at transaction end with `ON COMMIT DROP`). It is used to hold intermediate results across several statements — staging imported data, multi-step reports, data fixes. It supports indexes and constraints like a normal table.

</details>

### Q2. What is the difference between a temporary table and a CTE?

<details>
<summary>Answer</summary>

A CTE exists only within one statement and cannot be indexed or analyzed; a temporary table lasts for the session (or transaction), can be used by many statements, indexed and analyzed. Use a CTE for readability inside one query, a temp table when the intermediate result is reused, large, or needs indexes and statistics.

</details>

## Intermediate

### Q3. What do ON COMMIT DELETE ROWS and ON COMMIT DROP do?

<details>
<summary>Answer</summary>

They control what happens at the end of each transaction: `PRESERVE ROWS` (default) keeps the data; `DELETE ROWS` empties the table but keeps its definition for reuse within the session; `DROP` removes the table entirely (it must be created inside a transaction block). `ON COMMIT DROP` is the safest choice with connection pools.

</details>

### Q4. Why should you run ANALYZE on a temporary table?

<details>
<summary>Answer</summary>

Autovacuum cannot access other sessions' temporary tables, so they never get statistics automatically. Without statistics the planner guesses row counts and selectivities, which can produce bad join plans. Run `ANALYZE temp_table` after filling it and before using it in non-trivial queries.

</details>

### Q5. Why can a temporary table cause bugs in an application using a connection pool?

<details>
<summary>Answer</summary>

The temp table belongs to the database connection, not to the request. A pooled connection is reused by later requests, which may see leftover data or fail with "relation already exists"; with transaction-level pooling (PgBouncer), consecutive statements of one request can run on different server connections and not find the table at all. Use `ON COMMIT DROP` inside a single transaction, `DISCARD TEMP`/`DISCARD ALL` on connection return, or avoid temp tables in favour of CTEs.

</details>

## Advanced

### Q6. Temporary table vs unlogged table?

<details>
<summary>Answer</summary>

Both skip the WAL, so writes are fast and the data is not crash-safe or replicated. A temporary table is private to one session and vanishes when it ends; an unlogged table is a normal shared, persistent table that is truncated after a crash and exists only on the primary. Unlogged tables suit shared scratch data and re-creatable caches; temporary tables suit per-session processing.

</details>

### Q7. Why might a query unexpectedly read from an empty table after someone created a temp table?

<details>
<summary>Answer</summary>

Temporary tables live in a schema (`pg_temp_N`) that is searched before all others. Creating `TEMP TABLE orders` in a session makes every unqualified `orders` in that session refer to the temp table, shadowing `public.orders`. Use distinct names for temp tables or qualify permanent tables with their schema.

</details>
