# Backend Request Flows — Interview Questions

## Intermediate

### Q1. Describe the network path of an API request from a browser to a Spring Boot service behind a load balancer.

**Style:** What happens internally

<details>
<summary>Answer</summary>

The browser resolves the API host (often a CNAME to the load balancer), opens TCP and TLS to the LB on 443 (or reuses an open HTTP/2 connection), and sends the HTTPS request; a cross-origin call may first trigger a CORS preflight. The LB terminates TLS, chooses a healthy instance by its algorithm and health checks, and forwards the request over a pooled connection, adding `X-Forwarded-For`/`X-Forwarded-Proto`. Tomcat hands it to a worker thread; Spring Security authenticates it; the controller runs, possibly calling other services and PostgreSQL through pooled connections; the response returns through the LB.

</details>

### Q2. Why does a Spring Boot application use a connection pool for PostgreSQL instead of connecting per query?

**Style:** Why

<details>
<summary>Answer</summary>

Each new connection requires DNS, a TCP handshake, often TLS, PostgreSQL authentication and the creation of a server backend process — many milliseconds and server resources. A pool (HikariCP) keeps authenticated connections ready, so each query only pays its own round trips, and it caps concurrency on the database.

</details>

## Advanced

### Q3. Your API's p99 latency is high only for requests that call a downstream service. What network-related causes would you check?

**Style:** Debugging

<details>
<summary>Answer</summary>

Whether the HTTP client is reused and pools connections (new TCP/TLS per call?), pool exhaustion or waiting for connections, missing or long timeouts, retries amplifying slowness, DNS lookups on each call, sequential calls that could be parallel, cross-zone/region placement, packet loss/retransmissions, and TLS handshakes due to short keep-alive timeouts. Tracing spans and client metrics show where the time goes.

</details>

### Q4. The application fails to reach PostgreSQL with "connect timed out" after moving to a new subnet, while the DB's own health is fine. What do you check?

**Style:** Scenario

<details>
<summary>Answer</summary>

A timeout means packets are dropped or not routed: the database security group/firewall must allow 5432 from the new subnet (or the app's security group), NACLs must allow the traffic and return ephemeral ports, route tables/peering must connect the subnets, and the app must resolve the right DB address. Then check `pg_hba.conf` (that would give an authentication error, not a timeout).

</details>

### Q5. Why might all requests in your logs show the same client IP, and how do you fix logging and rate limiting?

<details>
<summary>Answer</summary>

The instance's TCP peer is the load balancer, so `getRemoteAddr()` returns the LB's IP. Configure Spring Boot to use forwarded headers (`server.forward-headers-strategy=native` or `framework`), trusting them only from the LB's addresses, so `X-Forwarded-For` provides the real client IP for logs and rate limiting.

</details>
