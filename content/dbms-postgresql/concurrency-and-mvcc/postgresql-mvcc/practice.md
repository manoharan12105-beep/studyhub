# MVCC and VACUUM — Practice

### P1. What does UPDATE do?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** row versions

In PostgreSQL, `UPDATE products SET price = 520 WHERE product_id = 2` …

- A) overwrites the row in place and writes the old value to an undo log
- B) writes a new row version and marks the old version as replaced
- C) deletes the row and re-inserts it at the end of the table, always with new index entries
- D) locks the whole table, then overwrites the row

<details>
<summary>Answer</summary>

**Answer:** B)

**Explanation:** The old version gets `xmax` set and stays until vacuumed. New index entries are created unless the update is HOT, so C's "always" is wrong; only writers of the same row are blocked, not the table.

</details>

### P2. Watch the ctid change

**Difficulty:** Easy · **Type:** Query · **Concepts:** ctid, row versions

Show the `ctid` of Pooja's row, raise her salary by 1000, and show the `ctid` again in the same statement sequence.

**Expected output:**

```text
 ctid  | name  | salary
-------+-------+--------
 (0,9) | Pooja |  52000
(1 row)

  ctid  | name  | salary
--------+-------+--------
 (0,13) | Pooja |  53000
(1 row)
```

<details>
<summary>Solution</summary>

```sql
SELECT ctid, name, salary FROM employees WHERE name = 'Pooja';
UPDATE employees SET salary = salary + 1000 WHERE name = 'Pooja';
SELECT ctid, name, salary FROM employees WHERE name = 'Pooja';
```

**Explanation:** The new version is stored in a new slot on the page; the old one at the previous `ctid` is now a dead tuple. Never use `ctid` as a permanent row identifier — it changes on every update and after `VACUUM FULL`.

</details>

### P3. Count the dead tuples

**Difficulty:** Medium · **Type:** Output · **Concepts:** dead tuples, statistics

How many live and dead tuples does the last query report?

```sql
CREATE TABLE counters (id int PRIMARY KEY, n int) WITH (autovacuum_enabled = off);
INSERT INTO counters SELECT g, 0 FROM generate_series(1, 10) AS g;
UPDATE counters SET n = n + 1;
UPDATE counters SET n = n + 1 WHERE id <= 5;
DELETE FROM counters WHERE id = 10;
SELECT pg_stat_force_next_flush();
SELECT n_live_tup, n_dead_tup FROM pg_stat_user_tables WHERE relname = 'counters';
```

<details>
<summary>Answer</summary>

**Output:**

```text
 pg_stat_force_next_flush
--------------------------

(1 row)

 n_live_tup | n_dead_tup
------------+------------
          9 |         16
(1 row)
```

Live: 10 inserted − 1 deleted = 9. Dead: the first `UPDATE` leaves 10 old versions, the second 5 more, and the `DELETE` 1 → 16. Ten logical rows produced 25 row versions on disk until VACUUM runs.

</details>

### P4. Why is cleanup not happening?

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** xmin horizon

`VACUUM (VERBOSE) orders` reports `tuples: 0 removed, 2000000 remain, 1500000 are dead but not yet removable`. Write queries that find the likely culprits.

<details>
<summary>Answer</summary>

Dead tuples are "not yet removable" when some snapshot or slot is older than them. Check the usual holders:

```sql
-- Illustrative
-- 1. Old or idle-in-transaction sessions
SELECT pid, state, xact_start, backend_xmin, left(query, 50)
FROM pg_stat_activity
WHERE backend_xmin IS NOT NULL
ORDER BY age(backend_xmin) DESC;

-- 2. Forgotten prepared transactions
SELECT gid, prepared, owner FROM pg_prepared_xacts ORDER BY prepared;

-- 3. Replication slots holding back the horizon
SELECT slot_name, active, xmin, catalog_xmin FROM pg_replication_slots;
```

End the old session (`pg_terminate_backend`), commit/roll back the prepared transaction, or drop the unused slot; the next vacuum can then remove the dead tuples. Also check replicas with `hot_standby_feedback = on` running long queries.

</details>

### P5. Tune autovacuum for a hot table

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** autovacuum thresholds

A 50-million-row `sessions` table receives 2 million updates per hour. With defaults, how many dead tuples accumulate before autovacuum triggers, and what per-table settings would you use?

<details>
<summary>Answer</summary>

Default trigger: `autovacuum_vacuum_threshold` (50) + `autovacuum_vacuum_scale_factor` (0.2) × 50,000,000 ≈ **10 million** dead tuples — about five hours of updates, plenty of time for heavy bloat. Lower the scale factor for this table, e.g.

```sql
-- Illustrative
ALTER TABLE sessions SET (autovacuum_vacuum_scale_factor = 0.01,   -- ~500k dead tuples
                          autovacuum_vacuum_cost_limit = 2000,      -- let workers do more work per round
                          fillfactor = 90);                         -- room for HOT updates
```

Also avoid indexing columns that change on every update (so updates stay HOT), and keep transactions short so vacuum can actually remove what it finds.

</details>
