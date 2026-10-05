# Load Balancing: L4 vs L7 — Interview Questions

## Beginner

### Q1. What is a load balancer and why is it used?

<details>
<summary>Answer</summary>

A component that receives client traffic on one address and distributes it across multiple backend servers, sending traffic only to healthy ones. It enables horizontal scaling, high availability (failed servers are skipped), zero-downtime deployments, and gives clients one stable endpoint; L7 balancers also terminate TLS and route by content.

</details>

### Q2. What is the difference between L4 and L7 load balancing?

**Style:** Comparison

<details>
<summary>Answer</summary>

An L4 balancer works at the transport layer: it sees IP addresses and ports and forwards whole TCP/UDP connections to a backend, without reading the payload — fast, protocol-agnostic, TLS usually passed through. An L7 balancer works at the application layer: it terminates TLS, parses HTTP and can route each request by path, host, headers or cookies, modify headers, rewrite, cache and rate-limit — more features, more processing.

</details>

## Intermediate

### Q3. Name common load-balancing algorithms and when to use them.

<details>
<summary>Answer</summary>

Round robin (equal servers, uniform requests); weighted round robin (different capacities, canary releases); least connections (long-lived or variable-duration requests); least response time (heterogeneous backends); IP/consistent hashing (affinity, cache locality); power-of-two random choices (large fleets).

</details>

### Q4. How does a load balancer detect that a backend is unhealthy?

<details>
<summary>Answer</summary>

Active health checks: periodically opening a TCP connection (L4) or requesting an HTTP endpoint such as `/actuator/health` expecting 200 (L7); after a configured number of failures the backend is taken out of rotation and re-added after successes. Many balancers also use passive checks — marking backends that produce connection errors or 5xx responses.

</details>

### Q5. What are sticky sessions and what are their drawbacks?

<details>
<summary>Answer</summary>

Session affinity keeps sending a client to the same backend (cookie- or IP-based), so in-memory session state stays available. Drawbacks: uneven load, lost sessions when that instance dies, harder scaling and deployments. Better: stateless authentication (JWT) or a shared session store (Redis/Spring Session).

</details>

## Advanced

### Q6. You need to route `/api/*` to Spring Boot and `/ws/*` WebSockets to a separate service, and balance PostgreSQL read replicas. Which load balancer types?

**Style:** Scenario

<details>
<summary>Answer</summary>

An L7 load balancer for the HTTP traffic: path-based routing for `/api` and `/ws` (with WebSocket upgrade support and least-connections for long-lived sockets). For PostgreSQL replicas, an L4 (TCP) balancer — or a database-aware proxy such as PgBouncer/HAProxy in TCP mode — because the database protocol is not HTTP; the balancer distributes connections, not queries.

</details>

### Q7. During deployments, some requests fail with 502 as old instances shut down. How do you fix it?

**Style:** Debugging

<details>
<summary>Answer</summary>

Instances stop while the LB still sends them traffic or while requests are in flight. Use graceful shutdown: on SIGTERM the instance marks readiness as down (Spring Boot readiness probe), the LB stops routing new requests after its health check/deregistration delay (connection draining), in-flight requests finish (`server.shutdown=graceful`), then the process exits. Also keep the backend keep-alive timeout longer than the LB's idle timeout.

</details>
