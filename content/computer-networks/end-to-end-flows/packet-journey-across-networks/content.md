# A Packet's Journey: Same LAN and Across Networks

**Module:** End-to-End Network Flows · **Interview priority:** Core

## What Is It?

A hop-by-hop trace of exactly what happens to the **headers** of one packet — on the same LAN, and across routers and NAT to a remote server. It ties together encapsulation, switching, ARP, routing, TTL and NAT in one picture.

## Why It Exists

Interviewers often ask "what does the switch/router do with the packet?" or "which addresses change?". Seeing the headers at every hop is the clearest way to answer — and to debug with packet captures.

## Case 1: Same LAN

PC A (`192.168.1.10`, MAC `AA`) sends a TCP segment to PC B (`192.168.1.20`, MAC `BB`) through one switch.

```text
 [A] ──── port 1 ──── [SWITCH] ──── port 2 ──── [B]
```

| Step | Device | Action | Frame |
|------|--------|--------|-------|
| 1 | A | `192.168.1.20` is in `192.168.1.0/24` → **local**; ARP cache miss → broadcast ARP "Who has .20?" | `dst ff:ff:ff:ff:ff:ff, src AA` |
| 2 | Switch | Learns `AA → port 1`; floods the broadcast | unchanged |
| 3 | B | Replies "192.168.1.20 is at BB" (unicast) | `dst AA, src BB` |
| 4 | Switch | Learns `BB → port 2`; forwards to port 1 only | unchanged |
| 5 | A | Sends the data frame | `dst BB, src AA` / IP `.10 → .20`, TTL 64 |
| 6 | Switch | Looks up `BB` → port 2; forwards (does **not** modify the frame) | unchanged |
| 7 | B | NIC accepts (dst MAC matches), checks FCS; IP checks dst IP; TCP delivers to the socket | — |

No router, no TTL change, no header rewrite. Layer 2 only.

## Case 2: Across Networks with NAT

Laptop L in a home network reaches web server S in a data centre.

```text
 [L]──Wi-Fi──[Home router R1 + NAT]══ISP══[R2]══…══[R3]──[DC switch]──[S]
 192.168.1.23     LAN 192.168.1.1              ISP routers       203.0.113.10
 MAC L            MAC R1-lan / WAN 198.51.100.7                  MAC S
```

### Link 1: laptop → home router

```text
Ethernet/Wi-Fi: src L        → dst R1-lan          (ARP gave R1's MAC — the default gateway)
IP:             src 192.168.1.23 → dst 203.0.113.10  TTL 64
TCP:            src 52100    → dst 443
```

The laptop decided "remote" with its subnet mask, so the **frame** goes to the router while the **packet** is addressed to the server.

### At the home router (R1)

1. NIC accepts the frame (dst = its MAC), checks FCS, strips Layer 2.
2. Routing lookup: `203.0.113.10` → default route → ISP next hop.
3. **TTL 64 → 63**; header checksum recomputed.
4. **NAT (PAT):** source `192.168.1.23:52100` → `198.51.100.7:40001`; entry stored in the translation table.
5. ARP (or the WAN link's own Layer 2) for the ISP next hop; new frame built.

### Link 2: home router → ISP router

```text
Layer 2:  src R1-wan → dst R2
IP:       src 198.51.100.7 → dst 203.0.113.10   TTL 63     ← source IP changed by NAT
TCP:      src 40001        → dst 443                        ← source port changed by NAT
```

### Through the Internet (R2 … R3)

Every router: strip frame → longest-prefix-match on `203.0.113.10` → TTL − 1 → new frame to the next hop. The IPs and ports no longer change (no more NAT). Paths between ISPs were chosen by BGP; inside each ISP by OSPF/IS-IS.

### Last link: data-centre router → server

```text
Layer 2:  src R3 → dst S            (R3 ARPs for 203.0.113.10 on the server's LAN)
IP:       src 198.51.100.7 → dst 203.0.113.10   TTL 64 − hops
TCP:      src 40001        → dst 443
```

The DC switch forwards the frame by MAC; the server accepts it, and TCP delivers it to the socket listening on 443.

### The reply

The server answers `203.0.113.10:443 → 198.51.100.7:40001`. It is routed back (possibly by a different path). At R1, NAT finds port 40001 in its table and rewrites the destination to `192.168.1.23:52100`, then delivers the frame to the laptop's MAC.

### What changed, where

| Field | Link 1 | After NAT (link 2 …) | Last link | Reply at laptop |
|-------|--------|----------------------|-----------|-----------------|
| Source MAC | Laptop | Each router's outgoing interface | R3 | R1-lan |
| Destination MAC | Home router | Next router | Server | Laptop |
| Source IP | 192.168.1.23 | 198.51.100.7 | 198.51.100.7 | 203.0.113.10 |
| Destination IP | 203.0.113.10 | 203.0.113.10 | 203.0.113.10 | 192.168.1.23 |
| Source port | 52100 | 40001 | 40001 | 443 |
| Destination port | 443 | 443 | 443 | 52100 |
| TTL | 64 | −1 per router | 64 − hops | (reply's own TTL) |

**Rule of thumb:** MACs change on **every** link; TTL changes at every **router**; IPs and ports change only at **NAT**.

## Under the Hood: Devices and Layers

| Device | Reads up to | Changes |
|--------|-------------|---------|
| Switch | Layer 2 (dst MAC) | Nothing (learns src MAC) |
| Router | Layer 3 | Layer 2 header, TTL, IP checksum |
| NAT router | Layer 4 | Plus source IP/port (outbound) or destination IP/port (inbound), checksums |
| L7 load balancer / proxy | Layer 7 | Terminates the connection; opens a new one to the backend |

## Real World

A packet capture on the laptop (Wireshark) shows the private source IP; a capture on the server shows the router's public IP — a common surprise when debugging "who is calling my server". Behind a load balancer, the backend sees the **load balancer's** IP instead, with the client IP in `X-Forwarded-For`.

## Common Traps

- **"Routers change the destination IP to the next router."** They change the destination **MAC**.
- **"The server sees my laptop's IP."** It sees the NAT's public IP.
- **"Switches decrement TTL."** Only routers (Layer 3 devices) do.

## Interview Follow-up

- *"Which headers does a router modify?"* Layer 2 (both MACs, FCS), TTL and IPv4 checksum — plus addresses/ports if it does NAT.
- *"How does the reply find the laptop behind NAT?"* The NAT translation table maps the public port back to the private IP:port.

## Key Takeaways

- Same LAN: ARP for the destination; switch forwards frames unchanged; no router, no TTL change.
- Remote: frame to the gateway's MAC; each router strips and rebuilds Layer 2 and decrements TTL; IPs stay the same.
- NAT rewrites source IP/port outbound and reverses it for replies.
- MACs change every link; TTL every router; IPs/ports only at NAT.
