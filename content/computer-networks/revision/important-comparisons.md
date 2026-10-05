# Important Comparisons

The distinctions interviewers ask most, each in a compact table.

## Addresses and Identifiers

| | MAC | IP | Port |
|---|-----|----|------|
| Layer | 2 | 3 | 4 |
| Size | 48 bits | 32 / 128 bits | 16 bits |
| Identifies | NIC on this link | Interface/host anywhere | Application on a host |
| Changes along the path | Every hop | Only at NAT | Only at NAT (PAT) |

| | Port | Socket | Connection |
|---|------|--------|------------|
| Is | A number | IP + port endpoint | Pair of sockets (4-tuple) |
| Example | 443 | 203.0.113.10:443 | 192.168.1.10:52100 ↔ 203.0.113.10:443 |

| | Public IP | Private IP |
|---|-----------|------------|
| Routable on Internet | Yes | No |
| Ranges | All others (assigned) | 10/8, 172.16/12, 192.168/16 |
| Reaches Internet | Directly | Via NAT |

| | Static IP | Dynamic IP |
|---|-----------|------------|
| Set by | Admin | DHCP lease |
| For | Servers, routers, printers | Clients |

## Devices

| | Hub | Switch | Router |
|---|-----|--------|--------|
| Layer | 1 | 2 | 3 |
| Forwards by | — (everywhere) | MAC | IP |
| Collision domains | 1 | Per port | Per port |
| Broadcast domains | 1 | 1 (per VLAN) | Per interface |

| | Modem | Router | Gateway |
|---|-------|--------|---------|
| Is | L1 signal converter | L3 packet forwarder | A role: exit to another network (may translate protocols) |

| | Routing | Switching |
|---|---------|-----------|
| Between / within | Between networks | Within a network |
| Uses | IP, routing table | MAC, MAC table |

| | L2 device | L3 device |
|---|-----------|-----------|
| Loop protection | STP | TTL |
| Table source | Learned source MACs | Configuration / routing protocols |

## Models

| | OSI | TCP/IP |
|---|-----|--------|
| Layers | 7 | 4 (RFC) / 5 |
| Nature | Reference model | Implemented suite |
| Upper layers | Session, Presentation, Application separate | One Application layer |

## Transport

| | TCP | UDP |
|---|-----|-----|
| Connection | Yes (3-way) | No |
| Reliability / order | Yes | No |
| Flow / congestion control | Yes | No |
| Unit | Byte stream (segments) | Datagrams (boundaries kept) |
| Header | 20–60 B | 8 B |
| Uses | HTTP, SSH, DBs | DNS, DHCP, VoIP, games, QUIC |

| | Flow control | Congestion control |
|---|--------------|--------------------|
| Protects | Receiver | Network |
| Window | rwnd (receiver advertises) | cwnd (sender computes) |
| Signal | Explicit | Loss, delay, ECN |

| | Connection refused | Connection timeout |
|---|--------------------|--------------------|
| On the wire | RST | Nothing |
| Speed | Immediate | After retries |
| Cause | Nothing listening / reject | Drop, wrong IP/route, host down |

## Application

| | HTTP | HTTPS |
|---|------|-------|
| Port | 80 | 443 |
| Encryption / integrity / server auth | No | Yes (TLS) |

| | HTTP/1.1 | HTTP/2 | HTTP/3 |
|---|----------|--------|--------|
| Transport | TCP | TCP | QUIC/UDP |
| Concurrency | One at a time | Multiplexed | Multiplexed, independent |
| HOL blocking | HTTP + TCP | TCP | None across streams |

| | PUT | PATCH | POST |
|---|-----|-------|------|
| Target | Resource URL | Resource URL | Collection |
| Body | Full replacement | Changes only | New data / command |
| Idempotent | Yes | Not guaranteed | No |

| | 401 | 403 |
|---|-----|-----|
| Means | Not authenticated | Authenticated, not allowed |

| | 502 | 503 | 504 |
|---|-----|-----|-----|
| From the proxy about the upstream | Invalid response / reset | No capacity / unhealthy | No response in time |

| | DNS | DHCP | ARP |
|---|-----|------|-----|
| Answers | Name → IP | My own IP configuration | IP → MAC (local) |
| Scope | Global | Local network | Local link |
| Transport | UDP/TCP 53 | UDP 67/68 (broadcast) | Ethernet frames |

| | Recursive query | Iterative query |
|---|-----------------|-----------------|
| From → to | Stub → resolver | Resolver → root/TLD/authoritative |
| Reply | Final answer | Answer or referral |

| | Symmetric | Asymmetric |
|---|-----------|------------|
| Keys | One shared | Public/private pair |
| Speed | Fast | Slow |
| TLS use | Encrypt data | Authenticate, key exchange |

## Security and Infrastructure

| | Authentication | Authorization |
|---|----------------|---------------|
| Question | Who are you? | What may you do? |
| HTTP failure | 401 | 403 |

| | Stateless firewall | Stateful firewall |
|---|--------------------|-------------------|
| Decides | Per packet | Per connection |
| Return traffic | Needs explicit rules | Allowed automatically |

| | L4 load balancer | L7 load balancer |
|---|------------------|------------------|
| Balances | Connections | Requests |
| Sees | IP, port | HTTP path, host, headers |
| TLS | Pass-through | Terminates |

| | Forward proxy | Reverse proxy |
|---|---------------|---------------|
| Acts for | Clients | Servers |

| | Static NAT | Dynamic NAT | PAT |
|---|------------|-------------|-----|
| Mapping | 1:1 fixed | 1:1 from pool | Many:1 by port |

| | Site-to-site VPN | Remote-access VPN |
|---|------------------|-------------------|
| Connects | Network ↔ network | Device ↔ network |
