# Reverse Proxy and API Gateway

**Module:** Communication and APIs · **Interview priority:** Frequently asked

## What Is It?

A **proxy** is a server that sits between a client and another server and forwards traffic. The direction it serves decides its name:

- A **forward proxy** acts on behalf of **clients**: a company's outbound proxy that filters and logs employees' web access, or a VPN-like egress gateway. Servers see the proxy, not the clients.
- A **reverse proxy** acts on behalf of **servers**: it receives requests from the Internet and forwards them to backend servers. Clients see the proxy, not the backends. Nginx, HAProxy and Envoy are common reverse proxies; a **load balancer** is a reverse proxy whose main job is spreading traffic.
- An **API gateway** is a reverse proxy specialised for APIs, usually in front of many microservices, that adds API-level concerns: authentication, rate limiting, routing by path and version, request transformation and aggregation.

```text
Forward proxy:   [employees] ──► forward proxy ──► Internet sites
Reverse proxy:   Internet clients ──► reverse proxy ──► [web servers]
API gateway:     mobile/web/partners ──► API gateway ──┬─► /users   → user service
                                                       ├─► /orders  → order service
                                                       └─► /search  → search service
```

## Why It Exists

Putting one component in front of the backends gives a single, stable entry point and one place to apply cross-cutting concerns, instead of re-implementing them in every service.

## How It Works

### What a reverse proxy typically does

- **TLS termination** and certificate management.
- **Load balancing** and health checks across backends.
- **Caching** of responses and serving static files.
- **Compression**, request buffering (protecting slow backends from slow clients), timeouts.
- **Security:** hides backend addresses, filters bad requests, blocks known attackers (often with a web application firewall).

### What an API gateway adds

| Concern | Example |
|---------|---------|
| Routing | `/v1/orders/*` → order service; `/v2/orders/*` → new order service |
| Authentication | Validate the JWT or API key once, pass the user ID to services |
| Rate limiting and quotas | 100 requests/min on the free plan ([Rate Limiting](../rate-limiting/content.md)) |
| Aggregation | One `/home` call fans out to profile, feed and notification services |
| Transformation | REST ↔ gRPC, header rewriting, response shaping per client |
| Observability | Request logs, metrics, trace IDs for every call |

A **backend for frontend (BFF)** is a gateway built for one client type (web, iOS, TV) that shapes responses for that client.

### Keep business logic out

The gateway should route, protect and observe; it should not decide discounts or validate orders. Business logic in the gateway couples every service to one shared component that every team must change and deploy.

**Think about it:** every request passes through the gateway. What risks does that create, and how do you reduce them?

<details>
<summary>Answer</summary>

It is a potential **single point of failure** and **bottleneck**, and adds a network hop of latency. Run several gateway instances behind a load balancer (or use a managed, multi-zone gateway), keep the gateway stateless (rate-limit counters in Redis), keep its logic thin, set timeouts per route, and monitor its latency and error rate separately.

</details>

## Comparison

| | Forward proxy | Reverse proxy | Load balancer | API gateway |
|---|---------------|---------------|---------------|-------------|
| Acts for | Clients | Servers | Servers | API services |
| Main job | Control outbound access | Front door: TLS, caching, routing | Spread traffic over healthy servers | API concerns: auth, limits, routing, aggregation |
| Knows about | Destinations | HTTP (if L7) | Connections or requests | API routes, clients, plans |
| Examples | Squid, corporate proxies | Nginx, Envoy | AWS ALB/NLB, HAProxy | Kong, AWS API Gateway, Spring Cloud Gateway |

The categories overlap: Nginx can be a reverse proxy, a load balancer and a simple gateway at once.

## Common Traps

> [!WARNING]
> **Common trap:** "An API gateway and a load balancer are the same." A load balancer distributes traffic; a gateway understands APIs and clients (authentication, plans, versions). Many systems use both: load balancer → gateway instances → services.

## Interview Follow-up

- *"Where would you do authentication in a microservices system?"* Validate the token at the gateway (reject early, once), pass the verified identity to services, and still authorise per resource inside each service.

## Key Takeaways

- Forward proxies act for clients; reverse proxies act for servers.
- A load balancer is a reverse proxy focused on distributing traffic.
- An API gateway is a reverse proxy for APIs: routing, auth, rate limiting, aggregation, transformation and observability.
- Keep gateways thin, stateless and redundant — they are on every request's path.
