# MVCC and VACUUM — Interview Questions

## Beginner

### Q1. What is MVCC?

<details>
<summary>Answer</summary>

Multi-Version Concurrency Control: the database keeps several versions of a row so that each transaction can read a consistent snapshot while others modify the data. In PostgreSQL an `UPDATE` writes a new row version and marks the old one with the updating transaction's id; each snapshot sees only versions committed before it. As a result, readers never block writers and writers never block readers.

</details>

### Q2. What does VACUUM do?

<details>
<summary>Answer</summary>

It removes dead row versions (left by updates, deletes and aborted transactions) that no snapshot can see anymore, making their space reusable; updates the visibility map (enabling index-only scans); freezes old transaction ids to prevent wraparound; and with `ANALYZE` refreshes statistics. Autovacuum runs it automatically based on how many rows changed.

</details>

### Q3. What is the difference between VACUUM and VACUUM FULL?

<details>
<summary>Answer</summary>

`VACUUM` marks dead space reusable inside the existing files, runs alongside normal reads and writes, and usually does not shrink the files. `VACUUM FULL` rewrites the whole table and its indexes into new compact files, returning space to the operating system, but holds an `ACCESS EXCLUSIVE` lock for the duration (the table is unusable) and needs extra disk space. Routine maintenance uses `VACUUM`; `VACUUM FULL` is for rare recovery from heavy bloat.

</details>

## Intermediate

### Q4. What are xmin and xmax?

<details>
<summary>Answer</summary>

Hidden system columns of every row version: `xmin` is the id of the transaction that created the version; `xmax` the id of the transaction that deleted or superseded it (0 if none; also used to record row locks). Visibility rules compare them with the snapshot: a version is visible if `xmin` committed before the snapshot and `xmax` is empty, aborted or not committed as of the snapshot.

</details>

### Q5. What is table bloat and what causes it?

<details>
<summary>Answer</summary>

Space in tables and indexes occupied by dead tuples or left empty after their removal, making files larger than the live data needs and scans slower. Causes: frequent updates/deletes outpacing vacuum, autovacuum thresholds too lax for large tables, and anything holding back the xmin horizon (long or idle-in-transaction sessions, abandoned prepared transactions, stale replication slots). Fix the cause, tune autovacuum per table, and rebuild bloated objects (`REINDEX CONCURRENTLY`, `pg_repack`, or `VACUUM FULL` in a maintenance window).

</details>

### Q6. Why is rollback fast in PostgreSQL?

<details>
<summary>Answer</summary>

Nothing has to be undone: the versions created by an aborted transaction stay where they are but are never visible, because visibility checks see that their `xmin` aborted. The commit log records the transaction's status; VACUUM later reclaims the space. Undo-log databases must instead apply undo records to restore the old values.

</details>

### Q7. What is a HOT update?

<details>
<summary>Answer</summary>

A Heap-Only Tuple update: when an `UPDATE` changes no indexed column and the new version fits on the same page, PostgreSQL does not create new index entries — existing entries reach the new version through a redirect chain on the page. It reduces index writes and bloat. Avoiding unnecessary indexes on frequently updated columns and lowering `fillfactor` (leaving free space per page) increase the HOT ratio (`n_tup_hot_upd` in `pg_stat_user_tables`).

</details>

## Advanced

### Q8. What is transaction ID wraparound, and how does PostgreSQL prevent it?

<details>
<summary>Answer</summary>

Transaction ids are 32-bit and compared modulo 2³², so roughly 2 billion transactions after a row was written, its `xmin` would look like it is in the future and the row would vanish. VACUUM prevents this by freezing sufficiently old tuples (marking them visible to all regardless of XID). Autovacuum launches aggressive anti-wraparound vacuums when a table's `relfrozenxid` age exceeds `autovacuum_freeze_max_age` (default 200 million), even if autovacuum is otherwise disabled. If the horizon cannot advance, PostgreSQL warns and finally refuses to assign new XIDs until a vacuum completes. Monitor `age(datfrozenxid)`.

</details>

### Q9. A table with 1 million live rows has 30 million dead tuples and autovacuum runs constantly without improving it. What would you check?

<details>
<summary>Answer</summary>

Whether something holds back the xmin horizon so the dead tuples are "not yet removable" (VACUUM VERBOSE says so): long-running or idle-in-transaction sessions (`pg_stat_activity.backend_xmin`, `xact_start`), prepared transactions (`pg_prepared_xacts`), replication slots with an old `xmin`/`catalog_xmin` (`pg_replication_slots`), and standby feedback from replicas running long queries. Once the holder is gone, vacuum can clean up; then consider per-table autovacuum tuning and rebuilding the bloated table/indexes.

</details>

### Q10. Why is SELECT count(*) on a large table slow in PostgreSQL?

<details>
<summary>Answer</summary>

Because of MVCC there is no single stored row count: different snapshots may see different numbers of rows, so the count must check the visibility of each row version — typically a (parallel) sequential scan, or an index-only scan if the visibility map shows most pages all-visible. For an approximate count, use `pg_class.reltuples` or `pg_stat_user_tables.n_live_tup`; for exact counts at scale, maintain a counter table.

</details>
