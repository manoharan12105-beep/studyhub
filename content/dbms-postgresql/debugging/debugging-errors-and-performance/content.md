# Debugging Errors and Performance

**Module:** Debugging · **Interview priority:** Frequently asked

## What Is It?

Debugging scenarios in which a query **fails, never finishes, blocks, or is slow**: a recursive CTE that never terminates, an index that is not used, a slow lookup, foreign-key and unique-constraint violations, deadlocks, and changes that "disappear" because a transaction was never committed. Each scenario gives the **problem, why it happens, the incorrect version, the correct version, an explanation and the interview takeaway**.

Queries that run but return wrong data are covered in [Debugging Wrong Query Results](../debugging-wrong-results/content.md).

## Why It Matters

- Reading an error message precisely (constraint name, SQLSTATE, `DETAIL` line) usually points straight at the cause.
- Performance and locking problems are the most common production database incidents, and "how would you debug it?" is a standard interview question.

## Core Concept

### Read the error

PostgreSQL errors carry a **SQLSTATE** code and often a `DETAIL` and `HINT`:

| SQLSTATE | Meaning | Typical fix |
|----------|---------|-------------|
| `23503` | Foreign-key violation | Insert parents first; check ids; choose an `ON DELETE` action |
| `23505` | Unique violation | Upsert, or fix duplicates / an out-of-sync sequence |
| `23502` | Not-null violation | Provide the value or a default |
| `23514` | Check violation | Validate input |
| `40001` | Serialization failure | Retry the transaction |
| `40P01` | Deadlock detected | Consistent lock order; retry |
| `57014` | Query cancelled (timeout) | Fix the query, or raise the timeout deliberately |
| `25P02` | In failed transaction | `ROLLBACK` (or use savepoints) |

### Find the slow or stuck query

- `pg_stat_statements` — which statements use the most total time.
- `EXPLAIN (ANALYZE, BUFFERS)` — where the time goes in one statement.
- `pg_stat_activity` — what is running now, how long, and what it waits for (`wait_event_type = 'Lock'`).
- `pg_blocking_pids(pid)` — who blocks whom.

### Scenarios in this lesson

| # | Symptom | Cause |
|---|---------|-------|
| D1 | Query never finishes | Recursive CTE without a terminating condition, or a cycle |
| D2 | Index exists but is not used | Function on the column, cast, or non-sargable filter |
| D3 | Slow lookup | Missing index on a foreign-key column |
| D4 | Insert fails with `23503` | Parent row missing or inserted in the wrong order |
| D5 | Insert fails with `23505` | Duplicate value, or a sequence behind manually inserted ids |
| D6 | `deadlock detected` | Two transactions lock the same rows in opposite order |
| D7 | Changes disappear or other sessions hang | Transaction never committed |

## Examples

### D1. Recursive CTE never terminating

**Problem:** A query generating a number series runs until it is cancelled.

**Why it happens:** The recursive part has no condition that eventually produces zero rows, so the recursion never stops. The same happens with a cycle in hierarchical data.

Incorrect (a timeout makes the failure visible):

```sql
SET statement_timeout = '300ms';
WITH RECURSIVE nums AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1 FROM nums
)
SELECT count(*) FROM nums;
```

**Output:**

```text
ERROR:  canceling statement due to statement timeout
```

Correct:

```sql
WITH RECURSIVE nums AS (
    SELECT 1 AS n
    UNION ALL
    SELECT n + 1 FROM nums WHERE n < 10
)
SELECT count(*) AS numbers, max(n) AS last FROM nums;
```

**Output:**

```text
 numbers | last
---------+------
      10 |   10
(1 row)
```

For hierarchies, data can contain a cycle (A manages B, B manages A). Guard with the `CYCLE` clause:

```sql
CREATE TABLE reporting (emp text, manager text);
INSERT INTO reporting VALUES ('Uma', NULL), ('Vel', 'Uma'), ('Wasim', 'Xena'), ('Xena', 'Wasim');

WITH RECURSIVE chain AS (
    SELECT emp, manager, 1 AS depth FROM reporting WHERE emp = 'Wasim'
    UNION ALL
    SELECT r.emp, r.manager, c.depth + 1
    FROM reporting r JOIN chain c ON r.emp = c.manager
) CYCLE emp SET is_cycle USING path
SELECT emp, manager, depth, is_cycle FROM chain;
```

**Output:**

```text
  emp  | manager | depth | is_cycle
-------+---------+-------+----------
 Wasim | Xena    |     1 | f
 Xena  | Wasim   |     2 | f
 Wasim | Xena    |     3 | t
(3 rows)
```

