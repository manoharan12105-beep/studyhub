# Dirty Checking, Flush, save() and saveAndFlush()

**Module:** Spring Data JPA and Hibernate · **Interview priority:** Core

## Definition

- **Dirty checking** is Hibernate's automatic detection of changes to **managed** entities: at flush time it compares each entity's current state with the snapshot taken when it was loaded and generates UPDATE statements for the differences — no `save()` call needed.
- **Flush** is the synchronisation of the persistence context with the database: pending INSERT/UPDATE/DELETE statements are sent over the connection **inside** the current transaction. Flush is not commit.
- **`save()`** (Spring Data) makes an entity managed — `persist` for new entities, `merge` otherwise. **`saveAndFlush()`** does the same and immediately flushes.

## Why It Matters

- "Why did my entity update without calling `save()`?" and "save vs saveAndFlush" are classic Spring Data questions.
- Flush timing explains when constraint violations surface, why queries see unsaved changes, and why some `save()` calls cost an extra SELECT.

## JPA Transactions

In Spring, a `@Transactional` service method defines one transaction, and `JpaTransactionManager` binds one `EntityManager` (persistence context) to it:

```text
@Transactional method starts → EntityManager opened, JDBC connection borrowed, BEGIN
    repository calls share the same persistence context
    entities loaded become managed
method returns normally → flush (dirty checking → SQL) → COMMIT → EntityManager closed → entities detached
method throws RuntimeException → ROLLBACK (pending changes discarded) → EntityManager closed
```

Spring Data repository methods are themselves transactional (`SimpleJpaRepository` is annotated `@Transactional(readOnly = true)` with `@Transactional` on write methods). Called outside a service transaction, **each** repository call runs in its own short transaction — so two `save()` calls in a non-transactional method are two separate commits.

## Dirty Checking

1. When an entity is loaded, Hibernate stores a copy of its state (the **snapshot**).
2. At flush, for every managed entity, Hibernate compares current field values with the snapshot.
3. For each changed entity, it schedules an UPDATE (by default of **all** columns; `@DynamicUpdate` limits it to changed columns).

Consequences:

- `repository.save(entity)` on an already-managed entity is **redundant** (harmless — Spring Data still calls `merge`, which is a no-op for managed instances).
- Any accidental modification of a managed entity — e.g. normalising a field for display — **will be written**.
- `@Transactional(readOnly = true)` sets Hibernate's flush mode to MANUAL and the session to read-only, so no dirty checking or flushing happens — faster for queries and prevents accidental writes.

## Flush

Hibernate flushes (in the default `FlushModeType.AUTO`):

| Trigger | Why |
|---------|-----|
| Before transaction commit | Changes must reach the database |
| Before a JPQL/HQL/Criteria query whose tables have pending changes | So the query sees consistent data |
| Before a native SQL query run through the `EntityManager` | Hibernate cannot tell which tables the SQL touches, so it flushes everything pending |
| Explicit `entityManager.flush()` / `saveAndFlush()` | You asked |
| When an `IDENTITY` id is needed at `persist` | The INSERT must run to get the key |

`FlushModeType.COMMIT` flushes only at commit (queries may then see stale data).

Flush order: Hibernate executes INSERTs, then UPDATEs, then collection changes, then DELETEs — not in the order you called the methods. This occasionally surprises people with unique constraints (deleting and re-inserting the same unique value in one flush fails); an explicit `flush()` between operations fixes it.

## save()

`SimpleJpaRepository.save(entity)` does:

```text
if (entityInformation.isNew(entity))   → entityManager.persist(entity); return entity;
else                                    → return entityManager.merge(entity);
```

`isNew` is decided by: a `@Version` attribute of a wrapper type that is `null`; otherwise an id that is `null` (or `0` for primitives); or `Persistable.isNew()` if the entity implements it.

**Trap: assigned identifiers.** If your code sets the id (codes, UUIDs, natural keys), `isNew` is false, so `save` calls `merge`, which **SELECTs** the row first to decide between INSERT and UPDATE — one extra query per save. Fix with a `@Version` field or by implementing `Persistable<ID>`.

