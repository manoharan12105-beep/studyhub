# @Transactional: Boundaries, Rollback Rules and Proxies

**Module:** Transactions · **Interview priority:** Core

## Definition

**`@Transactional`** (from `org.springframework.transaction.annotation`) declares that a method — or every public method of a class — must run inside a transaction. Spring implements it with **proxy-based AOP**: the bean other code receives is a proxy whose `TransactionInterceptor` asks a **`PlatformTransactionManager`** to begin, commit or roll back around the real method. **Rollback rules** decide which exceptions roll back: by default unchecked exceptions (`RuntimeException`, `Error`) do, checked exceptions do **not**.

## Why It Matters

- It is the most used and most misunderstood Spring annotation; "Why does `@Transactional` sometimes not work?" is a top interview question.
- The default rollback rule for checked exceptions causes real data bugs.

## @Transactional

| Attribute | Default | Meaning |
|-----------|---------|---------|
| `propagation` | `REQUIRED` | Join an existing transaction or start one — see [Propagation](../transaction-propagation/content.md) |
| `isolation` | `DEFAULT` (database default) | See [Isolation Levels](../transaction-isolation/content.md) |
| `readOnly` | `false` | Optimisation hint: Hibernate skips dirty checking/flush; driver/DB may optimise; can route to replicas |
| `timeout` | none | Seconds before the transaction is rolled back with a timeout exception |
| `rollbackFor` / `rollbackForClassName` | — | Extra exception types that trigger rollback (e.g. checked exceptions) |
| `noRollbackFor` | — | Exceptions that should **not** roll back |
| `transactionManager` / `value` | primary manager | Which manager to use when there are several (e.g. two data sources) |
| `label` | — | Labels for monitoring/custom managers |

Placement:

- On a **public method of a Spring bean** (the usual case).
- On a **class**: applies to all its public methods; method-level annotations override it.
- On interface methods: works with interface-based proxies; prefer annotating the implementation.
- Spring Framework 6+ with class-based (CGLIB) proxies also intercepts `protected` and package-private methods; **`private` methods are never intercepted**.

Use `org.springframework.transaction.annotation.Transactional`. Jakarta's `jakarta.transaction.Transactional` is also honoured by Spring, but it expresses propagation as `value = TxType.REQUIRES_NEW`, rollback rules as `rollbackOn`/`dontRollbackOn`, and has no `isolation`, `readOnly` or `timeout` attributes — mixing the two annotations in one codebase causes confusion.

## Commit and Rollback Rules

| Exception thrown out of the method | Default outcome |
|------------------------------------|-----------------|
| `RuntimeException` (and subclasses: `IllegalStateException`, `DataAccessException`, your domain exceptions) | **Rollback** |
| `Error` (`OutOfMemoryError`, `AssertionError`) | **Rollback** |
| Checked `Exception` (`IOException`, your `PaymentDeclinedException extends Exception`) | **Commit** |
| Exception caught inside the method and not rethrown | **Commit** (Spring never sees it) |

Customise:

```java
@Transactional(rollbackFor = Exception.class)                 // roll back on checked exceptions too
public void charge(long orderId) throws Exception {
}

@Transactional(noRollbackFor = IllegalArgumentException.class) // keep the work despite this exception
public void recordVisit(long userId) {
}
```

Spring Framework 6.2 can change the global default: `@EnableTransactionManagement(rollbackOn = RollbackOn.ALL_EXCEPTIONS)`.

## Transaction Boundaries

The proxy defines the boundary: the transaction starts when the **first** transactional method is entered **through a proxy** and ends when that method returns. Inner calls to other transactional beans with `REQUIRED` propagation **join** the same transaction; only the outermost method commits.

## Proxy-Based Transaction Management

```text
caller ──► OrderService$$SpringCGLIB (proxy)
              TransactionInterceptor.invoke()
                ├─ read @Transactional attributes (cached per method)
                ├─ PlatformTransactionManager.getTransaction(definition)
                │     JpaTransactionManager: open EntityManager, get JDBC connection,
                │     setAutoCommit(false), bind both to the thread (TransactionSynchronizationManager)
                ├─ invoke target method  ──► real OrderService.placeOrder()
                │                               repositories find the thread-bound connection/EntityManager
                ├─ exception?  matches rollback rules → rollback()  else → commit()
                └─ normal return → commit()  (JPA: flush, then commit)
              unbind resources, return connection to the pool
```

Key consequences:

- **Only calls through the proxy are transactional.** `this.otherMethod()` inside the bean skips the interceptor (self-invocation).
- **Thread-bound:** the transaction belongs to the current thread; work moved to another thread (`@Async`, `CompletableFuture.supplyAsync`, parallel streams) does not participate.
- **Beans only:** objects created with `new` have no proxy.
- Which manager? Spring Boot auto-configures `JpaTransactionManager` with Spring Data JPA, or `DataSourceTransactionManager`/`JdbcTransactionManager` with plain JDBC. `@EnableTransactionManagement` is applied automatically by Boot.

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

public class RollbackRulesDemo {

    static class PaymentDeclinedException extends Exception {          // checked exception
        PaymentDeclinedException(String message) {
            super(message);
        }
    }

