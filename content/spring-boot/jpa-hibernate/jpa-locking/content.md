# Optimistic and Pessimistic Locking

**Module:** Spring Data JPA and Hibernate · **Interview priority:** Core

## Definition

Locking prevents **lost updates** when concurrent transactions modify the same data.

- **Optimistic locking** assumes conflicts are rare. Each row carries a **version** (`@Version`); an UPDATE succeeds only if the version is unchanged since the row was read (`… WHERE id = ? AND version = ?`). If another transaction changed it first, zero rows are updated and JPA throws `OptimisticLockException` (Spring: `ObjectOptimisticLockingFailureException`). No database locks are held while the code works.
- **Pessimistic locking** assumes conflicts are likely. The row is **locked in the database** when read (`SELECT … FOR UPDATE`), so other writers wait until the lock holder commits.

## Why It Matters

- Concurrent stock updates, seat booking, wallet balances and "two admins edit the same product" are classic interview scenarios.
- Without locking, the **lost update** happens silently:

```text
T1: read stock = 10            T2: read stock = 10
T1: stock = 10 - 2 = 8         T2: stock = 10 - 3 = 7
T1: UPDATE stock = 8; COMMIT   T2: UPDATE stock = 7; COMMIT     ← T1's sale is lost (should be 5)
```

Default isolation levels (READ COMMITTED) do **not** prevent this read-modify-write race.

## Optimistic Locking

```java
@Version
private long version;          // or Long/Integer/Instant; managed by Hibernate — never set it yourself
```

- Every update increments the version and adds `AND version = ?` to the WHERE clause.
- On conflict: `jakarta.persistence.OptimisticLockException` → translated by Spring to `ObjectOptimisticLockingFailureException` (an `OptimisticLockingFailureException`, a `DataAccessException`).
- Handling: **retry** the whole transaction (re-read and re-apply, e.g. with `@Retryable` around the transactional method) for automatic operations, or return **409 Conflict** so a user can reload (expose the version as a field or `ETag` and check it on update).
- Works across requests: the client sends back the version it read; a stale version fails instead of overwriting someone else's edit.
- No locks and no deadlocks; scales well under low contention. Under high contention, many retries.

## Pessimistic Locking

```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select p from Product p where p.id = :id")
Optional<Product> findForUpdate(Long id);
```

| Lock mode | SQL (typical) | Effect |
|-----------|---------------|--------|
| `PESSIMISTIC_READ` | `FOR SHARE` (PostgreSQL) | Others can read-lock, not write |
| `PESSIMISTIC_WRITE` | `FOR UPDATE` | Others wait to lock or update the row |
| `PESSIMISTIC_FORCE_INCREMENT` | `FOR UPDATE` + version increment | Also bumps `@Version` |

- Must run **inside a transaction**; the lock is released at commit/rollback — keep such transactions short.
- Set a lock timeout (`@QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))`) so callers fail instead of waiting forever (`PessimisticLockingFailureException`/`CannotAcquireLockException`).
- **Deadlocks** happen when transactions lock rows in different orders — lock in a consistent order (e.g. by id).
- For work queues, native `FOR UPDATE SKIP LOCKED` lets workers take different rows without waiting.

## Atomic Updates

For counters and stock, one conditional UPDATE is often the simplest correct solution — the database applies it atomically:

```sql
update product set stock = stock - :qty where id = :id and stock >= :qty     -- 1 row = success, 0 = not enough
```

No read-modify-write in Java, no lock held across application code, no retries.

## How It Works

