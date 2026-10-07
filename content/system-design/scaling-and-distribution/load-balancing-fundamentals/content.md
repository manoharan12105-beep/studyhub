# Load Balancing Fundamentals

**Module:** Scaling and Distribution · **Interview priority:** Core

## What Is It?

A **load balancer** sits in front of a pool of servers, receives client traffic on one address, and forwards each connection or request to one healthy server. When one server tops out and you add more, DNS returns the **load balancer's** address, and the load balancer decides which server does the work.

It has two jobs:

1. **Choose a server** for each request (the algorithm — see [Load-Balancing Algorithms](../load-balancing-algorithms/content.md)).
2. **Check server health** and stop sending traffic to servers that fail.

```text
                     ┌──► app-1  ✓
clients ──► LB ──────┼──► app-2  ✓
 (one address)       └──► app-3  ✗ failed health checks → no traffic
```

## Why It Exists

Horizontal scaling only works if traffic is spread across the servers. Without a balancer, clients pile onto one server (the one in DNS or "nearest the door") while others idle, and a dead server keeps receiving requests. The load balancer also provides one stable endpoint while servers come and go, which enables autoscaling and zero-downtime deployments.

## How It Works

### It is a reverse proxy, not magic hardware

A load balancer is usually software on ordinary servers whose only job is forwarding traffic — a kind of [reverse proxy](../../communication/reverse-proxy-and-api-gateway/content.md). Teams run Nginx, HAProxy or Envoy themselves, or use managed cloud balancers (for example AWS Application/Network Load Balancer); few companies build their own.

### L4 vs L7

| | L4 (transport) | L7 (application) |
|---|----------------|------------------|
| Sees | IP addresses and ports (TCP/UDP) | HTTP: method, path, host, headers, cookies |
| Balances | Connections | Individual requests |
| Can route `/api` vs `/images` | No | Yes |
| TLS | Usually passes through | Terminates it to read HTTP |
| Speed / overhead | Very fast, any protocol | More CPU, richer features |

The Computer Networks lesson [Load Balancing: L4 vs L7](../../../computer-networks/performance/load-balancing-l4-vs-l7/content.md) goes deeper.

### Health checks

- **Active checks:** the balancer probes each server periodically — a TCP connect (L4) or `GET /health` expecting 200 (L7).
- **Passive checks:** the balancer watches real traffic and marks servers that time out or return errors.

Settings that matter:

| Setting | Example | Purpose |
|---------|---------|---------|
| Interval | Every 5 s | How quickly failures are noticed |
| Timeout | 2 s | How long to wait for a probe; a server that normally answers in 50 ms but suddenly needs 10 s deserves investigation |
| Unhealthy threshold | 3 consecutive failures | Avoid removing a server for one blip |
| Healthy threshold | 2–5 consecutive successes | Avoid flapping back too early |

A good health check reflects whether the server can **serve** — not merely whether the process is running — but must not fail because a **non-critical** dependency is down, or one dependency outage removes every server at once.

### Connection draining

Before removing a server (deployments, scale-in), the balancer stops sending it new requests but lets in-flight requests finish (**draining**, often 30–300 s). Applications support this with a readiness endpoint that turns unhealthy on shutdown.

### The balancer must not be a single point of failure

If all traffic flows through one balancer, its failure takes down every server behind it. Production setups run **several** balancer instances: managed cloud balancers are redundant across zones; self-hosted ones run as active-passive pairs sharing a floating IP (VRRP/keepalived) or several active nodes behind DNS or anycast.

**Think about it:** server 3 stops responding. Health checks run every 5 s with an unhealthy threshold of 3. What do users see during the first 15 seconds, and how could you shorten it?

<details>
<summary>Answer</summary>

Requests routed to server 3 during detection (up to about 15 s plus a timeout) fail or hang. Shorten it with passive health checks (mark a server bad after a few failed real requests), shorter intervals and timeouts, and client or balancer retries of idempotent requests on another server. Too-aggressive settings risk removing healthy servers during brief spikes.

</details>

## Common Traps

> [!WARNING]
> **Common trap:** a health check that calls every dependency. When one optional dependency fails, every server fails its check and the balancer has no healthy servers — a self-inflicted total outage.

## Interview Follow-up

- *"How does a load balancer know a server is down?"* Active probes with thresholds plus passive failure detection on real traffic; then it stops routing to it until it passes again.

## Key Takeaways

- A load balancer is a reverse proxy that spreads traffic over healthy servers and gives clients one stable address.
- L4 balances connections by IP/port; L7 balances requests and can route by HTTP content.
- Health checks (active and passive, with thresholds) remove failed servers; draining removes servers gracefully.
- Run redundant balancers — one balancer is a single point of failure.
