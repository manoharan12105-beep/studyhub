# Isolation Levels and Read Anomalies

**Module:** Transactions · **Interview priority:** Frequently asked

## Definition

The **isolation level** of a transaction decides how much it is protected from the effects of other concurrent transactions. The SQL standard defines four levels — **READ UNCOMMITTED**, **READ COMMITTED**, **REPEATABLE READ** and **SERIALIZABLE** — by which **read anomalies** they prevent: **dirty reads**, **non-repeatable reads** and **phantom reads**. In Spring: `@Transactional(isolation = Isolation.REPEATABLE_READ)`; the default `Isolation.DEFAULT` uses the database's default.

## Why It Matters

- Concurrency bugs (wrong totals, double bookings, inconsistent reports) often come from assuming more isolation than the database provides.
- "Explain dirty, non-repeatable and phantom reads" and "What is your database's default isolation level?" are classic questions.

## Read Anomalies

### Dirty Read

Reading another transaction's **uncommitted** change, which may later be rolled back.

```text
T1: UPDATE account SET balance = 0 WHERE id = 1    (not committed)
T2: SELECT balance → 0                             ← dirty read
T1: ROLLBACK                                        T2 acted on data that never existed
```

### Non-Repeatable Read

Reading the **same row twice** in one transaction and getting **different values**, because another transaction committed an update in between.

```text
T1: SELECT price FROM product WHERE id = 1 → 100
T2: UPDATE product SET price = 120 WHERE id = 1; COMMIT
T1: SELECT price FROM product WHERE id = 1 → 120   ← non-repeatable read
```

### Phantom Read

Running the **same query twice** and getting a **different set of rows**, because another transaction committed an insert/delete that matches the condition.

```text
T1: SELECT count(*) FROM product WHERE price >= 50 → 1
T2: INSERT INTO product ... price = 50; COMMIT
T1: SELECT count(*) FROM product WHERE price >= 50 → 2   ← phantom
```

Related anomalies: **lost update** (two read-modify-writes overwrite each other — see [Locking](../../jpa-hibernate/jpa-locking/content.md)) and **write skew** (two transactions read overlapping data and make disjoint updates that together break a rule, e.g. two doctors both go off call). Only SERIALIZABLE (or explicit locking) prevents write skew.

## Isolation Levels

| Level | Dirty read | Non-repeatable read | Phantom read |
|-------|-----------|---------------------|--------------|
| `READ_UNCOMMITTED` | Possible | Possible | Possible |
| `READ_COMMITTED` | Prevented | Possible | Possible |
| `REPEATABLE_READ` | Prevented | Prevented | Possible (per standard) |
| `SERIALIZABLE` | Prevented | Prevented | Prevented |

Higher isolation = fewer anomalies, more locking/aborts, lower concurrency.

## READ_UNCOMMITTED

Allows dirty reads. Almost never appropriate. PostgreSQL treats it as READ COMMITTED.

## READ_COMMITTED

Each statement sees only data committed before **that statement** began. The default in **PostgreSQL, Oracle and SQL Server**. Good default for most OLTP work, combined with optimistic locking for updates.

## REPEATABLE_READ

The transaction sees a consistent snapshot (or holds read locks), so rows it read do not change. The default in **MySQL InnoDB**. In PostgreSQL (and H2), REPEATABLE READ is snapshot isolation and also prevents phantoms; concurrent conflicting updates fail with a serialization error that must be retried. MySQL InnoDB prevents most phantoms with next-key locks for locking reads.

## SERIALIZABLE

Transactions behave as if executed one after another. Implementations use strict locking (some databases) or serializable snapshot isolation (PostgreSQL), aborting transactions that would violate serial order — callers must **retry** serialization failures (`CannotSerializeTransactionException`/`PessimisticLockingFailureException`). Use for critical invariants that span many rows when simpler locking is not enough.

## How It Works

The demo reads the same row and the same query twice while another transaction (`REQUIRES_NEW`, a separate connection) commits changes in between.

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
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

public class IsolationDemo {

    static class PriceWriter {
        private final JdbcTemplate jdbc;

        PriceWriter(JdbcTemplate jdbc) {
            this.jdbc = jdbc;
        }

        @Transactional(propagation = Propagation.REQUIRES_NEW)        // another transaction, own connection
        public void changePrice(int newPrice) {
            jdbc.update("update product set price = ? where id = 1", newPrice);
        }

