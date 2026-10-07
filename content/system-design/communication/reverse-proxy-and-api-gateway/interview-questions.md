# Reverse Proxy and API Gateway — Interview Questions

## Beginner

### Q1. What is the difference between a forward proxy and a reverse proxy?

**Style:** Comparison

<details>
<summary>Answer</summary>

A forward proxy sits in front of clients and makes requests on their behalf (outbound filtering, anonymity, caching for a network of users); destination servers see the proxy. A reverse proxy sits in front of servers and receives requests on their behalf (TLS termination, load balancing, caching, protection); clients see the proxy, not the backends.

</details>

### Q2. What is an API gateway?

**Style:** Direct

<details>
<summary>Answer</summary>

A reverse proxy that serves as the single entry point for an API, typically in front of many microservices, handling cross-cutting concerns: routing by path and version, authentication, rate limiting, request aggregation and transformation, logging, metrics and tracing.

</details>

## Intermediate

### Q3. Is a load balancer a reverse proxy?

**Style:** Trap

<details>
<summary>Answer</summary>

Yes. Any component that receives client requests on behalf of backend servers is a reverse proxy; a load balancer is one whose main job is spreading traffic across healthy servers. API gateways and CDN edges are reverse proxies too, with different specialities.

</details>

### Q4. What should and should not live in an API gateway?

**Style:** Design

<details>
<summary>Answer</summary>

Should: routing, TLS, authentication (token validation), coarse authorisation, rate limiting, request/response transformation, aggregation for clients, logging, metrics and tracing. Should not: business logic such as pricing or order validation — that couples all services to the gateway and turns it into a shared monolith every team must change.

</details>

### Q5. What is a backend for frontend (BFF)?

**Style:** Direct

<details>
<summary>Answer</summary>

A gateway or thin service dedicated to one client type (web, mobile, TV) that aggregates calls to internal services and shapes responses for that client's screens, so each client gets exactly what it needs in few round trips without forcing one generic API on all of them.

</details>

## Advanced

### Q6. How do you keep the API gateway from becoming a single point of failure and a bottleneck?

**Style:** How

<details>
<summary>Answer</summary>

Run multiple stateless gateway instances across availability zones behind a load balancer (or use a managed, regional gateway), keep shared state such as rate-limit counters in an external store, keep logic thin, use per-route timeouts and circuit breakers so one slow service cannot exhaust gateway resources, autoscale on load, and monitor gateway latency separately.

</details>
