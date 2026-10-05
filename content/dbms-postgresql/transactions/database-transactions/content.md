# Transactions and ACID

**Module:** Transactions · **Interview priority:** Core

## What Is It?

A **transaction** is a sequence of operations that the database treats as **one unit**: either all of its changes become permanent (**commit**) or none of them do (**rollback**).

```sql
-- Illustrative: a money transfer must not half-happen
BEGIN;
UPDATE accounts SET balance = balance - 3000 WHERE account_id = 1;
UPDATE accounts SET balance = balance + 3000 WHERE account_id = 2;
COMMIT;
```

The guarantees a transaction provides are summarised as **ACID**: Atomicity, Consistency, Isolation, Durability.

## Why It Matters

- Every backend operation that changes more than one row — placing an order, transferring money, registering a user with a profile — must be a transaction, or a crash or error halfway leaves corrupt data.
- "Explain ACID" is one of the most asked DBMS interview questions; strong answers say **how** PostgreSQL implements each property.
- Java backends control transactions through JDBC (`setAutoCommit(false)`, `commit()`, `rollback()`) or Spring's `@Transactional` ([Spring Boot: Transactions and ACID](../../../spring-boot/transactions/transactions-and-acid/content.md)).

## Core Concept

### ACID and how PostgreSQL provides it

| Property | Meaning | PostgreSQL mechanism |
|----------|---------|----------------------|
| **Atomicity** | All or nothing | Every row version records the transaction that wrote it; if that transaction aborts, its versions are simply never visible ([MVCC](../../concurrency-and-mvcc/postgresql-mvcc/content.md)). No undo needed |
| **Consistency** | A transaction takes the database from one valid state to another | Constraints (`NOT NULL`, `CHECK`, `UNIQUE`, `FOREIGN KEY`, exclusion), checked per statement or (deferred) at commit; plus correct application logic |
| **Isolation** | Concurrent transactions do not see each other's partial work | MVCC snapshots and locks; strength set by the isolation level ([Isolation Levels](../postgresql-isolation-levels/content.md)) |
| **Durability** | Once committed, changes survive crashes | Write-ahead log (WAL) flushed to disk at commit (`synchronous_commit = on`); replayed after a crash |

Consistency is partly the application's responsibility: the database enforces declared constraints; business rules that are not declared are only as safe as the code.

### Transaction states

```text
            ┌────────────── error ───────────────┐
            │                                     ▼
BEGIN → ACTIVE ──last statement──▶ PARTIALLY ──▶ COMMITTED
            │                      COMMITTED
            │                         │ commit fails
            ▼                         ▼
          FAILED ──────────────▶ ABORTED (rolled back)
```

In PostgreSQL, once a statement inside an explicit transaction fails, the transaction is **failed**: every further command is rejected with *current transaction is aborted, commands ignored until end of transaction block* until `ROLLBACK` (or `ROLLBACK TO SAVEPOINT`). A `COMMIT` of a failed transaction performs a rollback.

### Commands

| Command | Effect |
|---------|--------|
| `BEGIN` / `START TRANSACTION` | Start an explicit transaction (optionally with an isolation level) |
| `COMMIT` / `END` | Make changes permanent and visible to others |
| `ROLLBACK` | Discard all changes of the transaction |
| `SAVEPOINT name` | Mark a point inside the transaction |
| `ROLLBACK TO SAVEPOINT name` | Undo changes after the savepoint; the transaction stays active |
| `RELEASE SAVEPOINT name` | Forget the savepoint (keeps its changes) |
| `SET CONSTRAINTS … DEFERRED` | Check deferrable constraints at commit instead of per statement |

### Autocommit

Without `BEGIN`, PostgreSQL runs **each statement in its own transaction** (autocommit). A single statement is always atomic: an `UPDATE` of 1,000 rows that fails on row 999 changes nothing. JDBC connections start in autocommit mode; `connection.setAutoCommit(false)` begins grouping statements until `commit()` or `rollback()`.

### Savepoints

Savepoints allow partial rollback inside a transaction — for example, try an optional step and continue without it if it fails. Drivers (and ORMs) use them to implement "nested" transactions. Each savepoint has a cost; thousands in one transaction slow things down.

### Transactional DDL

PostgreSQL can roll back `CREATE TABLE`, `ALTER TABLE`, `DROP` and most other DDL, so schema migrations can run in one transaction ([SQL Command Categories](../../sql-fundamentals/sql-command-categories/content.md)). Exceptions include `CREATE INDEX CONCURRENTLY`, `VACUUM` and `CREATE DATABASE`, which refuse to run inside a transaction block.

### Keep transactions short

A long-running or **idle-in-transaction** session:

- holds its locks, blocking other writers (and DDL);
- keeps an old snapshot alive, so `VACUUM` cannot remove dead row versions (table bloat);
- increases the chance of conflicts and deadlocks.