**Explanation:** A recursive CTE stops only when an iteration adds no rows. Always have a terminating condition (a depth limit, a bound, a `NULL` parent) and a cycle guard for user-maintained data. `statement_timeout` is a safety net, not a fix.

**Interview takeaway:** "Recursion needs a termination condition and, for real data, cycle detection."

### D2. Index not being used

**Problem:** `users` has indexes on `email` and `created_at`, but lookups still scan the whole table.

```sql
CREATE TABLE app_users (
    id         int PRIMARY KEY,
    email      text NOT NULL,
    created_at timestamp NOT NULL
);
INSERT INTO app_users
SELECT g, 'User' || g || '@Mail.com', TIMESTAMP '2026-01-01' + g * interval '1 minute'
FROM generate_series(1, 50000) AS g;
CREATE INDEX app_users_email_idx ON app_users (email);
CREATE INDEX app_users_created_idx ON app_users (created_at);
ALTER TABLE app_users SET (parallel_workers = 0);
VACUUM ANALYZE app_users;
```

**Why it happens:** The query wraps the indexed column in a function or cast, so the index on the raw column cannot be used.

Incorrect:

```sql
EXPLAIN (COSTS OFF) SELECT id FROM app_users WHERE lower(email) = 'user42@mail.com';
EXPLAIN (COSTS OFF) SELECT count(*) FROM app_users WHERE created_at::date = '2026-01-10';
```

**Output:**

```text
                     QUERY PLAN
----------------------------------------------------
 Seq Scan on app_users
   Filter: (lower(email) = 'user42@mail.com'::text)
(2 rows)

                        QUERY PLAN
-----------------------------------------------------------
 Aggregate
   ->  Seq Scan on app_users
         Filter: ((created_at)::date = '2026-01-10'::date)
(3 rows)
```

Correct — an expression index for the first, a sargable range for the second:

```sql
CREATE INDEX app_users_email_lower_idx ON app_users (lower(email));
ANALYZE app_users;
EXPLAIN (COSTS OFF) SELECT id FROM app_users WHERE lower(email) = 'user42@mail.com';
EXPLAIN (COSTS OFF) SELECT count(*) FROM app_users
WHERE created_at >= '2026-01-10' AND created_at < '2026-01-11';
```

**Output:**

```text
                       QUERY PLAN
---------------------------------------------------------
 Index Scan using app_users_email_lower_idx on app_users
   Index Cond: (lower(email) = 'user42@mail.com'::text)
(2 rows)

                                                                           QUERY PLAN
----------------------------------------------------------------------------------------------------------------------------------------------------------------
 Aggregate
   ->  Index Only Scan using app_users_created_idx on app_users
         Index Cond: ((created_at >= '2026-01-10 00:00:00'::timestamp without time zone) AND (created_at < '2026-01-11 00:00:00'::timestamp without time zone))
(3 rows)
```

**Explanation:** An index on `email` stores `email` values, not `lower(email)` values. Either index the expression the query uses, or rewrite the filter so that it compares the raw column. Other causes to check: implicit casts and type mismatches, a leading `%` in `LIKE`, low selectivity (a sequential scan is correct), stale statistics, and a non-leading column of a composite index.

**Interview takeaway:** "A function on an indexed column hides the index — use an expression index or rewrite as a range."

### D3. Slow query: missing index on a foreign key

**Problem:** "Show a customer's orders" takes seconds on a large table.

```sql
CREATE TABLE big_orders (
    order_id    int PRIMARY KEY,
    customer_id int NOT NULL,
    total       numeric NOT NULL
);
INSERT INTO big_orders SELECT g, g % 5000, g % 997 FROM generate_series(1, 200000) AS g;
ALTER TABLE big_orders SET (parallel_workers = 0);
VACUUM ANALYZE big_orders;
```

**Why it happens:** Foreign-key columns are not indexed automatically, so every lookup by `customer_id` reads all 200,000 rows to return 40.

Incorrect (no index):

```sql
EXPLAIN (COSTS OFF) SELECT order_id, total FROM big_orders WHERE customer_id = 42;
```

**Output:**

```text
          QUERY PLAN
------------------------------
 Seq Scan on big_orders
   Filter: (customer_id = 42)
(2 rows)
```

Correct:

```sql
CREATE INDEX big_orders_customer_idx ON big_orders (customer_id);
ANALYZE big_orders;
EXPLAIN (COSTS OFF) SELECT order_id, total FROM big_orders WHERE customer_id = 42;
```

**Output:**

