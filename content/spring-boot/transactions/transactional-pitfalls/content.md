# Transactional Pitfalls and Self-Invocation

**Module:** Transactions · **Interview priority:** Core

## Definition

**Transactional pitfalls** are situations where `@Transactional` *appears* to be present but does not behave as expected — no transaction is started, the transaction commits when it should roll back, or it rolls back when it should commit. The most famous is the **self-invocation problem**: a method calling another `@Transactional` method **of the same object** via `this` bypasses the Spring proxy, so the annotation on the called method is ignored.

## Why It Matters

- "Why does `@Transactional` sometimes not work?" is one of the most frequently asked Spring Boot questions, and it is a common production bug.
- Every pitfall follows from one fact: **transactions are applied by a proxy, around calls that go through the proxy, on the current thread.**

## Self-Invocation Problem

```text
caller ──► [proxy] ──► OrderService.importStock()        ← not @Transactional: proxy just delegates
                              │
                              └── this.reserveAll()       ← plain Java call on the target object,
                                                             the proxy never sees it → NO transaction
```

The proxy wraps the bean from the outside. Once execution is inside the target object, `this` refers to the target, not the proxy.

### Fixes

1. **Move the transactional method to another bean** (cleanest): `stockReservationService.reserveAll()`.
2. **Put `@Transactional` on the entry method** (`importStock`) if the whole flow should be one transaction.
3. **`TransactionTemplate`** for programmatic boundaries inside the class.
4. Self-injection (`@Lazy` injecting the bean into itself) or `AopContext.currentProxy()` with `exposeProxy = true` — work, but obscure; avoid.
5. AspectJ mode weaving (`@EnableTransactionManagement(mode = AdviceMode.ASPECTJ)`) — applies transactions at bytecode level, including self-calls; needs weaving setup.

The same limitation applies to every proxy-based feature: `@Async`, `@Cacheable`, `@Retryable`, `@PreAuthorize`, `@Validated` method validation.

## Transactional Pitfalls

| # | Pitfall | What happens | Fix |
|---|---------|--------------|-----|
| 1 | **Self-invocation** (`this.txMethod()`) | No transaction for the inner method | Separate bean, annotate the entry point, `TransactionTemplate` |
| 2 | **`private` method** | Never intercepted | Make it public on a bean (or move it) |
| 3 | **Exception caught inside the method** | Proxy sees normal return → commit of partial work | Rethrow, or `setRollbackOnly()` |
| 4 | **Checked exception** | Commit by default | `rollbackFor`, or unchecked exceptions |
| 5 | **Object created with `new`** | No proxy at all | Inject the bean |
| 6 | **Called from `@PostConstruct`** | Runs on the raw object before the proxy exists | `ApplicationRunner`/`ApplicationReadyEvent` calling the proxied bean |
| 7 | **New thread** (`@Async`, `CompletableFuture`, parallel stream) | Work is outside the caller's transaction | Own transaction in the async method; pass ids, not entities |
| 8 | **Inner REQUIRED failure caught by the caller** | `UnexpectedRollbackException` at commit | Don't swallow, or REQUIRES_NEW/NESTED — see [Propagation](../transaction-propagation/content.md) |
| 9 | **Wrong transaction manager** (two data sources) | Transaction on a different database than the queries | `@Transactional("ordersTransactionManager")` |
| 10 | **Wrong import / annotation ignored** | E.g. `javax.transaction.Transactional` on Boot 3 (not on the classpath / not honoured) | Use `org.springframework.transaction.annotation.Transactional` |
| 11 | **Database or table does not support transactions** | E.g. MySQL MyISAM tables ignore rollback | Use transactional engines (InnoDB) |
| 12 | **Long transaction with remote calls** | Pool exhaustion, lock contention, non-rollbackable side effects | Short transactions; side effects after commit |
| 13 | **`final` class/method with CGLIB proxies** | Method cannot be overridden → no interception (or startup failure) | Remove `final` |
| 14 | **`readOnly = true` on a method that writes (JPA)** | Changes silently not flushed | Correct the attribute |

## Proxy-Based Transaction Management

Recall the mechanism (details in [@Transactional](../transactional-annotation/content.md)):

- The container replaces the bean with a proxy in `BeanPostProcessor.postProcessAfterInitialization`.
- The proxy's `TransactionInterceptor` runs only for **external calls on public (or, with CGLIB in Spring 6+, non-private) methods**.
- Transaction resources are bound to the **current thread**.

Each pitfall above violates one of these three conditions.

## How It Works

