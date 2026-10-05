# Layers, Protocols and Ports

The OSI ↔ TCP/IP mapping, the protocol cheat sheet and the port numbers to know.

## OSI ↔ TCP/IP Mapping

| OSI | TCP/IP (5) | TCP/IP (4) | PDU | Address | Devices | Protocols |
|-----|------------|------------|-----|---------|---------|-----------|
| 7 Application | Application | Application | Data | URL / hostname | L7 LB, proxy, WAF | HTTP, DNS, SMTP, SSH, FTP, DHCP |
| 6 Presentation | ↑ | ↑ | Data | — | — | TLS (encryption), JSON/UTF-8, gzip |
| 5 Session | ↑ | ↑ | Data | — | — | Sessions, TLS resumption |
| 4 Transport | Transport | Transport | Segment / datagram | Port | L4 LB, stateful firewall | TCP, UDP (QUIC on UDP) |
| 3 Network | Network | Internet | Packet | IP | Router, L3 switch | IPv4, IPv6, ICMP, OSPF, BGP |
| 2 Data Link | Data Link | Link | Frame | MAC | Switch, bridge, AP, NIC | Ethernet, Wi-Fi, ARP, VLAN 802.1Q, STP |
| 1 Physical | Physical | ↑ | Bits | — | Hub, repeater, modem, cables | Copper, fibre, radio |

Mnemonic (7 → 1): **All People Seem To Need Data Processing**.

## Protocol Cheat Sheet

| Protocol | Purpose | Layer | Transport · Port | Key fact |
|----------|---------|-------|------------------|----------|
| Ethernet | LAN frames | 2 | — | MAC addresses, FCS, MTU 1,500 |
| ARP | IPv4 → MAC | 2/3 | EtherType 0x0806 | Broadcast request, unicast reply |
| IP | Addressing, routing | 3 | — | Best effort, TTL |
| ICMP | Errors, ping, traceroute | 3 | IP protocol 1 | No ports |
| TCP | Reliable stream | 4 | IP protocol 6 | Handshake, seq/ACK, windows |
| UDP | Datagrams | 4 | IP protocol 17 | 8-byte header |
| DHCP | IP configuration | 7 | UDP 67 / 68 | DORA |
| DNS | Name → IP | 7 | UDP/TCP 53 | Hierarchy, TTL caching |
| HTTP | Web, APIs | 7 | TCP 80 | Stateless request/response |
| HTTPS | Secure HTTP | 7 | TCP 443 (HTTP/3: UDP 443) | TLS |
| TLS | Encryption + authentication | 6–7 | On TCP | Certificates, ECDHE |
| SSH | Secure shell, SFTP, tunnels | 7 | TCP 22 | Host keys, user keys |
| FTP | File transfer | 7 | TCP 21 (+20 data) | Clear text; use SFTP |
| Telnet | Remote terminal | 7 | TCP 23 | Clear text |
| SMTP | Send/relay mail | 7 | TCP 25 / 587 / 465 | MX records |
| POP3 | Download mail | 7 | TCP 110 / 995 | Download-and-delete |
| IMAP | Server-side mailbox | 7 | TCP 143 / 993 | Synced across devices |
| SNMP | Device monitoring | 7 | UDP 161 / 162 (traps) | v3 adds security |
| NTP | Time sync | 7 | UDP 123 | |
| OSPF | Interior routing | 3 | IP protocol 89 | Link state, Dijkstra |
| BGP | Inter-domain routing | 7 (control) | TCP 179 | Path vector, policy |
| RIP | Interior routing (legacy) | 7 (control) | UDP 520 | Hop count ≤ 15 |

## Port Numbers to Know

| Port | Service | | Port | Service |
|------|---------|---|------|---------|
| 20/21 | FTP data/control | | 443 | HTTPS |
| 22 | SSH / SFTP / SCP | | 465 / 587 | SMTP submission |
| 23 | Telnet | | 853 | DNS over TLS |
| 25 | SMTP | | 993 / 995 | IMAPS / POP3S |
| 53 | DNS | | 3306 | MySQL |
| 67/68 | DHCP server/client | | 3389 | RDP |
| 80 | HTTP | | 5432 | PostgreSQL |
| 110 | POP3 | | 6379 | Redis |
| 123 | NTP | | 8080 | Alternate HTTP / Spring Boot default |
| 143 | IMAP | | 9092 | Kafka |
| 161/162 | SNMP / traps | | 27017 | MongoDB |
| 179 | BGP | | 51820 | WireGuard |

Ranges: **0–1023** well-known · **1024–49151** registered · **49152–65535** dynamic/ephemeral (Linux default ephemeral 32768–60999).

## Header Sizes

| Header | Size |
|--------|------|
| Ethernet | 14 B + 4 B FCS (+4 B VLAN tag) |
| IPv4 | 20 B (no options), max 60 |
| IPv6 | 40 B fixed |
| TCP | 20 B (no options), max 60 |
| UDP | 8 B |
| Ethernet MTU / typical TCP MSS | 1,500 / 1,460 |

## Special Addresses

| Address | Meaning |
|---------|---------|
| 127.0.0.0/8, ::1 | Loopback |
| 169.254.0.0/16, fe80::/10 | Link-local (IPv4: DHCP failed) |
| 10/8, 172.16/12, 192.168/16, fd00::/8 | Private / ULA |
| 100.64.0.0/10 | CGNAT |
| 0.0.0.0, :: | Unspecified / all interfaces; /0 = default route |
| 255.255.255.255 | Limited broadcast |
| 224.0.0.0/4, ff00::/8 | Multicast |
| 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24, 2001:db8::/32 | Documentation |
