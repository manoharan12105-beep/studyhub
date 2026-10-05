# Transactions and ACID — Practice

### P1. Which ACID property?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** ACID

A power failure happens one second after the database reported "COMMIT successful". After restart the change is still there. Which property is this?

- A) Atomicity
- B) Consistency
- C) Isolation
- D) Durability

<details>
<summary>Answer</summary>

**Answer:** D) Durability

**Explanation:** Committed changes survive crashes — PostgreSQL flushed the WAL before reporting the commit and replays it on restart.

</details>

### P2. Predict the balances

**Difficulty:** Easy · **Type:** Output · **Concepts:** rollback, aborted transaction

What are the balances after this script (starting from the sample `accounts`: 10000, 5000, 0)?

```sql
BEGIN;
UPDATE accounts SET balance = balance - 2000 WHERE account_id = 1;
UPDATE accounts SET balance = balance + 2000 WHERE account_id = 2;
SELECT 1 / 0;
UPDATE accounts SET balance = balance + 100 WHERE account_id = 3;
COMMIT;
SELECT account_id, balance FROM accounts ORDER BY account_id;
```

<details>
<summary>Answer</summary>

**Output:**

```text
ERROR:  division by zero
ERROR:  current transaction is aborted, commands ignored until end of transaction block
 account_id | balance
------------+----------
          1 | 10000.00
          2 |  5000.00
          3 |     0.00
(3 rows)
```

The division by zero aborts the transaction; the next `UPDATE` is ignored and `COMMIT` rolls everything back. The balances are unchanged.

</details>

### P3. Keep what worked

**Difficulty:** Medium · **Type:** Query · **Concepts:** savepoints

In one transaction: give every Engineering employee a raise of 5000, then try to set Nisha's department to 99 (which does not exist). If that step fails, keep the raises. Show Engineering salaries and Nisha's department afterwards.

**Expected output:**

```text
ERROR:  insert or update on table "employees" violates foreign key constraint "employees_dept_id_fkey"
DETAIL:  Key (dept_id)=(99) is not present in table "departments".
 name  | dept_id | salary
-------+---------+--------
 Asha  |      10 | 155000
 Ravi  |      10 | 100000
 Meena |      10 | 100000
 Karan |      10 |  77000
 Nisha |    NULL |  45000
(5 rows)
```

<details>
<summary>Solution</summary>

```sql
BEGIN;
UPDATE employees SET salary = salary + 5000 WHERE dept_id = 10;
SAVEPOINT move_nisha;
UPDATE employees SET dept_id = 99 WHERE name = 'Nisha';
ROLLBACK TO SAVEPOINT move_nisha;
COMMIT;

SELECT name, dept_id, salary FROM employees
WHERE dept_id = 10 OR name = 'Nisha'
ORDER BY emp_id;
```

**Explanation:** The foreign-key violation aborts the work after the savepoint only; `ROLLBACK TO SAVEPOINT` returns the transaction to a usable state and the raises are committed. (Run interactively, the failing `UPDATE` also prints its error.)

</details>

### P4. Swap two unique values

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** deferrable constraints

Ranks must be unique. Swapping two ranks fails:

**Schema and data:**

```sql
CREATE TABLE leaderboard (player text PRIMARY KEY, rank int UNIQUE);
INSERT INTO leaderboard VALUES ('anil', 1), ('bhavna', 2);
```

```sql
UPDATE leaderboard SET rank = CASE player WHEN 'anil' THEN 2 ELSE 1 END;
```

**Output:**

```text
ERROR:  duplicate key value violates unique constraint "leaderboard_rank_key"
DETAIL:  Key (rank)=(2) already exists.
```

Change the design so the swap works.

<details>
<summary>Hint</summary>

The single `UPDATE` changes rows one at a time and an immediate unique check sees a temporary duplicate.

</details>

<details>
<summary>Answer</summary>

A non-deferrable `UNIQUE` constraint is checked as each row is updated, and after the first row both players briefly have rank 2. Make the constraint deferrable so it is checked at the end of the statement (or transaction):

```sql
ALTER TABLE leaderboard DROP CONSTRAINT leaderboard_rank_key;
ALTER TABLE leaderboard ADD CONSTRAINT leaderboard_rank_key UNIQUE (rank) DEFERRABLE INITIALLY IMMEDIATE;

UPDATE leaderboard SET rank = CASE player WHEN 'anil' THEN 2 ELSE 1 END;
SELECT * FROM leaderboard ORDER BY rank;
```

**Output:**

```text
 player | rank
--------+------
 bhavna |    1
 anil   |    2
(2 rows)
```

A `DEFERRABLE INITIALLY IMMEDIATE` unique constraint is checked at the end of each statement rather than per row, which is enough for a single-statement swap; `INITIALLY DEFERRED` (or `SET CONSTRAINTS … DEFERRED`) would postpone it to commit for multi-statement swaps.

</details>

### P5. Order and stock in one unit

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** atomicity, application design

An endpoint inserts an order, inserts its lines, decrements stock and calls a payment gateway (2–10 seconds). The developer wraps all four steps in one database transaction. What is wrong, and how would you restructure it?

<details>
<summary>Answer</summary>

The transaction stays open during the slow external call, holding row locks on the stock rows (blocking other buyers of those products) and an old snapshot (blocking vacuum cleanup), and exhausting connection-pool slots under load. The payment call also cannot be rolled back by the database anyway.

Restructure: (1) transaction 1 — insert the order with status `PENDING_PAYMENT`, insert lines, decrement stock (reserve), commit quickly; (2) call the gateway outside any transaction; (3) transaction 2 — mark the order `PAID`, or on failure mark it `PAYMENT_FAILED` and return the stock. Use an idempotency key for the payment request and a scheduled job to release reservations of orders stuck in `PENDING_PAYMENT`.

</details>
