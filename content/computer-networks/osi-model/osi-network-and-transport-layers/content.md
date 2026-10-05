# OSI Layers 3 and 4: Network and Transport

**Module:** OSI Model · **Interview priority:** Core

## What Is It?

| | Layer 3 — Network | Layer 4 — Transport |
|---|-------------------|---------------------|
| Delivers | **Host to host**, across many networks | **Process to process** (application to application) |
| PDU | Packet | Segment (TCP) / datagram (UDP) |
| Addressing | **IP address** (logical, hierarchical) | **Port number** (16-bit) |
| Key functions | Logical addressing, routing, forwarding, fragmentation, TTL | Multiplexing by port, segmentation, reliability, ordering, flow control, congestion control (TCP) |
| Protocols | IPv4, IPv6, ICMP, routing protocols (OSPF, BGP) | TCP, UDP (also QUIC, built on UDP) |
| Devices | Router, Layer 3 switch | End hosts; inspected by stateful firewalls, NAT, L4 load balancers |
| Scope | Every router on the path | Only the two end hosts |

## Why It Exists

Layer 2 reaches only the next device. **Layer 3** is needed to cross many links and networks to reach a host anywhere in the world. But a host runs many applications at once, and IP is unreliable (packets may be lost or reordered), so **Layer 4** delivers data to the right application and, with TCP, makes delivery reliable and ordered.

```text
Layer 2: next device on this link       (MAC)
Layer 3: the right host anywhere        (IP)
Layer 4: the right application on it    (port)
```

## Layer 3 — Network

| Function | What it means |
|----------|---------------|
| **Logical addressing** | Every interface gets an IP address with a network part and a host part, so millions of hosts can be summarised as one route |
| **Routing** | Routers build routing tables (by configuration or protocols) — the *control plane* |
| **Forwarding** | For each packet, look up the destination and send it to the next hop — the *data plane* |
| **TTL / Hop Limit** | Decremented at each router; the packet is dropped at 0, preventing endless loops |
| **Fragmentation** | IPv4 routers may split packets larger than a link's MTU (IPv6 leaves this to the sender) |
| **Error reporting** | ICMP: destination unreachable, time exceeded (used by `ping` and `traceroute`) |

IP is **best effort** and **connectionless**: no guarantee of delivery, order or no duplication. Details: [The Network Layer and IP Packets](../../ip-addressing/network-layer-and-ip-packets/content.md), [Routing Fundamentals](../../routing/routing-fundamentals/content.md).

## Layer 4 — Transport

| Function | TCP | UDP |
|----------|-----|-----|
| Process addressing (ports) | Yes | Yes |
| Connection setup | Yes — [three-way handshake](../../transport-layer/tcp-three-way-handshake/content.md) | No |
| Reliability (ACKs, retransmission) | Yes | No |
| Ordering | Yes — sequence numbers | No |
| Flow control | Yes — receive window | No |
| Congestion control | Yes | No (the application may add its own) |
| Error detection | Checksum | Checksum |
| Header size | 20–60 bytes | 8 bytes |

**Segmentation:** TCP splits the application's byte stream into segments that fit in a packet (typically up to 1,460 bytes of data on Ethernet) and the receiver reassembles them in order.

**Multiplexing / demultiplexing:** many applications share one IP address; the destination port picks the receiving socket. A TCP connection is identified by the 4-tuple (source IP, source port, destination IP, destination port). See [Sockets and Connections](../../transport-layer/sockets-and-connections/content.md).

## How They Work Together

```text
Browser (port 52100) ─────────── TCP segment ──────────► Server process (port 443)
     │                                                        ▲
 IP packet 192.168.1.10 → 203.0.113.10, routed hop by hop ────┘
```

- Routers look at the IP header only. They neither know nor care about port 443.
- The receiving host's IP layer checks the destination IP is its own, then hands the payload to TCP or UDP (using the IP header's Protocol field: 6 = TCP, 17 = UDP), which hands it to the socket bound to port 443.

## Real World

- "Ping works but the API does not" → Layer 3 is fine; look at Layer 4 (port closed, firewall) and above.
- "Connection refused" is a Layer 4 answer: the host replied with a TCP RST because nothing listens on that port.
- A Spring Boot app binding `server.port=8080` claims a Layer 4 port; `server.address=127.0.0.1` restricts which Layer 3 address it accepts on.

## Common Traps

- **"IP guarantees delivery."** IP is best effort; TCP adds reliability.
- **"Routers use ports."** Plain routers forward by IP only. NAT devices and firewalls look at ports because they do more than routing.
- **"Segment" vs "packet":** a TCP segment travels *inside* an IP packet, which travels *inside* a frame.

## Interview Follow-up

- *"Host-to-host vs process-to-process?"* Network layer vs transport layer.
- *"Can two applications on one host use the same port?"* Not for the same protocol and local address (a second bind fails with "Address already in use").

## Key Takeaways

- Layer 3 = IP addresses, routing, TTL, best-effort host-to-host delivery; processed at every router.
- Layer 4 = ports, process-to-process delivery; TCP adds connections, reliability, order, flow and congestion control; UDP adds almost nothing.
- Frame ⊃ packet ⊃ segment ⊃ application data.
