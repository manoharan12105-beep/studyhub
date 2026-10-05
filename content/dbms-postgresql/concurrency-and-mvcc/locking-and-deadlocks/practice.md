# Locking and Deadlocks — Practice

### P1. What blocks?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** MVCC and locks

Session A has run `BEGIN; UPDATE accounts SET balance = balance + 1 WHERE account_id = 1;` and not committed. Which statement in session B waits?

- A) `SELECT * FROM accounts WHERE account_id = 1;`
- B) `SELECT count(*) FROM accounts;`
- C) `UPDATE accounts SET balance = 0 WHERE account_id = 1;`
- D) `UPDATE accounts SET balance = 0 WHERE account_id = 2;`

<details>
<summary>Answer</summary>

**Answer:** C)

**Explanation:** Only a writer on the same row waits. Reads (A, B) see the last committed version; D updates a different row.

</details>

### P2. Claim jobs safely

**Difficulty:** Medium · **Type:** Query · **Concepts:** SKIP LOCKED, UPDATE … RETURNING

**Schema and data:**

```sql
CREATE TABLE email_queue (id int PRIMARY KEY, recipient text, status text NOT NULL DEFAULT 'NEW', claimed_by text);
INSERT INTO email_queue (id, recipient) SELECT g, 'user' || g || '@mail.com' FROM generate_series(1, 6) AS g;
```

Write one statement that a worker named `w1` runs to claim up to 3 unclaimed emails (lowest ids first), marking them `SENDING`, safe to run concurrently from many workers. Return the claimed ids.

**Expected output:**

```text
 id |   recipient
----+----------------
  1 | user1@mail.com
  2 | user2@mail.com
  3 | user3@mail.com
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
UPDATE email_queue
SET status = 'SENDING', claimed_by = 'w1'
WHERE id IN (
    SELECT id FROM email_queue
    WHERE status = 'NEW'
    ORDER BY id
    LIMIT 3
    FOR UPDATE SKIP LOCKED
)
RETURNING id, recipient;
```

**Explanation:** The subquery locks up to 3 free rows, skipping rows other workers are claiming at the same moment; the outer `UPDATE` marks them in the same statement. A second worker running it concurrently gets ids 4–6.

</details>

### P3. Reorder to avoid the deadlock

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** lock ordering

A transfer function runs `UPDATE accounts … WHERE account_id = :from` then `… WHERE account_id = :to`. Two simultaneous transfers, 1→2 and 2→1, sometimes deadlock. Rewrite the transfer so concurrent transfers between the same accounts can never deadlock.

<details>
<summary>Answer</summary>

Lock both rows first, always in ascending id order, then apply the changes:

```sql
BEGIN;
SELECT account_id FROM accounts WHERE account_id IN (2, 1) ORDER BY account_id FOR UPDATE;
UPDATE accounts SET balance = balance - 500 WHERE account_id = 2;
UPDATE accounts SET balance = balance + 500 WHERE account_id = 1;
COMMIT;

SELECT account_id, balance FROM accounts ORDER BY account_id;
```

**Output:**

```text
 account_id
------------
          1
          2
(2 rows)

 account_id | balance
------------+----------
          1 | 10500.00
          2 |  4500.00
          3 |     0.00
(3 rows)
```

Both transfers now request row 1 before row 2, so the second simply waits for the first; a cycle cannot form. (Alternatively, update the rows in id order, whichever is debited.)

</details>

### P4. Optimistic update

**Difficulty:** Medium · **Type:** Query · **Concepts:** version column

Add a `version` column to `customers`. Write the update a form would send to change Deepa's city to `Madurai`, given that the form loaded version 1, and show what a second, stale submission (also claiming version 1) returns.

**Expected output:**

```text
 customer_id |  city   | version
-------------+---------+---------
           4 | Madurai |       2
(1 row)

 customer_id | city | version
-------------+------+---------
(0 rows)
```

<details>
<summary>Solution</summary>

```sql
ALTER TABLE customers ADD COLUMN version int NOT NULL DEFAULT 1;

UPDATE customers SET city = 'Madurai', version = version + 1
WHERE customer_id = 4 AND version = 1
RETURNING customer_id, city, version;

UPDATE customers SET city = 'Trichy', version = version + 1
WHERE customer_id = 4 AND version = 1
RETURNING customer_id, city, version;
```

**Explanation:** The second update matches no row because the version is now 2 — the application must tell the user their copy is stale.

</details>

### P5. The frozen migration

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** lock queue, lock_timeout

During a deploy, `ALTER TABLE orders ADD COLUMN gift_note text` hung for 4 minutes and the API returned timeouts for every order page. Nothing else changed. Explain the chain of events and how to deploy safely next time.

<details>
<summary>Answer</summary>

Adding a column needs `ACCESS EXCLUSIVE` (even though, with no default to compute, it finishes instantly once granted). Some session held a lock on `orders` — most likely a long report or an idle-in-transaction connection that had read the table. The `ALTER` waited behind it, and all subsequent queries on `orders` (needing `ACCESS SHARE`) queued behind the waiting `ALTER`, so the API stalled until the old transaction finished.

Next time: `SET lock_timeout = '3s'` before the DDL and retry in a loop until it gets the lock in a quiet moment; find and end long/idle transactions first (`pg_stat_activity` with `state = 'idle in transaction'` or old `xact_start`); set `idle_in_transaction_session_timeout`; and keep migrations to one fast DDL statement per transaction.

</details>
