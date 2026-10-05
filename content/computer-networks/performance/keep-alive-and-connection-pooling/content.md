# Keep-Alive and Connection Pooling

**Module:** Performance and Distributed Networking · **Interview priority:** Frequently asked

## What Is It?

- **Keep-alive (persistent connections):** reuse one TCP (and TLS) connection for many HTTP requests instead of opening a new one each time.
- **Connection pooling:** keep a set of already-open connections to a server (database, HTTP API) and lend them to requests as needed, returning them to the pool afterwards.

## Why It Exists

Opening a connection is expensive:

| Cost of a new connection | Typical |
|--------------------------|---------|
| TCP three-way handshake | 1 RTT |
| TLS handshake | +1 RTT (TLS 1.3) / +2 (TLS 1.2) + CPU for key exchange |
| Database authentication (PostgreSQL startup, SCRAM password exchange) | Several more round trips + server process/backend creation |
| TCP slow start | First responses limited to a small window |
| Closing | TIME_WAIT sockets on the closing side, ephemeral ports tied up |

Reusing connections removes all of these from every request after the first.

## How It Works

### HTTP keep-alive

- **HTTP/1.1** keeps connections open by default; `Connection: close` asks to close after the response.
- The client sends the next request on the same connection after reading the previous response (one at a time per connection in HTTP/1.1; many concurrent streams in **HTTP/2**).
- Servers close idle connections after a **keep-alive timeout** (Tomcat's `keepAliveTimeout`, Nginx's `keepalive_timeout`, 75 s by default); load balancers have their own idle timeouts.

```text
Without keep-alive:  [TCP][TLS][req→resp][close]  [TCP][TLS][req→resp][close]  …
With keep-alive:     [TCP][TLS][req→resp][req→resp][req→resp] … [idle timeout → close]
```

### Connection pools

```text
          request threads                    pool (max 10)                 PostgreSQL
 thread A ── borrow ──►  [conn1][conn2][conn3] … [conn10]  ═══ open TCP connections ═══►
 thread A ◄─ return ───        (idle connections wait to be reused)
 thread K ── borrow ──►  all busy → waits up to connectionTimeout → error
```

A pool manages:

| Setting (HikariCP names) | Meaning |
|--------------------------|---------|
| `maximumPoolSize` | Upper limit of open connections (Spring Boot/HikariCP default 10) |
| `minimumIdle` | Connections kept warm |
| `connectionTimeout` | How long a thread waits for a free connection before failing (default 30 s) |
| `idleTimeout` | Close connections idle longer than this |
| `maxLifetime` | Retire connections after this age (default 30 min) — must be **shorter** than any database, firewall, NAT or load-balancer idle/connection limit |
| keep-alive / validation | Probe idle connections so dead ones are discovered before use |

**Database pools:** HikariCP (Spring Boot default for JDBC). **HTTP client pools:** Apache HttpClient, OkHttp, Reactor Netty (`WebClient`), and the JDK `HttpClient` all pool connections — **if you reuse one client instance**.

### Sizing a pool

More is not better. A database can efficiently run only a limited number of active queries (roughly related to its CPU cores and disks). A common starting point is a small pool (10–20 per app instance) and measuring:

```text
total DB connections = pool size × number of app instances
```

Ten instances × 50 connections = 500 connections — more than many PostgreSQL servers handle well (each connection is a backend process). Use a server-side pooler (PgBouncer) if many instances must share a database.

### Pool and keep-alive failure modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Connection is not available, request timed out after 30000ms` | Pool exhausted: slow queries, leaks, too many concurrent requests | Fix slow queries/leaks, close connections (try-with-resources), size the pool, add timeouts |
| Occasional errors on the first query after idle periods ("connection reset", "broken pipe") | A firewall/NAT/LB silently dropped an idle connection the pool still holds | `maxLifetime` and keep-alive shorter than those idle timeouts; connection validation |
| Rising `CLOSE_WAIT` sockets | Application not closing connections/responses | Fix the leak |
| Thousands of `TIME_WAIT` and port exhaustion | New connection per request | Reuse connections (pool / single shared HTTP client) |
| Intermittent 502s behind a load balancer | Backend closes idle keep-alive connections before the LB does | Backend keep-alive timeout **longer** than the LB idle timeout |

## Real World

```java
// Illustrative fragment: reuse ONE HttpClient for the whole application so it can pool connections
private static final HttpClient CLIENT = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(2))
        .build();
```

```properties
# Illustrative: Spring Boot + HikariCP
spring.datasource.hikari.maximum-pool-size=15
spring.datasource.hikari.connection-timeout=3000
spring.datasource.hikari.max-lifetime=1500000
spring.datasource.hikari.keepalive-time=300000
```

A `new RestTemplate()`/`HttpClient` per request — or not closing response bodies — defeats pooling and causes the TIME_WAIT and CLOSE_WAIT problems above.

## Common Traps

- **"A bigger pool makes the database faster."** Beyond a point, more connections add contention and memory; throughput can drop.
- **"Pooled connections stay valid forever."** Middleboxes and servers close idle connections; pools must retire and validate them.
- **"Keep-alive is the same as TCP keepalive."** HTTP keep-alive = reusing a connection for more requests. TCP keepalive = periodic probes on an idle connection to detect a dead peer (and keep NAT entries alive).

## Interview Follow-up

- *"Why use a connection pool for the database?"* Avoid connect + TLS + authentication + backend startup cost per query, and cap concurrent load on the database.
- *"What happens when the pool is exhausted?"* Threads wait up to the connection timeout, then fail; latency rises sharply.

## Key Takeaways

- New connections cost handshakes, authentication and slow start; reuse them.
- HTTP keep-alive reuses connections (HTTP/2 multiplexes on one); pools keep ready connections for databases and HTTP clients.
- Size pools deliberately; total connections = pool × instances.
- Retire/validate pooled connections before middlebox idle timeouts; backend keep-alive > LB idle timeout.