Do not wait for user input or call slow external services inside a transaction. `idle_in_transaction_session_timeout` can terminate forgotten sessions.

### Distributed transactions (awareness)

`PREPARE TRANSACTION` / `COMMIT PREPARED` implement **two-phase commit** for coordinating several databases (an external transaction manager is required; `max_prepared_transactions` must be > 0). Microservice architectures usually avoid 2PC in favour of patterns such as the transactional outbox and sagas.

## Syntax

```sql
-- Illustrative
BEGIN [ISOLATION LEVEL {READ COMMITTED | REPEATABLE READ | SERIALIZABLE}] [READ ONLY];
  …
  SAVEPOINT sp;
  …
  ROLLBACK TO SAVEPOINT sp;
  RELEASE SAVEPOINT sp;
COMMIT;   -- or ROLLBACK;
```

## Examples

### Commit: a successful transfer

```sql
BEGIN;
UPDATE accounts SET balance = balance - 3000 WHERE account_id = 1;
UPDATE accounts SET balance = balance + 3000 WHERE account_id = 2;
COMMIT;

SELECT account_id, holder, balance FROM accounts ORDER BY account_id;
```

**Output:**

```text
 account_id | holder | balance
------------+--------+---------
          1 | Asha   | 7000.00
          2 | Ravi   | 8000.00
          3 | Meena  |    0.00
(3 rows)
```

### Rollback on a constraint violation

Meena (balance 0) tries to send 1000 to Asha. The credit runs first; the debit then violates `CHECK (balance >= 0)`:

```sql
BEGIN;
UPDATE accounts SET balance = balance + 1000 WHERE account_id = 1;
UPDATE accounts SET balance = balance - 1000 WHERE account_id = 3;
UPDATE accounts SET balance = balance + 0 WHERE account_id = 2;
COMMIT;

SELECT account_id, holder, balance FROM accounts ORDER BY account_id;
```

**Output:**

```text
ERROR:  new row for relation "accounts" violates check constraint "accounts_balance_check"
DETAIL:  Failing row contains (3, Meena, -1000.00).
ERROR:  current transaction is aborted, commands ignored until end of transaction block
 account_id | holder | balance
------------+--------+---------
          1 | Asha   | 7000.00
          2 | Ravi   | 8000.00
          3 | Meena  |    0.00
(3 rows)
```

The credit to Asha happened first, but after the failure every later command was rejected and `COMMIT` rolled the whole transaction back: Asha did not receive money that was never debited.

### Statement-level atomicity

```sql
UPDATE accounts SET balance = balance - 6000;
SELECT account_id, balance FROM accounts ORDER BY account_id;
```

**Output:**

```text
ERROR:  new row for relation "accounts" violates check constraint "accounts_balance_check"
DETAIL:  Failing row contains (3, Meena, -6000.00).
 account_id | balance
------------+---------
          1 | 7000.00
          2 | 8000.00
          3 |    0.00
(3 rows)
```

Meena's row would go negative, so the whole `UPDATE` fails — including Asha's and Ravi's rows, which would have been fine on their own.

### Savepoints

```sql
BEGIN;
INSERT INTO accounts VALUES (4, 'Karan', 2000);
SAVEPOINT before_bonus;
UPDATE accounts SET balance = balance - 500 WHERE account_id = 3;   -- fails: Meena has 0
ROLLBACK TO SAVEPOINT before_bonus;
UPDATE accounts SET balance = balance + 500 WHERE account_id = 4;
COMMIT;

SELECT account_id, holder, balance FROM accounts ORDER BY account_id;
```

**Output:**

```text
ERROR:  new row for relation "accounts" violates check constraint "accounts_balance_check"
DETAIL:  Failing row contains (3, Meena, -500.00).
 account_id | holder | balance
------------+--------+---------
          1 | Asha   | 7000.00
          2 | Ravi   | 8000.00
          3 | Meena  |    0.00
          4 | Karan  | 2500.00
(4 rows)
```

Rolling back to the savepoint undid only the failed step; Karan's insert and bonus were committed.

### Transactional DDL

```sql
BEGIN;
CREATE TABLE audit_log (id int, note text);
ALTER TABLE accounts ADD COLUMN branch text;
ROLLBACK;

SELECT to_regclass('audit_log') AS audit_table,
       (SELECT count(*) FROM information_schema.columns
        WHERE table_name = 'accounts' AND column_name = 'branch') AS branch_column;
```

**Output:**

```text
 audit_table | branch_column
-------------+---------------
 NULL        |             0
(1 row)
```

Both schema changes were undone.

### Deferred constraints

Two rows that reference each other cannot be inserted one at a time with immediate foreign-key checks. A `DEFERRABLE` constraint checked at `COMMIT` solves it:

