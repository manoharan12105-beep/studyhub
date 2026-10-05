# Backend Request Flows: Frontend → Load Balancer → Spring Boot → Services → PostgreSQL

**Module:** End-to-End Network Flows · **Interview priority:** Core

## What Is It?

What the network does at every stage of a typical backend request:

```text
Browser / mobile app
    │  DNS → TCP → TLS → HTTP/2
    ▼
CDN / WAF (optional) ─► Load balancer (TLS termination, L7 routing, health checks)
    │  HTTP/1.1 keep-alive (private network), X-Forwarded-For / -Proto
    ▼
Spring Boot instance (Tomcat thread, Spring MVC, Spring Security)
    ├─► another service:  DNS (service discovery) → pooled HTTP connection → JSON
    └─► PostgreSQL:        pooled TCP connection (HikariCP), TLS, SQL protocol on 5432
```

## Why It Exists

As a backend developer you own most of these hops. Latency, failures and security issues show up as networking problems — timeouts, 502s, pool exhaustion, wrong client IPs — and you can only diagnose them if you know what happens on each hop.

## Flow 1: Frontend → API

A React app at `https://shop.example.com` calls `https://api.example.com/api/orders`.

| Step | Network event | Notes |
|------|---------------|-------|
| 1 | **CORS preflight** (if needed): `OPTIONS /api/orders` with `Origin: https://shop.example.com` | Different origin (another host) → the browser asks permission for non-simple requests (JSON POST, `Authorization` header). The API must answer with `Access-Control-Allow-Origin` etc. |
| 2 | DNS: `api.example.com` → CNAME → load balancer IPs | Short TTL so LB IPs can change |
| 3 | TCP + TLS 1.3 to the LB on 443; ALPN picks HTTP/2 | Reused for later calls (keep-alive) |
| 4 | `POST /api/orders` with `Authorization: Bearer <JWT>`, JSON body | Encrypted end to the LB |

## Flow 2: Client → Load Balancer → Spring Boot Servers (HTTPS through a load balancer)

```text
Client ══TLS══► LB :443 ──HTTP──► 10.0.1.12:8080 (instance 2 of 3)
```

1. The **LB terminates TLS** (it holds the certificate), reads the HTTP request (L7), and chooses a healthy instance (round robin / least connections). Unhealthy instances were removed by health checks on `/actuator/health/readiness`.
2. The LB forwards the request over a **pooled keep-alive connection** to the instance, adding:
   - `X-Forwarded-For: <client IP>` — the instance's TCP peer is the LB, not the client;
   - `X-Forwarded-Proto: https` — the instance received plain HTTP;
   - often a request ID header for tracing.
3. **Tomcat** accepts the connection (already open), a worker thread parses the request; Spring Security validates the JWT ([401/403](../../http/http-status-codes/content.md)); Spring MVC calls the controller.
4. The response returns over the same connections; the LB re-encrypts it towards the client.

Configuration that matters: `server.forward-headers-strategy=native` (trust forwarded headers from the LB only), backend keep-alive timeout **longer** than the LB idle timeout, graceful shutdown for deployments. Details: [Load Balancing](../../performance/load-balancing-l4-vs-l7/content.md).

## Flow 3: API → Another API (service to service)

The order service calls the inventory service:

1. **Service discovery by DNS**: `inventory.internal` (or `inventory.default.svc.cluster.local` in Kubernetes) → a virtual IP or the IPs of instances.
2. **Pooled HTTP client** (one shared `RestClient`/`WebClient`/`HttpClient`): an existing keep-alive connection is reused; otherwise TCP (+ TLS / mTLS in a service mesh) is set up.
3. Request with **timeouts** (connect and read), propagated trace headers, and maybe a service token.
4. Failure handling: retries **only for idempotent** calls, with back-off; circuit breaker to stop hammering a failing service; fallback.

Each extra service call adds at least one RTT (~0.5–2 ms in-region) plus the callee's time — fan-out multiplies latency and failure probability. Call independent services in parallel.

## Flow 4: Backend → PostgreSQL

```text
Spring Boot ── HikariCP pool (e.g. 10 connections) ══ TCP 5432 (+ TLS) ══► PostgreSQL
```

1. **At startup**, HikariCP opens connections: DNS for the DB host → TCP handshake to 5432 → optional TLS (`sslmode=require`/`verify-full`) → PostgreSQL authentication (SCRAM) → a server backend process per connection.
2. **Per request**, a thread **borrows** a ready connection (no handshakes), sends SQL over the PostgreSQL wire protocol, gets rows back, and **returns** the connection.
3. Every query is at least one round trip — keep the database in the same region/zone and avoid N+1 query patterns.
4. Network rules: security group allows 5432 **only** from the app's security group; the database lives in a private subnet with no public IP.

Typical failures and their network meaning:

| Error | Meaning |
|-------|---------|
| `UnknownHostException: db.internal` | DNS (wrong name, no internal resolver) |
| `Connection refused` | PostgreSQL not listening on that address/port (`listen_addresses`) |
| `Connect timed out` | Security group/firewall/route blocks 5432 |
| `no pg_hba.conf entry for host …` | Network reached the server; access rule for the client IP/SSL missing |
| `Connection is not available, request timed out after 30000ms` | Pool exhausted (slow queries, leaks) — not a network failure |
| Connection reset after idle | NAT/firewall idle timeout shorter than the pool's `maxLifetime` |

## Putting It Together: One Order Request

```text
t=0     browser: connection to LB already open (HTTP/2)        0 extra RTT
        POST /api/orders                                       ~40 ms RTT to LB (client far away)
        LB → instance 2 (pooled)                               ~0.5 ms
        Spring Security validates JWT locally                   CPU only
        inventory service call (pooled, parallel with pricing)  ~5 ms
        INSERT order + order lines (one batch) in a transaction ~2 ms (2 round trips)
        response → LB → browser                                 ~40 ms
total ≈ 90 ms, of which ~80 ms is client ↔ LB distance  → a CDN/edge region would help most
```

## Common Traps

- **"The backend sees the client's IP."** It sees the load balancer; use forwarded headers from trusted proxies.
- **"Internal calls are free."** Each costs RTTs, can fail and needs timeouts.
- **"A bigger pool fixes DB timeouts."** Pool timeouts usually mean slow queries or leaks; more connections can make the database slower.
- **"TLS ends at the load balancer, so the internal network can be ignored."** Internal traffic should still be restricted (security groups) and often encrypted (mTLS, `sslmode=verify-full`).

## Interview Follow-up

- *"Explain what happens between the browser and the database for one API call."* Walk Flows 1, 2 and 4 in order.
- *"Why does the first request after deployment take longer?"* Cold connections: DNS, TCP/TLS to downstream services and DB pools warming up, JIT compilation.

## Key Takeaways

- Browser → (CORS preflight) → DNS → TCP/TLS to the LB → L7 routing with forwarded headers → Spring Boot.
- Service calls: DNS-based discovery, pooled connections, timeouts, retries only for idempotent calls, parallel fan-out.
- Database: HikariCP keeps authenticated TCP(+TLS) connections; each query is a round trip; restrict 5432 to the app.
- Map errors to hops: UnknownHost (DNS), refused (listener), timeout (firewall/route), pool timeout (app/DB load).
