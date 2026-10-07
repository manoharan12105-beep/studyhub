# Connection Pooling and Database Bottlenecks — Interview Questions

## Beginner

### Q1. What is connection pooling and why is it needed?

**Style:** Direct

<details>
<summary>Answer</summary>

Keeping a set of open database connections that request threads borrow and return, instead of opening one per request. Opening connections is slow (handshakes, TLS, authentication, server-side process creation) and databases allow a limited number of them, so pooling lowers latency and protects the database.

</details>

## Intermediate

### Q2. How would you size a connection pool?

**Style:** How

<details>
<summary>Answer</summary>

Use Little's law: connections needed ≈ query rate × average query duration (for example 2,000 queries/s × 5 ms = 10), add headroom for peaks, then check the total across all instances (instances × pool size) against the database's capacity, which is roughly a small multiple of its CPU cores for active work. Tune from metrics such as wait time to borrow and database CPU.

</details>

### Q3. Why can a larger pool make things slower?

**Style:** Why

<details>
<summary>Answer</summary>

The database can only run as many queries in parallel as it has CPU and I/O capacity. Extra connections just queue inside it, add context switching, memory use and lock contention, so each query gets slower. A smaller pool with queueing in the application often gives better throughput and latency.

</details>

### Q4. What is the N+1 query problem?

**Style:** Direct

<details>
<summary>Answer</summary>

Fetching a list with one query and then running one additional query per item (1 query for 50 posts, then 50 queries for their authors). It multiplies round trips and database load. Fix by batching (`WHERE id IN (...)`), joining, or eager loading.

</details>

### Q5. What is read/write splitting and what risk does it bring?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Routing writes and freshness-critical reads to the primary, and other reads to replicas, to spread load. Because asynchronous replicas lag, a user may not see their own recent write when a read lands on a replica; route that user's reads to the primary for a short time after a write, or use session-level consistency features.

</details>

## Advanced

### Q6. You autoscale from 10 to 60 app instances during a sale and the database starts refusing connections. What happened and what is the fix?

**Style:** Debugging

<details>
<summary>Answer</summary>

Each instance opened its own pool, so total connections (60 × pool size) exceeded the database's `max_connections`. Fixes: put a pooler such as PgBouncer or RDS Proxy in front of the database, cap per-instance pools based on the total budget, move read traffic to replicas, and include the database connection budget in autoscaling limits.

</details>

### Q7. A single row (a global counter) is updated by every request and throughput has stalled. Why, and how would you fix it?

**Style:** Design

<details>
<summary>Answer</summary>

Every transaction must lock the same row, so updates serialise: throughput is limited by one row's lock hold time regardless of hardware. Fix with sharded counters (N rows, each request updates a random one, sum on read), buffering increments in memory or Redis and flushing in batches, or an approximate counter updated asynchronously.

</details>
