# MVCC and VACUUM in PostgreSQL

**Module:** Concurrency and MVCC · **Interview priority:** Frequently asked

## What Is It?

**Multi-Version Concurrency Control (MVCC)** is how PostgreSQL lets many transactions read and write at once without readers and writers blocking each other: instead of overwriting a row in place, every `UPDATE` writes a **new version** of the row, and each transaction sees the versions that were committed as of its **snapshot**.

Old versions that no transaction can see any more are **dead tuples**. **VACUUM** removes them so the space can be reused.

```text
UPDATE employees SET salary = 100000 WHERE emp_id = 2;

  before:  (0,2)  Ravi 95000   xmin=700  xmax=0       ← live
  after:   (0,2)  Ravi 95000   xmin=700  xmax=812     ← dead once 812 commits (old snapshots still see it)
           (0,13) Ravi 100000  xmin=812  xmax=0       ← new version
```

## Why It Matters

- MVCC explains PostgreSQL's concurrency behaviour: why reads never wait, how isolation levels work, why `UPDATE`-heavy tables grow (**bloat**), and why long transactions are harmful.
- "How does MVCC work?", "What does VACUUM do?" and "VACUUM vs VACUUM FULL" are classic PostgreSQL interview questions; transaction ID wraparound is a favourite senior-level follow-up.

## Core Concept

### Row versions (tuples)

Every row version in a table stores hidden system columns, including:

| Column | Meaning |
|--------|---------|
| `xmin` | Transaction ID (XID) that created this version |
| `xmax` | XID that deleted or replaced it (0 if none) — also used for row locks |
| `ctid` | Physical location: (page number, item number) |

- `INSERT` creates a version with `xmin` = the inserting transaction.
- `DELETE` sets `xmax` on the current version; the data stays in place.
- `UPDATE` = mark the old version's `xmax` + insert a new version (possibly on another page). The old version points (`t_ctid`) to the new one.

### Snapshots and visibility

A **snapshot** records which transactions had committed at a moment. A version is visible to a snapshot when:

- its `xmin` committed before the snapshot (or is the current transaction itself), **and**
- its `xmax` is empty, aborted, or not yet committed as of the snapshot.

READ COMMITTED takes a new snapshot per statement; REPEATABLE READ and SERIALIZABLE one per transaction ([Isolation Levels](../../transactions/postgresql-isolation-levels/content.md)). Because aborted transactions' versions are simply never visible, **rollback is instant** — nothing has to be undone.

### Consequences

| Consequence | Why |
|-------------|-----|
| Readers never block writers, writers never block readers | Readers use old versions while a writer creates new ones |
| Rollback is cheap | Aborted versions are ignored, later cleaned up |
| Updates and deletes leave **dead tuples** | Old versions remain until vacuumed |
| Tables and indexes can **bloat** | Dead tuples occupy space until removed and reused |
| Long transactions block cleanup | A version is dead only when no snapshot can still see it |
| `count(*)` must check visibility | There is no single "current row count" — each snapshot can differ |

### VACUUM

`VACUUM` (run automatically by **autovacuum**):

1. Removes dead tuples no snapshot can see (and their index entries), marking the space reusable in the **free space map**. It does **not** usually shrink the file.
2. Updates the **visibility map** — pages where all tuples are visible to everyone — which enables **index-only scans** and lets later vacuums skip those pages.
3. **Freezes** old tuples to protect against transaction ID wraparound.
4. `VACUUM ANALYZE` also refreshes planner statistics.

| | `VACUUM` | `VACUUM FULL` |
|---|---|---|
| What it does | Marks dead space reusable | Rewrites the table compactly, returns space to the OS |
| Lock | `SHARE UPDATE EXCLUSIVE` — reads and writes continue | `ACCESS EXCLUSIVE` — table unavailable |
| Extra disk | None | Room for a full copy |
| Use | Routine (autovacuum) | Rarely, after massive deletes; prefer `pg_repack`-style online tools in production |

### Autovacuum

A background launcher starts workers that vacuum and analyze tables when enough rows changed: roughly when dead tuples exceed `autovacuum_vacuum_threshold` (50) + `autovacuum_vacuum_scale_factor` (20%) × table rows. For large, hot tables the default 20% is often too lazy; set per-table values (`ALTER TABLE … SET (autovacuum_vacuum_scale_factor = 0.02)`). Never disable autovacuum globally.

### HOT updates

A **Heap-Only Tuple** update happens when no indexed column changes and the new version fits on the same page: the new version gets **no new index entries** — index entries keep pointing at the old item, which redirects along the chain. HOT updates reduce index bloat and write volume. Leaving free space in pages (`fillfactor` < 100) increases the chance of HOT updates for update-heavy tables.

