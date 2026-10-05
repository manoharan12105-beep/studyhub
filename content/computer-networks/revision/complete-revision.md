# Complete Revision

Every module in one pass: the core idea of each topic in a few lines, in the learning order of the course. Use the other revision sheets for comparisons, traps, ports and formulas.

## Fundamentals and Devices

- **Network** = nodes + links + protocols. The **Internet** = a network of networks (autonomous systems) running IP; the **Web** is one application on it (HTTP).
- **Addresses:** IP → which host (interface); port → which application; MAC → which device on this link.
- **Client** starts a conversation; **server** listens. A role, not hardware — Spring Boot is a server to browsers and a client to PostgreSQL.
- **Network types:** PAN < LAN < MAN < WAN; Internet (public) / intranet (members) / extranet (partners).
- **Internet structure:** access ISPs → regional → Tier 1 backbones; IXPs for peering; submarine fibre carries intercontinental traffic; BGP picks paths between networks.
- **Topologies:** bus, ring, star (LANs), mesh (backbones; n(n−1)/2 links), tree (campus), hybrid.
- **Performance:** bandwidth (capacity), throughput (actual), latency (processing + queuing + transmission + propagation), jitter (variation), loss; BDP = bandwidth × RTT.
- **Switching:** circuit (reserved path), message (store whole message), packet (independent packets — the Internet, datagram mode).
- **Delivery:** unicast, broadcast (LAN only, routers stop it; none in IPv6), multicast (group), anycast (nearest — DNS, CDNs).
- **Devices:** NIC (MAC), repeater/hub (L1, everything everywhere), bridge/switch (L2, MAC table), router (L3, routing table), modem (L1 signal conversion), AP (Wi-Fi bridge), firewall, proxy, load balancer (middleboxes).

## OSI and TCP/IP

- **OSI 7 layers:** Physical (bits) · Data Link (frames, MAC) · Network (packets, IP) · Transport (segments/datagrams, ports) · Session · Presentation (encoding, encryption) · Application.
- Layers 4–7 end to end; 1–3 processed at each hop. Each layer talks to its peer; only Layer 1 is physically connected.
- **Encapsulation:** data → +TCP → +IP → +Ethernet header and FCS trailer → bits. Routers decapsulate to L3 and rebuild the frame.
- MTU 1,500 → MSS 1,460. Tunnels/VPNs reduce the effective MTU.
- **TCP/IP:** Application · Transport · Network (Internet) · Data Link · Physical (RFC: Link). IP is the narrow waist. OSI = reference model; TCP/IP = what runs.

## Data Link and ARP

- **Ethernet frame:** dest MAC, src MAC, EtherType, payload 46–1500, FCS (CRC-32). Errors are detected and dropped; TCP recovers.
- **MAC:** 48 bits, OUI + device, flat, link-local; `ff:ff:ff:ff:ff:ff` broadcast.
- **Switch:** learn from source MAC, forward by destination; unknown/broadcast → flood; entries age (~300 s); frame unchanged.
- **Domains:** switches split collision domains; routers and VLANs split broadcast domains. CSMA/CD only on shared half-duplex media.
- **VLANs:** logical LANs = broadcast domains = subnets; access (one VLAN, untagged) vs trunk (802.1Q tags, 12-bit ID). Inter-VLAN traffic needs routing.
- **STP:** elects a root bridge and blocks redundant links — Layer 2 loops cause broadcast storms (no TTL in frames).
- **IP vs MAC:** IP end to end (hierarchical), MAC per link (changes each hop).
- **ARP:** broadcast "who has IP?", unicast reply, cached; for remote destinations ARP for the **gateway**. Gratuitous ARP for duplicate detection/failover; ARP is spoofable.
- **Local vs remote:** AND IP and destination with the mask; same network → direct; else → default gateway (dst MAC = router, dst IP = server).

## IP, Subnetting and Routing

- **IP packet:** version, TTL, protocol (1 ICMP, 6 TCP, 17 UDP), source/destination, fragmentation fields, checksum. Best effort. Control plane builds routes; data plane forwards.
- **IPv4:** 32 bits, network + host; classes A/B/C historical; usable hosts 2ʰ − 2.
- **Private:** 10/8, 172.16/12, 192.168/16. Loopback 127/8; APIPA 169.254/16 (DHCP failed); 0.0.0.0 (unspecified, all interfaces, default route); CGNAT 100.64/10.
- **Masks and CIDR:** network = IP AND mask; broadcast = host bits 1; longer prefix = smaller network.
- **IPv6:** 128 bits, hex, `::` once; /64 subnets; global 2000::/3, ULA fd00::/8, link-local fe80::/10, multicast ff00::/8, no broadcast, NDP instead of ARP, SLAAC/DHCPv6.
- **Subnetting:** borrow host bits; subnets = 2ˢ, hosts = 2ʰ − 2; block size = 256 − mask value; VLSM largest first; summarise by common leading bits.
- **Routing:** routing table (prefix → next hop, interface); default route 0.0.0.0/0; **longest prefix match**; TTL − 1 per hop; static vs dynamic (RIP hop count, OSPF link state + Dijkstra, BGP path vector between ASes).
- **ICMP:** echo (ping), destination unreachable, time exceeded (traceroute), fragmentation needed (PMTUD). No ports.

