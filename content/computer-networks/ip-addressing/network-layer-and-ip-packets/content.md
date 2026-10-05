# The Network Layer and IP Packets

**Module:** Network Layer and IP Addressing · **Interview priority:** Core

## What Is It?

The **network layer** moves packets from the source host to the destination host across any number of networks. Its protocol is **IP** (Internet Protocol). Each **IP packet** carries a header with the source and destination addresses and the information routers need to forward it.

IP's service model in four words: **connectionless, best-effort, unreliable, hop-by-hop**.

## Why It Exists

The Data Link layer reaches only the next device. The network layer adds global addressing and routing, so a packet from Chennai can reach a server in Frankfurt through dozens of independent networks — none of which need to know anything about the application.

## How It Works

### Two planes inside every router

| | Control plane | Data plane (forwarding) |
|---|---------------|--------------------------|
| Job | **Decide** the routes: build the routing table | **Move** each packet using that table |
| How | Routing protocols (OSPF, BGP) or static configuration | Look up the destination, pick the next hop, send |
| Speed | Seconds — runs when the network changes | Nanoseconds per packet, in hardware |
| Analogy | Drawing the road map | Driving using the map |

**Routing** usually means the control-plane work; **forwarding** is the per-packet action. See [Routing Fundamentals](../../routing/routing-fundamentals/content.md).

### The IPv4 header

```text
 0               8               16              24             31
┌───────┬───────┬───────────────┬───────────────────────────────┐
│Version│  IHL  │  DSCP / ECN   │         Total Length          │
├───────┴───────┴───────────────┼─────┬─────────────────────────┤
│        Identification         │Flags│     Fragment Offset     │
├───────────────┬───────────────┼─────┴─────────────────────────┤
│      TTL      │   Protocol    │        Header Checksum        │
├───────────────┴───────────────┴───────────────────────────────┤
│                       Source IP Address                       │
├───────────────────────────────────────────────────────────────┤
│                    Destination IP Address                     │
├───────────────────────────────────────────────────────────────┤
│                    Options (rare) + padding                    │
└───────────────────────────────────────────────────────────────┘
       20 bytes without options; then the payload (TCP segment, UDP datagram, ICMP message…)
```

| Field | Purpose |
|-------|---------|
| **Version** | 4 for IPv4 |
| **IHL** | Header length in 32-bit words (5 = 20 bytes) |
| **DSCP / ECN** | Priority class (QoS) and Explicit Congestion Notification |
| **Total Length** | Header + data, max 65,535 bytes |
| **Identification, Flags, Fragment Offset** | Reassembling fragments; the **DF** (Don't Fragment) flag |
| **TTL** (Time To Live) | Decremented by 1 at every router; at 0 the packet is dropped and an ICMP *Time Exceeded* is sent back — stops endless loops. Common start values: 64 (Linux, macOS), 128 (Windows), 255 |
| **Protocol** | What the payload is: 1 = ICMP, 6 = TCP, 17 = UDP |
| **Header Checksum** | Detects header corruption; recomputed at every hop because TTL changes |
| **Source / Destination IP** | Who sent it, who it is for — unchanged along the path (except NAT) |

### Best effort

IP makes **no promises**. A packet may be:

- **lost** (a router queue overflowed, a link failed),
- **duplicated**, **delayed**, or **reordered** (different paths, different queues),
- **corrupted** in its payload (IP checks only its own header).

There are no acknowledgements at the IP level. Higher layers decide: TCP recovers everything; UDP leaves it to the application. This simplicity is what lets routers be fast and stateless.

### Fragmentation and MTU

Each link has an **MTU** (Ethernet: 1,500 bytes). If an IPv4 packet is larger than the next link's MTU:

- With **DF = 0**, the router splits it into **fragments**, each with its own IP header, the same Identification, and an offset. Only the **destination** reassembles them.
- With **DF = 1**, the router drops it and returns ICMP *Fragmentation Needed* with the allowed MTU — the basis of **Path MTU Discovery**.

Fragmentation is avoided in practice: losing one fragment loses the whole packet, and firewalls and NAT struggle with fragments. TCP sizes its segments (MSS) to fit. **IPv6 routers never fragment**; only the sender can.

### ICMP: IP's companion

IP itself does not report problems; **ICMP** does — *destination unreachable*, *time exceeded*, *fragmentation needed*, and *echo request/reply* (`ping`). See [TTL and ICMP](../../routing/ttl-and-icmp/content.md).

### IPv4 vs IPv6 header (briefly)

IPv6 uses a simpler fixed 40-byte header: no header checksum (links and transports check errors), no fragmentation fields (moved to an optional extension header), **Hop Limit** instead of TTL, **Next Header** instead of Protocol, and a **Flow Label**. See [IPv6 Addressing](../ipv6-addressing/content.md).

## Real World

- `ping` shows `ttl=55`: the reply started at 64 and crossed 9 routers (as in the capture below), or started at 128/255 elsewhere.

```bash
ping -c 2 1.1.1.1
```

**Output (varies):**

```text
PING 1.1.1.1 (1.1.1.1) 56(84) bytes of data.
64 bytes from 1.1.1.1: icmp_seq=1 ttl=55 time=53.3 ms
64 bytes from 1.1.1.1: icmp_seq=2 ttl=55 time=44.0 ms
```

  `56(84)`: 56 bytes of ICMP data + 8 bytes ICMP header + 20 bytes IP header = 84.

- Kubernetes overlay networks and VPNs reduce the MTU; MTU problems show up as "small requests work, large ones hang".

## Common Traps

- **"IP is reliable."** It is best effort; TCP provides reliability.
- **"TTL is a time in seconds."** In practice it is a hop count.
- **"Routers reassemble fragments."** Only the destination host does.
- **"The IP checksum protects the data."** It covers only the header; TCP/UDP checksums cover their data.

## Interview Follow-up

- *"Why is TTL needed?"* To kill packets caught in routing loops; it also enables `traceroute`.
- *"Control plane vs data plane?"* Building routes vs forwarding packets.

## Key Takeaways

- IP: connectionless, best-effort, host-to-host delivery across networks.
- Key header fields: version, TTL, protocol, total length, fragmentation fields, checksum, source and destination IPs.
- TTL is decremented per hop; 0 → drop + ICMP Time Exceeded.
- Fragmentation exists in IPv4 but is avoided; IPv6 routers never fragment.
- Control plane builds the routing table; data plane forwards each packet.
