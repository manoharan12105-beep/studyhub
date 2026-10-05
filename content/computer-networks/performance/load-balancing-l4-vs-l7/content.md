# Load Balancing: L4 vs L7

**Module:** Performance and Distributed Networking · **Interview priority:** Core

## What Is It?

A **load balancer** (LB) receives client traffic on one address and distributes it across a pool of backend servers, sending traffic only to **healthy** ones. It is the standard front door for horizontally scaled services:

```text
                         ┌─► Spring Boot instance 1  (10.0.1.11:8080)
Clients ─► LB (api.example.com:443) ─┼─► Spring Boot instance 2  (10.0.1.12:8080)
                         └─► Spring Boot instance 3  (10.0.1.13:8080)   ✗ failed health check → no traffic
```

The key design choice is **which layer** the LB works at: **Layer 4** (transport — IPs and ports) or **Layer 7** (application — HTTP).

## Why It Exists

One server has limited CPU, memory and connections, and it fails. Load balancing gives **scalability** (add instances), **availability** (route around failures, zero-downtime deployments), and a single stable endpoint that hides the backends.

## How It Works

### L4 vs L7

| | **L4 load balancer** | **L7 load balancer** |
|---|----------------------|----------------------|
| Works with | TCP/UDP connections: source/destination IP and port | HTTP requests: method, path, host, headers, cookies, body |
| Unit balanced | A **connection** (all its requests go to one backend) | Each **request** can go to a different backend |
| TLS | Usually passes it through (backend terminates) — or terminates without reading HTTP | **Terminates TLS** to read HTTP |
| Routing options | By IP/port, hash of the 4-tuple | Path (`/api` vs `/images`), host (`a.example.com`), header (`X-Version: beta`), cookie |
| Can modify traffic | No (except NAT) | Yes: add `X-Forwarded-For`, rewrite paths, redirects, compression, caching, auth, rate limits |
| Health checks | TCP connect succeeds? | HTTP `GET /actuator/health` returns 200? |
| Performance | Very fast, low overhead, any TCP/UDP protocol (DB, MQTT, gRPC as opaque TCP) | More CPU (parse HTTP, TLS); richer features |
| Client IP at backend | Preserved (pass-through) or via PROXY protocol | In `X-Forwarded-For` (connection comes from the LB) |
| Examples | AWS NLB, HAProxy (TCP mode), LVS/IPVS, kube-proxy | AWS ALB, Nginx, HAProxy (HTTP mode), Envoy, Spring Cloud Gateway, Kubernetes Ingress |

```text
L4:  client ──TCP conn──► [LB picks backend for the CONNECTION] ──same TCP flow──► backend 2
L7:  client ──HTTPS──► [LB decrypts, reads "GET /api/orders"] ──new HTTP request──► api pool, instance 3
                                    reads "GET /images/x.png"  ──new HTTP request──► static pool
```

### Balancing algorithms

| Algorithm | How | Good for |
|-----------|-----|----------|
| **Round robin** | 1, 2, 3, 1, 2, 3 … | Similar servers, similar requests |
| **Weighted round robin** | Bigger servers get proportionally more | Mixed instance sizes, canary releases (5 % to new version) |
| **Least connections** | Send to the backend with the fewest active connections | Long or uneven requests (WebSockets, reports) |
| **Least response time** | Fastest recent responses | Heterogeneous performance |
| **IP hash / consistent hashing** | Hash of client IP (or key) picks the backend | Affinity without cookies; caches |
| **Random (with two choices)** | Pick two at random, use the less loaded | Large fleets |

### Health checks

The LB probes each backend periodically (e.g. every 10 s): L4 checks that a TCP connection opens; L7 checks that `GET /actuator/health` returns 200. After N failures the backend is removed; after M successes it returns. Spring Boot Actuator's **liveness/readiness** endpoints are built for this — readiness turns false during startup and shutdown so the LB drains traffic before the instance stops (**connection draining / graceful shutdown**).

### Sticky sessions

**Session affinity** sends a client to the same backend each time (L7 via a cookie; L4 via IP hash). It is needed only when sessions live in one instance's memory — and it spoils even load distribution and failover. Prefer **stateless** services (JWT) or a **shared session store** (Spring Session + Redis).

### The load balancer must not be a single point of failure

Cloud LBs are managed and redundant; self-hosted ones run in pairs with a floating IP (VRRP/keepalived, announced with gratuitous ARP) or behind DNS/anycast. **Global** load balancing across regions uses DNS (geo/latency routing) or anycast.

## Real World: HTTPS through a load balancer to Spring Boot

```text
1. Browser resolves api.example.com → LB public IP
2. TCP + TLS handshake with the LB (certificate lives on the LB)
3. LB (L7) reads "POST /api/orders", picks healthy instance 2 (least connections)
4. LB reuses a pooled keep-alive connection to 10.0.1.12:8080, adds
   X-Forwarded-For: <client IP>, X-Forwarded-Proto: https
5. Spring Boot handles the request (server.forward-headers-strategy=native to trust these headers)
6. Response travels back through the LB to the browser
```

Full journey: [Backend Request Flows](../../end-to-end-flows/backend-request-flows/content.md).

## Common Traps

- **"L4 can route `/api` and `/static` differently."** It cannot see the path — that needs L7.
- **"L7 balances connections."** It balances **requests**; with HTTP/2 or keep-alive, one client connection's requests may go to many backends.
- **"Health check = the process is running."** A useful readiness check also verifies the app can serve (dependencies reachable, warmed up) — but avoid making it fail when a non-critical dependency is down.
- **"Sticky sessions are a scaling strategy."** They are a workaround for stateful apps.

## Interview Follow-up

- *"L4 vs L7 load balancer?"* Connections by IP/port vs requests by HTTP content; speed vs features.
- *"How does a load balancer know a server is down?"* Active health checks (and passive: failed requests).

## Key Takeaways

- Load balancers spread traffic over healthy backends for scale and availability.
- L4: per connection, IP/port, fast, protocol-agnostic. L7: per request, terminates TLS, routes by path/host/header, adds headers.
- Algorithms: round robin, weighted, least connections, hashing.
- Health checks + graceful draining; prefer stateless backends over sticky sessions; make the LB itself redundant.