The program shows a real optimistic-lock conflict (buyer B commits between buyer A's read and write), the SQL produced by `PESSIMISTIC_WRITE`, and an atomic conditional update.

```java
package com.example.demo;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.LockModeType;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.util.Optional;
import org.hibernate.resource.jdbc.spi.StatementInspector;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootApplication
@EnableJpaRepositories(considerNestedRepositories = true)
public class LockingDemo {

    @Entity(name = "Product")
    @Table(name = "product")
    public static class Product {
        @Id
        private Long id;
        private int stock;

        @Version                                   // optimistic locking
        private long version;

        protected Product() {
        }

        Product(Long id, int stock) {
            this.id = id;
            this.stock = stock;
        }

        int getStock() {
            return stock;
        }

        long getVersion() {
            return version;
        }

        void removeStock(int quantity) {
            if (stock < quantity) {
                throw new IllegalStateException("insufficient stock");
            }
            stock -= quantity;
        }
    }

    public interface ProductRepository extends JpaRepository<Product, Long> {

        @Lock(LockModeType.PESSIMISTIC_WRITE)      // SELECT ... FOR UPDATE
        @Query("select p from Product p where p.id = :id")
        Optional<Product> findForUpdate(Long id);

        @Modifying
        @Query("update Product p set p.stock = p.stock - :qty, p.version = p.version + 1 "
                + "where p.id = :id and p.stock >= :qty")
        int decrementIfAvailable(Long id, int qty); // atomic: 1 = success, 0 = not enough stock
    }

    public static class SqlPrinter implements StatementInspector {
        static volatile boolean enabled;

        @Override
        public String inspect(String sql) {
            if (enabled) {
                System.out.println("    SQL> " + sql);
            }
            return sql;
        }
    }

    public static void main(String[] args) {
        try (ConfigurableApplicationContext context = new SpringApplicationBuilder(LockingDemo.class)
                .web(WebApplicationType.NONE)
                .properties("spring.main.banner-mode=off", "logging.level.root=error",
                        "spring.datasource.url=jdbc:h2:mem:locking",
                        "spring.jpa.hibernate.ddl-auto=create-drop",
                        "spring.jpa.properties.hibernate.session_factory.statement_inspector="
                                + SqlPrinter.class.getName())
                .run(args)) {
            ProductRepository products = context.getBean(ProductRepository.class);
            PlatformTransactionManager txManager = context.getBean(PlatformTransactionManager.class);
            TransactionTemplate tx = new TransactionTemplate(txManager);
            TransactionTemplate newTx = new TransactionTemplate(txManager);
            newTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

            products.save(new Product(1L, 10));

            System.out.println("1. Optimistic locking: two buyers read version 0 of the same product");
            try {
                tx.executeWithoutResult(status -> {
                    Product buyerA = products.findById(1L).orElseThrow();       // version 0
                    newTx.executeWithoutResult(inner -> {                       // buyer B commits first
                        Product buyerB = products.findById(1L).orElseThrow();
                        buyerB.removeStock(3);
                    });
                    buyerA.removeStock(2);                                     // stale: still version 0
                });
            } catch (ObjectOptimisticLockingFailureException e) {
                System.out.println("  buyer A failed: " + e.getClass().getSimpleName());
            }
            Product after = products.findById(1L).orElseThrow();
            System.out.println("  stock = " + after.getStock() + ", version = " + after.getVersion());

            System.out.println("2. Pessimistic locking SQL");
            SqlPrinter.enabled = true;
            tx.executeWithoutResult(status -> products.findForUpdate(1L).orElseThrow().removeStock(1));
            SqlPrinter.enabled = false;

            System.out.println("3. Atomic conditional update");
            int ok = tx.execute(status -> products.decrementIfAvailable(1L, 4));
            int tooMany = tx.execute(status -> products.decrementIfAvailable(1L, 100));
            System.out.println("  take 4 -> rows updated = " + ok + "; take 100 -> rows updated = " + tooMany);
            System.out.println("  final stock = " + products.findById(1L).orElseThrow().getStock());
        }
    }
}
```

**Output:**

```text
1. Optimistic locking: two buyers read version 0 of the same product
  buyer A failed: ObjectOptimisticLockingFailureException
  stock = 7, version = 1
2. Pessimistic locking SQL
    SQL> select p1_0.id,p1_0.stock,p1_0.version from product p1_0 where p1_0.id=? for update
    SQL> update product set stock=?,version=? where id=? and version=?
3. Atomic conditional update
  take 4 -> rows updated = 1; take 100 -> rows updated = 0
  final stock = 2
```

Buyer B's sale (3) was committed; buyer A's stale update (still version 0) failed instead of silently overwriting it, so the stock is 7, not 8. The pessimistic read added `for update`; the atomic update refused to take 100 units.

## Comparison: Optimistic vs Pessimistic Locking

| Aspect | Optimistic | Pessimistic |
|--------|------------|-------------|
| Assumption | Conflicts are rare | Conflicts are likely |
| Mechanism | `@Version` column checked on UPDATE | Database row lock (`SELECT … FOR UPDATE`) |
| Conflict detected | At flush/commit → exception | Up front — others wait |
| Locks held | None | Until commit |
| Deadlocks | No | Possible |
| Spans user think-time / several requests | Yes (send the version back) | No (never hold DB locks across requests) |
| Throughput, low contention | High | Lower (blocking) |
| High contention | Many failures and retries | Serialised, predictable |
| Typical use | Editing forms, most entities, REST updates with ETags | Hot rows: seat booking, wallet debit, flash-sale inventory |

## Concurrent Stock Updates: Choosing

1. **Atomic conditional UPDATE** — simplest and fastest for decrementing counters.
2. **Optimistic locking + retry** — when the update involves entity logic and conflicts are rare.
3. **Pessimistic lock** — when conflicts are frequent and retries would be wasteful; keep the transaction short.
4. Plus a **database constraint** (`CHECK (stock >= 0)`) as the last line of defence.

## Internal Behavior

- Hibernate checks the update count of the versioned UPDATE; 0 rows → `StaleObjectStateException`/`OptimisticLockException`, and the transaction is marked rollback-only.
- Bulk JPQL updates do not increment `@Version` unless the query does it (as in the demo).
- Lock modes are translated per dialect: PostgreSQL `FOR UPDATE`/`FOR SHARE`/`NOWAIT`/`SKIP LOCKED`, Oracle `FOR UPDATE WAIT n`, and so on.

## Common Mistakes

- Copying a client-supplied version into a managed entity incorrectly (or resetting it to 0) — compare it explicitly, or let Hibernate manage it.
- Catching `ObjectOptimisticLockingFailureException` inside the same transaction and continuing — the transaction is already rollback-only. Retry from outside.
- Pessimistic locks without timeouts, or held during remote calls (payment gateway) — connection pool exhaustion.
- Relying on `synchronized` in Java — useless with several application instances.
- Checking stock in Java and updating later without any lock or condition.

## Common Interview Traps

- **"`@Transactional` prevents concurrent updates."** Transactions with READ COMMITTED do not prevent lost updates; you need versioning, locks or atomic statements.
- **"Optimistic locking locks the row."** It locks nothing; it detects conflicts.
- **"SERIALIZABLE isolation is the standard fix."** It works but causes serialization failures and lower throughput; targeted locking is usually better.

## Key Takeaways

- Lost updates are prevented by `@Version` (optimistic), `FOR UPDATE` (pessimistic) or atomic conditional UPDATEs.
- Optimistic: no locks, detect at commit, retry or 409. Pessimistic: lock early, short transactions, timeouts, consistent lock order.
- Synchronising in Java does not work across instances; the database must enforce correctness.