    static class OrderService {
        private final JdbcTemplate jdbc;

        OrderService(JdbcTemplate jdbc) {
            this.jdbc = jdbc;
        }

        @Transactional
        public void succeed() {
            System.out.println("  transaction active inside the method? "
                    + TransactionSynchronizationManager.isActualTransactionActive());
            jdbc.update("insert into orders(item) values ('ok')");
        }

        @Transactional
        public void failWithRuntimeException() {
            jdbc.update("insert into orders(item) values ('runtime')");
            throw new IllegalStateException("stock service down");
        }

        @Transactional
        public void failWithCheckedException() throws PaymentDeclinedException {
            jdbc.update("insert into orders(item) values ('checked')");
            throw new PaymentDeclinedException("card declined");
        }

        @Transactional(rollbackFor = PaymentDeclinedException.class)
        public void failWithCheckedExceptionAndRollbackFor() throws PaymentDeclinedException {
            jdbc.update("insert into orders(item) values ('checked-rollbackFor')");
            throw new PaymentDeclinedException("card declined");
        }
    }

    @Configuration
    @EnableTransactionManagement                      // Spring Boot enables this automatically
    static class AppConfig {
        @Bean
        DataSource dataSource() {
            return new EmbeddedDatabaseBuilder().setType(EmbeddedDatabaseType.H2).generateUniqueName(true).build();
        }

        @Bean
        JdbcTemplate jdbcTemplate(DataSource dataSource) {
            JdbcTemplate jdbc = new JdbcTemplate(dataSource);
            jdbc.execute("create table orders(id int auto_increment primary key, item varchar(40))");
            return jdbc;
        }

        @Bean
        PlatformTransactionManager transactionManager(DataSource dataSource) {
            return new DataSourceTransactionManager(dataSource);
        }

        @Bean
        OrderService orderService(JdbcTemplate jdbc) {
            return new OrderService(jdbc);
        }
    }

    interface Action {
        void run() throws Exception;
    }

    static void attempt(String label, Action action) {
        try {
            action.run();
            System.out.println(label + " -> returned normally");
        } catch (Exception e) {
            System.out.println(label + " -> threw " + e.getClass().getSimpleName());
        }
    }

    public static void main(String[] args) {
        try (var context = new AnnotationConfigApplicationContext(AppConfig.class)) {
            OrderService service = context.getBean(OrderService.class);
            JdbcTemplate jdbc = context.getBean(JdbcTemplate.class);

            System.out.println("injected bean is a proxy? " + (service.getClass() != OrderService.class));
            attempt("succeed()", service::succeed);
            attempt("failWithRuntimeException()", service::failWithRuntimeException);
            attempt("failWithCheckedException()", service::failWithCheckedException);
            attempt("failWithCheckedExceptionAndRollbackFor()", service::failWithCheckedExceptionAndRollbackFor);

            System.out.println("rows committed: "
                    + jdbc.queryForList("select item from orders order by id", String.class));
        }
    }
}
```

**Output:**

```text
injected bean is a proxy? true
  transaction active inside the method? true
succeed() -> returned normally
failWithRuntimeException() -> threw IllegalStateException
failWithCheckedException() -> threw PaymentDeclinedException
failWithCheckedExceptionAndRollbackFor() -> threw PaymentDeclinedException
rows committed: [ok, checked]
```

The row `checked` was **committed** even though the method threw — the default rule for checked exceptions.

## Programmatic Transactions

When you need a boundary smaller than a method, or inside code that cannot be proxied, use `TransactionTemplate`:

```java
import org.springframework.transaction.support.TransactionTemplate;

class BatchImporter {
    private final TransactionTemplate tx;

    BatchImporter(TransactionTemplate tx) {               // auto-configured by Spring Boot
        this.tx = tx;
    }

    void importChunks(java.util.List<java.util.List<String>> chunks) {
        for (var chunk : chunks) {
            tx.executeWithoutResult(status -> chunk.forEach(this::importRow));   // one transaction per chunk
        }
    }

    private void importRow(String row) {
    }
}
```

## Common Mistakes

- Checked domain exceptions without `rollbackFor`.
- Catching exceptions inside the transactional method and returning normally (commit of partial work).
- `@Transactional` on private methods, on methods called via `this`, or on objects not managed by Spring — see [Transactional Pitfalls](../transactional-pitfalls/content.md).
- Wrong import (`jakarta.transaction.Transactional` with Spring-style attributes expectations).
- Long-running `@Transactional` methods holding connections.

## Common Interview Traps

- **"`@Transactional` rolls back on any exception."** Only unchecked by default.
- **"Every `@Transactional` method commits when it returns."** With `REQUIRED`, only the outermost method commits; inner ones join.
- **"`readOnly = true` prevents writes."** It is a hint; Hibernate skips flushing, and some drivers/databases enforce read-only, but it is not a security mechanism.

## Key Takeaways

- `@Transactional` = AOP proxy + `TransactionInterceptor` + `PlatformTransactionManager`, with resources bound to the current thread.
- Rollback on `RuntimeException`/`Error`; commit on checked exceptions unless `rollbackFor`.
- Only external calls through the proxy, on non-private methods of Spring beans, on the same thread, are transactional.
