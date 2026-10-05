# Network Performance for Backend Systems — Interview Questions

## Beginner

### Q1. Why does a page with many small requests load slowly on a high-bandwidth connection?

**Style:** Why

<details>
<summary>Answer</summary>

The page is latency-bound, not bandwidth-bound. Each request needs at least one round trip, new connections need extra round trips (TCP and TLS handshakes), and sequential dependencies stack these up. Bandwidth only reduces the time to transfer bytes; RTT × number of round trips dominates.

</details>

## Intermediate

### Q2. A Spring Boot endpoint makes 1 query for an order and then 1 query per order line (N+1). The database is 1 ms away. What is the impact and fix?

**Style:** Scenario

<details>
<summary>Answer</summary>

With 200 lines that is 201 round trips ≈ 200 ms of pure network latency, plus per-query overhead and pool contention. Fix by fetching lines in one query (JOIN / fetch join / `IN (...)` batch), entity graphs or batch fetching, so the endpoint needs one or two round trips regardless of N.

</details>

### Q3. Why must every network call have timeouts?

**Style:** Why

<details>
<summary>Answer</summary>

Without a timeout, a slow or dead dependency (lost packets, a hung server, a dropped NAT mapping) keeps the caller's thread and connection waiting indefinitely. Under load those threads and pool connections pile up until the caller itself stops responding — a cascading failure. Connect and read timeouts bound the damage; retries with back-off and circuit breakers add resilience.

</details>

### Q4. Why look at p99 latency rather than the average?

<details>
<summary>Answer</summary>

Averages hide tail latency. A few slow requests (GC pauses, retransmissions, cold connections) affect real users, and when one request fans out to many services, the chance of hitting at least one slow call is high, so the tail of each dependency becomes the typical latency of the whole request.

</details>

## Advanced

### Q5. How would you diagnose whether an API's slowness is in the network or the server?

**Style:** Debugging

<details>
<summary>Answer</summary>

Break the time down: `curl -w` (or browser dev tools) for DNS lookup, TCP connect, TLS handshake, time to first byte and total time — long connect/TLS times point to network RTT or overloaded load balancers, long TTFB to server processing. On the server, use tracing spans and metrics: request handling time, DB query time, connection-pool wait time, downstream call latency, thread-pool saturation. Check retransmissions (`ss -ti`, packet captures) for loss. Compare from different locations to separate distance from server problems.

</details>