```text
                     QUERY PLAN
----------------------------------------------------
 Bitmap Heap Scan on big_orders
   Recheck Cond: (customer_id = 42)
   ->  Bitmap Index Scan on big_orders_customer_idx
         Index Cond: (customer_id = 42)
(4 rows)
```

**Explanation:** The plan changes from a sequential scan of every row to an index lookup of the 40 matching rows (a bitmap scan here, because they are spread over many pages). Confirm with `EXPLAIN (ANALYZE, BUFFERS)` on realistic data: actual time and pages read should drop sharply. The general process is to measure, find the expensive node, fix the cause, and measure again.

**Interview takeaway:** "Index foreign-key columns; prove the improvement with `EXPLAIN ANALYZE`."

### D4. Foreign key violation

**Problem:** Loading a new customer and their first order fails.

**Why it happens:** The order is inserted before the customer exists (wrong order), or it references a wrong id.

Incorrect:

```sql
INSERT INTO orders VALUES (109, 7, '2026-04-01', 'PLACED');
```

**Output:**

```text
ERROR:  insert or update on table "orders" violates foreign key constraint "orders_customer_id_fkey"
DETAIL:  Key (customer_id)=(7) is not present in table "customers".
```

Correct — insert the parent first, in one transaction:

```sql
BEGIN;
INSERT INTO customers VALUES (7, 'Gautam', 'Kochi', 'gautam@mail.com');
INSERT INTO orders VALUES (109, 7, '2026-04-01', 'PLACED');
COMMIT;
SELECT o.order_id, c.name FROM orders o JOIN customers c USING (customer_id) WHERE o.order_id = 109;
```

**Output:**

```text
 order_id |  name
----------+--------
      109 | Gautam
(1 row)
```

**Explanation:** The `DETAIL` line names the missing key. Fixes: insert parents before children; if the order of a bulk load cannot be controlled, declare the constraint `DEFERRABLE INITIALLY DEFERRED` so it is checked at commit. Never drop the constraint to make a load pass.

**Interview takeaway:** "`23503` means the referenced row does not exist (or is still referenced, on delete) — fix the order or the data, not the constraint."

### D5. Unique constraint violation (and the out-of-sync sequence)

**Problem:** After a data migration, every new insert fails with a duplicate primary key, although the application never supplies ids.

**Why it happens:** Rows were inserted with explicit ids, so the sequence behind the `serial` column is still at 1 and hands out ids that already exist.

```sql
CREATE TABLE tickets (id serial PRIMARY KEY, title text NOT NULL);
INSERT INTO tickets (id, title) VALUES (1, 'migrated A'), (2, 'migrated B'), (3, 'migrated C');
```

Incorrect (the normal application insert now fails):

```sql
INSERT INTO tickets (title) VALUES ('new ticket');
```

**Output:**

```text
ERROR:  duplicate key value violates unique constraint "tickets_pkey"
DETAIL:  Key (id)=(1) already exists.
```

Correct — move the sequence past the existing ids:

```sql
SELECT setval(pg_get_serial_sequence('tickets', 'id'), (SELECT max(id) FROM tickets));
INSERT INTO tickets (title) VALUES ('new ticket') RETURNING id, title;
```

**Output:**

```text
 setval
--------
      3
(1 row)

 id |   title
----+------------
  4 | new ticket
(1 row)
```

**Explanation:** The failed attempt already consumed value 1, so `setval` is required, not just retrying. For genuine duplicate business values (an email registered twice), handle the error (`23505`) or use `INSERT … ON CONFLICT`. With `GENERATED ALWAYS AS IDENTITY`, explicit ids are rejected unless `OVERRIDING SYSTEM VALUE` is used, which makes this mistake harder to make.

**Interview takeaway:** "After loading explicit ids, reset the sequence with `setval`; read the `DETAIL` key to tell duplicates from sequence problems."

### D6. Deadlock

**Problem:** Two concurrent transfers occasionally fail with `deadlock detected`.

**Why it happens:** Transaction A locks account 1 then account 2; transaction B locks account 2 then account 1. Each waits for the other.

```text
Time  Session A                                     Session B
----  --------------------------------------------  --------------------------------------------
t1    BEGIN;                                        BEGIN;
t2    UPDATE accounts SET balance = balance - 100
      WHERE account_id = 1;   -- locks row 1
t3                                                  UPDATE accounts SET balance = balance - 50
                                                    WHERE account_id = 2;   -- locks row 2
t4    UPDATE accounts SET balance = balance + 100
      WHERE account_id = 2;   -- waits for B
t5                                                  UPDATE accounts SET balance = balance + 50
                                                    WHERE account_id = 1;   -- waits for A
t6                                                  ERROR:  deadlock detected
                                                    (B is rolled back; A continues)
```

