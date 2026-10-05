# Network Performance for Backend Systems

**Module:** Performance and Distributed Networking · **Interview priority:** Frequently asked

## What Is It?

How latency, bandwidth, throughput, RTT, jitter and packet loss ([defined here](../../network-fundamentals/network-performance-metrics/content.md)) show up in real backend systems — and how to reason about where the time in a request goes.

## Why It Exists

Most backend "slowness" is not CPU. A request that crosses five services and makes twenty database round trips is dominated by **network round trips**. Counting round trips and knowing their cost is one of the most useful performance skills a backend developer can have.

## How It Works

### Rough numbers to reason with

| Path | Typical RTT |
|------|-------------|
| Same host (loopback) | ~0.05 ms |
| Same data centre / availability zone | 0.1–0.5 ms |
| Between zones in one cloud region | ~0.5–2 ms |
| Across a country (e.g. Chennai ↔ Delhi) | 30–50 ms |
| Between continents (India ↔ US) | 200–300 ms |
| Mobile 4G last mile | adds 30–60 ms |

The speed of light in fibre (~200,000 km/s) puts a hard floor of ~1 ms per 100 km of round trip; real routes are longer than straight lines.

### Anatomy of one API call from a browser (cold, new connection)

```text
DNS lookup                      1 RTT to the resolver (0 if cached)
TCP handshake                   1 RTT
TLS 1.3 handshake               1 RTT
HTTP request → first byte       1 RTT + server time
Download the body               (size ÷ throughput) + extra RTTs while TCP slow start grows cwnd
```

With 100 ms RTT: ≈ 400 ms before the first byte even if the server answers instantly. With a reused connection: ≈ 100 ms. **Connection reuse and fewer round trips matter more than bandwidth.**

### Inside the backend: round trips multiply

```text
Spring Boot handler
 ├─ SELECT order            ── 0.5 ms RTT to PostgreSQL
 ├─ for each of 50 items:
 │     SELECT product       ── 50 × 0.5 ms = 25 ms   ← N+1 queries
 ├─ call pricing service    ── 2 ms (another zone)
 └─ call inventory service  ── 2 ms
```

Fixes are about **removing round trips**: join or batch queries (one query instead of 51), call independent services **in parallel**, cache, and keep services that talk a lot in the same zone.

### Bandwidth-bound vs latency-bound

| Symptom | Bound by | Fix |
|---------|----------|-----|
| Large file/report downloads slow, small requests fine | Bandwidth/throughput | Compression, CDN, bigger links, fewer bytes (pagination, smaller JSON) |
| Many small requests slow even on a fast network | Latency (RTT × round trips) | Batching, parallelism, connection reuse, caching, move closer (region, CDN) |
| Erratic slowness, timeouts under load | Queuing, packet loss, pool exhaustion | Capacity, timeouts, back-pressure, fix the bottleneck |

### Finding the bottleneck

A system is only as fast as its narrowest point. Typical network-related bottlenecks:

- **Connection pools** exhausted (requests wait for a free DB or HTTP connection).
- **Thread pools** full of threads blocked on slow downstream calls.
- **NAT gateway / load balancer** limits, ephemeral port exhaustion.
- **Packet loss** on a link (retransmissions collapse TCP throughput).
- **Cross-region or cross-zone calls** in a hot path.
- **DNS** lookups without caching.

### Timeouts protect everything

Every network call needs **connect** and **read** timeouts. Without them, one slow dependency holds threads and connections until the whole service stalls (cascading failure). Combine with retries (idempotent calls only, with back-off and jitter) and circuit breakers.

### Percentiles, not averages

Report **p50, p95, p99** latency. Averages hide the slow tail that users notice; and in a request that fans out to many services, the slowest dependency decides the response time.

## Real World

- Put the Spring Boot app and its PostgreSQL in the same region and zone; a cross-region database turns every query into a 50–200 ms trip.
- Use `WebClient`/`CompletableFuture` to call independent downstream services concurrently.
- Enable gzip/Brotli compression for large JSON responses (`server.compression.enabled=true`).
- Measure with distributed tracing (OpenTelemetry), `curl -w` timings, and connection-pool metrics (HikariCP `pending` threads).

## Common Traps

- **"Upgrade bandwidth to fix slow APIs."** Most API latency is round trips, not bytes.
- **"The network is fast inside the data centre, so round trips are free."** 0.5 ms × 1,000 queries = 500 ms.
- **"No timeout means more reliable."** It means a slow dependency can hang your service forever.

## Interview Follow-up

- *"Your API is slow; how do you find out if it is the network?"* Trace the request: DNS, connect, TLS, time to first byte (`curl -w`), then server-side spans for DB and downstream calls; look at pool wait times and retransmissions.
- *"How do you reduce latency for global users?"* CDN/edge, regional deployments, fewer round trips, connection reuse, HTTP/2–3.

## Key Takeaways

- Latency = RTT × number of round trips; most backend slowness is round trips.
- A new HTTPS connection costs ~3 RTTs before the first byte; reuse connections.
- Remove round trips: batch, join, parallelise, cache, co-locate.
- Always set timeouts; watch p95/p99 and pool waits; find the single narrowest bottleneck.