## Transport

- **Ports:** 0–1023 well-known, 1024–49151 registered, 49152–65535 ephemeral. Connection = 4-tuple; server port shared by all clients.
- **UDP:** 8-byte header, no connection/ACK/order/flow/congestion control; DNS, DHCP, media, QUIC.
- **TCP:** reliable ordered byte stream; seq numbers count bytes; cumulative ACKs; RTO (doubling) and fast retransmit (3 dup ACKs); SACK.
- **Handshake:** SYN → SYN-ACK → ACK (exchange ISNs, MSS, window scale); 1 RTT. Refused = RST; timeout = silence. SYN cookies vs SYN flood.
- **Termination:** FIN/ACK each way (half-close); TIME_WAIT (2 × MSL) on the active closer; CLOSE_WAIT = app not closing; RST aborts.
- **Flow control:** rwnd from the receiver; sliding window; zero window → probes; window scaling.
- **Congestion control:** cwnd; slow start (double/RTT) → congestion avoidance (+1/RTT); 3 dup ACKs → halve; timeout → cwnd 1. Send ≤ min(rwnd, cwnd).

## Application, HTTP and HTTPS

- **Protocols:** HTTP/HTTPS, DNS, DHCP, SMTP (send), POP3/IMAP (read), SSH (secure shell, keys, tunnels), FTP (control 21 + data, clear text), Telnet (clear text), SNMP (161/162).
- **HTTP:** request line + headers + body; status line + headers + body; stateless.
- **Methods:** GET/HEAD/OPTIONS safe; PUT/DELETE idempotent; POST not; PATCH not guaranteed. REST maps resources and methods (Spring `@GetMapping` …).
- **Status:** 2xx success (200, 201 + Location, 204), 3xx (301/308 permanent, 302/307 temporary, 304 cached), 4xx client (400, 401, 403, 404, 405, 409, 429), 5xx server (500, 502, 503, 504).
- **Headers:** Content-Type, Authorization, Cache-Control, Cookie/Set-Cookie (HttpOnly, Secure, SameSite), Location, X-Forwarded-For.
- **Versions:** 1.1 keep-alive one-at-a-time; 2 binary multiplexed on TCP; 3 QUIC over UDP, independent streams.
- **Crypto:** symmetric (fast, data) + asymmetric (identity, key exchange); ECDHE → forward secrecy; encoding ≠ hashing ≠ encryption.
- **Certificates:** domain ↔ public key signed by a CA; chain to a trusted root; hostname, dates, revocation; server proves the private key.
- **TLS 1.3:** ClientHello (key share, SNI, ALPN) → ServerHello → Certificate → CertificateVerify → Finished → encrypted HTTP; 1 RTT.

## DNS, DHCP and NAT

- **DNS:** hierarchy root → TLD → authoritative; stub → recursive resolver (recursive query) → iterative referrals; caches at every level for TTL.
- **Records:** A, AAAA, CNAME (alias, not at apex), MX (priority), NS, TXT (SPF/DKIM/verification), SOA, PTR.
- **Failures:** NXDOMAIN (no name), SERVFAIL (DNS broken), timeout (resolver unreachable); "propagation" = caches expiring.
- **DHCP:** DORA (Discover/Request broadcast); IP, mask, gateway, DNS, lease; renew at 50 %, rebind at 87.5 %; relays across routers.
- **NAT:** static (1:1), dynamic (pool), PAT (many:1 by port); translation table; port forwarding for inbound; CGNAT; STUN/TURN/ICE for P2P; not a firewall.

## Security, Performance, Troubleshooting and Flows

- **Security:** CIA; authentication (401) vs authorization (403); defence in depth, least privilege, default deny, zero trust.
- **Firewalls:** ordered rules, first match, implicit deny; stateless vs stateful; drop → timeout, reject → refused; WAF at L7.
- **VPN:** encrypted tunnel; remote-access vs site-to-site; full vs split tunnel; MTU cost.
- **Attacks:** DoS/DDoS, sniffing, MITM, IP/ARP/DNS spoofing, phishing, port scanning — and their defences.
- **Backend performance:** latency = RTT × round trips; new HTTPS connection ≈ 3 RTT to first byte; reuse connections; batch/parallelise; timeouts everywhere.
- **Pooling:** keep-alive and pools; size deliberately; lifetimes below middlebox idle timeouts.
- **CDN and caching:** Cache-Control, ETag/304, edge PoPs, versioned assets, never share-cache personal data.
- **Load balancing:** L4 (connections, IP/port) vs L7 (requests, TLS termination, path routing); algorithms; health checks; stateless backends.
- **Troubleshooting:** define → layer by layer (link, IP config, gateway, Internet IP, DNS, port, TLS, app) → fix → verify.
- **Flows:** Wi-Fi → DHCP → ARP → DNS → TCP → TLS → HTTP → LB → app → DB; MACs change every link, TTL every router, IPs/ports only at NAT.
