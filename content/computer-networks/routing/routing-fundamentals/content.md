# Routing Fundamentals

**Module:** Routing · **Interview priority:** Core

## What Is It?

**Routing** is how packets find their way from one network to another. Each router keeps a **routing table**: a list of destination prefixes and, for each, where to send matching packets — the **next hop** and the outgoing **interface**. Every router makes an independent, **hop-by-hop** decision; no router knows the whole path.

```text
Destination        Next hop         Interface   Metric   Source
192.168.1.0/24     —  (connected)   eth0        0        directly connected
10.20.0.0/16       192.168.1.254    eth0        20       OSPF
0.0.0.0/0          203.0.113.1      wan0        1        static (default route)
```

## Why It Exists

A packet's destination may be dozens of networks away. Switches cannot help (they only know MACs on one LAN), and no device can know every host. Routers solve it with **prefixes** — one entry covers a whole network — and by each knowing just the **next step** towards it.

## How It Works

### Vocabulary

| Term | Meaning |
|------|---------|
| **Routing table** | Prefix → next hop / interface entries the router uses to decide |
| **Next hop** | The IP of the neighbouring router to hand the packet to (it must be on a directly connected network) |
| **Hop** | One router-to-router (or host-to-router) link a packet crosses |
| **Connected route** | A network the router has an interface in; added automatically |
| **Static route** | Configured by an administrator |
| **Dynamic route** | Learned from a routing protocol (RIP, OSPF, BGP) |
| **Default route** | `0.0.0.0/0` (IPv6 `::/0`): matches every destination — "if nothing more specific matches, send it here" |
| **Metric** | The cost of a route (hops, bandwidth-based cost…), used to choose between routes from the same protocol |
| **Administrative distance** | Trust ranking between route sources (connected < static < OSPF < RIP on Cisco) used when the same prefix is learned in several ways |

### The router forwarding process

For every packet:

1. Receive the frame; verify the FCS; check it is addressed to this router's MAC; strip Layer 2.
2. Check the IP header (checksum, version); **decrement TTL**. If TTL becomes 0 → drop and send ICMP *Time Exceeded*.
3. **Look up the destination IP** in the routing table using **longest prefix match** — the most specific matching route wins ([Longest Prefix Match](../longest-prefix-match/content.md)).
4. No match and no default route → drop and send ICMP *Destination Unreachable*.
5. Find the next hop's MAC (ARP cache / ARP request on the outgoing interface).
6. Build a new frame (src = router's outgoing MAC, dst = next hop's MAC), recompute the IP checksum, send.

### Routing vs forwarding

| | Routing | Forwarding |
|---|---------|------------|
| What | Building the routing table | Moving each packet using the table |
| Plane | Control plane | Data plane |
| When | When the network changes | For every packet |
| Done by | Routing protocols, admins | Router hardware/kernel |
| Analogy | Making the map | Driving with the map |

### Hosts route too

Your laptop has a routing table with usually two entries: the connected subnet and a default route to the gateway. That is how it decides local vs remote ([Local vs Remote Delivery](../../arp-and-local-delivery/local-vs-remote-delivery/content.md)).

```bash
ip route                 # Linux
ip route get 8.8.8.8     # which route would be used for this destination
```

```bash
# Windows (Command Prompt)
route print
```

### A packet across three routers

```text
PC 192.168.1.10 ──► R1 ──► R2 ──► R3 ──► Server 172.16.5.20

R1 table: 172.16.0.0/16 via R2       → forwards to R2
R2 table: 172.16.5.0/24 via R3       → forwards to R3
R3 table: 172.16.5.0/24 connected    → ARPs for 172.16.5.20, delivers
```

Each router knows only the next hop. The return path is routed independently and may differ (**asymmetric routing**).

## Real World

- In a cloud VPC, each subnet's **route table** decides whether `0.0.0.0/0` goes to an Internet gateway (public subnet) or a NAT gateway (private subnet). "My private instance can't download packages" is often a missing default route.
- Kubernetes nodes have routes to other nodes' pod CIDRs; a missing route makes pods on different nodes unable to talk.
- `traceroute` shows the hops a packet takes ([TTL and ICMP](../ttl-and-icmp/content.md)).

## Common Traps

- **"Routers know the full path."** Each knows only the next hop for each prefix.
- **"The default route is the gateway's IP."** The default route is the *entry* `0.0.0.0/0`; the gateway is its *next hop*.
- **"A route's next hop can be any router."** It must be reachable on a directly connected network.
- **"Paths are symmetric."** Forward and return paths are chosen independently.

## Interview Follow-up

- *"What does a router do if no route matches?"* Uses the default route; if none, drops the packet and returns ICMP Destination Unreachable.
- *"Routing vs switching?"* Routing: between networks by IP. Switching: within a network by MAC.

## Key Takeaways

- Routing table entries: prefix → next hop + interface (+ metric, source).
- Forwarding: TTL−1 → longest prefix match → ARP for next hop → new frame.
- Default route `0.0.0.0/0` catches everything else.
- Routing (control plane) builds the table; forwarding (data plane) uses it.
