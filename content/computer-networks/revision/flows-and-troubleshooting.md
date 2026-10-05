# Request Flows and Troubleshooting

The URL journey, the backend request path and the troubleshooting ladder — the three sequences to be able to recite.

## URL Request Flow

```text
 1. Wi-Fi association + WPA handshake                   (L1–L2)
 2. DHCP DORA → IP, mask, gateway, DNS servers          (UDP 67/68, broadcast)
 3. ARP for the default gateway                         (L2 broadcast, cached)
 4. Browser: parse URL, HSTS, HTTP cache                (maybe no network at all)
 5. DNS: browser → OS → resolver → root → TLD → auth    (UDP 53, cached by TTL)
 6. Route decision: remote → frame to gateway MAC, packet to server IP
 7. TCP handshake SYN / SYN-ACK / ACK to :443           (1 RTT; NAT at home router; hop-by-hop routing)
 8. TLS 1.3 handshake, certificate validation           (1 RTT)
 9. HTTP request (HTTP/2 over TLS)
10. CDN / load balancer → app server → DB / services
11. Response: TCP ACKs, retransmission, congestion window; NAT back
12. Browser parses, fetches sub-resources (same connection), renders
```

**Where it fails:** 1 Wi-Fi · 2 → 169.254.x.x · 3/6 wrong gateway · 5 "server IP address could not be found" · 7 refused/timeout · 8 certificate warning · 10 502/503/504 · 11 slow/stalling.

## What Changes Hop by Hop

| Field | Changes at |
|-------|-----------|
| Source/destination MAC | Every link |
| TTL, IPv4 checksum | Every router |
| Source IP/port (outbound), destination IP/port (replies) | NAT |
| Everything (new connection) | L7 proxies / load balancers |

## Backend Request Path

```text
Browser ─(CORS preflight?)─ DNS ─ TCP+TLS ─► LB (TLS termination, L7 routing, health checks)
   ─ pooled keep-alive + X-Forwarded-For/-Proto ─► Spring Boot (Tomcat thread, Security, MVC)
   ├─ service call: DNS discovery → pooled HTTP client → timeouts, idempotent retries
   └─ PostgreSQL: HikariCP pooled TCP 5432 (+TLS) → one round trip per query
```

| Error | Hop / meaning |
|-------|---------------|
| UnknownHostException | DNS |
| Connection refused | Nothing listening (port, bind address, container localhost) |
| Connect timed out | Firewall / security group / route |
| no pg_hba.conf entry | Network OK; DB access rule |
| Pool timeout (30 s) | App/DB load, leaks — not the network |
| Connection reset after idle | Middlebox idle timeout vs pool lifetime |
| 502 / 503 / 504 | Upstream invalid / unavailable / too slow |

## Troubleshooting Ladder

| Step | Check | Command | Failure means |
|------|-------|---------|---------------|
| 1 | Link up | Wi-Fi icon, `ip link` | Physical / Wi-Fi |
| 2 | IP configuration | `ipconfig /all`, `ip addr`, `ip route` | DHCP (169.254.x.x), wrong mask/gateway |
| 3 | Gateway reachable | `ping <gateway>`, `arp -a` | LAN, wrong gateway, VLAN |
| 4 | Internet by IP | `ping 1.1.1.1`, `tracert` | Router, NAT, ISP |
| 5 | DNS | `nslookup name`, `nslookup name 1.1.1.1` | Resolver / DNS settings / hosts file |
| 6 | Port | `nc -zv host 443`, `Test-NetConnection -Port` | Refused (listener) / timeout (firewall) |
| 7 | TLS | `curl -v` | Certificate, trust store, SNI |
| 8 | Application | `curl -I`, logs | HTTP status, server errors |

**Strategies:** bottom-up (nothing works), top-down (one app fails), divide and conquer (start with ping).

## Classic Scenarios in One Line

- **No internet:** walk the ladder; first failing step = cause.
- **Ping IP, not domain:** DNS.
- **Local works, remote doesn't:** default gateway / upstream.
- **Odd partial reachability:** subnet mask, VLAN, duplicate IP.
- **Refused:** service down / wrong port / bound to 127.0.0.1.
- **Timeout:** firewall drop / wrong IP / route.
- **One site fails:** `curl -v` phase + test from another network.
- **High latency:** separate RTT from server time; mtr per hop; bufferbloat under load.
- **Packet loss:** loss that starts at a hop and persists to the end is real.