### Transaction ID wraparound and freezing

XIDs are 32-bit and compared in a circular space (about 2 billion "in the past", 2 billion "in the future"). A very old `xmin` would eventually appear to be in the future, making committed rows invisible. VACUUM prevents this by **freezing** old tuples (marking them visible to everyone). Autovacuum forces anti-wraparound vacuums when a table's oldest unfrozen XID age approaches `autovacuum_freeze_max_age` (200 million). If freezing cannot keep up (for example, because a forgotten transaction or replication slot holds back the horizon), PostgreSQL eventually refuses new XIDs to protect data. Monitor `age(datfrozenxid)`.

### What blocks cleanup

Dead tuples can be removed only if they are older than the oldest snapshot still in use (the **xmin horizon**). Holders include:

- long-running or idle-in-transaction sessions;
- forgotten prepared transactions (`pg_prepared_xacts`);
- stale replication slots;
- replicas with `hot_standby_feedback = on` running long queries.

## Syntax

```sql
-- Illustrative
SELECT ctid, xmin, xmax, * FROM t;
VACUUM [ (VERBOSE, ANALYZE) ] t;
VACUUM FULL t;
SELECT relname, n_live_tup, n_dead_tup, last_autovacuum FROM pg_stat_user_tables;
ALTER TABLE t SET (autovacuum_vacuum_scale_factor = 0.02, fillfactor = 90);
SELECT datname, age(datfrozenxid) FROM pg_database;
```

## Examples

### Seeing row versions move

```sql
CREATE TABLE mvcc_demo (id int, v text) WITH (autovacuum_enabled = off);
INSERT INTO mvcc_demo VALUES (1, 'a'), (2, 'b'), (3, 'c');
SELECT ctid, id, v FROM mvcc_demo ORDER BY id;
```

**Output:**

```text
 ctid  | id | v
-------+----+---
 (0,1) |  1 | a
 (0,2) |  2 | b
 (0,3) |  3 | c
(3 rows)
```

```sql
UPDATE mvcc_demo SET v = 'B' WHERE id = 2;
DELETE FROM mvcc_demo WHERE id = 3;
SELECT ctid, id, v FROM mvcc_demo ORDER BY id;
```

**Output:**

```text
 ctid  | id | v
-------+----+---
 (0,1) |  1 | a
 (0,4) |  2 | B
(2 rows)
```

Row 2 now lives at `(0,4)`: the update wrote a new version. Row 3 is gone from query results, but not from the page.

### Inside the page (pageinspect)

The `pageinspect` extension (superuser only — a learning and debugging tool) shows every item on a page, visible or not:

```sql
CREATE EXTENSION IF NOT EXISTS pageinspect;
SELECT lp, lp_flags, t_ctid,
       t_xmax <> 0                    AS xmax_set,
       (t_infomask2 & 16384) <> 0     AS hot_updated,
       (t_infomask2 & 32768) <> 0     AS heap_only
FROM heap_page_items(get_raw_page('mvcc_demo', 0));
```

**Output:**

```text
 lp | lp_flags | t_ctid | xmax_set | hot_updated | heap_only
----+----------+--------+----------+-------------+-----------
  1 |        1 | (0,1)  | f        | f           | f
  2 |        1 | (0,4)  | t        | t           | f
  3 |        1 | (0,3)  | t        | f           | f
  4 |        1 | (0,4)  | f        | f           | t
(4 rows)
```

- Item 2 is the old version of row 2: `xmax` set, and `t_ctid` points to its replacement at (0,4). It is marked HOT-updated (the table has no indexes), and item 4 is a heap-only tuple.
- Item 3 is the deleted row 3: still on the page with `xmax` set.
- `lp_flags` 1 means a normal item.

### The new version belongs to the current transaction

```sql
BEGIN;
INSERT INTO mvcc_demo VALUES (9, 'z');
SELECT xmin = pg_current_xact_id()::xid AS created_by_me, xmax FROM mvcc_demo WHERE id = 9;
ROLLBACK;
SELECT count(*) AS rows_with_id_9 FROM mvcc_demo WHERE id = 9;
```

**Output:**

```text
 created_by_me | xmax
---------------+------
 t             |    0
(1 row)

 rows_with_id_9
----------------
              0
(1 row)
```

The rollback did not delete anything: the version created by the aborted transaction simply never becomes visible.

### Dead tuples and VACUUM

```sql
SELECT pg_stat_force_next_flush();
SELECT n_live_tup, n_dead_tup FROM pg_stat_user_tables WHERE relname = 'mvcc_demo';
```

