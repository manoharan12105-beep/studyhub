# Middleboxes: Firewalls, Proxies and Load Balancers

**Module:** Network Devices · **Interview priority:** Frequently asked

## What Is It?

A **middlebox** is any device on the path that does more than plain forwarding: it inspects, filters, rewrites or redirects traffic. The ones every backend developer meets:

| Middlebox | Job | Works at |
|-----------|-----|----------|
| **Firewall** | Allow or block traffic by rules | L3/L4 (IPs, ports, connection state); next-gen firewalls up to L7 |
| **NAT device** | Rewrite private addresses to public ones | L3/L4 |
| **Forward proxy** | Make requests *on behalf of clients* | L7 (HTTP) |
| **Reverse proxy** | Receive requests *on behalf of servers* | L7 |
| **Load balancer** | Spread requests across many servers | L4 or L7 |
| **API gateway** | Reverse proxy + auth, rate limits, routing for APIs | L7 |

## Why It Exists

The original Internet design was "dumb network, smart ends": routers just forward packets. Real networks need security (block unwanted traffic), address conservation (NAT), scale (many servers behind one name), and central control (TLS termination, caching, logging). Middleboxes provide these — at the cost of breaking pure end-to-end behaviour.

## Firewall

Inspects each packet or connection and applies ordered rules such as:

```text
allow  tcp  any          → 10.0.1.10  port 443     (public HTTPS to the web server)
allow  tcp  10.0.1.0/24  → 10.0.2.20  port 5432    (app subnet to PostgreSQL)
deny   any  any          → any                     (default deny)
```

- **Stateless (packet filter):** judges each packet alone by its header fields.
- **Stateful:** tracks connections, so reply traffic of an allowed connection is allowed automatically.
- **Network firewall** protects a whole network (a device or cloud security group); **host firewall** runs on one machine (`ufw`, `iptables`/`nftables`, Windows Defender Firewall).

Details: [Firewalls and ACLs](../../network-security/firewalls-and-acls/content.md).

## Proxies: forward vs reverse

```text
Forward proxy (acts for clients)          Reverse proxy (acts for servers)
[client]─┐                                                 ┌─[server 1]
[client]─┼─► [proxy] ──► Internet         client ──► [proxy]─┼─[server 2]
[client]─┘                                                 └─[server 3]
Server sees the proxy's IP                Client sees only the proxy's IP
```

| | Forward proxy | Reverse proxy |
|---|---------------|---------------|
| Sits in front of | Clients | Servers |
| Who configures it | The client side (company, browser) | The service owner |
| Used for | Content filtering, caching, hiding client IPs, controlled egress | TLS termination, load balancing, caching, compression, hiding servers |
| Examples | Corporate web proxy, Squid | Nginx, HAProxy, Envoy, Cloudflare |

Because a reverse proxy opens a *new* connection to the backend, the backend sees the proxy's IP as the client. The original client IP is passed in a header such as `X-Forwarded-For` (or the standard `Forwarded`); Spring Boot reads it when `server.forward-headers-strategy` is configured.

## Load Balancer

A reverse proxy specialised in distributing traffic across a pool of identical servers, with **health checks** to stop sending to dead ones.

- **L4 load balancer:** decides by IP and port only; forwards TCP/UDP connections without reading HTTP.
- **L7 load balancer:** terminates HTTP(S), reads the path, headers and cookies, and can route `/api/*` and `/images/*` to different pools.

Algorithms, health checks, sticky sessions and the L4/L7 trade-off: [Load Balancing: L4 vs L7](../../performance/load-balancing-l4-vs-l7/content.md).

## Real World

A typical production path for a Spring Boot API:

```text
Browser ──HTTPS──► CDN / WAF ──► cloud load balancer (TLS termination, L7)
        ──HTTP──► Spring Boot instances (private subnet, security group allows only the LB)
        ──TCP 5432──► PostgreSQL (security group allows only the app subnet)
```

Every arrow crosses at least one middlebox: firewall rules, a load balancer, NAT for outbound calls.

## Common Traps

- **"The backend sees the user's IP."** Behind a proxy or load balancer it sees the proxy's IP; use `X-Forwarded-For` — and trust it only from your own proxies, because clients can forge it.
- **"A firewall makes the application secure."** It limits *who can connect*; it cannot fix SQL injection or broken authentication in allowed traffic.
- **"A reverse proxy and a load balancer are different things."** A load balancer is a kind of reverse proxy; Nginx and HAProxy are both.

## Interview Follow-up

- *"Forward proxy vs reverse proxy?"* Acts for clients vs acts for servers — see the table above.
- *"Where should TLS be terminated?"* Usually at the load balancer (central certificates, L7 routing), optionally re-encrypted to the backends.

## Key Takeaways

- Middleboxes inspect or modify traffic: firewalls, NAT, proxies, load balancers, API gateways.
- Firewall: rule-based allow/deny; stateful firewalls remember connections.
- Forward proxy represents clients; reverse proxy represents servers.
- Load balancer: reverse proxy + health checks + distribution; L4 sees connections, L7 sees HTTP.