        @Transactional(propagation = Propagation.REQUIRES_NEW)
        public void addProduct(int id) {
            jdbc.update("insert into product(id, price) values (?, 50)", id);
        }
    }

    static class ReportService {
        private final JdbcTemplate jdbc;
        private final PriceWriter writer;

        ReportService(JdbcTemplate jdbc, PriceWriter writer) {
            this.jdbc = jdbc;
            this.writer = writer;
        }

        private String readTwice(int newPrice, int newId) {
            int price1 = jdbc.queryForObject("select price from product where id = 1", Integer.class);
            int count1 = jdbc.queryForObject("select count(*) from product where price >= 50", Integer.class);
            writer.changePrice(newPrice);                               // committed concurrently
            writer.addProduct(newId);
            int price2 = jdbc.queryForObject("select price from product where id = 1", Integer.class);
            int count2 = jdbc.queryForObject("select count(*) from product where price >= 50", Integer.class);
            return "price " + price1 + " -> " + price2 + ", rows " + count1 + " -> " + count2;
        }

        @Transactional(isolation = Isolation.READ_COMMITTED)
        public String readCommitted() {
            return readTwice(120, 2);
        }

        @Transactional(isolation = Isolation.REPEATABLE_READ)
        public String repeatableRead() {
            return readTwice(150, 3);
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
            jdbc.execute("create table product(id int primary key, price int)");
            jdbc.update("insert into product values (1, 100)");
            return jdbc;
        }

        @Bean
        PlatformTransactionManager transactionManager(DataSource dataSource) {
            return new DataSourceTransactionManager(dataSource);
        }

        @Bean
        PriceWriter priceWriter(JdbcTemplate jdbc) {
            return new PriceWriter(jdbc);
        }

        @Bean
        ReportService reportService(JdbcTemplate jdbc, PriceWriter writer) {
            return new ReportService(jdbc, writer);
        }
    }

    public static void main(String[] args) {
        try (var context = new AnnotationConfigApplicationContext(AppConfig.class)) {
            ReportService reports = context.getBean(ReportService.class);
            System.out.println("READ_COMMITTED:  " + reports.readCommitted());
            System.out.println("REPEATABLE_READ: " + reports.repeatableRead());
        }
    }
}
```

**Output:**

```text
READ_COMMITTED:  price 100 -> 120, rows 1 -> 2
REPEATABLE_READ: price 120 -> 120, rows 2 -> 2
```

Under READ COMMITTED the transaction saw both the committed update (non-repeatable read) and the committed insert (phantom). Under REPEATABLE READ it kept its snapshot. H2, like PostgreSQL, implements REPEATABLE READ as snapshot isolation, so the phantom did not appear either — on other databases the phantom row may still be visible at this level.

## Isolation in Spring

```java
@Transactional(isolation = Isolation.SERIALIZABLE)
public void allocateBed(long wardId) {
    // count free beds, then insert an allocation — safe from write skew at SERIALIZABLE
}
```

- `Isolation.DEFAULT` (the default) leaves the connection's level unchanged — usually the database default.
- The transaction manager sets the level on the connection at transaction start and **resets** it afterwards. `JpaTransactionManager` supports custom isolation through the Hibernate JPA dialect.
- Isolation applies only when the method **starts** the transaction; a method joining an existing transaction cannot change its level.

## Common Mistakes

- Assuming REPEATABLE READ or `@Transactional` prevents lost updates in read-modify-write code on READ COMMITTED databases.
- Raising isolation globally to SERIALIZABLE without handling serialization failures (retries).
- Expecting the isolation attribute on an inner (joining) method to apply.
- Believing behaviour is identical across databases (MySQL vs PostgreSQL REPEATABLE READ differ).

## Common Interview Traps

- **"The default isolation level is REPEATABLE READ."** It depends on the database: READ COMMITTED for PostgreSQL/Oracle/SQL Server, REPEATABLE READ for MySQL InnoDB.
- **"SERIALIZABLE locks the whole table."** Modern databases implement it with predicate locks or SSI and abort conflicting transactions rather than locking everything.
- **"Isolation prevents all concurrency problems."** Lost updates and write skew often need explicit locking or constraints.

## Key Takeaways

- Dirty read = uncommitted data; non-repeatable read = same row changes; phantom = same query returns different rows.
- READ COMMITTED prevents dirty reads; REPEATABLE READ also non-repeatable reads; SERIALIZABLE prevents all three (and write skew).
- Spring's `Isolation.DEFAULT` = database default; set isolation where the transaction starts; handle serialization retries.