**Output:**

```text
 pg_stat_force_next_flush
--------------------------

(1 row)

 n_live_tup | n_dead_tup
------------+------------
          2 |          3
(1 row)
```

Three dead tuples: the old version of row 2, the deleted row 3, and the version inserted by the rolled-back transaction (id 9). Now vacuum:

```sql
VACUUM mvcc_demo;
SELECT lp, lp_flags, t_ctid FROM heap_page_items(get_raw_page('mvcc_demo', 0));
```

**Output:**

```text
 lp | lp_flags | t_ctid
----+----------+--------
  1 |        1 | (0,1)
  2 |        2 | NULL
  3 |        0 | NULL
  4 |        1 | (0,4)
(4 rows)
```

`lp_flags`: 0 = unused (space reusable), 1 = normal, 2 = redirect. Item 2 became a **redirect** to item 4 (so index entries pointing at item 2 would still find row 2 — the HOT chain), item 3 (the deleted row) is unused, and the live versions 1 and 4 are untouched. The aborted insert's item 5 disappeared completely: VACUUM truncates unused items at the end of a page's item array. The table file did not shrink; the freed items will be reused by future inserts.

### A long transaction holds back VACUUM

Run with two sessions on PostgreSQL 18:

```text
Session A                                         Session B
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT count(*) FROM big;     -- 1000, snapshot taken
                                                  DELETE FROM big WHERE id <= 500;
                                                  VACUUM (VERBOSE) big;
                                                  INFO:  … tuples: 0 removed, 1000 remain,
                                                         500 are dead but not yet removable
COMMIT;
                                                  VACUUM (VERBOSE) big;
                                                  INFO:  … tuples: 500 removed, 500 remain,
                                                         0 are dead but not yet removable
```

While A's snapshot could still see the deleted rows, VACUUM had to keep them. Every long transaction does this to the whole database.

### Monitoring

```sql
SELECT relname, n_live_tup, n_dead_tup,
       last_vacuum IS NOT NULL AS vacuumed_manually,
       autovacuum_count
FROM pg_stat_user_tables
WHERE relname IN ('mvcc_demo', 'accounts')
ORDER BY relname;
```

**Output (varies):**

```text
  relname  | n_live_tup | n_dead_tup | vacuumed_manually | autovacuum_count
-----------+------------+------------+-------------------+------------------
 accounts  |          0 |          0 | f                 |                0
 mvcc_demo |          2 |          0 | t                 |                0
(2 rows)
```

```sql
SELECT age(datfrozenxid) < 200000000 AS far_from_forced_freeze
FROM pg_database
WHERE datname = current_database();
```

**Output:**

```text
 far_from_forced_freeze
------------------------
 t
(1 row)
```

## Comparison

### PostgreSQL MVCC vs undo-log MVCC (Oracle, MySQL InnoDB)

| | PostgreSQL | Undo-log designs |
|---|---|---|
| Old versions stored | In the table itself (dead tuples) | In a separate undo area; the row is updated in place |
| Rollback | Instant (versions ignored) | Must apply undo records |
| Cleanup | VACUUM | Purge of undo |
| Typical problem | Table/index bloat, vacuum tuning | Undo space, "snapshot too old" errors |

## Common Mistakes

- Thinking `UPDATE` modifies the row in place in PostgreSQL.
- Expecting `DELETE` to shrink a table file (only `VACUUM FULL`/rewrite does).
- Disabling autovacuum to "save resources" — bloat and wraparound follow.
- Running `VACUUM FULL` routinely on production tables (exclusive lock, full rewrite).
- Leaving transactions open (idle in transaction) for hours.
- Ignoring `n_dead_tup` growth and XID age monitoring.

## Revision

- MVCC: each `UPDATE` writes a new row version; `xmin`/`xmax` decide visibility per snapshot; readers and writers do not block each other.
- Rollback is instant; old/aborted versions become dead tuples.
- VACUUM: removes dead tuples (space reusable, not returned), updates the visibility map, freezes old XIDs; autovacuum runs it automatically; `VACUUM FULL` rewrites with an exclusive lock.
- HOT updates: no index change + room on the page → no new index entries.
- Long transactions, idle-in-transaction sessions, prepared transactions and replication slots hold back cleanup.
- XID wraparound is prevented by freezing; monitor `age(datfrozenxid)`.

## Quick Revision

PostgreSQL never updates in place: each change creates a new row version and snapshots choose what is visible, so readers and writers never block each other and rollback is free. The price is dead tuples — VACUUM (via autovacuum) reclaims and freezes them, as long as no old snapshot holds them back.
