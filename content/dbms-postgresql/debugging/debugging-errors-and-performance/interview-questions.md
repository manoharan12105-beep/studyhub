# Debugging Errors and Performance — Interview Questions

## Beginner

### Q1. An insert fails with "violates foreign key constraint". What do you check?

<details>
<summary>Answer</summary>

Read the `DETAIL` line: `Key (customer_id)=(7) is not present in table "customers"`. Then check whether the parent row really should exist (a wrong id, a typo, a different environment) or is inserted later in the same process (wrong order). Insert parents first, or make the constraint `DEFERRABLE INITIALLY DEFERRED` for bulk loads that cannot be ordered. On `DELETE`, the same error means children still reference the row.

</details>

### Q2. Every insert into a table fails with "duplicate key value violates unique constraint …_pkey", although the application never sets ids. Why?

<details>
<summary>Answer</summary>

The id sequence is behind the existing ids, usually because data was loaded or restored with explicit ids. Each insert takes `nextval`, which returns an id already present. Fix: `SELECT setval(pg_get_serial_sequence('t', 'id'), (SELECT max(id) FROM t))`. Prevent it with `GENERATED ALWAYS AS IDENTITY`, which rejects explicit ids by default, and by resetting sequences after loads.

</details>

### Q3. What does "current transaction is aborted, commands ignored until end of transaction block" mean?

<details>
<summary>Answer</summary>

An earlier statement in the same transaction failed. PostgreSQL then rejects everything until the transaction ends (SQLSTATE `25P02`). The real error is the **first** one — look for it in the logs or the client output. `ROLLBACK`, then fix and retry. To continue after an expected failure within a transaction, wrap the risky statement in a `SAVEPOINT`.

</details>

## Intermediate

### Q4. Users report that saving a form hangs. How do you find out what is blocking it?

<details>
<summary>Answer</summary>

```sql
-- Illustrative
SELECT pid, state, wait_event_type, wait_event, pg_blocking_pids(pid) AS blocked_by,
       now() - xact_start AS xact_age, left(query, 80) AS query
FROM pg_stat_activity
WHERE datname = current_database()
ORDER BY xact_start;
```

Find the session with `wait_event_type = 'Lock'`, follow `blocked_by` to the blocker, and see what it is doing — often `idle in transaction` (a forgotten commit) or a long migration. Short-term: `pg_cancel_backend(pid)` or `pg_terminate_backend(pid)`. Long-term: shorter transactions, `idle_in_transaction_session_timeout`, and `lock_timeout` for migrations.

</details>

### Q5. A query was fast yesterday and is slow today. What changed?

<details>
<summary>Answer</summary>

Likely candidates:

- the **plan** changed (data grew, statistics changed or are stale, a generic prepared plan kicked in);
- data volume or distribution crossed a threshold (a nested loop became a disaster);
- **bloat** after mass updates or deletes;
- an index was dropped or became invalid (a failed `CREATE INDEX CONCURRENTLY`);
- **locking or contention** — the query is waiting, not working;
- the cache is cold after a restart;
- the server is overloaded by something else.

Compare `EXPLAIN (ANALYZE, BUFFERS)` now with a known-good plan, check `pg_stat_activity` waits and `pg_stat_user_tables` (last analyze, dead tuples).

</details>

### Q6. How would you debug a recursive CTE that never finishes?

<details>
<summary>Answer</summary>

Run it with a `LIMIT` on the outer query or a depth column with `WHERE depth < 20` to see the rows it generates. Look for repeating ids, which reveal a cycle in the data, or a recursive term without a stopping condition. Fix the logic (termination condition), add `CYCLE id SET is_cycle USING path` for data cycles, and protect production with `statement_timeout`. Repair the cyclic data and add validation so it cannot recur.

</details>

### Q7. An index exists on `created_at`, but `EXPLAIN` shows a sequential scan. Give four possible reasons.

<details>
<summary>Answer</summary>

1. The filter wraps the column: `created_at::date = …`, `date_trunc('day', created_at) = …` → use a range.
2. The query matches a large share of rows → a sequential scan is cheaper (correct).
3. Type mismatch: comparing with a value of another type forces a cast on the column side.
4. Stale statistics make the planner overestimate the matching rows → `ANALYZE`.

Others: the table is tiny; `OR` conditions over different columns; the setting `random_page_cost` is too high for SSDs.

</details>

## Advanced

### Q8. A deadlock happens a few times a day between two services. How do you fix it properly?

<details>
<summary>Answer</summary>

1. Read the server log: PostgreSQL logs both processes, the statements and the locks in the cycle.
2. Identify the opposite lock order: service A updates order then inventory, service B inventory then order; or two batches update the same rows in different orders.
3. Make the order consistent: update tables in a fixed order and rows in a fixed key order (`ORDER BY id FOR UPDATE` before updating).
4. Shorten the transactions so lock windows shrink.
5. Keep a retry with backoff for `40P01`, since deadlocks can never be ruled out completely.

</details>

### Q9. `EXPLAIN ANALYZE` shows `Sort Method: external merge  Disk: 250MB`. What does that mean, and what can you do?

<details>
<summary>Answer</summary>

The sort did not fit in `work_mem`, so it spilled to temporary files on disk, which is much slower. Options:

- avoid the sort: an index that already provides the order (`ORDER BY created_at` with an index on `created_at`), or sorting fewer rows by filtering first or using `LIMIT` (top-N heapsort);
- sort narrower rows (select fewer columns);
- raise `work_mem` for this query or role (`SET LOCAL work_mem = '256MB'`), not globally, because it applies per sort or hash node per session.

Hash joins and aggregates spill the same way (`Batches: n` > 1).

</details>
