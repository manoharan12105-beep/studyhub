# Transaction Propagation

**Module:** Transactions · **Interview priority:** Frequently asked

## Definition

**Propagation** defines what happens when a transactional method is called **while a transaction may already exist**: join it, start a new independent one, run without one, or fail. It is set with `@Transactional(propagation = Propagation.X)`; the default is **`REQUIRED`**.

## Why It Matters

- Audit logs that must survive a rollback, notifications that must not run in a transaction, and "UnexpectedRollbackException: Transaction silently rolled back" are all propagation questions.
- Interviewers commonly ask for REQUIRED vs REQUIRES_NEW with a realistic scenario.

## Transaction Propagation

| Propagation | Existing transaction | No transaction |
|-------------|----------------------|----------------|
| `REQUIRED` (default) | **Join** it | Start a new one |
| `REQUIRES_NEW` | **Suspend** it, start a new independent one | Start a new one |
| `SUPPORTS` | Join it | Run **without** a transaction |
| `NOT_SUPPORTED` | **Suspend** it, run without a transaction | Run without one |
| `MANDATORY` | Join it | **Throw** `IllegalTransactionStateException` |
| `NEVER` | **Throw** `IllegalTransactionStateException` | Run without one |
| `NESTED` | Run in a **savepoint** inside it | Start a new one (like REQUIRED) |

## REQUIRED

The caller and callee share **one** physical transaction. Only the outermost method commits. If any participant throws a rollback-triggering exception, the **whole** transaction is marked rollback-only — even if the caller catches the exception. This is the source of `UnexpectedRollbackException` (scenario 2 below).

## REQUIRES_NEW

The current transaction is suspended and a **separate** transaction (with its **own database connection**) runs and commits or rolls back independently. Use for work that must persist regardless of the outer outcome: audit/security logs, "failed attempt" records, sequence/number allocation.

Costs: two connections per thread at once — under load, outer transactions holding connections while waiting for inner ones can **exhaust the pool and deadlock** the application. Also, the inner transaction cannot see the outer transaction's uncommitted data.

## SUPPORTS

"Transactional if you are." Read operations that work either way. Rarely needed explicitly.

## NOT_SUPPORTED

Suspends any transaction and runs non-transactionally — for long-running or non-transactional work (calling an external API, generating a report from a replica) that should not hold the caller's transaction resources.

## MANDATORY

Asserts the caller has a transaction — useful on internal methods that must be part of a larger unit (e.g. a ledger posting that must never be committed alone).

## NEVER

Asserts there is no transaction — for code that must not run inside one (rare).

## NESTED Awareness

Creates a JDBC **savepoint** in the existing transaction. If the nested method fails, only the work since the savepoint is rolled back and the outer transaction continues; if the outer transaction rolls back, the nested work is rolled back too (unlike REQUIRES_NEW).

Supported by `DataSourceTransactionManager`/`JdbcTransactionManager`. `JpaTransactionManager` does **not** allow nested transactions by default (`nestedTransactionAllowed` is false) because rolling back to a savepoint does not roll back the JPA persistence context's in-memory state.

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
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronizationManager;

public class PropagationDemo {

    static class AuditService {
        private final JdbcTemplate jdbc;

        AuditService(JdbcTemplate jdbc) {
            this.jdbc = jdbc;
        }

        @Transactional(propagation = Propagation.REQUIRES_NEW)      // own, independent transaction
        public void record(String event) {
            jdbc.update("insert into audit_log(event) values (?)", event);
        }

        @Transactional                                              // REQUIRED (default): joins the caller
        public void recordStrict(String event) {
            jdbc.update("insert into audit_log(event) values (?)", event);
            throw new IllegalArgumentException("audit rejected " + event);
        }

        @Transactional(propagation = Propagation.NESTED)            // savepoint inside the caller's tx
        public void recordNested(String event) {
            jdbc.update("insert into audit_log(event) values (?)", event);
            throw new IllegalArgumentException("nested failure");
        }

        @Transactional(propagation = Propagation.MANDATORY)
        public void mustBeCalledInTransaction() {
        }

        @Transactional(propagation = Propagation.SUPPORTS)
        public boolean supports() {
            return TransactionSynchronizationManager.isActualTransactionActive();
        }

        @Transactional(propagation = Propagation.NOT_SUPPORTED)
        public boolean notSupported() {
            return TransactionSynchronizationManager.isActualTransactionActive();
        }
    }

    static class OrderService {
        private final JdbcTemplate jdbc;
        private final AuditService audit;

        OrderService(JdbcTemplate jdbc, AuditService audit) {
            this.jdbc = jdbc;
            this.audit = audit;
        }

        @Transactional
        public void placeOrderThenFail() {
            jdbc.update("insert into orders(item) values ('laptop')");
            audit.record("order attempted");                        // committed independently
            throw new IllegalStateException("payment failed");
        }

        @Transactional
        public void placeOrderSwallowingAuditFailure() {
            jdbc.update("insert into orders(item) values ('phone')");
            try {
                audit.recordStrict("order placed");                 // marks the SHARED tx rollback-only
            } catch (IllegalArgumentException e) {
                System.out.println("  caught: " + e.getMessage() + " (and carried on)");
            }
        }

        @Transactional
        public void placeOrderWithNestedAudit() {
            jdbc.update("insert into orders(item) values ('tablet')");
            try {
                audit.recordNested("nested audit");                 // rolled back to the savepoint only
            } catch (IllegalArgumentException e) {
                System.out.println("  caught: " + e.getMessage());
            }
        }