```sql
CREATE TABLE people (
    person_id int PRIMARY KEY,
    name      text NOT NULL,
    partner   int REFERENCES people DEFERRABLE INITIALLY IMMEDIATE
);

BEGIN;
SET CONSTRAINTS ALL DEFERRED;
INSERT INTO people VALUES (1, 'Asha', 2);   -- 2 does not exist yet
INSERT INTO people VALUES (2, 'Ravi', 1);
COMMIT;

SELECT * FROM people ORDER BY person_id;
```

**Output:**

```text
 person_id | name | partner
-----------+------+---------
         1 | Asha |       2
         2 | Ravi |       1
(2 rows)
```

Without `SET CONSTRAINTS ALL DEFERRED`, the first insert fails immediately.

### Transactions from Java (JDBC)

```java
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class TransferDemo {

    // Connection settings come from environment variables so no password is written in code.
    static final String URL = System.getenv().getOrDefault("STUDYHUB_DB_URL", "jdbc:postgresql://localhost:5432/studyhub");
    static final String USER = System.getenv().getOrDefault("STUDYHUB_DB_USER", "postgres");
    static final String PASSWORD = System.getenv().getOrDefault("STUDYHUB_DB_PASSWORD", "");

    public static void main(String[] args) throws SQLException {
        try (Connection conn = DriverManager.getConnection(URL, USER, PASSWORD)) {
            transfer(conn, 1, 2, new BigDecimal("3000.00"));   // succeeds
            transfer(conn, 3, 1, new BigDecimal("1000.00"));   // Meena has 0: CHECK fails
            printBalances(conn);
        }
    }

    static void transfer(Connection conn, int from, int to, BigDecimal amount) throws SQLException {
        String sql = "UPDATE accounts SET balance = balance + ? WHERE account_id = ?";
        conn.setAutoCommit(false);                       // start grouping statements
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setBigDecimal(1, amount);                 // credit first, debit second:
            ps.setInt(2, to);                            // shows that rollback undoes both
            ps.executeUpdate();
            ps.setBigDecimal(1, amount.negate());
            ps.setInt(2, from);
            ps.executeUpdate();
            conn.commit();
            System.out.println("Transferred " + amount + " from " + from + " to " + to);
        } catch (SQLException e) {
            conn.rollback();                             // undo the credit as well
            System.out.println("Rolled back transfer from " + from + ": " + e.getSQLState());
        } finally {
            conn.setAutoCommit(true);
        }
    }

    static void printBalances(Connection conn) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT account_id, holder, balance FROM accounts ORDER BY account_id");
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                System.out.println(rs.getInt("account_id") + " " + rs.getString("holder") + " " + rs.getBigDecimal("balance"));
            }
        }
    }
}
```

Run against the sample database with the PostgreSQL JDBC driver on the classpath (`java -cp postgresql-42.x.jar TransferDemo.java`).

**Output:**

```text
Transferred 3000.00 from 1 to 2
Rolled back transfer from 3: 23514
1 Asha 7000.00
2 Ravi 8000.00
3 Meena 0.00
```

SQLState `23514` is *check_violation*. Spring's `@Transactional` wraps exactly this commit/rollback pattern around a method.

## Comparison

### Autocommit vs explicit transaction

| | Autocommit | Explicit (`BEGIN … COMMIT`) |
|---|---|---|
| Unit of atomicity | One statement | All statements in the block |
| After an error | Next statement runs normally | All further statements rejected until `ROLLBACK` |
| Visibility to others | After each statement | Only at `COMMIT` |
| Use for | Single-statement changes, ad-hoc queries | Multi-step business operations |

## Common Mistakes

- Running related changes in autocommit mode, so a failure leaves half of them applied.
- Catching an error inside a transaction and continuing without `ROLLBACK`/`ROLLBACK TO SAVEPOINT` (every following statement fails).
- Forgetting to reset `setAutoCommit(true)` or to roll back before returning a pooled JDBC connection.
- Long transactions that wait for users or remote calls (locks, bloat).
- Assuming "consistency" means the database knows all business rules — only declared constraints are enforced.
- Expecting `CREATE INDEX CONCURRENTLY` or `VACUUM` to work inside `BEGIN`.

## Revision

- Transaction = all-or-nothing unit; `BEGIN`, `COMMIT`, `ROLLBACK`, savepoints.
- ACID in PostgreSQL: atomicity via MVCC transaction status, consistency via constraints, isolation via snapshots/locks, durability via WAL flush at commit.
- Autocommit: each statement is its own transaction; a statement is always atomic.
- An error inside a transaction block aborts it until `ROLLBACK` (or rollback to a savepoint).
- DDL is transactional; deferred constraints are checked at commit.
- Keep transactions short; JDBC: `setAutoCommit(false)` → `commit()`/`rollback()`.

## Quick Revision

A transaction is all-or-nothing: PostgreSQL gets atomicity from MVCC, consistency from constraints, isolation from snapshots and locks, and durability from the WAL. An error aborts the whole block until ROLLBACK, savepoints allow partial undo, and transactions should stay short.
