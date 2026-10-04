# Connection Pooling and HikariCP — Interview Questions

## Beginner

### Q1. What is connection pooling and why is it needed?

<details>
<summary>Answer</summary>

Keeping a set of reusable open database connections and lending them to threads, instead of opening and closing a physical connection per request. Opening connections is slow (network handshakes, authentication, server resources); pooling makes acquisition cheap and also limits concurrent database load.

</details>

### Q2. What is HikariCP?

<details>
<summary>Answer</summary>

A fast, lightweight JDBC connection pool and Spring Boot's default `DataSource` implementation, configured with `spring.datasource.hikari.*` properties (pool size, timeouts, lifetimes, leak detection).

</details>

### Q3. What does "Connection is not available, request timed out after 30000ms" mean?

<details>
<summary>Answer</summary>

All pooled connections were in use and the requesting thread waited the full `connection-timeout` (30 s default) without one being returned. Causes: pool too small for the load, slow queries, long transactions (including remote calls inside them), or connection leaks.

</details>

## Intermediate

### Q4. How do you choose the pool size?

<details>
<summary>Answer</summary>

From the database's capacity rather than the number of users: a small multiple of the database server's cores is a common starting point (HikariCP's guidance: about cores × 2 + effective disks), then tune with metrics — pending threads and acquire time versus database CPU and query latency. Ensure instances × pool size stays within the database's connection limit.

</details>

### Q5. How would you find a connection leak?

<details>
<summary>Answer</summary>

Enable `spring.datasource.hikari.leak-detection-threshold` (e.g. 20 s): Hikari logs a warning with the stack trace of the code that borrowed a connection and held it too long. Watch `hikaricp.connections.active` staying at the maximum while traffic is low. Fix by using try-with-resources or Spring templates/repositories instead of manual JDBC.

</details>

### Q6. Why should `max-lifetime` be shorter than database or firewall timeouts?

<details>
<summary>Answer</summary>

If a firewall, load balancer or the database silently drops idle connections after, say, 15 minutes, the pool may hand out a dead connection, causing errors. Retiring connections before that limit (and keeping `idle-timeout`/keepalive appropriate) avoids it.

</details>

## Advanced

### Q7. You scale a service from 4 to 12 pods and the database starts refusing connections. Why?

<details>
<summary>Answer</summary>

Total connections = pods × pool size. With 12 × 20 = 240 connections, the database's `max_connections` (e.g. 100–200) is exceeded. Reduce per-pod pool size, add a connection pooler such as PgBouncer or RDS Proxy, or scale the database. Plan pool sizes together with autoscaling limits.

</details>

### Q8. How do virtual threads interact with the connection pool?

<details>
<summary>Answer</summary>

Virtual threads make it cheap to have thousands of concurrent blocking requests, but each database operation still needs one of the pool's few connections. Requests queue on the pool, so pool size and transaction duration become the main throughput limit; set `connection-timeout` thoughtfully and keep transactions short. Some drivers or `synchronized` sections can also pin carrier threads on older JDKs.

</details>
