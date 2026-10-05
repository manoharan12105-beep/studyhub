# Keep-Alive and Connection Pooling — Interview Questions

## Beginner

### Q1. What is HTTP keep-alive?

<details>
<summary>Answer</summary>

Reusing a single TCP (and TLS) connection for multiple HTTP requests and responses instead of closing it after each one. It is the default in HTTP/1.1 and saves the handshake round trips, TLS CPU work and slow-start ramp-up for every subsequent request.

</details>

### Q2. What is a connection pool and why is it used?

<details>
<summary>Answer</summary>

A cache of open connections (to a database or HTTP service) that application threads borrow and return. Creating a database connection involves TCP and TLS handshakes, authentication and server-side setup, so reusing connections makes queries much faster; the pool size also limits how much concurrent load reaches the database.

</details>

## Intermediate

### Q3. What happens when a HikariCP pool is exhausted?

**Style:** What happens internally

<details>
<summary>Answer</summary>

All connections are in use, so the next thread asking for one waits up to `connectionTimeout` (30 s by default); if none is returned in time, it fails with "Connection is not available, request timed out". Causes: slow queries holding connections, connection leaks, long transactions, or more concurrent requests than the pool supports. Response times climb sharply before errors appear.

</details>

### Q4. What is the difference between HTTP keep-alive and TCP keepalive?

**Style:** Comparison

<details>
<summary>Answer</summary>

HTTP keep-alive (persistent connections) reuses a connection for further HTTP requests. TCP keepalive is an OS-level option that sends small probe segments on an idle connection to detect a dead peer and keep middlebox (NAT/firewall) state alive. They are independent.

</details>

## Advanced

### Q5. After a quiet night, the first few requests of the morning fail with "connection reset" when querying the database; then everything works. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

Pooled connections sat idle longer than a firewall's, NAT gateway's or the database's idle timeout, which silently dropped them. The pool still considered them valid; the first use hit a dead connection (RST or timeout), after which the pool replaced them. Fix: set `maxLifetime`/`idleTimeout` below those limits, enable keep-alive probes (`keepaliveTime`), and rely on connection validation.

</details>

### Q6. Ten application instances each have a pool of 50 connections to one PostgreSQL server. What could go wrong?

**Style:** Scenario

<details>
<summary>Answer</summary>

Up to 500 connections. PostgreSQL creates a backend process per connection, so memory use and context switching grow, `max_connections` may be exceeded (new instances fail to start), and throughput can drop because the database runs too many queries concurrently. Use smaller pools sized from measurements, and a server-side pooler such as PgBouncer when many instances share the database.

</details>