Always use the **returned** instance: after `merge`, the argument is not the managed object.

## saveAndFlush()

`save()` followed by `entityManager.flush()`. Use it when you need the SQL to execute **now**, within the transaction:

- to surface constraint violations at a specific point (and translate them into a domain error),
- to obtain database-generated values (triggers, defaults) before continuing,
- before running native SQL or a stored procedure that must see the row.

It does **not** commit. A later rollback still undoes it.

## How It Works

```java
package com.example.demo;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.resource.jdbc.spi.StatementInspector;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@SpringBootApplication
@EnableJpaRepositories(considerNestedRepositories = true)      // repositories are nested in this demo class
public class DirtyCheckingDemo {

    @Entity
    @Table(name = "account")
    public static class Account {
        @Id
        @GeneratedValue(strategy = GenerationType.SEQUENCE)
        private Long id;
        private String owner;
        private int balance;

        protected Account() {
        }

        Account(String owner, int balance) {
            this.owner = owner;
            this.balance = balance;
        }

        Long getId() {
            return id;
        }

        void deposit(int amount) {
            balance += amount;
        }
    }

    @Entity
    @Table(name = "coupon")
    public static class Coupon {
        @Id
        private String code;                          // assigned by the application, not generated
        private int percent;

        protected Coupon() {
        }

        Coupon(String code, int percent) {
            this.code = code;
            this.percent = percent;
        }
    }

    public interface AccountRepository extends JpaRepository<Account, Long> {
    }

    public interface CouponRepository extends JpaRepository<Coupon, String> {
    }

    public static class SqlPrinter implements StatementInspector {
        @Override
        public String inspect(String sql) {
            System.out.println("    SQL> " + sql);
            return sql;
        }
    }

    @Service
    public static class BankService {
        private final AccountRepository accounts;
        private final CouponRepository coupons;

        BankService(AccountRepository accounts, CouponRepository coupons) {
            this.accounts = accounts;
            this.coupons = coupons;
        }

        @Transactional
        public Long saveVsSaveAndFlush() {
            Account a = accounts.save(new Account("asha", 100));
            System.out.println("  after save()          -> no INSERT yet");
            accounts.saveAndFlush(new Account("ravi", 50));
            System.out.println("  after saveAndFlush()  -> both INSERTs sent; commit still pending");
            return a.getId();
        }

        @Transactional
        public void depositWithoutSave(Long id) {
            Account a = accounts.findById(id).orElseThrow();
            a.deposit(25);
            System.out.println("  balance changed, save() NOT called; method returns -> commit");
        }

        @Transactional
        public void autoFlushBeforeQuery(Long id) {
            Account a = accounts.findById(id).orElseThrow();
            a.deposit(5);
            System.out.println("  balance changed; now running a JPQL count query on Account");
            long count = accounts.count();
            System.out.println("  count = " + count);
        }

        @Transactional
        public void saveAssignedId() {
            coupons.save(new Coupon("DIWALI10", 10));
            System.out.println("  save() with an assigned id -> merge, so Hibernate SELECTs first");
        }
    }

    public static void main(String[] args) {
        try (ConfigurableApplicationContext context = new SpringApplicationBuilder(DirtyCheckingDemo.class)
                .web(WebApplicationType.NONE)
                .properties("spring.main.banner-mode=off", "logging.level.root=error",
                        "spring.datasource.url=jdbc:h2:mem:dirty",
                        "spring.jpa.hibernate.ddl-auto=create-drop",
                        "spring.jpa.properties.hibernate.session_factory.statement_inspector="
                                + SqlPrinter.class.getName())
                .run(args)) {
            BankService bank = context.getBean(BankService.class);
            System.out.println("1. save vs saveAndFlush");
            Long id = bank.saveVsSaveAndFlush();
            System.out.println("2. dirty checking");
            bank.depositWithoutSave(id);
            System.out.println("3. AUTO flush before a query");
            bank.autoFlushBeforeQuery(id);
            System.out.println("4. save() on an entity with an assigned id");
            bank.saveAssignedId();
        }
    }
}
```

