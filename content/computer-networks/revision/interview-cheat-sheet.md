# Interview Cheat Sheet

The 25 most-asked networking questions with the answer a strong candidate gives in 2–4 sentences.

## Models and Devices

| Question | Strong answer |
|----------|---------------|
| OSI vs TCP/IP? | OSI: 7-layer reference model (teaching, vocabulary). TCP/IP: the 4/5-layer suite the Internet runs; merges session/presentation/application and (4-layer) data link/physical. OSI numbers survive as L2/L3/L4/L7. |
| Router vs switch? | Switch: L2, forwards frames within a network by MAC, floods broadcasts. Router: L3, forwards packets between networks by IP, decrements TTL, rewrites frames, stops broadcasts. |
| Hub vs switch? | Hub repeats everything to every port (one collision domain, half duplex, shared bandwidth). Switch learns MACs and forwards to one port (collision domain per port, full duplex). |
| MAC vs IP? | MAC: 48-bit, flat, per link, changes every hop. IP: hierarchical, end to end, unchanged along the path except at NAT. |
| What is ARP? | Maps IPv4 → MAC on the local link: broadcast request, unicast reply, cached. For remote hosts you ARP for the default gateway. |

## Addressing and Routing

| Question | Strong answer |
|----------|---------------|
| Public vs private IP? | Private ranges 10/8, 172.16/12, 192.168/16 are reused and not routed on the Internet; NAT maps them to public addresses. |
| IPv4 vs IPv6? | 32 vs 128 bits; IPv6: no broadcast, NDP instead of ARP, SLAAC, fixed header without checksum, no NAT needed. Not directly interoperable. |
| Subnetting `x.x.x.77/26`? | Block 64 → network .64, broadcast .127, hosts .65–.126, 62 usable. |
| Default gateway? | Router address in my subnet that receives all traffic for other networks. Wrong gateway → local works, remote fails. |
| Longest prefix match? | Among matching routes the most specific (longest prefix) wins; metrics only break ties for the same prefix. |
| NAT? | Rewrites private source IP:port to a public one and back (PAT); one public IP for many devices; blocks unsolicited inbound; not a firewall. |
| DHCP? | DORA: Discover (broadcast) → Offer → Request (broadcast) → Ack; gives IP, mask, gateway, DNS, lease. |

## Transport

| Question | Strong answer |
|----------|---------------|
| TCP vs UDP? | TCP: connection, reliability, order, flow + congestion control. UDP: connectionless datagrams, 8-byte header, low latency; DNS, media, QUIC. |
| 3-way handshake? | SYN(x) → SYN-ACK(y, ack x+1) → ACK(y+1); exchanges ISNs and options; 1 RTT before data. |
| 4-way termination? | FIN → ACK → FIN → ACK; half-close per direction; active closer waits in TIME_WAIT (2 × MSL). |
| Flow vs congestion control? | Flow protects the receiver (rwnd advertised); congestion protects the network (cwnd inferred). Send ≤ min(rwnd, cwnd). |
| Port vs socket? | Port: 16-bit number for an app. Socket: IP + port endpoint. Connection: 4-tuple. |
| Refused vs timeout? | Refused: RST — host reachable, nothing listening. Timeout: no reply — firewall drop, wrong route, host down. |

## Application

| Question | Strong answer |
|----------|---------------|
| What happens when you type a URL? | Cache/HSTS → DNS → gateway via ARP → TCP handshake (NAT, routing) → TLS handshake → HTTP request → CDN/LB → app/DB → response → render. |
| HTTP vs HTTPS? | HTTPS = HTTP over TLS on 443: encryption, integrity, server authentication; +1 RTT handshake. |
| HTTP/1.1 vs HTTP/2? | Text, one request at a time per connection vs binary, multiplexed streams on one connection, HPACK. HTTP/3: QUIC/UDP, no TCP head-of-line blocking. |
| How does DNS work? | Stub → recursive resolver → root → TLD → authoritative (iterative referrals); cached by TTL. A/AAAA/CNAME/MX/NS/TXT. |
| DNS vs DHCP? | DHCP configures my host (IP, gateway, which DNS servers). DNS resolves other hosts' names. |
| L4 vs L7 load balancer? | L4: connections by IP/port, fast, protocol-agnostic. L7: terminates TLS, routes requests by path/host/header, adds X-Forwarded-For. |

## Troubleshooting

| Question | Strong answer |
|----------|---------------|
| No internet? | Scope → link → `ipconfig` (169.254?) → ping gateway → ping 1.1.1.1 → nslookup → curl -v. First failure = cause. |
| Ping IP works, domain fails? | DNS: compare the configured resolver with 1.1.1.1; check DHCP DNS settings and the hosts file. |
