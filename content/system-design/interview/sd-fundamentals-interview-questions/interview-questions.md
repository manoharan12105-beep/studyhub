# Interview Questions: Foundations and Communication — Interview Questions

## Beginner

### Q1. A startup with 2,000 users asks whether it needs Kubernetes, microservices and Kafka. What do you advise?

**Style:** Scenario

<details>
<summary>Answer</summary>

No. A modular monolith on a couple of instances behind a managed load balancer, one managed relational database with backups, object storage for files and basic monitoring will serve 2,000 users with far less cost and operational risk. Keep module boundaries clean so parts can be extracted later; add components when a measured requirement demands them.

</details>

### Q2. What is the difference between latency and throughput?

**Style:** Comparison

<details>
<summary>Answer</summary>

Latency is how long one request takes; throughput is how many requests (or bytes) the system completes per unit time. They are related but distinct: batching can raise throughput while raising latency, and a system can have low latency at low load but poor throughput limits. Little's law connects them: concurrency = throughput × latency.

</details>

### Q3. Your service has 99.95 % availability. Is that good?

**Style:** Trap

<details>
<summary>Answer</summary>

It depends on the requirement and how it is measured. 99.95 % allows about 22 minutes of downtime a month — fine for many consumer apps, too little for some payment systems, more than enough for an internal tool. Also ask whether it is measured from the user's perspective (successful requests) or just server uptime.

</details>

### Q4. What does a load balancer need from application servers to work well?

**Style:** How

<details>
<summary>Answer</summary>

Servers should be stateless (any server can handle any request), expose a meaningful health endpoint, support graceful shutdown so connections can be drained, and be roughly equal in capacity (or have weights configured). Shared state — sessions, uploads — must live outside the servers.

</details>

### Q5. Why do we put an API layer between clients and the database?

**Style:** Why

<details>
<summary>Answer</summary>

To enforce authentication, authorisation and validation; hide and evolve the schema; centralise caching, rate limiting and monitoring; protect database connections; and give every client type (web, iOS, partners) one stable contract over HTTP.

</details>

### Q6. What is the difference between a CDN and a reverse proxy?

**Style:** Comparison

<details>
<summary>Answer</summary>

Both sit in front of origin servers and handle requests for them. A reverse proxy (Nginx, a load balancer) usually sits in your data centre and handles TLS, routing, balancing and some caching. A CDN is a globally distributed network of caching reverse proxies at the edge, near users, focused on serving cacheable content with low latency and offloading bandwidth.

</details>

### Q7. What status code should a rate-limited request receive, and what should the client do?

**Style:** Direct

<details>
<summary>Answer</summary>

429 Too Many Requests, ideally with `Retry-After`. The client should wait that long (or back off exponentially with jitter) before retrying, rather than retrying immediately.

</details>

### Q8. Give an example of a functional and a non-functional requirement for a ride-hailing app.

**Style:** Direct

<details>
<summary>Answer</summary>

Functional: a rider can request a ride and see the assigned driver. Non-functional: a driver match is found within 5 seconds for 95 % of requests in covered areas, and location updates reach the rider within 2 seconds.

</details>

## Intermediate

### Q9. Users in Asia report your API is slow; users in the US do not. Servers are in Virginia. What is happening and what can you do?

**Style:** Debugging

<details>
<summary>Answer</summary>

Round-trip latency across the Pacific (around 150–250 ms) multiplied by handshakes and sequential calls. Short term: a CDN or edge proxy to terminate TLS close to users and cache static and cacheable API responses, connection reuse, HTTP/2, and fewer round trips per page (aggregated endpoints). Longer term: deploy a region in Asia with replicated read data and geo-routing.

</details>

### Q10. Estimate the requests per second for a service with 20 million DAU, each making 30 API calls a day, and the peak with factor 4.

**Style:** Output/prediction

<details>
<summary>Answer</summary>

20 M × 30 = 600 M requests/day ÷ 86,400 ≈ 6,900/s average; × 4 ≈ 27,800/s at peak — call it about 7,000 and 28,000.

</details>

### Q11. Why is horizontal scaling usually combined with autoscaling and statelessness?

**Style:** Why

<details>
<summary>Answer</summary>

Horizontal scaling adds identical instances; autoscaling adds and removes them automatically as load changes, saving cost at quiet times. Both only work if instances are stateless and interchangeable — otherwise scaling in loses sessions and new instances can't serve existing users.

</details>

### Q12. When would you choose gRPC for internal calls but REST externally?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Internally, services benefit from gRPC's compact binary encoding, HTTP/2 multiplexing, streaming and typed generated clients under tight latency budgets. Externally, REST over JSON is universally accessible to browsers, partners and tools, easy to debug and cacheable. A gateway often translates between them.

</details>

### Q13. What breaks if you use offset pagination on a feed that changes constantly?

**Style:** What happens if

<details>
<summary>Answer</summary>

New items inserted at the top shift every later item, so pages overlap (duplicates) or skip items, and deep pages become slow because the database must skip all preceding rows. Cursor pagination on a stable sort key (timestamp plus id) fixes both.

</details>