```java
import javax.sql.DataSource;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronizationManager;

public class TransactionalPitfallsDemo {

    static class InventoryService {
        private final JdbcTemplate jdbc;

        InventoryService(JdbcTemplate jdbc) {
            this.jdbc = jdbc;
        }

        // Pitfall 1: self-invocation — this.reserveAll() bypasses the proxy
        public void importStock() {
            reserveAll();
        }

        @Transactional
        public void reserveAll() {
            System.out.println("  reserveAll: transaction active? "
                    + TransactionSynchronizationManager.isActualTransactionActive());
            jdbc.update("insert into stock(sku) values ('A')");
            throw new IllegalStateException("second insert failed");
        }

        // Pitfall 2: the exception is swallowed, so the proxy sees success and commits
        @Transactional
        public void swallowError() {
            jdbc.update("insert into stock(sku) values ('B')");
            try {
                throw new IllegalStateException("downstream failure");
            } catch (IllegalStateException e) {
                System.out.println("  swallowError: logged and ignored -> " + e.getMessage());
            }
        }

        // Pitfall 3: private methods are never intercepted
        public void callPrivate() {
            privateTransactional();
        }

        @Transactional
        private void privateTransactional() {
            System.out.println("  privateTransactional: transaction active? "
                    + TransactionSynchronizationManager.isActualTransactionActive());
        }
    }

    @Configuration
    @EnableTransactionManagement
    static class AppConfig {
        @Bean
        DataSource dataSource() {
            return new EmbeddedDatabaseBuilder().setType(EmbeddedDatabaseType.H2).generateUniqueName(true).build();
        }

        @Bean
        JdbcTemplate jdbcTemplate(DataSource dataSource) {
            JdbcTemplate jdbc = new JdbcTemplate(dataSource);
            jdbc.execute("create table stock(id int auto_increment primary key, sku varchar(10))");
            return jdbc;
        }

        @Bean
        PlatformTransactionManager transactionManager(DataSource dataSource) {
            return new DataSourceTransactionManager(dataSource);
        }

        @Bean
        InventoryService inventoryService(JdbcTemplate jdbc) {
            return new InventoryService(jdbc);
        }
    }

    public static void main(String[] args) {
        try (var context = new AnnotationConfigApplicationContext(AppConfig.class)) {
            InventoryService inventory = context.getBean(InventoryService.class);
            JdbcTemplate jdbc = context.getBean(JdbcTemplate.class);

            System.out.println("1. Called through the proxy:");
            try {
                inventory.reserveAll();
            } catch (IllegalStateException e) {
                System.out.println("  rows after rollback: " + jdbc.queryForObject("select count(*) from stock", Integer.class));
            }

            System.out.println("2. Self-invocation (importStock -> this.reserveAll):");
            try {
                inventory.importStock();
            } catch (IllegalStateException e) {
                System.out.println("  rows after 'rollback': " + jdbc.queryForObject("select count(*) from stock", Integer.class));
            }

            System.out.println("3. Swallowed exception:");
            inventory.swallowError();
            System.out.println("  rows: " + jdbc.queryForObject("select count(*) from stock", Integer.class));

            System.out.println("4. Private @Transactional method:");
            inventory.callPrivate();
        }
    }
}
```

**Output:**

```text
1. Called through the proxy:
  reserveAll: transaction active? true
  rows after rollback: 0
2. Self-invocation (importStock -> this.reserveAll):
  reserveAll: transaction active? false
  rows after 'rollback': 1
3. Swallowed exception:
  swallowError: logged and ignored -> downstream failure
  rows: 2
4. Private @Transactional method:
  privateTransactional: transaction active? false
```

The same method `reserveAll()` rolled back when called through the proxy and silently auto-committed its insert when called via `this`.

### Diagnosing "is my method transactional?"

- Log `TransactionSynchronizationManager.isActualTransactionActive()` and `getCurrentTransactionName()` inside the method.
- Enable `logging.level.org.springframework.transaction.interceptor=TRACE` (shows "Getting transaction for [..]") and `org.springframework.orm.jpa.JpaTransactionManager=DEBUG`.
- Check that the injected object is a proxy (`AopUtils.isAopProxy(bean)`).

## Common Mistakes

- Splitting a service method into a public non-transactional method that calls a transactional one in the same class.
- Putting `@Transactional` on a private helper "to be safe".
- Catching `Exception` in a transactional service method to "handle" it.
- Starting async work inside a transaction and expecting it to see uncommitted data or to roll back with it.

## Common Interview Traps

- **"`@Transactional` doesn't work on private methods because of Java access rules."** It's because proxies cannot override/intercept private methods, and such calls are internal.
- **"Self-invocation works with CGLIB because the proxy is a subclass."** The CGLIB proxy delegates to a separate target instance; `this` inside the target is the target, so the call still bypasses interception.
- **"Adding `@Transactional` to the class fixes self-invocation."** Only the externally called method's transaction applies; internal calls still don't get their own transactional behaviour (e.g. REQUIRES_NEW).

## Key Takeaways

- Transactions need: a Spring bean, a call through the proxy, a non-private method, the same thread, and exceptions that escape the method and match the rollback rules.
- Self-invocation bypasses the proxy — move the method to another bean or use `TransactionTemplate`.
- Verify with `isActualTransactionActive()` and transaction TRACE logging.