**Output:**

```text
1. save vs saveAndFlush
    SQL> select next value for account_seq
  after save()          -> no INSERT yet
    SQL> select next value for account_seq
    SQL> insert into account (balance,owner,id) values (?,?,?)
    SQL> insert into account (balance,owner,id) values (?,?,?)
  after saveAndFlush()  -> both INSERTs sent; commit still pending
2. dirty checking
    SQL> select a1_0.id,a1_0.balance,a1_0.owner from account a1_0 where a1_0.id=?
  balance changed, save() NOT called; method returns -> commit
    SQL> update account set balance=?,owner=? where id=?
3. AUTO flush before a query
    SQL> select a1_0.id,a1_0.balance,a1_0.owner from account a1_0 where a1_0.id=?
  balance changed; now running a JPQL count query on Account
    SQL> update account set balance=?,owner=? where id=?
    SQL> select count(*) from account a1_0
  count = 2
4. save() on an entity with an assigned id
    SQL> select c1_0.code,c1_0.percent from coupon c1_0 where c1_0.code=?
  save() with an assigned id -> merge, so Hibernate SELECTs first
    SQL> insert into coupon (percent,code) values (?,?)
```

Reading the output:

1. With `SEQUENCE`, `save()` only fetches an id; the INSERT waits. `saveAndFlush()` sends **all** pending INSERTs. (The pooled optimizer reads the sequence twice at first to establish its block of 50 ids.)
2. The UPDATE appeared at commit although `save()` was never called — dirty checking.
3. The pending UPDATE was flushed **before** the `count` query because the query reads the `account` table.
4. An assigned id makes `save()` use `merge`, which costs a SELECT.

## Comparison: save vs saveAndFlush

| | `save()` | `saveAndFlush()` |
|--|----------|------------------|
| Makes entity managed | Yes (`persist` or `merge`) | Yes |
| SQL sent immediately | No (except `IDENTITY` inserts) | Yes — flushes **all** pending changes |
| Commits | No | No |
| Constraint violations surface | At flush/commit (possibly after the method returns) | Immediately, at this line |
| Cost | Lower (batching possible) | Extra round trips; defeats batching if overused |
| Use | Default | When SQL must run at this point |

## Internal Behavior

- Hibernate's default dirty checking compares every property of every managed entity at flush — cost proportional to the number of managed entities. Bytecode enhancement can track changes instead, but is rarely needed.
- `@DynamicUpdate` builds UPDATE statements per flush with only changed columns (useful for wide tables or to reduce lock contention on columns); the default static UPDATE can be cached and batched.
- Bulk JPQL updates (`@Modifying @Query("update …")`) **bypass** dirty checking and the persistence context: managed entities in memory become stale unless you clear the context (`clearAutomatically = true`).

## Common Mistakes

- Calling `save()` on every managed entity "to be safe" (noise, extra `merge` calls).
- Assuming `saveAndFlush()` commits.
- Modifying an entity for a response (e.g. masking a field) inside a transaction — the masked value is persisted.
- Using assigned ids without `@Version`/`Persistable` and paying a SELECT per insert.
- Catching a constraint violation around `save()` — it may only be thrown at commit, outside your `try`. Use `saveAndFlush()` (or `flush()`) inside the `try`.

## Common Interview Traps

- **"Flush commits the transaction."** Flush sends SQL; commit makes it permanent. A rollback after flush undoes it.
- **"Without `save()`, changes are lost."** Not for managed entities in a transaction.
- **"`save()` always inserts."** It merges when the entity is not new — including entities with assigned ids.

## Key Takeaways

- Managed entity + transaction = automatic UPDATE at flush (dirty checking).
- Flush happens before commit, before relevant queries, on `flush()`/`saveAndFlush()`, and at `persist` for `IDENTITY`.
- `save` = persist-or-merge; `saveAndFlush` = save + flush; neither commits.
- Read-only transactions skip dirty checking.