        @Transactional
        public String propagationInsideTransaction() {
            return "SUPPORTS sees tx=" + audit.supports() + ", NOT_SUPPORTED sees tx=" + audit.notSupported();
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
            jdbc.execute("create table orders(id int auto_increment primary key, item varchar(40))");
            jdbc.execute("create table audit_log(id int auto_increment primary key, event varchar(40))");
            return jdbc;
        }

        @Bean
        PlatformTransactionManager transactionManager(DataSource dataSource) {
            return new DataSourceTransactionManager(dataSource);    // supports savepoints (NESTED)
        }

        @Bean
        AuditService auditService(JdbcTemplate jdbc) {
            return new AuditService(jdbc);
        }

        @Bean
        OrderService orderService(JdbcTemplate jdbc, AuditService audit) {
            return new OrderService(jdbc, audit);
        }
    }

    static void attempt(String label, Runnable action) {
        System.out.println(label);
        try {
            action.run();
            System.out.println("  -> committed");
        } catch (RuntimeException e) {
            System.out.println("  -> " + e.getClass().getSimpleName());
        }
    }

    public static void main(String[] args) {
        try (var context = new AnnotationConfigApplicationContext(AppConfig.class)) {
            OrderService orders = context.getBean(OrderService.class);
            AuditService audit = context.getBean(AuditService.class);
            JdbcTemplate jdbc = context.getBean(JdbcTemplate.class);

            attempt("1. REQUIRES_NEW audit, outer transaction fails", orders::placeOrderThenFail);
            attempt("2. REQUIRED inner fails, outer catches and continues", orders::placeOrderSwallowingAuditFailure);
            attempt("3. NESTED inner fails, outer catches and continues", orders::placeOrderWithNestedAudit);
            attempt("4. MANDATORY called without a transaction", audit::mustBeCalledInTransaction);
            System.out.println("5. " + orders.propagationInsideTransaction());

            System.out.println("orders:    " + jdbc.queryForList("select item from orders order by id", String.class));
            System.out.println("audit_log: " + jdbc.queryForList("select event from audit_log order by id", String.class));
        }
    }
}
```

**Output:**

```text
1. REQUIRES_NEW audit, outer transaction fails
  -> IllegalStateException
2. REQUIRED inner fails, outer catches and continues
  caught: audit rejected order placed (and carried on)
  -> UnexpectedRollbackException
3. NESTED inner fails, outer catches and continues
  caught: nested failure
  -> committed
4. MANDATORY called without a transaction
  -> IllegalTransactionStateException
5. SUPPORTS sees tx=true, NOT_SUPPORTED sees tx=false
orders:    [tablet]
audit_log: [order attempted]
```

Reading the result:

1. `laptop` was rolled back, but the REQUIRES_NEW audit row `order attempted` survived.
2. The inner REQUIRED method failed inside the **shared** transaction and marked it rollback-only. The outer method caught the exception and tried to commit — Spring rolled back anyway and threw **`UnexpectedRollbackException`** ("Transaction silently rolled back because it has been marked as rollback-only"). `phone` is gone.
3. NESTED rolled back only to its savepoint; `tablet` was committed.
4. MANDATORY refused to run without a caller transaction.
5. SUPPORTS joined the caller's transaction; NOT_SUPPORTED suspended it.

## Comparison: REQUIRED vs REQUIRES_NEW vs NESTED

| | REQUIRED | REQUIRES_NEW | NESTED |
|--|----------|--------------|--------|
| Physical transactions | One shared | Two independent | One, with a savepoint |
| Connections | One | Two at the same time | One |
| Inner failure, outer catches | Whole tx rolls back (`UnexpectedRollbackException`) | Outer can still commit | Outer can still commit |
| Outer failure after inner success | Inner work rolled back | Inner work **kept** | Inner work rolled back |
| Sees outer's uncommitted data | Yes | No | Yes |
| Typical use | Default | Audit logs, independent records | Optional sub-steps with JDBC |

## Internal Behavior

- `AbstractPlatformTransactionManager.getTransaction` checks for an existing thread-bound transaction and applies the propagation rule; suspension unbinds the outer resources and rebinds them after the inner transaction completes.
- In a joined (REQUIRED) participant, a rollback-triggering exception sets the global rollback-only flag; the outer commit detects it and throws `UnexpectedRollbackException`.
- Propagation only applies when the call goes **through a proxy** — calling a REQUIRES_NEW method on `this` silently joins (or skips) the current transaction.

## Common Mistakes

- REQUIRES_NEW for "safety" everywhere → connection pool exhaustion and deadlocks under load.
- Catching an exception from a REQUIRED inner call and expecting the outer commit to work.
- Calling a REQUIRES_NEW method of the same class via `this` (self-invocation) — no new transaction.
- Expecting NESTED with `JpaTransactionManager` to work by default.

## Common Interview Traps

- **"REQUIRES_NEW creates a nested transaction."** It creates an independent transaction; NESTED is the savepoint variant.
- **"Catching the inner exception prevents the rollback."** Not with REQUIRED; the shared transaction is already marked rollback-only.
- **"Each @Transactional method commits on return."** Only the method that started the physical transaction commits.

## Key Takeaways

- REQUIRED joins; REQUIRES_NEW suspends and starts an independent transaction; NESTED uses a savepoint.
- SUPPORTS / NOT_SUPPORTED / MANDATORY / NEVER adapt or assert the transactional context.
- `UnexpectedRollbackException` = a joined participant failed, the caller swallowed it, and the commit could not happen.