### Q14. Where would you terminate TLS in a microservices system, and why?

**Style:** Design

<details>
<summary>Answer</summary>

At the edge — CDN or load balancer/API gateway — for central certificate management, offloading crypto from services, and enabling L7 routing; then re-encrypt service-to-service traffic (often mutual TLS via a service mesh) when zero-trust or compliance requires encryption inside the network.

</details>

### Q15. How would you deliver live score updates to 5 million viewers?

**Style:** Design

<details>
<summary>Answer</summary>

Updates are one-way and identical for everyone, so either Server-Sent Events from a fleet of streaming servers fed by pub/sub, or short polling of a tiny CDN-cached JSON endpoint every few seconds (the CDN absorbs nearly all requests). WebSockets would work but add bidirectional state nobody needs.

</details>

### Q16. How would you rate-limit an API consistently across 30 gateway instances?

**Style:** Design

<details>
<summary>Answer</summary>

Keep per-key counters in a shared store such as Redis and update them atomically (a Lua script implementing a token bucket, or INCR with expiry), with a small local cache for keys already over the limit, short timeouts on Redis calls, and a decided fail-open or fail-closed behaviour if Redis is unavailable. Alternatively route each key consistently to one gateway.

</details>

### Q17. What is an SLO, and how does it change engineering decisions?

**Style:** How

<details>
<summary>Answer</summary>

An internal reliability target for a user-facing indicator (for example 99.9 % of requests succeed within 300 ms over 30 days). It sets an error budget: while there is budget, teams ship; when it is spent, they prioritise reliability. It also decides architecture — a 99.99 % target requires automatic failover and multi-zone redundancy that 99 % does not.

</details>

## Advanced

### Q18. A request passes through a gateway, three services and a database, each 99.9 % available. What is the end-to-end availability, and how do you improve it?

**Style:** Output/prediction

<details>
<summary>Answer</summary>

Five components in series: 0.999⁵ ≈ 99.5 %. Improve by making each component redundant (instances across zones), shortening synchronous chains (parallel calls, merging services), making optional dependencies non-blocking with timeouts and fallbacks, and moving non-essential work to asynchronous queues.

</details>

### Q19. Design the API for a "like" feature so it is safe to retry.

**Style:** Design

<details>
<summary>Answer</summary>

Model the like as a sub-resource with idempotent methods: `PUT /photos/{id}/like` creates it if absent (repeat calls do nothing) and `DELETE /photos/{id}/like` removes it. Store likes with a unique (user, photo) key so duplicates are impossible, and update counts only when a row is actually created or deleted.

</details>

### Q20. When does an API gateway become a liability?

**Style:** Trade-off

<details>
<summary>Answer</summary>

When it accumulates business logic every team must change (a shared monolith and deployment bottleneck), when it is a single non-redundant instance (single point of failure), when one slow backend can exhaust its resources (no per-route timeouts or bulkheads), or when it adds heavy transformations to every request. Keep it thin, stateless, redundant and isolated per route.

</details>

### Q21. Your DNS TTL is 24 hours and you need to move to a new load balancer IP tomorrow. What do you do?

**Style:** Scenario

<details>
<summary>Answer</summary>

Lower the TTL now (to a few minutes) so caches expire within a day, switch the record tomorrow, keep the old load balancer running and forwarding for a while because some resolvers and long-lived clients ignore TTLs, monitor traffic on the old IP, then decommission it and raise the TTL again.

</details>

### Q22. You must choose between long polling and WebSockets for a notification system on a corporate network with strict proxies. What do you consider?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Some proxies and firewalls block or break WebSocket upgrades or kill idle connections; long polling and SSE are ordinary HTTP and pass through more reliably. Notifications are mostly server-to-client, so SSE (with long-polling fallback) is a strong choice; WebSockets with fallback libraries are another option if bidirectional messaging is needed.

</details>

### Q23. Why can adding more application servers make a system slower?

**Style:** Debugging

<details>
<summary>Answer</summary>

If the bottleneck is a shared resource — the database, a cache node, a lock, a downstream service — more servers only increase contention: more connections, more concurrent queries and lock waits, and possibly exhausted connection limits. Throughput stays flat while latency rises. Find and fix the shared bottleneck first.

</details>

### Q24. How do you decide between a monolith and microservices for a team of 40 engineers building a marketplace?

**Style:** Design

<details>
<summary>Answer</summary>

Start from the domains and their needs: if teams map to clear domains (catalogue, orders, payments, search) and are blocking each other in one codebase, or parts have very different scaling or reliability needs, extract those as services — beginning with the most independent ones. Keep a modular monolith for the rest. Ensure the platform basics (CI/CD, observability, tracing) exist before splitting widely.

</details>

### Q25. The product team wants "real-time" dashboards. What questions do you ask before choosing a technology?

**Style:** Follow-up

<details>
<summary>Answer</summary>

How fresh must the data be (milliseconds, seconds, a minute)? How many viewers and how often does data change? Is it the same data for everyone or per user? What happens if an update is missed? A one-minute refresh via polling of a cached endpoint may satisfy "real-time" at a fraction of the cost of WebSockets and streaming infrastructure.

</details>
