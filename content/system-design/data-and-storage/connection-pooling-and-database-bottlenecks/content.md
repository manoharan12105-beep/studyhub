# Connection Pooling and Database Bottlenecks

**Module:** Data and Storage · **Interview priority:** Frequently asked

## What Is It?

A **connection pool** keeps a set of open database connections that application threads borrow for a query and return afterwards, instead of opening a new connection for every request. **Database bottlenecks** are the ways the database — usually the one shared, stateful component — becomes the limit on the whole system's throughput.

## Why It Exists

Opening a database connection is expensive: a TCP handshake, often TLS, authentication, and server-side setup (PostgreSQL starts a whole backend process per connection, with its own memory). Doing that per request adds milliseconds and burns database CPU. And databases allow only a limited number of connections (`max_connections` is commonly in the hundreds), so they must be shared carefully.

## How It Works

### How a pool works

```text
request thread ── borrow ──► [ conn1 conn2 conn3 … conn10 ] ──► database
               ◄── return ──
pool full and all busy → the thread waits up to a timeout, then fails fast
```

Key settings (HikariCP and similar pools): **maximum pool size**, **minimum idle**, **connection timeout** (how long a thread waits to borrow), **max lifetime** (recycle connections periodically), and **validation** of idle connections.

### How big should the pool be?

Bigger is not better. A database with 8 cores can only execute about that many queries truly in parallel; hundreds of active connections just queue inside the database, adding context switching and lock contention.

**Little's law** gives the needed concurrency: `connections in use ≈ query rate × average query time`.

```text
2,000 queries/s × 5 ms = 10 connections busy on average
Plan for peaks and variance: a pool of ~15–20 per service, not 200
```

A common starting point for PostgreSQL is about `2 × CPU cores` total active connections on the server, then tune by measurement.

### Many app servers, one database

Each app instance has its own pool, so the total is `instances × pool size`. Autoscaling from 10 to 50 instances with pools of 20 means up to 1,000 connections — likely beyond the database limit. Solutions:

- **Smaller pools** per instance, sized from the total budget.
- An **external pooler** (PgBouncer, RDS Proxy) between apps and the database: thousands of client connections share a small number of real database connections (transaction pooling).
- **Read replicas** to spread read connections ([Replication](../../scaling-and-distribution/database-replication/content.md)).

### Common database bottlenecks

| Bottleneck | Symptom | Fix |
|------------|---------|-----|
| Missing indexes / bad queries | High CPU and I/O, slow-query log full | Index, rewrite, `EXPLAIN ANALYZE` |
| N+1 queries | Hundreds of small queries per request | Batch (`WHERE id IN (…)`), joins, data loaders |
| Connection exhaustion | "too many clients", pool timeouts while CPU is low | Pool sizing, pooler, fewer instances' connections |
| Lock contention / hot rows | Many transactions waiting on the same row (a global counter, a popular item's stock) | Shorter transactions, sharded counters, queueing writes |
| Long transactions | Locks held, bloat, replicas lag | Keep transactions short; no network calls inside them |
| Read load | High CPU from many reads | Cache, read replicas |
| Write load / data size | Primary saturated on writes or storage | Vertical scaling, batching, partitioning, sharding |

### Read/write splitting

Send writes (and reads that must see the latest data) to the primary, and other reads to replicas. Frameworks do this by routing read-only transactions to a replica data source. Watch for [replication lag](../../scaling-and-distribution/sync-async-replication-and-lag/content.md): a user who just saved something and then reads from a lagging replica may not see it.

**Think about it:** during a traffic spike, API latency jumps to 30 seconds, yet database CPU is only 20 %. Logs show "Connection is not available, request timed out after 30000 ms". What is happening?

<details>
<summary>Answer</summary>

The pool is exhausted: all connections are borrowed and threads wait the full 30 s timeout to get one. Likely causes: slow queries or long transactions holding connections, a downstream call made while holding a connection, or a pool too small for the request rate. Fix the holders (shorter transactions, no remote calls inside them), size the pool from Little's law, and lower the borrow timeout so requests fail fast instead of piling up.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** "Raise the pool size to 500 to fix timeouts." If the database is the bottleneck, more connections make it slower. Find out why connections are held so long.

## Interview Follow-up

- *"What breaks first when you scale out app servers?"* Often the database: connection limits (each instance's pool adds up) and then CPU from the extra concurrent queries.

## Key Takeaways

- Pools reuse a bounded set of connections: lower latency and protection of the database's connection limit.
- Size pools by Little's law (rate × query time) plus headroom; total connections = instances × pool size.
- Use a pooler (PgBouncer) when many instances share one database.
- Usual database bottlenecks: bad queries, N+1, connection exhaustion, hot rows, long transactions, read load, write load.
