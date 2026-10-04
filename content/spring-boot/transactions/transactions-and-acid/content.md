# Transactions and ACID

**Module:** Transactions · **Interview priority:** Core

## Definition

A **transaction** is a group of database operations that succeed or fail **as one unit**: either all changes are made permanent (**commit**) or none are (**rollback**). Transactions guarantee the **ACID** properties — Atomicity, Consistency, Isolation, Durability.

## Why It Matters

- Business operations span several writes: placing an order inserts the order, its lines, reduces stock and records a payment. A failure halfway must not leave stock reduced for an order that does not exist.
- Spring's `@Transactional` is used in every service layer; knowing what a transaction actually guarantees — and what it does not (concurrency anomalies, remote calls) — separates good backend answers from memorised ones.

## What Is a Transaction?

```text
BEGIN
  INSERT INTO orders ...            -- 1
  INSERT INTO order_items ...       -- 2
  UPDATE product SET stock = ...    -- 3
  INSERT INTO payments ...          -- 4   ← fails (card declined)
ROLLBACK                            -- 1–3 are undone; the database is as before BEGIN
```

Every SQL statement runs in some transaction. Without explicit demarcation, JDBC connections run in **auto-commit** mode: each statement is its own transaction, so steps 1–3 would stay committed after step 4 fails.

## ACID

| Property | Meaning | Who provides it | Example |
|----------|---------|-----------------|---------|
| **Atomicity** | All or nothing | Database (undo log) + rollback | Order and stock change together or not at all |
| **Consistency** | Each transaction moves the database from one valid state to another, respecting constraints | Database constraints + **your** business rules | `stock >= 0`, foreign keys, unique email |
| **Isolation** | Concurrent transactions do not see each other's intermediate state (to a configurable degree) | Database (locks, MVCC), isolation level | A report does not see a half-written order |
| **Durability** | Once committed, changes survive crashes | Database (write-ahead log, fsync) | A confirmed payment is not lost after a power cut |

Isolation is the property with **levels** (READ COMMITTED, REPEATABLE READ, …); the default levels allow some anomalies — see [Isolation Levels](../transaction-isolation/content.md).

## @Transactional

Spring's declarative transaction management: annotate a service method, and Spring begins a transaction before it, commits after it, and rolls back if it throws a `RuntimeException`.

```java
import java.math.BigDecimal;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransferService {
    private final JdbcTemplate jdbc;

    public TransferService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public void transfer(long fromId, long toId, BigDecimal amount) {
        int debited = jdbc.update(
                "update account set balance = balance - ? where id = ? and balance >= ?", amount, fromId, amount);
        if (debited == 0) {
            throw new IllegalStateException("insufficient funds");     // rollback: nothing happened
        }
        jdbc.update("update account set balance = balance + ? where id = ?", amount, toId);
    }                                                                   // commit: both updates together
}
```

Details — proxies, rollback rules, attributes — are in [@Transactional](../transactional-annotation/content.md).

## Transaction Boundaries

A **transaction boundary** is where a transaction starts and ends. In a Spring application:

- Put boundaries on **service methods** — one business use case = one transaction.
- Not on controllers (HTTP concerns, serialisation time) and usually not on repositories alone (Spring Data repository methods already have their own short transactions; several calls without a service transaction are several commits).
- Keep transactions **short**: they hold a database connection and possibly locks. Never wait for user input, sleep, or call slow remote services inside one.

```text
Controller  ──► OrderService.placeOrder()  ← @Transactional: BEGIN
                    productRepository.findById()        (joins)
                    orderRepository.save()              (joins)
                    paymentClient.charge()   ✘ remote call inside a transaction: holds the connection,
                                               and the charge cannot be rolled back
                 ← return: COMMIT
```

## Commit

On a normal return, Spring's transaction manager flushes pending changes (JPA) and commits. After commit, the changes are visible to other transactions and durable. `TransactionSynchronization` callbacks and `@TransactionalEventListener(phase = AFTER_COMMIT)` run after this point — the right place to send emails or publish messages about the change.

## Rollback

On an exception that matches the rollback rules (by default `RuntimeException` and `Error`), Spring rolls back. Rollback undoes **database** changes only — not emails sent, HTTP calls made, files written or in-memory state changed. Such side effects need compensating actions or should happen after commit.

A transaction can also be marked **rollback-only** (`TransactionAspectSupport.currentTransactionStatus().setRollbackOnly()`, or by an inner transactional method failing) — it will roll back even if the method returns normally.

## Realistic Backend Scenario

Placing an order:

1. `@Transactional placeOrder()` begins.
2. Load products, validate prices.
3. Decrement stock atomically (`update … where stock >= ?`); 0 rows → throw `InsufficientStockException` → rollback.
4. Insert order and lines.
5. Commit.
6. **After commit**: publish `OrderPlacedEvent` → send confirmation email, notify the warehouse.

Payment with an external gateway is typically handled **outside** the database transaction (reserve stock → call gateway → confirm or release in separate transactions), using idempotency keys and status fields instead of a single long transaction.

## Common Mistakes

- Several repository calls without a surrounding service transaction — partial commits on failure.
- Calling external services inside transactions.
- Very long transactions (batch jobs processing everything in one transaction).
- Assuming rollback undoes non-database side effects.
- Believing `@Transactional` solves concurrency (it does not prevent lost updates by itself — see [Locking](../../jpa-hibernate/jpa-locking/content.md)).

## Common Interview Traps

- **"Consistency in ACID is guaranteed by the database."** Constraints help, but business invariants are the application's responsibility.
- **"A transaction locks the tables it touches."** Most databases use row-level locks and MVCC; reads usually take no locks at READ COMMITTED.
- **"Rollback undoes everything the method did."** Only transactional resources (the database connection) are rolled back.

## Key Takeaways

- Transaction = all-or-nothing unit of work: BEGIN → work → COMMIT or ROLLBACK.
- ACID: atomicity, consistency, isolation (with levels), durability.
- Boundaries belong on service methods; keep them short and free of remote calls.
- Do side effects after commit.
