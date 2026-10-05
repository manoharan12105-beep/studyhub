# Isolation Levels in PostgreSQL — Practice

### P1. Default level

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** PostgreSQL defaults

What is PostgreSQL's default isolation level, and what does `READ UNCOMMITTED` do in PostgreSQL?

- A) READ UNCOMMITTED; it allows dirty reads
- B) READ COMMITTED; READ UNCOMMITTED behaves like READ COMMITTED
- C) REPEATABLE READ; READ UNCOMMITTED is rejected
- D) SERIALIZABLE; READ UNCOMMITTED allows dirty reads

<details>
<summary>Answer</summary>

**Answer:** B)

**Explanation:** The default is READ COMMITTED; READ UNCOMMITTED is accepted but mapped to READ COMMITTED, so dirty reads never happen.

</details>

### P2. Predict the second read

**Difficulty:** Easy · **Type:** Output · **Concepts:** snapshots per statement vs per transaction

Session A runs `BEGIN ISOLATION LEVEL <level>; SELECT balance FROM accounts WHERE account_id = 2;` (5000). Session B then runs `UPDATE accounts SET balance = 5500 WHERE account_id = 2;` (autocommit). Session A runs the same `SELECT` again. What does A see at READ COMMITTED, and at REPEATABLE READ?

<details>
<summary>Answer</summary>

READ COMMITTED: **5500** — the second statement gets a new snapshot that includes B's commit (non-repeatable read). REPEATABLE READ: **5000** — the transaction keeps the snapshot of its first statement.

</details>

### P3. Make the withdrawal safe

**Difficulty:** Medium · **Type:** Query · **Concepts:** atomic conditional update

Write a single statement that withdraws 3000 from account 2 only if the balance is sufficient, and returns the new balance; then run it a second time and observe what happens when the money runs out.

**Expected output:**

```text
 balance
---------
 2000.00
(1 row)

 balance
---------
(0 rows)
```

<details>
<summary>Solution</summary>

```sql
UPDATE accounts SET balance = balance - 3000
WHERE account_id = 2 AND balance >= 3000
RETURNING balance;
UPDATE accounts SET balance = balance - 3000
WHERE account_id = 2 AND balance >= 3000
RETURNING balance;
```

**Explanation:** The first withdrawal leaves 2000; the second matches no row (0 rows returned), which the application reports as "insufficient funds". Under concurrency, a second session's identical statement waits for the first and re-checks `balance >= 3000` against the committed new value, so the account can never be overdrawn — no read-then-write race, at READ COMMITTED.

</details>

### P4. Which level stops it?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** write skew

A meeting-room app checks "no booking overlaps this time slot" with a `SELECT`, then inserts the booking. Two users book overlapping slots at the same moment; both succeed. Which isolation level would prevent this, and what is a better PostgreSQL solution?

<details>
<summary>Answer</summary>

Both transactions read "no overlap" and insert different rows — a write skew (more precisely, a phantom-based one). READ COMMITTED and REPEATABLE READ allow it; SERIALIZABLE detects the read/write dependency and aborts one transaction (which must be retried). The better solution is a declarative constraint: an exclusion constraint `EXCLUDE USING gist (room_id WITH =, slot WITH &&)` on a `tstzrange` column, which rejects overlaps at any isolation level ([Schema Design Case Studies](../../database-design/schema-design-case-studies/content.md)).

</details>

### P5. Diagnose the error

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** serialization failure, retry

A Java service switched its transfer method to `REPEATABLE READ`. Under load, logs show `org.postgresql.util.PSQLException: ERROR: could not serialize access due to concurrent update` (SQLState 40001) and some transfers are lost. What is happening, and what must change?

<details>
<summary>Answer</summary>

At REPEATABLE READ, when two transfers update the same account concurrently, the later one cannot apply its change to a row version newer than its snapshot, so PostgreSQL aborts it with 40001 instead of risking a lost update. The transfers are "lost" because the service treats the exception as a permanent failure. The service must catch SQLState `40001` (and `40P01`), roll back, and retry the whole transaction (re-reading the balances) a bounded number of times. Alternatively, keep READ COMMITTED and make each update atomic (`SET balance = balance - ?` with a `WHERE balance >= ?` guard), which does not need retries.

</details>