Correct — lock rows in a consistent order (for example, ascending id) before changing them:

```sql
BEGIN;
SELECT account_id FROM accounts WHERE account_id IN (2, 1) ORDER BY account_id FOR UPDATE;
UPDATE accounts SET balance = balance - 100 WHERE account_id = 1;
UPDATE accounts SET balance = balance + 100 WHERE account_id = 2;
COMMIT;
SELECT account_id, balance FROM accounts WHERE account_id IN (1, 2) ORDER BY account_id;
```

**Output:**

```text
 account_id
------------
          1
          2
(2 rows)

 account_id | balance
------------+---------
          1 | 9900.00
          2 | 5100.00
(2 rows)
```

**Explanation:** PostgreSQL detects the cycle after `deadlock_timeout` and aborts one transaction (SQLSTATE `40P01`). With every transaction locking rows in the same order, a cycle cannot form. Keep transactions short, and still retry the rare deadlock in application code. The server log records both statements involved.

**Interview takeaway:** "Deadlocks come from opposite lock order; lock in a consistent order and retry the victim."

### D7. Transaction not committed

**Problem:** A developer inserts a row in psql, sees it, and then the application cannot find it. Later, other sessions hang on updates to that table.

**Why it happens:** The session started a transaction (`BEGIN`, or autocommit off in a client or in JDBC) and never committed. Its changes are invisible to everyone else and are rolled back when the session ends, and its row locks block other writers meanwhile.

Incorrect — this session ends without `COMMIT`:

```sql
BEGIN;
INSERT INTO accounts VALUES (4, 'Karan', 2500.00);
SELECT count(*) AS accounts_seen_inside FROM accounts;
```

**Output:**

```text
 accounts_seen_inside
----------------------
                    4
(1 row)
```

A new session afterwards:

```sql
SELECT count(*) AS accounts_after_session_ended FROM accounts;
```

**Output:**

```text
 accounts_after_session_ended
------------------------------
                            3
(1 row)
```

Correct:

```sql
BEGIN;
INSERT INTO accounts VALUES (4, 'Karan', 2500.00);
COMMIT;
SELECT count(*) AS accounts_after_commit FROM accounts;
```

**Output:**

```text
 accounts_after_commit
-----------------------
                     4
(1 row)
```

Finding sessions stuck in an open transaction:

```sql
-- Illustrative
SELECT pid, usename, state, now() - xact_start AS open_for, left(query, 60) AS last_query
FROM pg_stat_activity
WHERE state = 'idle in transaction'
ORDER BY xact_start;
```

**Explanation:** Inside its own transaction a session sees its uncommitted row (4 accounts); nobody else does, and when the session ends the work is rolled back (3 accounts). In applications, a missing `commit()` with `setAutoCommit(false)`, or an exception path that neither commits nor rolls back, causes the same thing. Guard with `idle_in_transaction_session_timeout`.

**Interview takeaway:** "Uncommitted work is invisible to others and holds locks — always end transactions, and watch for 'idle in transaction'."

## Comparison

| Symptom | Where to look | Typical fix |
|---------|---------------|-------------|
| Never finishes | `pg_stat_activity`, plan, recursion | Termination condition, cycle guard, index |
| Slow | `pg_stat_statements`, `EXPLAIN (ANALYZE, BUFFERS)` | Index, rewrite, statistics |
| Waiting | `pg_stat_activity.wait_event`, `pg_blocking_pids` | Commit/rollback the blocker; shorter transactions |
| `23503` / `23505` | `DETAIL` line | Insert order, upsert, `setval` |
| `40P01` / `40001` | Server log | Consistent lock order; retry |

## Common Mistakes

- Reading only the first line of an error and ignoring `DETAIL`.
- "Fixing" a slow query by adding indexes on every column instead of reading the plan.
- Dropping or disabling constraints to get a data load through.
- Retrying a deadlocked statement instead of the whole transaction.
- Leaving psql or GUI sessions open inside a transaction.

## Revision

- Recursion: termination + `CYCLE`; `statement_timeout` as a guard.
- Unused index: functions/casts on the column → expression index or range rewrite.
- Index foreign-key columns.
- `23503`: parent first or deferrable constraint; `23505`: upsert or `setval` after explicit-id loads.
- Deadlock: consistent lock order + retry; open transactions: commit, watch `idle in transaction`.

## Quick Revision

Read the SQLSTATE and `DETAIL`, measure with `EXPLAIN (ANALYZE, BUFFERS)` and `pg_stat_activity`, then fix the cause: termination conditions, sargable filters, missing indexes, insert order, sequences, lock order and short committed transactions.
