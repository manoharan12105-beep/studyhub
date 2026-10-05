# Block 1: 30-Minute Essentials

Block 1 of 3. The core of every module, compressed. For a 30-minute revision read only this block; for one hour, continue with the drills and the final sheet.

## 1. The Big Picture (3 min)

Data from an application is wrapped layer by layer — **HTTP → TLS → TCP (ports) → IP (addresses) → Ethernet/Wi-Fi (MACs) → bits** — sent hop by hop, and unwrapped at the destination. Each layer solves one problem:

| Problem | Solved by |
|---------|-----------|
| What does the app want? | HTTP, DNS, SMTP … |
| Is it private and authentic? | TLS |
| Which process; reliable and ordered? | TCP (or UDP for speed) |
| Which host, across networks? | IP + routing |
| Which device on this wire? | Ethernet/Wi-Fi + ARP |

## 2. Devices and Domains (3 min)

- Hub L1 (repeats to all) · Switch L2 (MAC table, one port) · Router L3 (routing table, between networks).
- Switches split **collision** domains; routers/VLANs split **broadcast** domains.
- Router at each hop: strip frame → TTL − 1 → longest prefix match → ARP next hop → new frame.

## 3. Addressing (6 min)

- IPv4 32 bits = network + host; mask/prefix marks the split; usable hosts 2ʰ − 2.
- Block size = 256 − mask value; network = round down; broadcast = next − 1.
- Private: 10/8, 172.16/12, 192.168/16. 127/8 loopback. 169.254/16 = DHCP failed.
- IPv6 128 bits, `::` once, /64 subnets, no broadcast, NDP replaces ARP.
- **Local vs remote:** same network (by my mask) → ARP the destination; otherwise → ARP the **gateway**, frame to the gateway's MAC, packet to the server's IP.

## 4. Transport (6 min)

- Ports: well-known < 1024; clients use ephemeral ports; connection = 4-tuple.
- **TCP:** SYN → SYN-ACK → ACK; sequence numbers count bytes; cumulative ACK; retransmit on timeout or 3 duplicate ACKs; FIN/ACK each direction; TIME_WAIT on the side closing first; CLOSE_WAIT = app not closing.
- **UDP:** no connection, no guarantees, 8-byte header — DNS, DHCP, media, QUIC.
- **Flow control** (rwnd, receiver) vs **congestion control** (cwnd, network): slow start doubles, avoidance +1, halve on loss.
- **Refused** = RST, nothing listening. **Timeout** = silence, firewall/route/host down.

## 5. Application Protocols (6 min)

- **HTTP:** request line + headers + body; stateless; GET/HEAD/PUT/DELETE idempotent, POST not.
- **Status:** 200, 201, 204 · 301/302/304/307/308 · 400, 401 (unauthenticated), 403 (forbidden), 404, 409, 429 · 500, 502 (bad upstream response), 503 (unavailable), 504 (upstream timeout).
- **HTTP/1.1** keep-alive, one at a time · **HTTP/2** multiplexed on TCP · **HTTP/3** QUIC over UDP.
- **HTTPS/TLS 1.3:** key shares → session keys; certificate + signature prove identity; 1 RTT. Symmetric encrypts data; asymmetric authenticates.
- **DNS:** stub → recursive resolver → root → TLD → authoritative; cached by TTL; A, AAAA, CNAME, MX, NS, TXT.
- **DHCP:** Discover, Offer, Request, Ack → IP, mask, gateway, DNS, lease.
- **NAT/PAT:** private IP:port ↔ public IP:new port in a table; not a firewall.

## 6. Security, Performance, Troubleshooting (6 min)

- AuthN (who, 401) vs AuthZ (what, 403); defence in depth; least privilege; stateful firewalls; TLS defeats sniffing and MITM.
- Latency = RTT × round trips; a new HTTPS connection costs ~3 RTT to first byte → reuse connections (keep-alive, pools), batch, parallelise, use CDNs.
- L4 LB (connections, IP/port) vs L7 LB (requests, TLS termination, path routing, X-Forwarded-For).
- Troubleshooting ladder: link → IP config → ping gateway → ping 1.1.1.1 → nslookup → port → TLS → app.
