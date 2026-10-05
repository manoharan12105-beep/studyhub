# Block 2: 20-Minute Drills

Block 2 of 3. Active recall: cover the right column, answer aloud, then check.

## Subnetting Drill (6 min)

| Question | Answer |
|----------|--------|
| `192.168.1.130/25` network / broadcast | `.128` / `.255` |
| `172.16.35.45/28` host range | `.33` – `.46` |
| `10.0.0.95/27` — valid host? | No: broadcast of `10.0.0.64/27` |
| `10.1.77.130/22` network | `10.1.76.0` (broadcast `10.1.79.255`) |
| `172.18.99.99/19` usable hosts | 8,190 (network `172.18.96.0`) |
| Hosts in /21 | 2,046 |
| Prefix for 500 hosts | /23 (510) |
| /27 subnets in a /24 | 8 |
| Mask for /20 | 255.255.240.0 |
| Summary of `192.168.16.0`–`19.0` /24s | `192.168.16.0/22` |
| `10.0.8.200/21` with gateway `10.0.15.254` — valid? | Yes: both in `10.0.8.0/21` (8–15) |

## Protocol Rapid Fire (5 min)

| Question | Answer |
|----------|--------|
| Port of PostgreSQL / SSH / DNS / HTTPS | 5432 / 22 / 53 / 443 |
| Transport of DHCP | UDP 67/68 |
| ICMP message used by traceroute | Time Exceeded |
| EtherType of ARP | 0x0806 |
| ARP request destination MAC | ff:ff:ff:ff:ff:ff |
| TCP flag that aborts a connection | RST |
| Which side gets TIME_WAIT | The side that closed first |
| Record type for mail servers | MX |
| HTTP status for "created" | 201 + Location |
| Status for an expired JWT | 401 |
| What `304` means | Use your cached copy |
| Where TLS SNI lives | ClientHello (hostname, unencrypted) |
| HTTP/3 transport | QUIC over UDP |
| Router decrements which field | TTL |

## Flow Recitation (5 min)

Say each sequence aloud without looking:

1. **URL journey:** DHCP → ARP gateway → cache/HSTS → DNS → route to gateway → TCP handshake → TLS → HTTP → LB/CDN → app → response → render.
2. **Handshake:** SYN(x) → SYN-ACK(y, x+1) → ACK(y+1).
3. **Termination:** FIN → ACK → FIN → ACK → TIME_WAIT (2 × MSL).
4. **DNS:** stub → resolver → root → TLD → authoritative → cache by TTL.
5. **DHCP:** Discover (broadcast) → Offer → Request (broadcast) → Ack.
6. **Router per packet:** check FCS/MAC → TTL − 1 → longest prefix match → ARP next hop → new frame.
7. **TLS 1.3:** ClientHello (key share, SNI, ALPN) → ServerHello → Certificate → CertificateVerify → Finished → Finished → data.

## Diagnose-It Drill (4 min)

| Symptom | Diagnosis |
|---------|-----------|
| `169.254.x.x`, no gateway | DHCP failed |
| Ping 8.8.8.8 OK, ping google.com fails | DNS |
| LAN OK, nothing remote | Default gateway |
| Instant "connection refused" | Nothing listening / bound to 127.0.0.1 |
| Hangs then "timed out" | Firewall drop / wrong IP / host down |
| Thousands of CLOSE_WAIT | App leaks connections |
| 504 from the LB | Backend too slow |
| Users randomly logged out across instances | In-memory sessions without shared store |
| Large VPN transfers hang, small work | MTU / blocked ICMP fragmentation-needed |
| Old IP still used after DNS change | TTL caching |
