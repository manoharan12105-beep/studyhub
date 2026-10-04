# Connection Pooling and HikariCP

**Module:** Production Spring Boot · **Interview priority:** Frequently asked

## Definition

A **connection pool** keeps a set of open database connections and lends them to application threads, instead of opening a new physical connection for every request. **HikariCP** is Spring Boot's default pool (`spring-boot-starter-jdbc`/`data-jpa`). Calling `close()` on a pooled connection **returns** it to the pool.

## Why It Matters

- Opening a database connection costs TCP/TLS handshakes, authentication and server-side process/thread creation — often milliseconds; pooling turns that into microseconds.
- The pool size caps how many requests can use the database at once — the most common hidden bottleneck ("Connection is not available, request timed out after 30000ms").
- Databases have **hard connection limits**; many instances × large pools can exceed them.

## Connection Pooling

```text
request threads ─► [ HikariCP pool: conn1 conn2 … connN ] ─► database
     │                     ▲
     │   getConnection()   │ close() returns it
     └─ waits up to connectionTimeout if all are busy → SQLTransientConnectionException
```

In Spring, a connection is borrowed when a transaction starts (or for each repository call outside transactions) and returned at commit/rollback. Long transactions = connections held longer = fewer available.

## HikariCP

Key settings (`spring.datasource.hikari.*`):

| Property | Default | Meaning |
|----------|---------|---------|
| `maximum-pool-size` | 10 | Max connections (in use + idle) |
| `minimum-idle` | same as max | Idle connections kept ready (Hikari recommends a fixed-size pool) |
| `connection-timeout` | 30000 ms | How long a thread waits for a connection before failing |
| `idle-timeout` | 600000 ms | Idle connections above `minimum-idle` are closed after this |
| `max-lifetime` | 1800000 ms | Connections are retired after 30 min — keep it below database/firewall timeouts |
| `leak-detection-threshold` | 0 (off) | Logs a warning with stack trace if a connection is held longer than this |
| `pool-name` | auto | Shown in logs and metrics |

```properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.connection-timeout=3000
spring.datasource.hikari.leak-detection-threshold=20000
```

Metrics: `hikaricp.connections.active`, `.idle`, `.pending` (threads waiting), `.acquire` (wait time), `.usage` (hold time) — via Actuator/Micrometer.

## How It Works

```java
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class PoolExhaustionDemo {

    public static void main(String[] args) throws Exception {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:h2:mem:pool");
        config.setPoolName("demo-pool");
        config.setMaximumPoolSize(2);              // tiny pool to make the effect visible
        config.setConnectionTimeout(300);          // ms to wait for a free connection (default 30 000)

        try (HikariDataSource dataSource = new HikariDataSource(config)) {
            List<Connection> held = new ArrayList<>();
            for (int i = 1; i <= 3; i++) {
                long start = System.nanoTime();
                try {
                    held.add(dataSource.getConnection());      // never returned: simulates a leak or slow work
                    System.out.println("request " + i + ": got a connection, active = "
                            + dataSource.getHikariPoolMXBean().getActiveConnections());
                } catch (SQLException e) {
                    long waitedMs = (System.nanoTime() - start) / 1_000_000;
                    System.out.println("request " + i + ": " + e.getClass().getSimpleName()
                            + " after waiting >= 300 ms? " + (waitedMs >= 300));
                }
            }
            for (Connection c : held) {
                c.close();                                      // close() returns it to the pool
            }
            System.out.println("after close(): active = " + dataSource.getHikariPoolMXBean().getActiveConnections()
                    + ", idle = " + dataSource.getHikariPoolMXBean().getIdleConnections());
        }
    }
}
```

**Output:**

```text
request 1: got a connection, active = 1
request 2: got a connection, active = 2
request 3: SQLTransientConnectionException after waiting >= 300 ms? true
after close(): active = 0, idle = 2
```

In an application, the third "request" is a third concurrent HTTP request whose transaction cannot start — it waits `connection-timeout`, then fails (typically surfacing as `CannotCreateTransactionException` → 500).

## Database Connection Limits

Each connection costs database memory (PostgreSQL forks a process per connection; `max_connections` defaults to 100). The budget must hold for **all** instances:

```text
instances × maximum-pool-size  +  admin/migration/monitoring connections  ≤  database max_connections
e.g. 6 pods × 20 = 120  >  100   → connection errors when scaling out
```

Remedies: smaller pools per instance, a connection proxy/pooler (PgBouncer, RDS Proxy), read replicas for read traffic.

### Pool sizing

Bigger is not better: the database has limited CPU cores and disks, and too many concurrent queries cause contention. A widely quoted starting point from the HikariCP project is `connections ≈ (core_count × 2) + effective_spindle_count` **of the database server**; then measure (`pending` > 0 often, acquire time high → too small or transactions too long; database CPU saturated → too big or slow queries).

With **virtual threads** (Java 21), thousands of request threads may wait for the same 10–20 connections — the pool remains the concurrency limit, so long transactions hurt even more.

## Common Mistakes

- Very large pools (100+) per instance "for performance".
- Long transactions holding connections during remote calls or file processing.
- Connection leaks in manual JDBC code (not closing in `finally`/try-with-resources).
- `max-lifetime` longer than a firewall/database idle cut-off → broken connections ("Connection reset").
- Ignoring the multiplication of pool size by replica count.

## Common Interview Traps

- **"Closing a pooled connection closes the database connection."** It returns it to the pool.
- **"More connections = more throughput."** Beyond the database's capacity, latency and contention increase.
- **"Virtual threads remove the need to tune the pool."** They remove thread limits, not database connection limits.

## Key Takeaways

- Pooling reuses expensive connections; HikariCP is Boot's default (pool size 10, 30 s wait by default).
- Exhaustion symptoms: threads waiting `connection-timeout` then `SQLTransientConnectionException`.
- Size pools from database capacity, not request volume; multiply by instances; keep transactions short; watch `hikaricp.*` metrics.
